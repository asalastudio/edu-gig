"use client";

import React from "react";
import Link from "next/link";
import { Sidebar } from "@/components/shared/sidebar";
import { PageHeader } from "@/components/shared/page-header";
import { PrimaryButton } from "@/components/shared/button";
import { ArrowLeft, Briefcase } from "@phosphor-icons/react";

/** Dedicated nav target for “My Gigs” (sidebar); content can merge with main dashboard later. */
export default function EducatorMyGigsPage() {
    return (
        <div className="flex h-screen bg-[var(--bg-subtle)] font-sans">
            <Sidebar />
            <main className="flex-1 overflow-y-auto w-full relative">
                <div className="max-w-[1600px] w-full mx-auto px-8 lg:px-12 py-10">
                    <Link
                        href="/dashboard/educator"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--accent-primary)] mb-8"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to dashboard
                    </Link>
                    <PageHeader
                        title="My gigs"
                        description="Manage listings, proposals, and active placements."
                        actions={
                            <PrimaryButton onClick={() => alert("Create a gig — coming soon.")}>
                                <Briefcase className="w-4 h-4" /> New gig
                            </PrimaryButton>
                        }
                    />
                    <p className="mt-6 text-[var(--text-secondary)] max-w-xl">
                        Gig management will appear here. For now, use your dashboard for availability and profile updates.
                    </p>
                </div>
            </main>
        </div>
    );
}
