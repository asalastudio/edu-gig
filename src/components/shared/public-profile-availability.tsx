import { CalendarBlank } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import {
    publicProfileAvailabilityCopy,
    type PublicAvailabilityStatus,
} from "@/lib/public-profile-availability";

const statusClass: Record<PublicAvailabilityStatus, string> = {
    open: "bg-emerald-100 text-emerald-800 border-emerald-200",
    limited: "bg-amber-100 text-amber-900 border-amber-200",
    closed: "bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border-strong)]",
};

export function PublicProfileAvailability({ status }: { status: PublicAvailabilityStatus }) {
    const copy = publicProfileAvailabilityCopy(status);

    return (
        <div
            data-testid="profile-availability"
            className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4 flex flex-col sm:flex-row sm:items-center gap-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]"
        >
            <div className="flex-1">
                <div className="flex items-center gap-2 text-[var(--text-primary)]">
                    <CalendarBlank weight="bold" className="w-5 h-5 text-[var(--accent-primary)]" />
                    <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
                        Availability
                    </span>
                </div>
                <span
                    className={cn(
                        "mt-2 inline-flex items-center gap-2 px-3 py-1.5 border rounded-lg font-bold text-sm",
                        statusClass[status]
                    )}
                >
                    {status === "open" && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden />
                    )}
                    {copy.label}
                </span>
                <p className="text-sm font-medium text-[var(--text-secondary)] mt-2">{copy.hint}</p>
            </div>
        </div>
    );
}
