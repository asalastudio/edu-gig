import { describe, it, expect } from "vitest";
import {
    formatDistrictKpis,
    formatEducatorKpis,
    formatPipelineStatus,
    formatOrderStatus,
    formatAgreedRate,
} from "./map-dashboard";

describe("formatDistrictKpis", () => {
    it("returns empty-state fallbacks when no data", () => {
        const d = formatDistrictKpis(null);
        expect(d.activeOpenings).toBe("0");
        expect(d.engagementCount).toBe("0");
    });

    it("formats live data", () => {
        const d = formatDistrictKpis({
            activeOpenings: 7,
            placementsThisMonth: 2,
            needsCount: 5,
            engagementCount: 3,
        });
        expect(d.activeOpenings).toBe("7");
        expect(d.placementsThisMonth).toBe("2");
        expect(d.engagementCount).toBe("3");
    });
});

describe("formatEducatorKpis", () => {
    it("falls back when empty", () => {
        const d = formatEducatorKpis(null);
        expect(d.greetingName).toBe("there");
    });

    it("pluralises active gigs and completed engagements", () => {
        const single = formatEducatorKpis({
            activeCount: 1,
            completedCount: 1,
            pendingProposals: 1,
            firstName: "Miguel",
        });
        expect(single.activeCount).toBe("1 Active Gig");
        expect(single.completedLabel).toBe("1 completed engagement");
        expect(single.pendingLabel).toBe("1 pending proposal");
        expect(single.greetingName).toBe("Miguel");
    });
});

describe("formatPipelineStatus", () => {
    it("maps each status to a colour", () => {
        expect(formatPipelineStatus("interviewing").color).toBe("amber");
        expect(formatPipelineStatus("placed").color).toBe("emerald");
        expect(formatPipelineStatus("open").text).toBe("Sourcing");
    });
});

describe("formatOrderStatus", () => {
    it("labels accepted engagements", () => {
        expect(formatOrderStatus("active").text).toBe("Accepted");
    });
    it("labels completed as completed emerald", () => {
        const s = formatOrderStatus("completed");
        expect(s.color).toBe("emerald");
        expect(s.text).toBe("Completed");
    });
});

describe("formatAgreedRate", () => {
    it("formats hourly rates", () => {
        expect(formatAgreedRate(95, "hourly")).toBe("$95/hr");
    });
});
