import { describe, it, expect } from "vitest";
import { getMockEducatorById, getMockEducatorProfileView, MOCK_EDUCATORS } from "./mock-educators";

describe("mock educators", () => {
    it("exports at least 25 demo educators", () => {
        expect(MOCK_EDUCATORS.length).toBeGreaterThanOrEqual(25);
    });

    it("resolves profile data by id", () => {
        const card = getMockEducatorById("e_1");
        expect(card?.name).toContain("Sarah");

        const profile = getMockEducatorProfileView("e_1");
        expect(profile?.headline).toBeTruthy();
        expect(profile?.availableDays.M).toBeDefined();
    });

    it("returns null for unknown id", () => {
        expect(getMockEducatorProfileView("unknown")).toBeNull();
    });
});
