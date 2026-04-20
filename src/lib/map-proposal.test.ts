import { describe, it, expect } from "vitest";
import { formatProposalStatus, formatProposedRate } from "./map-proposal";

describe("formatProposalStatus", () => {
    it("maps pending to amber", () => {
        const s = formatProposalStatus("pending");
        expect(s.text).toBe("Pending");
        expect(s.color).toBe("amber");
    });

    it("maps accepted to emerald", () => {
        const s = formatProposalStatus("accepted");
        expect(s.text).toBe("Accepted");
        expect(s.color).toBe("emerald");
    });

    it("maps rejected to blue 'Not selected'", () => {
        const s = formatProposalStatus("rejected");
        expect(s.text).toBe("Not selected");
        expect(s.color).toBe("blue");
    });

    it("maps withdrawn to blue", () => {
        const s = formatProposalStatus("withdrawn");
        expect(s.text).toBe("Withdrawn");
        expect(s.color).toBe("blue");
    });

    it("falls back to pending for unknown statuses", () => {
        const s = formatProposalStatus("weird_status");
        expect(s.color).toBe("amber");
    });
});

describe("formatProposedRate", () => {
    it("formats hourly rates as $X/hr", () => {
        expect(formatProposedRate(75, "hourly")).toBe("$75/hr");
    });

    it("formats daily rates as $X/day", () => {
        expect(formatProposedRate(250, "daily")).toBe("$250/day");
    });

    it("formats fixed rates as $X flat", () => {
        expect(formatProposedRate(500, "fixed")).toBe("$500 flat");
    });

    it("returns a not-specified label when amount is missing", () => {
        expect(formatProposedRate(undefined, "hourly")).toBe("Rate not specified");
        expect(formatProposedRate(null, undefined)).toBe("Rate not specified");
    });

    it("thousands-formats larger numbers", () => {
        expect(formatProposedRate(1250, "fixed")).toBe("$1,250 flat");
    });
});
