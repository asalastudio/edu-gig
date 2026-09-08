import { ownedFile } from "./privateFiles";
import { downloadPath } from "./lib/releaseDomain";
import { getAppIdentity } from "./lib/staging";
import { query, mutation } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";
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
    const identity = await getAppIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");
    const user = await getUserByClerkId(ctx, identity.subject);
    if (!user || !isDistrictRole(user.role)) throw new Error("Forbidden");
    return user;
}

async function requireEducatorViewer(ctx: QueryCtx | MutationCtx) {
    const identity = await getAppIdentity(ctx);
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

// ─── Queries ───────────────────────────────────────────────

/** @deprecated Prefer `listForBrowse` — kept for backwards compatibility; requires district viewer. */
export const list = query({
    args: {},
    handler: async (ctx) => {
        await requireDistrictViewer(ctx);
        const educators = await ctx.db.query("educators").order("desc").take(200);
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
        const educators = await ctx.db.query("educators").take(200);
        const out: Array<{
            id: string;
            name: string;
            secondaryName?: string;
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
            rateUnit?: "hour" | "day";
            availabilityStatus: "open" | "limited" | "closed";
            hasVideoIntro: boolean;
            badges: string[];
            profileType: "individual" | "firm";
        }> = [];

        for (const educator of educators) {
            if (!educator.isActive) continue;
            const user = await ctx.db.get(educator.userId);
            if (!user) continue;
            const personalName = `${user.firstName} ${user.lastName}`.trim();
            const businessName = educator.businessName?.trim();
            const credentials = await ctx.db
                .query("credentials")
                .withIndex("by_educator", (q) => q.eq("educatorId", educator._id))
                .collect();
            const hasReviewedCredential = credentials.some((credential) => credential.verified);
            const hasBackgroundCheck =
                !!educator.backgroundCheckId &&
                (educator.verificationStatus === "verified" || educator.verificationStatus === "premier");
            const badges: string[] = [];
            if (hasReviewedCredential) badges.push("Credentials reviewed");
            if (hasBackgroundCheck) badges.push("Background check complete");
            if (badges.length === 0) badges.push("Profile in progress");
            out.push({
                id: educator._id,
                name: businessName || personalName,
                ...(businessName && personalName ? { secondaryName: personalName } : {}),
                headline: educator.headline,
                avatarUrl: user.avatarUrl,
                verificationTier: verificationToTier(educator.verificationStatus),
                overallRating: 0,
                reviewCount: 0,
                gradeLevels: educator.gradeLevelBands,
                areasOfNeed: educator.areasOfNeed,
                engagementTypes: educator.engagementTypes,
                coverageRegions: educator.coverageRegions,
                startingRate: educator.hourlyRate ?? educator.dailyRate,
                rateUnit: educator.hourlyRate ? "hour" : educator.dailyRate ? "day" : undefined,
                availabilityStatus: educator.availabilityStatus,
                hasVideoIntro: !!educator.videoIntroUrl,
                badges,
                profileType: educator.profileType ?? (businessName ? "firm" : "individual"),
            });
        }
        return out;
    },
});

/**
 * Full educator + user for profile view. District (and superadmin) viewers may
 * view any active profile; the owning educator may view their own as a
 * self-preview. Any other educator is rejected.
 */
export const getProfileForDistrict = query({
    args: { educatorId: v.id("educators") },
    handler: async (ctx, args) => {
        const identity = await getAppIdentity(ctx);
        if (!identity) throw new Error("Unauthorized");
        const viewer = await getUserByClerkId(ctx, identity.subject);
        if (!viewer) throw new Error("Unauthorized");
        const educator = await ctx.db.get(args.educatorId);
        if (!educator || !educator.isActive) return null;
        const isOwner = educator.userId === viewer._id;
        if (!isOwner && !isDistrictRole(viewer.role)) throw new Error("Forbidden");
        const user = await ctx.db.get(educator.userId);
        if (!user) return null;
        return { educator, user };
    },
});

/** Current user's educator row (educator role only). */
export const getMine = query({
    args: {},
    handler: async (ctx) => {
        const identity = await getAppIdentity(ctx);
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
        businessName: v.optional(v.string()),
        headline: v.optional(v.string()),
        bio: v.optional(v.string()),
        presenterBio: v.optional(v.string()),
        teamMembers: v.optional(v.array(v.object({
            name: v.string(),
            title: v.string(),
            bio: v.string(),
        }))),
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
        profileType: v.optional(v.union(v.literal("individual"), v.literal("firm"))),
    },
    handler: async (ctx, args) => {
        const user = await requireEducatorViewer(ctx);
        const edu = await ctx.db
            .query("educators")
            .withIndex("by_user_id", (q) => q.eq("userId", user._id))
            .first();
        if (!edu) throw new Error("No educator profile");
        const patch: Record<string, unknown> = {};
        // Empty string clears the optional field so the personal name shows again.
        if (args.businessName !== undefined) patch.businessName = args.businessName.trim() || undefined;
        if (args.headline !== undefined) patch.headline = args.headline;
        if (args.bio !== undefined) patch.bio = args.bio;
        if (args.presenterBio !== undefined) patch.presenterBio = args.presenterBio.trim() || undefined;
        if (args.teamMembers !== undefined) {
            const cleaned = args.teamMembers
                .map((member) => ({
                    name: member.name.trim(),
                    title: member.title.trim(),
                    bio: member.bio.trim(),
                }))
                .filter((member) => member.name.length > 0);
            patch.teamMembers = cleaned.length > 0 ? cleaned : undefined;
        }
        if (args.availabilityStatus !== undefined) patch.availabilityStatus = args.availabilityStatus;
        if (args.hourlyRate !== undefined) patch.hourlyRate = args.hourlyRate;
        if (args.dailyRate !== undefined) patch.dailyRate = args.dailyRate;
        if (args.gradeLevelBands !== undefined) patch.gradeLevelBands = args.gradeLevelBands;
        if (args.areasOfNeed !== undefined) patch.areasOfNeed = args.areasOfNeed;
        if (args.engagementTypes !== undefined) patch.engagementTypes = args.engagementTypes;
        if (args.coverageRegions !== undefined) patch.coverageRegions = args.coverageRegions;
        if (args.yearsExperience !== undefined) patch.yearsExperience = args.yearsExperience;
        if (args.profileType !== undefined) patch.profileType = args.profileType;
        if (Object.keys(patch).length) await ctx.db.patch(edu._id, patch);
        return edu._id;
    },
});

export const generateResumeUploadUrl = mutation({
    args: {},
    returns: v.string(),
    handler: async (ctx) => {
        await requireEducatorViewer(ctx);
        throw new Error("Private upload required; refresh the application");
    },
});

export const setResume = mutation({
    args: {
        storageId: v.optional(v.id("_storage")),
        privateFileId: v.optional(v.id("privateFiles")),
        fileName: v.string(),
    },
    returns: v.id("educators"),
    handler: async (ctx, args) => {
        const user = await requireEducatorViewer(ctx);
        const edu = await ctx.db
            .query("educators")
            .withIndex("by_user_id", (q) => q.eq("userId", user._id))
            .first();
        if (!edu) throw new Error("No educator profile");
        if (args.storageId || !args.privateFileId) throw new Error("Owned private resume required");
        const file = await ownedFile({ ...ctx, user }, args.privateFileId, "resume");
        await ctx.db.patch(edu._id, { resumePrivateFileId: file._id, resumeStorageId: undefined, resumeFileName: file.fileName });
        return edu._id;
    },
});

export const clearResume = mutation({
    args: {},
    returns: v.id("educators"),
    handler: async (ctx) => {
        const user = await requireEducatorViewer(ctx);
        const edu = await ctx.db
            .query("educators")
            .withIndex("by_user_id", (q) => q.eq("userId", user._id))
            .first();
        if (!edu) throw new Error("No educator profile");
        await ctx.db.patch(edu._id, {
            resumePrivateFileId: undefined,
            resumeStorageId: undefined,
            resumeFileName: undefined,
        });
        return edu._id;
    },
});

export const getResumeUrl = query({
    args: { educatorId: v.id("educators") },
    returns: v.union(
        v.object({ url: v.string(), fileName: v.string() }),
        v.null()
    ),
    handler: async (ctx, args) => {
        const identity = await getAppIdentity(ctx);
        if (!identity) return null;
        const viewer = await getUserByClerkId(ctx, identity.subject);
        if (!viewer) return null;
        const educator = await ctx.db.get(args.educatorId);
        if (!educator || !educator.resumePrivateFileId) return null;
        const isOwner = educator.userId === viewer._id;
        if (!isOwner && !isDistrictRole(viewer.role)) return null;
        const url = downloadPath(educator.resumePrivateFileId);
        if (!url) return null;
        return { url, fileName: educator.resumeFileName ?? "Resume.pdf" };
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
