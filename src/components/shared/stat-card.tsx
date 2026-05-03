import { cn } from "@/lib/utils"

export interface StatCardProps {
    label: string;
    value: string | number;
    delta?: number;
    deltaLabel?: string;
    icon?: React.ElementType;
}

export function StatCard({ label, value, delta, deltaLabel, icon: Icon }: StatCardProps) {
    const isPositive = delta !== undefined && delta >= 0
    return (
        <div className="group relative overflow-hidden p-6 rounded-lg border border-[var(--border-default)] bg-white shadow-[var(--shadow-subtle)]
                    hover:border-[var(--accent-primary)]/40 hover:shadow-[var(--shadow-soft)]
                    transition-all duration-300">
            <div className="absolute inset-x-0 top-0 h-1 bg-[var(--accent-primary)] opacity-80" />
            <div className="flex items-center justify-between mb-6">
                <span className="eyebrow">
                    {label}
                </span>
                {Icon && (
                    <div className="w-11 h-11 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-center group-hover:bg-[var(--accent-primary)]/10 transition-colors">
                        <Icon weight="duotone" className="h-6 w-6 text-[var(--accent-primary)]" />
                    </div>
                )}
            </div>

            <div className="font-heading text-4xl font-bold text-[var(--text-primary)] tracking-tight tabular-nums">
                {value}
            </div>

            {delta !== undefined && (
                <div className="mt-4 flex items-center gap-2">
                    <span className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-sm font-bold",
                        isPositive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                    )}>
                        {isPositive ? "↑" : "↓"} {Math.abs(delta)}%
                    </span>
                    <span className="text-sm font-medium text-[var(--text-secondary)]">{deltaLabel}</span>
                </div>
            )}
        </div>
    )
}
