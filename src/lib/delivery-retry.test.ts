// @vitest-environment node
import { it, expect, vi } from "vitest";
import { api, internal } from "../../convex/_generated/api";
import { seeded } from "./release-test-fixture";
it("captures a message once after transient failure, preserves attempt history and rejects concurrent duplicate dispatch", async () => {
 vi.useFakeTimers(); try {
  const { t, as, rows } = await seeded();
  const recipient = rows.users.find(u => u.firstName === "consultant-a")!;
  const messageId = await as("district-a").mutation(api.messages.send, { recipientUserId: recipient._id, content: "Retry test" });
  const job = (await t.run(ctx => ctx.db.query("deliveryOutbox").collect()))[0];
  const claims = await Promise.all([t.mutation(internal.delivery.claim, { outboxId: job._id, token: "one" }), t.mutation(internal.delivery.claim, { outboxId: job._id, token: "two" })]);
  expect(claims.filter(Boolean)).toHaveLength(1);
  const winner = claims[0] ? "one" : "two";
  await t.mutation(internal.delivery.finish, { outboxId: job._id, token: winner, outcome: "failed", error: "Synthetic transient provider failure" });
  await t.finishAllScheduledFunctions(vi.runAllTimers);
  expect((await t.run(ctx => ctx.db.get(job._id)))!.state).toBe("captured");
  const history = await t.run(ctx => ctx.db.query("deliveryAttempts").collect());
  expect(history.map(h => h.state)).toEqual(["sending", "failed", "sending", "captured"]);
  expect((await t.run(ctx => ctx.db.query("qaEmailCaptures").collect())).filter(c => c.sourceId === messageId)).toHaveLength(1);
  expect((await t.run(ctx => ctx.db.query("notifications").collect())).filter(n => n.userId === recipient._id && n.body === "Retry test")).toHaveLength(1);
 } finally { vi.useRealTimers(); }
});
it("fences a stale uncertain attempt and exhausts bounded recovery into failed instead of permanent sending", async () => {
 vi.useFakeTimers(); try {
  const { t, rows } = await seeded();
  const id = await t.run(ctx => ctx.db.insert("deliveryOutbox", { sourceId: rows.messages[0]._id, eventKey: "uncertainty", recipientUserId: rows.users[0]._id, title: "Test", body: "Test", actionUrl: "/dashboard/messages", state: "sending", attempts: 3, leaseToken: "stale", leaseUntil: Date.now()-1, createdAt: Date.now(), updatedAt: Date.now() }));
  expect(await t.mutation(internal.delivery.claim, { outboxId: id, token: "new" })).toBeNull();
  expect((await t.run(ctx => ctx.db.get(id)))!.state).toBe("failed");
  await t.mutation(internal.delivery.finish, { outboxId: id, token: "stale", outcome: "captured", payload: "{}" });
  expect((await t.run(ctx => ctx.db.query("qaEmailCaptures").collect())).filter(c => c.sourceId === rows.messages[0]._id)).toHaveLength(0);
 } finally { vi.useRealTimers(); }
});
it("freezes provider payload/recipient across retries and blocks uncertainty older than 23 hours", async () => {
 vi.useFakeTimers(); try {
  const { t, rows } = await seeded();
  const recipient = rows.users[0];
  const id = await t.run(ctx => ctx.db.insert("deliveryOutbox", { sourceId: rows.messages[0]._id, eventKey: "frozen", recipientUserId: recipient._id, title: "Frozen title", body: "Frozen body", actionUrl: "/dashboard/messages", state: "queued", attempts: 0, createdAt: Date.now(), updatedAt: Date.now() }));
  const first = await t.mutation(internal.delivery.claim, { outboxId: id, token: "first" });
  expect(first!.payload).toContain(recipient.email);
  await t.run(async ctx => { await ctx.db.patch(recipient._id, { email: "changed@example.com" }); await ctx.db.patch(id, { state: "failed", leaseUntil: undefined, leaseToken: undefined }); });
  const retry = await t.mutation(internal.delivery.claim, { outboxId: id, token: "retry" });
  expect(retry!.payload).toBe(first!.payload);
  await t.run(ctx => ctx.db.patch(id, { state: "sending", firstAttemptAt: Date.now() - 24 * 60 * 60_000, leaseUntil: 0 }));
  expect(await t.mutation(internal.delivery.claim, { outboxId: id, token: "too-late" })).toBeNull();
  const blocked = await t.run(ctx => ctx.db.get(id)); expect(blocked!.state).toBe("failed"); expect(blocked!.lastError).toContain("reconciliation");
  await t.finishAllScheduledFunctions(vi.runAllTimers);
 } finally { vi.useRealTimers(); }
});
