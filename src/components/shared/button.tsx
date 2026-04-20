import * as React from "react"
import { cn } from "@/lib/utils"
export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export function PrimaryButton({ children, className, ...props }: ButtonProps) {
    return (
        <button
            className={cn(
                // Base
                "inline-flex items-center justify-center gap-2",
                "px-4 py-2 rounded-md",
                "bg-[var(--accent-primary)] text-white",
                "text-sm font-medium",
                // Hover — darken, no shadow
                "hover:bg-[var(--accent-primary-h)]",
                // Active — press down
                "active:scale-[0.98]",
                // Focus — accessible ring
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--focus-ring] focus-visible:ring-offset-2",
                // Disabled
                "disabled:opacity-40 disabled:cursor-not-allowed",
                // Transition
                "transition-[background-color,transform] duration-100 ease-out",
                className
            )}
            {...props}
        >
            {children}
        </button>
    )
}
