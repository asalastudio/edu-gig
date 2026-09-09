import { describe, expect, it } from "vitest";
import type { EducatorCardProps } from "@/components/shared/educator-card";
import {
    educatorMatchesDirectoryFilters,
    filterEducatorRoster,
    orderAreasForDisplay,
    type DirectoryFilterState,
} from "./filter-educators";

const educator: EducatorCardProps = {
    id: "educator_1",
    name: "Dr. Teach",
    headline: "Data systems specialist",
    verificationTier: "verified",
    overallRating: 4.9,
    reviewCount: 10,
    gradeLevels: ["6_8"],
    areasOfNeed: ["data_accountability", "ai_edtech"],
    engagementTypes: ["consulting"],
    coverageRegions: ["region_5"],
    startingRate: 100,
    rateUnit: "hour",
    availabilityStatus: "open",
    hasVideoIntro: false,
};

const noFilters: DirectoryFilterState = {
    selectedAreas: [],
    selectedGrades: [],
    selectedRegions: [],
    selectedEngagements: [],
    verifiedOnly: false,
    availableNow: false,
    showSavedOnly: false,
    savedEducatorIds: [],
    activeQuickFilter: null,
};

describe("educatorMatchesDirectoryFilters", () => {
    it("rejects the exact audit mismatch for Instruction & Curriculum", () => {
        expect(
            educatorMatchesDirectoryFilters(educator, {
                ...noFilters,
                selectedAreas: ["instruction_curriculum"],
                availableNow: true,
            })
        ).toBe(false);
    });

    it("matches canonical areas through a stored legacy alias or subcategory", () => {
        const legacy = {
            ...educator,
            areasOfNeed: ["math", "literacy_ela"],
        };

        expect(
            educatorMatchesDirectoryFilters(legacy, {
                ...noFilters,
                selectedAreas: ["instruction_curriculum"],
            })
        ).toBe(true);
    });

    it("uses OR within a filter group and AND across groups", () => {
        expect(
            educatorMatchesDirectoryFilters(educator, {
                ...noFilters,
                selectedAreas: ["instruction_curriculum", "data_accountability"],
                selectedGrades: ["k5", "6_8"],
                selectedRegions: ["region_5"],
                selectedEngagements: ["consulting"],
                availableNow: true,
            })
        ).toBe(true);

        expect(
            educatorMatchesDirectoryFilters(educator, {
                ...noFilters,
                selectedAreas: ["data_accountability"],
                selectedGrades: ["k5"],
            })
        ).toBe(false);
    });

    it("treats all-grades and statewide coverage as matching specific selections", () => {
        const statewide = {
            ...educator,
            gradeLevels: ["all"],
            coverageRegions: ["all"],
        };

        expect(
            educatorMatchesDirectoryFilters(statewide, {
                ...noFilters,
                selectedGrades: ["9_12"],
                selectedRegions: ["region_6"],
            })
        ).toBe(true);
    });

    it("composes saved, verified, local, and ready-to-request controls", () => {
        const filters: DirectoryFilterState = {
            ...noFilters,
            verifiedOnly: true,
            showSavedOnly: true,
            savedEducatorIds: [educator.id],
            activeQuickFilter: "quick_avail",
        };
        expect(educatorMatchesDirectoryFilters(educator, filters)).toBe(true);
        expect(
            educatorMatchesDirectoryFilters(educator, {
                ...filters,
                activeQuickFilter: "quick_local",
                districtRegion: "region_6",
            })
        ).toBe(false);
        expect(
            educatorMatchesDirectoryFilters(educator, {
                ...filters,
                activeQuickFilter: "quick_instant",
            })
        ).toBe(true);
    });

    it("filters a roster without mutating its order", () => {
        const other = { ...educator, id: "educator_2", areasOfNeed: ["instruction_curriculum"] };
        const roster = [educator, other];
        const result = filterEducatorRoster(roster, {
            ...noFilters,
            selectedAreas: ["instruction_curriculum"],
        });

        expect(result.map((row) => row.id)).toEqual(["educator_2"]);
        expect(roster.map((row) => row.id)).toEqual(["educator_1", "educator_2"]);
    });
});

describe("orderAreasForDisplay", () => {
    it("moves the actively matched support area first and retains every area", () => {
        expect(
            orderAreasForDisplay(
                ["data_accountability", "ai_edtech", "instruction_curriculum"],
                ["instruction_curriculum"]
            )
        ).toEqual(["instruction_curriculum", "data_accountability", "ai_edtech"]);
    });
});

it('matches unknown legacy support and specialization exactly, excluding unrelated consultants',()=>{
 const filters={...noFilters,selectedAreas:['legacy_unique'],selectedSpecializations:['legacy_special']};
 expect(educatorMatchesDirectoryFilters(educator,filters)).toBe(false);
 expect(educatorMatchesDirectoryFilters({...educator,areasOfNeed:['legacy_unique'],subCategories:['legacy_special']},filters)).toBe(true);
 expect(educatorMatchesDirectoryFilters({...educator,areasOfNeed:['legacy_unique'],subCategories:['different']},filters)).toBe(false);
});
