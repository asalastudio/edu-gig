"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
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
import { US_STATES } from "@/lib/us-states";

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
    const intent: AuthIntent | null = isAuthIntent(intentParam) ? intentParam : null;

    const viewer = useQuery(api.users.viewer);
    const completeOnboarding = useMutation(api.users.completeOnboarding);

    const [value, setValue] = useState("");
    const [stateCode, setStateCode] = useState("");
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

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!intent) return;
        const trimmed = value.trim();
        if (!trimmed) {
            setError(
                intent === "educator"
                    ? "Add a headline to continue."
                    : "Enter your district or school name."
            );
            return;
        }
        if (intent === "district" && !stateCode) {
            setError("Choose your state to continue.");
            return;
        }
        setError(null);
        setSubmitting(true);
        try {
            await completeOnboarding({
                role: intent === "educator" ? "educator" : "district_admin",
                organizationName: intent === "district" ? trimmed : undefined,
                headline: intent === "educator" ? trimmed : undefined,
                state: intent === "district" ? stateCode : undefined,
            });
            router.replace(dashboardPathForIntent(intent));
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

    if (!intent) {
        return (
            <div className="min-h-screen bg-[var(--bg-app)] flex flex-col">
                <SiteHeader />
                <main className="flex-1 max-w-xl mx-auto w-full px-6 py-16 text-center">
                    <h1 className="font-heading text-3xl font-bold text-[var(--text-primary)] mb-3">
                        One more step
                    </h1>
                    <p className="text-[var(--text-secondary)] font-medium mb-8">
                        Tell us how you&apos;ll use EduGig to finish setup.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link href={`/onboarding?${AUTH_INTENT_PARAM}=district`}>
                            <PrimaryButton>I hire for a district or school</PrimaryButton>
                        </Link>
                        <Link href={`/onboarding?${AUTH_INTENT_PARAM}=educator`}>
                            <PrimaryButton>I&apos;m an educator</PrimaryButton>
                        </Link>
                    </div>
                </main>
                <SiteFooter />
            </div>
        );
    }

    const isEducator = intent === "educator";
    const firstName = user.firstName ?? "there";
    const heading = isEducator
        ? `Welcome, ${firstName}. Set up your educator profile.`
        : `Welcome, ${firstName}. Tell us about your district.`;
    const fieldLabel = isEducator ? "Professional headline" : "District or school name";
    const placeholder = isEducator
        ? "e.g. Math Interventionist & Instructional Coach"
        : "e.g. Austin ISD";
    const helperText = isEducator
        ? "This is the first thing districts see when browsing educators."
        : "Educators will see this name when you post a need.";

    return (
        <div className="min-h-screen bg-[var(--bg-app)] flex flex-col">
            <SiteHeader />
            <main className="flex-1 max-w-xl mx-auto w-full px-6 py-12">
                <h1 className="font-heading text-3xl font-bold text-[var(--text-primary)] mb-2">
                    {heading}
                </h1>
                <p className="text-[var(--text-secondary)] font-medium mb-8">
                    You can update this later in settings.
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="onboarding-field" className="text-sm font-semibold text-[var(--text-primary)]">
                            {fieldLabel}
                        </label>
                        <input
                            id="onboarding-field"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            placeholder={placeholder}
                            autoFocus
                            className="w-full h-12 px-4 rounded-xl border border-[var(--border-subtle)] bg-white text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                        />
                        <p className="text-sm text-[var(--text-tertiary)]">{helperText}</p>
                    </div>

                    {!isEducator && (
                        <div className="flex flex-col gap-2">
                            <label htmlFor="onboarding-state" className="text-sm font-semibold text-[var(--text-primary)]">
                                State
                            </label>
                            <select
                                id="onboarding-state"
                                value={stateCode}
                                onChange={(e) => setStateCode(e.target.value)}
                                className="w-full h-12 px-4 rounded-xl border border-[var(--border-subtle)] bg-white text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                            >
                                <option value="">Choose a state…</option>
                                {US_STATES.map((s) => (
                                    <option key={s.code} value={s.code}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                            <p className="text-sm text-[var(--text-tertiary)]">
                                We use this to match your district with educators licensed in your state.
                            </p>
                        </div>
                    )}

                    {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

                    <PrimaryButton type="submit" disabled={submitting} className="w-full sm:w-auto py-3">
                        {submitting ? "Saving…" : "Continue to dashboard"}
                    </PrimaryButton>
                </form>
            </main>
            <SiteFooter />
        </div>
    );
}
