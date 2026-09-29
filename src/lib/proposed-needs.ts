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
 * The consultant's viewable proposal for a need: pending first, else accepted.
 * Withdrawn / rejected rows are ignored so the propose form can show again.
 */
export function findViewableProposal<T extends ProposalNeedRef>(
    proposals: readonly T[],
    needId: string
): T | undefined {
    const forNeed = proposals.filter((proposal) => proposal.needId === needId);
    return (
        forNeed.find((proposal) => proposal.status === "pending") ??
        forNeed.find((proposal) => proposal.status === "accepted")
    );
}

export function listPendingProposals<T extends { status: string }>(proposals: readonly T[]): T[] {
    return proposals.filter((proposal) => proposal.status === "pending");
}
