// @vitest-environment node
import { it, expect, vi } from "vitest";
import { api } from "../../convex/_generated/api";
import { seeded } from "./release-test-fixture";
import { encryptFile } from "../../convex/lib/privateCrypto";
import type { Id } from "../../convex/_generated/dataModel";
async function setup() {
 vi.stubEnv("PRIVATE_FILE_KEY", "11".repeat(32)); vi.stubEnv("PRIVATE_FILE_KEY_ID", "test-v1");
 const fixture = await seeded(); const { t, rows } = fixture;
 const e = rows.engagements[0]; const owner = rows.users.find(u => u.firstName === "district-a")!;
 const bytes = new TextEncoder().encode("%PDF-1.7\nPRIVATE\n%%EOF");
 const encrypted = await encryptFile(bytes);
 const file = (purpose: "agreement" | "proposal" = "agreement", ownerUserId = owner._id) => t.run(async ctx => ctx.db.insert("privateFiles", { ownerUserId, purpose, ...(purpose === "agreement" ? { engagementId: e._id } : { needId: e.needId }), storageId: await ctx.storage.store(new Blob([encrypted.ciphertext])), fileName: "scope.pdf", mimeType: "application/pdf", size: bytes.length, sha256: encrypted.sha256, nonce: encrypted.nonce, keyId: encrypted.keyId, createdAt: Date.now() }));
 return { ...fixture, e, owner, file };
}
it("denies unrelated superadmin private agreement/proposal bytes and signing, retaining ordinary admin engagement visibility", async () => {
 vi.useFakeTimers(); try {
  const { t, as, e, file } = await setup(); const fileId = await file();
  const draft = await as("district-a").mutation(api.agreementVersions.createDraft, { engagementId: e._id, title: "Private", privateFileId: fileId, requestId: "create" });
  await as("district-a").mutation(api.agreementVersions.share, { contractId: draft.contractId, versionId: draft.versionId, expectedRevision: 1, requestId: "share" });
  await expect(as("review-admin").query(api.privateFiles.metadata, { privateFileId: fileId })).rejects.toThrow("Forbidden");
  expect((await as("district-a").fetch(`/private-files/download?fileId=${fileId}`)).status).toBe(200);
  expect((await as("review-admin").fetch(`/private-files/download?fileId=${fileId}`)).status).toBe(403);
  expect((await as("review-admin").fetch(`/private-files/download?fileId=${fileId}&view=1`)).status).toBe(403);
  await expect(as("review-admin").mutation(api.agreementVersions.recordSigning, { contractId: draft.contractId, versionId: draft.versionId, expectedRevision: 2, requestId: "unauthorized-sign", state: "signed_externally", acknowledged: true, note: "Not a party" })).rejects.toThrow("Forbidden");
  await expect(as("review-admin").mutation(api.privateFiles.requestUpload, { purpose: "agreement", engagementId: e._id, fileName: "scope.pdf", mimeType: "application/pdf", size: 30, requestId: "unauthorized-upload" })).rejects.toThrow("Forbidden");
  const proposalFile = await file("proposal", e.educatorUserId);
  await t.run(ctx => ctx.db.patch(e.proposalId, { attachmentPrivateFileId: proposalFile }));
  await expect(as("review-admin").query(api.privateFiles.proposalDownloadDescriptor, { proposalId: e.proposalId })).rejects.toThrow("Forbidden");
  await expect(as("review-admin").query(api.privateFiles.metadata, { privateFileId: proposalFile })).rejects.toThrow("Forbidden");
  expect((await as("review-admin").fetch(`/private-files/download?proposalId=${e.proposalId}`)).status).toBe(403);
  expect(await as("review-admin").query(api.engagements.getById, { engagementId: e._id })).not.toBeNull();
  expect(await as("district-teammate").query(api.privateFiles.metadata, { privateFileId: fileId })).not.toBeNull();
  await t.finishAllScheduledFunctions(vi.runAllTimers);
 } finally { vi.useRealTimers(); }
});
it("new shared revision is unsigned and original version retains its signing evidence", async () => {
 vi.useFakeTimers(); try {
  const { t, as, e, file } = await setup();
  const first = await as("district-a").mutation(api.agreementVersions.createDraft, { engagementId: e._id, title: "Version evidence", privateFileId: await file(), requestId: "create" });
  await as("district-a").mutation(api.agreementVersions.share, { contractId: first.contractId, versionId: first.versionId, expectedRevision: 1, requestId: "share" });
  await as("consultant-a").mutation(api.agreementVersions.recordSigning, { contractId: first.contractId, versionId: first.versionId, expectedRevision: 2, requestId: "sign-v1", state: "signed_externally", acknowledged: true, note: "Signed version one externally" });
  const next = await as("district-a").mutation(api.agreementVersions.saveVersion, { contractId: first.contractId, privateFileId: await file(), kind: "revision", parentVersionId: first.versionId, expectedRevision: 3, requestId: "revision" });
  await as("district-a").mutation(api.agreementVersions.share, { contractId: first.contractId, versionId: next.versionId, expectedRevision: 4, requestId: "share-v2" });
  const result = (await as("consultant-a").query(api.agreementVersions.listForEngagement, { engagementId: e._id })).find(c => c.contractId === first.contractId)!;
  expect(result.status).not.toBe("signed_externally"); expect(result.currentVersionState).toBe("shared");
  expect(result.versions.find(v => v.versionId === first.versionId)!.coordinationState).toBe("signed_externally");
  expect(result.versions.find(v => v.versionId === next.versionId)!.coordinationState).toBe("shared");
  expect(result.activity.filter(a => a.action === "signed_externally").map(a => a.versionId)).toEqual([first.versionId]);
  await t.finishAllScheduledFunctions(vi.runAllTimers);
 } finally { vi.useRealTimers(); }
});
it("attaches first file idempotently to managed and legacy text-only identities then shares those same identities", async () => {
 vi.useFakeTimers(); try {
  const { t, as, e, owner, file } = await setup();
  const managedId = await as("district-a").mutation(api.contracts.create, { engagementId: e._id, title: "Text-only" });
  const legacyId = await t.run(ctx => ctx.db.insert("contracts", { engagementId: e._id, uploadedByUserId: owner._id, title: "Legacy text-only", status: "completed", createdAt: Date.now(), updatedAt: Date.now() }));
  const available = await as("district-a").query(api.agreementVersions.listForEngagement, { engagementId: e._id });
  expect(available.filter(c => [managedId, legacyId].includes(c.contractId)).every(c => c.allowedActions.attachFirstVersion)).toBe(true);
  await expect(as("consultant-a").mutation(api.agreementVersions.attachFirstVersion, { contractId: managedId, privateFileId: await file("agreement", e.educatorUserId), expectedRevision: 0, requestId: "foreign-first" })).rejects.toThrow("owning party");
  for (const contractId of [managedId, legacyId]) {
   const args = { contractId, privateFileId: await file(), expectedRevision: 0, requestId: `attach:${contractId}` };
   const attached = await as("district-a").mutation(api.agreementVersions.attachFirstVersion, args);
   expect(attached.contractId).toBe(contractId); expect(await as("district-a").mutation(api.agreementVersions.attachFirstVersion, args)).toEqual(attached);
   await as("district-a").mutation(api.agreementVersions.share, { contractId, versionId: attached.versionId, expectedRevision: 1, requestId: `share:${contractId}` });
   expect((await as("consultant-a").query(api.agreementVersions.listForEngagement, { engagementId: e._id })).find(c => c.contractId === contractId)?.versions).toHaveLength(1);
   await expect(as("district-a").mutation(api.agreementVersions.attachFirstVersion, { ...args, privateFileId: await file(), expectedRevision: 2, requestId: `duplicate:${contractId}` })).rejects.toThrow("first version");
  }
  expect((await t.run(ctx => ctx.db.query("contracts").collect())).filter(c => [managedId, legacyId].includes(c._id))).toHaveLength(2);
  await t.finishAllScheduledFunctions(vi.runAllTimers);
 } finally { vi.useRealTimers(); }
});
it("keeps recipient failure history discoverable after 200 newer jobs for other recipients", async () => {
 const { t, as, rows } = await seeded(); const recipient = rows.users.find(u => u.firstName === "consultant-a")!;
 const mine = await t.run(async ctx => {
  const insert = (recipientUserId: Id<"users">, eventKey: string) => ctx.db.insert("deliveryOutbox", { recipientUserId, eventKey, sourceId: rows.messages[0]._id, title: "History", body: "History", actionUrl: "/dashboard/messages", state: "failed", attempts: 1, createdAt: Date.now(), updatedAt: Date.now() });
  const id = await insert(recipient._id, "mine");
  for (let i = 0; i < 201; i++) await insert(rows.users.find(u => u._id !== recipient._id)!._id, `other:${i}`);
  return id;
 });
 expect((await as("consultant-a").query(api.delivery.listMine, {})).map(j => j._id)).toContain(mine);
});
