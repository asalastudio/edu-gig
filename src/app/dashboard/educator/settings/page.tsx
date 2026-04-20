"use client";

import React from "react";
import { UserButton, SignOutButton } from "@clerk/nextjs";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Sidebar } from "@/components/shared/sidebar";
import { PageHeader } from "@/components/shared/page-header";
import { CredentialsSection } from "@/components/educator/credentials-section";
import { ArrowLeft } from "@phosphor-icons/react";

export default function EducatorSettingsPage() {
    const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    const mine = useQuery(api.educators.getMine, hasClerk ? {} : "skip");
    const profileHref = mine ? `/browse/${mine._id}` : "/browse";

    return (
        <div className="flex h-screen bg-[var(--bg-subtle)] font-sans">
            <Sidebar />
            <main className="flex-1 overflow-y-auto w-full relative">
                <div className="max-w-3xl mx-auto px-8 lg:px-12 py-10">
                    <Link
                        href="/dashboard/educator"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--accent-primary)] mb-8"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to dashboard
                    </Link>
                    <PageHeader
                        title="Educator settings"
                        description="Profile visibility, rates, and notifications."
                    />
                    <div className="mt-10 space-y-8">
                        <section className="p-8 rounded-3xl bg-white border border-[var(--border-subtle)] shadow-sm">
                            <h2 className="font-heading text-lg font-bold text-[var(--text-primary)] mb-4">Account</h2>
                            {hasClerk ? (
                                <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                                    <UserButton />
                                    <p className="text-sm text-[var(--text-secondary)]">
                                        Manage your profile and sign-in methods.
                                    </p>
                                </div>
                            ) : (
                                <p className="text-sm text-[var(--text-secondary)]">
                                    Authentication is not configured. Add Clerk keys to enable account management.
                                </p>
                            )}
                        </section>
                        <CredentialsSection />
                        <section className="p-8 rounded-3xl bg-white border border-[var(--border-subtle)] shadow-sm">
                            <h2 className="font-heading text-lg font-bold text-[var(--text-primary)] mb-4">Public profile</h2>
                            <p className="text-sm text-[var(--text-secondary)] mb-4">
                                Edit headline, credentials, and availability from your profile in a future update.
                            </p>
                            <Link href={profileHref} className="text-sm font-bold text-[var(--accent-primary)] hover:underline">
                                {mine ? "View your public profile" : "Browse directory (demo profiles)"}
                            </Link>
                        </section>
                        {hasClerk && (
                            <div className="pt-4">
                                <SignOutButton>
                                    <button
                                        type="button"
                                        className="text-sm font-bold text-red-700 hover:underline"
                                    >
                                        Sign out
                                    </button>
                                </SignOutButton>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
