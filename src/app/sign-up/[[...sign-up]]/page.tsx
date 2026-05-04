"use client";

import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { AUTH_INTENT_PARAM, afterAuthPath, authPagePath, safeRedirectPath } from "@/lib/auth-intent";
import { PRIVACY_VERSION, TERMS_VERSION } from "@/lib/legal";

export default function SignUpPage() {
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
                <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-md text-center">
                    {intent === "district" && "Creating a district hiring account. You’ll add your district name next."}
                    {intent === "educator" && "Creating an educator profile. You’ll add your headline and service details next."}
                    {!intent && "Create your K12Gig account. You’ll choose whether you hire or offer services on the next screen."}
                </p>
                <SignUp
                    forceRedirectUrl={afterAuthUrl}
                    signInUrl={authPagePath("/sign-in", intent, safeNext)}
                />
                <p className="mt-5 max-w-md text-center text-xs leading-5 text-[var(--text-tertiary)]">
                    By creating an account, you agree to K12Gig&apos;s{" "}
                    <Link href="/terms" className="font-bold text-[var(--accent-primary)] hover:underline">
                        Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="font-bold text-[var(--accent-primary)] hover:underline">
                        Privacy Policy
                    </Link>
                    . You will confirm version {TERMS_VERSION} / {PRIVACY_VERSION} during setup.
                </p>
                <Link href="/login" className="mt-8 text-sm font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                    ← Choose a different path
                </Link>
            </main>
            <SiteFooter />
        </div>
    );
}
