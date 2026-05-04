import { cn } from "@/lib/utils"

const statusConfig = {
    open: { label: "Available", dot: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-400" },
    limited: { label: "Limited", dot: "bg-amber-400", text: "text-amber-700 dark:text-amber-400" },
    closed: { label: "Unavailable", dot: "bg-[var(--text-tertiary)]", text: "text-[var(--text-tertiary)]" },
}

export function AvailabilityPill({ status }: { status: keyof typeof statusConfig }) {
    const config = statusConfig[status]
    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 px-2 py-1 rounded-full",
            "bg-[var(--bg-subtle)] border border-[var(--border-subtle)]",
            "text-xs font-medium whitespace-nowrap",
            config.text
        )}>
            <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
            {config.label}
        </span>
    )
}
