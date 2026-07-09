import { TAXONOMY } from "./taxonomy";

export const NEED_DESCRIPTION_MIN_LENGTH = 50;
export const NEED_LOGISTICS_MIN_LENGTH = 3;

export type NeedInput = {
    orgName?: string;
    areaOfNeed?: string;
    subCategory?: string;
    gradeLevel?: string;
    engagementType?: string;
    startDate?: string;
    duration?: string;
    compensationRange?: string;
    description?: string;
};

export type NormalizedNeedInput = {
    orgName: string;
    areaOfNeed: string;
    subCategory?: string;
    gradeLevel?: string;
    engagementType?: string;
    startDate?: string;
    duration?: string;
    compensationRange?: string;
    description?: string;
};

export type NeedPublishField = keyof NormalizedNeedInput;

export type NeedPublishIssue = {
    field: NeedPublishField;
    message: string;
};

function optionalTrimmed(value: string | undefined): string | undefined {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
}

export function normalizeNeedInput(input: NeedInput): NormalizedNeedInput {
    return {
        orgName: input.orgName?.trim() ?? "",
        areaOfNeed: input.areaOfNeed?.trim() ?? "",
        subCategory: optionalTrimmed(input.subCategory),
        gradeLevel: optionalTrimmed(input.gradeLevel),
        engagementType: optionalTrimmed(input.engagementType),
        startDate: optionalTrimmed(input.startDate),
        duration: optionalTrimmed(input.duration),
        compensationRange: optionalTrimmed(input.compensationRange),
        description: optionalTrimmed(input.description),
    };
}

function supportTypeRequiresSubcategory(areaOfNeed: string): boolean {
    const area = TAXONOMY.areasOfNeed.find((candidate) => candidate.id === areaOfNeed);
    return (area?.subCategories.length ?? 0) > 0;
}

export function getNeedPublishIssues(input: NeedInput): NeedPublishIssue[] {
    const need = normalizeNeedInput(input);
    const issues: NeedPublishIssue[] = [];

    if (!need.orgName) {
        issues.push({ field: "orgName", message: "Organization name is required to publish." });
    }
    if (!need.areaOfNeed) {
        issues.push({ field: "areaOfNeed", message: "Select a support type to publish." });
    }
    if (
        need.areaOfNeed &&
        supportTypeRequiresSubcategory(need.areaOfNeed) &&
        !need.subCategory
    ) {
        issues.push({ field: "subCategory", message: "Select an area of expertise to publish." });
    }
    if (!need.gradeLevel) {
        issues.push({ field: "gradeLevel", message: "Select a grade level band to publish." });
    }
    if (!need.startDate) {
        issues.push({ field: "startDate", message: "Add a desired start date to publish." });
    }
    if (!need.duration || need.duration.length < NEED_LOGISTICS_MIN_LENGTH) {
        issues.push({ field: "duration", message: "Add an expected duration to publish." });
    }
    if (
        !need.compensationRange ||
        need.compensationRange.length < NEED_LOGISTICS_MIN_LENGTH
    ) {
        issues.push({
            field: "compensationRange",
            message: "Add a compensation range or budget guidance to publish.",
        });
    }
    if (!need.description || need.description.length < NEED_DESCRIPTION_MIN_LENGTH) {
        issues.push({
            field: "description",
            message: `Add at least ${NEED_DESCRIPTION_MIN_LENGTH} characters describing the work to publish.`,
        });
    }

    return issues;
}

export function isNeedPublishReady(input: NeedInput): boolean {
    return getNeedPublishIssues(input).length === 0;
}
