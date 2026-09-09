// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { api } from "../../convex/_generated/api";
import { seeded } from "./release-test-fixture";

describe("release domain regression and security", () => {
 it("keeps working two-party conversation, unread count and message notification", async () => {
  vi.useFakeTimers(); try {
   const { t, as, rows } = await seeded();
   const recipient = rows.users.find(u => u.firstName === "consultant-a")!;
   const id = await as("district-a").mutation(api.messages.send, { recipientUserId: recipient._id, content: "Scope discussion" });
   const m = await t.run(ctx => ctx.db.get(id));
   const job = (await t.run(ctx => ctx.db.query("deliveryOutbox").collect()))[0];
   expect(job.actionUrl).toBe(`/dashboard/messages?to=${m!.senderId}`);
   expect(await as("consultant-a").query(api.messages.unreadCount, {})).toBeGreaterThan(0);
   expect((await as("consultant-a").query(api.messages.listConversation, { conversationId: m!.conversationId })).some(x => x._id === id)).toBe(true);
   expect((await t.run(ctx => ctx.db.query("notifications").collect())).some(n => n.userId === recipient._id && n.type === "message")).toBe(true);
   await t.finishAllScheduledFunctions(vi.runAllTimers);
  } finally { vi.useRealTimers(); }
 });
 it("rejects foreign engagement context without inserting message or notification", async () => {
  const { t, as, rows } = await seeded();
  const before = await t.run(ctx => ctx.db.query("messages").collect());
  await expect(as("district-b").mutation(api.messages.send, { recipientUserId: rows.users.find(u => u.firstName === "consultant-b")!._id, content: "bad", engagementId: rows.engagements[0]._id })).rejects.toThrow("Forbidden");
  expect(await t.run(ctx => ctx.db.query("messages").collect())).toEqual(before);
 });
 it("repeats acceptance with the original receipt and exactly one event", async () => {
  vi.useFakeTimers(); try {
   const { t, as, rows } = await seeded(); const p = rows.proposals.find(p => p.status === "pending")!;
   const first = await as("district-a").mutation(api.proposals.accept, { proposalId: p._id });
   expect(await as("district-a").mutation(api.proposals.accept, { proposalId: p._id })).toEqual(first);
   expect((await t.run(ctx => ctx.db.query("notifications").collect())).filter(n => n.type === "proposal_accepted")).toHaveLength(1);
   await t.finishAllScheduledFunctions(vi.runAllTimers);
  } finally { vi.useRealTimers(); }
 });
 it("rejects unowned raw storage attachment", async () => {
  const { as, rows, files } = await seeded();
  await expect(as("district-a").mutation(api.contracts.create, { engagementId: rows.engagements[0]._id, title: "probe", storageId: files[2].storageId })).rejects.toThrow();
 });
});

describe("private agreement lifecycle", () => {
 it("saves privately, shares exactly once, keeps the prior shared version visible and rejects stale edits", async () => {
  vi.useFakeTimers(); try {
   const { t, as, rows } = await seeded(); const engagementId = rows.engagements[0]._id;
   const owner = rows.users.find(u => u.firstName === "district-a")!;
   const fileId = await t.run(async ctx => ctx.db.insert("privateFiles", { ownerUserId: owner._id, purpose: "agreement", engagementId, storageId: await ctx.storage.store(new Blob(["encrypted"])), fileName: "scope.pdf", mimeType: "application/pdf", size: 9, sha256: "hash", nonce: "nonce", keyId: "test", createdAt: Date.now() }));
   const args = { engagementId, title: "Scope", privateFileId: fileId, requestId: "save-1" };
   const saved = await as("district-a").mutation(api.agreementVersions.createDraft, args);
   expect(await as("district-a").mutation(api.agreementVersions.createDraft, args)).toEqual(saved);
   expect((await as("consultant-a").query(api.agreementVersions.listForEngagement, { engagementId })).some(c => c.contractId === saved.contractId)).toBe(false);
   expect(await t.run(ctx => ctx.db.query("deliveryOutbox").collect())).toHaveLength(0);
   const share = { contractId: saved.contractId, versionId: saved.versionId, expectedRevision: 1, requestId: "share-1" };
   await as("district-a").mutation(api.agreementVersions.share, share);
   await as("district-a").mutation(api.agreementVersions.share, share);
   expect(await t.run(ctx => ctx.db.query("deliveryOutbox").collect())).toHaveLength(1);
   const visible = await as("consultant-a").query(api.agreementVersions.listForEngagement, { engagementId });
   expect(visible.find(c => c.contractId === saved.contractId)!.versions[0].versionId).toBe(saved.versionId);
   await expect(as("district-a").mutation(api.agreementVersions.share, { ...share, expectedRevision: 0, requestId: "stale" })).rejects.toThrow("Stale");
   await expect(as("district-b").query(api.privateFiles.metadata, { privateFileId: fileId })).rejects.toThrow("Forbidden");
   await t.finishAllScheduledFunctions(vi.runAllTimers);
  } finally { vi.useRealTimers(); }
 });
 it("binds tickets to owner and purpose and expires them before finalization", async () => {
  const { t, as, rows } = await seeded();
  const ticket = await as("district-a").mutation(api.privateFiles.requestUpload, { purpose: "agreement", engagementId: rows.engagements[0]._id, fileName: "scope.pdf", mimeType: "application/pdf", size: 80, requestId: "ticket-1" });
  await expect(as("district-b").query(api.privateFiles.uploadTicket, { ticketId: ticket.ticketId })).rejects.toThrow("Forbidden");
  await t.run(ctx => ctx.db.patch(ticket.ticketId, { expiresAt: 0 }));
  await expect(as("district-a").query(api.privateFiles.uploadTicket, { ticketId: ticket.ticketId })).rejects.toThrow("expired");
 });
});

