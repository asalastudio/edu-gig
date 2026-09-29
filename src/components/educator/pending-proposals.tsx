"use client";

import Link from "next/link";
import { Clock } from "@phosphor-icons/react";
import { getAreaOfNeedLabel } from "@/lib/taxonomy";
import { formatCreatedAt } from "@/lib/map-gigs";
import { listPastProposals, listPendingProposals } from "@/lib/proposed-needs";

export type PendingProposalRow = {
    _id: string;
    needId: string;
    orgName: string;
    areaOfNeed: string;
    subCategory?: string;
    createdAt: number;
    status: string;
};

export function PendingProposalsSection({
    proposals,
    isLoading,
}: {
    proposals: readonly PendingProposalRow[] | undefined;
    isLoading?: boolean;
}) {
    const pending = listPendingProposals(proposals ?? []);

    return (
        <section className="flex flex-col gap-5">
            <h2 className="font-heading text-xl font-bold text-[var(--text-primary)] px-1">
                Pending proposals
            </h2>
            {isLoading ? (
                <div className="p-8 border border-[var(--border-subtle)] shadow-sm rounded-lg bg-white text-sm text-[var(--text-secondary)]">
                    Loading pending proposals…
                </div>
            ) : pending.length === 0 ? (
                <div className="p-8 border border-[var(--border-subtle)] shadow-sm rounded-lg bg-white text-center text-sm leading-6 text-[var(--text-secondary)]">
                    No pending proposals. Browse the Gig Board to submit one.
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {pending.map((proposal) => {
                        const title = getAreaOfNeedLabel(proposal.areaOfNeed) || "Proposal";
                        const specialty = proposal.subCategory
                            ? ` · ${getAreaOfNeedLabel(proposal.subCategory)}`
                            : "";
                        return (
                            <Link
                                key={proposal._id}
                                href={`/dashboard/board/${proposal.needId}/propose`}
                                className="p-6 border border-[var(--border-default)] shadow-[var(--shadow-subtle)] rounded-lg bg-white hover:-translate-y-0.5 hover:border-[var(--accent-primary)]/40 hover:shadow-[var(--shadow-soft)] transition-all"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div className="flex flex-col gap-1 min-w-0">
                                        <h3 className="font-bold text-[var(--text-primary)] text-lg">
                                            {title}
                                            {specialty}
                                        </h3>
                                        <p className="text-sm font-medium text-[var(--text-secondary)]">
                                            {proposal.orgName}
                                        </p>
                                    </div>
                                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text-secondary)] shrink-0">
                                        <Clock className="w-4 h-4 text-[var(--text-tertiary)]" />
                                        Submitted {formatCreatedAt(proposal.createdAt)}
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

/**
 * Rejected and withdrawn proposals, so a "not selected" decision doesn't just vanish
 * from the consultant's lists. Renders nothing until there is history to show.
 */
export function PastProposalsSection({
    proposals,
}: {
    proposals: readonly PendingProposalRow[] | undefined;
}) {
    const past = listPastProposals(proposals ?? []).slice(0, 10);
    if (past.length === 0) return null;

    return (
        <section className="flex flex-col gap-5">
            <h2 className="font-heading text-xl font-bold text-[var(--text-primary)] px-1">
                Past proposals
            </h2>
            <ul className="flex flex-col divide-y divide-[var(--border-subtle)] border border-[var(--border-subtle)] rounded-lg bg-white">
                {past.map((proposal) => {
                    const title = getAreaOfNeedLabel(proposal.areaOfNeed) || "Proposal";
                    const rejected = proposal.status === "rejected";
                    return (
                        <li key={proposal._id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                                <p className="font-semibold text-[var(--text-primary)]">
                                    {title}
                                    {proposal.subCategory ? ` · ${getAreaOfNeedLabel(proposal.subCategory)}` : ""}
                                </p>
                                <p className="text-sm text-[var(--text-secondary)]">
                                    {proposal.orgName} · Submitted {formatCreatedAt(proposal.createdAt)}
                                </p>
                            </div>
                            <span
                                className={
                                    rejected
                                        ? "self-start sm:self-auto shrink-0 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700"
                                        : "self-start sm:self-auto shrink-0 rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-bold text-gray-700"
                                }
                            >
                                {rejected ? "Not selected" : "Withdrawn"}
                            </span>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
