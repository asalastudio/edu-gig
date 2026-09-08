// @vitest-environment node
import { it, expect, vi } from "vitest";
import { internal } from "../../convex/_generated/api";
import { seeded } from "./release-test-fixture";
import { decryptFile } from "../../convex/lib/privateCrypto";
it("preserves legacy identities/status/events and exact bytes with restartable verified checkpoints", async () => {
 vi.stubEnv("PRIVATE_FILE_KEY", "11".repeat(32)); vi.stubEnv("PRIVATE_FILE_KEY_ID", "test-v1");
 const { t, rows } = await seeded();
 const beforeEvents = await t.run(ctx => ctx.db.query("contractEvents").collect());
 const originalBytes = new TextEncoder().encode("%PDF-1.7\nSYNTHETIC ORIGINAL BYTES\n%%EOF");
 await t.run(async ctx => {
  for (const c of rows.contracts) { const storageId = await ctx.storage.store(new Blob([originalBytes], { type: "application/pdf" })); await ctx.db.patch(c._id, { storageId }); }
  for (const p of rows.proposals) if (p.attachmentStorageId) { const storageId = await ctx.storage.store(new Blob([originalBytes], { type: "application/pdf" })); await ctx.db.patch(p._id, { attachmentStorageId: storageId }); }
 });
 const dry = await t.action(internal.privateMigration.migrateLegacy, { dryRun: true });
 expect(dry.rows.every(r => r.state === "ready")).toBe(true);
 expect(await t.run(ctx => ctx.db.query("agreementVersions").collect())).toHaveLength(0);
 const applied = await t.action(internal.privateMigration.migrateLegacy, { dryRun: false, confirmation: "ENCRYPT_VERIFIED_STAGING_ORIGINALS", retireOriginals: true });
 expect(applied.rows.every(r => r.state === "encrypted_verified")).toBe(true);
 expect(await t.run(ctx => ctx.db.query("agreementVersions").collect())).toHaveLength(rows.contracts.length);
 expect(await t.run(ctx => ctx.db.query("contractEvents").collect())).toEqual(beforeEvents);
 const after = await t.run(ctx => ctx.db.query("contracts").collect());
 expect(after.map(c => c.status)).toEqual(rows.contracts.map(c => c.status));
 const checkpoints = await t.run(ctx => ctx.db.query("privateMigration").collect());
 for (const checkpoint of checkpoints) {
  const data = await t.run(async ctx => { const f = await ctx.db.get(checkpoint.privateFileId); return { f: f!, bytes: await (await ctx.storage.get(f!.storageId))!.arrayBuffer(), original: !!await ctx.storage.get(checkpoint.legacyStorageId) }; });
  expect(await decryptFile(new Uint8Array(data.bytes), data.f)).toEqual(originalBytes);
  expect(data.original).toBe(false);
 }
 const retry = await t.action(internal.privateMigration.migrateLegacy, { dryRun: false, confirmation: "ENCRYPT_VERIFIED_STAGING_ORIGINALS", retireOriginals: true });
 expect(retry.migrated).toBe(0); expect(retry.retired).toBe(0);
});
it("blocks missing/malformed originals, never deletes them during reads or failed migration", async () => {
 vi.stubEnv("PRIVATE_FILE_KEY", "");
 const { t, rows } = await seeded();
 const result = await t.action(internal.privateMigration.migrateLegacy, { dryRun: false, confirmation: "ENCRYPT_VERIFIED_STAGING_ORIGINALS", retireOriginals: true });
 expect(result.migrated).toBe(0); expect(result.rows.every(r => r.state === "blocked")).toBe(true);
 expect(await t.run(ctx => ctx.db.get(rows.contracts[0]._id))).toEqual(rows.contracts[0]);
 expect(await t.run(async ctx => !!await ctx.storage.get(rows.contracts[0].storageId!))).toBe(true);
});
it("normal qa.seed stores only encrypted fixtures and resets/reseeds without plaintext restoration", async () => {
 vi.stubEnv("PRIVATE_FILE_KEY", "11".repeat(32)); vi.stubEnv("PRIVATE_FILE_KEY_ID", "test-v1");
 const { accounts } = await import("./release-test-fixture"); const { t } = await seeded();
 await t.mutation(internal.qa.reset, { namespace: "human-review-v1", confirmation: "RESET_IDENTIFIED_QA_FIXTURES" });
 const bytes = new TextEncoder().encode("%PDF-1.7\nSYNTHETIC QA FILE\n%%EOF");
 const args = { namespace: "human-review-v1", accounts, files: Array.from({ length: 6 }, (_, i) => ({ name: `synthetic-${i}.pdf`, base64: Buffer.from(bytes).toString("base64") })) };
 expect((await t.action(internal.qa.seed, args)).seeded).toBe(true);
 const contracts = await t.run(ctx => ctx.db.query("contracts").collect());
 expect(contracts.every(c => c.managed && !c.storageId)).toBe(true);
 expect(await t.run(ctx => ctx.db.query("agreementVersions").collect())).toHaveLength(4);
 const files = await t.run(ctx => ctx.db.query("privateFiles").collect()); expect(files.length).toBeGreaterThan(4);
 for (const f of files) {
  const cipher = await t.run(async ctx => (await ctx.storage.get(f.storageId))!.arrayBuffer());
  expect(Buffer.from(cipher).equals(Buffer.from(bytes))).toBe(false);
  expect(await decryptFile(new Uint8Array(cipher), f)).toEqual(bytes);
 }
 expect((await t.action(internal.qa.seed, args)).seeded).toBe(false);
 await t.mutation(internal.qa.reset, { namespace: "human-review-v1", confirmation: "RESET_IDENTIFIED_QA_FIXTURES" });
 expect(await t.run(ctx => ctx.db.query("privateFiles").collect())).toHaveLength(0);
 expect((await t.action(internal.qa.seed, args)).seeded).toBe(true);
});
it("reports ambiguous credential references without inventing a file or blocking the whole dry run", async () => {
 const { t, rows } = await seeded();
 const p = rows.proposals[0];
 const id = await t.run(ctx => ctx.db.insert("credentials", { educatorId: p.educatorId, type: "degree", title: "Synthetic unresolved source", issuingBody: "Synthetic", issueDate: "2026-09-01", verified: false, documentUrl: "https://example.invalid/unknown" }));
 const report = await t.action(internal.privateMigration.migrateLegacy, { dryRun: true });
 expect(report.rows.find(r => r.sourceId === id)?.error).toContain("Ambiguous");
 expect(report.rows.length).toBeGreaterThan(1);
 expect((await t.run(ctx => ctx.db.get(id)))!.documentUrl).toBe("https://example.invalid/unknown");
});
