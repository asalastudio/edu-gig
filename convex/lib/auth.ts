import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";

export const DISTRICT_ROLES = ["district_admin", "district_hr", "superintendent", "superadmin"] as const;
export type DistrictRole = (typeof DISTRICT_ROLES)[number];

export function isDistrictRole(role: string): role is DistrictRole {
    return (DISTRICT_ROLES as readonly string[]).includes(role);
}

export async function getUserByClerkId(ctx: QueryCtx | MutationCtx, clerkId: string) {
    return await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
        .first();
}

export async function getCurrentUser(ctx: QueryCtx | MutationCtx): Promise<Doc<"users">> {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const user = await getUserByClerkId(ctx, identity.subject);
    if (!user) throw new Error("User not found");
    return user;
}

export async function getCurrentUserOrNull(ctx: QueryCtx | MutationCtx): Promise<Doc<"users"> | null> {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return await getUserByClerkId(ctx, identity.subject);
}

export async function requireEducator(ctx: QueryCtx | MutationCtx): Promise<Doc<"users">> {
    const user = await getCurrentUser(ctx);
    if (user.role !== "educator") throw new Error("Forbidden");
    return user;
}

export async function requireDistrict(ctx: QueryCtx | MutationCtx): Promise<Doc<"users">> {
    const user = await getCurrentUser(ctx);
    if (!isDistrictRole(user.role)) throw new Error("Forbidden");
    return user;
}

export async function getEducatorForUser(ctx: QueryCtx | MutationCtx, userId: Doc<"users">["_id"]) {
    return await ctx.db
        .query("educators")
        .withIndex("by_user_id", (q) => q.eq("userId", userId))
        .first();
}

export async function findDistrictForUser(ctx: QueryCtx | MutationCtx, userId: Doc<"users">["_id"]) {
    const districts = await ctx.db.query("districts").collect();
    return districts.find((district) => district.adminIds.includes(userId)) ?? null;
}

export async function canManageNeed(
    ctx: QueryCtx | MutationCtx,
    user: Doc<"users">,
    need: Doc<"needs">
) {
    if (user.role === "superadmin" || need.postedByUserId === user._id) return true;
    if (!need.districtId) return false;
    const district = await ctx.db.get(need.districtId);
    return !!district?.adminIds.includes(user._id);
}

export function userCanAccessEngagement(
    user: Pick<Doc<"users">, "_id" | "role">,
    engagement: Pick<Doc<"engagements">, "educatorUserId" | "buyerUserId" | "districtId">,
    districtAdminIds: Doc<"users">["_id"][] | null
) {
    if (user.role === "superadmin") return true;
    if (engagement.educatorUserId === user._id || engagement.buyerUserId === user._id) return true;
    if (!engagement.districtId || !districtAdminIds) return false;
    return districtAdminIds.includes(user._id);
}

export async function canAccessEngagement(
    ctx: QueryCtx | MutationCtx,
    user: Doc<"users">,
    engagement: Doc<"engagements">
) {
    const district = engagement.districtId ? await ctx.db.get(engagement.districtId) : null;
    return userCanAccessEngagement(user, engagement, district?.adminIds ?? null);
}
