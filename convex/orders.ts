import { query, mutation } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { computePricing } from "./pricing";

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

        const { totalCharged, platformFee, educatorPayout } = computePricing(gig.price);

        const orderId = await ctx.db.insert("orders", {
            gigId: args.gigId,
            educatorId: gig.educatorId,
            districtId: district._id,
            buyerUserId: user._id,
            status: "pending",
            engagementType: gig.engagementType,
            startDate: args.startDate,
            endDate: args.endDate,
            totalAmount: totalCharged,
            platformFee,
            educatorPayout,
            poNumber: args.poNumber,
            paymentMethod: args.paymentMethod,
            createdAt: Date.now(),
        });

        try {
            await ctx.scheduler.runAfter(0, internal.emails.sendBookingConfirmation, { orderId });
        } catch (err) {
            console.warn("[orders.createFromGig] email schedule skipped:", err);
        }

        return orderId;
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

/** Buyer, educator, or superadmin cancels a non-completed order. */
export const cancel = mutation({
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

        if (order.status === "completed" || order.status === "cancelled") {
            throw new Error(`Cannot cancel from status '${order.status}'`);
        }

        await ctx.db.patch(args.orderId, { status: "cancelled" });

        const recipientId = isBuyer ? (await ctx.db.get(order.educatorId))?.userId : order.buyerUserId;
        if (recipientId) {
            await ctx.db.insert("notifications", {
                userId: recipientId,
                type: "order_cancelled",
                title: "Booking cancelled",
                body: "A K12Gig booking was cancelled. Review the order record for details.",
                read: false,
                actionUrl: isBuyer ? "/dashboard/educator" : "/dashboard/district",
                createdAt: Date.now(),
            });
        }

        return args.orderId;
    },
});

/** Either side flags an order for marketplace review. */
export const markDisputed = mutation({
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

        if (order.status === "cancelled") throw new Error("Cancelled orders cannot be disputed.");
        await ctx.db.patch(args.orderId, { status: "disputed" });
        return args.orderId;
    },
});

/**
 * Completed orders the viewer still owes a review on.
 * Works for both district (buyer) and educator (seller) viewers.
 */