describe("engagement correction lifecycle", () => {
 it("limits work transitions to district, requires cancellation reason, reopens explicitly and preserves historic proposals", async () => {
  vi.useFakeTimers(); try {
   const { t, as, rows } = await seeded(); const e = rows.engagements[0];
   await expect(as("consultant-a").mutation(api.engagements.transition, { engagementId: e._id, action: "start", expectedRevision: 0, requestId: "start" })).rejects.toThrow("Forbidden");
   await expect(as("consultant-a").mutation(api.engagements.transition, { engagementId: e._id, action: "cancel", expectedRevision: 0, requestId: "cancel" })).rejects.toThrow("reason");
   const cancel = { engagementId: e._id, action: "cancel" as const, expectedRevision: 0, requestId: "cancel-with-reason", reason: "Correction", acknowledged: true };
   const receipt = await as("consultant-a").mutation(api.engagements.transition, cancel);
   expect(await as("consultant-a").mutation(api.engagements.transition, cancel)).toEqual(receipt);
   expect((await t.run(ctx => ctx.db.get(e.needId)))!.status).toBe("placed");
   await as("district-a").mutation(api.engagements.transition, { engagementId: e._id, action: "reopen_need", expectedRevision: 1, requestId: "reopen", reason: "Find replacement", acknowledged: true });
   expect((await t.run(ctx => ctx.db.get(e.needId)))!.status).toBe("open");
   expect((await t.run(ctx => ctx.db.get(e.proposalId)))!.status).toBe("accepted");
   await as("district-a").mutation(api.engagements.transition, { engagementId: e._id, action: "archive", expectedRevision: 2, requestId: "archive" });
   expect((await as("district-a").query(api.engagements.listMine, {})).some(x => x._id === e._id)).toBe(false);
   expect(await as("consultant-a").query(api.engagements.getById, { engagementId: e._id })).not.toBeNull();
   await t.finishAllScheduledFunctions(vi.runAllTimers);
  } finally { vi.useRealTimers(); }
 });
});

