"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { Toaster } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Sidebar } from "@/components/shared/sidebar";
import { PageHeader } from "@/components/shared/page-header";
import { PrimaryButton } from "@/components/shared/button";
import { getAreaOfNeedLabel, TAXONOMY } from "@/lib/taxonomy";
import { isDistrictRole } from "@/lib/roles";
import { CurrencyDollar, Buildings, Briefcase, Clock, PlusCircle } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type OpenNeed = {
    _id: Id<"needs">;
    orgName: string;
    areaOfNeed: string;
    subCategory?: string;
    gradeLevel?: string;
    engagementType?: string;
    compensationRange?: string;
    description?: string;
    status: string;
    createdAt: number;
};

type NeedWithCounts = OpenNeed & {
    proposalCount: number;
    pendingCount: number;
};

function daysAgo(ts: number): string {
    const days = Math.max(0, Math.floor((Date.now() - ts) / (1000 * 60 * 60 * 24)));
    if (days === 0) return "Posted today";
    if (days === 1) return "Posted yesterday";
    return `Posted ${days} days ago`;
}

function gradeLabel(gradeId: string | undefined): string | null {
    if (!gradeId) return null;
    const match = TAXONOMY.gradeLevelBands.find((g) => g.id === gradeId);
    return match?.label ?? gradeId;
}

function statusPillClass(status: string): string {
    switch (status) {
        case "draft":
            return "bg-slate-50 text-slate-700 border-slate-200";
        case "open":
            return "bg-emerald-50 text-emerald-700 border-emerald-200";
        case "interviewing":
            return "bg-amber-50 text-amber-700 border-amber-200";
        case "placed":
            return "bg-blue-50 text-blue-700 border-blue-200";
        case "closed":
        default:
            return "bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border-strong)]";
    }
}

/** Prominent "who posted this gig" source block, so the origin reads at a glance. */
function NeedSource({ orgName }: { orgName: string }) {
    return (
        <div className="inline-flex items-center gap-2.5">
            <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] shrink-0">
                <Buildings weight="fill" className="w-5 h-5" />
            </span>
            <span className="flex flex-col leading-tight min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
                    Posted by
                </span>
                <span className="text-base font-bold text-[var(--text-primary)] truncate">
                    {orgName}
                </span>
            </span>
        </div>
    );
}

function statusLabel(status: string): string {
    switch (status) {
        case "draft":
            return "Draft";
        case "open":
            return "Open";
        case "interviewing":
            return "Interviewing";
        case "placed":
            return "Placed";
        case "closed":
            return "Closed";
        default:
            return status;
    }
}

