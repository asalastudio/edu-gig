/**
 * View-model mappers that turn raw Convex dashboard rows into display-ready strings.
 * Keeps currency / status formatting out of the React components.
 */

export type DistrictKpis = {
    activeOpenings: number;
    placementsThisMonth: number;
    avgTimeToFillDays: number | null;
    totalSpendYtd: number;
    needsCount: number;
    ordersCount: number;
};

export type DistrictKpiDisplay = {
    activeOpenings: string;
    placementsThisMonth: string;
    avgTimeToFill: string;
    totalSpendYtd: string;
};

export type EducatorKpis = {
    pipelineValue: number;
    activeCount: number;
    ytdPayout: number;
    completedCount: number;
    firstName: string;
};

export type EducatorKpiDisplay = {
    pipelineValue: string;
    activeCount: string;
    ytdPayout: string;
    completedLabel: string;
    greetingName: string;
};

export type PipelineRow = {
    id: string;
    role: string;
    spec: string;
    status: string;
    daysOpen: number;
    candidates?: number;
};

export type EducatorPipelineRow = {
    id: string;
    title: string;
    district: string;
    status: string;
    amount: number;
    startDate?: string;
};

function formatUsd(n: number): string {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 10_000) return `$${(n / 1_000).toFixed(1)}K`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
    return `$${n.toFixed(0)}`;
}

function formatUsdExact(n: number): string {
    return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function formatDistrictKpis(kpis: DistrictKpis | null | undefined): DistrictKpiDisplay {
    if (!kpis) {
        return {
            activeOpenings: "0",
            placementsThisMonth: "0",
            avgTimeToFill: "—",
            totalSpendYtd: "$0",
        };
    }
    return {
        activeOpenings: String(kpis.activeOpenings),
        placementsThisMonth: String(kpis.placementsThisMonth),
        avgTimeToFill: kpis.avgTimeToFillDays === null ? "—" : `${kpis.avgTimeToFillDays} days`,
        totalSpendYtd: kpis.totalSpendYtd === 0 ? "$0" : formatUsd(kpis.totalSpendYtd),
    };
}

export function formatEducatorKpis(kpis: EducatorKpis | null | undefined): EducatorKpiDisplay {
    if (!kpis) {
        return {
            pipelineValue: "$0",
            activeCount: "0 Active Gigs",
            ytdPayout: "$0",
            completedLabel: "0 completed tasks",
            greetingName: "there",
        };
    }
    return {
        pipelineValue: formatUsdExact(kpis.pipelineValue),
        activeCount: `${kpis.activeCount} Active ${kpis.activeCount === 1 ? "Gig" : "Gigs"}`,
        ytdPayout: formatUsdExact(kpis.ytdPayout),
        completedLabel: `${kpis.completedCount} completed ${kpis.completedCount === 1 ? "task" : "tasks"}`,
        greetingName: kpis.firstName,
    };
}

type StatusColor = "amber" | "emerald" | "blue";

export function formatPipelineStatus(status: string): { text: string; color: StatusColor } {
    switch (status) {
        case "interviewing":
            return { text: "Interviewing", color: "amber" };
        case "placed":
            return { text: "Placed", color: "emerald" };
        case "closed":
            return { text: "Closed", color: "blue" };
        case "open":
        default:
            return { text: "Sourcing", color: "blue" };
    }
}

export function formatOrderStatus(status: string): { text: string; color: StatusColor } {
    switch (status) {
        case "accepted":
        case "in_progress":
            return { text: "In Progress", color: "blue" };
        case "completed":
            return { text: "Completed", color: "emerald" };
        case "cancelled":
        case "disputed":
            return { text: "On Hold", color: "amber" };
        case "pending":
        default:
            return { text: "Awaiting signature", color: "amber" };
    }
}
