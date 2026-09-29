/**
 * Shared Clerk component styling so embedded auth cards match the app's
 * design tokens instead of Clerk's defaults. The page supplies the card
 * chrome (border/shadow/title); the Clerk card renders as a bare form.
 *
 * Hide Clerk's built-in sign-in/sign-up footer switcher. Each auth page
 * already renders one custom, intent-preserving path below the card
 * (prominent Sign up on /sign-in; Sign in on /sign-up). Showing both
 * stacks two "Don't have an account?" / "Already have an account?" prompts.
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
        footerAction: "hidden",
        footerActionText: "hidden",
        footerActionLink: "hidden",
    },
} as const;
