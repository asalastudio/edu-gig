export function acceptsEducatorProposals(status: string): boolean {
    return status === "open" || status === "interviewing";
}

/** Posted or draft gigs a district can cancel/delete. Placed gigs keep the engagement. */
export function canCancelNeed(status: string): boolean {
    return status === "draft" || status === "open" || status === "interviewing";
}

/** One label + color per gig status, shared by the dashboard, Posted Gigs, and the gig page. */
export function gigStatusStyle(status: string): { label: string; className: string } {
    switch (status) {
        case "draft":
            return { label: "Draft", className: "bg-slate-50 text-slate-700 border-slate-200" };
        case "open":
            return { label: "Open", className: "bg-emerald-50 text-emerald-700 border-emerald-200" };
        case "interviewing":
            return { label: "Interviewing", className: "bg-amber-50 text-amber-700 border-amber-200" };
        case "placed":
            return { label: "Placed", className: "bg-blue-50 text-blue-700 border-blue-200" };
        case "closed":
            return { label: "Closed", className: "bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border-strong)]" };
        default:
            return { label: status, className: "bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border-strong)]" };
    }
}
