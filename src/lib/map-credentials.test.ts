import { describe, it, expect } from "vitest";
import { formatCredentialType, formatExpiry } from "./map-credentials";

describe("formatCredentialType", () => {
    it("returns friendly labels for known types", () => {
        expect(formatCredentialType("state_license")).toBe("State License");
        expect(formatCredentialType("certification")).toBe("Certification");
        expect(formatCredentialType("degree")).toBe("Degree");
        expect(formatCredentialType("endorsement")).toBe("Endorsement");
    });

    it("title-cases unknown snake_case codes as a fallback", () => {
        expect(formatCredentialType("other_code")).toBe("Other Code");
    });

    it("does not mangle single-token unknowns", () => {
        expect(formatCredentialType("misc")).toBe("Misc");
    });
});

describe("formatExpiry", () => {
    const today = new Date(Date.UTC(2026, 3, 19)); // 2026-04-19

    it("returns 'No expiration' when expiry is missing or blank", () => {
        expect(formatExpiry(undefined, today)).toBe("No expiration");
        expect(formatExpiry(null, today)).toBe("No expiration");
        expect(formatExpiry("", today)).toBe("No expiration");
        expect(formatExpiry("   ", today)).toBe("No expiration");
    });

    it("labels future dates with Expires", () => {
        expect(formatExpiry("2027-06-01", today)).toBe("Expires 2027-06-01");
    });

    it("labels past dates as Expired", () => {
        expect(formatExpiry("2025-01-01", today)).toBe("Expired 2025-01-01");
    });

    it("treats today's date as still-valid (not Expired)", () => {
        expect(formatExpiry("2026-04-19", today)).toBe("Expires 2026-04-19");
    });

    it("falls back to Expires for unparseable strings", () => {
        expect(formatExpiry("not-a-date", today)).toBe("Expires not-a-date");
    });
});
