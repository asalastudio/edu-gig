import type { AuthIntent } from "@/lib/auth-intent";

export type DistrictOnboardingRole = "superintendent" | "district_hr" | "district_admin";
export type DistrictFirstAction = "post_need" | "browse_educators" | "workspace";

export type EducatorSetupInput = {
    headline: string;
    bio: string;
    yearsExperience: number;
    hourlyRate?: number;
    gradeLevelBands: string[];
    areasOfNeed: string[];
    engagementTypes: string[];
    coverageRegions: string[];
};

export const DISTRICT_ROLE_OPTIONS: Array<{
    id: DistrictOnboardingRole;
    label: string;
    description: string;
    role: "superintendent" | "district_hr" | "district_admin";
}> = [
    {
        id: "superintendent",
        label: "Superintendent or cabinet",
        description: "Set hiring direction, staffing priorities, and district-level approvals.",
        role: "superintendent",
    },
    {
        id: "district_hr",
        label: "HR or talent leader",
        description: "Source educators, coordinate interviews, and manage staffing requests.",
        role: "district_hr",
    },
    {
        id: "district_admin",
        label: "Principal or campus leader",
        description: "Post campus needs and connect with educators for immediate support.",
        role: "district_admin",
    },
];

export const DISTRICT_FIRST_ACTIONS: Array<{
    id: DistrictFirstAction;
    label: string;
    description: string;
    href: "/post" | "/browse" | "/dashboard/district";
}> = [
    {
        id: "post_need",
        label: "Post a staffing need",
        description: "Start with the role, schedule, and context educators need to respond well.",
        href: "/post",
    },
    {
        id: "browse_educators",
        label: "Browse vetted educators",
        description: "Compare experience, rates, coverage, and availability before messaging.",
        href: "/browse",
    },
    {
        id: "workspace",
        label: "Open my workspace",
        description: "Review requests, messages, saved educators, and account settings first.",
        href: "/dashboard/district",
    },
];

export const EDUCATOR_AVAILABILITY_OPTIONS = [
    { id: "open", label: "Accept new district requests" },
    { id: "limited", label: "Limited availability" },
    { id: "closed", label: "Pause new requests" },
] as const;

export function roleForDistrictOnboarding(id: DistrictOnboardingRole) {
    return DISTRICT_ROLE_OPTIONS.find((option) => option.id === id)?.role ?? "district_admin";
}

export function destinationForFirstAction(action: DistrictFirstAction, fallback?: string | null) {
    if (fallback) return fallback;
    return DISTRICT_FIRST_ACTIONS.find((option) => option.id === action)?.href ?? "/dashboard/district";
}

export function defaultDestinationForIntent(intent: AuthIntent) {
    return intent === "educator" ? "/dashboard/educator/settings" : "/dashboard/district";
}

export function educatorProfileCompletionScore(input: EducatorSetupInput): number {
    let score = 0;
    if (input.headline.trim().length >= 12) score += 15;
    if (input.bio.trim().length >= 40) score += 20;
    if (input.yearsExperience >= 0) score += 10;
    if ((input.hourlyRate ?? 0) >= 20) score += 15;
    if (input.gradeLevelBands.length > 0) score += 10;
    if (input.areasOfNeed.length > 0) score += 10;
    if (input.engagementTypes.length > 0) score += 10;
    if (input.coverageRegions.length > 0) score += 10;
    return Math.min(100, score);
}
