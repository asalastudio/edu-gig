import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { DEMO_SEED_EMAILS, demoSeedClerkId } from "./demo_seed_constants";

function assertSeedAllowed(seedSecret: string) {
    if (process.env.ALLOW_DEMO_SEED !== "true") {
        throw new Error(
            "Demo seed is disabled. Set ALLOW_DEMO_SEED=true on your development Convex deployment only."
        );
    }
    const expectedSecret = process.env.DEMO_SEED_SECRET;
    if (!expectedSecret || seedSecret !== expectedSecret) {
        throw new Error("Forbidden");
    }
}

export const populate = mutation({
    args: { seedSecret: v.string() },
    handler: async (ctx, args) => {
        assertSeedAllowed(args.seedSecret);

        const marker = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", demoSeedClerkId(DEMO_SEED_EMAILS.district)))
            .first();
        if (marker) {
            return {
                status: "already_populated" as const,
                message: "Demo seed data already exists. Sign in with the documented Clerk test accounts.",
            };
        }

        const now = Date.now();

        const districtUserId = await ctx.db.insert("users", {
            clerkId: demoSeedClerkId(DEMO_SEED_EMAILS.district),
            role: "district_hr",
            email: DEMO_SEED_EMAILS.district,
            firstName: "Jordan",
            lastName: "Rivera",
            onboarded: true,
            createdAt: now,
        });

        await ctx.db.insert("districts", {
            name: "Austin ISD (Demo)",
            state: "TX",
            region: "region_2",
            nceaId: "demo-austin-isd",
            adminIds: [districtUserId],
            planType: "professional",
            createdAt: now,
        });

        const educator1UserId = await ctx.db.insert("users", {
            clerkId: demoSeedClerkId(DEMO_SEED_EMAILS.educator1),
            role: "educator",
            email: DEMO_SEED_EMAILS.educator1,
            firstName: "Sarah",
            lastName: "Jenkins",
            onboarded: true,
            createdAt: now,
        });

        const educator1Id = await ctx.db.insert("educators", {
            userId: educator1UserId,
            headline: "Special Education Specialist & Literacy Coach",
            bio: "I have 12 years of experience working with diverse learners. I specialize in personalized literacy interventions and IEP compliance.",
            yearsExperience: 12,
            gradeLevelBands: ["k5", "6_8"],
            areasOfNeed: ["student_support_services", "instruction_curriculum"],
            subCategories: ["literacy_ela", "mtss_rti"],
            engagementTypes: ["consulting", "substitute"],
            coverageRegions: ["region_1", "region_2"],
            stateLicenses: [],
            verificationStatus: "premier",
            availabilityStatus: "open",
            hourlyRate: 75,
            isActive: true,
            profileCompletePct: 100,
        });

        await ctx.db.insert("gigs", {
            educatorId: educator1Id,
            title: "Curriculum Mapping Workshop",
            description:
                "Half-day workshop to align campus curriculum maps with state standards, including pacing guides and common assessments.",
            areaOfNeed: "instruction_curriculum",
            subCategory: "curriculum_mapping",
            engagementType: "consulting",
            gradeLevels: ["6_8", "9_12"],
            coverageRegions: ["region_2", "all"],
            deliverables: ["Scope document", "Facilitator deck", "Follow-up checklist"],
            pricingType: "fixed",
            price: 450,
            estimatedDuration: "Half-day session",
            isActive: true,
            createdAt: now,
        });

        await ctx.db.insert("gigs", {
            educatorId: educator1Id,
            title: "Literacy Coaching Block",
            description:
                "Weekly literacy coaching for campus intervention teams — data cycles, small-group routines, and progress monitoring.",
            areaOfNeed: "instruction_curriculum",
            subCategory: "literacy_ela",
            engagementType: "consulting",
            gradeLevels: ["k5", "6_8"],
            coverageRegions: ["region_1", "region_2"],
            deliverables: ["Coaching notes", "Observation summary", "Action plan"],
            pricingType: "hourly",
            price: 75,
            estimatedDuration: "4 weeks",
            isActive: true,
            createdAt: now - 1000 * 60 * 60 * 24 * 3,
        });

        const educator2UserId = await ctx.db.insert("users", {
            clerkId: demoSeedClerkId(DEMO_SEED_EMAILS.educator2),
            role: "educator",
            email: DEMO_SEED_EMAILS.educator2,
            firstName: "Miguel",
            lastName: "Rodriguez",
            onboarded: true,
            createdAt: now,
        });

        await ctx.db.insert("educators", {
            userId: educator2UserId,
            headline: "Bilingual Math Interventionist (Spanish/English)",
            bio: "Passionate about making mathematics accessible to all students. I provide high-impact tutoring and curriculum design.",
            yearsExperience: 8,
            gradeLevelBands: ["9_12"],
            areasOfNeed: ["instruction_curriculum"],
            subCategories: ["math_intervention", "esl_ell_support"],
            engagementTypes: ["substitute", "consulting"],
            coverageRegions: ["region_3"],
            stateLicenses: [],
            verificationStatus: "verified",
            availabilityStatus: "limited",
            dailyRate: 250,
            isActive: true,
            profileCompletePct: 90,
        });

        const educator3UserId = await ctx.db.insert("users", {
            clerkId: demoSeedClerkId(DEMO_SEED_EMAILS.educator3),
            role: "educator",
            email: DEMO_SEED_EMAILS.educator3,
            firstName: "Dr. Alana",
            lastName: "Williams",
            onboarded: true,
            createdAt: now,
        });

        await ctx.db.insert("educators", {
            userId: educator3UserId,
            headline: "STEM Coordinator & AP Physics Teacher",
            bio: "Former engineer turned educator. I help districts build STEM pathways and provide long-term substitute coverage for advanced sciences.",
            yearsExperience: 15,
            gradeLevelBands: ["9_12"],
            areasOfNeed: ["instruction_curriculum", "leadership_operations"],
            subCategories: ["stem_steam", "strategic_planning"],
            engagementTypes: ["consulting", "permanent"],
            coverageRegions: ["all"],
            stateLicenses: [],
            verificationStatus: "premier",
            availabilityStatus: "open",
            hourlyRate: 110,
            isActive: true,
            profileCompletePct: 100,
        });

        return {
            status: "populated" as const,
            message: "Demo seed complete: 1 district, 3 educators, 2 gigs. Create Clerk users with the documented emails, then sign in.",
            accounts: DEMO_SEED_EMAILS,
        };
    },
});

