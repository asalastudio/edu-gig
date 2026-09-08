import { v } from "convex/values";
import { authedMutation, authedQuery } from "./lib/customFunctions";
import { active, current, downloadPath, engagementAccess, receipt, sameParty, saveReceipt, type UserCtx } from "./lib/releaseDomain";
import { ownedFile } from "./privateFiles";
import { enqueue } from "./lib/outbox";
import type { Doc, Id } from "./_generated/dataModel";
export const createDraft = authedMutation({
 args: { engagementId: v.id("engagements"), title: v.string(), notes: v.optional(v.string()), privateFileId: v.id("privateFiles"), requestId: v.string() },
 handler: async (ctx, args): Promise<{ contractId: Id<"contracts">; versionId: Id<"agreementVersions">; revision: number }> => {
  const e = await engagementAccess(ctx, args.engagementId); const fp = JSON.stringify(["createDraft", args]); const prior = await receipt(ctx, args.requestId, fp); if (prior) return prior;
  active(e); if (!args.title.trim()) throw new Error("Title required");
  const file = await ownedFile(ctx, args.privateFileId, "agreement", e._id);
  if (await ctx.db.query("agreementVersions").withIndex("by_file", q => q.eq("privateFileId", file._id)).first()) throw new Error("File already attached");
  const now = Date.now();
  const contractId = await ctx.db.insert("contracts", { managed: true, revision: 1, engagementId: e._id, uploadedByUserId: ctx.user._id, title: args.title.trim(), notes: args.notes, status: "draft", createdAt: now, updatedAt: now });
  const versionId = await ctx.db.insert("agreementVersions", { contractId, privateFileId: file._id, number: 1, kind: "original", uploadedByUserId: ctx.user._id, fileName: file.fileName, createdAt: now });
  await ctx.db.insert("contractEvents", { contractId, versionId, privateOwnerId: ctx.user._id, actorUserId: ctx.user._id, action: "draft_saved", createdAt: now });
  const result = { contractId, versionId, revision: 1 }; await saveReceipt(ctx, args.requestId, fp, contractId, result); return result;
 },
});
/** Attach an original to an existing text-only identity without inventing a new agreement. */
export const attachFirstVersion = authedMutation({
 args: { contractId: v.id("contracts"), privateFileId: v.id("privateFiles"), expectedRevision: v.number(), requestId: v.string() },
 handler: async (ctx, args): Promise<{ contractId: Id<"contracts">; versionId: Id<"agreementVersions">; revision: number }> => {
  const c = await ctx.db.get(args.contractId); if (!c) throw new Error("Forbidden");
  const e = await engagementAccess(ctx, c.engagementId);
  if (!await sameParty(ctx, e, c.uploadedByUserId)) throw new Error("Only the owning party may attach the first version");
  const fp = JSON.stringify(["attachFirstVersion", args]); const prior = await receipt(ctx, args.requestId, fp); if (prior) return prior;
  active(e); current(c.revision, args.expectedRevision);
  if (await ctx.db.query("agreementVersions").withIndex("by_contract", q => q.eq("contractId", c._id)).first()) throw new Error("Agreement already has a first version");
  if (c.storageId || c.privateFileId) throw new Error("Existing content requires migration; cannot replace it with a first version");
  const file = await ownedFile(ctx, args.privateFileId, "agreement", e._id);
  if (await ctx.db.query("agreementVersions").withIndex("by_file", q => q.eq("privateFileId", file._id)).first()) throw new Error("File already attached");
  const versionId = await ctx.db.insert("agreementVersions", { contractId: c._id, privateFileId: file._id, number: 1, kind: "original", uploadedByUserId: ctx.user._id, fileName: file.fileName, createdAt: Date.now(), ...(!c.managed ? { legacyStatus: c.status } : {}) });
  const revision = args.expectedRevision + 1;
  await ctx.db.patch(c._id, { managed: true, revision, status: "draft", updatedAt: Date.now() });
  await ctx.db.insert("contractEvents", { contractId: c._id, versionId, privateOwnerId: ctx.user._id, actorUserId: ctx.user._id, action: "first_version_saved", createdAt: Date.now() });
  const result = { contractId: c._id, versionId, revision }; await saveReceipt(ctx, args.requestId, fp, c._id, result); return result;
 },
});

