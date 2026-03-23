import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const roleValidator = v.union(
    v.literal("educator"),
    v.literal("district_admin"),
    v.literal("district_hr"),
    v.literal("superintendent"),
    v.literal("superadmin")
);

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

/** First-time or returning user onboarding — persists role and creates educator row when needed. */
export const completeOnboarding = mutation({
    args: {
        role: roleValidator,
        organizationName: v.optional(v.string()),
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
            });

            if (args.role === "educator") {
                const edu = await ctx.db
                    .query("educators")
                    .withIndex("by_user_id", (q) => q.eq("userId", existing._id))
                    .first();
                if (!edu) {
                    await ctx.db.insert("educators", {
                        userId: existing._id,
                        headline: "Update your professional headline",
                        bio: "Tell districts about your experience and focus areas.",
                        yearsExperience: 0,
                        gradeLevelBands: [],
                        areasOfNeed: [],
                        subCategories: [],
                        engagementTypes: [],
                        coverageRegions: [],
                        stateLicenses: [],
                        verificationStatus: "unverified",
                        availabilityStatus: "open",
                        isActive: true,
                        profileCompletePct: 0,
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
            createdAt: Date.now(),
        });

        if (args.role === "educator") {
            await ctx.db.insert("educators", {
                userId,
                headline: "Update your professional headline",
                bio: "Tell districts about your experience and focus areas.",
                yearsExperience: 0,
                gradeLevelBands: [],
                areasOfNeed: [],
                subCategories: [],
                engagementTypes: [],
                coverageRegions: [],
                stateLicenses: [],
                verificationStatus: "unverified",
                availabilityStatus: "open",
                isActive: true,
                profileCompletePct: 0,
            });
        }

        if (
            args.organizationName &&
            (args.role === "district_admin" || args.role === "district_hr" || args.role === "superintendent")
        ) {
            await ctx.db.insert("districts", {
                name: args.organizationName,
                state: "TX",
                region: "region_1",
                adminIds: [userId],
                planType: "free",
                createdAt: Date.now(),
            });
        }

        return { userId, alreadyOnboarded: false as const };
    },
});
