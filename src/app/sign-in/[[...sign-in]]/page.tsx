"use client";

import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { AUTH_INTENT_PARAM, afterAuthPath, authPagePath, safeRedirectPath } from "@/lib/auth-intent";

export default function SignInPage() {
    const searchParams = useSearchParams();
    const intentParam = searchParams.get(AUTH_INTENT_PARAM);
    const intent = intentParam === "district" || intentParam === "educator" ? intentParam : null;
    const redirectParam = searchParams.get("redirect_url") ?? searchParams.get("redirectUrl") ?? searchParams.get("next");
    const currentOrigin = typeof window === "undefined" ? undefined : window.location.origin;
    const safeNext = safeRedirectPath(redirectParam, currentOrigin);
    const afterAuthUrl = afterAuthPath(intent, safeNext);

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
            <main className="flex-1 px-6 py-10 md:py-14">
                <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(360px,1fr)] lg:items-start">
                    <section className="rounded-lg border border-[var(--border-subtle)] bg-white p-6 shadow-[var(--shadow-subtle)] md:p-8">
                        <div className="education-rule mb-4" />
                        <h1 className="font-heading text-3xl font-bold tracking-tight text-[var(--text-primary)] md:text-4xl">
                            Sign in to K12Gig
                        </h1>
                        <p className="mt-3 text-base leading-7 text-[var(--text-secondary)]">
                            {intent === "district" && "Use your district, principal, or HR account to post needs, browse educators, and manage bookings."}
                            {intent === "educator" && "Use your educator account to manage your profile, gigs, proposals, messages, and payments."}
                            {!intent && "Choose your path, then continue with the account tied to your district or educator profile."}
                        </p>
                        <Link href="/login" className="mt-6 inline-flex text-sm font-bold text-[var(--accent-primary)] hover:underline">
                            Other sign-in options
                        </Link>
                    </section>

                    <section className="flex justify-center rounded-lg border border-[var(--border-subtle)] bg-white p-4 shadow-[var(--shadow-soft)] md:p-6">
                        <SignIn
                            forceRedirectUrl={afterAuthUrl}
                            signUpUrl={authPagePath("/sign-up", intent, safeNext)}
                        />
                    </section>
                </div>
            </main>
            <SiteFooter />
        </div>
    );
}
