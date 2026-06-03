import * as React from "react"

export interface PageHeaderProps {
    title: string;
    description?: string;
    actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
    return (
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
                <div className="education-rule mb-4" />
                <h1 className="font-heading text-3xl font-bold text-[var(--text-primary)] tracking-tight md:text-4xl">
                    {title}
                </h1>
                {description && (
                    <p className="mt-2 text-base leading-7 text-[var(--text-secondary)]">
                        {description}
                    </p>
                )}
            </div>
            {actions && (
                <div className="flex w-full flex-wrap items-center gap-3 md:w-auto md:justify-end">
                    {actions}
                </div>
            )}
        </div>
    )
}
