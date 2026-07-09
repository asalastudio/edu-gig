import { getNeedPublishIssues, type NeedInput, type NeedPublishField } from "./need-publish-policy";

type MarketplaceUserIdentity = {
    clerkId: string;
    email: string;
    firstName: string;
    lastName: string;
};

type MarketplaceDistrictIdentity = {
    name: string;
    nceaId?: string;
};

type MarketplaceNeedIdentity = {
    orgName: string;
    description?: string;
};

function tokens(value: string): string[] {
    return value.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

function hasToken(value: string, token: string): boolean {
    return tokens(value).includes(token);
}

export function classifyMarketplaceUser(user: MarketplaceUserIdentity): string[] {
    const reasons: string[] = [];
    const email = user.email.trim().toLowerCase();
    const displayName = `${user.firstName} ${user.lastName}`.trim();

    if (user.clerkId.startsWith("seed:")) reasons.push("seed_clerk_id");
    if (user.clerkId.startsWith("dummy_clerk_id_")) reasons.push("dummy_clerk_id");
    if (email.includes("+clerk_test@")) reasons.push("clerk_test_email");
    if (email.endsWith("@example.com")) reasons.push("example_email");
    if (hasToken(displayName, "qa")) reasons.push("qa_name");
    if (hasToken(displayName, "test")) reasons.push("test_name");
    if (hasToken(displayName, "demo")) reasons.push("demo_name");

    return [...new Set(reasons)];
}

export function classifyMarketplaceDistrict(district: MarketplaceDistrictIdentity): string[] {
    const reasons: string[] = [];
    if (hasToken(district.name, "test")) reasons.push("test_name");
    if (hasToken(district.name, "qa")) reasons.push("qa_name");
    if (hasToken(district.name, "demo")) reasons.push("demo_name");
    if (district.nceaId?.toLowerCase().startsWith("demo-")) reasons.push("demo_identifier");
    return [...new Set(reasons)];
}

export function classifyMarketplaceNeed(need: MarketplaceNeedIdentity): string[] {
    const reasons: string[] = [];
    if (hasToken(need.orgName, "test")) reasons.push("test_org_name");
    if (hasToken(need.orgName, "qa")) reasons.push("qa_org_name");
    if (hasToken(need.orgName, "demo")) reasons.push("demo_org_name");
    return [...new Set(reasons)];
}

export function classifyMarketplaceNeedReviewSignals(need: MarketplaceNeedIdentity): string[] {
    const reasons: string[] = [];
    if (need.description && hasToken(need.description, "test")) reasons.push("test_description");
    if (need.description && hasToken(need.description, "qa")) reasons.push("qa_description");
    return reasons;
}

export async function computeCandidateDigest(candidateKeys: string[]): Promise<string> {
    const canonical = [...new Set(candidateKeys)].sort().join("\n");
    const bytes = new TextEncoder().encode(canonical);
    const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(digest)]
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
}

export function getIncompletePublishedNeedFields(
    need: NeedInput & { status: string }
): NeedPublishField[] {
    if (need.status !== "open" && need.status !== "interviewing") return [];
    return getNeedPublishIssues(need).map((issue) => issue.field);
}
