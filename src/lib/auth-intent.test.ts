import { describe, expect, it } from "vitest";
import { afterAuthPath, authPagePath, onboardingPath, safeInternalPath, safeRedirectPath } from "./auth-intent";

describe("safeInternalPath", () => {
    it("accepts app-relative paths", () => {
        expect(safeInternalPath("/post")).toBe("/post");
        expect(safeInternalPath("/dashboard/district?tab=needs")).toBe("/dashboard/district?tab=needs");
    });

    it("rejects empty and protocol-relative paths", () => {
        expect(safeInternalPath(null)).toBeNull();
        expect(safeInternalPath("https://example.com")).toBeNull();
        expect(safeInternalPath("//example.com")).toBeNull();
    });
});

describe("safeRedirectPath", () => {
    it("accepts Clerk same-origin redirect URLs", () => {
        expect(safeRedirectPath("http://localhost:3003/dashboard/admin", "http://localhost:3003")).toBe("/dashboard/admin");
    });

    it("rejects external absolute URLs", () => {
        expect(safeRedirectPath("https://evil.example/dashboard/admin", "http://localhost:3003")).toBeNull();
    });
});

describe("onboardingPath", () => {
    it("preserves intent and safe next path through setup", () => {
        expect(onboardingPath("district", "/post")).toBe("/onboarding?intent=district&next=%2Fpost");
    });

    it("drops unsafe next paths", () => {
        expect(onboardingPath("educator", "//example.com")).toBe("/onboarding?intent=educator");
    });
});

describe("afterAuthPath", () => {
    it("sends admin redirects straight to the admin gate", () => {
        expect(afterAuthPath(null, "/dashboard/admin")).toBe("/dashboard/admin");
    });

    it("keeps normal users on the onboarding path", () => {
        expect(afterAuthPath("district", "/post")).toBe("/onboarding?intent=district&next=%2Fpost");
    });
});

describe("authPagePath", () => {
    it("preserves a safe admin next path while switching between auth pages", () => {
        expect(authPagePath("/sign-up", null, "/dashboard/admin")).toBe("/sign-up?next=%2Fdashboard%2Fadmin");
    });
});
