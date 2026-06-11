/**
 * Curated founding educator profiles for controlled beta launch.
 * clerkId prefix `beta:founding:` — display/booking only until a real educator claims the row.
 */

export const BETA_FOUNDING_MARKER_CLERK_ID = "beta:founding:__seeded__";

export const BETA_FOUNDING_EDUCATORS = [
    {
        clerkId: "beta:founding:sarah-jenkins",
        email: "founding-sarah@k12gig.com",
        firstName: "Sarah",
        lastName: "Jenkins",
        headline: "Special Education Specialist & Literacy Coach",
        bio: "Twelve years supporting diverse learners across K–8 in Michigan districts. I specialize in literacy interventions, MTSS cycles, and IEP compliance coaching for campus teams.",
        yearsExperience: 12,
        gradeLevelBands: ["k5", "6_8"],
        areasOfNeed: ["student_support_services", "instruction_curriculum"],
        subCategories: ["literacy_ela", "mtss_rti"],
        engagementTypes: ["consulting", "substitute"],
        coverageRegions: ["region_5", "region_6"],
        verificationStatus: "premier" as const,
        availabilityStatus: "open" as const,
        hourlyRate: 75,
        profileCompletePct: 100,
        gigs: [
            {
                title: "Curriculum Mapping Workshop",
                description:
                    "Half-day workshop to align campus curriculum maps with Michigan K–12 standards, including pacing guides and common assessments.",
                areaOfNeed: "instruction_curriculum",
                subCategory: "curriculum_mapping",
                engagementType: "consulting",
                gradeLevels: ["6_8", "9_12"],
                coverageRegions: ["region_4", "all"],
                deliverables: ["Scope document", "Facilitator deck", "Follow-up checklist"],
                pricingType: "fixed" as const,
                price: 450,
                estimatedDuration: "Half-day session",
            },
            {
                title: "Literacy Coaching Block",
                description:
                    "Weekly literacy coaching for campus intervention teams — data cycles, small-group routines, and progress monitoring.",
                areaOfNeed: "instruction_curriculum",
                subCategory: "literacy_ela",
                engagementType: "consulting",
                gradeLevels: ["k5", "6_8"],
                coverageRegions: ["region_5", "region_6"],
                deliverables: ["Coaching notes", "Observation summary", "Action plan"],
                pricingType: "hourly" as const,
                price: 75,
                estimatedDuration: "4 weeks",
            },
        ],
    },
    {
        clerkId: "beta:founding:miguel-rodriguez",
        email: "founding-miguel@k12gig.com",
        firstName: "Miguel",
        lastName: "Rodriguez",
        headline: "Bilingual Math Interventionist (Spanish/English)",
        bio: "Passionate about making mathematics accessible to multilingual learners. High-impact tutoring, algebra readiness blocks, and curriculum design for grades 9–12 across Mid-Michigan.",
        yearsExperience: 8,
        gradeLevelBands: ["9_12"],
        areasOfNeed: ["instruction_curriculum"],
        subCategories: ["math_intervention", "esl_ell_support"],
        engagementTypes: ["substitute", "consulting"],
        coverageRegions: ["region_4"],
        verificationStatus: "verified" as const,
        availabilityStatus: "limited" as const,
        dailyRate: 250,
        profileCompletePct: 90,
        gigs: [
            {
                title: "Algebra Readiness Intensive",
                description:
                    "Four-week small-group algebra readiness program with bilingual scaffolds, exit tickets, and campus teacher debriefs.",
                areaOfNeed: "instruction_curriculum",
                subCategory: "math_intervention",
                engagementType: "consulting",
                gradeLevels: ["9_12"],
                coverageRegions: ["region_4"],
                deliverables: ["Student progress report", "Teacher toolkit", "Final recommendations"],
                pricingType: "fixed" as const,
                price: 1200,
                estimatedDuration: "4 weeks",
            },
        ],
    },
    {
        clerkId: "beta:founding:alana-williams",
        email: "founding-alana@k12gig.com",
        firstName: "Dr. Alana",
        lastName: "Williams",
        headline: "STEM Coordinator & AP Physics Teacher",
        bio: "Former engineer turned educator. I help Michigan districts build STEM pathways and provide long-term substitute coverage for advanced sciences.",
        yearsExperience: 15,
        gradeLevelBands: ["9_12"],
        areasOfNeed: ["instruction_curriculum", "leadership_operations"],
        subCategories: ["stem_steam", "strategic_planning"],
        engagementTypes: ["consulting", "permanent"],
        coverageRegions: ["all"],
        verificationStatus: "premier" as const,
        availabilityStatus: "open" as const,
        hourlyRate: 110,
        profileCompletePct: 100,
        gigs: [
            {
                title: "STEM Pathway Design Sprint",
                description:
                    "Two-day sprint with district leaders to map course sequences, lab needs, and industry partnerships for a 9–12 STEM pathway.",
                areaOfNeed: "instruction_curriculum",
                subCategory: "stem_steam",
                engagementType: "consulting",
                gradeLevels: ["9_12"],
                coverageRegions: ["all"],
                deliverables: ["Pathway map", "Budget estimate", "Implementation timeline"],
                pricingType: "fixed" as const,
                price: 2800,
                estimatedDuration: "2 days",
            },
        ],
    },
] as const;

/** Emails and clerkId patterns removed during pre-launch cleanup. */
export const BETA_CLEANUP_EMAILS = [
    "richtersk8@gmail.com",
    "info@excelancedata.com",
    "jordan@tarifeattar.com",
    "dr.williams@example.com",
    "m.rodriguez@example.com",
] as const;

export function isBetaFoundingClerkId(clerkId: string): boolean {
    return clerkId.startsWith("beta:founding:");
}

export function isLegacyTestClerkId(clerkId: string): boolean {
    return (
        clerkId.startsWith("dummy_clerk_id_") ||
        clerkId.startsWith("seed:") ||
        isBetaFoundingClerkId(clerkId)
    );
}
