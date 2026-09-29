/**
 * Shared Clerk component styling so embedded auth cards match the app's
 * design tokens instead of Clerk's defaults. The page supplies the card
 * chrome (border/shadow/title); the Clerk card renders as a bare form.
 *
 * Hide Clerk's built-in sign-in/sign-up footer switcher. Each auth page
 * already renders one custom, intent-preserving path below the card
 * (prominent Sign up on /sign-in; Sign in on /sign-up). Showing both
 * stacks two "Don't have an account?" / "Already have an account?" prompts.
 *
 * Clerk v7 injects unlayered CSS that beats Tailwind v4 utilities, so
 * `className: "hidden"` is ignored live. Element values must be style
 * objects (inline) and are reinforced by unlayered CSS in globals.css.
 */
export const clerkHiddenElement = { display: "none" } as const;

export const clerkCardAppearance = {
    variables: {
        colorPrimary: "#214E3F",
    },
    elements: {
        rootBox: { width: "100%" },
        cardBox: { boxShadow: "none", width: "100%" },
        card: {
            boxShadow: "none",
            border: "0",
            backgroundColor: "transparent",
            padding: "0.5rem",
        },
        header: clerkHiddenElement,
        headerTitle: clerkHiddenElement,
        headerSubtitle: clerkHiddenElement,
        footer: clerkHiddenElement,
        footerAction: clerkHiddenElement,
        footerActionText: clerkHiddenElement,
        footerActionLink: clerkHiddenElement,
        formButtonPrimary: {
            backgroundColor: "var(--accent-primary)",
            textTransform: "none" as const,
            boxShadow: "none",
        },
        formFieldLabel: {
            color: "var(--text-primary)",
            fontWeight: 600,
        },
    },
} as const;
