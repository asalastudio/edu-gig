import { describe, expect, it } from "vitest";
import {
    defaultDestinationForIntent,
    destinationForFirstAction,
    educatorProfileCompletionScore,
    roleForDistrictOnboarding,
} from "./onboarding";

describe("district onboarding helpers", () => {
    it("maps superintendent setup to the superintendent role", () => {
        expect(roleForDistrictOnboarding("superintendent")).toBe("superintendent");
        expect(roleForDistrictOnboarding("district_hr")).toBe("district_hr");
        expect(roleForDistrictOnboarding("district_admin")).toBe("district_admin");
    });

    it("routes the first district action while honoring a safe fallback", () => {
        expect(destinationForFirstAction("post_need")).toBe("/post");
        expect(destinationForFirstAction("browse_educators")).toBe("/browse");
        expect(destinationForFirstAction("workspace", "/dashboard/messages")).toBe("/dashboard/messages");
    });
});

describe("educator onboarding helpers", () => {
    it("scores a complete launch profile at 100", () => {
        expect(
            educatorProfileCompletionScore({
                headline: "Math interventionist and instructional coach",
                bio: "I support campuses with intervention design, data cycles, and practical coaching routines.",
                yearsExperience: 8,
                hourlyRate: 95,
                gradeLevelBands: ["6_8"],
                areasOfNeed: ["instruction_curriculum"],
                engagementTypes: ["consulting"],
                coverageRegions: ["region_2"],
            })
        ).toBe(100);
    });

    it("keeps incomplete profiles visibly below launch strength", () => {
        expect(
            educatorProfileCompletionScore({
                headline: "Coach",
                bio: "",
                yearsExperience: 0,
                gradeLevelBands: [],
                areasOfNeed: [],
                engagementTypes: [],
                coverageRegions: [],
            })
        ).toBe(10);
    });

    it("defaults educator completion to settings after setup", () => {
        expect(defaultDestinationForIntent("educator")).toBe("/dashboard/educator/settings");
    });
});
