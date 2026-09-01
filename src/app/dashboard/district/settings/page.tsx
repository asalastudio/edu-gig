"use client";

import React from "react";
import { UserButton, SignOutButton } from "@clerk/nextjs";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Sidebar } from "@/components/shared/sidebar";
import { PageHeader } from "@/components/shared/page-header";
import { ProcurementRequestList } from "@/components/procurement/procurement-request-list";
import { ArrowLeft } from "@phosphor-icons/react";

export default function DistrictSettingsPage() {
    const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    const district = useQuery(api.districts.getMine, hasClerk ? {} : "skip");
    const updatePrefs = useMutation(api.districts.updateNotificationPreferences);
    const prefs = district?.notificationPreferences ?? {
        emailNewProposals: true,
        emailNewMessages: true,
        emailPlacementUpdates: true,
    };

    async function toggle(
        key: "emailNewProposals" | "emailNewMessages" | "emailPlacementUpdates",
        checked: boolean
    ) {
        if (!district) return;
        await updatePrefs({
            districtId: district._id,
            emailNewProposals: key === "emailNewProposals" ? checked : prefs.emailNewProposals,
            emailNewMessages: key === "emailNewMessages" ? checked : prefs.emailNewMessages,
            emailPlacementUpdates: key === "emailPlacementUpdates" ? checked : prefs.emailPlacementUpdates,
        });
    }

    return (
        <div className="flex h-screen bg-[var(--bg-subtle)] font-sans pt-14 lg:pt-0">
            <Sidebar />
            <main className="flex-1 overflow-y-auto w-full relative">
                <div className="max-w-3xl mx-auto px-8 lg:px-12 py-10">
                    <Link
                        href="/dashboard/district"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--accent-primary)] mb-8"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to dashboard
                    </Link>
                    <PageHeader
                        title="District account settings"
                        description="Account and organization preferences for hiring teams."
                    />
                    <div className="mt-10 space-y-8">
                        <section className="p-8 rounded-lg bg-white border border-[var(--border-subtle)] shadow-sm">
                            <h2 className="font-heading text-lg font-bold text-[var(--text-primary)] mb-4">Account</h2>
                            {hasClerk ? (
                                <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                                    <UserButton />
                                    <p className="text-sm text-[var(--text-secondary)]">
                                        Manage your profile, security, and connected accounts with Clerk.
                                    </p>
                                </div>
                            ) : (
                                <p className="text-sm text-[var(--text-secondary)]">
                                    Authentication is not configured. Add Clerk keys to enable account management.
                                </p>
                            )}
                        </section>
                        <section className="p-8 rounded-lg bg-white border border-[var(--border-subtle)] shadow-sm">
                            <h2 className="font-heading text-lg font-bold text-[var(--text-primary)] mb-4">Notifications</h2>
                            <div className="space-y-4">
                                {[
                                    { id: "emailNewMessages" as const, label: "New consultant messages" },
                                    { id: "emailNewProposals" as const, label: "New proposals" },
                                    { id: "emailPlacementUpdates" as const, label: "Engagement and placement updates" },
                                ].map((item) => (
                                    <label key={item.id} className="flex items-center justify-between gap-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4">
                                        <span className="text-sm font-semibold text-[var(--text-primary)]">{item.label}</span>
                                        <input
                                            type="checkbox"
                                            checked={prefs[item.id]}
                                            disabled={!district}
                                            onChange={(e) => void toggle(item.id, e.target.checked)}
                                            className="h-4 w-4 rounded border-[var(--border-strong)] text-[var(--accent-primary)]"
                                        />
                                    </label>
                                ))}
                            </div>
                            <p className="mt-4 text-xs font-medium text-[var(--text-tertiary)]">
                                These preferences are saved to your district account.
                            </p>
                        </section>
                        <section className="p-8 rounded-lg bg-white border border-[var(--border-subtle)] shadow-sm">
                            <h2 className="font-heading text-lg font-bold text-[var(--text-primary)] mb-4">Hiring account</h2>
                            <p className="text-sm text-[var(--text-secondary)] mb-4">
                                Manage needs, messages, accepted engagements, and contract documents from the district dashboard.
                            </p>
                            <div className="flex flex-wrap gap-3">
                                <Link href="/post" className="text-sm font-bold text-[var(--accent-primary)] hover:underline">Post a need</Link>
                                <Link href="/dashboard/messages" className="text-sm font-bold text-[var(--accent-primary)] hover:underline">Open messages</Link>
                                <Link href="/browse" className="text-sm font-bold text-[var(--accent-primary)] hover:underline">Browse consultants</Link>
                                <Link href="/dashboard/district/contract-hub" className="text-sm font-bold text-[var(--accent-primary)] hover:underline">Contract Hub</Link>
                            </div>
                        </section>
                        <section id="procurement" className="p-8 rounded-lg bg-white border border-[var(--border-subtle)] shadow-sm">
                            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <h2 className="font-heading text-lg font-bold text-[var(--text-primary)]">Procurement and DPA requests</h2>
                                    <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                                        Track legal, privacy, and DPA packet requests for this district account.
                                    </p>
                                </div>
                                <Link href="/dpa" className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[var(--border-strong)] px-4 text-sm font-bold">
                                    New request
                                </Link>
                            </div>
                            <ProcurementRequestList />
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
