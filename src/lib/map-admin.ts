import { procurementStatusLabel as procurementLabel } from "@/lib/procurement";

export type AdminBadgeTone = "neutral" | "blue" | "amber" | "emerald" | "red" | "violet";

export function adminRoleLabel(role: string) {
    switch (role) {
        case "district_admin":
            return "District Admin";
        case "district_hr":
            return "District HR";
        case "superintendent":
            return "Superintendent";
        case "superadmin":
            return "Superadmin";
        case "educator":
            return "Educator";
        default:
            return "Unknown";
    }
}

export function canAccessAdmin(role: string | null | undefined) {
    return role === "superadmin";
}

export function verificationStatusLabel(status: string) {
    switch (status) {
        case "premier":
            return "Premier";
        case "verified":
            return "Verified";
        case "pending":
            return "Pending review";
        case "unverified":
            return "Unverified";
        default:
            return "Unknown";
    }
}

export function verificationStatusTone(status: string): AdminBadgeTone {
    switch (status) {
        case "premier":
            return "violet";
        case "verified":
            return "emerald";
        case "pending":
            return "amber";
        case "unverified":
            return "red";
        default:
            return "neutral";
    }
}

export function availabilityStatusLabel(status: string) {
    switch (status) {
        case "open":
            return "Open";
        case "limited":
            return "Limited";
        case "closed":
            return "Closed";
        default:
            return "Unknown";
    }
}

export function availabilityStatusTone(status: string): AdminBadgeTone {
    switch (status) {
        case "open":
            return "emerald";
        case "limited":
            return "amber";
        case "closed":
            return "neutral";
        default:
            return "neutral";
    }
}

export function procurementStatusLabel(status: string) {
    return procurementLabel(status);
}

export function procurementStatusTone(status: string): AdminBadgeTone {
    switch (status) {
        case "new":
            return "blue";
        case "in_review":
        case "waiting_on_district":
            return "amber";
        case "packet_sent":
        case "approved":
            return "emerald";
        case "closed":
            return "neutral";
        default:
            return "neutral";
    }
}

export function orderStatusLabel(status: string) {
    switch (status) {
        case "pending":
            return "Pending";
        case "accepted":
            return "Accepted";
        case "in_progress":
            return "In progress";
        case "completed":
            return "Completed";
        case "cancelled":
            return "Cancelled";
        case "disputed":
            return "Disputed";
        default:
            return "Unknown";
    }
}

export function orderStatusTone(status: string): AdminBadgeTone {
    switch (status) {
        case "pending":
            return "amber";
        case "accepted":
        case "in_progress":
            return "blue";
        case "completed":
            return "emerald";
        case "cancelled":
            return "neutral";
        case "disputed":
            return "red";
        default:
            return "neutral";
    }
}

export function planTypeLabel(planType: string) {
    switch (planType) {
        case "free":
            return "Free";
        case "essential":
            return "Essential";
        case "professional":
            return "Professional";
        case "enterprise":
            return "Enterprise";
        default:
            return "Unknown";
    }
}

export function formatAdminMoney(amount: number | null | undefined) {
    const value = amount ?? 0;
    return value.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    });
}

export function formatAdminDate(timestamp: number | null | undefined) {
    if (!timestamp) return "Not set";
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(new Date(timestamp));
}

export function adminEmptyState(kind: string) {
    return `No ${kind} found`;
}
