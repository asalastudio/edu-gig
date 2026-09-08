"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Sidebar } from "@/components/shared/sidebar";
import { PageHeader } from "@/components/shared/page-header";
import { PrimaryButton } from "@/components/shared/button";
import { Card } from "@/components/shared/card";
import { ArrowLeft } from "@phosphor-icons/react";
import { getAreaOfNeedLabel } from "@/lib/taxonomy";
import { formatAgreedRate, formatOrderStatus } from "@/lib/map-dashboard";
import { isDistrictRole } from "@/lib/roles";
import { cn } from "@/lib/utils";

export default function EngagementDetailPage() {
    const params = useParams<{ engagementId: string }>();
    const engagementId = params.engagementId as Id<"engagements">;
    const viewer = useQuery(api.users.viewer, {});
    const detail = useQuery(api.engagements.getById, viewer ? { engagementId } : "skip");
    const transition = useMutation(api.engagements.transition);
    const retryDelivery = useMutation(api.delivery.retry);
    const activity = useQuery(api.engagements.activity, detail ? { engagementId } : "skip");
    const deliveries = useQuery(api.delivery.listForEngagement, detail ? { engagementId } : "skip");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [pendingAction, setPendingAction] = useState<"cancel" | "reopen_need" | null>(null);
    const [reason, setReason] = useState("");
    const [acknowledged, setAcknowledged] = useState(false);
    const transitionRequestIds = useRef<Record<string, string>>({});
    const isDistrict = !!viewer && isDistrictRole(viewer.role);
    const backHref = isDistrict ? "/dashboard/district" : "/dashboard/educator/my-gigs";
    const contractHref = `${isDistrict ? "/dashboard/district/contract-hub" : "/dashboard/educator/contract-hub"}?engagement=${engagementId}`;

    async function runTransition(action: "start" | "complete" | "cancel" | "reopen_need" | "archive") {
        if (!detail) return;
        setBusy(true); setError(null); setStatusMessage(null);
        try {
            const key = `${action}:${reason.trim()}`;
            const stableRequestId = transitionRequestIds.current[key] ?? (transitionRequestIds.current[key] = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);
            await transition({
                engagementId,
                action,
                expectedRevision: detail.engagement.revision ?? 0,
                requestId: stableRequestId,
                reason: action === "cancel" || action === "reopen_need" ? reason.trim() : undefined,
                acknowledged: action === "cancel" || action === "reopen_need" ? acknowledged : undefined,
            });
            delete transitionRequestIds.current[key];
            setStatusMessage(action === "complete" ? "Work marked complete. Agreement signing status is unchanged." : action === "archive" ? "Archived for your account. It remains available from the Contract Hub archive." : `Engagement updated: ${action.replaceAll("_", " ")}.`);
            setPendingAction(null); setReason(""); setAcknowledged(false);
        } catch (caught) {
            const message = caught instanceof Error ? caught.message : "Could not update this engagement.";
            setError(/stale/i.test(message) ? `${message} Refresh the engagement before retrying.` : message);
        } finally { setBusy(false); }
    }

    async function retryDeliveryJob(outboxId: Id<"deliveryOutbox">) {
        setBusy(true); setError(null); setStatusMessage(null);
        try {
            await retryDelivery({ outboxId });
            setStatusMessage("Delivery retry queued. Check this history again for the resulting state.");
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Could not retry this delivery.");
        } finally { setBusy(false); }
    }

    return (
        <div className="flex h-screen bg-[var(--bg-subtle)] font-sans pt-14 lg:pt-0">
            <Sidebar />
            <main className="flex-1 overflow-y-auto w-full">
                <div className="max-w-4xl mx-auto px-6 lg:px-10 py-10">
                    <Link href={backHref} className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--accent-primary)] mb-8">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </Link>
                    {detail === undefined ? (
                        <p className="text-[var(--text-secondary)]">Loading engagement…</p>
                    ) : detail === null ? (
                        <p className="text-[var(--text-secondary)]">Engagement not found.</p>
                    ) : (
                        <>
                            <PageHeader
                                title={getAreaOfNeedLabel(detail.engagement.areaOfNeed)}
                                description={`${detail.engagement.orgName} · ${detail.engagement.consultantName}`}
                            />
                            <div className="mt-8 grid gap-6">
                                <Card className="p-6 flex flex-col gap-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <h2 className="font-heading text-xl font-bold">Engagement details</h2>
                                        <span className={cn(
                                            "text-xs font-bold uppercase tracking-widest px-2 py-1 rounded-md",
                                            formatOrderStatus(detail.engagement.status).color === "emerald"
                                                ? "bg-emerald-50 text-emerald-700"
                                                : "bg-blue-50 text-blue-700"
                                        )}>
                                            {formatOrderStatus(detail.engagement.status).text}
                                        </span>
                                    </div>
                                    <p className="text-sm text-[var(--text-secondary)]">
                                        Agreed rate: {formatAgreedRate(detail.engagement.agreedRate, detail.engagement.agreedRateUnit)}
                                    </p>
                                    {detail.engagement.startDate && (
                                        <p className="text-sm text-[var(--text-secondary)]">Start: {detail.engagement.startDate}</p>
                                    )}
                                    {detail.engagement.compensationNotes && (
                                        <p className="text-sm text-[var(--text-secondary)]">{detail.engagement.compensationNotes}</p>
                                    )}
                                    {detail.needDescription && (
                                        <p className="text-sm leading-6 text-[var(--text-secondary)] whitespace-pre-wrap">{detail.needDescription}</p>
                                    )}
                                    {detail.proposalMessage && (
                                        <div className="rounded-md bg-[var(--bg-subtle)] p-4">
                                            <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-2">Accepted proposal</p>
                                            <p className="text-sm whitespace-pre-wrap">{detail.proposalMessage}</p>
                                        </div>
                                    )}
                                    <p className="text-sm text-[var(--text-secondary)]">
                                        Payment is arranged directly between the district and consultant. K12Gig coordinates the introduction, proposal, and contract documents.
                                    </p>
                                    <div className="flex flex-wrap gap-3">
                                        <Link href={`/dashboard/messages?to=${detail.counterpartUserId}&name=${encodeURIComponent(detail.counterpartName)}&engagement=${engagementId}&need=${detail.engagement.needId}`} className="inline-flex min-h-10 items-center rounded-lg bg-[var(--accent-primary)] px-4 py-2.5 text-sm font-bold text-white">Message {detail.counterpartName}</Link>
                                        <Link href={contractHref} className="inline-flex items-center px-4 py-2 rounded-md border border-[var(--border-strong)] text-sm font-bold">
                                            Open Contract Hub
                                        </Link>
                                    </div>
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {isDistrict && detail.engagement.status === "active" && (
                                            <button
                                                type="button"
                                                className="text-xs font-bold uppercase tracking-wider text-[var(--accent-primary)]"
                                                disabled={busy}
                                                onClick={() => void runTransition("start")}
                                            >
                                                Mark in progress
                                            </button>
                                        )}
                                        {isDistrict && detail.engagement.status === "in_progress" && (
                                            <button
                                                type="button"
                                                className="text-xs font-bold uppercase tracking-wider text-emerald-700"
                                                disabled={busy}
                                                onClick={() => void runTransition("complete")}
                                            >
                                                Mark complete
                                            </button>
                                        )}
                                        {(detail.engagement.status === "active" || detail.engagement.status === "in_progress") && <button type="button" disabled={busy} className="text-xs font-bold uppercase tracking-wider text-red-700" onClick={() => setPendingAction("cancel")}>Cancel engagement</button>}
                                        {isDistrict && detail.engagement.status === "cancelled" && <button type="button" disabled={busy} className="text-xs font-bold uppercase tracking-wider text-[var(--accent-primary)]" onClick={() => setPendingAction("reopen_need")}>Reopen need as correction</button>}
                                        {(detail.engagement.status === "completed" || detail.engagement.status === "cancelled") && !detail.engagement.archivedForViewer && <button type="button" disabled={busy} className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]" onClick={() => void runTransition("archive")}>Archive</button>}
                                    </div>
                                    {pendingAction && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4"><h3 className="font-bold">{pendingAction === "cancel" ? "Cancel this engagement?" : "Reopen this need as a correction?"}</h3><p className="mt-1 text-sm">{pendingAction === "cancel" ? "Cancellation records the work-state correction. It does not void or terminate any external agreement." : "The canceled engagement and rejected proposals remain in history. The need will accept a replacement proposal."}</p><label className="mt-3 block text-sm font-semibold">Reason<textarea className="field-control mt-1 min-h-20" value={reason} onChange={(event) => setReason(event.target.value)} /></label><label className="mt-3 flex items-start gap-2 text-sm"><input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} /><span>{pendingAction === "cancel" ? "I understand external agreements are not voided." : "I understand this preserves the prior engagement and proposal history."}</span></label><div className="mt-3 flex flex-wrap gap-3"><PrimaryButton type="button" disabled={busy || !reason.trim() || !acknowledged} onClick={() => void runTransition(pendingAction)}>Confirm {pendingAction === "cancel" ? "cancellation" : "correction"}</PrimaryButton><button type="button" disabled={busy} onClick={() => { setPendingAction(null); setReason(""); setAcknowledged(false); }} className="rounded-lg border border-[var(--border-strong)] px-4 py-2 text-sm font-bold">Back</button></div></div>}
                                    {error && <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>}
                                    {statusMessage && <p role="status" aria-live="polite" className="text-sm font-semibold text-[var(--accent-primary)]">{statusMessage}</p>}
                                </Card>
                                <Card className="p-6">
                                    <h2 className="font-heading text-xl font-bold">Engagement history</h2>
                                    {activity === undefined ? <p className="mt-3 text-sm text-[var(--text-secondary)]">Loading history…</p> : activity.length === 0 ? <p className="mt-3 text-sm text-[var(--text-secondary)]">No recorded work transitions yet.</p> : <ol className="mt-4 space-y-3">{activity.map((event) => <li key={event._id} className="text-sm"><strong>{event.action.replaceAll("_", " ")}</strong> · {new Date(event.createdAt).toLocaleString()}{event.note ? ` — ${event.note}` : ""}</li>)}</ol>}
                                </Card>
                                <Card className="p-6">
                                    <h2 className="font-heading text-xl font-bold">Delivery history</h2>
                                    <p className="mt-1 text-sm text-[var(--text-secondary)]">Email states report system handling only. Provider accepted does not mean confirmed delivered.</p>
                                    {deliveries === undefined ? <p className="mt-3 text-sm">Loading delivery history…</p> : deliveries.length === 0 ? <p className="mt-3 text-sm text-[var(--text-secondary)]">No delivery records for this engagement yet.</p> : <ul className="mt-4 space-y-3">{deliveries.map((delivery) => {
                                        const firstAttemptAt = delivery.history.find((attempt) => attempt.state === "sending")?.createdAt ?? delivery.createdAt;
                                        const withinRetryWindow = delivery.attempts === 0 || Date.now() - firstAttemptAt < 23 * 60 * 60_000;
                                        const retryable = delivery.state === "failed" && delivery.attempts < 3 && withinRetryWindow;
                                        return <li key={delivery.outboxId} className="rounded-lg bg-[var(--bg-subtle)] p-3 text-sm"><div className="flex flex-wrap justify-between gap-2"><strong>{delivery.title}</strong><span className="font-bold">{delivery.state === "provider_accepted" ? "Provider accepted" : delivery.state === "captured" ? "Captured in staging" : delivery.state.replaceAll("_", " ")}</span></div>{delivery.lastError && <p className="mt-1 text-red-700">{delivery.lastError}</p>}{retryable ? <button type="button" disabled={busy} className="mt-2 font-bold text-[var(--accent-primary)]" onClick={() => void retryDeliveryJob(delivery.outboxId)}>Retry delivery</button> : null}{delivery.state === "failed" && !retryable ? <p className="mt-2 font-semibold text-amber-800">Automatic retries are exhausted or the provider uncertainty window elapsed. Reconcile this delivery manually with the other party.</p> : null}</li>;
                                    })}</ul>}
                                </Card>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
