import { describe, expect, it } from "vitest";
import {
    CONSULTANT_POST_ACCEPT_COPY,
    DISTRICT_POST_ACCEPT_COPY,
    addBusinessDays,
    formatFollowUpDeadline,
    getPostAcceptCopy,
    getPostAcceptNextStep,
} from "./post-accept-copy";

describe("getPostAcceptCopy", () => {
    it("tells the district to reach out within 3 business days", () => {
        expect(getPostAcceptCopy("district")).toBe(DISTRICT_POST_ACCEPT_COPY);
        expect(DISTRICT_POST_ACCEPT_COPY).toMatch(/3 business days/i);
        expect(DISTRICT_POST_ACCEPT_COPY).toMatch(/reach out to the consultant/i);
        expect(DISTRICT_POST_ACCEPT_COPY).not.toMatch(/Contract Hub/i);
    });

    it("tells the consultant to follow up if the school is silent", () => {
        expect(getPostAcceptCopy("educator")).toBe(CONSULTANT_POST_ACCEPT_COPY);
        expect(CONSULTANT_POST_ACCEPT_COPY).toMatch(/3 business days/i);
        expect(CONSULTANT_POST_ACCEPT_COPY).toMatch(/reach out/i);
        expect(CONSULTANT_POST_ACCEPT_COPY).not.toMatch(/Contract Hub/i);
    });
});

describe("follow-up deadline", () => {
    it("skips weekends when adding business days", () => {
        // Tue Sep 29 2026 + 3 business days = Fri Oct 2
        expect(addBusinessDays(new Date(2026, 8, 29, 12), 3).toDateString()).toBe("Fri Oct 02 2026");
        // Thu Oct 1 2026 + 3 business days = Tue Oct 6 (Sat/Sun skipped)
        expect(addBusinessDays(new Date(2026, 9, 1, 12), 3).toDateString()).toBe("Tue Oct 06 2026");
        // Accepted on a Saturday counts from Monday: Sat Oct 3 -> Wed Oct 7
        expect(addBusinessDays(new Date(2026, 9, 3, 12), 3).toDateString()).toBe("Wed Oct 07 2026");
    });

    it("formats a short, readable deadline", () => {
        expect(formatFollowUpDeadline(new Date(2026, 8, 29, 12))).toBe("Fri, Oct 2");
    });

    it("keeps Chris's wording and puts the dated deadline in its own segment", () => {
        const district = getPostAcceptNextStep("district", new Date(2026, 8, 29, 12));
        expect(district.deadline).toBe("by Fri, Oct 2 (3 business days)");
        expect(`${district.lead}${district.deadline}${district.rest}`).toMatch(/Reach out to the consultant by Fri, Oct 2/);

        const consultant = getPostAcceptNextStep("educator", new Date(2026, 8, 29, 12));
        expect(`${consultant.lead}${consultant.deadline}${consultant.rest}`).toBe(
            "Your proposal has been approved. If you don't hear from the school by Fri, Oct 2 (3 business days), reach out to them. Contracts and payment are handled off-platform."
        );
    });
});
