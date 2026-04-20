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

/** Educator creates a new service listing. */
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
    handler: async (ctx, args) => {
        const user = await requireEducatorViewer(ctx);
        const educator = await getEducatorForUser(ctx, user._id);
        if (!educator) throw new Error("No educator profile");

        return await ctx.db.insert("gigs", {
            educatorId: educator._id,
            title: args.title,
            description: args.description,
            areaOfNeed: args.areaOfNeed,
            subCategory: args.subCategory,
            engagementType: args.engagementType,
            gradeLevels: args.gradeLevels,
            coverageRegions: args.coverageRegions,
            deliverables: args.deliverables,
            pricingType: args.pricingType,
            price: args.price,
            estimatedDuration: args.estimatedDuration,
            isActive: true,
            createdAt: Date.now(),
        });
    },
});

/** Educator: their own listings. */
export const listMine = query({
    args: {},
    handler: async (ctx) => {
        const user = await requireEducatorViewer(ctx);
        const educator = await getEducatorForUser(ctx, user._id);
        if (!educator) return [];
        return await ctx.db
            .query("gigs")
            .withIndex("by_educator", (q) => q.eq("educatorId", educator._id))
            .order("desc")
            .collect();
    },
});

/** Public read: fetch a gig by id. Access control enforced at the Next.js API layer. */
export const getById = query({
    args: { gigId: v.id("gigs") },
    handler: async (ctx, args) => {
        const gig = await ctx.db.get(args.gigId);
        if (!gig || !gig.isActive) return null;
        const educator = await ctx.db.get(gig.educatorId);
        if (!educator) return null;
        const user = await ctx.db.get(educator.userId);
        return { gig, educator, user };
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
