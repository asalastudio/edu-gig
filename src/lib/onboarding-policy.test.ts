import { describe, expect, it } from "vitest";
import { PRIVACY_VERSION, TERMS_VERSION } from "@/lib/legal";
import {
    ONBOARDING_ERRORS,
    resolveLegalAcceptance,
    resolveOnboardingEmail,
} from "../../convex/lib/onboardingPolicy";

describe("resolveOnboardingEmail", () => {
    it("returns the normalized email when present and verified", () => {
        expect(resolveOnboardingEmail({ email: "  Chris@Example.com ", emailVerified: true })).toBe(
            "chris@example.com"
        );
    });

    it("allows an email when the token omits the verified claim", () => {
        expect(resolveOnboardingEmail({ email: "chris@example.com" })).toBe("chris@example.com");
    });

    it("fails closed when the identity carries no email", () => {
        expect(() => resolveOnboardingEmail({})).toThrow(ONBOARDING_ERRORS.missingEmail);
        expect(() => resolveOnboardingEmail({ email: "" })).toThrow(ONBOARDING_ERRORS.missingEmail);
        expect(() => resolveOnboardingEmail({ email: "not-an-email" })).toThrow(ONBOARDING_ERRORS.missingEmail);
    });

    it("never fabricates a placeholder address", () => {
        expect(() => resolveOnboardingEmail({ email: null })).toThrow();
    });

    it("rejects an email Clerk reports as unverified", () => {
        expect(() => resolveOnboardingEmail({ email: "chris@example.com", emailVerified: false })).toThrow(
            ONBOARDING_ERRORS.unverifiedEmail
        );
    });
});

describe("resolveLegalAcceptance", () => {
    const now = 1_756_760_000_000;

    it("stamps the current versions with the server clock", () => {
        expect(resolveLegalAcceptance({ termsVersion: TERMS_VERSION, privacyVersion: PRIVACY_VERSION }, now)).toEqual({
            termsAcceptedAt: now,
            termsVersion: TERMS_VERSION,
            privacyAcceptedAt: now,
            privacyVersion: PRIVACY_VERSION,
        });
    });

    it("requires explicit acceptance instead of defaulting", () => {
        expect(() => resolveLegalAcceptance({}, now)).toThrow(ONBOARDING_ERRORS.legalRequired);
        expect(() => resolveLegalAcceptance({ termsVersion: TERMS_VERSION }, now)).toThrow(
            ONBOARDING_ERRORS.legalRequired
        );
        expect(() => resolveLegalAcceptance({ privacyVersion: PRIVACY_VERSION }, now)).toThrow(
            ONBOARDING_ERRORS.legalRequired
        );
    });

    it("rejects acceptance of a superseded version", () => {
        expect(() => resolveLegalAcceptance({ termsVersion: "2026-05-02", privacyVersion: PRIVACY_VERSION }, now)).toThrow(
            ONBOARDING_ERRORS.legalStale
        );
        expect(() => resolveLegalAcceptance({ termsVersion: TERMS_VERSION, privacyVersion: "1999-01-01" }, now)).toThrow(
            ONBOARDING_ERRORS.legalStale
        );
    });
});
