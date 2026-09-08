import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { assertStagingEnvironment } from "./lib/staging";
import { canAccessEngagement } from "./lib/auth";
import { decryptFile, encryptFile, hashBytes, validateFile, PDF, DOCX } from "./lib/privateCrypto";
type Source = { sourceId: string; table: "contracts" | "proposals" | "educators" | "credentials"; storageId?: Id<"_storage">; legacyReference?: string; ownerUserId?: Id<"users">; purpose: "agreement" | "proposal" | "resume" | "credential"; engagementId?: Id<"engagements">; needId?: Id<"needs">; fileName?: string; snapshot: string; blocked?: string };
async function sources(ctx: Pick<QueryCtx, "db">): Promise<Source[]> {
 const result: Source[] = [];
 for (const table of ["contracts", "proposals", "educators", "credentials"] as const) {
  const rows = await ctx.db.query(table).take(500);
  if (rows.length === 500) throw new Error("Migration safety bound exceeded; explicit pagination required");
  for (const row of rows) {
   if (table === "contracts") {
    const c = row as Doc<"contracts">; if (!c.storageId) continue;
    const e = await ctx.db.get(c.engagementId); const owner = await ctx.db.get(c.uploadedByUserId);
    result.push({ sourceId: c._id, table, storageId: c.storageId, ownerUserId: c.uploadedByUserId, purpose: "agreement", engagementId: c.engagementId, fileName: c.fileName, snapshot: JSON.stringify(c), blocked: !e || !owner || !await canAccessEngagement(ctx as QueryCtx, owner, e) ? "Ownership/engagement unavailable" : undefined });
   } else if (table === "proposals") {
    const p = row as Doc<"proposals">; if (!p.attachmentStorageId) continue;
    const owner = await ctx.db.get(p.educatorUserId); const educator = await ctx.db.get(p.educatorId); const need = await ctx.db.get(p.needId);
    result.push({ sourceId: p._id, table, storageId: p.attachmentStorageId, ownerUserId: p.educatorUserId, purpose: "proposal", needId: p.needId, fileName: p.attachmentName, snapshot: JSON.stringify(p), blocked: !owner || educator?.userId !== owner._id || !need ? "Ownership/need unavailable" : undefined });
   } else if (table === "educators") {
    const e = row as Doc<"educators">; if (!e.resumeStorageId) continue;
    result.push({ sourceId: e._id, table, storageId: e.resumeStorageId, ownerUserId: e.userId, purpose: "resume", fileName: e.resumeFileName, snapshot: JSON.stringify(e), blocked: !await ctx.db.get(e.userId) ? "Owner unavailable" : undefined });
   } else {
    const c = row as Doc<"credentials">; if (!c.storageId && !c.documentUrl) continue;
    const storageId = c.storageId ?? ctx.db.system.normalizeId("_storage", c.documentUrl!);
    if (!storageId) {
     result.push({ sourceId: c._id, table, purpose: "credential", legacyReference: c.documentUrl, snapshot: JSON.stringify(c), blocked: "Ambiguous credential content reference; manual review required" });
     continue;
    }
    const e = await ctx.db.get(c.educatorId);
    result.push({ sourceId: c._id, table, storageId, ownerUserId: e?.userId, purpose: "credential", snapshot: JSON.stringify(c), blocked: !e || !await ctx.db.get(e.userId) ? "Owner unavailable" : undefined });
   }
  }
 }
 return result;
}
export const scan = internalQuery({ args: {}, handler: async ctx => { assertStagingEnvironment(); return { pending: await sources(ctx), checkpoints: await ctx.db.query("privateMigration").take(500) }; } });
export const attachVerified = internalMutation({
 args: { sourceId: v.string(), snapshot: v.string(), legacyStorageId: v.id("_storage"), encryptedStorageId: v.id("_storage"), sha256: v.string(), nonce: v.string(), keyId: v.string(), fileName: v.string(), mimeType: v.string(), size: v.number() },
 handler: async (ctx, args) => {
  assertStagingEnvironment();
  const prior = await ctx.db.query("privateMigration").withIndex("by_source", q => q.eq("sourceId", args.sourceId)).unique();
  if (prior) { if (prior.legacyStorageId !== args.legacyStorageId || prior.sha256 !== args.sha256) throw new Error("Migration checkpoint mismatch"); const file = await ctx.db.get(prior.privateFileId); if (file?.storageId !== args.encryptedStorageId) await ctx.storage.delete(args.encryptedStorageId); return prior.privateFileId; }
  const source = (await sources(ctx)).find(x => x.sourceId === args.sourceId);
  if (!source || source.blocked || !source.ownerUserId || source.storageId !== args.legacyStorageId || source.snapshot !== args.snapshot) throw new Error("Migration source changed or ownership ambiguous");
  const privateFileId = await ctx.db.insert("privateFiles", { ownerUserId: source.ownerUserId, purpose: source.purpose, engagementId: source.engagementId, needId: source.needId, storageId: args.encryptedStorageId, fileName: args.fileName, mimeType: args.mimeType, size: args.size, sha256: args.sha256, nonce: args.nonce, keyId: args.keyId, legacyStorageId: args.legacyStorageId, legacySourceId: source.sourceId, createdAt: Date.now() });
  let legacyVersionId: Id<"agreementVersions"> | undefined;
  if (source.table === "contracts") {
   const c = await ctx.db.get(source.sourceId as Id<"contracts">); if (!c) throw new Error("Source disappeared");
   const versionId = await ctx.db.insert("agreementVersions", { contractId: c._id, privateFileId, number: 1, kind: "original", uploadedByUserId: c.uploadedByUserId, fileName: args.fileName, createdAt: c.createdAt, legacyStatus: c.status, legacyStorageId: args.legacyStorageId, ...(c.status === "draft" ? {} : { sharedAt: c.createdAt, sharedByUserId: c.uploadedByUserId }) });
   legacyVersionId = versionId;
   await ctx.db.patch(c._id, { managed: true, revision: 1, currentSharedVersionId: c.status === "draft" ? undefined : versionId, storageId: undefined, privateFileId });
  } else if (source.table === "proposals") await ctx.db.patch(source.sourceId as Id<"proposals">, { attachmentStorageId: undefined, attachmentPrivateFileId: privateFileId });
  else if (source.table === "educators") await ctx.db.patch(source.sourceId as Id<"educators">, { resumeStorageId: undefined, resumePrivateFileId: privateFileId });
  else await ctx.db.patch(source.sourceId as Id<"credentials">, { storageId: undefined, documentUrl: undefined, privateFileId });
  const checkpointId = await ctx.db.insert("privateMigration", { sourceId: source.sourceId, legacyStorageId: args.legacyStorageId, privateFileId, sha256: args.sha256, verifiedAt: Date.now() });
  // Extend only the exact seed manifest owning the original source, so guarded reset
  // recognizes derived encrypted copies without treating later reviewer work as fixtures.
  const runs = await ctx.db.query("qaRuns").take(100);
  if (runs.length === 100) throw new Error("Fixture manifest safety bound exceeded");
  for (const run of runs) if (run.records.some(r => r.id === source.sourceId)) {
   await ctx.db.patch(run._id, { records: [...run.records, { table: "_storage", id: args.encryptedStorageId }, { table: "privateFiles", id: privateFileId }, ...(legacyVersionId ? [{ table: "agreementVersions", id: legacyVersionId }] : []), { table: "privateMigration", id: checkpointId }] });
  }
  return privateFileId;
 },
});
export const retireVerified = internalMutation({
 args: { checkpointId: v.id("privateMigration"), verifiedHash: v.string() },
 handler: async (ctx, args) => {
  assertStagingEnvironment(); const checkpoint = await ctx.db.get(args.checkpointId);
  if (!checkpoint || checkpoint.sha256 !== args.verifiedHash) throw new Error("Unverified checkpoint");
  if (checkpoint.retiredAt) return false;
  const file = await ctx.db.get(checkpoint.privateFileId);
  if (!file || file.sha256 !== checkpoint.sha256 || !await ctx.db.system.get(file.storageId)) throw new Error("Verified copy unavailable");
  if ((await sources(ctx)).some(s => s.storageId === checkpoint.legacyStorageId)) throw new Error("Original still referenced by unmigrated records");
  const users = await ctx.db.query("users").take(500); if (users.length === 500) throw new Error("Retirement safety scan bound exceeded");
  if (users.some(u => u.avatarStorageId === checkpoint.legacyStorageId)) throw new Error("Original referenced by avatar; manual review required");
  if (await ctx.db.system.get(checkpoint.legacyStorageId)) await ctx.storage.delete(checkpoint.legacyStorageId);
  for (const row of await ctx.db.query("privateMigration").collect()) if (row.legacyStorageId === checkpoint.legacyStorageId) await ctx.db.patch(row._id, { retiredAt: Date.now() });
  return true;
 },
});
export const fileForVerification = internalQuery({ args: { privateFileId: v.id("privateFiles") }, handler: async (ctx,args) => { assertStagingEnvironment(); return ctx.db.get(args.privateFileId); } });
export const migrateLegacy = internalAction({
 args: { dryRun: v.boolean(), confirmation: v.optional(v.literal("ENCRYPT_VERIFIED_STAGING_ORIGINALS")), retireOriginals: v.optional(v.boolean()) },
 handler: async (ctx, args): Promise<{ dryRun: boolean; migrated: number; retired: number; checkpoints: number; rows: Array<{ sourceId: string; legacyStorageId: string; state: string; sha256?: string; error?: string }> }> => {
  assertStagingEnvironment(); if (!args.dryRun && args.confirmation !== "ENCRYPT_VERIFIED_STAGING_ORIGINALS") throw new Error("Explicit migration confirmation required");
  const scan = await ctx.runQuery(internal.privateMigration.scan, {});
  const report = { dryRun: args.dryRun, migrated: 0, retired: 0, checkpoints: scan.checkpoints.length, rows: [] as Array<{ sourceId: string; legacyStorageId: string; state: string; sha256?: string; error?: string }> };
  for (const source of scan.pending) {
   let encryptedStorageId: Id<"_storage"> | undefined;
   try {
    if (source.blocked || !source.ownerUserId || !source.storageId) throw new Error(source.blocked ?? "Owner/content unavailable");
    const original = await ctx.storage.get(source.storageId); if (!original) throw new Error("Original content missing");
    const bytes = new Uint8Array(await original.arrayBuffer());
    const signature = Array.from(bytes.slice(0,8)).map(x => x.toString(16).padStart(2,"0")).join("");
    const mimeType = new TextDecoder().decode(bytes.slice(0,5)) === "%PDF-" ? PDF : signature.startsWith("504b0304") ? DOCX : signature === "d0cf11e0a1b11ae1" ? "application/msword" : signature === "89504e470d0a1a0a" ? "image/png" : signature.startsWith("ffd8ff") ? "image/jpeg" : "unknown";
    const ext = mimeType === PDF ? "pdf" : mimeType === DOCX ? "docx" : mimeType === "application/msword" ? "doc" : mimeType === "image/png" ? "png" : "jpg";
    const fileName = source.fileName ?? `legacy-${source.purpose}.${ext}`;
    validateFile(bytes, { fileName, mimeType, purpose: source.purpose, size: bytes.length });
    const sha256 = await hashBytes(bytes);
    if (!args.dryRun) {
     const encrypted = await encryptFile(bytes);
     encryptedStorageId = await ctx.storage.store(new Blob([encrypted.ciphertext], { type: "application/octet-stream" }));
     const stored = await ctx.storage.get(encryptedStorageId); if (!stored) throw new Error("Encrypted copy missing");
     const verified = await decryptFile(new Uint8Array(await stored.arrayBuffer()), encrypted);
     if (verified.length !== bytes.length || await hashBytes(verified) !== sha256) throw new Error("Byte verification failed");
     await ctx.runMutation(internal.privateMigration.attachVerified, { sourceId: source.sourceId, snapshot: source.snapshot, legacyStorageId: source.storageId, encryptedStorageId, sha256, nonce: encrypted.nonce, keyId: encrypted.keyId, fileName, mimeType, size: bytes.length });
     encryptedStorageId = undefined; report.migrated++;
    }
    report.rows.push({ sourceId: source.sourceId, legacyStorageId: source.storageId, state: args.dryRun ? "ready" : "encrypted_verified", sha256 });
   } catch (error) { if (encryptedStorageId) await ctx.storage.delete(encryptedStorageId); report.rows.push({ sourceId: source.sourceId, legacyStorageId: source.storageId ?? "unresolved", state: "blocked", error: error instanceof Error ? error.message : "Migration failed" }); }
  }
  if (!args.dryRun && args.retireOriginals) {
   const latest = await ctx.runQuery(internal.privateMigration.scan, {});
   for (const checkpoint of latest.checkpoints) {
    if (checkpoint.retiredAt) continue;
    try {
     const f = await ctx.runQuery(internal.privateMigration.fileForVerification, { privateFileId: checkpoint.privateFileId }); if (!f) throw new Error("Private file missing");
     const stored = await ctx.storage.get(f.storageId); if (!stored) throw new Error("Encrypted copy missing");
     const bytes = await decryptFile(new Uint8Array(await stored.arrayBuffer()), f);
     if (bytes.length !== f.size || await hashBytes(bytes) !== checkpoint.sha256) throw new Error("Verification failed");
     if (await ctx.runMutation(internal.privateMigration.retireVerified, { checkpointId: checkpoint._id, verifiedHash: checkpoint.sha256 })) report.retired++;
    } catch (error) { report.rows.push({ sourceId: checkpoint.sourceId, legacyStorageId: checkpoint.legacyStorageId, state: "retirement_blocked", error: error instanceof Error ? error.message : "Retirement failed" }); }
   }
  }
  return report;
 },
});
