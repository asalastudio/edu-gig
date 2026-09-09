import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { internal } from "../_generated/api";
export async function sourceExists(ctx: Pick<QueryCtx, "db">, sourceId: string) {
 for (const table of ["messages", "proposals", "needs", "contracts", "engagements", "orders"] as const) {
  const id = ctx.db.normalizeId(table, sourceId); if (id) return !!await ctx.db.get(id);
 }
 return false;
}
export async function enqueue(ctx: MutationCtx, args: { eventKey: string; sourceId: string; recipientUserId: Id<"users">; title: string; body: string; actionUrl: string; type: string; emailEnabled?: boolean }) {
 const prior = await ctx.db.query("deliveryOutbox").withIndex("by_key", q => q.eq("eventKey", args.eventKey).eq("recipientUserId", args.recipientUserId)).unique();
 if (prior) return prior._id;
 const now = Date.now();
 const notificationId = await ctx.db.insert("notifications", { userId: args.recipientUserId, type: args.type, title: args.title, body: args.body, actionUrl: args.actionUrl, read: false, createdAt: now });
 const { type: _type, emailEnabled, ...event } = args; void _type;
 const id = await ctx.db.insert("deliveryOutbox", { ...event, notificationId, state: emailEnabled === false ? "suppressed" : "queued", attempts: 0, createdAt: now, updatedAt: now });
 if (emailEnabled !== false) await ctx.scheduler.runAfter(0, internal.delivery.dispatch, { outboxId: id });
 return id;
}
