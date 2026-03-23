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
        <div className="p-8 rounded-3xl border border-[var(--border-subtle)] bg-white
                    hover:border-[var(--accent-primary)]/40 hover:shadow-md
                    transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
                <span className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-widest">
                    {label}
                </span>
                {Icon && (
                    <div className="w-12 h-12 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center">
                        <Icon weight="duotone" className="h-6 w-6 text-[var(--accent-primary)]" />
                    </div>
                )}
            </div>

            <div className="font-heading text-4xl font-bold text-[var(--text-primary)] tracking-tight">
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
