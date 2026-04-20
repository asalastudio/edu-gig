import { describe, it, expect } from "vitest";
import { formatPrice, formatRating, summarizeReviews } from "./map-review";

describe("formatPrice", () => {
    it("formats hourly prices with /hr suffix", () => {
        expect(formatPrice(75, "hourly")).toBe("$75/hr");
    });

    it("formats daily prices with /day suffix", () => {
        expect(formatPrice(250, "daily")).toBe("$250/day");
    });

    it("formats fixed prices with flat suffix and thousands separators", () => {
        expect(formatPrice(1500, "fixed")).toBe("$1,500 flat");
    });

    it("renders an em dash when amount is not finite", () => {
        expect(formatPrice(Number.NaN, "hourly")).toBe("—");
    });
});

describe("formatRating", () => {
    it("renders zero as 0.0 / 5", () => {
        expect(formatRating(0)).toBe("0.0 / 5");
    });

    it("rounds to one decimal", () => {
        expect(formatRating(4.95)).toBe("5.0 / 5");
    });

    it("clamps values above 5", () => {
        expect(formatRating(12)).toBe("5.0 / 5");
    });

    it("handles non-finite input", () => {
        expect(formatRating(Number.NaN)).toBe("0.0 / 5");
    });
});

describe("summarizeReviews", () => {
    it("returns zeros for an empty array", () => {
        const s = summarizeReviews([]);
        expect(s.count).toBe(0);
        expect(s.average).toBe(0);
        expect(s.breakdown.subjectExpertise).toBe(0);
        expect(s.breakdown.classroomMgmt).toBe(0);
        expect(s.breakdown.communication).toBe(0);
        expect(s.breakdown.reliability).toBe(0);
    });

    it("averages overall and sub-ratings when present", () => {
        const s = summarizeReviews([
            {
                overallRating: 5,
                subjectExpertise: 5,
                classroomMgmt: 4,
                communication: 5,
                reliability: 5,
            },
            {
                overallRating: 3,
                subjectExpertise: 4,
                classroomMgmt: 3,
                communication: 3,
                reliability: 4,
            },
        ]);
        expect(s.count).toBe(2);
        expect(s.average).toBe(4);
        expect(s.breakdown.subjectExpertise).toBe(4.5);
        expect(s.breakdown.classroomMgmt).toBe(3.5);
        expect(s.breakdown.communication).toBe(4);
        expect(s.breakdown.reliability).toBe(4.5);
    });

    it("skips undefined sub-ratings when averaging", () => {
        const s = summarizeReviews([
            { overallRating: 5, subjectExpertise: 5 },
            { overallRating: 3 },
        ]);
        expect(s.count).toBe(2);
        expect(s.average).toBe(4);
        // Only one review contributed a subject rating of 5.
        expect(s.breakdown.subjectExpertise).toBe(5);
        expect(s.breakdown.classroomMgmt).toBe(0);
    });
});
