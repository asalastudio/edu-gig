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
import { CurrencyDollar, MapPin, Briefcase, Clock } from "@phosphor-icons/react";
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

export default function EducatorNeedsPage() {
    const viewer = useQuery(api.users.viewer, {});
    const isEducator = !!viewer && viewer.role === "educator";
    const needs = useQuery(
        api.needs.listOpenForEducators,
        isEducator ? {} : "skip"
    ) as OpenNeed[] | undefined;

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

    const isSignedOut = !viewer;
    const wrongRole = !!viewer && viewer.role !== "educator";

    return (
        <div className="flex h-screen bg-[var(--bg-subtle)] font-sans">
            <Sidebar />
            <Toaster position="top-right" richColors />
            <main className="flex-1 overflow-y-auto w-full relative">
                <div className="max-w-[1600px] w-full mx-auto px-8 lg:px-12 py-10 flex flex-col gap-10">
                    <PageHeader
                        title="Open Needs"
                        description="Browse districts looking to hire."
                    />

                    {isSignedOut && (
                        <div className="p-10 border border-[var(--border-subtle)] rounded-3xl bg-white text-center">
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

                    {wrongRole && (
                        <div className="p-10 border border-[var(--border-subtle)] rounded-3xl bg-white text-center">
                            <h2 className="font-heading text-xl font-bold text-[var(--text-primary)] mb-2">
                                This page is for educators
                            </h2>
                            <p className="text-[var(--text-secondary)] max-w-md mx-auto">
                                Districts post needs — educators respond with proposals.
                            </p>
                        </div>
                    )}

                    {isEducator && (
                        <div className="flex flex-col gap-5">
                            {needs === undefined && (
                                <div className="p-10 border border-[var(--border-subtle)] rounded-3xl bg-white text-center text-[var(--text-secondary)]">
                                    Loading open needs…
                                </div>
                            )}

                            {needs && needs.length === 0 && (
                                <div className="p-10 border border-[var(--border-subtle)] rounded-3xl bg-white text-center">
                                    <h2 className="font-heading text-xl font-bold text-[var(--text-primary)] mb-2">
                                        No open needs right now
                                    </h2>
                                    <p className="text-[var(--text-secondary)]">
                                        Check back soon — districts post new roles every week.
                                    </p>
                                </div>
                            )}

                            {needs?.map((need) => {
                                const submitted = submittedNeedIds.has(need._id as unknown as string);
                                const grade = gradeLabel(need.gradeLevel);
                                return (
                                    <div
                                        key={need._id}
                                        className="p-0 border border-[var(--border-subtle)] shadow-[0_8px_30px_rgba(0,0,0,0.03)] rounded-3xl bg-white overflow-hidden group hover:-translate-y-0.5 hover:border-[var(--accent-primary)]/40 hover:shadow-lg transition-all"
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
                                                    <span className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
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
                                className="w-full p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] focus:bg-white transition-all resize-y"
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
                                    className="w-full h-11 px-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] focus:bg-white transition-all"
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
                                    className="w-full h-11 px-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] focus:bg-white transition-all"
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
