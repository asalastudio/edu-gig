"use client";

import React, { useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { PrimaryButton } from "@/components/shared/button";
import { CredentialFileLink } from "@/components/shared/credential-file-link";
import { isCheckrEnabled } from "@/lib/launch-flags";
import { privateFileMime, uploadPrivateFile } from "@/lib/private-upload";
import { Certificate, CheckCircle, Clock, FileArrowUp, Plus } from "@phosphor-icons/react";
import {
    formatCredentialType,
    formatExpiry,
    type CredentialType,
} from "@/lib/map-credentials";

type CredentialRow = {
    _id: string;
    type: string;
    title: string;
    issuingBody: string;
    state?: string;
    issueDate: string;
    expiryDate?: string;
    documentUrl?: string;
    storageId?: string;
    privateFileId?: string;
    verified: boolean;
};

const CREDENTIAL_TYPES: { value: CredentialType; label: string }[] = [
    { value: "state_license", label: "State License" },
    { value: "certification", label: "Certification" },
    { value: "degree", label: "Degree" },
    { value: "endorsement", label: "Endorsement" },
];

type VerificationStatus = "unverified" | "pending" | "verified" | "premier";

/** Two hardcoded example credentials shown when no educator viewer is signed in. */
const DEMO_CREDENTIALS: CredentialRow[] = [
    {
        _id: "demo-1",
        type: "state_license",
        title: "Standard Teaching Certificate",
        issuingBody: "Michigan Department of Education",
        state: "MI",
        issueDate: "2018-08-15",
        expiryDate: "2028-08-15",
        verified: true,
    },
    {
        _id: "demo-2",
        type: "certification",
        title: "National Board Certification (NBCT)",
        issuingBody: "NBPTS",
        issueDate: "2020-11-01",
        verified: true,
    },
];

const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export function CredentialsSection() {
    if (!hasClerk) return <CredentialsSectionView getToken={async () => null} />;
    return <CredentialsSectionWithClerk />;
}

function CredentialsSectionWithClerk() {
    const { getToken } = useAuth();
    return <CredentialsSectionView getToken={() => getToken({ template: "convex" })} />;
}

function CredentialsSectionView({ getToken }: { getToken: () => Promise<string | null> }) {
    const viewer = useQuery(api.users.viewer, hasClerk ? {} : "skip");
    const educator = useQuery(
        api.educators.getMine,
        hasClerk ? {} : "skip"
    );
    const credentialsQuery = useQuery(
        api.credentials.listMine,
        hasClerk && viewer ? {} : "skip"
    );

    const isDemo = !viewer;
    const credentials = (isDemo ? DEMO_CREDENTIALS : (credentialsQuery ?? [])) as CredentialRow[];

    const verificationStatus: VerificationStatus = educator
        ? (educator.verificationStatus as VerificationStatus)
        : "unverified";

    const requestUpload = useMutation(api.privateFiles.requestUpload);
    const finalizeUpload = useMutation(api.credentials.finalizeUpload);
    const removeCredential = useMutation(api.credentials.remove);

    const [showForm, setShowForm] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [checkrLoading, setCheckrLoading] = useState(false);
    const [checkrError, setCheckrError] = useState<string | null>(null);

    const [type, setType] = useState<CredentialType>("state_license");
    const [title, setTitle] = useState("");
    const [issuingBody, setIssuingBody] = useState("");
    const [stateField, setStateField] = useState("");
    const [issueDate, setIssueDate] = useState("");
    const [expiryDate, setExpiryDate] = useState("");
    const [file, setFile] = useState<{ value: File; requestId: string } | null>(null);
    const checkrEnabled = isCheckrEnabled();

    const canSubmit = useMemo(
        () => !isDemo && title.trim().length > 0 && issuingBody.trim().length > 0 && issueDate.length > 0,
        [isDemo, title, issuingBody, issueDate]
    );

    function resetForm() {
        setType("state_license");
        setTitle("");
        setIssuingBody("");
        setStateField("");
        setIssueDate("");
        setExpiryDate("");
        setFile(null);
        setFormError(null);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!canSubmit) return;
        setFormError(null);
        setSubmitting(true);
        try {
            let privateFileId: Id<"privateFiles"> | undefined;
            if (file) {
                const ticket = await requestUpload({
                    purpose: "credential",
                    fileName: file.value.name,
                    mimeType: privateFileMime(file.value),
                    size: file.value.size,
                    requestId: file.requestId,
                });
                const token = await getToken();
                if (!token) throw new Error("Your session expired. Sign in again, then retry.");
                const receipt = await uploadPrivateFile({ file: file.value, ticketId: ticket.ticketId, token });
                privateFileId = receipt.privateFileId;
            }
            await finalizeUpload({
                privateFileId,
                type,
                title: title.trim(),
                issuingBody: issuingBody.trim(),
                state: stateField.trim() || undefined,
                issueDate,
                expiryDate: expiryDate || undefined,
            });
            resetForm();
            setShowForm(false);
        } catch (err) {
            console.error("Credential save failed:", err);
            setFormError(err instanceof Error ? err.message : "Could not save credential. Please try again.");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleRemove(credentialId: string) {
        if (isDemo) return;
        try {
            await removeCredential({ credentialId: credentialId as Id<"credentials"> });
        } catch (err) {
            console.error("Credential delete failed:", err);
        }
    }

    async function handleStartCheck() {
        setCheckrError(null);
        setCheckrLoading(true);
        try {
            const res = await fetch("/api/checkr/invite", { method: "POST" });
            if (res.status === 503) {
                setCheckrError("Checkr not configured");
                return;
            }
            if (!res.ok) {
                const body = (await res.json().catch(() => ({}))) as { error?: string };
                setCheckrError(body.error ?? "Could not start background check.");
                return;
            }
            const body = (await res.json()) as { invitation_url?: string };
            if (body.invitation_url) {
                window.location.href = body.invitation_url;
            } else {
                setCheckrError("Invitation URL missing from response.");
            }
        } catch (err) {
            console.error("Checkr start failed:", err);
            setCheckrError("Could not start background check.");
        } finally {
            setCheckrLoading(false);
        }
    }

    return (
        <section
            className="p-8 rounded-lg bg-white border border-[var(--border-subtle)] shadow-sm"
            data-testid="credentials-section"
        >
            <div className="mb-5">
                <h2 className="font-heading text-lg font-bold text-[var(--text-primary)]">
                    Credentials &amp; Verification
                </h2>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                    Add your licenses, certifications, and degrees. Districts see these on your public
                    profile and reference them when deciding who to place.
                </p>
            </div>

            {isDemo && (
                <p className="mb-4 text-xs text-[var(--text-tertiary)]">
                    Showing example credentials. Sign in as an educator to add your own.
                </p>
            )}

            {/* Add button — shown when the user already has credentials and the form is closed. */}
            {!isDemo && !showForm && credentials.length > 0 && (
                <button
                    type="button"
                    onClick={() => {
                        setShowForm(true);
                        setFormError(null);
                    }}
                    className="mb-5 inline-flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] px-4 py-2.5 text-sm font-bold text-[var(--text-primary)] hover:border-[var(--accent-primary)]/40 hover:text-[var(--accent-primary)]"
                >
                    <Plus weight="bold" className="w-4 h-4" /> Add a credential
                </button>
            )}

            {!isDemo && showForm && (
                <form
                    onSubmit={handleSubmit}
                    className="mb-6 p-6 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] flex flex-col gap-6"
                    data-testid="credential-form"
                >
                    <div className="flex flex-col gap-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                            What are you adding?
                        </p>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <label className="flex flex-col gap-1.5 text-sm font-semibold text-[var(--text-primary)]">
                                <span>Credential type</span>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value as CredentialType)}
                                    className="h-11 px-3 rounded-lg border border-[var(--border-subtle)] bg-white font-normal text-sm"
                                >
                                    {CREDENTIAL_TYPES.map((t) => (
                                        <option key={t.value} value={t.value}>
                                            {t.label}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="flex flex-col gap-1.5 text-sm font-semibold text-[var(--text-primary)]">
                                <span>Name of credential <span className="text-red-600">*</span></span>
                                <input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                    className="h-11 px-3 rounded-lg border border-[var(--border-subtle)] bg-white font-normal text-sm"
                                    placeholder="e.g. Standard Teaching Certificate"
                                />
                            </label>
                            <label className="flex flex-col gap-1.5 text-sm font-semibold text-[var(--text-primary)]">
                                <span>Issued by <span className="text-red-600">*</span></span>
                                <input
                                    value={issuingBody}
                                    onChange={(e) => setIssuingBody(e.target.value)}
                                    required
                                    className="h-11 px-3 rounded-lg border border-[var(--border-subtle)] bg-white font-normal text-sm"
                                    placeholder="e.g. Michigan Department of Education"
                                />
                            </label>
                            <label className="flex flex-col gap-1.5 text-sm font-semibold text-[var(--text-primary)]">
                                <span>State</span>
                                <input
                                    value={stateField}
                                    onChange={(e) => setStateField(e.target.value)}
                                    className="h-11 px-3 rounded-lg border border-[var(--border-subtle)] bg-white font-normal text-sm"
                                    placeholder="e.g. MI"
                                />
                            </label>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                            Valid dates
                        </p>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <label className="flex flex-col gap-1.5 text-sm font-semibold text-[var(--text-primary)]">
                                <span>Issue date <span className="text-red-600">*</span></span>
                                <input
                                    type="date"
                                    value={issueDate}
                                    onChange={(e) => setIssueDate(e.target.value)}
                                    required
                                    className="h-11 px-3 rounded-lg border border-[var(--border-subtle)] bg-white font-normal text-sm"
                                />
                            </label>
                            <label className="flex flex-col gap-1.5 text-sm font-semibold text-[var(--text-primary)]">
                                <span>Expires <span className="font-normal text-[var(--text-tertiary)]">(if applicable)</span></span>
                                <input
                                    type="date"
                                    value={expiryDate}
                                    onChange={(e) => setExpiryDate(e.target.value)}
                                    className="h-11 px-3 rounded-lg border border-[var(--border-subtle)] bg-white font-normal text-sm"
                                />
                            </label>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                            Document
                        </p>
                        <label className="flex items-center gap-3 rounded-lg border border-dashed border-[var(--border-strong)] bg-white px-4 py-3 cursor-pointer hover:border-[var(--accent-primary)]/50">
                            <FileArrowUp weight="bold" className="w-5 h-5 text-[var(--text-tertiary)] shrink-0" />
                            <span className="text-sm text-[var(--text-secondary)] truncate">
                                {file ? file.value.name : "Attach a scan or photo — PDF, PNG, or JPG (optional, up to 10 MB)"}
                            </span>
                            <input
                                type="file"
                                onChange={(e) => {
                                    setFormError(null);
                                    const selected = e.target.files?.[0] ?? null;
                                    if (!selected) return setFile(null);
                                    if (selected.size > 10 * 1024 * 1024) return setFormError("Keep the credential file under 10 MB.");
                                    if (!/\.(pdf|png|jpe?g)$/i.test(selected.name)) return setFormError("Upload a PDF, PNG, or JPEG credential.");
                                    setFile({ value: selected, requestId: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}` });
                                }}
                                className="hidden"
                                accept=".pdf,.png,.jpg,.jpeg"
                            />
                        </label>
                    </div>

                    {submitting && <p role="status" aria-live="polite" className="text-sm text-[var(--text-secondary)]">Uploading and saving credential…</p>}
                    {formError && <p role="alert" className="text-sm text-red-600 font-semibold">{formError}</p>}
                    <div className="flex items-center gap-3">
                        <PrimaryButton type="submit" disabled={!canSubmit || submitting}>
                            {submitting ? "Saving…" : "Save credential"}
                        </PrimaryButton>
                        <button
                            type="button"
                            onClick={() => {
                                setShowForm(false);
                                resetForm();
                            }}
                            className="text-sm font-semibold text-[var(--text-secondary)] hover:underline"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {credentials.length === 0 ? (
                isDemo ? (
                    <p className="text-sm text-[var(--text-tertiary)]">No credentials to show.</p>
                ) : (
                    !showForm && (
                        <div className="flex flex-col items-center text-center rounded-lg border border-dashed border-[var(--border-strong)] bg-[var(--bg-subtle)] px-6 py-10">
                            <div className="w-12 h-12 rounded-full bg-white border border-[var(--border-subtle)] flex items-center justify-center mb-4">
                                <Certificate weight="regular" className="w-6 h-6 text-[var(--text-tertiary)]" />
                            </div>
                            <h3 className="font-heading text-base font-bold text-[var(--text-primary)] mb-1">
                                Add your first credential
                            </h3>
                            <p className="text-sm text-[var(--text-secondary)] max-w-sm mb-5">
                                Teaching certificates, National Board certification, endorsements, or degrees —
                                anything that shows districts you&apos;re qualified.
                            </p>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowForm(true);
                                    setFormError(null);
                                }}
                                className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent-primary)] px-5 py-2.5 text-sm font-bold text-white hover:bg-[var(--accent-primary-h)]"
                            >
                                <Plus weight="bold" className="w-4 h-4" /> Add a credential
                            </button>
                        </div>
                    )
                )
            ) : (
                <ul className="grid gap-3">
                    {credentials.map((c) => (
                        <li
                            key={c._id}
                            className="flex items-start justify-between gap-4 p-4 rounded-lg border border-[var(--border-subtle)] bg-white"
                            data-testid="credential-card"
                        >
                            <div className="flex items-start gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0 mt-0.5">
                                    <Certificate weight="regular" className="w-5 h-5 text-[var(--text-tertiary)]" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs uppercase tracking-wide text-[var(--text-tertiary)] font-bold">
                                        {formatCredentialType(c.type)}
                                    </p>
                                    <p className="font-heading text-base font-bold text-[var(--text-primary)] truncate">
                                        {c.title}
                                    </p>
                                    <p className="text-sm text-[var(--text-secondary)] truncate">
                                        {c.issuingBody}
                                        {c.state ? ` · ${c.state}` : ""}
                                    </p>
                                    <p className="text-xs text-[var(--text-tertiary)] mt-1">
                                        Issued {c.issueDate} · {formatExpiry(c.expiryDate)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2 shrink-0">
                                {c.verified ? (
                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md">
                                        <CheckCircle weight="fill" className="w-3.5 h-3.5" /> Verified
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[var(--text-secondary)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] px-2 py-1 rounded-md">
                                        <Clock weight="bold" className="w-3.5 h-3.5" /> Pending review
                                    </span>
                                )}
                                <div className="flex items-center gap-3">
                                    {!isDemo && (c.privateFileId || c.storageId || c.documentUrl) && (
                                        <CredentialFileLink credentialId={c._id} />
                                    )}
                                    {!isDemo && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemove(c._id)}
                                            className="text-xs font-semibold text-red-700 hover:underline"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <div
                className="mt-8 pt-6 border-t border-[var(--border-subtle)]"
                data-testid="background-check"
            >
                <h3 className="font-heading text-base font-bold text-[var(--text-primary)] mb-1">
                    Background check
                </h3>
                {!checkrEnabled && (
                    <p className="text-sm text-[var(--text-secondary)]">
                        Background checks are deferred for the controlled beta. K12Gig will enable Checkr after launch configuration is approved.
                    </p>
                )}
                {checkrEnabled && isDemo && (
                    <>
                        <p className="text-sm text-[var(--text-secondary)] mb-3">
                            Sign in as an educator to start a Checkr background check.
                        </p>
                        <button
                            type="button"
                            disabled
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[var(--bg-subtle)] text-[var(--text-tertiary)] text-sm font-medium cursor-not-allowed"
                        >
                            Start background check
                        </button>
                    </>
                )}
                {checkrEnabled && !isDemo && (verificationStatus === "verified" || verificationStatus === "premier") && (
                    <p className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-md">
                        Background check complete
                    </p>
                )}
                {checkrEnabled && !isDemo && verificationStatus === "pending" && (
                    <p className="inline-flex items-center gap-2 text-sm font-bold text-amber-700 bg-amber-50 px-3 py-2 rounded-md">
                        Background check in progress
                    </p>
                )}
                {checkrEnabled && !isDemo && verificationStatus === "unverified" && (
                    <>
                        <p className="text-sm text-[var(--text-secondary)] mb-3">
                            Unlock the Verified tier by completing a Checkr background check.
                        </p>
                        <PrimaryButton
                            type="button"
                            onClick={handleStartCheck}
                            disabled={checkrLoading}
                        >
                            {checkrLoading ? "Starting…" : "Start background check"}
                        </PrimaryButton>
                        {checkrError && (
                            <p className="mt-2 text-sm text-red-600 font-semibold">{checkrError}</p>
                        )}
                    </>
                )}
            </div>
        </section>
    );
}
