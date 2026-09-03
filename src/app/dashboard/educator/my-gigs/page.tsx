"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Sidebar } from "@/components/shared/sidebar";
import { PageHeader } from "@/components/shared/page-header";
import { PrimaryButton } from "@/components/shared/button";
import { Card } from "@/components/shared/card";
import { ArrowLeft, Briefcase } from "@phosphor-icons/react";
import { getAreaOfNeedLabel } from "@/lib/taxonomy";
import { formatAgreedRate, formatOrderStatus } from "@/lib/map-dashboard";
import { cn } from "@/lib/utils";

export default function EducatorMyGigsPage() {
    const viewer = useQuery(api.users.viewer, {});
    const engagements = useQuery(api.engagements.listMine, viewer ? {} : "skip");
    const isEmpty = Array.isArray(engagements) && engagements.length === 0;

    return (
        <div className="flex h-screen bg-[var(--bg-subtle)] font-sans pt-14 lg:pt-0">
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
                        title="My Gigs"
                        description="Accepted district work lives here. Coordinate scope, documents, and next steps from each engagement."
                    />

                    {engagements === undefined ? (
                        <div className="mt-10 text-[var(--text-secondary)]">Loading accepted gigs…</div>
                    ) : isEmpty ? (
                        <Card className="mt-10 p-12 flex flex-col items-center text-center">
                            <div className="h-12 w-12 rounded-lg border border-[var(--border-default)] flex items-center justify-center mb-4 bg-[var(--bg-subtle)]">
                                <Briefcase className="w-6 h-6 text-[var(--text-tertiary)]" />
                            </div>
                            <h3 className="font-heading text-xl font-bold text-[var(--text-primary)] mb-2">
                                No accepted gigs yet
                            </h3>
                            <p className="text-sm text-[var(--text-secondary)] max-w-sm mb-6">
                                When a district accepts your proposal, the engagement appears here with the agreed rate and a link to Contract Hub.
                            </p>
                            <Link href="/dashboard/board">
                                <PrimaryButton>Browse the Gig Board</PrimaryButton>
                            </Link>
                        </Card>
                    ) : (
                        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {engagements.map((engagement) => {
                                const label = formatOrderStatus(engagement.status);
                                return (
                                    <Link key={engagement._id} href={`/dashboard/engagements/${engagement._id}`}>
                                        <Card className="p-6 flex flex-col gap-4 h-full hover:border-[var(--accent-primary)]/40">
                                            <div className="flex items-start justify-between gap-3">
                                                <h3 className="font-heading text-lg font-bold text-[var(--text-primary)] leading-snug">
                                                    {getAreaOfNeedLabel(engagement.areaOfNeed)}
                                                </h3>
                                                <span
                                                    className={cn(
                                                        "text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md",
                                                        label.color === "emerald"
                                                            ? "bg-emerald-50 text-emerald-700"
                                                            : label.color === "amber"
                                                              ? "bg-amber-50 text-amber-700"
                                                              : "bg-blue-50 text-blue-700"
                                                    )}
                                                >
                                                    {label.text}
                                                </span>
                                            </div>
                                            <div className="flex flex-col gap-1 text-sm text-[var(--text-secondary)]">
                                                <span>
                                                    <span className="font-semibold text-[var(--text-primary)]">District:</span>{" "}
                                                    {engagement.orgName}
                                                </span>
                                                <span>
                                                    <span className="font-semibold text-[var(--text-primary)]">Rate:</span>{" "}
                                                    {formatAgreedRate(engagement.agreedRate, engagement.agreedRateUnit)}
                                                </span>
                                                {engagement.startDate && (
                                                    <span>
                                                        <span className="font-semibold text-[var(--text-primary)]">Start:</span>{" "}
                                                        {engagement.startDate}
                                                    </span>
                                                )}
                                            </div>
                                        </Card>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
