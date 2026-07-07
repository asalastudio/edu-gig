"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { toast, Toaster } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Sidebar } from "@/components/shared/sidebar";
import { PageHeader } from "@/components/shared/page-header";
import { PrimaryButton } from "@/components/shared/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { getAreaOfNeedLabel, TAXONOMY } from "@/lib/taxonomy";
import { isDistrictRole } from "@/lib/roles";
import { CurrencyDollar, MapPin, Briefcase, Clock, PlusCircle } from "@phosphor-icons/react";
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

function statusLabel(status: string): string {
    switch (status) {
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

    const submitProposal = useMutation(api.proposals.submit);

    const [openNeedId, setOpenNeedId] = useState<Id<"needs"> | null>(null);
    const [message, setMessage] = useState("");
    const [proposedRate, setProposedRate] = useState("");
    const [proposedRateUnit, setProposedRateUnit] = useState<"hourly" | "daily" | "fixed">("hourly");
    const [submitting, setSubmitting] = useState(false);
    const [submittedNeedIds, setSubmittedNeedIds] = useState<Set<string>>(new Set());
    const [formError, setFormError] = useState<string | null>(null);

    const activeNeed = useMemo(
        () => needs?.find((n) => n._id === openNeedId) ?? null,
        [needs, openNeedId]
    );

    // Needs the educator has already proposed on (persistent, from listMine).
    const proposedNeedIds = useMemo(() => {
        const set = new Set<string>();
        for (const p of myProposals ?? []) {
            set.add(p.needId as unknown as string);
        }
        return set;
    }, [myProposals]);

    function openForm(needId: Id<"needs">) {
        setOpenNeedId(needId);
        setMessage("");
        setProposedRate("");
        setProposedRateUnit("hourly");
        setFormError(null);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setFormError(null);
        if (!openNeedId) return;
        if (!message.trim()) {
            setFormError("A short message is required.");
            return;
        }
        setSubmitting(true);
        try {
            const rateNum = proposedRate ? Number(proposedRate) : undefined;
            if (rateNum !== undefined && Number.isNaN(rateNum)) {
                setFormError("Proposed rate must be a number.");
                setSubmitting(false);
                return;
            }
            await submitProposal({
                needId: openNeedId,
                message: message.trim(),
                proposedRate: rateNum,
                proposedRateUnit: rateNum !== undefined ? proposedRateUnit : undefined,
            });
            toast.success("Proposal submitted");
            setSubmittedNeedIds((prev) => {
                const next = new Set(prev);
                next.add(openNeedId as unknown as string);
                return next;
            });
            setOpenNeedId(null);
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Could not submit proposal.";
            setFormError(msg);
        } finally {
            setSubmitting(false);
        }
    }

    const isSignedOut = viewer === null;
    const isSuperadmin = !!viewer && viewer.role === "superadmin";
    // Signed in but neither an educator nor a district-family role.
    const isOtherRole = !!viewer && !isEducator && !isDistrict;

    return (
        <div className="flex h-screen bg-[var(--bg-subtle)] font-sans pt-14 lg:pt-0">
            <Sidebar />
            <Toaster position="top-right" richColors />
            <main className="flex-1 overflow-y-auto w-full relative">
                <div className="max-w-[1600px] w-full mx-auto px-8 lg:px-12 py-10 flex flex-col gap-10">
                    <PageHeader
                        title="Gig Board"
                        description="District-posted needs and RFPs. Districts post; educators respond with proposals."
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
                                const submitted =
                                    submittedNeedIds.has(need._id as unknown as string) ||
                                    proposedNeedIds.has(need._id as unknown as string);
                                const grade = gradeLabel(need.gradeLevel);
                                return (
                                    <div
                                        key={need._id}
                                        className="p-0 border border-[var(--border-subtle)] shadow-[0_8px_30px_rgba(0,0,0,0.03)] rounded-lg bg-white overflow-hidden group hover:-translate-y-0.5 hover:border-[var(--accent-primary)]/40 hover:shadow-lg transition-all"
                                    >
                                        <div className="p-8 flex flex-col lg:flex-row justify-between gap-6">
                                            <div className="flex-1 flex flex-col gap-3">
                                                <div className="flex items-center gap-3 text-[var(--text-tertiary)] text-sm font-semibold">
                                                    <MapPin weight="fill" className="w-4 h-4 text-[var(--accent-secondary)]" />
                                                    <span className="uppercase tracking-widest text-xs">{need.orgName}</span>
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
                                                    <PrimaryButton
                                                        onClick={() => openForm(need._id)}
                                                        className="shadow-md bg-[var(--accent-secondary)] text-[var(--text-primary)] hover:bg-[var(--accent-secondary)]/90"
                                                    >
                                                        Submit proposal
                                                    </PrimaryButton>
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
                                return (
                                    <Link
                                        key={need._id}
                                        href={`/dashboard/district/needs/${need._id}`}
                                        className="block p-0 border border-[var(--border-subtle)] shadow-[0_8px_30px_rgba(0,0,0,0.03)] rounded-lg bg-white overflow-hidden group hover:-translate-y-0.5 hover:border-[var(--accent-primary)]/40 hover:shadow-lg transition-all"
                                    >
                                        <div className="p-8 flex flex-col lg:flex-row justify-between gap-6">
                                            <div className="flex-1 flex flex-col gap-3">
                                                <div className="flex items-center gap-3 text-[var(--text-tertiary)] text-sm font-semibold">
                                                    <MapPin weight="fill" className="w-4 h-4 text-[var(--accent-secondary)]" />
                                                    <span className="uppercase tracking-widest text-xs">{need.orgName}</span>
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
                                                <span className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white font-bold group-hover:bg-[var(--accent-primary-h)] transition-colors">
                                                    Review proposals
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

            <Dialog
                open={openNeedId !== null}
                onOpenChange={(open) => {
                    if (!open) setOpenNeedId(null);
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Submit a proposal</DialogTitle>
                        {activeNeed && (
                            <DialogDescription>
                                {activeNeed.orgName} · {getAreaOfNeedLabel(activeNeed.areaOfNeed)}
                            </DialogDescription>
                        )}
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="proposal-message" className="text-sm font-semibold text-[var(--text-primary)]">
                                Your message <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                id="proposal-message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={5}
                                placeholder="Introduce yourself and describe how you can help."
                                className="w-full p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] focus:bg-white transition-all resize-y"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-2">
                                <label htmlFor="proposal-rate" className="text-sm font-semibold text-[var(--text-primary)]">
                                    Proposed rate
                                </label>
                                <input
                                    id="proposal-rate"
                                    type="number"
                                    min={0}
                                    value={proposedRate}
                                    onChange={(e) => setProposedRate(e.target.value)}
                                    placeholder="75"
                                    className="w-full h-11 px-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] focus:bg-white transition-all"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label htmlFor="proposal-unit" className="text-sm font-semibold text-[var(--text-primary)]">
                                    Unit
                                </label>
                                <select
                                    id="proposal-unit"
                                    value={proposedRateUnit}
                                    onChange={(e) =>
                                        setProposedRateUnit(e.target.value as "hourly" | "daily" | "fixed")
                                    }
                                    className="w-full h-11 px-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] focus:bg-white transition-all"
                                >
                                    <option value="hourly">Hourly</option>
                                    <option value="daily">Daily</option>
                                    <option value="fixed">Fixed</option>
                                </select>
                            </div>
                        </div>

                        {formError && (
                            <p className="text-sm text-red-600 font-medium">{formError}</p>
                        )}

                        <DialogFooter>
                            <button
                                type="button"
                                onClick={() => setOpenNeedId(null)}
                                className={cn(
                                    "px-4 py-2 rounded-md text-sm font-medium text-[var(--text-secondary)]",
                                    "hover:bg-[var(--bg-hover)] transition-colors"
                                )}
                            >
                                Cancel
                            </button>
                            <PrimaryButton type="submit" disabled={submitting}>
                                {submitting ? "Sending…" : "Send proposal"}
                            </PrimaryButton>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
