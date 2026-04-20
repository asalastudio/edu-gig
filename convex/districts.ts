import { query, mutation } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";

const DISTRICT_ROLES = ["district_admin", "district_hr", "superintendent", "superadmin"] as const;

async function getUserByClerkId(ctx: QueryCtx | MutationCtx, clerkId: string) {
    return await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
        .first();
}

async function requireDistrictViewer(ctx: QueryCtx | MutationCtx) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await getUserByClerkId(ctx, identity.subject);
    if (!user || !DISTRICT_ROLES.includes(user.role as (typeof DISTRICT_ROLES)[number])) {
        throw new Error("Forbidden");
    }
    return user;
}

/** Current user's district (first match where they are listed as admin). */
export const getMine = query({
    args: {},
    handler: async (ctx) => {
        const user = await requireDistrictViewer(ctx);
        const districts = await ctx.db.query("districts").collect();
        return districts.find((d) => d.adminIds.includes(user._id)) ?? null;
    },
});

/** Update district metadata. */
export const update = mutation({
    args: {
        districtId: v.id("districts"),
        name: v.optional(v.string()),
        state: v.optional(v.string()),
        region: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await requireDistrictViewer(ctx);
        const district = await ctx.db.get(args.districtId);
        if (!district) throw new Error("Not found");
        if (!district.adminIds.includes(user._id) && user.role !== "superadmin") {
            throw new Error("Forbidden");
        }
        const patch: Record<string, unknown> = {};
        if (args.name !== undefined) patch.name = args.name;
        if (args.state !== undefined) patch.state = args.state;
        if (args.region !== undefined) patch.region = args.region;
        if (Object.keys(patch).length) await ctx.db.patch(args.districtId, patch);
        return args.districtId;
    },
});
