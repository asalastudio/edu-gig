import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    hint?: string;
    error?: string;
}

export function Input({ label, hint, error, className, ...props }: InputProps) {
    return (
        <div className="flex flex-col gap-1.5">
            {label && (
                <label className="text-sm font-medium text-[var(--text-secondary)]">
                    {label}
                </label>
            )}
            <input
                className={cn(
                    // Base
                    "w-full px-3 py-2 rounded-md",
                    "bg-[var(--bg-surface)] border border-[var(--border-default)]",
                    "text-sm text-[var(--text-primary)]",
                    "placeholder:text-[var(--text-tertiary)]",
                    // Hover
                    "hover:border-[var(--border-strong)]",
                    // Focus — chalkboard green ring, no blue
                    "focus:outline-none focus:border-[var(--accent-primary)]",
                    "focus:ring-2 focus:ring-[var(--focus-ring)]",
                    // Error
                    error && "border-[var(--accent-danger)] focus:ring-red-100",
                    // Transition
                    "transition-[border-color,box-shadow] duration-150",
                    className
                )}
                {...props}
            />
            {hint && !error && (
                <p className="text-xs text-[var(--text-tertiary)]">{hint}</p>
            )}
            {error && (
                <p className="text-xs text-[var(--accent-danger)]">{error}</p>
            )}
        </div>
    )
}
