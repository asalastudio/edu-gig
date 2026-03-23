"use client";

import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { AUTH_INTENT_PARAM, isAuthIntent } from "@/lib/auth-intent";

export default function SignUpPage() {
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
                        Add Clerk keys to your environment to enable account creation.
                    </p>
                    <Link href="/" className="font-semibold text-[var(--accent-primary)] hover:underline">
                        Back home
                    </Link>
                </main>
                <SiteFooter />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-app)] flex flex-col">
            <SiteHeader />
            <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
                <SignUp
                    forceRedirectUrl={afterAuthUrl}
                    signInUrl={intent ? `/sign-in?${AUTH_INTENT_PARAM}=${intent}` : "/sign-in"}
                />
                <Link href="/login" className="mt-8 text-sm font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                    ← Login hub
                </Link>
            </main>
            <SiteFooter />
        </div>
    );
}
