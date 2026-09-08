import { describe, expect, it } from "vitest";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import {
    mapConvexEducatorToProfileView,
    type PublicCredentialRow,
} from "./map-convex-educator-profile";

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
    coverageRegions: ["region_6"],
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
        expect(view.verificationTier).toBe("basic");
        expect(view.primarySubjectLabel).toBe("Instruction & Curriculum");
        expect(view.gradeLevelsLabel).toBe("6–8, 9–12");
        expect(view.startingRate).toBe(95);
        expect(view.rateUnit).toBe("hour");
        expect(view.rateLabel).toBe("$95/hr");
        expect(view.badges).toContain("Profile in progress");
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
        expect(view.rateLabel).toBe("$650/day");
        expect(view.availableDays.M.am).toBe(false);
    });

    it("shows the business name as the headline with the personal name secondary", () => {
        const business = {
            ...educator,
            businessName: "SparkSum Learning",
        } satisfies Doc<"educators">;

        const view = mapConvexEducatorToProfileView(business, user);

        expect(view.name).toBe("SparkSum Learning");
        expect(view.secondaryName).toBe("Dr. Sarah Jenkins");
        expect(view.initials).toBe("SL");
    });

    it("never shows the email as the name even when the personal name is empty", () => {
        const business = {
            ...educator,
            businessName: "SparkSum Learning",
        } satisfies Doc<"educators">;
        const nameless = { ...user, firstName: "", lastName: "" } satisfies Doc<"users">;

        const view = mapConvexEducatorToProfileView(business, nameless);

        expect(view.name).toBe("SparkSum Learning");
        expect(view.secondaryName).toBeUndefined();
    });

    it("keeps personal-name behavior unchanged when no business name is set", () => {
        const view = mapConvexEducatorToProfileView(educator, user);
        expect(view.name).toBe("Dr. Sarah Jenkins");
        expect(view.secondaryName).toBeUndefined();
    });

    it("maps real credential rows when provided", () => {
        const rows: PublicCredentialRow[] = [
            {
                id: "cred_1",
                type: "state_license",
                title: "Professional Teaching Certificate",
                issuingBody: "MDE",
                state: "MI",
                issueDate: "2020-01-01",
                expiryDate: "2027-06-30",
                verified: true,
                reviewed: true,
                hasFile: true,
            },
            {
                id: "cred_2",
                type: "certification",
                title: "Data Coach Certification",
                issuingBody: "Learning Forward",
                issueDate: "2023-05-01",
                verified: false,
                hasFile: false,
            },
        ];

        const view = mapConvexEducatorToProfileView(educator, user, rows);

        expect(view.licenses).toHaveLength(2);
        expect(view.licenses[0]).toMatchObject({
            type: "Professional Teaching Certificate",
            issuer: "MDE (MI)",
            status: "Credentials reviewed",
            expiry: "2027-06-30",
            credentialId: "cred_1",
            hasFile: true,
        });
        expect(view.licenses[1]).toMatchObject({
            issuer: "Learning Forward",
            status: "Submitted",
            expiry: "—",
            hasFile: false,
        });
        expect(view.certCount).toBe(2);
        expect(view.badges).toContain("Credentials reviewed");
    });

    it("does not claim credentials were reviewed when every fetched row is only submitted", () => {
        const rows: PublicCredentialRow[] = [
            {
                id: "cred_submitted",
                type: "certification",
                title: "Literacy Coach Certification",
                issuingBody: "Learning Forward",
                issueDate: "2024-05-01",
                verified: false,
                hasFile: true,
            },
        ];

        const view = mapConvexEducatorToProfileView(educator, user, rows);

        expect(view.badges).not.toContain("Credentials reviewed");
        expect(view.badges).toContain("Profile in progress");
        expect(view.certCount).toBe(1);
    });

    it("never synthesizes placeholder credentials when rows are not fetched", () => {
        const view = mapConvexEducatorToProfileView(educator, user);
        expect(view.licenses).toEqual([]);
        expect(view.certCount).toBe(0);
        expect(view.badges).not.toContain("Credentials reviewed");
    });

    it("returns an empty credentials list (not placeholders) for a fetched empty set", () => {
        const view = mapConvexEducatorToProfileView(educator, user, []);
        expect(view.licenses).toEqual([]);
        expect(view.certCount).toBe(0);
        expect(view.badges).not.toContain("Credentials reviewed");
    });

    it("passes through presenter bio and team members", () => {
        const full = {
            ...educator,
            presenterBio: "Laura leads SCECH-accredited data workshops.",
            teamMembers: [
                { name: "Alex Partner", title: "Co-founder", bio: "Runs literacy strand." },
            ],
        } satisfies Doc<"educators">;

        const view = mapConvexEducatorToProfileView(full, user);

        expect(view.presenterBio).toBe("Laura leads SCECH-accredited data workshops.");
        expect(view.teamMembers).toEqual([
            { name: "Alex Partner", title: "Co-founder", bio: "Runs literacy strand." },
        ]);

        const bare = mapConvexEducatorToProfileView(educator, user);
        expect(bare.presenterBio).toBeUndefined();
        expect(bare.teamMembers).toBeUndefined();
        expect(bare.avgRating).toBe(0);
        expect(bare.reviewCount).toBe(0);
    });

    it("does not infer a background check from a legacy check id and status", () => {
        const verified = {
            ...educator,
            verificationStatus: "verified" as const,
            backgroundCheckId: "chk_123",
        };
        expect(mapConvexEducatorToProfileView(verified, user).badges).not.toContain("Background check complete");

        const pendingWithId = {
            ...educator,
            verificationStatus: "pending" as const,
            backgroundCheckId: "chk_123",
        };
        expect(mapConvexEducatorToProfileView(pendingWithId, user).badges).not.toContain("Background check complete");
        expect(mapConvexEducatorToProfileView(educator, user).badges).not.toContain("Background check complete");
    });
});
