"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { toast, Toaster } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Sidebar } from "@/components/shared/sidebar";
import { PageHeader } from "@/components/shared/page-header";
import { PrimaryButton } from "@/components/shared/button";
import { NeedSummaryCard, SubmittedProposalView } from "@/components/educator/submitted-proposal-view";
import { findViewableProposal } from "@/lib/proposed-needs";
import { ArrowLeft, FileArrowUp, X } from "@phosphor-icons/react";

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

const MAX_FILE_BYTES = 10 * 1024 * 1024;

function Shell({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen bg-[var(--bg-subtle)] font-sans pt-14 lg:pt-0">
            <Sidebar />
            <Toaster position="top-right" richColors />
            <main className="flex-1 overflow-y-auto w-full relative">
                <div className="max-w-3xl w-full mx-auto px-8 lg:px-12 py-10 flex flex-col gap-8">
                    {children}
                </div>
            </main>
        </div>
    );
}

function BackLink() {
    return (
        <Link
            href="/dashboard/board"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--accent-primary)] w-fit"
        >
            <ArrowLeft className="w-4 h-4" /> Back to Gig Board
        </Link>
    );
}

function EmptyCard({ title, body }: { title: string; body: string }) {
    return (
        <div className="p-10 border border-[var(--border-subtle)] rounded-lg bg-white text-center">
            <h2 className="font-heading text-xl font-bold text-[var(--text-primary)] mb-2">
                {title}
            </h2>
            <p className="text-[var(--text-secondary)] max-w-md mx-auto">{body}</p>
        </div>
    );
}

