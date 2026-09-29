import { describe, expect, it } from "vitest";
import {
    blocksNewProposal,
    collectProposedNeedIds,
    findViewableProposal,
    listPendingProposals,
} from "./proposed-needs";

describe("blocksNewProposal", () => {
    it("matches proposals.submit: only pending blocks a new proposal", () => {
        expect(blocksNewProposal("pending")).toBe(true);
        expect(blocksNewProposal("withdrawn")).toBe(false);
        expect(blocksNewProposal("rejected")).toBe(false);
        expect(blocksNewProposal("accepted")).toBe(false);
    });
});

describe("collectProposedNeedIds", () => {
    it("includes only needs with a pending proposal", () => {
        const ids = collectProposedNeedIds([
            { needId: "need-pending", status: "pending" },
            { needId: "need-withdrawn", status: "withdrawn" },
            { needId: "need-rejected", status: "rejected" },
            { needId: "need-accepted", status: "accepted" },
        ]);
        expect([...ids]).toEqual(["need-pending"]);
    });

    it("treats a withdrawn-then-resubmitted need as submitted", () => {
        const ids = collectProposedNeedIds([
            { needId: "need-1", status: "withdrawn" },
            { needId: "need-1", status: "pending" },
        ]);
        expect(ids.has("need-1")).toBe(true);
    });
});

describe("findViewableProposal", () => {
    it("prefers the pending proposal over older withdrawn/rejected rows", () => {
        const viewable = findViewableProposal(
            [
                { needId: "need-1", status: "withdrawn", id: "old" },
                { needId: "need-1", status: "pending", id: "current" },
            ],
            "need-1"
        );
        expect(viewable?.id).toBe("current");
    });

    it("falls back to accepted when there is no pending row", () => {
        const viewable = findViewableProposal(
            [{ needId: "need-1", status: "accepted", id: "won" }],
            "need-1"
        );
        expect(viewable?.id).toBe("won");
    });

    it("returns undefined for withdrawn or rejected so the form can show again", () => {
        expect(
            findViewableProposal([{ needId: "need-1", status: "withdrawn" }], "need-1")
        ).toBeUndefined();
        expect(
            findViewableProposal([{ needId: "need-1", status: "rejected" }], "need-1")
        ).toBeUndefined();
    });
});

describe("listPendingProposals", () => {
    it("keeps only pending rows", () => {
        const pending = listPendingProposals([
            { status: "pending", id: "a" },
            { status: "withdrawn", id: "b" },
            { status: "accepted", id: "c" },
        ]);
        expect(pending.map((row) => row.id)).toEqual(["a"]);
    });
});
