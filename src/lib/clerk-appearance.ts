/**
 * Shared Clerk component styling so embedded auth cards match the app's
 * design tokens instead of Clerk's defaults. The page supplies the card
 * chrome (border/shadow/title); the Clerk card renders as a bare form.
 */
export const clerkCardAppearance = {
    elements: {
        rootBox: "w-full",
        cardBox: "shadow-none w-full",
        card: "shadow-none border-0 bg-transparent p-2 sm:p-4",
        header: "hidden",
        formButtonPrimary:
            "bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:opacity-90 text-sm normal-case shadow-none",
        formFieldLabel: "text-[var(--text-primary)] font-semibold",
        footerActionText: "text-sm text-[var(--text-secondary)]",
        footerActionLink: "text-sm font-bold text-[var(--accent-primary)] hover:underline",
    },
} as const;
