"use client";

import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { AUTH_INTENT_PARAM, isAuthIntent } from "@/lib/auth-intent";

export default function SignInPage() {
    const searchParams = useSearchParams();
    const intentParam = searchParams.get(AUTH_INTENT_PARAM);
    const intent = isAuthIntent(intentParam) ? intentParam : null;

    const afterAuthUrl = intent
        ? `/onboarding?${AUTH_INTENT_PARAM}=${intent}`
        : "/onboarding";

    const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

    if (!hasClerk) {
        return (
            <div className="min-h-screen bg-[var(--bg-app)] flex flex-col">
                <SiteHeader />
                <main className="flex-1 max-w-lg mx-auto px-6 py-16 text-center">
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
            <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
                <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-md text-center">
                    {intent === "district" && "Signing in as a district, principal, or HR — you’ll finish setup on the next screen."}
                    {intent === "educator" && "Signing in as an educator — you’ll finish setup on the next screen."}
                    {!intent && "Choose your path after you sign in, or go back to pick hire vs educator first."}
                </p>
                <SignIn
                    forceRedirectUrl={afterAuthUrl}
                    signUpUrl={intent ? `/sign-up?${AUTH_INTENT_PARAM}=${intent}` : "/sign-up"}
                />
                <Link href="/login" className="mt-8 text-sm font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                    ← Other sign-in options
                </Link>
            </main>
            <SiteFooter />
        </div>
    );
}
