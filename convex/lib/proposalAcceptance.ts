import type { Doc } from "../_generated/dataModel";
import { acceptsEducatorProposals } from "../../src/lib/need-status";

type ProposalLike = Pick<Doc<"proposals">, "_id" | "status">;
type NeedLike = Pick<Doc<"needs">, "status">;

export const ACCEPT_ERRORS = {
    notPending: "Only a pending proposal can be accepted.",
    needClosed: "This need is no longer accepting proposals.",
    alreadyAccepted: "A proposal has already been accepted for this need.",
    engagementExists: "An engagement already exists for this need.",
} as const;

export const REJECT_ERRORS = {
    notPending: "Only a pending proposal can be rejected.",
} as const;

/**
 * Transactional invariants for `proposals.accept`.
 *
 * Exactly one non-canceled hire may exist per need. Callers must load
 * `siblings` excluding proposals linked to historical canceled engagements,
 * and `existingEngagement` (any non-canceled engagement) inside the same
 * mutation so the check and the write happen in one Convex transaction.
 */
export function assertProposalAcceptable(args: {
    proposal: ProposalLike;
    need: NeedLike;
    siblings: ProposalLike[];
    existingEngagement: unknown | null;
}): void {
    if (args.proposal.status !== "pending") {
        throw new Error(ACCEPT_ERRORS.notPending);
    }
    if (!acceptsEducatorProposals(args.need.status)) {
        throw new Error(ACCEPT_ERRORS.needClosed);
    }
    const acceptedSibling = args.siblings.find(
        (sibling) => sibling._id !== args.proposal._id && sibling.status === "accepted"
    );
    if (acceptedSibling) {
        throw new Error(ACCEPT_ERRORS.alreadyAccepted);
    }
    if (args.existingEngagement) {
        throw new Error(ACCEPT_ERRORS.engagementExists);
    }
}

/** A district may only reject a proposal that is still pending. */
export function assertProposalRejectable(proposal: Pick<Doc<"proposals">, "status">): void {
    if (proposal.status !== "pending") {
        throw new Error(REJECT_ERRORS.notPending);
    }
}
