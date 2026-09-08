"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { FileText } from "@phosphor-icons/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Sidebar } from "@/components/shared/sidebar";
import { PageHeader } from "@/components/shared/page-header";
import { PrimaryButton } from "@/components/shared/button";
import { Card } from "@/components/shared/card";
import { privateFileMime, uploadPrivateFile } from "@/lib/private-upload";
import { formatOrderStatus } from "@/lib/map-dashboard";

const MAX_BYTES = 10 * 1024 * 1024;
const AGREEMENT_EXTENSIONS = /\.(pdf|docx)$/i;
const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

type EngagementSummary = {
    _id: Id<"engagements">;
    revision?: number;
    archivedForViewer?: boolean;
    partyAccess: boolean;
    orgName: string;
    consultantName: string;
    buyerUserId: Id<"users">;
    educatorUserId: Id<"users">;
    title: string;
    status: "active" | "in_progress" | "completed" | "cancelled";
};

type AgreementVersion = {
    versionId: Id<"agreementVersions">;
    privateFileId: Id<"privateFiles">;
    number: number;
    kind: string;
    parentVersionId?: Id<"agreementVersions">;
    fileName: string;
    uploaderName: string;
    createdAt: number;
    sharedAt?: number;
    coordinationState: "draft" | "shared" | "waiting" | "signed_externally";
    downloadUrl: string;
    isMine: boolean;
};

type Agreement = {
    contractId: Id<"contracts">;
    title: string;
    notes?: string;
    revision: number;
    legacy: boolean;
    currentSharedVersionId?: Id<"agreementVersions">;
    currentVersionState: "none" | "shared" | "waiting" | "signed_externally";
    versions: AgreementVersion[];
    activity: Array<{ eventId: string; action: string; note?: string; versionId?: string; createdAt: number; actorName: string }>;
    allowedActions: { attachFirstVersion: boolean; upload: boolean; share: boolean; signedCopy: boolean; recordSigning: boolean };
};

type SelectedFile = { file: File; selectionId: string };
type DraftOperation = {
    engagementId: Id<"engagements">;
    title: string;
    notes?: string;
    file: File;
    selectionId: string;
    uploadRequestId: string;
    mutationRequestId: string;
    privateFileId?: Id<"privateFiles">;
    createAttempted?: boolean;
};
type VersionSelection = SelectedFile & { kind: "revision" | "signed_copy" | "first"; parent?: Id<"agreementVersions"> };
type VersionOperation = VersionSelection & {
    expectedRevision: number;
    uploadRequestId: string;
    mutationRequestId: string;
    privateFileId?: Id<"privateFiles">;
};

