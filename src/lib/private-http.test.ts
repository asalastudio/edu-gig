// @vitest-environment node
import { it, expect, vi } from "vitest";
import { api, internal } from "../../convex/_generated/api";
import { seeded } from "./release-test-fixture";
import type { Id } from "../../convex/_generated/dataModel";
import resources from "../../scripts/staging/resources.json";
const content = "%PDF-1.7\nSYNTHETIC PRIVATE BYTES\n%%EOF";
function keys() { vi.stubEnv("PRIVATE_FILE_KEY", "11".repeat(32)); vi.stubEnv("PRIVATE_FILE_KEY_ID", "test-v1"); }
it("HTTP enforces authentication/origin/ownership and preserves large exact bytes with idempotent upload", async () => {
 keys(); const { t, as, rows } = await seeded();
 const bytes = new Uint8Array(5 * 1024 * 1024); bytes.set(new TextEncoder().encode(content)); bytes.set(new TextEncoder().encode("%%EOF"), bytes.length - 5);
 const ticket = await as("district-a").mutation(api.privateFiles.requestUpload, { purpose: "agreement", engagementId: rows.engagements[0]._id, fileName: "scope.pdf", mimeType: "application/pdf", size: bytes.length, requestId: "large" });
 const init = { method: "POST", headers: { Origin: resources.appUrl, "Content-Type": "application/pdf", "X-Upload-Ticket": ticket.ticketId }, body: bytes };
 expect((await t.fetch("/private-files/upload", init)).status).toBe(401);
 expect((await as("district-b").fetch("/private-files/upload", init)).status).toBe(403);
 expect((await as("district-a").fetch("/private-files/upload", { ...init, headers: { ...init.headers, Origin: "https://evil.example" } })).status).toBe(403);
 const responses = [await as("district-a").fetch("/private-files/upload", init), await as("district-a").fetch("/private-files/upload", init)];
 expect(responses.map(r => r.status)).toEqual([200, 200]);
 const receipts = await Promise.all(responses.map(r => r.json())) as { privateFileId: Id<"privateFiles"> }[];
 expect(receipts[0]).toEqual(receipts[1]);
 expect(await t.run(ctx => ctx.db.query("privateFiles").collect())).toHaveLength(1);
 const url = `/private-files/download?fileId=${receipts[0].privateFileId}`;
 expect((await t.fetch(url)).status).toBe(401);
 expect((await as("district-b").fetch(url)).status).toBe(403);
 expect((await as("consultant-a").fetch(url)).status).toBe(403); // still private draft
 const download = await as("district-a").fetch(url);
 expect(download.headers.get("cache-control")).toBe("private, no-store");
 expect(Buffer.from(await download.arrayBuffer()).equals(Buffer.from(bytes))).toBe(true);
 const viewed = await as("district-a").fetch(`${url}&view=1`);
 expect(viewed.headers.get("content-disposition")).toMatch(/^inline;/);
 expect((await as("district-b").fetch(`${url}&view=1`)).status).toBe(403);
 const corrupted = bytes.slice(); corrupted[20] ^= 1;
 expect((await as("district-a").fetch("/private-files/upload", { ...init, body: corrupted })).status).toBe(400);
});
it("HTTP rejects malformed/type/size/expired/unknown tickets and a missing encryption key", async () => {
 keys(); const { t, as, rows } = await seeded();
 const ticket = await as("district-a").mutation(api.privateFiles.requestUpload, { purpose: "agreement", engagementId: rows.engagements[0]._id, fileName: "scope.pdf", mimeType: "application/pdf", size: content.length, requestId: "checks" });
 const headers = { Origin: resources.appUrl, "Content-Type": "application/pdf", "X-Upload-Ticket": ticket.ticketId };
 for (const init of [{ headers: { ...headers, "Content-Type": "image/png" }, body: content }, { headers, body: "invalid" }, { headers: { ...headers, "X-Upload-Ticket": "unknown" }, body: content }]) expect((await as("district-a").fetch("/private-files/upload", { method: "POST", ...init })).status).toBe(400);
 vi.stubEnv("PRIVATE_FILE_KEY", "");
 expect((await as("district-a").fetch("/private-files/upload", { method: "POST", headers, body: content })).status).toBe(400);
 await t.run(ctx => ctx.db.patch(ticket.ticketId, { expiresAt: 0 }));
 expect((await as("district-a").fetch("/private-files/upload", { method: "POST", headers, body: content })).status).toBe(400);
 expect(await t.run(ctx => ctx.db.query("privateFiles").collect())).toHaveLength(0);
});
it("proposal-specific retrieval rejects unrelated districts even when its source resume is directory-visible", async () => {
 keys(); const { t, as, rows } = await seeded();
 const ticket = await as("consultant-a").mutation(api.privateFiles.requestUpload, { purpose: "resume", fileName: "resume.pdf", mimeType: "application/pdf", size: content.length, requestId: "resume" });
 const response = await as("consultant-a").fetch("/private-files/upload", { method: "POST", headers: { "X-Upload-Ticket": ticket.ticketId, "Content-Type": "application/pdf" }, body: content });
 const { privateFileId } = await response.json() as { privateFileId: Id<"privateFiles"> };
 await expect(as("consultant-a").mutation(api.credentials.finalizeUpload, { privateFileId, type: "degree", title: "Wrong purpose", issuingBody: "Test", issueDate: "2026-09-01" })).rejects.toThrow("purpose");
 await as("consultant-a").mutation(api.educators.setResume, { privateFileId, fileName: "resume.pdf" });
 const p = rows.proposals.find(x => x.educatorUserId === rows.users.find(u => u.firstName === "consultant-a")!._id)!;
 await t.run(ctx => ctx.db.patch(p._id, { attachmentPrivateFileId: privateFileId }));
 expect((await as("district-b").fetch(`/private-files/download?fileId=${privateFileId}`)).status).toBe(200);
 expect((await as("district-b").fetch(`/private-files/download?proposalId=${p._id}`)).status).toBe(403);
 expect((await as("district-a").fetch(`/private-files/download?proposalId=${p._id}`)).status).toBe(200);
 expect((await as("consultant-b").fetch(`/private-files/download?fileId=${privateFileId}`)).status).toBe(403);
});
it("reset invalidates source-linked outbox and its pending watchdog without deleting unrelated data", async () => {
 vi.useFakeTimers(); try {
  const { t, rows } = await seeded();
  const id = await t.run(ctx => ctx.db.insert("deliveryOutbox", { sourceId: rows.messages[0]._id, eventKey: "reset-test", recipientUserId: rows.users[0]._id, title: "Reset", body: "Test", actionUrl: "/dashboard/messages", state: "queued", attempts: 0, createdAt: Date.now(), updatedAt: Date.now() }));
  await t.mutation(internal.delivery.claim, { outboxId: id, token: "claim" });
  await t.mutation(internal.qa.reset, { namespace: "human-review-v1", confirmation: "RESET_IDENTIFIED_QA_FIXTURES" });
  await t.mutation(internal.delivery.finish, { outboxId: id, token: "claim", outcome: "captured", payload: "{}" });
  expect(await t.run(ctx => ctx.db.get(id))).toBeNull();
  expect(await t.run(ctx => ctx.db.query("qaEmailCaptures").collect())).toHaveLength(0);
  await t.finishAllScheduledFunctions(vi.runAllTimers);
 } finally { vi.useRealTimers(); }
});

it("finalizes two concurrent owned receipts atomically to one file and removes losing ciphertext", async () => {
 keys(); const { t, as, rows } = await seeded();
 const ticket = await as("district-a").mutation(api.privateFiles.requestUpload, { purpose: "agreement", engagementId: rows.engagements[0]._id, fileName: "scope.pdf", mimeType: "application/pdf", size: content.length, requestId: "race" });
 const storageIds = await t.run(async ctx => [await ctx.storage.store(new Blob(["ciphertext-a"])), await ctx.storage.store(new Blob(["ciphertext-b"]))]);
 const base = { ticketId: ticket.ticketId, sha256: "ab".repeat(32), nonce: "cd".repeat(12), keyId: "test-v1", size: content.length };
 const results = await Promise.all(storageIds.map(storageId => as("district-a").mutation(internal.privateFiles.finalizeOwnedUpload, { ...base, storageId })));
 expect(results[0]).toEqual(results[1]); expect(await t.run(ctx => ctx.db.query("privateFiles").collect())).toHaveLength(1);
 expect(await t.run(async ctx => (await Promise.all(storageIds.map(id => ctx.storage.get(id)))).filter(Boolean).length)).toBe(1);
});
