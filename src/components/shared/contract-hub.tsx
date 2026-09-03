"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Sidebar } from "@/components/shared/sidebar";
import { PageHeader } from "@/components/shared/page-header";
import { PrimaryButton } from "@/components/shared/button";
import { Card } from "@/components/shared/card";
import { FileText } from "@phosphor-icons/react";

const STATUSES = [
    { id: "draft", label: "Draft" },
    { id: "sent", label: "Sent for signature" },
    { id: "signed_externally", label: "Signed off-platform" },
    { id: "completed", label: "Complete" },
] as const;

export function ContractHub({ role }: { role: "educator" | "district" }) {
    const viewer = useQuery(api.users.viewer, {});
    const engagements = useQuery(api.engagements.listMine, viewer ? {} : "skip");
    const contracts = useQuery(api.contracts.listMine, viewer ? {} : "skip");
    const generateUploadUrl = useMutation(api.contracts.generateUploadUrl);
    const createContract = useMutation(api.contracts.create);
    const updateStatus = useMutation(api.contracts.updateStatus);
    const [selectedEngagement, setSelectedEngagement] = useState<string>("");
    const [title, setTitle] = useState("Consulting agreement");
    const [notes, setNotes] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fileUrlById, setFileUrlById] = useState<Record<string, string>>({});

    const fileUrlQueryId = Object.keys(fileUrlById)[0] as Id<"contracts"> | undefined;
    const fetchedUrl = useQuery(
        api.contracts.getFileUrl,
        fileUrlQueryId ? { contractId: fileUrlQueryId } : "skip"
    );

    async function handleUpload(file: File) {
        if (!selectedEngagement) {
            setError("Choose an engagement first.");
            return;
        }
        setBusy(true);
        setError(null);
        try {
            const uploadUrl = await generateUploadUrl({ engagementId: selectedEngagement as Id<"engagements"> });
            const result = await fetch(uploadUrl, {
                method: "POST",
                headers: { "Content-Type": file.type || "application/octet-stream" },
                body: file,
            });
            const json = (await result.json()) as { storageId: Id<"_storage"> };
            await createContract({
                engagementId: selectedEngagement as Id<"engagements">,
                title: title.trim() || file.name,
                notes: notes.trim() || undefined,
                storageId: json.storageId,
                fileName: file.name,
                status: "draft",
            });
            setNotes("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not upload the contract.");
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="flex h-screen bg-[var(--bg-subtle)] font-sans pt-14 lg:pt-0">
            <Sidebar />
            <main className="flex-1 overflow-y-auto w-full">
                <div className="max-w-5xl mx-auto px-6 lg:px-10 py-10">
                    <PageHeader
                        title="Contract Hub"
                        description="Upload and track agreements for accepted gigs. Signatures and payment stay between the district and consultant."
                    />
                    <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">
                        K12Gig does not process payments, issue 1099s, or capture legally binding signatures. Use this hub to keep the working documents in one place.
                    </p>

                    <Card className="mt-8 p-6 flex flex-col gap-4">
                        <h2 className="font-heading text-lg font-bold">Add a document</h2>
                        {(!engagements || engagements.length === 0) ? (
                            <p className="text-sm text-[var(--text-secondary)]">
                                {role === "educator"
                                    ? "Accepted gigs will appear here after a district accepts your proposal."
                                    : "Accept a proposal to start coordinating a contract."}
                            </p>
                        ) : (
                            <>
                                <label className="text-sm font-semibold">
                                    Engagement
                                    <select
                                        className="field-control mt-1"
                                        value={selectedEngagement}
                                        onChange={(event) => setSelectedEngagement(event.target.value)}
                                    >
                                        <option value="">Select an accepted gig</option>
                                        {engagements.map((engagement) => (
                                            <option key={engagement._id} value={engagement._id}>
                                                {engagement.orgName} — {engagement.title}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="text-sm font-semibold">
                                    Title
                                    <input className="field-control mt-1" value={title} onChange={(event) => setTitle(event.target.value)} />
                                </label>
                                <label className="text-sm font-semibold">
                                    Notes
                                    <textarea className="field-control mt-1 min-h-24" value={notes} onChange={(event) => setNotes(event.target.value)} />
                                </label>
                                <label className="text-sm font-semibold">
                                    File
                                    <input
                                        type="file"
                                        className="mt-2 block"
                                        disabled={busy}
                                        onChange={(event) => {
                                            const file = event.target.files?.[0];
                                            event.target.value = "";
                                            if (file) void handleUpload(file);
                                        }}
                                    />
                                </label>
                                {error && <p className="text-sm text-red-600">{error}</p>}
                            </>
                        )}
                    </Card>

                    <div className="mt-8 flex flex-col gap-4">
                        {contracts === undefined ? (
                            <p className="text-[var(--text-secondary)]">Loading contracts…</p>
                        ) : contracts.length === 0 ? (
                            <Card className="p-10 text-center">
                                <FileText className="mx-auto mb-3 h-8 w-8 text-[var(--text-tertiary)]" />
                                <p className="font-bold">No contract documents yet</p>
                            </Card>
                        ) : (
                            contracts.map((item) => (
                                <Card key={item.contract._id} className="p-5 flex flex-col gap-3">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <h3 className="font-heading text-lg font-bold">{item.contract.title}</h3>
                                            <p className="text-sm text-[var(--text-secondary)]">
                                                {item.orgName} · {item.consultantName}
                                            </p>
                                        </div>
                                        <span className="text-xs font-bold uppercase tracking-widest rounded-md bg-[var(--bg-subtle)] px-2 py-1">
                                            {STATUSES.find((status) => status.id === item.contract.status)?.label ?? item.contract.status}
                                        </span>
                                    </div>
                                    {item.contract.notes && <p className="text-sm text-[var(--text-secondary)]">{item.contract.notes}</p>}
                                    <div className="flex flex-wrap gap-3 text-sm">
                                        <Link href={`/dashboard/engagements/${item.engagementId}`} className="font-bold text-[var(--accent-primary)]">
                                            View gig
                                        </Link>
                                        {item.contract.hasFile && (
                                            <button
                                                type="button"
                                                className="font-bold text-[var(--accent-primary)]"
                                                onClick={() => setFileUrlById({ [item.contract._id]: "" })}
                                            >
                                                {fetchedUrl && fileUrlQueryId === item.contract._id ? (
                                                    <a href={fetchedUrl} target="_blank" rel="noreferrer">Open file</a>
                                                ) : (
                                                    "Load file"
                                                )}
                                            </button>
                                        )}
                                        {STATUSES.map((status) => (
                                            <button
                                                key={status.id}
                                                type="button"
                                                className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                                                onClick={() => void updateStatus({ contractId: item.contract._id, status: status.id })}
                                            >
                                                Mark {status.label.toLowerCase()}
                                            </button>
                                        ))}
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                    <div className="mt-8">
                        <Link href={role === "educator" ? "/dashboard/educator/my-gigs" : "/dashboard/district"}>
                            <PrimaryButton>Back to gigs</PrimaryButton>
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
