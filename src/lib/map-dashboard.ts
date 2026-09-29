/**
 * View-model mappers that turn raw Convex dashboard rows into display-ready strings.
 * Keeps status formatting out of the React components.
 */

export type DistrictKpis = {
    activeOpenings: number;
    placementsThisMonth: number;
    needsCount: number;
    engagementCount: number;
};

export type DistrictKpiDisplay = {
    activeOpenings: string;
    placementsThisMonth: string;
    engagementCount: string;
};

export type EducatorKpis = {
    activeCount: number;
    completedCount: number;
    pendingProposals: number;
    firstName: string;
};

export type EducatorKpiDisplay = {
    activeCount: string;
    pendingLabel: string;
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
    amount?: number;
    startDate?: string;
};

export type RecentPlacementRow = {
    id: string;
    title: string;
    consultantName: string;
    orgName: string;
    status: string;
    createdAt: number;
};

export function formatDistrictKpis(kpis: DistrictKpis | null | undefined): DistrictKpiDisplay {
    if (!kpis) {
        return {
            activeOpenings: "0",
            placementsThisMonth: "0",
            engagementCount: "0",
        };
    }
    return {
        activeOpenings: String(kpis.activeOpenings),
        placementsThisMonth: String(kpis.placementsThisMonth),
        engagementCount: String(kpis.engagementCount),
    };
}

export function formatEducatorKpis(kpis: EducatorKpis | null | undefined): EducatorKpiDisplay {
    if (!kpis) {
        return {
            activeCount: "0 Active Gigs",
            pendingLabel: "0 pending proposals",
            completedLabel: "0 completed engagements",
            greetingName: "there",
        };
    }
    return {
        activeCount: `${kpis.activeCount} Active ${kpis.activeCount === 1 ? "Gig" : "Gigs"}`,
        pendingLabel: `${kpis.pendingProposals} pending ${kpis.pendingProposals === 1 ? "proposal" : "proposals"}`,
        completedLabel: `${kpis.completedCount} completed ${kpis.completedCount === 1 ? "engagement" : "engagements"}`,
        greetingName: kpis.firstName,
    };
}

type StatusColor = "amber" | "emerald" | "blue";

export function formatOrderStatus(status: string): { text: string; color: StatusColor } {
    switch (status) {
        case "active":
            return { text: "Accepted", color: "emerald" };
        case "in_progress":
        case "accepted":
            return { text: "In Progress", color: "blue" };
        case "completed":
            return { text: "Completed", color: "emerald" };
        case "cancelled":
        case "disputed":
            return { text: "Cancelled", color: "amber" };
        case "pending":
            return { text: "Pending", color: "amber" };
        default:
            return { text: status.replace(/_/g, " "), color: "blue" };
    }
}

export function formatAgreedRate(amount?: number, unit?: string | null): string {
    if (amount === undefined || amount === null) return "Rate agreed off-platform";
    const dollars = `$${Math.round(amount).toLocaleString("en-US")}`;
    if (unit === "hourly") return `${dollars}/hr`;
    if (unit === "daily") return `${dollars}/day`;
    if (unit === "fixed") return `${dollars} flat`;
    return dollars;
}

/** "2026-10-20" -> "Tue, Oct 20, 2026". Date-only strings are read as local dates (no UTC shift). */
export function formatDateOnly(value: string | undefined | null): string {
    if (!value) return "";
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
    if (!match) return value;
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}
