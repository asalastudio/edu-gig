import { describe, expect, it } from "vitest";
import type { Doc, Id } from "@/convex/_generated/dataModel";

import {
    ACCEPT_ERRORS,
    REJECT_ERRORS,
    assertProposalAcceptable,
    assertProposalRejectable,
} from "../../convex/lib/proposalAcceptance";

type NeedStatus = Doc<"needs">["status"];
type ProposalStatus = Doc<"proposals">["status"];

const p1 = "proposal_1" as Id<"proposals">;
const p2 = "proposal_2" as Id<"proposals">;

const pending = { _id: p1, status: "pending" as const };
const openNeed = { status: "open" as NeedStatus };

describe("assertProposalAcceptable", () => {
    it("allows a pending proposal on an open need with no prior acceptance", () => {
        expect(() =>
            assertProposalAcceptable({
                proposal: pending,
                need: openNeed,
                siblings: [pending, { _id: p2, status: "pending" }],
                existingEngagement: null,
            })
        ).not.toThrow();
    });

    it("allows acceptance while the need is interviewing", () => {
        expect(() =>
            assertProposalAcceptable({
                proposal: pending,
                need: { status: "interviewing" as NeedStatus },
                siblings: [pending],
                existingEngagement: null,
            })
        ).not.toThrow();
    });

    it.each(["accepted", "rejected", "withdrawn"] as ProposalStatus[])("rejects a %s proposal", (status: ProposalStatus) => {
        expect(() =>
            assertProposalAcceptable({
                proposal: { _id: p1, status },
                need: openNeed,
                siblings: [],
                existingEngagement: null,
            })
        ).toThrow(ACCEPT_ERRORS.notPending);
    });

    it.each(["placed", "closed", "draft"] as NeedStatus[])("rejects acceptance when the need is %s", (status: NeedStatus) => {
        expect(() =>
            assertProposalAcceptable({
                proposal: pending,
                need: { status },
                siblings: [pending],
                existingEngagement: null,
            })
        ).toThrow(ACCEPT_ERRORS.needClosed);
    });

    it("enforces one accepted proposal per need", () => {
        expect(() =>
            assertProposalAcceptable({
                proposal: pending,
                need: openNeed,
                siblings: [pending, { _id: p2, status: "accepted" }],
                existingEngagement: null,
            })
        ).toThrow(ACCEPT_ERRORS.alreadyAccepted);
    });

    it("enforces one engagement per need", () => {
        expect(() =>
            assertProposalAcceptable({
                proposal: pending,
                need: openNeed,
                siblings: [pending],
                existingEngagement: { _id: "engagement_1" },
            })
        ).toThrow(ACCEPT_ERRORS.engagementExists);
    });
});

describe("assertProposalRejectable", () => {
    it("allows rejecting a pending proposal", () => {
        expect(() => assertProposalRejectable({ status: "pending" })).not.toThrow();
    });

    it.each(["accepted", "rejected", "withdrawn"] as ProposalStatus[])("refuses to reject a %s proposal", (status: ProposalStatus) => {
        expect(() => assertProposalRejectable({ status })).toThrow(REJECT_ERRORS.notPending);
    });
});
