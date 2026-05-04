import { query, mutation } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { v } from "convex/values";

function isDistrictRole(role: string): boolean {
    return (
        role === "district_admin" ||
        role === "district_hr" ||
        role === "superintendent" ||
        role === "superadmin"
    );
}

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
    if (!user || !isDistrictRole(user.role)) throw new Error("Forbidden");
    return user;
}

async function requireEducatorViewer(ctx: QueryCtx | MutationCtx) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await getUserByClerkId(ctx, identity.subject);
    if (!user || user.role !== "educator") throw new Error("Forbidden");
    return user;
}

function verificationToTier(
    status: "unverified" | "pending" | "verified" | "premier"
): "basic" | "verified" | "premier" {
    if (status === "unverified" || status === "pending") return "basic";
    if (status === "verified") return "verified";
    return "premier";
}

async function reviewSummary(ctx: QueryCtx | MutationCtx, userId: Doc<"users">["_id"]) {
    const reviews = await ctx.db
        .query("reviews")
        .withIndex("by_reviewee", (q) => q.eq("revieweeId", userId))
        .collect();
    if (reviews.length === 0) {
        return { overallRating: 0, reviewCount: 0 };
    }
    const average =
        reviews.reduce((sum, review) => sum + review.overallRating, 0) / reviews.length;
    return {
        overallRating: Math.round(average * 10) / 10,
        reviewCount: reviews.length,
    };
}

// ─── Queries ───────────────────────────────────────────────

/** @deprecated Prefer `listForBrowse` — kept for backwards compatibility; requires district viewer. */
export const list = query({
    args: {},
    handler: async (ctx) => {
        await requireDistrictViewer(ctx);
        const educators = await ctx.db.query("educators").order("desc").collect();
        return await Promise.all(
            educators.map(async (educator) => {
                const user = await ctx.db.get(educator.userId);
                return {
                    ...educator,
                    user: user!,
                };
            })
        );
    },
});

/**
 * Card-shaped roster for the browse UI. Restricted to district (and superadmin) accounts.
 */
export const listForBrowse = query({
    args: {},
    handler: async (ctx) => {
        await requireDistrictViewer(ctx);
        const educators = await ctx.db.query("educators").collect();
        const out: Array<{
            id: string;
            name: string;
            headline: string;
            avatarUrl?: string;
            verificationTier: "basic" | "verified" | "premier";
            overallRating: number;
            reviewCount: number;
            gradeLevels: string[];
            areasOfNeed: string[];
            engagementTypes: string[];
            coverageRegions: string[];
            startingRate?: number;
            availabilityStatus: "open" | "limited" | "closed";
            hasVideoIntro: boolean;
            badges: string[];
        }> = [];

        for (const educator of educators) {
            if (!educator.isActive) continue;
            const user = await ctx.db.get(educator.userId);
            if (!user) continue;
            const name = `${user.firstName} ${user.lastName}`.trim();
            const rating = await reviewSummary(ctx, user._id);
            out.push({
                id: educator._id,
                name,
                headline: educator.headline,
                avatarUrl: user.avatarUrl,
                verificationTier: verificationToTier(educator.verificationStatus),
                overallRating: rating.overallRating,
                reviewCount: rating.reviewCount,
                gradeLevels: educator.gradeLevelBands,
                areasOfNeed: educator.areasOfNeed,
                engagementTypes: educator.engagementTypes,
                coverageRegions: educator.coverageRegions,
                startingRate: educator.hourlyRate ?? educator.dailyRate,
                availabilityStatus: educator.availabilityStatus,
                hasVideoIntro: !!educator.videoIntroUrl,
                badges:
                    educator.verificationStatus === "premier"
                        ? ["Background Checked", "Premier"]
                        : educator.verificationStatus === "verified"
                          ? ["Background Checked"]
                          : ["New to K12Gig"],
            });
        }
        return out;
    },
});

/** Full educator + user for profile view — district viewers only. */
export const getProfileForDistrict = query({
    args: { educatorId: v.id("educators") },
    handler: async (ctx, args) => {
        await requireDistrictViewer(ctx);
        const educator = await ctx.db.get(args.educatorId);
        if (!educator || !educator.isActive) return null;
        const user = await ctx.db.get(educator.userId);
        if (!user) return null;
        return { educator, user };
    },
});

