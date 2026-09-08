/** Query param for sign-in / sign-up flows: who is signing in */
export type AuthIntent = "district" | "educator";

export const AUTH_INTENT_PARAM = "intent" as const;
export const AUTH_NEXT_PARAM = "next" as const;

export function isAuthIntent(v: string | null | undefined): v is AuthIntent {
    return v === "district" || v === "educator";
}

export function safeInternalPath(v: string | null | undefined): string | null {
    if (!v || !v.startsWith("/") || v.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(v)) return null;
    return v;
}

export function safeRedirectPath(v: string | null | undefined, currentOrigin?: string): string | null {
    const internal = safeInternalPath(v);
    if (internal) return internal;
    if (!v || !currentOrigin) return null;

    try {
        const url = new URL(v);
        if (url.origin !== currentOrigin) return null;
        return `${url.pathname}${url.search}${url.hash}`;
    } catch {
        return null;
    }
}

export function onboardingPath(intent: AuthIntent | null, next?: string | null): string {
    const params = new URLSearchParams();
    if (intent) params.set(AUTH_INTENT_PARAM, intent);
    const safeNext = safeInternalPath(next);
    if (safeNext) params.set(AUTH_NEXT_PARAM, safeNext);
    const suffix = params.toString();
    return suffix ? `/onboarding?${suffix}` : "/onboarding";
}

export function afterAuthPath(intent: AuthIntent | null, next?: string | null): string {
    const safeNext = safeInternalPath(next);
    if (safeNext?.startsWith("/dashboard/admin")) return safeNext;
    return onboardingPath(intent, safeNext);
}

export function authPagePath(pathname: "/sign-in" | "/sign-up", intent: AuthIntent | null, next?: string | null): string {
    const params = new URLSearchParams();
    if (intent) params.set(AUTH_INTENT_PARAM, intent);
    const safeNext = safeInternalPath(next);
    if (safeNext) params.set("next", safeNext);
    const suffix = params.toString();
    return suffix ? `${pathname}?${suffix}` : pathname;
}

/** Map intent to default dashboard after onboarding */
export function dashboardPathForIntent(intent: AuthIntent): "/dashboard/district" | "/dashboard/educator" {
    return intent === "educator" ? "/dashboard/educator" : "/dashboard/district";
}

const INTENT_STORAGE_KEY = "k12gig:auth-intent";

/**
 * Persist the chosen intent so it survives Clerk's redirect round-trip.
 * Clerk's OAuth (Google) flow and the static NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL
 * can land on /onboarding without the ?intent= param, which would otherwise
 * make onboarding ask district-vs-educator a second time.
 */
export function rememberAuthIntent(intent: AuthIntent | null): void {
    if (typeof window === "undefined" || !intent) return;
    try {
        window.sessionStorage.setItem(INTENT_STORAGE_KEY, intent);
    } catch {
        /* storage unavailable (private mode, etc.) — non-fatal */
    }
}

export function recallAuthIntent(): AuthIntent | null {
    if (typeof window === "undefined") return null;
    try {
        const value = window.sessionStorage.getItem(INTENT_STORAGE_KEY);
        return isAuthIntent(value) ? value : null;
    } catch {
        return null;
    }
}

export function clearAuthIntent(): void {
    if (typeof window === "undefined") return;
    try {
        window.sessionStorage.removeItem(INTENT_STORAGE_KEY);
    } catch {
        /* non-fatal */
    }
}

/** Map Convex / app role to intent (for redirects) */
export function intentFromRole(
    role: "educator" | "district_admin" | "district_hr" | "superintendent" | "superadmin"
): AuthIntent {
    if (role === "educator") return "educator";
    return "district";
}
