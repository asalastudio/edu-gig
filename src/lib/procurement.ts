export const PROCUREMENT_MATERIALS = [
    { id: "dpa", label: "Data Processing Agreement" },
    { id: "privacy_policy", label: "Privacy Policy" },
    { id: "terms", label: "Terms of Service" },
    { id: "subprocessors", label: "Subprocessor list" },
    { id: "security_overview", label: "Security overview" },
    { id: "invoice_terms", label: "Invoice / PO language" },
    { id: "msa", label: "MSA or contract terms" },
] as const;

export const PROCUREMENT_STATUS_OPTIONS = [
    { id: "new", label: "New request", tone: "blue" },
    { id: "in_review", label: "In review", tone: "amber" },
    { id: "packet_sent", label: "Packet sent", tone: "emerald" },
    { id: "waiting_on_district", label: "Waiting on district", tone: "violet" },
    { id: "approved", label: "Approved", tone: "emerald" },
    { id: "closed", label: "Closed", tone: "neutral" },
] as const;

export type ProcurementStatus = (typeof PROCUREMENT_STATUS_OPTIONS)[number]["id"];

export function procurementStatusLabel(status: string) {
    return PROCUREMENT_STATUS_OPTIONS.find((option) => option.id === status)?.label ?? "Unknown";
}

export function procurementStatusTone(status: string) {
    return PROCUREMENT_STATUS_OPTIONS.find((option) => option.id === status)?.tone ?? "neutral";
}

export function procurementMaterialLabel(id: string) {
    return PROCUREMENT_MATERIALS.find((material) => material.id === id)?.label ?? id;
}
