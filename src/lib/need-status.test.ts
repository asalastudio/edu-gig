import { describe, expect, it } from "vitest";
import { acceptsEducatorProposals, canCancelNeed } from "./need-status";

describe("acceptsEducatorProposals", () => {
    it.each(["open", "interviewing"])("allows %s needs", (status) => {
        expect(acceptsEducatorProposals(status)).toBe(true);
    });

    it.each(["draft", "placed", "closed"])("rejects %s needs", (status) => {
        expect(acceptsEducatorProposals(status)).toBe(false);
    });
});

describe("canCancelNeed", () => {
    it.each(["draft", "open", "interviewing"])("allows cancelling a %s gig", (status) => {
        expect(canCancelNeed(status)).toBe(true);
    });

    it.each(["placed", "closed"])("refuses to cancel a %s gig", (status) => {
        expect(canCancelNeed(status)).toBe(false);
    });
});
