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
                <label className="text-sm font-medium text-[--text-secondary]">
                    {label}
                </label>
            )}
            <input
                className={cn(
                    // Base
                    "w-full px-3 py-2 rounded-md",
                    "bg-[--bg-surface] border border-[--border-default]",
                    "text-sm text-[--text-primary]",
                    "placeholder:text-[--text-tertiary]",
                    // Hover
                    "hover:border-[--border-strong]",
                    // Focus — chalkboard green ring, no blue
                    "focus:outline-none focus:border-[--accent-primary]",
                    "focus:ring-2 focus:ring-[--focus-ring]",
                    // Error
                    error && "border-[--accent-danger] focus:ring-red-100",
                    // Transition
                    "transition-[border-color,box-shadow] duration-150",
                    className
                )}
                {...props}
            />
            {hint && !error && (
                <p className="text-xs text-[--text-tertiary]">{hint}</p>
            )}
            {error && (
                <p className="text-xs text-[--accent-danger]">{error}</p>
            )}
        </div>
    )
}
