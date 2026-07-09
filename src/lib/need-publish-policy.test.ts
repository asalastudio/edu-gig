import { describe, expect, it } from "vitest";
import {
    getNeedPublishIssues,
    isNeedPublishReady,
    normalizeNeedInput,
    type NeedInput,
} from "./need-publish-policy";

const completeNeed: NeedInput = {
    orgName: " Ann Arbor Public Schools ",
    areaOfNeed: "instruction_curriculum",
    subCategory: "curriculum_mapping",
    gradeLevel: "6_8",
    engagementType: "consulting",
    startDate: "2026-09-01",
    duration: "One semester",
    compensationRange: "$80–$100/hour",
    description:
        "Partner with our middle-school team to align curriculum maps, pacing, and common assessments for the fall semester.",
};

describe("normalizeNeedInput", () => {
    it("trims required values and removes blank optional values", () => {
        expect(
            normalizeNeedInput({
                ...completeNeed,
                orgName: "  Ann Arbor Public Schools  ",
                subCategory: "   ",
                duration: "  One semester  ",
            })
        ).toMatchObject({
            orgName: "Ann Arbor Public Schools",
            subCategory: undefined,
            duration: "One semester",
        });
    });
});

describe("getNeedPublishIssues", () => {
    it("reports every marketplace field missing from a materially empty need", () => {
        const issues = getNeedPublishIssues({
            orgName: "Test District",
            areaOfNeed: "instruction_curriculum",
        });

        expect(issues.map((issue) => issue.field)).toEqual([
            "subCategory",
            "gradeLevel",
            "startDate",
            "duration",
            "compensationRange",
            "description",
        ]);
    });

    it("requires a subcategory only when the selected support type offers one", () => {
        const withKnownArea = getNeedPublishIssues({
            ...completeNeed,
            subCategory: undefined,
        });
        const withUnknownLegacyArea = getNeedPublishIssues({
            ...completeNeed,
            areaOfNeed: "legacy_specialist_area",
            subCategory: undefined,
        });

        expect(withKnownArea.some((issue) => issue.field === "subCategory")).toBe(true);
        expect(withUnknownLegacyArea.some((issue) => issue.field === "subCategory")).toBe(false);
    });

    it("rejects placeholder-length logistics and descriptions", () => {
        const issues = getNeedPublishIssues({
            ...completeNeed,
            duration: "TBD",
            compensationRange: "$0",
            description: "Need help soon.",
        });

        expect(issues).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ field: "compensationRange" }),
                expect.objectContaining({ field: "description" }),
            ])
        );
        expect(issues.some((issue) => issue.field === "duration")).toBe(false);
    });

    it("accepts a complete, useful need", () => {
        expect(getNeedPublishIssues(completeNeed)).toEqual([]);
        expect(isNeedPublishReady(completeNeed)).toBe(true);
    });

    it("never treats whitespace-only required values as complete", () => {
        expect(
            isNeedPublishReady({
                ...completeNeed,
                orgName: "   ",
                description: "   ",
            })
        ).toBe(false);
    });
});
