import { query, mutation } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";

// ─── Inline auth helpers (not shared — Convex files are serverless-isolated) ───

async function getUserByClerkId(ctx: QueryCtx | MutationCtx, clerkId: string) {
    return await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
        .first();
}

async function requireViewer(ctx: QueryCtx | MutationCtx) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await getUserByClerkId(ctx, identity.subject);
    if (!user) throw new Error("Unauthorized");
    return user;
}

function validateRating(name: string, n: number | undefined) {
    if (n === undefined) return;
    if (!Number.isFinite(n) || n < 1 || n > 5) {
        throw new Error(`${name} must be between 1 and 5`);
    }
}

// ─── Mutations ─────────────────────────────────────────────

/**
 * Submit a review for a completed order.
 * The reviewer role is inferred from whether the caller is the buyer or the
 * educator's user. The reviewee is the opposite side.
 */
export const submit = mutation({
    args: {
        orderId: v.id("orders"),
        overallRating: v.number(),
        subjectExpertise: v.optional(v.number()),
        classroomMgmt: v.optional(v.number()),
        communication: v.optional(v.number()),
        reliability: v.optional(v.number()),
        comment: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await requireViewer(ctx);

        validateRating("overallRating", args.overallRating);
        validateRating("subjectExpertise", args.subjectExpertise);
        validateRating("classroomMgmt", args.classroomMgmt);
        validateRating("communication", args.communication);
        validateRating("reliability", args.reliability);

        const order = await ctx.db.get(args.orderId);
        if (!order) throw new Error("Order not found");
        if (order.status !== "completed") {
            throw new Error("Order must be completed before review");
        }

        const educator = await ctx.db.get(order.educatorId);
        if (!educator) throw new Error("Educator not found on order");

        const isBuyer = order.buyerUserId === user._id;
        const isEducator = educator.userId === user._id;
        if (!isBuyer && !isEducator) {
            throw new Error("Forbidden");
        }

        const reviewerRole: "buyer" | "seller" = isBuyer ? "buyer" : "seller";
        const revieweeId: Id<"users"> = isBuyer ? educator.userId : order.buyerUserId;

        // Reject duplicate review for (orderId, reviewerRole)
        const existing = await ctx.db
            .query("reviews")
            .withIndex("by_reviewee", (q) => q.eq("revieweeId", revieweeId))
            .collect();
        if (existing.some((r) => r.orderId === args.orderId && r.reviewerRole === reviewerRole)) {
            throw new Error("You have already reviewed this engagement");
        }

        const now = Date.now();
        const reviewId = await ctx.db.insert("reviews", {
            orderId: args.orderId,
            reviewerRole,
            revieweeId,
            overallRating: args.overallRating,
            subjectExpertise: args.subjectExpertise,
            classroomMgmt: args.classroomMgmt,
            communication: args.communication,
            reliability: args.reliability,
            comment: args.comment,
            createdAt: now,
        });

        await ctx.db.insert("notifications", {
            userId: revieweeId,
            type: "review",
            title: `You received a new review`,
            body:
                args.comment && args.comment.length > 0
                    ? args.comment.slice(0, 140)
                    : `${args.overallRating} out of 5 rating.`,
            read: false,
            actionUrl: `/dashboard/reviews/${args.orderId}`,
            createdAt: now,
        });

        return reviewId;
    },
});

// ─── Queries ───────────────────────────────────────────────

/**
 * List reviews received by a specific educator. Public (no role check) —
 * profile pages and browse grid use this.
 */
export const listForEducator = query({
    args: { educatorId: v.id("educators") },
    handler: async (ctx, args) => {
        const educator = await ctx.db.get(args.educatorId);
        if (!educator) return [];

        const reviews = await ctx.db
            .query("reviews")
            .withIndex("by_reviewee", (q) => q.eq("revieweeId", educator.userId))
            .order("desc")
            .collect();

        type Row = {
            id: Id<"reviews">;
            orderId: Id<"orders">;
            reviewerRole: "buyer" | "seller";
            overallRating: number;
            subjectExpertise?: number;
            classroomMgmt?: number;
            communication?: number;
            reliability?: number;
            comment?: string;
            createdAt: number;
            reviewerName: string;
        };

        const rows: Row[] = [];
        for (const r of reviews) {
            if (r.reviewerRole !== "buyer") continue; // Only surface buyer→educator reviews on profile
            const order = await ctx.db.get(r.orderId);
            let reviewerName = "District reviewer";
            if (order) {
                const reviewer = await ctx.db.get(order.buyerUserId);
                if (reviewer) {
                    reviewerName = `${reviewer.firstName} ${reviewer.lastName}`.trim() || reviewerName;
                }
            }
            rows.push({
                id: r._id,
                orderId: r.orderId,
                reviewerRole: r.reviewerRole,
                overallRating: r.overallRating,
                subjectExpertise: r.subjectExpertise,
                classroomMgmt: r.classroomMgmt,
                communication: r.communication,
                reliability: r.reliability,
                comment: r.comment,
                createdAt: r.createdAt,
                reviewerName,
            });
        }
        return rows;
    },
});

/**
 * Get the existing review for a given order + reviewer role, or null.
 * Viewer must be buyer, educator, or superadmin.
 */
export const getForOrder = query({
    args: {
        orderId: v.id("orders"),
        reviewerRole: v.union(v.literal("buyer"), v.literal("seller")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;
        const user = await getUserByClerkId(ctx, identity.subject);
        if (!user) return null;

        const order = await ctx.db.get(args.orderId);
        if (!order) return null;

        const educator = await ctx.db
            .query("educators")
            .withIndex("by_user_id", (q) => q.eq("userId", user._id))
            .first();

        const isBuyer = order.buyerUserId === user._id;
        const isEducator = educator && order.educatorId === educator._id;
        const isAdmin = user.role === "superadmin";
        if (!isBuyer && !isEducator && !isAdmin) return null;

        // revieweeId for each role
        const educatorDoc = await ctx.db.get(order.educatorId);
        if (!educatorDoc) return null;
        const revieweeId: Id<"users"> = args.reviewerRole === "buyer" ? educatorDoc.userId : order.buyerUserId;

        const existing = await ctx.db
            .query("reviews")
            .withIndex("by_reviewee", (q) => q.eq("revieweeId", revieweeId))
            .collect();

        const match = existing.find(
            (r) => r.orderId === args.orderId && r.reviewerRole === args.reviewerRole
        );
        return (match as Doc<"reviews"> | undefined) ?? null;
    },
});

/** Aggregate overall rating + count for an educator's received buyer reviews. */
export const getSummaryForEducator = query({
    args: { educatorId: v.id("educators") },
    handler: async (ctx, args) => {
        const educator = await ctx.db.get(args.educatorId);
        if (!educator) return { averageRating: 0, count: 0 };

        const reviews = await ctx.db
            .query("reviews")
            .withIndex("by_reviewee", (q) => q.eq("revieweeId", educator.userId))
            .collect();

        const buyerReviews = reviews.filter((r) => r.reviewerRole === "buyer");
        const count = buyerReviews.length;
        if (count === 0) return { averageRating: 0, count: 0 };
        const sum = buyerReviews.reduce((s, r) => s + r.overallRating, 0);
        return { averageRating: sum / count, count };
    },
});
