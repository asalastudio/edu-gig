"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { PrimaryButton } from "@/components/shared/button";
import {
    AUTH_INTENT_PARAM,
    dashboardPathForIntent,
    intentFromRole,
    isAuthIntent,
    type AuthIntent,
} from "@/lib/auth-intent";
import { Buildings, ChalkboardTeacher } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

/** Avoid calling `useUser` when Clerk isn’t configured (no ClerkProvider) — required for static build. */
export default function OnboardingPage() {
    if (!hasClerk) {
        return <OnboardingWithoutClerk />;
    }
    return <OnboardingWithClerk />;
}

function OnboardingWithoutClerk() {
    const router = useRouter();
    return (
        <div className="min-h-screen bg-[var(--bg-app)] flex flex-col">
            <SiteHeader />
            <main className="flex-1 max-w-lg mx-auto px-6 py-16 text-center">
                <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)] mb-4">Onboarding</h1>
                <p className="text-[var(--text-secondary)] mb-8">
                    Sign in is not configured. Use the demo dashboards from the home page, or add Clerk keys to your environment.
                </p>
                <PrimaryButton onClick={() => router.push("/")}>Home</PrimaryButton>
            </main>
            <SiteFooter />
        </div>
    );
}

function OnboardingWithClerk() {
    const { user, isLoaded } = useUser();
    const router = useRouter();
    const searchParams = useSearchParams();
    const intentParam = searchParams.get(AUTH_INTENT_PARAM);

    const viewer = useQuery(api.users.viewer);
    const completeOnboarding = useMutation(api.users.completeOnboarding);

    const [choice, setChoice] = useState<AuthIntent | null>(() =>
        isAuthIntent(intentParam) ? intentParam : null
    );
    const [orgName, setOrgName] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!isLoaded) return;
        if (!user) {
            router.replace("/sign-in");
            return;
        }
        if (viewer === undefined) return;
        if (viewer?.onboarded) {
            router.replace(dashboardPathForIntent(intentFromRole(viewer.role)));
        }
    }, [isLoaded, user, viewer, router]);

    async function handleContinue(e: React.FormEvent) {
        e.preventDefault();
        if (!choice) {
            setError("Choose how you’ll use EduGig.");
            return;
        }
        setError(null);
        setSubmitting(true);
        try {
            await completeOnboarding({
                role: choice === "educator" ? "educator" : "district_admin",
                organizationName: choice === "district" ? orgName.trim() || undefined : undefined,
            });
            router.replace(dashboardPathForIntent(choice));
        } catch (err) {
            console.error(err);
            setError(
                "Could not save your profile. If you just enabled Clerk, configure the Convex + Clerk integration so your account syncs (see docs)."
            );
        } finally {
            setSubmitting(false);
        }
    }

    if (!isLoaded || viewer === undefined) {
        return (
            <div className="min-h-screen bg-[var(--bg-app)] flex flex-col">
                <SiteHeader />
                <main className="flex-1 flex items-center justify-center">
                    <p className="text-[var(--text-secondary)] font-medium">Loading…</p>
                </main>
                <SiteFooter />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    if (viewer?.onboarded) {
        return null;
    }

    return (
        <div className="min-h-screen bg-[var(--bg-app)] flex flex-col">
            <SiteHeader />
            <main className="flex-1 max-w-xl mx-auto w-full px-6 py-12">
                <h1 className="font-heading text-3xl font-bold text-[var(--text-primary)] mb-2">Welcome to EduGig</h1>
                <p className="text-[var(--text-secondary)] font-medium mb-8">
                    Tell us how you&apos;ll use the platform. You can update this later in settings.
                </p>

                <form onSubmit={handleContinue} className="flex flex-col gap-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => {
                                setChoice("district");
                                setError(null);
                            }}
                            className={cn(
                                "flex flex-col items-start gap-3 p-6 rounded-2xl border-2 text-left transition-all",
                                choice === "district"
                                    ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/5"
                                    : "border-[var(--border-subtle)] hover:border-[var(--border-strong)]"
                            )}
                        >
                            <Buildings weight="duotone" className="w-10 h-10 text-[var(--accent-primary)]" />
                            <span className="font-bold text-[var(--text-primary)]">I hire for a district or school</span>
                            <span className="text-sm text-[var(--text-secondary)]">Post needs, browse educators, manage placements.</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setChoice("educator");
                                setError(null);
                            }}
                            className={cn(
                                "flex flex-col items-start gap-3 p-6 rounded-2xl border-2 text-left transition-all",
                                choice === "educator"
                                    ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/5"
                                    : "border-[var(--border-subtle)] hover:border-[var(--border-strong)]"
                            )}
                        >
                            <ChalkboardTeacher weight="duotone" className="w-10 h-10 text-[var(--text-primary)]" />
                            <span className="font-bold text-[var(--text-primary)]">I&apos;m an educator</span>
                            <span className="text-sm text-[var(--text-secondary)]">Build your profile and find work.</span>
                        </button>
                    </div>

                    {choice === "district" && (
                        <div className="flex flex-col gap-2">
                            <label htmlFor="org" className="text-sm font-semibold text-[var(--text-primary)]">
                                Organization name (optional)
                            </label>
                            <input
                                id="org"
                                value={orgName}
                                onChange={(e) => setOrgName(e.target.value)}
                                placeholder="e.g. Austin ISD"
                                className="w-full h-12 px-4 rounded-xl border border-[var(--border-subtle)] bg-white text-[var(--text-primary)]"
                            />
                        </div>
                    )}

                    {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

                    <PrimaryButton type="submit" disabled={submitting || !choice} className="w-full sm:w-auto py-3">
                        {submitting ? "Saving…" : "Continue to dashboard"}
                    </PrimaryButton>
                </form>
            </main>
            <SiteFooter />
        </div>
    );
}
