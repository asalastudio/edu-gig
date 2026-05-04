import { describe, it, expect } from "vitest";
import {
    formatDistrictKpis,
    formatEducatorKpis,
    formatPipelineStatus,
    formatOrderStatus,
} from "./map-dashboard";

describe("formatDistrictKpis", () => {
    it("returns empty-state fallbacks when no data", () => {
        const d = formatDistrictKpis(null);
        expect(d.activeOpenings).toBe("0");
        expect(d.avgTimeToFill).toBe("—");
    });

    it("formats live data", () => {
        const d = formatDistrictKpis({
            activeOpenings: 7,
            placementsThisMonth: 2,
            avgTimeToFillDays: 9,
            totalSpendYtd: 45_600,
            needsCount: 5,
            ordersCount: 3,
        });
        expect(d.activeOpenings).toBe("7");
        expect(d.placementsThisMonth).toBe("2");
        expect(d.avgTimeToFill).toBe("9 days");
        expect(d.totalSpendYtd).toBe("$45.6K");
    });

    it("emdashes avg time when no placed needs", () => {
        const d = formatDistrictKpis({
            activeOpenings: 0,
            placementsThisMonth: 0,
            avgTimeToFillDays: null,
            totalSpendYtd: 0,
            needsCount: 0,
            ordersCount: 0,
        });
        expect(d.avgTimeToFill).toBe("—");
        expect(d.totalSpendYtd).toBe("$0");
    });
});

describe("formatEducatorKpis", () => {
    it("falls back when empty", () => {
        const d = formatEducatorKpis(null);
        expect(d.greetingName).toBe("there");
    });

    it("pluralises active gigs and completed tasks", () => {
        const single = formatEducatorKpis({
            pipelineValue: 500,
            activeCount: 1,
            ytdPayout: 500,
            completedCount: 1,
            firstName: "Miguel",
        });
        expect(single.activeCount).toBe("1 Active Gig");
        expect(single.completedLabel).toBe("1 completed task");
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
    it("labels pending as awaiting signature", () => {
        expect(formatOrderStatus("pending").text).toBe("Awaiting signature");
    });
    it("labels completed as completed emerald", () => {
        const s = formatOrderStatus("completed");
        expect(s.color).toBe("emerald");
        expect(s.text).toBe("Completed");
    });
});
