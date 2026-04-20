"use client";

import React, { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { PrimaryButton } from "@/components/shared/button";
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
        issuingBody: "Texas TEA",
        state: "TX",
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

    const generateUploadUrl = useMutation(api.credentials.generateUploadUrl);
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
    const [file, setFile] = useState<File | null>(null);

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
            let storageId: Id<"_storage"> | undefined;
            if (file) {
                const uploadUrl = await generateUploadUrl({});
                const res = await fetch(uploadUrl, {
                    method: "POST",
                    headers: { "Content-Type": file.type || "application/octet-stream" },
                    body: file,
                });
                if (!res.ok) throw new Error("Upload failed");
                const json = (await res.json()) as { storageId: Id<"_storage"> };
                storageId = json.storageId;
            }
            await finalizeUpload({
                storageId,
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
            setFormError("Could not save credential. Please try again.");
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
            className="p-8 rounded-3xl bg-white border border-[var(--border-subtle)] shadow-sm"
            data-testid="credentials-section"
        >
            <div className="flex items-start justify-between mb-5 gap-4 flex-wrap">
                <div>
                    <h2 className="font-heading text-lg font-bold text-[var(--text-primary)]">
                        Credentials &amp; Verification
                    </h2>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                        Upload licenses, certifications, and degrees. Districts reference these when placing you.
                    </p>
                </div>
                {!isDemo && (
                    <button
                        type="button"
                        onClick={() => {
                            setShowForm((s) => !s);
                            setFormError(null);
                        }}
                        className="text-sm font-bold text-[var(--accent-primary)] hover:underline"
                    >
                        {showForm ? "Cancel" : "Add credential"}
                    </button>
                )}
            </div>

            {isDemo && (
                <p className="mb-4 text-xs text-[var(--text-tertiary)]">
                    Showing demo credentials. Sign in as an educator to manage your own.
                </p>
            )}

            {!isDemo && showForm && (
                <form
                    onSubmit={handleSubmit}
                    className="mb-6 p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] grid gap-4"
                    data-testid="credential-form"
                >
                    <div className="grid sm:grid-cols-2 gap-4">
                        <label className="flex flex-col gap-1 text-sm font-semibold">
                            Type
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value as CredentialType)}
                                className="h-10 px-3 rounded-md border border-[var(--border-subtle)] bg-white font-normal"
                            >
                                {CREDENTIAL_TYPES.map((t) => (
                                    <option key={t.value} value={t.value}>
                                        {t.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="flex flex-col gap-1 text-sm font-semibold">
                            Title
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                className="h-10 px-3 rounded-md border border-[var(--border-subtle)] bg-white font-normal"
                                placeholder="e.g. Standard Teaching Certificate"
                            />
                        </label>
                        <label className="flex flex-col gap-1 text-sm font-semibold">
                            Issuing body
                            <input
                                value={issuingBody}
                                onChange={(e) => setIssuingBody(e.target.value)}
                                required
                                className="h-10 px-3 rounded-md border border-[var(--border-subtle)] bg-white font-normal"
                                placeholder="e.g. Texas TEA"
                            />
                        </label>
                        <label className="flex flex-col gap-1 text-sm font-semibold">
                            State (optional)
                            <input
                                value={stateField}
                                onChange={(e) => setStateField(e.target.value)}
                                className="h-10 px-3 rounded-md border border-[var(--border-subtle)] bg-white font-normal"
                                placeholder="e.g. TX"
                            />
                        </label>
                        <label className="flex flex-col gap-1 text-sm font-semibold">
                            Issue date
                            <input
                                type="date"
                                value={issueDate}
                                onChange={(e) => setIssueDate(e.target.value)}
                                required
                                className="h-10 px-3 rounded-md border border-[var(--border-subtle)] bg-white font-normal"
                            />
                        </label>
                        <label className="flex flex-col gap-1 text-sm font-semibold">
                            Expiry date (optional)
                            <input
                                type="date"
                                value={expiryDate}
                                onChange={(e) => setExpiryDate(e.target.value)}
                                className="h-10 px-3 rounded-md border border-[var(--border-subtle)] bg-white font-normal"
                            />
                        </label>
                    </div>
                    <label className="flex flex-col gap-1 text-sm font-semibold">
                        Upload file (optional)
                        <input
                            type="file"
                            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                            className="text-sm font-normal"
                            accept=".pdf,.png,.jpg,.jpeg"
                        />
                    </label>
                    {formError && <p className="text-sm text-red-600 font-semibold">{formError}</p>}
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
                <p className="text-sm text-[var(--text-tertiary)]">
                    No credentials yet.{" "}
                    {!isDemo && "Click “Add credential” to upload your first one."}
                </p>
            ) : (
                <ul className="grid gap-3">
                    {credentials.map((c) => (
                        <li
                            key={c._id}
                            className="flex items-start justify-between gap-4 p-4 rounded-2xl border border-[var(--border-subtle)] bg-white"
                            data-testid="credential-card"
                        >
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
                            <div className="flex items-center gap-3 shrink-0">
                                {c.verified && (
                                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md">
                                        Verified
                                    </span>
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
                {isDemo && (
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
                {!isDemo && (verificationStatus === "verified" || verificationStatus === "premier") && (
                    <p className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-md">
                        Background check complete
                    </p>
                )}
                {!isDemo && verificationStatus === "pending" && (
                    <p className="inline-flex items-center gap-2 text-sm font-bold text-amber-700 bg-amber-50 px-3 py-2 rounded-md">
                        Background check in progress
                    </p>
                )}
                {!isDemo && verificationStatus === "unverified" && (
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
