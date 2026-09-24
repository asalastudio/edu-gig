"use client";

import Link from "next/link";
import { Buildings, ChalkboardTeacher } from "@phosphor-icons/react";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { AUTH_INTENT_PARAM } from "@/lib/auth-intent";

export default function LoginHubPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-app)] flex flex-col font-sans">
            <SiteHeader />
            <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-16 text-center">
                <div className="education-rule mx-auto mb-5" />
                <h1 className="font-heading text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-3">
                    Sign in or create your account
                </h1>
                <p className="text-lg text-[var(--text-secondary)] font-medium mb-12 max-w-xl mx-auto">
                    Choose your account path once to continue. New or returning, this is where you start — you can switch to another path later from account settings.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                    <Link
                        href={`/sign-in?${AUTH_INTENT_PARAM}=district`}
                        className="group flex flex-col gap-4 p-8 rounded-lg bg-white border border-[var(--border-default)] shadow-[var(--shadow-subtle)] hover:border-[var(--accent-primary)]/40 hover:shadow-[var(--shadow-soft)] transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-16 h-16 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center group-hover:bg-[var(--accent-primary)]/15 transition-colors">
                                <Buildings weight="duotone" className="w-8 h-8 text-[var(--accent-primary)]" />
                            </div>
                            <div>
                                <h2 className="font-heading text-xl font-bold text-[var(--text-primary)] mb-1">
                                    I represent a school or district
                                </h2>
                                <p className="text-sm text-[var(--text-secondary)] font-medium">
                                    Districts, principals, HR — post needs and browse talent.
                                </p>
                            </div>
                        </div>
                        <span className="text-sm font-bold text-[var(--accent-primary)] group-hover:underline">
                            Continue →
                        </span>
                    </Link>

                    <Link
                        href={`/sign-in?${AUTH_INTENT_PARAM}=educator`}
                        className="group flex flex-col gap-4 p-8 rounded-lg bg-white border border-[var(--border-default)] shadow-[var(--shadow-subtle)] hover:border-[var(--accent-primary)]/40 hover:shadow-[var(--shadow-soft)] transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-16 h-16 rounded-lg bg-[var(--accent-secondary)]/20 flex items-center justify-center group-hover:bg-[var(--accent-secondary)]/30 transition-colors">
                                <ChalkboardTeacher weight="duotone" className="w-8 h-8 text-[var(--text-primary)]" />
                            </div>
                            <div>
                                <h2 className="font-heading text-xl font-bold text-[var(--text-primary)] mb-1">
                                    I&apos;m an educator
                                </h2>
                                <p className="text-sm text-[var(--text-secondary)] font-medium">
                                    Build your profile, manage gigs, and get hired.
                                </p>
                            </div>
                        </div>
                        <span className="text-sm font-bold text-[var(--accent-primary)] group-hover:underline">
                            Continue →
                        </span>
                    </Link>
                </div>

                <div className="mt-10 rounded-lg border border-[var(--accent-primary)]/20 bg-[var(--accent-primary)]/5 px-6 py-5">
                    <p className="text-base font-bold text-[var(--text-primary)]">Don&apos;t have an account yet?</p>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        Choose a path above, then use <strong>Sign up</strong> on the next screen. New district and consultant accounts start here.
                    </p>
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-center">
                        <Link
                            href={`/sign-up?${AUTH_INTENT_PARAM}=district`}
                            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[var(--accent-primary)] px-4 text-sm font-bold text-white hover:opacity-90"
                        >
                            Create a district account
                        </Link>
                        <Link
                            href={`/sign-up?${AUTH_INTENT_PARAM}=educator`}
                            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[var(--border-strong)] px-4 text-sm font-bold text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                        >
                            Create a consultant account
                        </Link>
                    </div>
                </div>
            </main>
            <SiteFooter />
        </div>
    );
}
