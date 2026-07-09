import { describe, expect, it } from "vitest";
import { acceptsEducatorProposals } from "./need-status";

describe("acceptsEducatorProposals", () => {
    it.each(["open", "interviewing"])("allows %s needs", (status) => {
        expect(acceptsEducatorProposals(status)).toBe(true);
    });

    it.each(["draft", "placed", "closed"])("rejects %s needs", (status) => {
        expect(acceptsEducatorProposals(status)).toBe(false);
    });
});
