"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { AdminNotes } from "@/components/admin/admin-notes";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    adminEmptyState,
    availabilityStatusLabel,
    availabilityStatusTone,
    verificationStatusLabel,
    verificationStatusTone,
} from "@/lib/map-admin";

const verificationOptions = [
    { value: "unverified", label: "Unverified" },
    { value: "pending", label: "Pending review" },
    { value: "verified", label: "Verified" },
    { value: "premier", label: "Premier" },
] as const;

type VerificationStatus = (typeof verificationOptions)[number]["value"];

export default function AdminVerificationPage() {
    const viewer = useQuery(api.users.viewer, {});
    const [query, setQuery] = useState("");
    const queue = useQuery(api.admin.listVerificationQueue, viewer?.role === "superadmin" ? { query } : "skip");
    const updateVerification = useMutation(api.admin.updateEducatorVerification);
    const [savingId, setSavingId] = useState<Id<"educators"> | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function handleVerificationChange(educatorId: Id<"educators">, status: VerificationStatus) {
        setSavingId(educatorId);
        setError(null);
        try {
            await updateVerification({ educatorId, status });
        } catch (err) {
            console.error(err);
            setError("Could not update educator verification.");
        } finally {
            setSavingId(null);
        }
    }

    return (
        <AdminShell title="Verification" description="Review educator verification status and credential evidence before approving trust markers.">
            <Card className="border-[var(--border-subtle)] shadow-[var(--shadow-soft)]">
                <CardContent className="space-y-5 p-6">
                    <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search educator, email, headline, or status" />
                    {error ? (
                        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>
                    ) : null}

                    {queue === undefined ? (
                        <Skeleton className="h-80 rounded-lg" />
                    ) : queue.length === 0 ? (
                        <p className="rounded-lg border border-dashed border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-8 text-center text-sm font-semibold text-[var(--text-secondary)]">
                            {adminEmptyState("verification records")}
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Educator</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Availability</TableHead>
                                    <TableHead>Profile</TableHead>
                                    <TableHead>Credentials</TableHead>
                                    <TableHead className="w-24 text-right">Review</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {queue.map((educator) => (
                                    <TableRow key={educator.id}>
                                        <TableCell>
                                            <div className="font-semibold">{educator.name}</div>
                                            <div className="max-w-md truncate text-sm text-[var(--text-secondary)]">{educator.headline}</div>
                                        </TableCell>
                                        <TableCell>
                                            <AdminStatusBadge
                                                label={verificationStatusLabel(educator.verificationStatus)}
                                                tone={verificationStatusTone(educator.verificationStatus)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <AdminStatusBadge
                                                label={availabilityStatusLabel(educator.availabilityStatus)}
                                                tone={availabilityStatusTone(educator.availabilityStatus)}
                                            />
                                        </TableCell>
                                        <TableCell>{educator.profileCompletePct}%</TableCell>
                                        <TableCell>
                                            {educator.credentialCount}
                                            {educator.pendingCredentialCount > 0 ? (
                                                <span className="ml-2 text-xs font-bold text-amber-700">
                                                    {educator.pendingCredentialCount} pending
                                                </span>
                                            ) : null}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Sheet>
                                                <SheetTrigger asChild>
                                                    <Button variant="outline" size="sm">
                                                        Open
                                                    </Button>
                                                </SheetTrigger>
                                                <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
                                                    <SheetHeader>
                                                        <SheetTitle className="font-heading text-2xl">{educator.name}</SheetTitle>
                                                        <SheetDescription>{educator.email}</SheetDescription>
                                                    </SheetHeader>
                                                    <div className="space-y-6 p-4">
                                                        <div className="rounded-lg border border-[var(--border-subtle)] bg-white p-4">
                                                            <label className="mb-2 block text-sm font-bold text-[var(--text-primary)]">Verification status</label>
                                                            <Select
                                                                value={educator.verificationStatus}
                                                                onValueChange={(nextStatus) =>
                                                                    handleVerificationChange(educator.id, nextStatus as VerificationStatus)
                                                                }
                                                                disabled={savingId === educator.id}
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Verification status" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {verificationOptions.map((option) => (
                                                                        <SelectItem key={option.value} value={option.value}>
                                                                            {option.label}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>

                                                        <section className="space-y-3">
                                                            <h3 className="font-heading text-lg font-bold text-[var(--text-primary)]">Submitted credentials</h3>
                                                            {educator.credentials.length === 0 ? (
                                                                <p className="rounded-lg border border-dashed border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4 text-sm font-semibold text-[var(--text-secondary)]">
                                                                    No credentials submitted.
                                                                </p>
                                                            ) : (
                                                                <div className="space-y-3">
                                                                    {educator.credentials.map((credential) => (
                                                                        <article
                                                                            key={credential.id}
                                                                            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4"
                                                                        >
                                                                            <div className="flex items-start justify-between gap-3">
                                                                                <div>
                                                                                    <p className="font-bold text-[var(--text-primary)]">{credential.title}</p>
                                                                                    <p className="text-sm text-[var(--text-secondary)]">
                                                                                        {credential.issuingBody}
                                                                                        {credential.state ? ` · ${credential.state}` : ""}
                                                                                    </p>
                                                                                    <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
                                                                                        {credential.type} · Issued {credential.issueDate}
                                                                                        {credential.expiryDate ? ` · Expires ${credential.expiryDate}` : ""}
                                                                                    </p>
                                                                                </div>
                                                                                <AdminStatusBadge
                                                                                    label={credential.verified ? "Verified" : "Needs review"}
                                                                                    tone={credential.verified ? "emerald" : "amber"}
                                                                                />
                                                                            </div>
                                                                            {credential.documentUrl ? (
                                                                                <a
                                                                                    href={credential.documentUrl}
                                                                                    target="_blank"
                                                                                    rel="noreferrer"
                                                                                    className="mt-3 inline-flex text-sm font-bold text-[var(--accent-primary)] hover:underline"
                                                                                >
                                                                                    Open document
                                                                                </a>
                                                                            ) : null}
                                                                        </article>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </section>
                                                        <AdminNotes entityType="educator" entityId={educator.id} />
                                                    </div>
                                                </SheetContent>
                                            </Sheet>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </AdminShell>
    );
}
