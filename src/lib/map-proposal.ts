/**
 * View-model mappers for proposal rows.
 * Keeps status / rate formatting out of React components.
 */

type StatusColor = "amber" | "emerald" | "blue";

export type ProposalStatus = "pending" | "accepted" | "rejected" | "withdrawn";
export type ProposedRateUnit = "hourly" | "daily" | "fixed";

export function formatProposalStatus(status: string): { text: string; color: StatusColor } {
    switch (status) {
        case "pending":
            return { text: "Pending", color: "amber" };
        case "accepted":
            return { text: "Accepted", color: "emerald" };
        case "rejected":
            return { text: "Not selected", color: "blue" };
        case "withdrawn":
            return { text: "Withdrawn", color: "blue" };
        default:
            return { text: "Pending", color: "amber" };
    }
}

export function formatProposedRate(
    amount: number | null | undefined,
    unit: string | null | undefined
): string {
    if (amount === null || amount === undefined) return "Rate not specified";
    const dollars = `$${Math.round(amount).toLocaleString("en-US")}`;
    switch (unit) {
        case "hourly":
            return `${dollars}/hr`;
        case "daily":
            return `${dollars}/day`;
        case "fixed":
            return `${dollars} flat`;
        default:
            return dollars;
    }
}
