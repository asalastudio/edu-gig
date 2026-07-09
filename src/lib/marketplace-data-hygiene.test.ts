import { describe, expect, it } from "vitest";
import {
    classifyMarketplaceNeed,
    classifyMarketplaceNeedReviewSignals,
    classifyMarketplaceUser,
    classifyMarketplaceDistrict,
    computeCandidateDigest,
    getIncompletePublishedNeedFields,
} from "./marketplace-data-hygiene";

describe("classifyMarketplaceUser", () => {
    it.each([
        [
            {
                clerkId: "seed:demo-educator@example.com",
                email: "demo-educator@example.com",
                firstName: "Sarah",
                lastName: "Jenkins",
            },
            "seed_clerk_id",
        ],
        [
            {
                clerkId: "user_qa",
                email: "qa-educator-jul6+clerk_test@example.com",
                firstName: "QA",
                lastName: "Educator",
            },
            "clerk_test_email",
        ],
        [
            {
                clerkId: "user_test",
                email: "person@k12gig.com",
                firstName: "Dr.",
                lastName: "Teach Test",
            },
            "test_name",
        ],
    ])("flags explainable QA/test identities", (user, expectedReason) => {
        expect(classifyMarketplaceUser(user)).toContain(expectedReason);
    });

    it("does not flag legitimate names containing the same letters", () => {
        expect(
            classifyMarketplaceUser({
                clerkId: "user_real",
                email: "celeste@district.org",
                firstName: "Celeste",
                lastName: "Testament",
            })
        ).toEqual([]);
    });
});

describe("classifyMarketplaceDistrict", () => {
    it.each([
        [{ name: "TEST 1", nceaId: undefined }, "test_name"],
        [{ name: "QA Walkthrough Public Schools", nceaId: undefined }, "qa_name"],
        [{ name: "Ann Arbor Public Schools (Demo)", nceaId: "demo-ann-arbor-ps" }, "demo_name"],
        [{ name: "Example District", nceaId: "demo-example" }, "demo_identifier"],
    ])("flags test/demo districts with a reason", (district, expectedReason) => {
        expect(classifyMarketplaceDistrict(district)).toContain(expectedReason);
    });

    it("does not flag a legitimate district", () => {
        expect(
            classifyMarketplaceDistrict({
                name: "Grand Testimony Community Schools",
                nceaId: "mi-12345",
            })
        ).toEqual([]);
    });
});

describe("classifyMarketplaceNeed", () => {
    it("limits automatic cleanup candidates to QA/test organization markers", () => {
        expect(
            classifyMarketplaceNeed({
                orgName: "QA Walkthrough Public Schools",
                description: "test listing please ignore",
            })
        ).toEqual(["qa_org_name"]);
    });

    it("keeps broad narrative words review-only so legitimate listings cannot be deleted", () => {
        const need = {
            orgName: "Lansing Public Schools",
            description: "Help our team analyze state test results and improve assessment practice.",
        };

        expect(classifyMarketplaceNeed(need)).toEqual([]);
        expect(classifyMarketplaceNeedReviewSignals(need)).toEqual(["test_description"]);
    });

    it("does not flag normal opportunity language", () => {
        expect(
            classifyMarketplaceNeed({
                orgName: "Grand Rapids Public Schools",
                description: "Support teachers with assessment design and curriculum alignment.",
            })
        ).toEqual([]);
    });
});

describe("computeCandidateDigest", () => {
    it("is order-independent and changes when the reviewed candidate set drifts", async () => {
        const reviewed = await computeCandidateDigest(["need:b", "user:a"]);
        const reordered = await computeCandidateDigest(["user:a", "need:b"]);
        const drifted = await computeCandidateDigest(["user:a", "need:b", "proposal:c"]);

        expect(reordered).toBe(reviewed);
        expect(drifted).not.toBe(reviewed);
    });
});

describe("getIncompletePublishedNeedFields", () => {
    it("returns missing publish fields for open legacy listings", () => {
        expect(
            getIncompletePublishedNeedFields({
                status: "open",
                orgName: "Test District",
                areaOfNeed: "instruction_curriculum",
            })
        ).toEqual([
            "subCategory",
            "gradeLevel",
            "startDate",
            "duration",
            "compensationRange",
            "description",
        ]);
    });

    it("does not classify drafts or closed listings as published-quality failures", () => {
        const partial = {
            orgName: "District",
            areaOfNeed: "instruction_curriculum",
        };
        expect(getIncompletePublishedNeedFields({ ...partial, status: "draft" })).toEqual([]);
        expect(getIncompletePublishedNeedFields({ ...partial, status: "closed" })).toEqual([]);
    });
});
