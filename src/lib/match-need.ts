import { getAreaOfNeedMatchIds } from "./taxonomy";

type MatchableEducator = {
    areasOfNeed: string[];
    gradeLevelBands: string[];
};

type MatchableNeed = {
    areaOfNeed: string;
    gradeLevel?: string;
};

export function educatorMatchesNeed(
    educator: MatchableEducator,
    need: MatchableNeed
): boolean {
    const acceptedAreaIds = new Set(getAreaOfNeedMatchIds(need.areaOfNeed));
    if (!educator.areasOfNeed.some((areaId) => acceptedAreaIds.has(areaId))) return false;
    if (
        need.gradeLevel &&
        !educator.gradeLevelBands.includes("all") &&
        !educator.gradeLevelBands.includes(need.gradeLevel)
    ) {
        return false;
    }
    return true;
}
