import { query, mutation } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
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

async function findDistrictForUser(ctx: QueryCtx | MutationCtx, userId: Doc<"users">["_id"]) {
    const districts = await ctx.db.query("districts").collect();
    return districts.find((district) => district.adminIds.includes(userId)) ?? null;
}

async function canManageNeed(ctx: QueryCtx | MutationCtx, user: Doc<"users">, need: Doc<"needs">) {
    if (user.role === "superadmin" || need.postedByUserId === user._id) return true;
    if (!need.districtId) return false;
    const district = await ctx.db.get(need.districtId);
    return !!district?.adminIds.includes(user._id);
}

const needStatusValidator = v.union(
    v.literal("open"),
    v.literal("interviewing"),
    v.literal("placed"),
    v.literal("closed")
);

/** District posts a new open need. */
export const create = mutation({
    args: {
        orgName: v.string(),
        areaOfNeed: v.string(),
        subCategory: v.optional(v.string()),
        gradeLevel: v.optional(v.string()),
        engagementType: v.optional(v.string()),
        startDate: v.optional(v.string()),
        duration: v.optional(v.string()),
        compensationRange: v.optional(v.string()),
        description: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await requireDistrictViewer(ctx);

        // Link to the district this user administers even when the district has
        // multiple admins. Convex array equality only matched single-admin rows.
        const district = await findDistrictForUser(ctx, user._id);
        const districtId = district?._id;

        return await ctx.db.insert("needs", {
            districtId,
            postedByUserId: user._id,
            orgName: args.orgName,
            areaOfNeed: args.areaOfNeed,
            subCategory: args.subCategory,
            gradeLevel: args.gradeLevel,
            engagementType: args.engagementType,
            startDate: args.startDate,
            duration: args.duration,
            compensationRange: args.compensationRange,
            description: args.description,
            status: "open",
            createdAt: Date.now(),
        });
    },
});

/** District workspace: all needs posted by the current user (or their district). */
export const listMine = query({
    args: {},
    handler: async (ctx) => {
        const user = await requireDistrictViewer(ctx);
        const district = await findDistrictForUser(ctx, user._id);
        const byDistrict = district
            ? await ctx.db
                  .query("needs")
                  .withIndex("by_district", (q) => q.eq("districtId", district._id))
                  .order("desc")
                  .collect()
            : [];
        const byUser = await ctx.db
            .query("needs")
            .withIndex("by_posted_by", (q) => q.eq("postedByUserId", user._id))
            .order("desc")
            .collect();
        return Array.from(new Map([...byDistrict, ...byUser].map((need) => [need._id, need])).values()).sort(
            (a, b) => b.createdAt - a.createdAt
        );
    },
});

/** Lookup a single need (district only). */
export const getById = query({
    args: { needId: v.id("needs") },
    handler: async (ctx, args) => {
        const user = await requireDistrictViewer(ctx);
        const need = await ctx.db.get(args.needId);
        if (!need) return null;
        if (!(await canManageNeed(ctx, user, need))) throw new Error("Forbidden");
        return need;
    },
});

/**
 * Educator-facing browse: open + interviewing needs across all districts.
 * Ordered by createdAt desc so newest roles surface first.
 */
export const listOpenForEducators = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");
        const user = await getUserByClerkId(ctx, identity.subject);
        if (!user || user.role !== "educator") throw new Error("Forbidden");

        const needs = await ctx.db.query("needs").order("desc").collect();
        return needs.filter((n) => n.status === "open" || n.status === "interviewing");
    },
});

/** Move a need between statuses (e.g. open → interviewing → placed). */
export const updateStatus = mutation({
    args: {
        needId: v.id("needs"),
        status: needStatusValidator,
    },
    handler: async (ctx, args) => {
        const user = await requireDistrictViewer(ctx);
        const need = await ctx.db.get(args.needId);
        if (!need) throw new Error("Not found");
        if (!(await canManageNeed(ctx, user, need))) {
            throw new Error("Forbidden");
        }
        await ctx.db.patch(args.needId, { status: args.status });
        return args.needId;
    },
});
