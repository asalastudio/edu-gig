"use client";

import React, { useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { toast, Toaster } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Sidebar } from "@/components/shared/sidebar";
import { PageHeader } from "@/components/shared/page-header";
import { PrimaryButton } from "@/components/shared/button";
import { privateFileMime, uploadPrivateFile } from "@/lib/private-upload";
import { getAreaOfNeedLabel, TAXONOMY } from "@/lib/taxonomy";
import {
    ArrowLeft,
    Buildings,
    Briefcase,
    CurrencyDollar,
    FileArrowUp,
    X,
} from "@phosphor-icons/react";

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
const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

function gradeLabel(gradeId: string | undefined): string | null {
    if (!gradeId) return null;
    const match = TAXONOMY.gradeLevelBands.find((g) => g.id === gradeId);
    return match?.label ?? gradeId;
}

/** Prominent "who posted this gig" source block, mirrors the Gig Board's NeedSource. */
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
    if (!hasClerk) return <ProposePageView getToken={async () => null} />;
    return <ProposePageWithClerk />;
}

function ProposePageWithClerk() {
    const { getToken } = useAuth();
    return <ProposePageView getToken={() => getToken({ template: "convex" })} />;
}

function ProposePageView({ getToken }: { getToken: () => Promise<string | null> }) {
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

    const requestUpload = useMutation(api.privateFiles.requestUpload);
    const submitProposal = useMutation(api.proposals.submit);

    const [message, setMessage] = useState("");
    const [file, setFile] = useState<{ value: File; requestId: string } | null>(null);
    const [proposedRate, setProposedRate] = useState("");
    const [proposedRateUnit, setProposedRateUnit] = useState<"hourly" | "daily" | "fixed">("hourly");
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const need = useMemo(
        () => needs?.find((n) => n._id === needId) ?? null,
        [needs, needId]
    );

    const alreadyProposed = useMemo(() => {
        for (const p of myProposals ?? []) {
            if (
                (p.needId as unknown as string) === (needId as unknown as string) &&
                p.status === "pending"
            ) {
                return true;
            }
        }
        return false;
    }, [myProposals, needId]);

    // Signed out
    if (viewer === null) {
        return (
            <Shell>
                <BackLink />
                <EmptyCard
                    title="Sign in as an educator to submit a proposal"
                    body="Open needs appear here once you're signed in with an educator account."
                />
                <Link href="/login?intent=educator" className="inline-flex min-h-10 w-fit items-center rounded-lg bg-[var(--accent-primary)] px-4 py-2.5 text-sm font-bold text-white">Sign in</Link>
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

    // Loading (viewer or needs still resolving)
    if (viewer === undefined || needs === undefined) {
        return (
            <Shell>
                <BackLink />
                <div className="p-10 border border-[var(--border-subtle)] rounded-lg bg-white text-center text-[var(--text-secondary)]">
                    Loading…
                </div>
            </Shell>
        );
    }

    // Need loaded but not found / no longer open
    if (!need) {
        return (
            <Shell>
                <BackLink />
                <EmptyCard
                    title="This need is no longer open"
                    body="It may have been filled or removed. Browse the Gig Board for other open needs."
                />
                <Link href="/dashboard/board" className="inline-flex min-h-10 w-fit items-center rounded-lg bg-[var(--accent-primary)] px-4 py-2.5 text-sm font-bold text-white">Back to Gig Board</Link>
            </Shell>
        );
    }

    // Already submitted
    if (alreadyProposed) {
        return (
            <Shell>
                <BackLink />
                <PageHeader
                    title="Proposal already submitted"
                    description={`You've already submitted a proposal for this need from ${need.orgName}.`}
                />
                <div className="p-8 border border-[var(--border-subtle)] rounded-lg bg-white">
                    <p className="text-[var(--text-secondary)] mb-6">
                        The district can see your proposal and will reach out if it&apos;s a match.
                        You can only have one active proposal per need.
                    </p>
                    <Link href="/dashboard/board" className="inline-flex min-h-10 w-fit items-center rounded-lg bg-[var(--accent-primary)] px-4 py-2.5 text-sm font-bold text-white">Back to Gig Board</Link>
                </div>
            </Shell>
        );
    }

    const grade = gradeLabel(need.gradeLevel);

    function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        setFormError(null);
        const chosen = e.target.files?.[0] ?? null;
        if (chosen && chosen.size > MAX_FILE_BYTES) {
            setFormError("That file is larger than 10 MB. Please attach a smaller file.");
            e.target.value = "";
            return;
        }
        if (chosen && !/\.(pdf|doc|docx)$/i.test(chosen.name)) {
            setFormError("Attach a PDF or Word document.");
            e.target.value = "";
            return;
        }
        setFile(chosen ? { value: chosen, requestId: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}` } : null);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setFormError(null);
        if (!need) return;
        if (!message.trim()) {
            setFormError("Your proposal message is required.");
            return;
        }
        if (!file && !mine?.resumePrivateFileId) {
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
            let attachmentPrivateFileId: Id<"privateFiles"> | undefined;
            let attachmentName: string | undefined;
            if (file) {
                const ticket = await requestUpload({
                    purpose: "proposal",
                    needId: need._id,
                    fileName: file.value.name,
                    mimeType: privateFileMime(file.value),
                    size: file.value.size,
                    requestId: file.requestId,
                });
                const token = await getToken();
                if (!token) throw new Error("Your session expired. Sign in again, then retry your proposal.");
                const receipt = await uploadPrivateFile({ file: file.value, ticketId: ticket.ticketId, token });
                attachmentPrivateFileId = receipt.privateFileId;
                attachmentName = file.value.name;
            }

            await submitProposal({
                needId: need._id,
                message: message.trim(),
                attachmentPrivateFileId,
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

            {/* ── RFP summary — the need you're responding to ── */}
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
                            {mine?.resumePrivateFileId ? "(optional — your profile resume will be used)" : "(required unless a resume is on your profile)"}
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
                                    {file.value.name}
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
                                PDF, DOC, or DOCX — up to 10 MB.
                            </span>
                            <input
                                type="file"
                                onChange={onFileChange}
                                className="hidden"
                                accept=".pdf,.doc,.docx"
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

                {submitting && <p role="status" aria-live="polite" className="text-sm text-[var(--text-secondary)]">Uploading and sending proposal…</p>}
                {formError && <p role="alert" className="text-sm text-red-600 font-semibold">{formError}</p>}

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