/** Current user's educator row (educator role only). */
export const getMine = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;
        const user = await getUserByClerkId(ctx, identity.subject);
        if (!user || user.role !== "educator") return null;
        return await ctx.db
            .query("educators")
            .withIndex("by_user_id", (q) => q.eq("userId", user._id))
            .first();
    },
});

// ─── Mutations ─────────────────────────────────────────────

/** Educators may update their own profile copy; districts cannot call this for another user. */
export const updateMyProfile = mutation({
    args: {
        headline: v.optional(v.string()),
        bio: v.optional(v.string()),
        availabilityStatus: v.optional(v.union(
            v.literal("open"),
            v.literal("limited"),
            v.literal("closed")
        )),
        hourlyRate: v.optional(v.number()),
        dailyRate: v.optional(v.number()),
        gradeLevelBands: v.optional(v.array(v.string())),
        areasOfNeed: v.optional(v.array(v.string())),
        engagementTypes: v.optional(v.array(v.string())),
        coverageRegions: v.optional(v.array(v.string())),
        yearsExperience: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await requireEducatorViewer(ctx);
        const edu = await ctx.db
            .query("educators")
            .withIndex("by_user_id", (q) => q.eq("userId", user._id))
            .first();
        if (!edu) throw new Error("No educator profile");
        const patch: Record<string, unknown> = {};
        if (args.headline !== undefined) patch.headline = args.headline;
        if (args.bio !== undefined) patch.bio = args.bio;
        if (args.availabilityStatus !== undefined) patch.availabilityStatus = args.availabilityStatus;
        if (args.hourlyRate !== undefined) patch.hourlyRate = args.hourlyRate;
        if (args.dailyRate !== undefined) patch.dailyRate = args.dailyRate;
        if (args.gradeLevelBands !== undefined) patch.gradeLevelBands = args.gradeLevelBands;
        if (args.areasOfNeed !== undefined) patch.areasOfNeed = args.areasOfNeed;
        if (args.engagementTypes !== undefined) patch.engagementTypes = args.engagementTypes;
        if (args.coverageRegions !== undefined) patch.coverageRegions = args.coverageRegions;
        if (args.yearsExperience !== undefined) patch.yearsExperience = args.yearsExperience;
        if (Object.keys(patch).length) await ctx.db.patch(edu._id, patch);
        return edu._id;
    },
});

/**
 * Internal: patch verification state from a trusted webhook caller.
 * Used by the Next.js /api/checkr/invite route (status="pending") and the
 * /api/checkr/webhook route (status="verified"|"unverified"). Guarded by the
 * same CONVEX_WEBHOOK_SHARED_SECRET as orders.createFromWebhook.
 *
 * One of `educatorId`, `educatorClerkId`, or `lookupBackgroundCheckId` must
 * be supplied to locate the row. `lookupBackgroundCheckId` is a full-table
 * scan (used by the Checkr webhook when only the candidate id is known).
 */
export const updateVerificationFromWebhook = mutation({
    args: {
        webhookSecret: v.string(),
        educatorId: v.optional(v.id("educators")),
        educatorClerkId: v.optional(v.string()),
        lookupBackgroundCheckId: v.optional(v.string()),
        status: v.union(
            v.literal("unverified"),
            v.literal("pending"),
            v.literal("verified"),
            v.literal("premier")
        ),
        backgroundCheckId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const expected = process.env.CONVEX_WEBHOOK_SHARED_SECRET;
        if (!expected || args.webhookSecret !== expected) {
            throw new Error("Forbidden");
        }

        let educator = null;
        if (args.educatorId) {
            educator = await ctx.db.get(args.educatorId);
        } else if (args.educatorClerkId) {
            const user = await ctx.db
                .query("users")
                .withIndex("by_clerk_id", (q) =>
                    q.eq("clerkId", args.educatorClerkId!)
                )
                .first();
            if (user) {
                educator = await ctx.db
                    .query("educators")
                    .withIndex("by_user_id", (q) => q.eq("userId", user._id))
                    .first();
            }
        } else if (args.lookupBackgroundCheckId) {
            const all = await ctx.db.query("educators").collect();
            educator =
                all.find(
                    (e) => e.backgroundCheckId === args.lookupBackgroundCheckId
                ) ?? null;
        }
        if (!educator) throw new Error("Educator not found");

        const patch: Record<string, unknown> = {
            verificationStatus: args.status,
        };
        if (args.backgroundCheckId !== undefined) {
            patch.backgroundCheckId = args.backgroundCheckId;
        }
        await ctx.db.patch(educator._id, patch);
        return educator._id;
    },
});
