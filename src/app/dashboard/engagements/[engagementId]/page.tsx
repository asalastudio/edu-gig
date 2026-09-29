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
import { formatAgreedRate, formatDateOnly, formatOrderStatus } from "@/lib/map-dashboard";
import { isDistrictRole } from "@/lib/roles";
import { getPostAcceptNextStep } from "@/lib/post-accept-copy";
import { cn } from "@/lib/utils";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function EngagementDetailPage() {
    const params = useParams<{ engagementId: string }>();
    const engagementId = params.engagementId as Id<"engagements">;
    const viewer = useQuery(api.users.viewer, {});
    const detail = useQuery(api.engagements.getById, viewer ? { engagementId } : "skip");
    const setStatus = useMutation(api.engagements.setStatus);
    const isDistrict = !!viewer && isDistrictRole(viewer.role);
    const backHref = isDistrict ? "/dashboard/district" : "/dashboard/educator/my-gigs";
    const nextStepCopy = (acceptedAt: number) =>
        getPostAcceptNextStep(isDistrict ? "district" : "educator", acceptedAt);

    return (
        <div className="flex h-screen bg-[var(--bg-subtle)] font-sans pt-14 lg:pt-0">
            <Sidebar />
            <main id="main-content" className="flex-1 overflow-y-auto w-full">
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
                                {(() => {
                                    const e = detail.engagement;
                                    const status = formatOrderStatus(e.status);
                                    const next = nextStepCopy(e.createdAt);
                                    const agreedRate = formatAgreedRate(e.agreedRate, e.agreedRateUnit);
                                    // compensationNotes is the gig's posted range; skip it when it just repeats the agreed rate.
                                    const postedRange =
                                        e.compensationNotes && e.compensationNotes.trim() !== agreedRate ? e.compensationNotes : null;
                                    return (
                                        <Card className="p-6 flex flex-col gap-6">
                                            <div className="flex items-center justify-between gap-3">
                                                <h2 className="font-heading text-xl font-bold">Engagement details</h2>
                                                <span className={cn(
                                                    "text-xs font-bold uppercase tracking-widest px-2 py-1 rounded-md",
                                                    status.color === "emerald"
                                                        ? "bg-emerald-50 text-emerald-700"
                                                        : status.color === "amber"
                                                          ? "bg-amber-50 text-amber-700"
                                                          : "bg-blue-50 text-blue-700"
                                                )}>
                                                    {status.text}
                                                </span>
                                            </div>

                                            {e.status === "active" && (
                                                <div className="rounded-lg border border-[var(--accent-secondary)]/40 bg-[var(--accent-secondary)]/10 p-4">
                                                    <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-1">Next step</p>
                                                    <p className="text-sm leading-6 text-[var(--text-primary)]">
                                                        {next.lead}
                                                        <strong className="font-bold">{next.deadline}</strong>
                                                        {next.rest}
                                                    </p>
                                                </div>
                                            )}

                                            <dl className="grid grid-cols-1 gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
                                                <Detail label="Agreed rate" value={agreedRate} />
                                                {e.startDate && <Detail label="Start date" value={formatDateOnly(e.startDate)} />}
                                                {e.duration && <Detail label="Duration" value={e.duration} />}
                                                {postedRange && <Detail label="Posted compensation" value={postedRange} />}
                                                <Detail label="District" value={e.orgName} />
                                                <Detail label="Consultant" value={e.consultantName} />
                                            </dl>

                                            {detail.needDescription && (
                                                <div>
                                                    <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-1">Gig description</p>
                                                    <p className="text-sm leading-6 text-[var(--text-primary)] whitespace-pre-wrap">{detail.needDescription}</p>
                                                </div>
                                            )}
                                            {detail.proposalMessage && (
                                                <div className="rounded-md bg-[var(--bg-subtle)] p-4">
                                                    <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-2">Accepted proposal</p>
                                                    <p className="text-sm whitespace-pre-wrap">{detail.proposalMessage}</p>
                                                </div>
                                            )}

                                            <p className="text-sm text-[var(--text-secondary)]">
                                                Payment is arranged directly between the district and consultant. K12Gig coordinates the introduction and proposal only.
                                            </p>

                                            <div className="flex flex-wrap items-center gap-3 border-t border-[var(--border-subtle)] pt-5">
                                                <Link href={`/dashboard/messages?to=${detail.counterpartUserId}`}>
                                                    <PrimaryButton>Message {detail.counterpartName}</PrimaryButton>
                                                </Link>
                                                {e.status !== "in_progress" && e.status !== "completed" && (
                                                    <button
                                                        type="button"
                                                        className="inline-flex min-h-10 items-center rounded-lg border border-[var(--border-strong)] bg-white px-4 text-sm font-bold text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                                                        onClick={() => void setStatus({ engagementId, status: "in_progress" })}
                                                    >
                                                        Mark in progress
                                                    </button>
                                                )}
                                                {e.status !== "completed" && (
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <button
                                                                type="button"
                                                                className="inline-flex min-h-10 items-center rounded-lg border border-emerald-200 bg-emerald-50 px-4 text-sm font-bold text-emerald-800 hover:bg-emerald-100"
                                                            >
                                                                Mark complete
                                                            </button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Mark this engagement complete?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Both sides are notified. Use this once the work is delivered.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Not yet</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => void setStatus({ engagementId, status: "completed" })}>
                                                                    Mark complete
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                )}
                                            </div>
                                        </Card>
                                    );
                                })()}
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}

function Detail({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <dt className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-0.5">{label}</dt>
            <dd className="font-semibold text-[var(--text-primary)]">{value}</dd>
        </div>
    );
}
