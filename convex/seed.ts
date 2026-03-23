import { mutation } from "./_generated/server";

export const populate = mutation({
    handler: async (ctx) => {
        // Check if we already have users
        const existingUsers = await ctx.db.query("users").collect();
        if (existingUsers.length > 0) {
            return "Already populated";
        }

        // 1. Create a User for a dummy educator
        const userId1 = await ctx.db.insert("users", {
            clerkId: "dummy_clerk_id_1",
            role: "educator",
            email: "sarah.j@example.com",
            firstName: "Sarah",
            lastName: "Jenkins",
            onboarded: true,
            createdAt: Date.now(),
        });

        // 2. Create the corresponding Educator profile
        await ctx.db.insert("educators", {
            userId: userId1,
            headline: "Special Education Specialist & Literacy Coach",
            bio: "I have 12 years of experience working with diverse learners. I specialize in developing personalized literacy interventions and IEP compliance.",
            yearsExperience: 12,
            gradeLevelBands: ["k5", "6_8"],
            areasOfNeed: ["sped", "instructional_coach"],
            subCategories: ["literacy", "iep_case_management"],
            engagementTypes: ["permanent", "consulting"],
            coverageRegions: ["region_1", "region_2"],
            stateLicenses: [],
            verificationStatus: "premier",
            availabilityStatus: "open",
            hourlyRate: 75,
            isActive: true,
            profileCompletePct: 100,
        });

        // 1. Create a User for a second dummy educator
        const userId2 = await ctx.db.insert("users", {
            clerkId: "dummy_clerk_id_2",
            role: "educator",
            email: "m.rodriguez@example.com",
            firstName: "Miguel",
            lastName: "Rodriguez",
            onboarded: true,
            createdAt: Date.now(),
        });

        // 2. Create the corresponding Educator profile
        await ctx.db.insert("educators", {
            userId: userId2,
            headline: "Bilingual Math Interventionist (Spanish/English)",
            bio: "Passionate about making mathematics accessible to all students. I provide high-impact tutoring and curriculum design.",
            yearsExperience: 8,
            gradeLevelBands: ["9_12"],
            areasOfNeed: ["math", "ell"],
            subCategories: ["algebra", "bilingual_instruction"],
            engagementTypes: ["substitute"],
            coverageRegions: ["region_3"],
            stateLicenses: [],
            verificationStatus: "verified",
            availabilityStatus: "limited",
            dailyRate: 250,
            isActive: true,
            profileCompletePct: 90,
        });

        // 1. Create a User for a third dummy educator
        const userId3 = await ctx.db.insert("users", {
            clerkId: "dummy_clerk_id_3",
            role: "educator",
            email: "dr.williams@example.com",
            firstName: "Dr. Alana",
            lastName: "Williams",
            onboarded: true,
            createdAt: Date.now(),
        });

        // 2. Create the corresponding Educator profile
        await ctx.db.insert("educators", {
            userId: userId3,
            headline: "STEM Coordinator & AP Physics Teacher",
            bio: "Former engineer turned educator. I help districts build out their STEM pathways and provide long-term substitute coverage for advanced sciences.",
            yearsExperience: 15,
            gradeLevelBands: ["9_12"],
            areasOfNeed: ["science", "admin"],
            subCategories: ["physics", "curriculum_design"],
            engagementTypes: ["consulting", "permanent"],
            coverageRegions: ["all"],
            stateLicenses: [],
            verificationStatus: "premier",
            availabilityStatus: "closed",
            hourlyRate: 110,
            isActive: true,
            profileCompletePct: 100,
        });

        return "Populated Database with 3 dummy educators!";
    },
});
