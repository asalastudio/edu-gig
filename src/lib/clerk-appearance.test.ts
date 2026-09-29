import { describe, expect, it } from "vitest";
import { clerkCardAppearance } from "./clerk-appearance";

describe("clerkCardAppearance", () => {
    it("hides Clerk's built-in footer switcher so pages keep one custom path", () => {
        expect(clerkCardAppearance.elements.footerAction).toBe("hidden");
        expect(clerkCardAppearance.elements.footerActionText).toBe("hidden");
        expect(clerkCardAppearance.elements.footerActionLink).toBe("hidden");
    });
});
