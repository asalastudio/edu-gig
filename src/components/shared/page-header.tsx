import * as React from "react"

export interface PageHeaderProps {
    title: string;
    description?: string;
    actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
    return (
        <div className="flex flex-col items-start justify-between gap-3">
            <div className="education-rule" />
            <div>
                <h1 className="font-heading text-4xl font-bold text-[var(--text-primary)] tracking-tight mb-2">
                    {title}
                </h1>
                {description && (
                    <p className="text-lg text-[var(--text-secondary)] font-medium max-w-3xl">
                        {description}
                    </p>
                )}
            </div>
            {actions && (
                <div className="flex items-center gap-4">
                    {actions}
                </div>
            )}
        </div>
    )
}
