"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { toast, Toaster } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Sidebar } from "@/components/shared/sidebar";
import { PageHeader } from "@/components/shared/page-header";
import { PrimaryButton } from "@/components/shared/button";
import { getAreaOfNeedLabel, TAXONOMY } from "@/lib/taxonomy";
import { formatProposalStatus, formatProposedRate } from "@/lib/map-proposal";
import { isDistrictRole } from "@/lib/roles";
import { ArrowLeft, CheckCircle, XCircle } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

function looksLikeConvexId(value: string): boolean {
    return value.length >= 20 && !value.includes("-");
}

function gradeLabel(gradeId: string | undefined | null): string | null {
    if (!gradeId) return null;
    const match = TAXONOMY.gradeLevelBands.find((g) => g.id === gradeId);
    return match?.label ?? gradeId;
}

function engagementLabel(id: string | undefined | null): string | null {
    if (!id) return null;
    const match = TAXONOMY.engagementTypes.find((e) => e.id === id);
    return match?.label ?? id;
}

export default function DistrictNeedDetailPage() {
    const params = useParams<{ needId: string }>();
    const rawId = typeof params.needId === "string" ? params.needId : "";
    const isValidIdShape = looksLikeConvexId(rawId);

    const viewer = useQuery(api.users.viewer, {});
    const isDistrict = !!viewer && isDistrictRole(viewer.role);

    const need = useQuery(
        api.needs.getById,
        isDistrict && isValidIdShape ? { needId: rawId as Id<"needs"> } : "skip"
    );

    const proposals = useQuery(
        api.proposals.listForNeed,
        isDistrict && isValidIdShape && need ? { needId: rawId as Id<"needs"> } : "skip"
    );

    const acceptProposal = useMutation(api.proposals.accept);
    const rejectProposal = useMutation(api.proposals.reject);
    const [acting, setActing] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    async function handleAccept(proposalId: Id<"proposals">) {
        setActionError(null);
        setActing(proposalId as unknown as string);
        try {
            await acceptProposal({ proposalId });
            toast.success("Proposal accepted");
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "Could not accept proposal.");
        } finally {
            setActing(null);
        }
    }

    async function handleReject(proposalId: Id<"proposals">) {
        setActionError(null);
        setActing(proposalId as unknown as string);
        try {
            await rejectProposal({ proposalId });
            toast.success("Proposal rejected");
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "Could not reject proposal.");
        } finally {
            setActing(null);
        }
    }

    // Signed-out state
    if (viewer === null) {
        return (
            <ShellEmpty
                title="Sign in to review proposals"
                body="This page is for the district that posted this need."
            />
        );
    }

    // Wrong role
    if (viewer && !isDistrict) {
        return (
            <ShellEmpty
                title="District access only"
                body="This workspace is for district hiring teams."
            />
        );
    }

    // Malformed / demo-mode URL
    if (!isValidIdShape) {
        return (
            <ShellEmpty
                title="Need not found"
                body="That link doesn't point to a valid need. Return to your dashboard to open one from the pipeline."
                showDashboardLink
            />
        );
    }

    // Need explicitly missing from DB
    if (isDistrict && need === null) {
        return (
            <ShellEmpty
                title="Need not found"
                body="This need may have been removed or you may not have access."
                showDashboardLink
            />
        );
    }

    // Ownership failure — `listForNeed` will throw; guard by comparing posted user once `need` is loaded.
    const notOwner =
        isDistrict &&
        need &&
        viewer &&
        need.postedByUserId !== viewer._id &&
        viewer.role !== "superadmin";
    if (notOwner) {
        return (
            <ShellEmpty
                title="This need belongs to another district"
                body="You can only manage proposals for needs your workspace posted."
                showDashboardLink
            />
        );
    }

    const isPlaced = need?.status === "placed";

    return (
        <div className="flex h-screen bg-[var(--bg-subtle)] font-sans">
            <Sidebar />
            <Toaster position="top-right" richColors />
            <main className="flex-1 overflow-y-auto w-full relative">
                <div className="max-w-[1600px] w-full mx-auto px-8 lg:px-12 py-10 flex flex-col gap-10">
                    <Link
                        href="/dashboard/district"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--accent-primary)] w-fit"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to dashboard
                    </Link>

                    <PageHeader
                        title={need ? need.orgName : "Need detail"}
                        description={need ? getAreaOfNeedLabel(need.areaOfNeed) : undefined}
                    />

                    {need ? (
                        <section className="p-8 rounded-3xl bg-white border border-[var(--border-subtle)] shadow-sm flex flex-col gap-4">
                            <div className="flex flex-wrap gap-3">
                                <StatusPill status={need.status} />
                                {need.subCategory && (
                                    <Pill label={need.subCategory.replace(/_/g, " ")} />
                                )}
                                {gradeLabel(need.gradeLevel) && <Pill label={gradeLabel(need.gradeLevel)!} />}
                                {engagementLabel(need.engagementType) && (
                                    <Pill label={engagementLabel(need.engagementType)!} />
                                )}
                            </div>
                            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                                {need.startDate && <Field label="Start date" value={need.startDate} />}
                                {need.duration && <Field label="Duration" value={need.duration} />}
                                {need.compensationRange && (
                                    <Field label="Compensation" value={need.compensationRange} />
                                )}
                                <Field
                                    label="Posted"
                                    value={new Date(need.createdAt).toLocaleDateString()}
                                />
                            </dl>
                            {need.description && (
                                <div>
                                    <dt className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-widest mb-1">
                                        Description
                                    </dt>
                                    <p className="text-base text-[var(--text-primary)] whitespace-pre-wrap">
                                        {need.description}
                                    </p>
                                </div>
                            )}
                        </section>
                    ) : (
                        <section className="p-8 rounded-3xl bg-white border border-[var(--border-subtle)] shadow-sm text-[var(--text-secondary)]">
                            Loading need…
                        </section>
                    )}

                    {need && (
                        <section className="flex flex-col gap-4">
                            <h2 className="font-heading text-2xl font-bold text-[var(--text-primary)]">Proposals</h2>

                            {actionError && (
                                <p className="text-sm text-red-600 font-medium">{actionError}</p>
                            )}

                            {proposals === undefined && (
                                <div className="p-8 rounded-3xl bg-white border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                                    Loading proposals…
                                </div>
                            )}

                            {proposals && proposals.length === 0 && (
                                <div className="p-10 rounded-3xl bg-white border border-[var(--border-subtle)] text-center">
                                    <h3 className="font-heading text-xl font-bold text-[var(--text-primary)] mb-2">
                                        No proposals yet
                                    </h3>
                                    <p className="text-[var(--text-secondary)]">
                                        Educators who respond to this need will appear here.
                                    </p>
                                </div>
                            )}

                            <div className="flex flex-col gap-4">
                                {proposals?.map((row) => {
                                    const label = formatProposalStatus(row.proposal.status);
                                    const educatorName = row.user
                                        ? `${row.user.firstName ?? ""} ${row.user.lastName ?? ""}`.trim() ||
                                          "Educator"
                                        : "Educator";
                                    const initials = educatorName
                                        .split(/\s+/)
                                        .map((p) => p[0] ?? "")
                                        .join("")
                                        .slice(0, 2)
                                        .toUpperCase();
                                    const disableActions =
                                        acting !== null ||
                                        row.proposal.status !== "pending" ||
                                        isPlaced;

                                    return (
                                        <div
                                            key={row.proposal._id}
                                            className="p-6 rounded-3xl bg-white border border-[var(--border-subtle)] shadow-sm flex flex-col md:flex-row gap-5"
                                        >
                                            <div className="flex flex-col items-center md:items-start gap-2">
                                                <div className="h-14 w-14 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-center font-heading font-bold text-[var(--text-secondary)]">
                                                    {row.user?.avatarUrl ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img
                                                            src={row.user.avatarUrl}
                                                            alt={educatorName}
                                                            className="h-14 w-14 rounded-2xl object-cover"
                                                        />
                                                    ) : (
                                                        initials || "?"
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex-1 flex flex-col gap-2">
                                                <div className="flex items-center justify-between flex-wrap gap-3">
                                                    <h3 className="font-heading text-lg font-bold text-[var(--text-primary)]">
                                                        {educatorName}
                                                    </h3>
                                                    <span
                                                        className={cn(
                                                            "px-3 py-1 font-bold rounded-xl text-xs uppercase tracking-widest border inline-block",
                                                            label.color === "emerald"
                                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                                : label.color === "amber"
                                                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                                                  : "bg-blue-50 text-blue-700 border-blue-200"
                                                        )}
                                                    >
                                                        {label.text}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">
                                                    {row.proposal.message}
                                                </p>
                                                <div className="flex flex-wrap gap-4 text-sm font-semibold text-[var(--text-tertiary)]">
                                                    <span>
                                                        {formatProposedRate(
                                                            row.proposal.proposedRate,
                                                            row.proposal.proposedRateUnit
                                                        )}
                                                    </span>
                                                    <span>
                                                        Submitted {new Date(row.proposal.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    <PrimaryButton
                                                        type="button"
                                                        onClick={() => handleAccept(row.proposal._id)}
                                                        disabled={disableActions}
                                                        className="bg-emerald-600 hover:bg-emerald-700"
                                                    >
                                                        <CheckCircle weight="bold" className="w-4 h-4" />
                                                        Accept
                                                    </PrimaryButton>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleReject(row.proposal._id)}
                                                        disabled={disableActions}
                                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border border-[var(--border-strong)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                                    >
                                                        <XCircle weight="bold" className="w-4 h-4" />
                                                        Reject
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}
                </div>
            </main>
        </div>
    );
}

function Field({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <dt className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-widest mb-0.5">
                {label}
            </dt>
            <dd className="text-base text-[var(--text-primary)] font-semibold">{value}</dd>
        </div>
    );
}

function Pill({ label }: { label: string }) {
    return (
        <span className="inline-flex items-center gap-1.5 bg-[var(--bg-subtle)] px-3 py-1 rounded-full border border-[var(--border-subtle)] text-sm font-semibold text-[var(--text-secondary)]">
            {label}
        </span>
    );
}

function StatusPill({ status }: { status: string }) {
    const color =
        status === "placed"
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : status === "interviewing"
              ? "bg-amber-50 text-amber-700 border-amber-200"
              : status === "closed"
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-blue-50 text-blue-700 border-blue-200";
    const label =
        status === "placed"
            ? "Placed"
            : status === "interviewing"
              ? "Interviewing"
              : status === "closed"
                ? "Closed"
                : "Open";
    return (
        <span className={cn("px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-widest border", color)}>
            {label}
        </span>
    );
}

function ShellEmpty({
    title,
    body,
    showDashboardLink,
}: {
    title: string;
    body: string;
    showDashboardLink?: boolean;
}) {
    return (
        <div className="flex h-screen bg-[var(--bg-subtle)] font-sans">
            <Sidebar />
            <main className="flex-1 overflow-y-auto w-full relative">
                <div className="max-w-[1600px] w-full mx-auto px-8 lg:px-12 py-10 flex flex-col gap-10">
                    <Link
                        href="/dashboard/district"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--accent-primary)] w-fit"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to dashboard
                    </Link>
                    <div className="p-12 rounded-3xl bg-white border border-[var(--border-subtle)] shadow-sm text-center max-w-xl mx-auto">
                        <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)] mb-3">
                            {title}
                        </h1>
                        <p className="text-[var(--text-secondary)] mb-6">{body}</p>
                        {showDashboardLink && (
                            <Link href="/dashboard/district">
                                <PrimaryButton>Back to dashboard</PrimaryButton>
                            </Link>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
