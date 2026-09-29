"use client";

import { useEffect } from "react";
import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { AuthAccountSwitch } from "@/components/shared/auth-account-switch";
import { AUTH_INTENT_PARAM, afterAuthPath, authPagePath, rememberAuthIntent, safeRedirectPath } from "@/lib/auth-intent";
import { clerkCardAppearance } from "@/lib/clerk-appearance";
import { useCurrentOrigin } from "@/lib/use-current-origin";

export default function SignInPage() {
    const searchParams = useSearchParams();
    const intentParam = searchParams.get(AUTH_INTENT_PARAM);
    const intent = intentParam === "district" || intentParam === "educator" ? intentParam : null;
    const redirectParam = searchParams.get("redirect_url") ?? searchParams.get("redirectUrl") ?? searchParams.get("next");
    const currentOrigin = useCurrentOrigin();
    const safeNext = safeRedirectPath(redirectParam, currentOrigin);
    const afterAuthUrl = afterAuthPath(intent, safeNext);

    // Remember the pre-qualified role so onboarding can recover it even if
    // Clerk's redirect drops the ?intent= param (e.g. after Google OAuth).
    useEffect(() => {
        rememberAuthIntent(intent);
    }, [intent]);

    const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

    if (!hasClerk) {
        return (
            <div className="min-h-screen bg-[var(--bg-app)] flex flex-col">
                <SiteHeader />
                <main id="main-content" className="flex-1 max-w-lg mx-auto px-6 py-16 text-center">
                    <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)] mb-4">Authentication not configured</h1>
                    <p className="text-[var(--text-secondary)] mb-8">
                        Add <code className="text-sm bg-[var(--bg-subtle)] px-2 py-1 rounded">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> and{" "}
                        <code className="text-sm bg-[var(--bg-subtle)] px-2 py-1 rounded">CLERK_SECRET_KEY</code> to your environment to enable sign-in.
                        For demos, you can still use the public directory and dashboards without a session.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/login" className="font-semibold text-[var(--accent-primary)] hover:underline">
                            Login options
                        </Link>
                        <Link href="/browse" className="font-semibold text-[var(--accent-primary)] hover:underline">
                            Browse educators
                        </Link>
                        <Link href="/dashboard/district" className="font-semibold text-[var(--accent-primary)] hover:underline">
                            District dashboard (demo)
                        </Link>
                    </div>
                </main>
                <SiteFooter />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-app)] flex flex-col">
            <SiteHeader />
            <main id="main-content" className="flex-1 flex flex-col items-center justify-center px-4 py-12">
                <div className="k12-clerk-card w-full max-w-md rounded-lg border border-[var(--border-subtle)] bg-white p-4 shadow-[var(--shadow-soft)] md:p-6">
                    <div className="px-2 pt-2 pb-1 text-center sm:px-4">
                        <h1 className="font-heading text-xl font-bold text-[var(--text-primary)]">
                            Sign in to K12Gig
                        </h1>
                        <p className="mt-1 text-sm text-[var(--text-secondary)]">
                            Welcome back! Please sign in to continue.
                        </p>
                    </div>
                    {/* Reserve the production form's height (137px) so the page doesn't jump when Clerk loads. */}
                    <div className="min-h-[137px]">
                    <SignIn
                        forceRedirectUrl={afterAuthUrl}
                        signUpUrl={authPagePath("/sign-up", intent, safeNext)}
                        appearance={clerkCardAppearance}
                    />
                    </div>
                </div>
                <AuthAccountSwitch
                    mode="sign-up"
                    href={authPagePath("/sign-up", intent, safeNext)}
                />
                <Link href="/login" className="mt-8 text-sm font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                    ← Choose a different path
                </Link>
            </main>
            <SiteFooter />
        </div>
    );
}
