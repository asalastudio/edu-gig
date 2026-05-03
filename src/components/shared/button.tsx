import * as React from "react"
import { cn } from "@/lib/utils"
export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export function PrimaryButton({ children, className, ...props }: ButtonProps) {
    return (
        <button
            className={cn(
                // Base
                "inline-flex items-center justify-center gap-2",
                "min-h-10 px-4 py-2.5 rounded-lg",
                "bg-[var(--accent-primary)] text-white",
                "text-sm font-bold",
                "shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_1px_2px_rgba(22,32,26,0.12)]",
                // Hover — darken, no shadow
                "hover:bg-[var(--accent-primary-h)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_4px_12px_rgba(22,32,26,0.14)]",
                // Active — press down
                "active:scale-[0.98]",
                // Focus — accessible ring
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2",
                // Disabled
                "disabled:opacity-40 disabled:cursor-not-allowed",
                // Transition
                "transition-[background-color,box-shadow,transform] duration-150 ease-out",
                className
            )}
            {...props}
        >
            {children}
        </button>
    )
}
