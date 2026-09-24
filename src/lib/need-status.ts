export function acceptsEducatorProposals(status: string): boolean {
    return status === "open" || status === "interviewing";
}

/** Posted or draft gigs a district can cancel/delete. Placed gigs keep the engagement. */
export function canCancelNeed(status: string): boolean {
    return status === "draft" || status === "open" || status === "interviewing";
}
