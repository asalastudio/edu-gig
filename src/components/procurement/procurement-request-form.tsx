"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PrimaryButton } from "@/components/shared/button";
import { SUPPORT_EMAIL, supportMailto } from "@/lib/legal";
import { PROCUREMENT_MATERIALS } from "@/lib/procurement";

const STATE_OPTIONS = ["TX", "AL", "AZ", "AR", "CA", "CO", "FL", "GA", "IL", "LA", "NM", "NY", "OK", "Other"];

const DEFAULT_MATERIALS = ["dpa", "privacy_policy", "subprocessors", "security_overview"];

export function ProcurementRequestForm() {
    const viewer = useQuery(api.users.viewer, {});
    const createRequest = useMutation(api.procurement.createRequest);
    const [requesterName, setRequesterName] = useState("");
    const [requesterEmail, setRequesterEmail] = useState("");
    const [requesterTitle, setRequesterTitle] = useState("");
    const [districtName, setDistrictName] = useState("");
    const [state, setState] = useState("TX");
    const [deadline, setDeadline] = useState("");
    const [procurementContact, setProcurementContact] = useState("");
    const [notes, setNotes] = useState("");
    const [materials, setMaterials] = useState<string[]>(DEFAULT_MATERIALS);
    const [submitting, setSubmitting] = useState(false);
    const [submittedId, setSubmittedId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const suggestedName = useMemo(() => {
        if (!viewer) return "";
        return `${viewer.firstName ?? ""} ${viewer.lastName ?? ""}`.trim();
    }, [viewer]);

    function toggleMaterial(id: string) {
        setMaterials((current) =>
            current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
        );
    }

    async function onSubmit(event: FormEvent) {
        event.preventDefault();
        setError(null);
        setSubmittedId(null);
        if (materials.length === 0) {
            setError("Choose at least one procurement material.");
            return;
        }

        setSubmitting(true);
        try {
            const requestId = await createRequest({
                requesterName: requesterName.trim() || suggestedName,
                requesterEmail: requesterEmail.trim() || viewer?.email || "",
                requesterTitle: requesterTitle.trim() || undefined,
                districtName: districtName.trim(),
                state,
                requestedMaterials: materials,
                deadline: deadline.trim() || undefined,
                procurementContact: procurementContact.trim() || undefined,
                notes: notes.trim() || undefined,
            });
            setSubmittedId(requestId);
            setNotes("");
            setDeadline("");
            setProcurementContact("");
        } catch (err) {
            console.error(err);
            setError(`Could not submit the request. Email ${SUPPORT_EMAIL} if the district needs the packet urgently.`);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <form onSubmit={onSubmit} className="rounded-lg border border-[var(--border-default)] bg-white p-6 shadow-[var(--shadow-soft)]">
            <div className="mb-6">
                <p className="eyebrow mb-2">Procurement intake</p>
                <h2 className="font-heading text-2xl font-bold text-[var(--text-primary)]">Request DPA and review materials</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                    Send the district review packet to K12Gig support so privacy, security, billing, and contracting questions land in one tracked queue.
                </p>
            </div>

            {submittedId ? (
                <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                    <p className="font-bold">Request received.</p>
                    <p className="mt-1 leading-6">
                        Reference {submittedId.slice(-8).toUpperCase()}. K12Gig support will review the request and follow up by email.
                    </p>
                </div>
            ) : null}

            {error ? (
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                    {error}
                </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Requester name">
                    <input
                        value={requesterName}
                        onChange={(event) => setRequesterName(event.target.value)}
                        placeholder={suggestedName || "Jordan Smith"}
                        required={!suggestedName}
                        className="field-control"
                    />
                </Field>
                <Field label="Requester email">
                    <input
                        type="email"
                        value={requesterEmail}
                        onChange={(event) => setRequesterEmail(event.target.value)}
                        placeholder={viewer?.email || "procurement@district.org"}
                        required={!viewer?.email}
                        className="field-control"
                    />
                </Field>
                <Field label="Title or role">
                    <input
                        value={requesterTitle}
                        onChange={(event) => setRequesterTitle(event.target.value)}
                        placeholder="Procurement director"
                        className="field-control"
                    />
                </Field>
                <Field label="District state">
                    <select value={state} onChange={(event) => setState(event.target.value)} className="field-control">
                        {STATE_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                </Field>
                <Field label="District or organization" className="sm:col-span-2">
                    <input
                        value={districtName}
                        onChange={(event) => setDistrictName(event.target.value)}
                        placeholder="Austin ISD"
                        required
                        className="field-control"
                    />
                </Field>
                <Field label="Review deadline" hint="Optional">
                    <input
                        type="date"
                        value={deadline}
                        onChange={(event) => setDeadline(event.target.value)}
                        className="field-control"
                    />
                </Field>
                <Field label="Procurement contact" hint="Optional">
                    <input
                        value={procurementContact}
                        onChange={(event) => setProcurementContact(event.target.value)}
                        placeholder="legal@district.org"
                        className="field-control"
                    />
                </Field>
            </div>

            <div className="mt-5">
                <p className="mb-2 text-sm font-bold text-[var(--text-primary)]">Requested materials</p>
                <div className="grid gap-2 sm:grid-cols-2">
                    {PROCUREMENT_MATERIALS.map((material) => (
                        <label
                            key={material.id}
                            className="flex cursor-pointer items-center gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3 text-sm font-semibold text-[var(--text-secondary)]"
                        >
                            <input
                                type="checkbox"
                                checked={materials.includes(material.id)}
                                onChange={() => toggleMaterial(material.id)}
                                className="h-4 w-4 accent-[var(--accent-primary)]"
                            />
                            {material.label}
                        </label>
                    ))}
                </div>
            </div>

            <Field label="Notes for K12Gig support" hint="Optional" className="mt-5">
                <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    rows={4}
                    placeholder="Include required clauses, board deadline, vendor packet links, or district addendum details."
                    className="field-control min-h-28 py-3"
                />
            </Field>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <PrimaryButton type="submit" disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit request"}
                </PrimaryButton>
                <a href={supportMailto("K12Gig DPA and procurement packet request")} className="text-sm font-bold text-[var(--accent-primary)] hover:underline">
                    Email support instead
                </a>
            </div>
        </form>
    );
}

function Field({
    label,
    hint,
    className,
    children,
}: {
    label: string;
    hint?: string;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <label className={className}>
            <span className="mb-1.5 flex items-center justify-between gap-2 text-sm font-bold text-[var(--text-primary)]">
                {label}
                {hint ? <span className="text-xs font-semibold text-[var(--text-tertiary)]">{hint}</span> : null}
            </span>
            {children}
        </label>
    );
}
