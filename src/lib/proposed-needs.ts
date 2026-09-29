/**
 * Consultant proposal-state helpers.
 * Keep these aligned with `proposals.submit`, which only blocks a new
 * proposal when the educator already has a *pending* row on that need.
 * Withdrawn and rejected proposals do not block resubmit.
 */

export type ProposalNeedRef = {
    needId: string;
    status: string;
};

/** Matches `proposals.submit`: only a pending proposal blocks a new one. */
export function blocksNewProposal(status: string): boolean {
    return status === "pending";
}

/** Need IDs that should show "Proposal submitted" on the Gig Board. */
export function collectProposedNeedIds(proposals: readonly ProposalNeedRef[]): Set<string> {
    const set = new Set<string>();
    for (const proposal of proposals) {
        if (blocksNewProposal(proposal.status)) {
            set.add(proposal.needId);
        }
    }
    return set;
}

/**
 * The consultant's viewable proposal for a need.
 * Callers pass `listMine` order (newest first). The newest row is the current
 * state: pending/accepted are viewable; withdrawn/rejected show the form again.
 * A pending row anywhere still wins so a stale older accepted row cannot mask it.
 */
export function findViewableProposal<T extends ProposalNeedRef>(
    proposals: readonly T[],
    needId: string
): T | undefined {
    const forNeed = proposals.filter((proposal) => proposal.needId === needId);
    const pending = forNeed.find((proposal) => proposal.status === "pending");
    if (pending) return pending;
    const current = forNeed[0];
    return current?.status === "accepted" ? current : undefined;
}

export function listPendingProposals<T extends { status: string }>(proposals: readonly T[]): T[] {
    return proposals.filter((proposal) => proposal.status === "pending");
}