function newRequestId() {
    return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function validateAgreement(file: File) {
    if (!AGREEMENT_EXTENSIONS.test(file.name)) return "Upload a PDF or DOCX agreement.";
    if (file.size > MAX_BYTES) return "Keep the agreement under 10 MB.";
    return null;
}

function messageFrom(error: unknown, fallback: string) {
    const message = error instanceof Error ? error.message : fallback;
    return isStaleError(error) ? `${message} Refresh this agreement before trying again; your selected file is still here.` : message;
}

function isStaleError(error: unknown) {
    return error instanceof Error && /(stale|record changed|refresh.*try again)/i.test(error.message);
}

function viewUrl(version: AgreementVersion) {
    return version.fileName.toLowerCase().endsWith(".pdf")
        ? `${version.downloadUrl}${version.downloadUrl.includes("?") ? "&" : "?"}view=1`
        : version.downloadUrl;
}

async function uploadAgreement(args: {
    file: File;
    uploadRequestId: string;
    engagementId: Id<"engagements">;
    getToken: () => Promise<string | null>;
    requestUpload: (args: {
        purpose: "agreement";
        engagementId: Id<"engagements">;
        fileName: string;
        mimeType: string;
        size: number;
        requestId: string;
    }) => Promise<{ ticketId: Id<"uploadTickets"> }>;
}) {
    const ticket = await args.requestUpload({
        purpose: "agreement",
        engagementId: args.engagementId,
        fileName: args.file.name,
        mimeType: privateFileMime(args.file),
        size: args.file.size,
        requestId: args.uploadRequestId,
    });
    const token = await args.getToken();
    if (!token) throw new Error("Your session expired. Sign in again, then retry this file.");
    return uploadPrivateFile({ file: args.file, ticketId: ticket.ticketId, token });
}

export function ContractHub({ role }: { role: "educator" | "district" }) {
    if (!hasClerk) return <ContractHubView role={role} getToken={async () => null} />;
    return <ContractHubWithClerk role={role} />;
}

function ContractHubWithClerk({ role }: { role: "educator" | "district" }) {
    const { getToken } = useAuth();
    return <ContractHubView role={role} getToken={() => getToken({ template: "convex" })} />;
}

function ContractHubView({ role, getToken }: { role: "educator" | "district"; getToken: () => Promise<string | null> }) {
    const viewer = useQuery(api.users.viewer, {});
    const engagements = useQuery(api.engagements.listMine, viewer ? { includeArchived: true } : "skip") as EngagementSummary[] | undefined;
    const requestUpload = useMutation(api.privateFiles.requestUpload);
    const createDraft = useMutation(api.agreementVersions.createDraft);
    const [selectedEngagement, setSelectedEngagement] = useState("");
    const [title, setTitle] = useState("Consulting agreement");
    const [notes, setNotes] = useState("");
    const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<string | null>(null);
    const [showArchived, setShowArchived] = useState(false);
    const [contextAgreementId, setContextAgreementId] = useState<string | null>(null);
    const [contextVersionId, setContextVersionId] = useState<string | null>(null);
    const [draftRecoveryLocked, setDraftRecoveryLocked] = useState(false);
    const draftOperation = useRef<DraftOperation | null>(null);
    const appliedUrlContext = useRef<string | null>(null);

    const visible = useMemo(
        () => (engagements ?? []).filter((engagement) => !!engagement.archivedForViewer === showArchived),
        [engagements, showArchived]
    );
    const partyEngagements = useMemo(
        () => (engagements ?? []).filter((engagement) => engagement.partyAccess),
        [engagements]
    );

    useEffect(() => {
        if (!engagements) return;
        const contextKey = window.location.search;
        if (appliedUrlContext.current === contextKey) return;
        const params = new URLSearchParams(window.location.search);
        const engagementId = params.get("engagement");
        const contextualEngagement = engagements.find((engagement) => engagement._id === engagementId);
        if (contextualEngagement) {
            setShowArchived(!!contextualEngagement.archivedForViewer);
            if (partyEngagements.some((engagement) => engagement._id === contextualEngagement._id)) setSelectedEngagement(contextualEngagement._id);
        }
        setContextAgreementId(params.get("agreement"));
        setContextVersionId(params.get("version"));
        appliedUrlContext.current = contextKey;
    }, [engagements, partyEngagements]);

    function chooseFile(file: File | null) {
        setError(null);
        setStatus(null);
        if (!file) return setSelectedFile(null);
        const validation = validateAgreement(file);
        if (validation) return setError(validation);
        draftOperation.current = null;
        setSelectedFile({ file, selectionId: newRequestId() });
    }

    async function saveDraft() {
        const recoveryOperation = draftOperation.current?.createAttempted ? draftOperation.current : null;
        if (!recoveryOperation && !selectedEngagement) return setError("Choose an engagement first.");
        if (!recoveryOperation && !selectedFile) return setError("Choose an agreement file first.");
        setBusy(true);
        setError(null);
        setStatus(recoveryOperation ? "Recovering private agreement…" : "Uploading private agreement…");
        const operation = recoveryOperation ?? (() => {
            const fileSelection = selectedFile!;
            const currentInput = {
                engagementId: selectedEngagement as Id<"engagements">,
                title: title.trim() || fileSelection.file.name,
                notes: notes.trim() || undefined,
                file: fileSelection.file,
                selectionId: fileSelection.selectionId,
            };
            const prior = draftOperation.current;
            const sameInput = prior && prior.engagementId === currentInput.engagementId && prior.title === currentInput.title && prior.notes === currentInput.notes && prior.selectionId === currentInput.selectionId;
            return sameInput ? prior : {
                ...currentInput,
                uploadRequestId: newRequestId(),
                mutationRequestId: newRequestId(),
            };
        })();
        draftOperation.current = operation;
        try {
            const privateFileId = operation.privateFileId ?? (await uploadAgreement({
                file: operation.file,
                uploadRequestId: operation.uploadRequestId,
                engagementId: operation.engagementId,
                getToken,
                requestUpload,
            })).privateFileId;
            operation.privateFileId = privateFileId;
            operation.createAttempted = true;
            await createDraft({
                engagementId: operation.engagementId,
                title: operation.title,
                notes: operation.notes,
                privateFileId,
                requestId: operation.mutationRequestId,
            });
            setStatus("Agreement saved privately. Share it only when it is ready for the other party.");
            if (selectedFile?.selectionId === operation.selectionId) setSelectedFile(null);
            draftOperation.current = null;
            setDraftRecoveryLocked(false);
            setNotes("");
        } catch (caught) {
            setStatus(null);
            if (operation.createAttempted) setDraftRecoveryLocked(true);
            setError(messageFrom(caught, "Could not save the agreement."));
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="flex min-h-screen bg-[var(--bg-subtle)] font-sans pt-14 lg:pt-0">
            <Sidebar />
            <main className="min-w-0 flex-1 overflow-y-auto">
                <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-10">
                    <PageHeader title="Contract Hub" description="Keep each accepted gig, agreement version, and next action together." />
                    <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">
                        K12Gig stores working documents. Signing, payment, tax paperwork, and legal enforcement remain between the district and consultant.
                    </p>

                    <Card className="mt-8 flex flex-col gap-4 p-5 sm:p-6">
                        <div>
                            <h2 className="font-heading text-lg font-bold">New agreement</h2>
                            <p className="mt-1 text-sm text-[var(--text-secondary)]">Saving creates a private draft. Sharing is a separate action.</p>
                        </div>
                        {!partyEngagements.length ? (
                            <p className="text-sm text-[var(--text-secondary)]">
                                {role === "educator" ? "Accepted gigs will appear here after a district accepts your proposal." : "Accept a proposal to start coordinating an agreement."}
                            </p>
                        ) : (
                            <>
                                <label className="text-sm font-semibold">Engagement
                                    <select className="field-control mt-1" value={selectedEngagement} disabled={busy || draftRecoveryLocked} onChange={(event) => setSelectedEngagement(event.target.value)}>
                                        <option value="">Select an accepted gig</option>
                                        {partyEngagements.filter((engagement) => !engagement.archivedForViewer).map((engagement) => (
                                            <option key={engagement._id} value={engagement._id}>{engagement.orgName} — {engagement.title}</option>
                                        ))}
                                    </select>
                                </label>
                                <label className="text-sm font-semibold">Agreement title
                                    <input className="field-control mt-1" value={title} disabled={busy || draftRecoveryLocked} onChange={(event) => setTitle(event.target.value)} />
                                </label>
                                <label className="text-sm font-semibold">Notes
                                    <textarea className="field-control mt-1 min-h-20" value={notes} disabled={busy || draftRecoveryLocked} onChange={(event) => setNotes(event.target.value)} />
                                </label>
                                <label className="text-sm font-semibold">Agreement file
                                    <input type="file" accept=".pdf,.docx" className="mt-2 block max-w-full text-sm" disabled={busy || draftRecoveryLocked} onChange={(event) => chooseFile(event.target.files?.[0] ?? null)} />
                                </label>
                                <p className="text-xs text-[var(--text-tertiary)]">PDF or DOCX, up to 10 MB. The original stays preserved in version history.</p>
                                {selectedFile && <p className="break-all text-sm font-semibold">{selectedFile.file.name}</p>}
                                <div className="flex flex-wrap gap-3">
                                    <PrimaryButton type="button" disabled={busy || !selectedFile} onClick={() => void saveDraft()}>Save private draft</PrimaryButton>
                                    {error && selectedFile && <button type="button" disabled={busy} onClick={() => void saveDraft()} className="rounded-lg border border-[var(--border-strong)] px-4 py-2 text-sm font-bold">{draftRecoveryLocked ? "Retry unchanged save" : "Retry upload"}</button>}
                                </div>
                                {error && <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>}
                                {draftRecoveryLocked && <p className="text-xs text-[var(--text-secondary)]">The create response was uncertain. Retry the unchanged save to recover its committed result before starting different agreement details.</p>}
                                {status && <p role="status" aria-live="polite" className="text-sm font-semibold text-[var(--accent-primary)]">{status}</p>}
                            </>
                        )}
                    </Card>

                    <div className="mt-8 flex gap-2" aria-label="Engagement archive filter">
                        <button type="button" aria-pressed={!showArchived} onClick={() => setShowArchived(false)} className="rounded-lg border border-[var(--border-strong)] px-3 py-2 text-sm font-bold">Active</button>
                        <button type="button" aria-pressed={showArchived} onClick={() => setShowArchived(true)} className="rounded-lg border border-[var(--border-strong)] px-3 py-2 text-sm font-bold">Archived</button>
                    </div>

                    <div className="mt-4 flex flex-col gap-6">
                        {engagements === undefined ? <p>Loading engagements…</p> : visible.length === 0 ? (
                            <Card className="p-10 text-center"><FileText className="mx-auto mb-3 h-8 w-8 text-[var(--text-tertiary)]" /><p className="font-bold">No {showArchived ? "archived" : "active"} engagements</p></Card>
                        ) : visible.map((engagement) => <EngagementGroup key={engagement._id} engagement={engagement} getToken={getToken} contextAgreementId={contextAgreementId} contextVersionId={contextVersionId} />)}
                    </div>

                    <Link href={role === "educator" ? "/dashboard/educator/my-gigs" : "/dashboard/district"} className="mt-8 inline-flex min-h-10 items-center rounded-lg bg-[var(--accent-primary)] px-4 py-2.5 text-sm font-bold text-white">Back to gigs</Link>
                </div>
            </main>
        </div>
    );
}

function EngagementGroup({ engagement, getToken, contextAgreementId, contextVersionId }: { engagement: EngagementSummary; getToken: () => Promise<string | null>; contextAgreementId: string | null; contextVersionId: string | null }) {
    const isParty = engagement.partyAccess;
    const agreements = useQuery(api.agreementVersions.listForEngagement, isParty ? { engagementId: engagement._id } : "skip") as Agreement[] | undefined;
    const nextAction = engagement.status === "active" ? "Coordinate the agreement, then start work." : engagement.status === "in_progress" ? "Keep versions current, then record work complete." : engagement.status === "cancelled" ? "Review the history or reopen the need as a correction." : "Review, download, or archive this completed engagement.";
    return (
        <section id={`engagement-${engagement._id}`} className="min-w-0 scroll-mt-6 rounded-xl border border-[var(--border-default)] bg-white p-4 sm:p-6" aria-labelledby={`engagement-${engagement._id}-heading`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)]">{formatOrderStatus(engagement.status).text}</p>
                    <h2 id={`engagement-${engagement._id}-heading`} className="break-words font-heading text-xl font-bold">{engagement.title}</h2>
                    <p className="text-sm text-[var(--text-secondary)]">{engagement.orgName} · {engagement.consultantName}</p>
                </div>
                <Link href={`/dashboard/engagements/${engagement._id}`} className="text-sm font-bold text-[var(--accent-primary)]">Open engagement</Link>
            </div>
            <p className="mt-3 rounded-lg bg-[var(--bg-subtle)] px-3 py-2 text-sm"><strong>Next action:</strong> {nextAction}</p>
            <div className="mt-4 flex flex-col gap-4">
                {!isParty ? <p className="text-sm text-[var(--text-secondary)]">Administrative engagement summary only. Private files and party actions are available only to the district and consultant on this engagement.</p> : agreements === undefined ? <p className="text-sm text-[var(--text-secondary)]">Loading agreements…</p> : agreements.length === 0 ? <p className="text-sm text-[var(--text-secondary)]">No agreement is visible to you yet.</p> : agreements.map((agreement) => <AgreementCard key={agreement.contractId} engagementId={engagement._id} agreement={agreement} getToken={getToken} contextVersionId={agreement.contractId === contextAgreementId ? contextVersionId : null} focused={agreement.contractId === contextAgreementId} />)}
            </div>
        </section>
    );
}

function AgreementCard({ engagementId, agreement, getToken, focused, contextVersionId }: { engagementId: Id<"engagements">; agreement: Agreement; getToken: () => Promise<string | null>; focused: boolean; contextVersionId: string | null }) {
    const requestUpload = useMutation(api.privateFiles.requestUpload);
    const attachFirstVersion = useMutation(api.agreementVersions.attachFirstVersion);
    const saveVersion = useMutation(api.agreementVersions.saveVersion);
    const share = useMutation(api.agreementVersions.share);
    const recordSigning = useMutation(api.agreementVersions.recordSigning);
    const [upload, setUpload] = useState<VersionSelection | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<string | null>(null);
    const [signingNote, setSigningNote] = useState("");
    const [acknowledged, setAcknowledged] = useState(false);
    const versionOperation = useRef<VersionOperation | null>(null);
    const shareOperations = useRef<Record<string, { contractId: Id<"contracts">; versionId: Id<"agreementVersions">; expectedRevision: number; requestId: string }>>({});
    const signingOperations = useRef<Record<string, { contractId: Id<"contracts">; versionId: Id<"agreementVersions">; expectedRevision: number; requestId: string; state: "waiting" | "signed_externally"; note: string; acknowledged: true }>>({});
    const currentShared = agreement.versions.find((version) => version.versionId === agreement.currentSharedVersionId);
    const latestMine = agreement.versions.find((version) => version.isMine);
    const articleRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!focused) return;
        const target = contextVersionId ? document.getElementById(`agreement-version-${contextVersionId}`) : articleRef.current;
        target?.scrollIntoView({ block: "center" });
    }, [contextVersionId, focused]);
    function selectVersionFile(file: File | null, kind: "revision" | "signed_copy" | "first", parent?: Id<"agreementVersions">) {
        setError(null); setStatus(null);
        if (!file) return setUpload(null);
        const validation = validateAgreement(file);
        if (validation) return setError(validation);
        versionOperation.current = null;
        setUpload({ file, selectionId: newRequestId(), kind, parent });
    }

    async function saveSelectedVersion(refreshRevision = false) {
        if (!upload) return;
        setBusy(true); setError(null); setStatus("Uploading private version…");
        const prior = versionOperation.current;
        const sameInput = prior && prior.selectionId === upload.selectionId && prior.kind === upload.kind && prior.parent === upload.parent;
        const operation: VersionOperation = !refreshRevision && sameInput ? prior : {
            ...upload,
            expectedRevision: agreement.revision,
            uploadRequestId: newRequestId(),
            mutationRequestId: newRequestId(),
            ...(refreshRevision && sameInput && prior.privateFileId ? { privateFileId: prior.privateFileId } : {}),
        };
        versionOperation.current = operation;
        try {
            const privateFileId = operation.privateFileId ?? (await uploadAgreement({ file: operation.file, uploadRequestId: operation.uploadRequestId, engagementId, getToken, requestUpload })).privateFileId;
            operation.privateFileId = privateFileId;
            if (operation.kind === "first") {
                await attachFirstVersion({ contractId: agreement.contractId, privateFileId, expectedRevision: operation.expectedRevision, requestId: operation.mutationRequestId });
            } else if (operation.parent) {
                await saveVersion({ contractId: agreement.contractId, privateFileId, kind: operation.kind, parentVersionId: operation.parent, expectedRevision: operation.expectedRevision, requestId: operation.mutationRequestId });
            }
            setStatus(operation.kind === "signed_copy" ? "Signed copy saved privately. It does not mark signing or work complete." : "Version saved privately. Share it when it is ready.");
            if (upload.selectionId === operation.selectionId) setUpload(null);
            versionOperation.current = null;
        } catch (caught) { setStatus(null); setError(messageFrom(caught, "Could not save this version.")); }
        finally { setBusy(false); }
    }

    async function shareVersion(version: AgreementVersion) {
        setBusy(true); setError(null);
        const key = `share:${version.versionId}`;
        const operation = shareOperations.current[key] ?? (shareOperations.current[key] = { contractId: agreement.contractId, versionId: version.versionId, expectedRevision: agreement.revision, requestId: newRequestId() });
        try {
            await share(operation);
            delete shareOperations.current[key];
            setStatus(`Version ${version.number} shared with the other party.`);
        } catch (caught) {
            if (isStaleError(caught)) delete shareOperations.current[key];
            setError(messageFrom(caught, "Could not share this version."));
        }
        finally { setBusy(false); }
    }

    async function signing(state: "waiting" | "signed_externally") {
        if (!currentShared || !signingNote.trim() || !acknowledged) return setError("Add a note and confirm the acknowledgement first.");
        setBusy(true); setError(null);
        const key = JSON.stringify([currentShared.versionId, state, signingNote.trim(), true]);
        const operation = signingOperations.current[key] ?? (signingOperations.current[key] = { contractId: agreement.contractId, versionId: currentShared.versionId, expectedRevision: agreement.revision, requestId: newRequestId(), state, note: signingNote.trim(), acknowledged: true });
        try {
            await recordSigning(operation);
            delete signingOperations.current[key];
            setStatus(state === "waiting" ? "Waiting for off-platform signing recorded. Work status is unchanged." : "External signing recorded for this version. Work status is unchanged.");
            setSigningNote(""); setAcknowledged(false);
        } catch (caught) {
            if (isStaleError(caught)) delete signingOperations.current[key];
            setError(messageFrom(caught, "Could not record signing coordination."));
        }
        finally { setBusy(false); }
    }

    const stateLabel = agreement.currentVersionState === "none" ? "Private draft only" : agreement.currentVersionState === "shared" ? "Shared · signing not recorded" : agreement.currentVersionState === "waiting" ? "Waiting for off-platform signing" : "Signed off-platform";
    return (
        <article ref={articleRef} className={`min-w-0 scroll-mt-6 rounded-lg border p-4 ${focused ? "border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/20" : "border-[var(--border-subtle)]"}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0"><h3 className="break-words font-heading text-lg font-bold">{agreement.title}</h3>{agreement.notes && <p className="mt-1 text-sm text-[var(--text-secondary)]">{agreement.notes}</p>}</div>
                <span className="rounded-md bg-[var(--bg-subtle)] px-2 py-1 text-xs font-bold uppercase tracking-wide">{stateLabel}</span>
            </div>
            {agreement.legacy && <p className="mt-3 text-sm text-amber-800">{agreement.allowedActions.attachFirstVersion ? "This text-only legacy agreement can receive its first private version without replacing its identity." : "This legacy agreement has prior content that requires guarded migration before a new version can be attached."}</p>}
            <div className="mt-4 flex flex-col gap-3">
                {agreement.versions.map((version) => (
                    <div id={`agreement-version-${version.versionId}`} key={version.versionId} className={`min-w-0 scroll-mt-6 rounded-lg p-3 ${contextVersionId === version.versionId ? "bg-[var(--accent-primary)]/10 ring-2 ring-[var(--accent-primary)]/20" : "bg-[var(--bg-subtle)]"}`}>
                        <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0"><p className="break-all text-sm font-bold">Version {version.number} · {version.fileName}</p><p className="text-xs text-[var(--text-tertiary)]">{version.uploaderName} · {new Date(version.createdAt).toLocaleDateString()} · {version.coordinationState === "draft" ? "Private" : version.coordinationState.replace("_", " ")}</p><p className="mt-1 text-xs font-bold text-[var(--text-secondary)]">{version.versionId === currentShared?.versionId ? "Current shared version" : version.versionId === latestMine?.versionId && version.coordinationState === "draft" ? "Latest private draft" : "Earlier version"}</p></div>
                            <div className="flex flex-wrap gap-3 text-sm font-bold">
                                <a href={viewUrl(version)} target="_blank" rel="noreferrer" className="text-[var(--accent-primary)]">{version.fileName.toLowerCase().endsWith(".pdf") ? "View" : "Download to view"}</a>
                                <a href={version.downloadUrl} className="text-[var(--accent-primary)]">Download</a>
                                {agreement.allowedActions.share && version.versionId === latestMine?.versionId && version.isMine && version.coordinationState === "draft" && <button type="button" disabled={busy} onClick={() => void shareVersion(version)} className="text-[var(--accent-primary)]">Share version {version.number}</button>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <Link href={`/dashboard/engagements/${engagementId}?agreement=${agreement.contractId}${currentShared ? `&version=${currentShared.versionId}` : latestMine ? `&version=${latestMine.versionId}` : ""}`} className="mt-3 inline-flex text-sm font-bold text-[var(--accent-primary)]">Open agreement in engagement</Link>

            {agreement.allowedActions.attachFirstVersion && <UploadChoice label="Attach first agreement file" disabled={busy} onFile={(file) => selectVersionFile(file, "first")} />}
            {agreement.allowedActions.upload && latestMine && <UploadChoice label="Upload a revision" disabled={busy} onFile={(file) => selectVersionFile(file, "revision", latestMine.versionId)} />}
            {agreement.allowedActions.signedCopy && currentShared && <UploadChoice label="Return a signed copy" disabled={busy} onFile={(file) => selectVersionFile(file, "signed_copy", currentShared.versionId)} />}
            {upload && <div className="mt-3 flex min-w-0 flex-wrap items-center gap-3"><span className="max-w-full break-all text-sm font-semibold">{upload.file.name}</span><PrimaryButton type="button" disabled={busy} onClick={() => void saveSelectedVersion()}>{upload.kind === "signed_copy" ? "Save signed copy privately" : "Save private version"}</PrimaryButton>{error && <button type="button" disabled={busy} onClick={() => void saveSelectedVersion(isStaleError(new Error(error)))} className="text-sm font-bold text-[var(--accent-primary)]">{isStaleError(new Error(error)) ? "Retry with latest revision" : "Retry upload"}</button>}</div>}

            {agreement.allowedActions.recordSigning && currentShared && agreement.currentVersionState !== "signed_externally" && <div className="mt-4 rounded-lg border border-[var(--border-subtle)] p-3"><label className="text-sm font-semibold">Signing coordination note<input className="field-control mt-1" value={signingNote} onChange={(event) => setSigningNote(event.target.value)} placeholder="Where and when signing happened" /></label><label className="mt-2 flex items-start gap-2 text-sm"><input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} /><span>I understand this records off-platform coordination for the current shared version and does not complete the work.</span></label><div className="mt-3 flex flex-wrap gap-3">{currentShared.isMine && agreement.currentVersionState === "shared" && <button type="button" disabled={busy} onClick={() => void signing("waiting")} className="rounded-lg border border-[var(--border-strong)] px-3 py-2 text-sm font-bold">Record waiting for signature</button>}<button type="button" disabled={busy} onClick={() => void signing("signed_externally")} className="rounded-lg border border-[var(--border-strong)] px-3 py-2 text-sm font-bold">Record signed off-platform</button></div></div>}

            {agreement.activity.length > 0 && <details className="mt-4"><summary className="cursor-pointer text-sm font-bold">Agreement activity</summary><ol className="mt-2 space-y-2 text-sm text-[var(--text-secondary)]">{agreement.activity.map((event) => <li key={event.eventId}><strong>{event.actorName}</strong> · {event.action.replaceAll("_", " ")} · {new Date(event.createdAt).toLocaleString()}{event.note ? ` — ${event.note}` : ""}</li>)}</ol></details>}
            {error && <p role="alert" className="mt-3 text-sm font-semibold text-red-700">{error}</p>}
            {status && <p role="status" aria-live="polite" className="mt-3 text-sm font-semibold text-[var(--accent-primary)]">{status}</p>}
        </article>
    );
}

function UploadChoice({ label, disabled, onFile }: { label: string; disabled: boolean; onFile: (file: File | null) => void }) {
    return <label className="mt-3 block text-sm font-bold text-[var(--accent-primary)]">{label}<input type="file" accept=".pdf,.docx" disabled={disabled} className="mt-1 block max-w-full text-sm font-normal text-[var(--text-primary)]" onChange={(event) => onFile(event.target.files?.[0] ?? null)} /></label>;
}
