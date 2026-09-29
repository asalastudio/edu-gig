"use client";

import Link from "next/link";
import { Briefcase, Buildings, CurrencyDollar } from "@phosphor-icons/react";
import { PageHeader } from "@/components/shared/page-header";
import { PrimaryButton } from "@/components/shared/button";
import { ProposalAttachmentLink } from "@/components/shared/proposal-attachment-link";
import { getAreaOfNeedLabel, TAXONOMY } from "@/lib/taxonomy";
import { formatProposalStatus, formatProposedRate } from "@/lib/map-proposal";
import { formatCreatedAt } from "@/lib/map-gigs";
import { cn } from "@/lib/utils";
import type { Id } from "@/convex/_generated/dataModel";
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

export type SubmittedNeedSummary = {
    orgName: string;
    areaOfNeed: string;
    subCategory?: string;
    gradeLevel?: string;
    compensationRange?: string;
    description?: string;
};

export type SubmittedProposalSummary = {
    _id: Id<"proposals">;
    message: string;
    proposedRate?: number;
    proposedRateUnit?: "hourly" | "daily" | "fixed";
    attachmentStorageId?: Id<"_storage">;
    attachmentName?: string;
    createdAt: number;
    status: "pending" | "accepted" | "rejected" | "withdrawn";
};

function gradeLabel(gradeId: string | undefined): string | null {
    if (!gradeId) return null;
    const match = TAXONOMY.gradeLevelBands.find((g) => g.id === gradeId);
    return match?.label ?? gradeId;
}

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

export function NeedSummaryCard({ need }: { need: SubmittedNeedSummary }) {
    const grade = gradeLabel(need.gradeLevel);
    return (
        <section className="p-8 rounded-lg bg-white border border-[var(--border-subtle)] shadow-sm flex flex-col gap-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
                You&apos;re responding to
            </p>
            <NeedSource orgName={need.orgName} />
            <h2 className="font-heading text-2xl font-bold text-[var(--text-primary)]">
                {getAreaOfNeedLabel(need.areaOfNeed)}
                {need.subCategory ? (
                    <span className="text-[var(--text-secondary)] font-semibold text-lg">
                        {" · "}
                        {need.subCategory.replace(/_/g, " ")}
                    </span>
                ) : null}
            </h2>
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
            </div>
            {need.description && (
                <p className="text-base text-[var(--text-primary)] whitespace-pre-wrap">
                    {need.description}
                </p>
            )}
        </section>
    );
}

export function SubmittedProposalView({
    need,
    proposal,
    withdrawing = false,
    onWithdraw,
}: {
    need: SubmittedNeedSummary;
    proposal: SubmittedProposalSummary;
    withdrawing?: boolean;
    onWithdraw?: () => void;
}) {
    const status = formatProposalStatus(proposal.status);
    const canWithdraw = proposal.status === "pending" && !!onWithdraw;

    return (
        <>
            <PageHeader
                title="Proposal already submitted"
                description={`You've already submitted a proposal for this need from ${need.orgName}.`}
            />
            <NeedSummaryCard need={need} />
            <section className="p-8 rounded-lg bg-white border border-[var(--border-subtle)] shadow-sm flex flex-col gap-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <h3 className="font-heading text-lg font-bold text-[var(--text-primary)]">
                        Your proposal
                    </h3>
                    <span
                        className={cn(
                            "px-3 py-1 font-bold rounded-lg text-xs uppercase tracking-widest border inline-block",
                            status.color === "emerald"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : status.color === "amber"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-blue-50 text-blue-700 border-blue-200"
                        )}
                    >
                        {status.text}
                    </span>
                </div>
                <p className="text-base text-[var(--text-primary)] whitespace-pre-wrap">
                    {proposal.message}
                </p>
                <div className="flex flex-wrap gap-4 text-sm font-semibold text-[var(--text-secondary)]">
                    <span>{formatProposedRate(proposal.proposedRate, proposal.proposedRateUnit)}</span>
                    <span>Submitted {formatCreatedAt(proposal.createdAt)}</span>
                    {proposal.attachmentStorageId && (
                        <ProposalAttachmentLink
                            proposalId={proposal._id}
                            attachmentName={proposal.attachmentName}
                        />
                    )}
                    {!proposal.attachmentStorageId && proposal.attachmentName && (
                        <span>{proposal.attachmentName}</span>
                    )}
                </div>
                <p className="text-sm text-[var(--text-secondary)]">
                    The district can see your proposal and will reach out if it&apos;s a match.
                    You can only have one active proposal per need.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                    {canWithdraw && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <button
                                    type="button"
                                    disabled={withdrawing}
                                    className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-red-200 bg-red-50 text-sm font-bold text-red-700 hover:bg-red-100 disabled:opacity-40"
                                >
                                    Withdraw proposal
                                </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Withdraw this proposal?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        The district will no longer see it as pending. You can submit a new
                                        proposal for this need afterward.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel disabled={withdrawing}>Keep proposal</AlertDialogCancel>
                                    <AlertDialogAction
                                        variant="destructive"
                                        disabled={withdrawing}
                                        onClick={() => onWithdraw?.()}
                                    >
                                        Withdraw proposal
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                    <Link href="/dashboard/board" className="w-fit">
                        <PrimaryButton>Back to Gig Board</PrimaryButton>
                    </Link>
                </div>
            </section>
        </>
    );
}