export default function GigBoardPage() {
    const viewer = useQuery(api.users.viewer, {});
    const isEducator = !!viewer && viewer.role === "educator";
    const isDistrict = !!viewer && isDistrictRole(viewer.role);

    // Educator branch data
    const needs = useQuery(
        api.needs.listOpenForEducators,
        isEducator ? {} : "skip"
    ) as OpenNeed[] | undefined;
    const myProposals = useQuery(api.proposals.listMine, isEducator ? {} : "skip");

    // District branch data
    const districtNeeds = useQuery(
        api.needs.listMineWithCounts,
        isDistrict ? {} : "skip"
    ) as NeedWithCounts[] | undefined;

    // Needs the educator has already proposed on (persistent, from listMine).
    const proposedNeedIds = useMemo(() => {
        const set = new Set<string>();
        for (const p of myProposals ?? []) {
            set.add(p.needId as unknown as string);
        }
        return set;
    }, [myProposals]);

    const isSignedOut = viewer === null;
    const isSuperadmin = !!viewer && viewer.role === "superadmin";
    // Signed in but neither an educator nor a district-family role.
    const isOtherRole = !!viewer && !isEducator && !isDistrict;
    const boardTitle = viewer === undefined ? "Needs" : isDistrict ? "Posted Needs" : "Gig Board";
    const boardDescription = isDistrict
        ? "Manage drafts, published needs, and educator proposals."
        : "District-posted needs and RFPs. Educators respond with proposals.";

    return (
        <div className="flex h-screen bg-[var(--bg-subtle)] font-sans pt-14 lg:pt-0">
            <Sidebar />
            <Toaster position="top-right" richColors />
            <main className="flex-1 overflow-y-auto w-full relative">
                <div className="max-w-[1600px] w-full mx-auto px-8 lg:px-12 py-10 flex flex-col gap-10">
                    <PageHeader
                        title={boardTitle}
                        description={boardDescription}
                        actions={
                            isDistrict ? (
                                <Link href="/post">
                                    <PrimaryButton>
                                        <PlusCircle weight="bold" className="w-4 h-4" />
                                        Post a need
                                    </PrimaryButton>
                                </Link>
                            ) : undefined
                        }
                    />

                    {isSignedOut && (
                        <div className="p-10 border border-[var(--border-subtle)] rounded-lg bg-white text-center">
                            <h2 className="font-heading text-xl font-bold text-[var(--text-primary)] mb-2">
                                Sign in as an educator to browse open needs
                            </h2>
                            <p className="text-[var(--text-secondary)] max-w-md mx-auto mb-6">
                                District-posted roles appear here once you&apos;re signed in with an educator account.
                            </p>
                            <Link href="/login?intent=educator">
                                <PrimaryButton>Sign in</PrimaryButton>
                            </Link>
                        </div>
                    )}

                    {isOtherRole && !isSuperadmin && (
                        <div className="p-10 border border-[var(--border-subtle)] rounded-lg bg-white text-center">
                            <h2 className="font-heading text-xl font-bold text-[var(--text-primary)] mb-2">
                                This board is for districts and educators
                            </h2>
                            <p className="text-[var(--text-secondary)] max-w-md mx-auto">
                                Districts post needs — educators respond with proposals.
                            </p>
                        </div>
                    )}

                    {/* ─── Educator branch ─────────────────────────── */}
                    {isEducator && (
                        <div className="flex flex-col gap-5">
                            {needs === undefined && (
                                <div className="p-10 border border-[var(--border-subtle)] rounded-lg bg-white text-center text-[var(--text-secondary)]">
                                    Loading open needs…
                                </div>
                            )}

                            {needs && needs.length === 0 && (
                                <div className="p-10 border border-[var(--border-subtle)] rounded-lg bg-white text-center">
                                    <h2 className="font-heading text-xl font-bold text-[var(--text-primary)] mb-2">
                                        No open needs right now
                                    </h2>
                                    <p className="text-[var(--text-secondary)]">
                                        Check back soon — districts post new roles every week.
                                    </p>
                                </div>
                            )}

                            {needs?.map((need) => {
                                const submitted = proposedNeedIds.has(
                                    need._id as unknown as string
                                );
                                const grade = gradeLabel(need.gradeLevel);
                                return (
                                    <div
                                        key={need._id}
                                        className="p-0 border border-[var(--border-subtle)] shadow-[0_8px_30px_rgba(0,0,0,0.03)] rounded-lg bg-white overflow-hidden group hover:-translate-y-0.5 hover:border-[var(--accent-primary)]/40 hover:shadow-lg transition-all"
                                    >
                                        <div className="p-8 flex flex-col lg:flex-row justify-between gap-6">
                                            <div className="flex-1 flex flex-col gap-3">
                                                <NeedSource orgName={need.orgName} />
                                                <h3 className="font-heading text-2xl font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                                                    {getAreaOfNeedLabel(need.areaOfNeed)}
                                                    {need.subCategory ? (
                                                        <span className="text-[var(--text-secondary)] font-semibold text-lg">
                                                            {" · "}
                                                            {need.subCategory.replace(/_/g, " ")}
                                                        </span>
                                                    ) : null}
                                                </h3>
                                                <div className="flex flex-wrap gap-3 text-sm font-semibold text-[var(--text-secondary)]">
                                                    {grade && (
                                                        <span className="inline-flex items-center gap-1.5 bg-[var(--bg-subtle)] px-3 py-1 rounded-full border border-[var(--border-subtle)]">
                                                            <Briefcase className="w-4 h-4 text-[var(--text-tertiary)]" />
                                                            {grade}
                                                        </span>
                                                    )}
                                                    {need.compensationRange && (
                                                        <span className="inline-flex items-center gap-1.5 bg-[var(--bg-subtle)] px-3 py-1 rounded-full border border-[var(--border-subtle)]">
                                                            <CurrencyDollar className="w-4 h-4 text-[var(--text-tertiary)]" />
                                                            {need.compensationRange}
                                                        </span>
                                                    )}
                                                    <span className="inline-flex items-center gap-1.5 bg-[var(--bg-subtle)] px-3 py-1 rounded-full border border-[var(--border-subtle)]">
                                                        <Clock className="w-4 h-4 text-[var(--text-tertiary)]" />
                                                        {daysAgo(need.createdAt)}
                                                    </span>
                                                </div>
                                                {need.description && (
                                                    <p className="text-base text-[var(--text-secondary)] mt-1 line-clamp-2">
                                                        {need.description}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex flex-col items-stretch lg:items-end justify-center gap-2 min-w-[200px]">
                                                {submitted ? (
                                                    <span className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                                                        Proposal submitted ✓
                                                    </span>
                                                ) : (
                                                    <Link href={`/dashboard/board/${need._id}/propose`}>
                                                        <PrimaryButton
                                                            className="w-full shadow-md bg-[var(--accent-secondary)] text-[var(--text-primary)] hover:bg-[var(--accent-secondary)]/90"
                                                        >
                                                            Submit proposal
                                                        </PrimaryButton>
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* ─── District branch ─────────────────────────── */}
                    {isDistrict && (
                        <div className="flex flex-col gap-5">
                            {districtNeeds === undefined && (
                                <div className="p-10 border border-[var(--border-subtle)] rounded-lg bg-white text-center text-[var(--text-secondary)]">
                                    Loading your posted needs…
                                </div>
                            )}

                            {districtNeeds && districtNeeds.length === 0 && (
                                <div className="p-10 border border-[var(--border-subtle)] rounded-lg bg-white text-center">
                                    <h2 className="font-heading text-xl font-bold text-[var(--text-primary)] mb-2">
                                        No needs posted yet
                                    </h2>
                                    <p className="text-[var(--text-secondary)] max-w-md mx-auto mb-6">
                                        Post a need to reach matching educators. They&apos;ll respond with
                                        proposals you can review here.
                                    </p>
                                    <Link href="/post">
                                        <PrimaryButton>
                                            <PlusCircle weight="bold" className="w-4 h-4" />
                                            Post a need
                                        </PrimaryButton>
                                    </Link>
                                </div>
                            )}

                            {districtNeeds?.map((need) => {
                                const grade = gradeLabel(need.gradeLevel);
                                const isDraft = need.status === "draft";
                                return (
                                    <Link
                                        key={need._id}
                                        href={isDraft ? `/post?draft=${need._id}` : `/dashboard/district/needs/${need._id}`}
                                        className="block p-0 border border-[var(--border-subtle)] shadow-[0_8px_30px_rgba(0,0,0,0.03)] rounded-lg bg-white overflow-hidden group hover:-translate-y-0.5 hover:border-[var(--accent-primary)]/40 hover:shadow-lg transition-all"
                                    >
                                        <div className="p-8 flex flex-col lg:flex-row justify-between gap-6">
                                            <div className="flex-1 flex flex-col gap-3">
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <NeedSource orgName={need.orgName} />
                                                    <span
                                                        className={cn(
                                                            "px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border",
                                                            statusPillClass(need.status)
                                                        )}
                                                    >
                                                        {statusLabel(need.status)}
                                                    </span>
                                                </div>
                                                <h3 className="font-heading text-2xl font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                                                    {getAreaOfNeedLabel(need.areaOfNeed)}
                                                    {need.subCategory ? (
                                                        <span className="text-[var(--text-secondary)] font-semibold text-lg">
                                                            {" · "}
                                                            {need.subCategory.replace(/_/g, " ")}
                                                        </span>
                                                    ) : null}
                                                </h3>
                                                <div className="flex flex-wrap gap-3 text-sm font-semibold text-[var(--text-secondary)]">
                                                    {grade && (
                                                        <span className="inline-flex items-center gap-1.5 bg-[var(--bg-subtle)] px-3 py-1 rounded-full border border-[var(--border-subtle)]">
                                                            <Briefcase className="w-4 h-4 text-[var(--text-tertiary)]" />
                                                            {grade}
                                                        </span>
                                                    )}
                                                    {need.compensationRange && (
                                                        <span className="inline-flex items-center gap-1.5 bg-[var(--bg-subtle)] px-3 py-1 rounded-full border border-[var(--border-subtle)]">
                                                            <CurrencyDollar className="w-4 h-4 text-[var(--text-tertiary)]" />
                                                            {need.compensationRange}
                                                        </span>
                                                    )}
                                                    <span className="inline-flex items-center gap-1.5 bg-[var(--bg-subtle)] px-3 py-1 rounded-full border border-[var(--border-subtle)]">
                                                        <Clock className="w-4 h-4 text-[var(--text-tertiary)]" />
                                                        {daysAgo(need.createdAt)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-stretch lg:items-end justify-center gap-2 min-w-[200px]">
                                                {!isDraft && (
                                                    <div className="text-right">
                                                        <span className="font-heading text-2xl font-bold text-[var(--text-primary)]">
                                                            {need.proposalCount}
                                                        </span>{" "}
                                                        <span className="text-sm font-semibold text-[var(--text-secondary)]">
                                                            proposal{need.proposalCount === 1 ? "" : "s"}
                                                        </span>
                                                        {need.pendingCount > 0 && (
                                                            <span className="ml-1 text-sm font-bold text-[var(--accent-primary)]">
                                                                · {need.pendingCount} new
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                                <span className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white font-bold group-hover:bg-[var(--accent-primary-h)] transition-colors">
                                                    {isDraft ? "Continue editing" : "Review proposals"}
                                                </span>
                                            </div>
                                        </div>
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
