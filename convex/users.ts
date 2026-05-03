import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { PRIVACY_VERSION, TERMS_VERSION } from "../src/lib/legal";

const onboardingRoleValidator = v.union(
    v.literal("educator"),
    v.literal("district_admin"),
    v.literal("district_hr"),
    v.literal("superintendent")
);

const availabilityValidator = v.union(
    v.literal("open"),
    v.literal("limited"),
    v.literal("closed")
);

function cleanText(value: string | undefined, fallback = "") {
    const trimmed = value?.trim();
    return trimmed ? trimmed : fallback;
}

function normalizeEmail(value: string | undefined) {
    return value?.trim().toLowerCase() ?? "";
}

function manualSuperadminEmails() {
    return (process.env.MANUAL_SUPERADMIN_EMAILS ?? "")
        .split(",")
        .map((email) => normalizeEmail(email))
        .filter(Boolean);
}

function isManualSuperadminEmail(email: string | undefined) {
    const normalized = normalizeEmail(email);
    return normalized.length > 0 && manualSuperadminEmails().includes(normalized);
}

function profileCompletion(args: {
    headline?: string;
    bio?: string;
    yearsExperience?: number;
    hourlyRate?: number;
    gradeLevelBands?: string[];
    areasOfNeed?: string[];
    engagementTypes?: string[];
    coverageRegions?: string[];
}) {
    let score = 0;
    if (cleanText(args.headline).length >= 12) score += 15;
    if (cleanText(args.bio).length >= 40) score += 20;
    if ((args.yearsExperience ?? 0) >= 0) score += 10;
    if ((args.hourlyRate ?? 0) >= 20) score += 15;
    if ((args.gradeLevelBands ?? []).length > 0) score += 10;
    if ((args.areasOfNeed ?? []).length > 0) score += 10;
    if ((args.engagementTypes ?? []).length > 0) score += 10;
    if ((args.coverageRegions ?? []).length > 0) score += 10;
    return Math.min(100, score);
}

function educatorProfileFromArgs(args: {
    headline?: string;
    bio?: string;
    yearsExperience?: number;
    hourlyRate?: number;
    gradeLevelBands?: string[];
    areasOfNeed?: string[];
    engagementTypes?: string[];
    coverageRegions?: string[];
    availabilityStatus?: "open" | "limited" | "closed";
}) {
    return {
        headline: cleanText(args.headline, "Update your professional headline"),
        bio: cleanText(args.bio, "Tell districts about your experience, instructional strengths, and the outcomes you can support."),
        yearsExperience: Math.max(0, args.yearsExperience ?? 0),
        gradeLevelBands: args.gradeLevelBands ?? [],
        areasOfNeed: args.areasOfNeed ?? [],
        subCategories: [],
        engagementTypes: args.engagementTypes ?? [],
        coverageRegions: args.coverageRegions ?? [],
        stateLicenses: [],
        verificationStatus: "unverified" as const,
        availabilityStatus: args.availabilityStatus ?? "open",
        isActive: true,
        profileCompletePct: profileCompletion(args),
        ...(args.hourlyRate !== undefined ? { hourlyRate: Math.max(0, args.hourlyRate) } : {}),
    };
}

/** Current Convex user linked to Clerk JWT (requires Clerk + Convex auth config). */
export const viewer = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;
        return await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();
    },
});

/** Launch setup escape hatch: only emails in Convex MANUAL_SUPERADMIN_EMAILS can self-claim superadmin. */
export const claimManualSuperadmin = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const email = normalizeEmail(identity.email as string | undefined);
        if (!isManualSuperadminEmail(email)) throw new Error("Forbidden");

        const name = (identity.name as string | undefined) ?? "";
        const parts = name.trim().split(/\s+/).filter(Boolean);
        const firstName = parts[0] ?? email.split("@")[0] ?? "Admin";
        const lastName = parts.length > 1 ? parts.slice(1).join(" ") : "Admin";
        const now = Date.now();

        const existingByClerkId = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (existingByClerkId) {
            await ctx.db.patch(existingByClerkId._id, {
                role: "superadmin",
                email,
                firstName,
                lastName,
                onboarded: true,
            });
            return existingByClerkId._id;
        }

        const users = await ctx.db.query("users").collect();
        const existingByEmail = users.find((user) => normalizeEmail(user.email) === email);
        if (existingByEmail) {
            await ctx.db.patch(existingByEmail._id, {
                clerkId: identity.subject,
                role: "superadmin",
                email,
                firstName,
                lastName,
                onboarded: true,
            });
            return existingByEmail._id;
        }

        return await ctx.db.insert("users", {
            clerkId: identity.subject,
            role: "superadmin",
            email,
            firstName,
            lastName,
            onboarded: true,
            createdAt: now,
        });
    },
});