export default function ProposePage() {
    const params = useParams<{ needId: string }>();
    const needId = (typeof params.needId === "string" ? params.needId : "") as Id<"needs">;
    const router = useRouter();

    const viewer = useQuery(api.users.viewer, {});
    const isEducator = !!viewer && viewer.role === "educator";

    const needs = useQuery(
        api.needs.listOpenForEducators,
        isEducator ? {} : "skip"
    ) as OpenNeed[] | undefined;
    const myProposals = useQuery(api.proposals.listMine, isEducator ? {} : "skip");
    const mine = useQuery(api.educators.getMine, isEducator ? {} : "skip");

    const generateAttachmentUploadUrl = useMutation(api.proposals.generateAttachmentUploadUrl);
    const submitProposal = useMutation(api.proposals.submit);
    const withdrawProposal = useMutation(api.proposals.withdraw);

    const [message, setMessage] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [proposedRate, setProposedRate] = useState("");
    const [proposedRateUnit, setProposedRateUnit] = useState<"hourly" | "daily" | "fixed">("hourly");
    const [submitting, setSubmitting] = useState(false);
    const [withdrawing, setWithdrawing] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const need = useMemo(
        () => needs?.find((n) => n._id === needId) ?? null,
        [needs, needId]
    );

    const viewableProposal = useMemo(
        () => findViewableProposal(myProposals ?? [], needId as unknown as string),
        [myProposals, needId]
    );

    // Signed out
    if (viewer === null) {
        return (
            <Shell>
                <BackLink />
                <EmptyCard
                    title="Sign in as an educator to submit a proposal"
                    body="Open needs appear here once you're signed in with an educator account."
                />
                <Link href="/login?intent=educator" className="w-fit">
                    <PrimaryButton>Sign in</PrimaryButton>
                </Link>
            </Shell>
        );
    }

    // Wrong role
    if (viewer && !isEducator) {
        return (
            <Shell>
                <BackLink />
                <EmptyCard
                    title="This page is for educators"
                    body="Districts post needs — educators respond with proposals."
                />
            </Shell>
        );
    }

    // Loading (viewer, needs, or the consultant's proposals still resolving)
    if (viewer === undefined || needs === undefined || myProposals === undefined) {
        return (
            <Shell>
                <BackLink />
                <div className="p-10 border border-[var(--border-subtle)] rounded-lg bg-white text-center text-[var(--text-secondary)]">
                    Loading…
                </div>
            </Shell>
        );
    }

    // Existing proposal stays readable after the need leaves the open board.
    if (viewableProposal) {
        const submitted = viewableProposal;
        const summaryNeed = need ?? {
            orgName: submitted.orgName,
            areaOfNeed: submitted.areaOfNeed,
            subCategory: submitted.subCategory,
        };
        async function handleWithdraw() {
            setWithdrawing(true);
            try {
                await withdrawProposal({ proposalId: submitted._id });
                toast.success("Proposal withdrawn. You can submit a new one.");
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not withdraw this proposal.");
            } finally {
                setWithdrawing(false);
            }
        }

        return (
            <Shell>
                <BackLink />
                <SubmittedProposalView
                    need={summaryNeed}
                    proposal={submitted}
                    withdrawing={withdrawing}
                    onWithdraw={() => void handleWithdraw()}
                />
            </Shell>
        );
    }

    // Need loaded but not found / no longer open — only blocks new submissions.
    if (!need) {
        return (
            <Shell>
                <BackLink />
                <EmptyCard
                    title="This need is no longer open"
                    body="It may have been filled or removed. Browse the Gig Board for other open needs."
                />
                <Link href="/dashboard/board" className="w-fit">
                    <PrimaryButton>Back to Gig Board</PrimaryButton>
                </Link>
            </Shell>
        );
    }

    function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        setFormError(null);
        const chosen = e.target.files?.[0] ?? null;
        if (chosen && chosen.size > MAX_FILE_BYTES) {
            setFormError("That file is larger than 10 MB. Please attach a smaller file.");
            e.target.value = "";
            return;
        }
        setFile(chosen);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setFormError(null);
        if (!need) return;
        if (!message.trim()) {
            setFormError("Your proposal message is required.");
            return;
        }
        if (!file && !mine?.resumeStorageId) {
            setFormError("Attach a resume/CV or upload one in Settings before submitting a proposal.");
            return;
        }
        const rateNum = proposedRate ? Number(proposedRate) : undefined;
        if (rateNum !== undefined && Number.isNaN(rateNum)) {
            setFormError("Proposed rate must be a number.");
            return;
        }

        setSubmitting(true);
        try {
            let attachmentStorageId: Id<"_storage"> | undefined;
            let attachmentName: string | undefined;
            if (file) {
                const uploadUrl = await generateAttachmentUploadUrl({});
                const res = await fetch(uploadUrl, {
                    method: "POST",
                    headers: { "Content-Type": file.type || "application/octet-stream" },
                    body: file,
                });
                if (!res.ok) throw new Error("Upload failed");
                const json = (await res.json()) as { storageId: Id<"_storage"> };
                attachmentStorageId = json.storageId;
                attachmentName = file.name;
            }

            await submitProposal({
                needId: need._id,
                message: message.trim(),
                attachmentStorageId,
                attachmentName,
                proposedRate: rateNum,
                proposedRateUnit: rateNum !== undefined ? proposedRateUnit : undefined,
            });
            toast.success("Proposal sent");
            router.push("/dashboard/board");
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Could not send proposal.";
            setFormError(msg);
            setSubmitting(false);
        }
    }

    return (
        <Shell>
            <BackLink />
            <PageHeader
                title="Submit a proposal"
                description="Respond to this district-posted need. Share how you can help and attach your resume or a proposal doc."
            />

            <NeedSummaryCard need={need} />

            {/* ── Proposal form ── */}
            <form
                onSubmit={handleSubmit}
                className="p-8 rounded-lg bg-white border border-[var(--border-subtle)] shadow-sm flex flex-col gap-6"
            >
                <div className="flex flex-col gap-2">
                    <label
                        htmlFor="proposal-message"
                        className="text-sm font-semibold text-[var(--text-primary)]"
                    >
                        Your proposal <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="proposal-message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={8}
                        placeholder="Introduce yourself and describe how you can help with this need."
                        className="w-full p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] focus:bg-white transition-all resize-y"
                        required
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-[var(--text-primary)]">
                        Attach your resume or proposal{" "}
                        <span className="font-normal text-[var(--text-tertiary)]">
                            {mine?.resumeStorageId ? "(optional — your profile resume will be used)" : "(required unless a resume is on your profile)"}
                        </span>
                    </span>
                    {mine?.resumeFileName && !file && (
                        <p className="text-sm text-[var(--text-secondary)]">
                            Profile resume on file: {mine.resumeFileName}
                        </p>
                    )}
                    {file ? (
                        <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-4 py-3">
                            <span className="flex items-center gap-3 min-w-0">
                                <FileArrowUp
                                    weight="bold"
                                    className="w-5 h-5 text-[var(--accent-primary)] shrink-0"
                                />
                                <span className="text-sm font-semibold text-[var(--text-primary)] truncate">
                                    {file.name}
                                </span>
                            </span>
                            <button
                                type="button"
                                onClick={() => setFile(null)}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--text-secondary)] hover:text-red-600 shrink-0"
                            >
                                <X weight="bold" className="w-3.5 h-3.5" /> Remove
                            </button>
                        </div>
                    ) : (
                        <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[var(--border-strong)] bg-[var(--bg-subtle)] px-6 py-8 cursor-pointer hover:border-[var(--accent-primary)]/50 transition-colors text-center">
                            <FileArrowUp
                                weight="bold"
                                className="w-8 h-8 text-[var(--text-tertiary)]"
                            />
                            <span className="text-sm font-semibold text-[var(--text-primary)]">
                                Click to attach a file
                            </span>
                            <span className="text-xs text-[var(--text-tertiary)]">
                                PDF, DOC, DOCX, PNG, or JPG — up to 10 MB.
                            </span>
                            <input
                                type="file"
                                onChange={onFileChange}
                                className="hidden"
                                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                            />
                        </label>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-[var(--text-primary)]">
                        Your rate{" "}
                        <span className="font-normal text-[var(--text-tertiary)]">(optional)</span>
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                        <input
                            id="proposal-rate"
                            type="number"
                            min={0}
                            value={proposedRate}
                            onChange={(e) => setProposedRate(e.target.value)}
                            placeholder="75"
                            className="w-full h-11 px-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] focus:bg-white transition-all"
                        />
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

                {formError && <p className="text-sm text-red-600 font-semibold">{formError}</p>}

                <div className="flex items-center gap-3 pt-1">
                    <PrimaryButton type="submit" disabled={submitting}>
                        {submitting ? "Sending…" : `Send proposal to ${need.orgName}`}
                    </PrimaryButton>
                    <Link
                        href="/dashboard/board"
                        className="text-sm font-semibold text-[var(--text-secondary)] hover:underline"
                    >
                        Cancel
                    </Link>
                </div>
            </form>
        </Shell>
    );
}
