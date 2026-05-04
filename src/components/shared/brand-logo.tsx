import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 64 64"
            aria-hidden="true"
            className={cn("h-9 w-9 shrink-0", className)}
        >
            <rect width="64" height="64" rx="14" fill="var(--accent-primary)" />
            <path
                d="M32 10.5c6.9 5 13.9 7.1 21 7.5v12.1c0 13.3-7.6 22.4-21 27.2-13.4-4.8-21-13.9-21-27.2V18c7.1-.4 14.1-2.5 21-7.5Z"
                fill="#183A2F"
                stroke="#F7F1E3"
                strokeWidth="3.2"
                strokeLinejoin="round"
            />
            <path
                d="M18.7 27.2 32 20.8l13.3 6.4L32 33.7 18.7 27.2Z"
                fill="#F7F1E3"
            />
            <path
                d="M24.2 32.6v5.1L32 41.5l7.8-3.8v-5.1L32 36.3l-7.8-3.7Z"
                fill="#F7F1E3"
            />
            <path
                d="m20.4 42.2 6.4 6.5 17-19.1"
                fill="none"
                stroke="var(--accent-secondary)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export function BrandLogo({
    className,
    inverse = false,
}: {
    className?: string;
    inverse?: boolean;
}) {
    return (
        <span className={cn("inline-flex items-center gap-2.5", className)}>
            <BrandMark />
            <span
                className={cn(
                    "font-heading text-2xl font-bold leading-none",
                    inverse ? "text-white" : "text-[var(--text-primary)]"
                )}
            >
                K12Gig
            </span>
        </span>
    );
}