export const listCompletedAwaitingReview = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];
        const user = await getUserByClerkId(ctx, identity.subject);
        if (!user) return [];

        const educator = await ctx.db
            .query("educators")
            .withIndex("by_user_id", (q) => q.eq("userId", user._id))
            .first();

        // Collect completed orders for this viewer from whichever side applies.
        const completedOrders: Doc<"orders">[] = [];
        if (educator) {
            const rows = await ctx.db
                .query("orders")
                .withIndex("by_educator", (q) => q.eq("educatorId", educator._id))
                .collect();
            for (const o of rows) if (o.status === "completed") completedOrders.push(o);
        }
        if (
            user.role === "district_admin" ||
            user.role === "district_hr" ||
            user.role === "superintendent" ||
            user.role === "superadmin"
        ) {
            const districts = await ctx.db.query("districts").collect();
            const district = districts.find((d) => d.adminIds.includes(user._id));
            if (district) {
                const rows = await ctx.db
                    .query("orders")
                    .withIndex("by_district", (q) => q.eq("districtId", district._id))
                    .collect();
                for (const o of rows) {
                    if (o.status === "completed" && o.buyerUserId === user._id) {
                        completedOrders.push(o);
                    }
                }
            }
        }

        const out: Array<{
            order: Doc<"orders">;
            counterpartName: string;
            role: "buyer" | "seller";
        }> = [];

        for (const order of completedOrders) {
            const isBuyer = order.buyerUserId === user._id;
            const role: "buyer" | "seller" = isBuyer ? "buyer" : "seller";
            const educatorDoc = await ctx.db.get(order.educatorId);
            if (!educatorDoc) continue;

            // revieweeId: who this viewer would be reviewing
            const revieweeId = isBuyer ? educatorDoc.userId : order.buyerUserId;

            // Skip if viewer has already submitted a review for this order.
            const existing = await ctx.db
                .query("reviews")
                .withIndex("by_reviewee", (q) => q.eq("revieweeId", revieweeId))
                .collect();
            const already = existing.some(
                (r) => r.orderId === order._id && r.reviewerRole === role
            );
            if (already) continue;

            let counterpartName = "Counterparty";
            if (isBuyer) {
                const counter = await ctx.db.get(educatorDoc.userId);
                if (counter) {
                    counterpartName = `${counter.firstName} ${counter.lastName}`.trim() || counterpartName;
                }
            } else {
                const counter = await ctx.db.get(order.buyerUserId);
                if (counter) {
                    counterpartName = `${counter.firstName} ${counter.lastName}`.trim() || counterpartName;
                }
            }

            out.push({ order, counterpartName, role });
        }

        return out;
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
        stripeEventId: v.string(),
        gigId: v.id("gigs"),
        buyerClerkId: v.string(),
        startDate: v.string(),
        endDate: v.optional(v.string()),
        poNumber: v.optional(v.string()),
        paymentMethod: paymentMethodValidator,
        stripePaymentIntentId: v.string(),
        gigPrice: v.number(),
        platformFee: v.number(),
        educatorPayout: v.number(),
        totalAmount: v.number(),
    },
    handler: async (ctx, args) => {
        const expected = process.env.CONVEX_WEBHOOK_SHARED_SECRET;
        if (!expected || args.webhookSecret !== expected) {
            throw new Error("Forbidden");
        }

        const existing = await ctx.db
            .query("stripeWebhookEvents")
            .withIndex("by_stripe_event_id", (q) => q.eq("stripeEventId", args.stripeEventId))
            .first();
        if (existing) return existing.orderId ?? null;

        const gig = await ctx.db.get(args.gigId);
        if (!gig || !gig.isActive) throw new Error("Gig not available");

        const expectedPricing = computePricing(gig.price);
        const matchesExpected = (actual: number, expectedAmount: number) =>
            Math.abs(actual - expectedAmount) <= 0.01;
        if (
            !matchesExpected(args.gigPrice, expectedPricing.gigPrice) ||
            !matchesExpected(args.platformFee, expectedPricing.platformFee) ||
            !matchesExpected(args.educatorPayout, expectedPricing.educatorPayout) ||
            !matchesExpected(args.totalAmount, expectedPricing.totalCharged)
        ) {
            throw new Error("Pricing tampered with");
        }

        const buyer = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.buyerClerkId))
            .first();
        if (!buyer) throw new Error("Buyer not found");

        const districts = await ctx.db.query("districts").collect();
        const district = districts.find((d) => d.adminIds.includes(buyer._id));
        if (!district) throw new Error("Buyer has no district");

        const orderId = await ctx.db.insert("orders", {
            gigId: args.gigId,
            educatorId: gig.educatorId,
            districtId: district._id,
            buyerUserId: buyer._id,
            status: "accepted",
            engagementType: gig.engagementType,
            startDate: args.startDate,
            endDate: args.endDate,
            totalAmount: args.totalAmount,
            platformFee: args.platformFee,
            educatorPayout: args.educatorPayout,
            stripePaymentIntentId: args.stripePaymentIntentId,
            poNumber: args.poNumber,
            paymentMethod: args.paymentMethod,
            createdAt: Date.now(),
        });

        await ctx.db.insert("stripeWebhookEvents", {
            stripeEventId: args.stripeEventId,
            eventType: "checkout.session.completed",
            orderId,
            processedAt: Date.now(),
        });

        try {
            await ctx.scheduler.runAfter(0, internal.emails.sendBookingConfirmation, { orderId });
        } catch (err) {
            console.warn("[orders.createFromWebhook] email schedule skipped:", err);
        }

        return orderId;
    },
});