it("keeps private revisions hidden while retaining shared originals; signed copies never assert signing or complete work", async () => {
 vi.useFakeTimers(); try {
  const { t, as, rows } = await seeded(); const e = rows.engagements[0];
  const owner = rows.users.find(u => u.firstName === "district-a")!; const consultant = rows.users.find(u => u.firstName === "consultant-a")!;
  const newFile = (userId: typeof owner._id) => t.run(async ctx => ctx.db.insert("privateFiles", { ownerUserId: userId, purpose: "agreement", engagementId: e._id, storageId: await ctx.storage.store(new Blob(["ciphertext"])), fileName: "same-name.pdf", mimeType: "application/pdf", size: 9, sha256: "ab".repeat(32), nonce: "cd".repeat(12), keyId: "test", createdAt: Date.now() }));
  const draft = await as("district-a").mutation(api.agreementVersions.createDraft, { engagementId: e._id, title: "Original", privateFileId: await newFile(owner._id), requestId: "original" });
  await as("district-teammate").mutation(api.agreementVersions.share, { contractId: draft.contractId, versionId: draft.versionId, expectedRevision: 1, requestId: "team-share" });
  const revision = await as("district-a").mutation(api.agreementVersions.saveVersion, { contractId: draft.contractId, privateFileId: await newFile(owner._id), parentVersionId: draft.versionId, kind: "revision", expectedRevision: 2, requestId: "revision" });
  const visible = (await as("consultant-a").query(api.agreementVersions.listForEngagement, { engagementId: e._id })).find(c => c.contractId === draft.contractId)!;
  expect(visible.currentSharedVersionId).toBe(draft.versionId); expect(visible.versions.map(x => x.versionId)).toEqual([draft.versionId]);
  expect(visible.activity.some(x => x.action === "revision_saved")).toBe(false);
  await expect(as("consultant-a").mutation(api.agreementVersions.share, { contractId: draft.contractId, versionId: revision.versionId, expectedRevision: 3, requestId: "foreign-share" })).rejects.toThrow("Forbidden");
  const copy = await as("consultant-a").mutation(api.agreementVersions.saveVersion, { contractId: draft.contractId, privateFileId: await newFile(consultant._id), parentVersionId: draft.versionId, kind: "signed_copy", expectedRevision: 3, requestId: "signed-copy" });
  expect((await t.run(ctx => ctx.db.get(e._id)))!.status).toBe(e.status);
  expect((await t.run(ctx => ctx.db.get(draft.contractId)))!.status).toBe("draft");
  expect(await t.run(ctx => ctx.db.get(draft.versionId))).not.toBeNull();
  expect((await t.run(ctx => ctx.db.query("deliveryOutbox").collect())).filter(x => x.sourceId === draft.contractId)).toHaveLength(1);
  await as("consultant-a").mutation(api.agreementVersions.share, { contractId: draft.contractId, versionId: copy.versionId, expectedRevision: 4, requestId: "copy-share" });
  await expect(as("district-a").mutation(api.agreementVersions.recordSigning, { contractId: draft.contractId, versionId: draft.versionId, expectedRevision: 5, requestId: "old-signing", state: "signed_externally", acknowledged: true, note: "Not current" })).rejects.toThrow("Current shared");
  await expect(as("district-a").mutation(api.agreementVersions.recordSigning, { contractId: draft.contractId, versionId: copy.versionId, expectedRevision: 5, requestId: "wait-foreign", state: "waiting", acknowledged: true, note: "Wait" })).rejects.toThrow("Forbidden");
  await as("district-a").mutation(api.agreementVersions.recordSigning, { contractId: draft.contractId, versionId: copy.versionId, expectedRevision: 5, requestId: "record", state: "signed_externally", acknowledged: true, note: "External agreement signed on September 8" });
  expect((await t.run(ctx => ctx.db.get(e._id)))!.status).toBe(e.status);
  await t.finishAllScheduledFunctions(vi.runAllTimers);
 } finally { vi.useRealTimers(); }
});
it("has one winner for concurrent competing acceptance and preserves withdrawal", async () => {
 vi.useFakeTimers(); try {
  const { t, as, rows } = await seeded(); const pending = rows.proposals.filter(x => x.status === "pending");
  const outcomes = await Promise.allSettled(pending.map(p => as("district-a").mutation(api.proposals.accept, { proposalId: p._id })));
  expect(outcomes.filter(x => x.status === "fulfilled")).toHaveLength(1);
  expect(await t.run(ctx => ctx.db.query("engagements").withIndex("by_need", q => q.eq("needId", pending[0].needId)).collect())).toHaveLength(1);
  const withdrawn = await t.run(async ctx => { const { _id, _creationTime, ...copy } = pending[0]; void _id; void _creationTime; return ctx.db.insert("proposals", { ...copy, status: "pending" }); });
  const ownerAlias = pending[0].educatorUserId === rows.users.find(u => u.firstName === "consultant-a")!._id ? "consultant-a" : "consultant-b";
  await as(ownerAlias).mutation(api.proposals.withdraw, { proposalId: withdrawn });
  await expect(as("district-a").mutation(api.proposals.accept, { proposalId: withdrawn })).rejects.toThrow("pending");
  await t.finishAllScheduledFunctions(vi.runAllTimers);
 } finally { vi.useRealTimers(); }
});
it("rejects the legacy need-status reopening bypass while an accepted engagement exists", async () => {
 const { as, rows } = await seeded();
 await expect(as("district-a").mutation(api.needs.updateStatus, { needId: rows.engagements[0].needId, status: "open" })).rejects.toThrow("explicit");
});
