import { query, mutation } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";

const DISTRICT_ROLES = ["district_admin", "district_hr", "superintendent", "superadmin"] as const;
const PLATFORM_FEE_PCT = 0.18;

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

async function requireEducatorViewer(ctx: QueryCtx | MutationCtx) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await getUserByClerkId(ctx, identity.subject);
    if (!user || user.role !== "educator") throw new Error("Forbidden");
    return user;
}

const paymentMethodValidator = v.union(
    v.literal("card"),
    v.literal("ach"),
    v.literal("invoice")
);

/** District creates a pending order from a gig; payment confirmation patches this record later. */
export const createFromGig = mutation({
    args: {
        gigId: v.id("gigs"),
        startDate: v.string(),
        endDate: v.optional(v.string()),
        poNumber: v.optional(v.string()),
        paymentMethod: paymentMethodValidator,
    },
    handler: async (ctx, args) => {
        const user = await requireDistrictViewer(ctx);
        const gig = await ctx.db.get(args.gigId);
        if (!gig || !gig.isActive) throw new Error("Gig not available");

        const districts = await ctx.db.query("districts").collect();
        const district = districts.find((d) => d.adminIds.includes(user._id));
        if (!district) throw new Error("No district associated with this user");

        const totalAmount = gig.price;
        const platformFee = Math.round(totalAmount * PLATFORM_FEE_PCT * 100) / 100;
        const educatorPayout = Math.round((totalAmount - platformFee) * 100) / 100;

        return await ctx.db.insert("orders", {
            gigId: args.gigId,
            educatorId: gig.educatorId,
            districtId: district._id,
            buyerUserId: user._id,
            status: "pending",
            engagementType: gig.engagementType,
            startDate: args.startDate,
            endDate: args.endDate,
            totalAmount,
            platformFee,
            educatorPayout,
            poNumber: args.poNumber,
            paymentMethod: args.paymentMethod,
            createdAt: Date.now(),
        });
    },
});

export const listForDistrict = query({
    args: {},
    handler: async (ctx) => {
        const user = await requireDistrictViewer(ctx);
        const districts = await ctx.db.query("districts").collect();
        const district = districts.find((d) => d.adminIds.includes(user._id));
        if (!district) return [];
        return await ctx.db
            .query("orders")
            .withIndex("by_district", (q) => q.eq("districtId", district._id))
            .order("desc")
            .collect();
    },
});

export const listForEducator = query({
    args: {},
    handler: async (ctx) => {
        const user = await requireEducatorViewer(ctx);
        const educator = await ctx.db
            .query("educators")
            .withIndex("by_user_id", (q) => q.eq("userId", user._id))
            .first();
        if (!educator) return [];
        return await ctx.db
            .query("orders")
            .withIndex("by_educator", (q) => q.eq("educatorId", educator._id))
            .order("desc")
            .collect();
    },
});

export const getById = query({
    args: { orderId: v.id("orders") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;
        const user = await getUserByClerkId(ctx, identity.subject);
        if (!user) return null;

        const order = await ctx.db.get(args.orderId);
        if (!order) return null;

        // Visibility: buyer, educator on that order, or superadmin
        const educator = await ctx.db
            .query("educators")
            .withIndex("by_user_id", (q) => q.eq("userId", user._id))
            .first();

        const isBuyer = order.buyerUserId === user._id;
        const isEducator = educator && order.educatorId === educator._id;
        const isAdmin = user.role === "superadmin";
        if (!isBuyer && !isEducator && !isAdmin) throw new Error("Forbidden");

        return order;
    },
});

/** Educator accepts a pending order. */
export const accept = mutation({
    args: { orderId: v.id("orders") },
    handler: async (ctx, args) => {
        const user = await requireEducatorViewer(ctx);
        const order = await ctx.db.get(args.orderId);
        if (!order) throw new Error("Not found");
        const educator = await ctx.db
            .query("educators")
            .withIndex("by_user_id", (q) => q.eq("userId", user._id))
            .first();
        if (!educator || order.educatorId !== educator._id) throw new Error("Forbidden");
        if (order.status !== "pending") throw new Error(`Cannot accept from status '${order.status}'`);
        await ctx.db.patch(args.orderId, { status: "accepted" });
        return args.orderId;
    },
});

/** Either side marks the engagement complete. */
export const markCompleted = mutation({
    args: { orderId: v.id("orders") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");
        const user = await getUserByClerkId(ctx, identity.subject);
        if (!user) throw new Error("Unauthorized");

        const order = await ctx.db.get(args.orderId);
        if (!order) throw new Error("Not found");

        const educator = await ctx.db
            .query("educators")
            .withIndex("by_user_id", (q) => q.eq("userId", user._id))
            .first();
        const isBuyer = order.buyerUserId === user._id;
        const isEducator = educator && order.educatorId === educator._id;
        if (!isBuyer && !isEducator && user.role !== "superadmin") throw new Error("Forbidden");

        if (order.status !== "accepted" && order.status !== "in_progress") {
            throw new Error(`Cannot complete from status '${order.status}'`);
        }
        await ctx.db.patch(args.orderId, { status: "completed" });
        return args.orderId;
    },
});

/**
 * Internal-only: create an order from a verified Stripe webhook payload.
 * Guarded by a shared secret passed from the Next.js webhook route, so
 * this bypasses Clerk/Convex auth but still validates the caller.
 */
export const createFromWebhook = mutation({
    args: {
        webhookSecret: v.string(),
        gigId: v.id("gigs"),
        buyerClerkId: v.string(),
        startDate: v.string(),
        endDate: v.optional(v.string()),
        poNumber: v.optional(v.string()),
        paymentMethod: paymentMethodValidator,
        stripePaymentIntentId: v.string(),
        totalAmount: v.number(),
    },
    handler: async (ctx, args) => {
        const expected = process.env.CONVEX_WEBHOOK_SHARED_SECRET;
        if (!expected || args.webhookSecret !== expected) {
            throw new Error("Forbidden");
        }
        const gig = await ctx.db.get(args.gigId);
        if (!gig || !gig.isActive) throw new Error("Gig not available");

        const buyer = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.buyerClerkId))
            .first();
        if (!buyer) throw new Error("Buyer not found");

        const districts = await ctx.db.query("districts").collect();
        const district = districts.find((d) => d.adminIds.includes(buyer._id));
        if (!district) throw new Error("Buyer has no district");

        const platformFee = Math.round(args.totalAmount * PLATFORM_FEE_PCT * 100) / 100;
        const educatorPayout = Math.round((args.totalAmount - platformFee) * 100) / 100;

        return await ctx.db.insert("orders", {
            gigId: args.gigId,
            educatorId: gig.educatorId,
            districtId: district._id,
            buyerUserId: buyer._id,
            status: "accepted",
            engagementType: gig.engagementType,
            startDate: args.startDate,
            endDate: args.endDate,
            totalAmount: args.totalAmount,
            platformFee,
            educatorPayout,
            stripePaymentIntentId: args.stripePaymentIntentId,
            poNumber: args.poNumber,
            paymentMethod: args.paymentMethod,
            createdAt: Date.now(),
        });
    },
});
