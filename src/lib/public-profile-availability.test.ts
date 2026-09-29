import { describe, expect, it } from "vitest";
import { publicProfileAvailabilityCopy } from "./public-profile-availability";

describe("publicProfileAvailabilityCopy", () => {
    it("uses open / limited / closed labels and never says Available now", () => {
        expect(publicProfileAvailabilityCopy("open").label).toBe("Open to New Clients");
        expect(publicProfileAvailabilityCopy("limited").label).toBe("Limited Availability");
        expect(publicProfileAvailabilityCopy("closed").label).toBe("Not Accepting New Clients");

        for (const status of ["open", "limited", "closed"] as const) {
            const copy = publicProfileAvailabilityCopy(status);
            expect(copy.label).not.toMatch(/available now/i);
            expect(copy.hint).not.toMatch(/available now/i);
            expect(copy.hint).toMatch(/confirmed directly/i);
        }
    });
});