function coordinationForVersion(version: Doc<"agreementVersions">, events: Doc<"contractEvents">[]): "draft" | "shared" | "waiting" | "signed_externally" {
 if (version.sharedAt === undefined) return "draft";
 const recorded = events.filter(event => event.versionId === version._id && (event.action === "waiting" || event.action === "signed_externally")).at(-1);
 return recorded?.action === "signed_externally" ? "signed_externally" : recorded?.action === "waiting" ? "waiting" : "shared";
}
async function agreement(ctx: UserCtx, id: Id<"contracts">) {
 const c = await ctx.db.get(id); if (!c) throw new Error("Forbidden"); const e = await engagementAccess(ctx, c.engagementId);
 if (!c.managed) throw new Error("Legacy agreement requires migration"); return { c, e };
}
export const saveVersion = authedMutation({
 args: { contractId: v.id("contracts"), privateFileId: v.id("privateFiles"), kind: v.union(v.literal("revision"), v.literal("signed_copy")), parentVersionId: v.id("agreementVersions"), expectedRevision: v.number(), requestId: v.string() },
 handler: async (ctx, args): Promise<{ contractId: Id<"contracts">; versionId: Id<"agreementVersions">; revision: number }> => {
  const { c, e } = await agreement(ctx, args.contractId); const fp = JSON.stringify(["saveVersion", args]); const prior = await receipt(ctx, args.requestId, fp); if (prior) return prior;
  active(e); current(c.revision, args.expectedRevision);
  const parent = await ctx.db.get(args.parentVersionId);
  if (!parent || parent.contractId !== c._id) throw new Error("Invalid parent version");
  if (args.kind === "signed_copy") { if (parent.sharedAt === undefined) throw new Error("Signed copy requires shared parent"); }
  else if (!await sameParty(ctx, e, parent.uploadedByUserId)) throw new Error("Only uploading party may revise");
  const file = await ownedFile(ctx, args.privateFileId, "agreement", e._id);
  if (await ctx.db.query("agreementVersions").withIndex("by_file", q => q.eq("privateFileId", file._id)).first()) throw new Error("File already attached");
  const versions = await ctx.db.query("agreementVersions").withIndex("by_contract", q => q.eq("contractId", c._id)).collect();
  const partyVersions = []; for (const x of versions) if (await sameParty(ctx, e, x.uploadedByUserId)) partyVersions.push(x);
  const latestMine = partyVersions.sort((a,b) => b.number-a.number)[0];
  if (args.kind === "revision" && latestMine?._id !== parent._id) throw new Error("Stale parent version");
  const versionId = await ctx.db.insert("agreementVersions", { contractId: c._id, privateFileId: file._id, number: Math.max(...versions.map(x => x.number)) + 1, kind: args.kind, parentVersionId: parent._id, uploadedByUserId: ctx.user._id, fileName: file.fileName, createdAt: Date.now() });
  const revision = args.expectedRevision + 1; await ctx.db.patch(c._id, { revision, updatedAt: Date.now() });
  await ctx.db.insert("contractEvents", { contractId: c._id, versionId, privateOwnerId: ctx.user._id, actorUserId: ctx.user._id, action: `${args.kind}_saved`, createdAt: Date.now() });
  const result = { contractId: c._id, versionId, revision }; await saveReceipt(ctx, args.requestId, fp, c._id, result); return result;
 },
});
const transitionArgs = { contractId: v.id("contracts"), versionId: v.id("agreementVersions"), expectedRevision: v.number(), requestId: v.string() };
export const share = authedMutation({
 args: transitionArgs,
 handler: async (ctx, args): Promise<{ contractId: Id<"contracts">; versionId: Id<"agreementVersions">; revision: number }> => {
  const { c, e } = await agreement(ctx, args.contractId); const fp = JSON.stringify(["share", args]); const prior = await receipt(ctx, args.requestId, fp); if (prior) return prior;
  active(e); current(c.revision, args.expectedRevision);
  const version = await ctx.db.get(args.versionId);
  if (!version || version.contractId !== c._id || !await sameParty(ctx, e, version.uploadedByUserId)) throw new Error("Forbidden");
  const mine = await ctx.db.query("agreementVersions").withIndex("by_contract", q => q.eq("contractId", c._id)).collect();
  for (const x of mine) if (x.number > version.number && await sameParty(ctx, e, x.uploadedByUserId)) throw new Error("Stale draft version");
  if (version.sharedAt !== undefined) { const result = { contractId: c._id, versionId: version._id, revision: c.revision ?? 0 }; await saveReceipt(ctx, args.requestId, fp, c._id, result); return result; }
  const file = await ctx.db.get(version.privateFileId); if (!file) throw new Error("File unavailable");
  const revision = args.expectedRevision + 1;
  await ctx.db.patch(version._id, { sharedAt: Date.now(), sharedByUserId: ctx.user._id });
  await ctx.db.patch(c._id, { currentSharedVersionId: version._id, revision, status: "draft", updatedAt: Date.now() });
  await ctx.db.insert("contractEvents", { contractId: c._id, versionId: version._id, actorUserId: ctx.user._id, action: "version_shared", createdAt: Date.now() });
  await enqueue(ctx, { eventKey: `agreement-share:${version._id}`, sourceId: c._id, recipientUserId: ctx.user._id === e.educatorUserId ? e.buyerUserId : e.educatorUserId, title: "Agreement shared", body: `${c.title}: ${version.fileName} was shared with you. Signing and payment take place off-platform.`, actionUrl: `/dashboard/engagements/${e._id}?agreement=${c._id}&version=${version._id}`, type: "agreement_shared" });
  const result = { contractId: c._id, versionId: version._id, revision }; await saveReceipt(ctx, args.requestId, fp, c._id, result); return result;
 },
});
export const recordSigning = authedMutation({
 args: { ...transitionArgs, state: v.union(v.literal("waiting"), v.literal("signed_externally")), note: v.string(), acknowledged: v.boolean() },
 handler: async (ctx, args): Promise<{ revision: number }> => {
  const { c, e } = await agreement(ctx, args.contractId); const fp = JSON.stringify(["recordSigning", args]); const prior = await receipt(ctx, args.requestId, fp); if (prior) return prior;
  active(e); current(c.revision, args.expectedRevision);
  const version = await ctx.db.get(args.versionId);
  if (!version || version.contractId !== c._id || version.sharedAt === undefined || c.currentSharedVersionId !== version._id) throw new Error("Current shared version required");
  if (args.state === "waiting" && !await sameParty(ctx, e, version.uploadedByUserId)) throw new Error("Forbidden");
  if (!args.acknowledged || !args.note.trim()) throw new Error("Explicit acknowledgement and note required");
  const revision = args.expectedRevision + 1;
  await ctx.db.patch(c._id, { revision, status: args.state === "waiting" ? "sent" : "signed_externally", updatedAt: Date.now() });
  const eventId = await ctx.db.insert("contractEvents", { contractId: c._id, versionId: version._id, actorUserId: ctx.user._id, action: args.state, note: args.note.trim(), createdAt: Date.now() });
  await enqueue(ctx, { eventKey: `agreement-signing:${eventId}`, sourceId: c._id, recipientUserId: ctx.user._id === e.educatorUserId ? e.buyerUserId : e.educatorUserId, title: args.state === "waiting" ? "Waiting for external signing" : "External signing recorded", body: `${args.note.trim()} Work status is unchanged.`, actionUrl: `/dashboard/engagements/${e._id}?agreement=${c._id}&version=${version._id}`, type: "agreement_signing" });
  await saveReceipt(ctx, args.requestId, fp, c._id, { revision }); return { revision };
 },
});
export const listForEngagement = authedQuery({ args: { engagementId: v.id("engagements") }, handler: async (ctx, args) => {
 const e = await engagementAccess(ctx, args.engagementId);
 const contracts = await ctx.db.query("contracts").withIndex("by_engagement", q => q.eq("engagementId", e._id)).collect();
 const result = [];
 for (const c of contracts) {
  const all = await ctx.db.query("agreementVersions").withIndex("by_contract", q => q.eq("contractId", c._id)).collect();
  const allEvents = await ctx.db.query("contractEvents").withIndex("by_contract", q => q.eq("contractId", c._id)).collect();
  const versions = [];
  for (const x of all) {
   const mine = await sameParty(ctx, e, x.uploadedByUserId); if (!mine && x.sharedAt === undefined) continue;
   const uploader = await ctx.db.get(x.uploadedByUserId);
   versions.push({ versionId: x._id, privateFileId: x.privateFileId, number: x.number, kind: x.kind, parentVersionId: x.parentVersionId, fileName: x.fileName, uploadedByUserId: x.uploadedByUserId, uploaderName: uploader ? `${uploader.firstName} ${uploader.lastName}`.trim() : "Unknown", createdAt: x.createdAt, sharedAt: x.sharedAt, legacyStatus: x.legacyStatus, coordinationState: coordinationForVersion(x, allEvents), downloadUrl: downloadPath(x.privateFileId), isMine: mine });
  }
  if (c.managed && !versions.length && !await sameParty(ctx, e, c.uploadedByUserId)) continue;
  const events = [];
  for (const event of allEvents) {
   if (event.privateOwnerId && !await sameParty(ctx, e, event.privateOwnerId)) continue;
   const actor = await ctx.db.get(event.actorUserId); events.push({ eventId: event._id, action: event.action, note: event.note, versionId: event.versionId, createdAt: event.createdAt, actorName: actor ? `${actor.firstName} ${actor.lastName}`.trim() : "Unknown" });
  }
  const actionable = e.status === "active" || e.status === "in_progress";
  const shared = all.find(x => x._id === c.currentSharedVersionId);
  const currentVersionState = shared ? coordinationForVersion(shared, allEvents) : "none" as const;
  const status = !c.managed ? c.status : currentVersionState === "signed_externally" ? "signed_externally" as const : currentVersionState === "waiting" ? "sent" as const : "draft" as const;
  const attachFirstVersion = actionable && all.length === 0 && !c.storageId && !c.privateFileId && await sameParty(ctx, e, c.uploadedByUserId);
  result.push({ contractId: c._id, title: c.title, notes: c.notes, revision: c.revision ?? 0, status, currentVersionState, legacy: !c.managed, currentSharedVersionId: c.currentSharedVersionId, versions: versions.sort((a,b) => b.number-a.number), activity: events, allowedActions: { attachFirstVersion, upload: (actionable && !!c.managed) || attachFirstVersion, share: actionable && versions.some(x => x.isMine && x.sharedAt === undefined), signedCopy: actionable && versions.some(x => x.sharedAt !== undefined), recordSigning: actionable && !!c.currentSharedVersionId } });
 }
 return result;
} });
