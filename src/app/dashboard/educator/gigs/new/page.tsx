"use client";

import React from "react";
import Link from "next/link";
import { Sidebar } from "@/components/shared/sidebar";
import { PageHeader } from "@/components/shared/page-header";
import { PrimaryButton } from "@/components/shared/button";
import { Card } from "@/components/shared/card";
import { ArrowLeft, ClipboardText } from "@phosphor-icons/react";

/**
 * Educator self-listed gigs are retired (platform review, July 2026): districts
 * find educators through their directory profile and the Open Needs (RFP) board.
 * The route stays alive so old links land on an explanation instead of a 404.
 * Existing gigs remain manageable from /dashboard/educator/my-gigs.
 */
export default function NewGigPage() {
    return (
        <div className="flex h-screen bg-[var(--bg-subtle)] font-sans pt-14 lg:pt-0">
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
                        title="Gig listings have moved on"
                        description="Districts now find you through your profile — no separate listings needed."
                    />
                    <Card className="mt-10 p-12 flex flex-col items-center text-center">
                        <div className="h-12 w-12 rounded-lg border border-[var(--border-default)] flex items-center justify-center mb-4 bg-[var(--bg-subtle)]">
                            <ClipboardText className="w-6 h-6 text-[var(--text-tertiary)]" />
                        </div>
                        <h3 className="font-heading text-xl font-bold text-[var(--text-primary)] mb-2">
                            Your profile is your listing now.
                        </h3>
                        <p className="text-sm text-[var(--text-secondary)] max-w-md mb-6">
                            Complete your profile so districts can find you in the Directory, and respond to
                            district-posted needs with proposals on the Open Needs board.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Link href="/dashboard/educator/needs">
                                <PrimaryButton>Browse open needs</PrimaryButton>
                            </Link>
                            <Link
                                href="/dashboard/educator/settings"
                                className="inline-flex items-center justify-center px-6 text-sm font-bold text-[var(--accent-primary)] hover:underline"
                            >
                                Update my profile
                            </Link>
                        </div>
                    </Card>
                </div>
            </main>
        </div>
    );
}
