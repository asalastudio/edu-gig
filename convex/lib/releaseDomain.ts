import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import { canAccessEngagementAsParty } from "./auth";
export type UserCtx = (QueryCtx | MutationCtx) & { user: Doc<"users"> };
export async function engagementAccess(ctx: UserCtx, id: Id<"engagements">) {
 const e = await ctx.db.get(id);
 if (!e || !await canAccessEngagementAsParty(ctx, ctx.user, e)) throw new Error("Forbidden");
 return e;
}
export async function sameParty(ctx: UserCtx, e: Doc<"engagements">, owner: Id<"users">) {
 if (owner === ctx.user._id) return true;
 if (owner === e.educatorUserId || ctx.user._id === e.educatorUserId) return false;
 const district = e.districtId ? await ctx.db.get(e.districtId) : null;
 const members = new Set([e.buyerUserId, ...(district?.adminIds ?? [])]);
 return members.has(owner) && members.has(ctx.user._id);
}
export function active(e: Doc<"engagements">) {
 if (e.status !== "active" && e.status !== "in_progress") throw new Error("Engagement is not active");
}
export function current(actual: number | undefined, expected: number) {
 if ((actual ?? 0) !== expected) throw new Error("Stale revision; refresh and retry with a new request ID");
}
export async function receipt(ctx: UserCtx, requestId: string, fingerprint: string) {
 if (!requestId.trim() || requestId.length > 160) throw new Error("Invalid request ID");
 const row = await ctx.db.query("operationReceipts").withIndex("by_request", q => q.eq("actorUserId", ctx.user._id).eq("requestId", requestId)).unique();
 if (row && row.fingerprint !== fingerprint) throw new Error("Request ID reused with different input");
 return row ? JSON.parse(row.result) : null;
}
export async function saveReceipt(ctx: MutationCtx & { user: Doc<"users"> }, requestId: string, fingerprint: string, sourceId: string, result: unknown) {
 await ctx.db.insert("operationReceipts", { actorUserId: ctx.user._id, requestId, fingerprint, sourceId, result: JSON.stringify(result), createdAt: Date.now() });
 return result;
}
export function downloadPath(fileId: Id<"privateFiles">) { return `/api/private-files/${fileId}`; }
