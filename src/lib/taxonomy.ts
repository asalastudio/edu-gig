// src/lib/taxonomy.ts

export const TAXONOMY = {
    areasOfNeed: [
        {
            id: "instruction_curriculum",
            label: "Instruction and Curriculum",
            hasDeepMenu: true,
            subCategories: [
                {
                    id: "instructional_coaching",
                    label: "Instructional Coaching Support",
                    specializations: [
                        { id: "coaching_math", label: "Math" },
                        { id: "coaching_ela", label: "English Language Arts" },
                        { id: "coaching_ss", label: "Social Studies" },
                        { id: "coaching_science", label: "Science" },
                        { id: "coaching_general", label: "General Instruction" },
                    ]
                },
                { id: "prof_development", label: "Professional Development", specializations: [] },
                { id: "curriculum_mapping", label: "Curriculum Mapping", specializations: [] },
                { id: "curriculum_adoption", label: "Curriculum Adoption", specializations: [] },
            ]
        },
        {
            id: "data",
            label: "Data",
            hasDeepMenu: false,
            subCategories: []
        },
        {
            id: "leadership",
            label: "Leadership",
            hasDeepMenu: false,
            subCategories: []
        },
        {
            id: "school_improvement",
            label: "School Improvement",
            hasDeepMenu: false,
            subCategories: []
        },
        {
            id: "developmental_medical",
            label: "Developmental & Medical",
            hasDeepMenu: true,
            subCategories: [
                { id: "dev_behavioral", label: "Behavioral", specializations: [] },
                { id: "dev_physical", label: "Physical", specializations: [] },
                { id: "dev_ot", label: "Occupational Therapist", specializations: [] },
                { id: "dev_psych", label: "Psychologist", specializations: [] },
                { id: "dev_visual", label: "Visual Impairment", specializations: [] },
            ]
        },
        {
            id: "mgmt_planning",
            label: "Management Planning",
            hasDeepMenu: false,
            subCategories: []
        },
        {
            id: "human_resources",
            label: "Human Resources",
            hasDeepMenu: false,
            subCategories: []
        },
        {
            id: "accounting",
            label: "Accounting",
            hasDeepMenu: false,
            subCategories: []
        },
        {
            id: "meeting_facilitation",
            label: "Meeting Facilitation",
            hasDeepMenu: false,
            subCategories: []
        },
        {
            id: "systems_development",
            label: "Systems Development",
            hasDeepMenu: false,
            subCategories: []
        },
        {
            id: "project_implementation",
            label: "Project / Implementation Management",
            hasDeepMenu: false,
            subCategories: []
            // Note: Routes directly to Coverage Area filter (no deep sub-menu)
        },
        {
            id: "strategic_planning",
            label: "Strategic Planning",
            hasDeepMenu: false,
            subCategories: []
        },
    ],

    gradeLevelBands: [
        { id: "k5", label: "K–5" },
        { id: "6_8", label: "6–8" },
        { id: "9_12", label: "9–12" },
        { id: "all", label: "All Grades" },
        { id: "other", label: "Other", allowTextInput: true },
    ],

    coverageRegions: [
        { id: "region_1", label: "North Texas / DFW" },
        { id: "region_2", label: "Central Texas / Austin" },
        { id: "region_3", label: "Gulf Coast / Houston" },
        { id: "region_4", label: "South Texas / San Antonio" },
        { id: "region_5", label: "West Texas / Remote" },
        { id: "all", label: "Statewide / Remote" },
    ],

    engagementTypes: [
        { id: "permanent", label: "Permanent Placement" },
        { id: "substitute", label: "Substitute Coverage" },
        { id: "consulting", label: "Freelance Consulting" },
    ],

    verificationTiers: [
        { id: "basic", label: "Basic", description: "Profile complete" },
        { id: "verified", label: "Verified", description: "Background check + license confirmed" },
        { id: "premier", label: "Premier", description: "References checked + portfolio reviewed" },
    ],
} as const;

/** Resolve taxonomy id to label for display (Convex seed data may use legacy codes). */
export function getAreaOfNeedLabel(id: string): string {
    const found = TAXONOMY.areasOfNeed.find((a) => a.id === id);
    return found?.label ?? id.replace(/_/g, " ");
}

export function getCoverageRegionLabel(id: string): string {
    const found = TAXONOMY.coverageRegions.find((r) => r.id === id);
    return found?.label ?? id.replace(/_/g, " ");
}

// Type exports for use across the app
export type AreaOfNeedId = typeof TAXONOMY.areasOfNeed[number]['id'];
export type GradeLevelId = typeof TAXONOMY.gradeLevelBands[number]['id'];
export type RegionId = typeof TAXONOMY.coverageRegions[number]['id'];
