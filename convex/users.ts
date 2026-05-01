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

/** Roles that own a `districts` row (admin / HR / superintendent of a school district). */
const DISTRICT_ROLES = ["district_admin", "district_hr", "superintendent"] as const;
type DistrictRole = (typeof DISTRICT_ROLES)[number];

function isDistrictRole(role: string): role is DistrictRole {
    return (DISTRICT_ROLES as readonly string[]).includes(role);
}

/** First-time or returning user onboarding — persists role and creates educator/district row when needed. */
export const completeOnboarding = mutation({
    args: {
        role: roleValidator,
        organizationName: v.optional(v.string()),
        headline: v.optional(v.string()),
        /** US state code (e.g. "TX", "CA"). Required for district roles when creating a district row. */
        state: v.optional(v.string()),
        /** Coverage region (e.g. "region_1"). Defaults to "region_1" until full geographic taxonomy lands. */
        region: v.optional(v.string()),
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

        const educatorHeadline = args.headline?.trim() || "Update your professional headline";
        const stateCode = args.state?.trim().toUpperCase();
        const region = args.region?.trim() || "region_1";

        // Validate: district roles must supply a state when we'd be creating a district row.
        // We don't enforce this for educator-role re-onboarding flows.
        const wantsDistrictRow = isDistrictRole(args.role) && !!args.organizationName?.trim();
        if (wantsDistrictRow && !stateCode) {
            throw new Error("State is required when creating a district");
        }

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
                if (edu) {
                    if (args.headline?.trim()) {
                        await ctx.db.patch(edu._id, { headline: educatorHeadline });
                    }
                } else {
                    await ctx.db.insert("educators", {
                        userId: existing._id,
                        headline: educatorHeadline,
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

            // K12-6: returning-user path previously skipped district creation entirely.
            // If the user is finishing setup as a district admin/HR/superintendent and
            // no district row exists for them yet, create it here.
            if (wantsDistrictRow && stateCode) {
                const alreadyAdmin = await ctx.db
                    .query("districts")
                    .filter((q) => q.eq(q.field("adminIds"), [existing._id]))
                    .first();
                if (!alreadyAdmin) {
                    await ctx.db.insert("districts", {
                        name: args.organizationName!.trim(),
                        state: stateCode,
                        region,
                        adminIds: [existing._id],
                        planType: "free",
                        createdAt: Date.now(),
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
                headline: educatorHeadline,
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

        if (wantsDistrictRow && stateCode) {
            await ctx.db.insert("districts", {
                name: args.organizationName!.trim(),
                state: stateCode,
                region,
                adminIds: [userId],
                planType: "free",
                createdAt: Date.now(),
            });
        }

        return { userId, alreadyOnboarded: false as const };
    },
});
