// @vitest-environment node
import { it, expect, vi } from "vitest";
import { api } from "../../convex/_generated/api";
import { seeded } from "./release-test-fixture";
it("preserves matching-need and proposal alerts, recipients, capture and attached resume behavior", async () => {
 vi.useFakeTimers(); try {
  const { t, as, rows } = await seeded();
  const educatorUser = rows.users.find(u => u.firstName === "consultant-a")!;
  const needId = await as("district-a").mutation(api.needs.create, { orgName: "Synthetic District A", areaOfNeed: "school_improvement", subCategory: "micip", gradeLevel: "all", startDate: "2026-10-15", duration: "8 weeks", compensationRange: "$100/hour", description: "SYNTHETIC QA ONLY. School improvement planning, review, and implementation coaching over an eight week period." });
  const needJobs = await t.run(ctx => ctx.db.query("deliveryOutbox").withIndex("by_source", q => q.eq("sourceId", needId)).collect());
  expect(needJobs[0].actionUrl).toBe(`/dashboard/board/${needId}/propose`);
  expect(needJobs.some(j => j.recipientUserId === educatorUser._id && j.eventKey === `need:${needId}`)).toBe(true);
  // Opening the alert is a read/navigation operation only. It must not create
  // a proposal before the consultant explicitly submits the proposal form.
  const beforeOpeningAlert = await t.run(ctx => ctx.db.query("proposals").withIndex("by_need", q => q.eq("needId", needId)).collect());
  expect(beforeOpeningAlert).toHaveLength(0);
  const needAlert = (await as("consultant-a").query(api.notifications.listRecent, {})).find(
   note => note.actionUrl === `/dashboard/board/${needId}/propose`
  );
  expect(needAlert).toBeDefined();
  await as("consultant-a").mutation(api.notifications.markRead, { notificationId: needAlert!._id });
  expect(await t.run(ctx => ctx.db.query("proposals").withIndex("by_need", q => q.eq("needId", needId)).collect())).toHaveLength(0);
  const resume = await t.run(async ctx => {
   const id = await ctx.db.insert("privateFiles", { ownerUserId: educatorUser._id, purpose: "resume", storageId: await ctx.storage.store(new Blob(["encrypted"])), fileName: "resume.pdf", mimeType: "application/pdf", size: 9, sha256: "ab".repeat(32), nonce: "cd".repeat(12), keyId: "test", createdAt: Date.now() });
   const edu = await ctx.db.query("educators").withIndex("by_user_id", q => q.eq("userId", educatorUser._id)).first(); await ctx.db.patch(edu!._id, { resumePrivateFileId: id }); return id;
  });
  const proposalId = await as("consultant-a").mutation(api.proposals.submit, { needId, message: "Synthetic scope proposal", proposedRate: 100, proposedRateUnit: "hourly" });
  const proposal = await t.run(ctx => ctx.db.get(proposalId)); expect(proposal!.attachmentPrivateFileId).toBe(resume);
  const jobs = await t.run(ctx => ctx.db.query("deliveryOutbox").withIndex("by_source", q => q.eq("sourceId", proposalId)).collect());
  expect(jobs).toHaveLength(1); expect(jobs[0].recipientUserId).toBe(rows.users.find(u => u.firstName === "district-a")!._id);
  const listed = await as("district-a").query(api.proposals.listForNeed, { needId }); expect(listed).toHaveLength(1);
  await t.finishAllScheduledFunctions(vi.runAllTimers);
  const captures = await t.run(ctx => ctx.db.query("qaEmailCaptures").collect());
  expect(captures.some(c => c.sourceId === needId)).toBe(true); expect(captures.some(c => c.sourceId === proposalId)).toBe(true);
 } finally { vi.useRealTimers(); }
});