/**
 * Internal-only: record non-checkout Stripe events that change order state.
 * Handles refunds and disputes idempotently by Stripe event id.
 */
export const recordStripePaymentEvent = mutation({
    args: {
        webhookSecret: v.string(),
        stripeEventId: v.string(),
        eventType: v.union(
            v.literal("payment_intent.refunded"),
            v.literal("charge.dispute.created")
        ),
        stripePaymentIntentId: v.string(),
    },
    handler: async (ctx, args) => {
        const expected = process.env.CONVEX_WEBHOOK_SHARED_SECRET;
        if (!expected || args.webhookSecret !== expected) {
            throw new Error("Forbidden");
        }

        const existing = await ctx.db
            .query("stripeWebhookEvents")
            .withIndex("by_stripe_event_id", (q) => q.eq("stripeEventId", args.stripeEventId))
            .first();
        if (existing) return existing.orderId ?? null;

        const orders = await ctx.db.query("orders").collect();
        const order = orders.find((row) => row.stripePaymentIntentId === args.stripePaymentIntentId);
        const orderId = order?._id;

        if (order) {
            await ctx.db.patch(order._id, {
                status: args.eventType === "charge.dispute.created" ? "disputed" : "cancelled",
            });

            await ctx.db.insert("notifications", {
                userId: order.buyerUserId,
                type: args.eventType === "charge.dispute.created" ? "payment_dispute" : "payment_refund",
                title: args.eventType === "charge.dispute.created" ? "Payment dispute opened" : "Payment refunded",
                body: "The payment status for a K12Gig booking changed in Stripe.",
                read: false,
                actionUrl: "/dashboard/district",
                createdAt: Date.now(),
            });

            const educator = await ctx.db.get(order.educatorId);
            if (educator) {
                await ctx.db.insert("notifications", {
                    userId: educator.userId,
                    type: args.eventType === "charge.dispute.created" ? "payment_dispute" : "payment_refund",
                    title: args.eventType === "charge.dispute.created" ? "Payment dispute opened" : "Payment refunded",
                    body: "The payment status for a K12Gig booking changed in Stripe.",
                    read: false,
                    actionUrl: "/dashboard/educator",
                    createdAt: Date.now(),
                });
            }
        }

        await ctx.db.insert("stripeWebhookEvents", {
            stripeEventId: args.stripeEventId,
            eventType: args.eventType,
            orderId,
            processedAt: Date.now(),
        });

        return orderId ?? null;
    },
});

/**
 * Joined data needed to render a Net-30 invoice PDF for an order.
 * Mirrors the access control of `getById`: buyer, educator on the order,
 * or superadmin. Returns `null` when the viewer lacks access or data is missing.
 */
export const getInvoiceContext = query({
    args: { orderId: v.id("orders") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;
        const user = await getUserByClerkId(ctx, identity.subject);
        if (!user) return null;

        const order = await ctx.db.get(args.orderId);
        if (!order) return null;

        const educatorDoc = await ctx.db
            .query("educators")
            .withIndex("by_user_id", (q) => q.eq("userId", user._id))
            .first();

        const isBuyer = order.buyerUserId === user._id;
        const isEducator = educatorDoc && order.educatorId === educatorDoc._id;
        const isAdmin = user.role === "superadmin";
        if (!isBuyer && !isEducator && !isAdmin) return null;

        const gig = await ctx.db.get(order.gigId);
        const orderEducator = await ctx.db.get(order.educatorId);
        const educatorUser = orderEducator ? await ctx.db.get(orderEducator.userId) : null;
        const buyer = await ctx.db.get(order.buyerUserId);
        const district = await ctx.db.get(order.districtId);
        if (!gig || !orderEducator || !educatorUser || !buyer || !district) return null;

        return {
            order,
            gig,
            buyer,
            educator: educatorUser,
            district,
        };
    },
});

