/** Query param for sign-in / sign-up flows: who is signing in */
export type AuthIntent = "district" | "educator";

export const AUTH_INTENT_PARAM = "intent" as const;

export function isAuthIntent(v: string | null | undefined): v is AuthIntent {
    return v === "district" || v === "educator";
}

/** Map intent to default dashboard after onboarding */
export function dashboardPathForIntent(intent: AuthIntent): "/dashboard/district" | "/dashboard/educator" {
    return intent === "educator" ? "/dashboard/educator" : "/dashboard/district";
}

/** Map Convex / app role to intent (for redirects) */
export function intentFromRole(
    role: "educator" | "district_admin" | "district_hr" | "superintendent" | "superadmin"
): AuthIntent {
    if (role === "educator") return "educator";
    return "district";
}