/** Dev-only: remove prior demo seed rows (legacy dummy_clerk_* and seed:* users). */
export const clearDemo = mutation({
    args: { seedSecret: v.string() },
    handler: async (ctx, args) => {
        assertSeedAllowed(args.seedSecret);

        const users = await ctx.db.query("users").collect();
        const demoUsers = users.filter(
            (user) =>
                user.clerkId.startsWith("seed:") ||
                user.clerkId.startsWith("dummy_clerk_id_")
        );

        let removedGigs = 0;
        let removedEducators = 0;
        let removedDistricts = 0;

        for (const user of demoUsers) {
            const educator = await ctx.db
                .query("educators")
                .withIndex("by_user_id", (q) => q.eq("userId", user._id))
                .first();
            if (educator) {
                const gigs = await ctx.db
                    .query("gigs")
                    .withIndex("by_educator", (q) => q.eq("educatorId", educator._id))
                    .collect();
                for (const gig of gigs) {
                    await ctx.db.delete(gig._id);
                    removedGigs++;
                }
                await ctx.db.delete(educator._id);
                removedEducators++;
            }
            await ctx.db.delete(user._id);
        }

        const districts = await ctx.db.query("districts").collect();
        for (const district of districts) {
            if (district.name.includes("(Demo)") || district.nceaId === "demo-austin-isd") {
                await ctx.db.delete(district._id);
                removedDistricts++;
            }
        }

        return {
            status: "cleared" as const,
            removedUsers: demoUsers.length,
            removedEducators,
            removedGigs,
            removedDistricts,
        };
    },
});
