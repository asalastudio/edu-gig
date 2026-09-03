"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Sidebar } from "@/components/shared/sidebar";
import { PageHeader } from "@/components/shared/page-header";
import { PrimaryButton } from "@/components/shared/button";
import { Card } from "@/components/shared/card";
import { ArrowLeft } from "@phosphor-icons/react";
import { getAreaOfNeedLabel } from "@/lib/taxonomy";
import { formatAgreedRate, formatOrderStatus } from "@/lib/map-dashboard";
import { isDistrictRole } from "@/lib/roles";
import { cn } from "@/lib/utils";

export default function EngagementDetailPage() {
    const params = useParams<{ engagementId: string }>();
    const engagementId = params.engagementId as Id<"engagements">;
    const viewer = useQuery(api.users.viewer, {});
    const detail = useQuery(api.engagements.getById, viewer ? { engagementId } : "skip");
    const setStatus = useMutation(api.engagements.setStatus);
    const isDistrict = !!viewer && isDistrictRole(viewer.role);
    const backHref = isDistrict ? "/dashboard/district" : "/dashboard/educator/my-gigs";
    const contractHref = isDistrict ? "/dashboard/district/contract-hub" : "/dashboard/educator/contract-hub";

    return (
        <div className="flex h-screen bg-[var(--bg-subtle)] font-sans pt-14 lg:pt-0">
            <Sidebar />
            <main className="flex-1 overflow-y-auto w-full">
                <div className="max-w-4xl mx-auto px-6 lg:px-10 py-10">
                    <Link href={backHref} className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--accent-primary)] mb-8">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </Link>
                    {detail === undefined ? (
                        <p className="text-[var(--text-secondary)]">Loading engagement…</p>
                    ) : detail === null ? (
                        <p className="text-[var(--text-secondary)]">Engagement not found.</p>
                    ) : (
                        <>
                            <PageHeader
                                title={getAreaOfNeedLabel(detail.engagement.areaOfNeed)}
                                description={`${detail.engagement.orgName} · ${detail.engagement.consultantName}`}
                            />
                            <div className="mt-8 grid gap-6">
                                <Card className="p-6 flex flex-col gap-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <h2 className="font-heading text-xl font-bold">Engagement details</h2>
                                        <span className={cn(
                                            "text-xs font-bold uppercase tracking-widest px-2 py-1 rounded-md",
                                            formatOrderStatus(detail.engagement.status).color === "emerald"
                                                ? "bg-emerald-50 text-emerald-700"
                                                : "bg-blue-50 text-blue-700"
                                        )}>
                                            {formatOrderStatus(detail.engagement.status).text}
                                        </span>
                                    </div>
                                    <p className="text-sm text-[var(--text-secondary)]">
                                        Agreed rate: {formatAgreedRate(detail.engagement.agreedRate, detail.engagement.agreedRateUnit)}
                                    </p>
                                    {detail.engagement.startDate && (
                                        <p className="text-sm text-[var(--text-secondary)]">Start: {detail.engagement.startDate}</p>
                                    )}
                                    {detail.engagement.compensationNotes && (
                                        <p className="text-sm text-[var(--text-secondary)]">{detail.engagement.compensationNotes}</p>
                                    )}
                                    {detail.needDescription && (
                                        <p className="text-sm leading-6 text-[var(--text-secondary)] whitespace-pre-wrap">{detail.needDescription}</p>
                                    )}
                                    {detail.proposalMessage && (
                                        <div className="rounded-md bg-[var(--bg-subtle)] p-4">
                                            <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-2">Accepted proposal</p>
                                            <p className="text-sm whitespace-pre-wrap">{detail.proposalMessage}</p>
                                        </div>
                                    )}
                                    <p className="text-sm text-[var(--text-secondary)]">
                                        Payment is arranged directly between the district and consultant. K12Gig coordinates the introduction, proposal, and contract documents.
                                    </p>
                                    <div className="flex flex-wrap gap-3">
                                        <Link href={`${isDistrict ? "/dashboard/messages?to=" : "/dashboard/messages?to="}${detail.counterpartUserId}`}>
                                            <PrimaryButton>Message {detail.counterpartName}</PrimaryButton>
                                        </Link>
                                        <Link href={contractHref} className="inline-flex items-center px-4 py-2 rounded-md border border-[var(--border-strong)] text-sm font-bold">
                                            Open Contract Hub
                                        </Link>
                                    </div>
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {detail.engagement.status !== "in_progress" && detail.engagement.status !== "completed" && (
                                            <button
                                                type="button"
                                                className="text-xs font-bold uppercase tracking-wider text-[var(--accent-primary)]"
                                                onClick={() => void setStatus({ engagementId, status: "in_progress" })}
                                            >
                                                Mark in progress
                                            </button>
                                        )}
                                        {detail.engagement.status !== "completed" && (
                                            <button
                                                type="button"
                                                className="text-xs font-bold uppercase tracking-wider text-emerald-700"
                                                onClick={() => void setStatus({ engagementId, status: "completed" })}
                                            >
                                                Mark complete
                                            </button>
                                        )}
                                    </div>
                                </Card>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
