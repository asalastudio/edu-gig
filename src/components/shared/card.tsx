import * as React from "react"
import { cn } from "@/lib/utils"

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    onClick?: () => void;
}

export function Card({ children, className, onClick, ...props }: CardProps) {
    return (
        <div
            onClick={onClick}
            className={cn(
                // Base
                "rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-[var(--shadow-subtle)]",
                // Hover — lifts with shadow, border darkens slightly
                "hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-soft)]",
                // Transition — only what needs to change
                "transition-[border-color,box-shadow,transform] duration-150 ease-out",
                // Interactive cursor if clickable
                onClick && "cursor-pointer hover:-translate-y-[1px]",
                className
            )}
            {...props}
        >
            {children}
        </div>
    )
}
