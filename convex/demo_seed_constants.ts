/**
 * Shared demo account emails — `@example.com` + `+clerk_test` for Clerk dev email-code sign-in.
 * Verification code is always `424242` (see DEMO_SEED_EMAIL_CODE).
 */
export const DEMO_SEED_EMAILS = {
    district: "demo-district+clerk_test@example.com",
    educator1: "demo-educator1+clerk_test@example.com",
    educator2: "demo-educator2+clerk_test@example.com",
    educator3: "demo-educator3+clerk_test@example.com",
} as const;

/** Clerk dev test OTP for any `+clerk_test` email (no real email sent). */
export const DEMO_SEED_EMAIL_CODE = "424242";

export function demoSeedClerkId(email: string): string {
    return `seed:${email.trim().toLowerCase()}`;
}

export function isDemoSeedClerkId(clerkId: string): boolean {
    return clerkId.startsWith("seed:");
}