export const cancelAndRefund = mutation({
    args: {
        orderId: v.id("orders"),
        refundAmount: v.optional(v.number()),
        reason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await requireDistrictViewer(ctx);
        const order = await ctx.db.get(args.orderId);
        if (!order) throw new Error("Not found");

        const districts = await ctx.db.query("districts").collect();
        const district = districts.find((d) => d.adminIds.includes(user._id));
        if (!district || order.districtId !== district._id) throw new Error("Forbidden");
        if (!order.stripePaymentIntentId) throw new Error("Order is not Stripe-backed");
        if (order.status === "cancelled") throw new Error("Order already cancelled");

        const boundedAmount =
            typeof args.refundAmount === "number"
                ? Math.max(0, Math.min(args.refundAmount, order.totalAmount))
                : order.totalAmount;

        await ctx.db.patch(args.orderId, {
            status: "cancelled",
        });

        try {
            await ctx.scheduler.runAfter(0, internal.emails.sendRefundIssued, {
                orderId: args.orderId,
                refundAmount: boundedAmount,
                reason: args.reason,
            });
        } catch (err) {
            console.warn("[orders.cancelAndRefund] refund email schedule skipped:", err);
        }

        return {
            orderId: args.orderId,
            stripePaymentIntentId: order.stripePaymentIntentId,
            refundAmount: boundedAmount,
            fullRefund: Math.abs(boundedAmount - order.totalAmount) <= 0.01,
        };
    },
});

export const markRefundedFromWebhook = mutation({
    args: {
        webhookSecret: v.string(),
        stripeEventId: v.string(),
        stripePaymentIntentId: v.string(),
        refundAmount: v.number(),
    },
    handler: async (ctx, args) => {
        const expected = process.env.CONVEX_WEBHOOK_SHARED_SECRET;
        if (!expected || args.webhookSecret !== expected) throw new Error("Forbidden");

        const existing = await ctx.db
            .query("stripeWebhookEvents")
            .withIndex("by_stripe_event_id", (q) => q.eq("stripeEventId", args.stripeEventId))
            .first();
        if (existing) return existing.orderId ?? null;

        const order = await ctx.db
            .query("orders")
            .filter((q) => q.eq(q.field("stripePaymentIntentId"), args.stripePaymentIntentId))
            .first();
        if (!order) throw new Error("Order not found");

        await ctx.db.patch(order._id, { status: "cancelled" });
        await ctx.db.insert("stripeWebhookEvents", {
            stripeEventId: args.stripeEventId,
            eventType: "payment_intent.refunded",
            orderId: order._id,
            processedAt: Date.now(),
        });

        return order._id;
    },
});

export const markDisputedFromWebhook = mutation({
    args: {
        webhookSecret: v.string(),
        stripeEventId: v.string(),
        stripePaymentIntentId: v.string(),
        disputeId: v.string(),
        amount: v.number(),
        reason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const expected = process.env.CONVEX_WEBHOOK_SHARED_SECRET;
        if (!expected || args.webhookSecret !== expected) throw new Error("Forbidden");

        const existing = await ctx.db
            .query("stripeWebhookEvents")
            .withIndex("by_stripe_event_id", (q) => q.eq("stripeEventId", args.stripeEventId))
            .first();
        if (existing) return existing.orderId ?? null;

        const order = await ctx.db
            .query("orders")
            .filter((q) => q.eq(q.field("stripePaymentIntentId"), args.stripePaymentIntentId))
            .first();
        if (!order) throw new Error("Order not found");

        await ctx.db.patch(order._id, { status: "disputed" });
        await ctx.db.insert("stripeWebhookEvents", {
            stripeEventId: args.stripeEventId,
            eventType: "charge.dispute.created",
            orderId: order._id,
            processedAt: Date.now(),
        });
        await ctx.scheduler.runAfter(0, internal.emails.sendDisputeCreatedAlert, {
            orderId: order._id,
            disputeId: args.disputeId,
            amount: args.amount,
            reason: args.reason,
        });

        return order._id;
    },
});
