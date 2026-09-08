import { v } from "convex/values";
import { authedMutation, authedQuery } from "./lib/customFunctions";
import { internalMutation } from "./_generated/server";
import { canManageNeedAsParty, getCurrentUser, isDistrictRole } from "./lib/auth";
import { active, downloadPath, engagementAccess, sameParty, type UserCtx } from "./lib/releaseDomain";
import { validateMetadata } from "./lib/privateCrypto";
import type { Id } from "./_generated/dataModel";
export const purpose = v.union(v.literal("agreement"), v.literal("resume"), v.literal("credential"), v.literal("proposal"));
export const requestUpload = authedMutation({
 args: { purpose, engagementId: v.optional(v.id("engagements")), needId: v.optional(v.id("needs")), fileName: v.string(), mimeType: v.string(), size: v.number(), requestId: v.string() },
 handler: async (ctx, args) => {
  validateMetadata(args);
  if (!args.requestId.trim() || args.requestId.length > 160) throw new Error("Invalid request ID");
  if (args.purpose === "agreement") {
   if (!args.engagementId || args.needId) throw new Error("Agreement requires engagement"); active(await engagementAccess(ctx, args.engagementId));
  } else {
   if (ctx.user.role !== "educator" || args.engagementId) throw new Error("Forbidden");
   if (args.purpose === "proposal") {
    const n = args.needId ? await ctx.db.get(args.needId) : null;
    if (!n || !["open", "interviewing"].includes(n.status)) throw new Error("Open need required");
   } else if (args.needId) throw new Error("Wrong purpose");
  }
  const fingerprint = JSON.stringify(args);
  const existing = await ctx.db.query("uploadTickets").withIndex("by_request", q => q.eq("ownerUserId", ctx.user._id).eq("requestId", args.requestId)).unique();
  if (existing && existing.fingerprint !== fingerprint) throw new Error("Request ID reused with different input");
  const ticketId = existing?._id ?? await ctx.db.insert("uploadTickets", { ...args, ownerUserId: ctx.user._id, fingerprint, expiresAt: Date.now() + 15 * 60_000 });
  return { ticketId, expiresAt: existing?.expiresAt ?? Date.now() + 15 * 60_000, uploadPath: "/private-files/upload" };
 },
});
export const uploadTicket = authedQuery({
 args: { ticketId: v.id("uploadTickets") },
 handler: async (ctx, { ticketId }) => {
  const ticket = await ctx.db.get(ticketId);
  if (!ticket || ticket.ownerUserId !== ctx.user._id) throw new Error("Forbidden");
  if (!ticket.privateFileId && ticket.expiresAt <= Date.now()) throw new Error("Upload ticket expired");
  if (ticket.engagementId) active(await engagementAccess(ctx, ticket.engagementId));
  return ticket;
 },
});
// Only the authenticated HTTP action can supply encrypted storage receipts.
export const finalizeOwnedUpload = internalMutation({
 args: { ticketId: v.id("uploadTickets"), storageId: v.id("_storage"), sha256: v.string(), nonce: v.string(), keyId: v.string(), size: v.number() },
 handler: async (ctx, args) => {
  const user = await getCurrentUser(ctx); const ticket = await ctx.db.get(args.ticketId);
  if (!ticket || ticket.ownerUserId !== user._id) throw new Error("Forbidden");
  if (ticket.privateFileId) {
   const prior = await ctx.db.get(ticket.privateFileId);
   if (!prior || prior.sha256 !== args.sha256 || prior.size !== args.size) throw new Error("Upload retry content mismatch");
   if (prior.storageId !== args.storageId) await ctx.storage.delete(args.storageId);
   return { privateFileId: prior._id };
  }
  if (ticket.expiresAt <= Date.now()) throw new Error("Upload ticket expired");
  if (ticket.size !== args.size || !/^[0-9a-f]{64}$/.test(args.sha256) || !/^[0-9a-f]{24}$/.test(args.nonce) || args.keyId !== process.env.PRIVATE_FILE_KEY_ID) throw new Error("Invalid encrypted receipt");
  if (ticket.engagementId) active(await engagementAccess({ ...ctx, user }, ticket.engagementId));
  const privateFileId = await ctx.db.insert("privateFiles", { ownerUserId: user._id, purpose: ticket.purpose, engagementId: ticket.engagementId, needId: ticket.needId, storageId: args.storageId, fileName: ticket.fileName, mimeType: ticket.mimeType, size: ticket.size, sha256: args.sha256, nonce: args.nonce, keyId: args.keyId, createdAt: Date.now() });
  await ctx.db.patch(ticket._id, { privateFileId });
  return { privateFileId };
 },
});
export async function ownedFile(ctx: UserCtx, id: Id<"privateFiles">, expected: "agreement" | "resume" | "credential" | "proposal", engagementId?: Id<"engagements">, needId?: Id<"needs">) {
 const file = await ctx.db.get(id);
 if (!file || file.ownerUserId !== ctx.user._id || file.purpose !== expected || file.engagementId !== engagementId || file.needId !== needId) throw new Error("Forbidden file ownership or purpose");
 return file;
}
export async function authorizedFile(ctx: UserCtx, id: Id<"privateFiles">) {
 const f = await ctx.db.get(id);
 if (!f) throw new Error("Forbidden");
 if (f.purpose === "agreement") {
  if (!f.engagementId) throw new Error("Forbidden");
  const e = await engagementAccess(ctx, f.engagementId);
  if (await sameParty(ctx, e, f.ownerUserId)) return f;
  const versions = await ctx.db.query("agreementVersions").withIndex("by_file", q => q.eq("privateFileId", id)).collect();
  if (versions.some(x => x.sharedAt !== undefined)) return f;
 } else if (f.ownerUserId === ctx.user._id) return f;
 else if (f.purpose === "resume") {
  const edu = await ctx.db.query("educators").withIndex("by_user_id", q => q.eq("userId", f.ownerUserId)).first();
  if (isDistrictRole(ctx.user.role) && edu?.resumePrivateFileId === f._id) return f;
 } else if (f.purpose === "credential") {
  const edu = await ctx.db.query("educators").withIndex("by_user_id", q => q.eq("userId", f.ownerUserId)).first();
  const creds = edu ? await ctx.db.query("credentials").withIndex("by_educator", q => q.eq("educatorId", edu._id)).collect() : [];
  if (isDistrictRole(ctx.user.role) && creds.some(c => c.privateFileId === f._id)) return f;
 }
 // A previously attached resume remains available to its proposal's managing district.
 const educator = await ctx.db.query("educators").withIndex("by_user_id", q => q.eq("userId", f.ownerUserId)).first();
 if (educator) for (const p of await ctx.db.query("proposals").withIndex("by_educator", q => q.eq("educatorId", educator._id)).collect()) {
  if (p.attachmentPrivateFileId !== f._id) continue;
  const n = await ctx.db.get(p.needId);
  if (n && await canManageNeedAsParty(ctx, ctx.user, n)) return f;
 }
 throw new Error("Forbidden");
}
export const metadata = authedQuery({ args: { privateFileId: v.id("privateFiles") }, handler: async (ctx, args) => {
 const f = await authorizedFile(ctx, args.privateFileId);
 return { privateFileId: f._id, fileName: f.fileName, mimeType: f.mimeType, size: f.size, sha256: f.sha256, downloadUrl: downloadPath(f._id) };
} });
// Authenticated query for HTTP only: ciphertext IDs and encryption metadata cannot decrypt a file without the server key.
export const downloadDescriptor = authedQuery({ args: { privateFileId: v.id("privateFiles") }, handler: async (ctx, args) => authorizedFile(ctx, args.privateFileId) });
export const proposalDownloadDescriptor = authedQuery({ args: { proposalId: v.id("proposals") }, handler: async (ctx, args) => {
 const p = await ctx.db.get(args.proposalId); const n = p ? await ctx.db.get(p.needId) : null;
 if (!p || !n || (p.educatorUserId !== ctx.user._id && !await canManageNeedAsParty(ctx, ctx.user, n))) throw new Error("Forbidden");
 const f = p.attachmentPrivateFileId ? await ctx.db.get(p.attachmentPrivateFileId) : null;
 if (!f) throw new Error("Private file unavailable; migration required"); return f;
} });
