import * as React from "react"
import { LucideIcon } from "lucide-react"

export interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="h-12 w-12 rounded-xl border border-[--border-default]
                      flex items-center justify-center mb-4
                      bg-[--bg-subtle]">
                <Icon className="h-6 w-6 text-[--text-tertiary]" />
            </div>
            <h3 className="font-accent text-lg font-semibold text-[--text-primary] mb-1">
                {title}
            </h3>
            <p className="font-accent text-sm text-[--text-tertiary] max-w-[280px] leading-relaxed mb-6">
                {description}
            </p>
            {action}
        </div>
    )
}
