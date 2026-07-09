export function acceptsEducatorProposals(status: string): boolean {
    return status === "open" || status === "interviewing";
}
