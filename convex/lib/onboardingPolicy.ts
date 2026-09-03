import { PRIVACY_VERSION, TERMS_VERSION } from "../../src/lib/legal";

export const ONBOARDING_ERRORS = {
    missingEmail:
        "A verified email address is required to complete onboarding. Add and verify an email on your account, then try again.",
    unverifiedEmail:
        "Your email address has not been verified yet. Verify it on your account, then try again.",
    legalRequired: "You must accept the current Terms of Service and Privacy Policy to continue.",
    legalStale:
        "The Terms of Service or Privacy Policy have been updated. Reload the page and accept the current versions to continue.",
} as const;

export interface IdentityEmailClaims {
    email?: string | null;
    emailVerified?: boolean | null;
}

function normalizeEmail(value: string | null | undefined) {
    return (value ?? "").trim().toLowerCase();
}

/**
 * Fail closed on the identity email.
 *
 * Onboarding previously fabricated `<clerkId>@placeholder.local` when the
 * Clerk token carried no email. That silently created accounts that could
 * never be contacted. Now: no email → reject; email explicitly marked as
 * unverified → reject. A token that omits the `email_verified` claim entirely
 * is treated as unknown and allowed, so a JWT template without that claim
 * does not block every sign-up.
 */
export function resolveOnboardingEmail(identity: IdentityEmailClaims): string {
    const email = normalizeEmail(identity.email);
    if (!email || !email.includes("@")) {
        throw new Error(ONBOARDING_ERRORS.missingEmail);
    }
    if (identity.emailVerified === false) {
        throw new Error(ONBOARDING_ERRORS.unverifiedEmail);
    }
    return email;
}

export interface LegalAcceptanceArgs {
    termsVersion?: string;
    privacyVersion?: string;
}

export interface LegalAcceptancePatch {
    termsAcceptedAt: number;
    termsVersion: string;
    privacyAcceptedAt: number;
    privacyVersion: string;
}

/**
 * Require an explicit acceptance of the *current* legal versions and stamp
 * it with the server clock. The client no longer supplies the timestamp and
 * the server never defaults a missing version to "accepted".
 */
export function resolveLegalAcceptance(args: LegalAcceptanceArgs, now: number): LegalAcceptancePatch {
    const terms = (args.termsVersion ?? "").trim();
    const privacy = (args.privacyVersion ?? "").trim();
    if (!terms || !privacy) {
        throw new Error(ONBOARDING_ERRORS.legalRequired);
    }
    if (terms !== TERMS_VERSION || privacy !== PRIVACY_VERSION) {
        throw new Error(ONBOARDING_ERRORS.legalStale);
    }
    return {
        termsAcceptedAt: now,
        termsVersion: TERMS_VERSION,
        privacyAcceptedAt: now,
        privacyVersion: PRIVACY_VERSION,
    };
}
