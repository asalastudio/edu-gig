// src/lib/taxonomy.ts

type TaxonomyOption = {
    id: string;
    label: string;
};

export const TAXONOMY = {
    areasOfNeed: [
        {
            id: "ai_edtech",
            label: "AI & Educational Technology",
            hasDeepMenu: false,
            aliases: ["systems_development"],
            subCategories: [
                { id: "ai_policy_governance", label: "AI Policy & Governance", specializations: [] },
                { id: "ai_instructional_integration", label: "AI Instructional Integration", specializations: [] },
                { id: "ethics_data_privacy", label: "Ethics & Data Privacy", specializations: [] },
                { id: "generative_ai_admin", label: "Generative AI for Admin", specializations: [] },
                { id: "ai_professional_development", label: "AI Professional Development", specializations: [] },
            ]
        },
        {
            id: "data_accountability",
            label: "Data & Accountability",
            hasDeepMenu: false,
            aliases: ["data"],
            subCategories: [
                { id: "data_accountability_core", label: "Data & Accountability", specializations: [] },
                { id: "data_coaching", label: "Data Coaching", specializations: [] },
                { id: "data_analysis_systems_student", label: "Data Analysis (Systems/Student)", specializations: [] },
                { id: "visualization_dashboards", label: "Visualization & Dashboards", specializations: [] },
                { id: "state_reporting_compliance", label: "State Reporting Compliance", specializations: [] },
                { id: "predictive_analytics", label: "Predictive Analytics", specializations: [] },
            ]
        },
        {
            id: "grading_assessment",
            label: "Grading & Assessment",
            hasDeepMenu: false,
            subCategories: [
                { id: "standards_based_grading", label: "Standards-Based Grading", specializations: [] },
                { id: "competency_based_education", label: "Competency-Based Education", specializations: [] },
                { id: "equitable_grading_practices", label: "Equitable Grading Practices", specializations: [] },
                { id: "formative_summative_assessment", label: "Formative & Summative Assessment", specializations: [] },
                { id: "mastery_tracking_reporting", label: "Mastery Tracking & Reporting", specializations: [] },
            ]
        },
        {
            id: "instruction_curriculum",
            label: "Instruction & Curriculum",
            hasDeepMenu: false,
            aliases: ["instructional_coach", "math", "ell", "science"],
            subCategories: [
                { id: "math_intervention", label: "Math Intervention", specializations: [] },
                { id: "literacy_ela", label: "Literacy & ELA", specializations: [] },
                { id: "stem_steam", label: "STEM/STEAM", specializations: [] },
                { id: "esl_ell_support", label: "ESL/ELL Support", specializations: [] },
                { id: "differentiated_instruction", label: "Differentiated Instruction", specializations: [] },
                { id: "curriculum_mapping", label: "Curriculum Mapping", specializations: [] },
            ]
        },
        {
            id: "school_improvement",
            label: "School Improvement",
            hasDeepMenu: false,
            aliases: ["strategic_planning", "project_implementation"],
            subCategories: [
                { id: "school_turnaround_strategies", label: "School Turnaround Strategies", specializations: [] },
                { id: "culture_climate", label: "Culture & Climate", specializations: [] },
                { id: "strategic_planning", label: "Strategic Planning", specializations: [] },
                { id: "data_driven_decision_making", label: "Data-Driven Decision Making", specializations: [] },
                { id: "micip", label: "MICIP", specializations: [] },
            ]
        },
        {
            id: "leadership_operations",
            label: "Leadership & Operations",
            hasDeepMenu: false,
            aliases: ["leadership", "admin", "mgmt_planning", "human_resources", "accounting", "meeting_facilitation"],
            subCategories: [
                { id: "interim_administration", label: "Interim Administration", specializations: [] },
                { id: "board_relations_policy", label: "Board Relations & Policy", specializations: [] },
                { id: "human_resources", label: "Human Resources", specializations: [] },
                { id: "grant_writing", label: "Grant Writing", specializations: [] },
                { id: "payroll_financial_accounting", label: "Payroll & Financial Accounting", specializations: [] },
                { id: "keynote", label: "Keynote", specializations: [] },
            ]
        },
        {
            id: "student_support_services",
            label: "Student Support Services",
            hasDeepMenu: false,
            aliases: ["developmental_medical", "sped"],
            subCategories: [
                { id: "special_education_iep_lre", label: "Special Education (IEP/LRE)", specializations: [] },
                { id: "ot_pt_speech", label: "OT/PT & Speech", specializations: [] },
                { id: "mental_health_counseling", label: "Mental Health & Counseling", specializations: [] },
                { id: "504_coordination", label: "504 Coordination", specializations: [] },
                { id: "mtss_rti", label: "Multi-Tiered System of Supports (MTSS) & RtI", specializations: [] },
            ]
        },
    ],

    gradeLevelBands: [
        { id: "prek", label: "PreK" },
        { id: "k5", label: "K–5" },
        { id: "6_8", label: "6–8" },
        { id: "9_12", label: "9–12" },
        { id: "all", label: "All Grades" },
        { id: "other", label: "Other", allowTextInput: true },
    ],

    // Michigan ISDs: region ids match the official map (see Regions Google Doc).
    // Region 6 splits Wayne, Oakland, and Macomb out of Region 5.
    coverageRegions: [
        { id: "region_1", label: "Region 1 — Upper Peninsula" },
        { id: "region_2", label: "Region 2 — Northwest Lower Michigan" },
        { id: "region_3", label: "Region 3 — Northeast Lower Michigan" },
        { id: "region_4", label: "Region 4 — West & Central Michigan" },
        { id: "region_5", label: "Region 5 — Southeast Michigan" },
        { id: "region_6", label: "Metro Detroit (Wayne, Oakland, Macomb)" },
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
    if (found) return found.label;

    const legacyLabels: Record<string, string> = {
        admin: "Interim Administration",
        ell: "ESL/ELL Support",
        instructional_coach: "Differentiated Instruction",
        math: "Math Intervention",
        science: "STEM/STEAM",
        sped: "Special Education (IEP/LRE)",
    };
    if (legacyLabels[id]) return legacyLabels[id];

    for (const area of TAXONOMY.areasOfNeed) {
        const subCategory = area.subCategories.find((sub) => sub.id === id);
        if (subCategory) return subCategory.label;
        const specialization = area.subCategories
            .flatMap((sub) => sub.specializations as readonly TaxonomyOption[])
            .find((spec) => spec.id === id);
        if (specialization) return specialization.label;
        if ("aliases" in area && area.aliases.some((alias) => alias === id)) return area.label;
    }

    return id.replace(/_/g, " ");
}

export function getAreaOfNeedMatchIds(id: string): string[] {
    for (const area of TAXONOMY.areasOfNeed) {
        const areaIds = [
            area.id,
            ...("aliases" in area ? area.aliases : []),
            ...area.subCategories.flatMap((sub) => [
                sub.id,
                ...(sub.specializations as readonly TaxonomyOption[]).map((spec) => spec.id),
            ]),
        ];

        if (areaIds.includes(id)) return areaIds;
    }

    return [id];
}

export function getCoverageRegionLabel(id: string): string {
    const found = TAXONOMY.coverageRegions.find((r) => r.id === id);
    return found?.label ?? id.replace(/_/g, " ");
}

// Type exports for use across the app
export type AreaOfNeedId = typeof TAXONOMY.areasOfNeed[number]['id'];
export type GradeLevelId = typeof TAXONOMY.gradeLevelBands[number]['id'];
export type RegionId = typeof TAXONOMY.coverageRegions[number]['id'];
