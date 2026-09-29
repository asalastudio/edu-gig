import { describe, expect, it } from "vitest";
import { clerkCardAppearance, clerkHiddenElement } from "./clerk-appearance";

describe("clerkCardAppearance", () => {
    it("hides Clerk header and footer switcher with inline display:none, not Tailwind classes", () => {
        expect(clerkHiddenElement).toEqual({ display: "none" });
        expect(clerkCardAppearance.elements.header).toEqual({ display: "none" });
        expect(clerkCardAppearance.elements.headerTitle).toEqual({ display: "none" });
        expect(clerkCardAppearance.elements.headerSubtitle).toEqual({ display: "none" });
        expect(clerkCardAppearance.elements.footer).toEqual({ display: "none" });
        expect(clerkCardAppearance.elements.footerAction).toEqual({ display: "none" });
        expect(clerkCardAppearance.elements.footerActionText).toEqual({ display: "none" });
        expect(clerkCardAppearance.elements.footerActionLink).toEqual({ display: "none" });
    });

    it("restyles the primary button via style objects so Clerk CSS cannot override Tailwind", () => {
        expect(clerkCardAppearance.variables.colorPrimary).toBe("#214E3F");
        expect(clerkCardAppearance.elements.formButtonPrimary.backgroundColor).toBe(
            "var(--accent-primary)"
        );
    });
});