/** First-time or returning user onboarding — persists role and creates educator row when needed. */
export const completeOnboarding = mutation({
    args: {
        role: onboardingRoleValidator,
        organizationName: v.optional(v.string()),
        districtState: v.optional(v.string()),
        districtRegion: v.optional(v.string()),
        districtNceaId: v.optional(v.string()),
        headline: v.optional(v.string()),
        bio: v.optional(v.string()),
        yearsExperience: v.optional(v.number()),
        hourlyRate: v.optional(v.number()),
        gradeLevelBands: v.optional(v.array(v.string())),
        areasOfNeed: v.optional(v.array(v.string())),
        engagementTypes: v.optional(v.array(v.string())),
        coverageRegions: v.optional(v.array(v.string())),
        availabilityStatus: v.optional(availabilityValidator),
        termsVersion: v.optional(v.string()),
        privacyVersion: v.optional(v.string()),
        legalAcceptedAt: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const existing = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        const email = (identity.email as string | undefined) ?? "";
        const name = (identity.name as string | undefined) ?? "";
        const parts = name.trim().split(/\s+/);
        const firstName = parts[0] ?? "User";
        const lastName = parts.length > 1 ? parts.slice(1).join(" ") : parts[0] ?? "Name";

        const educatorProfile = educatorProfileFromArgs(args);
        const isDistrict =
            args.role === "district_admin" ||
            args.role === "district_hr" ||
            args.role === "superintendent";
        const legalAcceptedAt = args.legalAcceptedAt ?? Date.now();
        const legalPatch = {
            termsAcceptedAt: legalAcceptedAt,
            termsVersion: args.termsVersion ?? TERMS_VERSION,
            privacyAcceptedAt: legalAcceptedAt,
            privacyVersion: args.privacyVersion ?? PRIVACY_VERSION,
        };

        if (existing) {
            if (existing.onboarded) {
                return { userId: existing._id, alreadyOnboarded: true as const };
            }
            await ctx.db.patch(existing._id, {
                role: args.role,
                onboarded: true,
                email: email || existing.email,
                firstName: firstName || existing.firstName,
                lastName: lastName || existing.lastName,
                ...legalPatch,
            });

            if (args.role === "educator") {
                const edu = await ctx.db
                    .query("educators")
                    .withIndex("by_user_id", (q) => q.eq("userId", existing._id))
                    .first();
                if (edu) {
                    await ctx.db.patch(edu._id, {
                        headline: educatorProfile.headline,
                        bio: educatorProfile.bio,
                        yearsExperience: educatorProfile.yearsExperience,
                        gradeLevelBands: educatorProfile.gradeLevelBands,
                        areasOfNeed: educatorProfile.areasOfNeed,
                        engagementTypes: educatorProfile.engagementTypes,
                        coverageRegions: educatorProfile.coverageRegions,
                        availabilityStatus: educatorProfile.availabilityStatus,
                        profileCompletePct: educatorProfile.profileCompletePct,
                        ...(educatorProfile.hourlyRate !== undefined ? { hourlyRate: educatorProfile.hourlyRate } : {}),
                    });
                } else {
                    await ctx.db.insert("educators", {
                        userId: existing._id,
                        ...educatorProfile,
                    });
                }
            }

            if (isDistrict && args.organizationName) {
                const districts = await ctx.db.query("districts").collect();
                const existingDistrict = districts.find((d) => d.adminIds.includes(existing._id));
                const districtName = cleanText(args.organizationName);
                const districtState = cleanText(args.districtState, "TX");
                const districtRegion = cleanText(args.districtRegion, "region_1");
                const districtNceaId = cleanText(args.districtNceaId);
                if (!existingDistrict) {
                    await ctx.db.insert("districts", {
                        name: districtName,
                        state: districtState,
                        region: districtRegion,
                        ...(districtNceaId ? { nceaId: districtNceaId } : {}),
                        adminIds: [existing._id],
                        planType: "free",
                        createdAt: Date.now(),
                    });
                } else {
                    await ctx.db.patch(existingDistrict._id, {
                        name: districtName,
                        state: districtState,
                        region: districtRegion,
                        ...(districtNceaId ? { nceaId: districtNceaId } : {}),
                    });
                }
            }

            return { userId: existing._id, alreadyOnboarded: false as const };
        }

        const userId = await ctx.db.insert("users", {
            clerkId: identity.subject,
            role: args.role,
            email: email || `${identity.subject}@placeholder.local`,
            firstName,
            lastName,
            onboarded: true,
            ...legalPatch,
            createdAt: Date.now(),
        });

        if (args.role === "educator") {
            await ctx.db.insert("educators", {
                userId,
                ...educatorProfile,
            });
        }

        if (args.organizationName && isDistrict) {
            const districtNceaId = cleanText(args.districtNceaId);
            await ctx.db.insert("districts", {
                name: cleanText(args.organizationName),
                state: cleanText(args.districtState, "TX"),
                region: cleanText(args.districtRegion, "region_1"),
                ...(districtNceaId ? { nceaId: districtNceaId } : {}),
                adminIds: [userId],
                planType: "free",
                createdAt: Date.now(),
            });
        }

        return { userId, alreadyOnboarded: false as const };
    },
});
