import { mutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import {
    BETA_CLEANUP_EMAILS,
    BETA_FOUNDING_EDUCATORS,
    BETA_FOUNDING_MARKER_CLERK_ID,
    isLegacyTestClerkId,
} from "./beta_founding_profiles";

function assertBetaLaunchAllowed(launchSecret: string) {
    if (process.env.BETA_LAUNCH_ENABLED !== "true") {
        throw new Error(
            "Beta launch mutations are disabled. Set BETA_LAUNCH_ENABLED=true on production Convex only during launch, then unset."
        );
    }
    const expected = process.env.BETA_LAUNCH_SECRET;
    if (!expected || launchSecret !== expected) {
        throw new Error("Forbidden");
    }
}

async function deleteEducatorTree(ctx: MutationCtx, educatorId: Id<"educators">) {
    const gigs = await ctx.db
        .query("gigs")
        .withIndex("by_educator", (q) => q.eq("educatorId", educatorId))
        .collect();
    for (const gig of gigs) {
        await ctx.db.delete(gig._id);
    }
    await ctx.db.delete(educatorId);
    return gigs.length;
}

/**
 * Remove legacy test rows before prod Clerk goes live.
 * Safe to run after switching Clerk — old dev-linked accounts cannot sign in anyway.
 */
export const cleanupPreLaunch = mutation({
    args: { launchSecret: v.string() },
    handler: async (ctx, args) => {
        assertBetaLaunchAllowed(args.launchSecret);

        const users = await ctx.db.query("users").collect();
        const cleanupEmails = new Set(BETA_CLEANUP_EMAILS.map((e) => e.toLowerCase()));

        const toRemove = users.filter(
            (user) =>
                isLegacyTestClerkId(user.clerkId) ||
                cleanupEmails.has(user.email.trim().toLowerCase())
        );

        let removedEducators = 0;
        let removedGigs = 0;
        let removedDistricts = 0;

        for (const user of toRemove) {
            const educator = await ctx.db
                .query("educators")
                .withIndex("by_user_id", (q) => q.eq("userId", user._id))
                .first();
            if (educator) {
                removedGigs += await deleteEducatorTree(ctx, educator._id);
                removedEducators++;
            }
            await ctx.db.delete(user._id);
        }

        const districts = await ctx.db.query("districts").collect();
        for (const district of districts) {
            const isTest =
                district.name.trim().toUpperCase() === "TEST" ||
                district.name.includes("(Demo)") ||
                district.nceaId === "demo-austin-isd" ||
                district.nceaId === "demo-ann-arbor-ps";
            if (isTest) {
                await ctx.db.delete(district._id);
                removedDistricts++;
            }
        }

        return {
            status: "cleaned" as const,
            removedUsers: toRemove.length,
            removedEducators,
            removedGigs,
            removedDistricts,
        };
    },
});

/**
 * Seed polished founding educators with bookable gigs for controlled beta.
 * Idempotent — skips if marker row already exists.
 */
export const seedFoundingProfiles = mutation({
    args: { launchSecret: v.string() },
    handler: async (ctx, args) => {
        assertBetaLaunchAllowed(args.launchSecret);

        const marker = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", BETA_FOUNDING_MARKER_CLERK_ID))
            .first();
        if (marker) {
            return {
                status: "already_seeded" as const,
                message: "Founding beta profiles already exist.",
            };
        }

        const now = Date.now();
        let educatorsCreated = 0;
        let gigsCreated = 0;

        for (const profile of BETA_FOUNDING_EDUCATORS) {
            const userId = await ctx.db.insert("users", {
                clerkId: profile.clerkId,
                role: "educator",
                email: profile.email,
                firstName: profile.firstName,
                lastName: profile.lastName,
                onboarded: true,
                createdAt: now,
            });

            const educatorId = await ctx.db.insert("educators", {
                userId,
                headline: profile.headline,
                bio: profile.bio,
                yearsExperience: profile.yearsExperience,
                gradeLevelBands: [...profile.gradeLevelBands],
                areasOfNeed: [...profile.areasOfNeed],
                subCategories: [...profile.subCategories],
                engagementTypes: [...profile.engagementTypes],
                coverageRegions: [...profile.coverageRegions],
                stateLicenses: [],
                verificationStatus: profile.verificationStatus,
                availabilityStatus: profile.availabilityStatus,
                hourlyRate: "hourlyRate" in profile ? profile.hourlyRate : undefined,
                dailyRate: "dailyRate" in profile ? profile.dailyRate : undefined,
                isActive: true,
                profileCompletePct: profile.profileCompletePct,
            });
            educatorsCreated++;

            for (const gig of profile.gigs) {
                await ctx.db.insert("gigs", {
                    educatorId,
                    title: gig.title,
                    description: gig.description,
                    areaOfNeed: gig.areaOfNeed,
                    subCategory: gig.subCategory,
                    engagementType: gig.engagementType,
                    gradeLevels: [...gig.gradeLevels],
                    coverageRegions: [...gig.coverageRegions],
                    deliverables: [...gig.deliverables],
                    pricingType: gig.pricingType,
                    price: gig.price,
                    estimatedDuration: gig.estimatedDuration,
                    isActive: true,
                    createdAt: now,
                });
                gigsCreated++;
            }
        }

        await ctx.db.insert("users", {
            clerkId: BETA_FOUNDING_MARKER_CLERK_ID,
            role: "educator",
            email: "internal-beta-marker@k12gig.com",
            firstName: "Beta",
            lastName: "Marker",
            onboarded: true,
            createdAt: now,
        });

        return {
            status: "seeded" as const,
            educatorsCreated,
            gigsCreated,
            profiles: BETA_FOUNDING_EDUCATORS.map((p) => ({
                name: `${p.firstName} ${p.lastName}`,
                email: p.email,
                gigCount: p.gigs.length,
            })),
        };
    },
});
