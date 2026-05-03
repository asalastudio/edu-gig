import { describe, expect, it } from "vitest";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { mapConvexEducatorToProfileView } from "./map-convex-educator-profile";

const user = {
    _id: "user_1" as Id<"users">,
    _creationTime: 1,
    clerkId: "clerk_1",
    role: "educator",
    email: "sarah@example.com",
    firstName: "Dr. Sarah",
    lastName: "Jenkins",
    avatarUrl: "https://example.com/sarah.jpg",
    onboarded: true,
    createdAt: 1,
} satisfies Doc<"users">;

const educator = {
    _id: "educator_1" as Id<"educators">,
    _creationTime: 1,
    userId: user._id,
    headline: "Math Interventionist and Instructional Coach",
    bio: "Supports district math teams with intervention design.",
    yearsExperience: 14,
    gradeLevelBands: ["6_8", "9_12"],
    areasOfNeed: ["instruction_curriculum", "data"],
    subCategories: [],
    engagementTypes: ["consulting"],
    coverageRegions: ["region_1"],
    stateLicenses: [],
    verificationStatus: "premier",
    availabilityStatus: "open",
    hourlyRate: 95,
    isActive: true,
    profileCompletePct: 90,
} satisfies Doc<"educators">;

describe("mapConvexEducatorToProfileView", () => {
    it("maps Convex educator rows into public profile view data", () => {
        const view = mapConvexEducatorToProfileView(educator, user);

        expect(view.name).toBe("Dr. Sarah Jenkins");
        expect(view.initials).toBe("SJ");
        expect(view.verificationTier).toBe("premier");
        expect(view.primarySubjectLabel).toBe("Instruction and Curriculum");
        expect(view.gradeLevelsLabel).toBe("6–8, 9–12");
        expect(view.startingRate).toBe(95);
        expect(view.rateUnit).toBe("hour");
        expect(view.badges).toContain("Premier educator");
    });

    it("falls back cleanly for incomplete pending educators", () => {
        const pending = {
            ...educator,
            verificationStatus: "pending",
            availabilityStatus: "closed",
            gradeLevelBands: ["all"],
            areasOfNeed: [],
            hourlyRate: undefined,
            dailyRate: 650,
            profileCompletePct: 20,
        } satisfies Doc<"educators">;

        const pendingUser = {
            ...user,
            firstName: "",
            lastName: "",
            avatarUrl: undefined,
        } satisfies Doc<"users">;

        const view = mapConvexEducatorToProfileView(pending, pendingUser);

        expect(view.name).toBe("Educator");
        expect(view.initials).toBe("E");
        expect(view.verificationTier).toBe("basic");
        expect(view.gradeLevelsLabel).toBe("All grades");
        expect(view.areas).toEqual(["K-12 support"]);
        expect(view.startingRate).toBe(650);
        expect(view.rateUnit).toBe("day");
        expect(view.availableDays.M.am).toBe(false);
    });
});
