import type { EducatorCardProps } from "@/components/shared/educator-card";
import { getAreaOfNeedMatchIds } from "./taxonomy";

export type DirectoryQuickFilter =
    | "quick_avail"
    | "quick_top"
    | "quick_local"
    | "quick_instant"
    | null;

export type DirectoryFilterState = {
    selectedAreas: string[];
    selectedGrades: string[];
    selectedRegions: string[];
    selectedEngagements: string[];
    verifiedOnly: boolean;
    availableNow: boolean;
    showSavedOnly: boolean;
    savedEducatorIds: string[];
    activeQuickFilter: DirectoryQuickFilter;
    districtRegion?: string;
};

function matchesAnyArea(educatorAreas: string[], selectedAreas: string[]): boolean {
    return selectedAreas.some((selectedArea) => {
        const acceptedIds = new Set(getAreaOfNeedMatchIds(selectedArea));
        return educatorAreas.some((educatorArea) => acceptedIds.has(educatorArea));
    });
}

export function educatorMatchesDirectoryFilters(
    educator: EducatorCardProps,
    filters: DirectoryFilterState
): boolean {
    if (
        filters.selectedAreas.length > 0 &&
        !matchesAnyArea(educator.areasOfNeed, filters.selectedAreas)
    ) {
        return false;
    }
    if (
        filters.selectedGrades.length > 0 &&
        !educator.gradeLevels.includes("all") &&
        !filters.selectedGrades.some((grade) => educator.gradeLevels.includes(grade))
    ) {
        return false;
    }
    if (
        filters.selectedRegions.length > 0 &&
        !educator.coverageRegions.includes("all") &&
        !filters.selectedRegions.some((region) => educator.coverageRegions.includes(region))
    ) {
        return false;
    }
    if (
        filters.selectedEngagements.length > 0 &&
        !filters.selectedEngagements.some((engagement) =>
            educator.engagementTypes.includes(engagement)
        )
    ) {
        return false;
    }
    if (filters.showSavedOnly && !filters.savedEducatorIds.includes(educator.id)) return false;
    if (filters.verifiedOnly && educator.verificationTier === "basic") return false;
    if (filters.availableNow && educator.availabilityStatus !== "open") return false;

    if (filters.activeQuickFilter === "quick_top" && educator.overallRating < 4.8) {
        return false;
    }
    if (filters.activeQuickFilter === "quick_local") {
        if (!filters.districtRegion) return false;
        if (
            !educator.coverageRegions.includes("all") &&
            !educator.coverageRegions.includes(filters.districtRegion)
        ) {
            return false;
        }
    }
    if (
        filters.activeQuickFilter === "quick_instant" &&
        (!(educator.startingRate && educator.startingRate > 0) ||
            educator.availabilityStatus !== "open")
    ) {
        return false;
    }

    return true;
}

export function filterEducatorRoster(
    roster: EducatorCardProps[],
    filters: DirectoryFilterState
): EducatorCardProps[] {
    return roster.filter((educator) => educatorMatchesDirectoryFilters(educator, filters));
}

export function orderAreasForDisplay(areaIds: string[], selectedAreas: string[]): string[] {
    if (selectedAreas.length === 0) return [...areaIds];
    const selectedMatchIds = new Set(selectedAreas.flatMap(getAreaOfNeedMatchIds));
    const matching = areaIds.filter((areaId) => selectedMatchIds.has(areaId));
    const remaining = areaIds.filter((areaId) => !selectedMatchIds.has(areaId));
    return [...matching, ...remaining];
}
