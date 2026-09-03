import { query, mutation } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";

async function getUserByClerkId(ctx: QueryCtx | MutationCtx, clerkId: string) {
    return await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
        .first();
}

async function requireEducatorViewer(ctx: QueryCtx | MutationCtx) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await getUserByClerkId(ctx, identity.subject);
    if (!user || user.role !== "educator") throw new Error("Forbidden");
    return user;
}

async function getEducatorForUser(ctx: QueryCtx | MutationCtx, userId: string) {
    return await ctx.db
        .query("educators")
        .withIndex("by_user_id", (q) => q.eq("userId", userId as never))
        .first();
}

const pricingTypeValidator = v.union(
    v.literal("hourly"),
    v.literal("daily"),
    v.literal("fixed")
);

/** Educator creates a new service listing. Retired: districts post needs instead. */
export const create = mutation({
    args: {
        title: v.string(),
        description: v.string(),
        areaOfNeed: v.string(),
        subCategory: v.optional(v.string()),
        engagementType: v.string(),
        gradeLevels: v.array(v.string()),
        coverageRegions: v.array(v.string()),
        deliverables: v.array(v.string()),
        pricingType: pricingTypeValidator,
        price: v.number(),
        estimatedDuration: v.optional(v.string()),
    },
    returns: v.id("gigs"),
    handler: async () => {
        throw new Error("Consultant-created gig listings are retired. Districts post needs and consultants submit proposals.");
    },
});

/** Educator: their own listings. */
export const listMine = query({
    args: {},
    returns: v.array(v.object({
        _id: v.id("gigs"),
        title: v.string(),
        price: v.number(),
        pricingType: pricingTypeValidator,
        isActive: v.boolean(),
    })),
    handler: async (ctx) => {
        const user = await requireEducatorViewer(ctx);
        const educator = await getEducatorForUser(ctx, user._id);
        if (!educator) return [];
        const rows = await ctx.db
            .query("gigs")
            .withIndex("by_educator", (q) => q.eq("educatorId", educator._id))
            .order("desc")
            .take(100);
        return rows.map((row) => ({
            _id: row._id,
            title: row.title,
            price: row.price,
            pricingType: row.pricingType,
            isActive: row.isActive,
        }));
    },
});

/** Authenticated read: district viewers or the owning consultant. */
export const getById = query({
    args: { gigId: v.id("gigs") },
    returns: v.union(
        v.object({
            gig: v.object({
                _id: v.id("gigs"),
                title: v.string(),
                price: v.number(),
                pricingType: pricingTypeValidator,
                educatorId: v.id("educators"),
            }),
            educatorName: v.string(),
        }),
        v.null()
    ),
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;
        const viewer = await getUserByClerkId(ctx, identity.subject);
        if (!viewer) return null;

        const gig = await ctx.db.get(args.gigId);
        if (!gig || !gig.isActive) return null;
        const educator = await ctx.db.get(gig.educatorId);
        if (!educator) return null;
        const user = await ctx.db.get(educator.userId);
        if (!user) return null;
        const isOwner = educator.userId === viewer._id;
        const isDistrict = ["district_admin", "district_hr", "superintendent", "superadmin"].includes(viewer.role);
        if (!isOwner && !isDistrict) return null;
        return {
            gig: {
                _id: gig._id,
                title: gig.title,
                price: gig.price,
                pricingType: gig.pricingType,
                educatorId: gig.educatorId,
            },
            educatorName: `${user.firstName} ${user.lastName}`.trim() || user.email,
        };
    },
});

/**
 * Active bookable gigs for an educator profile. District (and superadmin)
 * viewers may load any educator's; the owning educator may load their own for
 * the self-preview. Any other educator is rejected.
 */
export const listActiveByEducatorForDistrict = query({
    args: { educatorId: v.id("educators") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");
        const viewer = await getUserByClerkId(ctx, identity.subject);
        if (!viewer) throw new Error("Unauthorized");
        const educator = await ctx.db.get(args.educatorId);
        if (!educator) return [];
        const isOwner = educator.userId === viewer._id;
        const isDistrict = ["district_admin", "district_hr", "superintendent", "superadmin"].includes(viewer.role);
        if (!isOwner && !isDistrict) throw new Error("Forbidden");
        const gigs = await ctx.db
            .query("gigs")
            .withIndex("by_educator", (q) => q.eq("educatorId", args.educatorId))
            .collect();
        return gigs
            .filter((gig) => gig.isActive)
            .sort((a, b) => b.createdAt - a.createdAt)
            .map((gig) => ({
                id: gig._id,
                title: gig.title,
                price: gig.price,
                pricingType: gig.pricingType,
                estimatedDuration: gig.estimatedDuration,
                engagementType: gig.engagementType,
            }));
    },
});

/** Deactivate one of my gigs. */
export const deactivate = mutation({
    args: { gigId: v.id("gigs") },
    handler: async (ctx, args) => {
        const user = await requireEducatorViewer(ctx);
        const gig = await ctx.db.get(args.gigId);
        if (!gig) throw new Error("Not found");
        const educator = await getEducatorForUser(ctx, user._id);
        if (!educator || gig.educatorId !== educator._id) throw new Error("Forbidden");
        await ctx.db.patch(args.gigId, { isActive: false });
        return args.gigId;
    },
});
