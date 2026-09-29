import Link from "next/link";

type AuthAccountSwitchProps = {
    href: string;
    mode: "sign-up" | "sign-in";
};

/**
 * Single custom path between /sign-in and /sign-up. Clerk's own footer
 * switcher is hidden via appearance so this is the only prompt.
 */
export function AuthAccountSwitch({ href, mode }: AuthAccountSwitchProps) {
    if (mode === "sign-up") {
        return (
            <div className="mt-6 w-full max-w-md rounded-lg border border-[var(--accent-primary)]/20 bg-[var(--accent-primary)]/5 px-5 py-4 text-center">
                <p className="text-sm font-bold text-[var(--text-primary)]">Don&apos;t have an account?</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    Create one now — you can finish your profile after you verify email.
                </p>
                <Link
                    href={href}
                    className="mt-3 inline-flex min-h-10 items-center justify-center rounded-lg bg-[var(--accent-primary)] px-4 text-sm font-bold text-white hover:opacity-90"
                >
                    Sign up
                </Link>
            </div>
        );
    }

    return (
        <div className="mt-6 w-full max-w-md rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-5 py-4 text-center">
            <p className="text-sm font-bold text-[var(--text-primary)]">Already have an account?</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Sign in to continue. Your district or consultant path stays with you.
            </p>
            <Link
                href={href}
                className="mt-3 inline-flex min-h-10 items-center justify-center rounded-lg border border-[var(--border-strong)] px-4 text-sm font-bold text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
            >
                Sign in
            </Link>
        </div>
    );
}
