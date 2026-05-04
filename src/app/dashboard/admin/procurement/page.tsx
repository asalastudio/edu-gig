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
    formatAdminDate,
    procurementStatusLabel,
    procurementStatusTone,
} from "@/lib/map-admin";
import { PROCUREMENT_STATUS_OPTIONS, procurementMaterialLabel, type ProcurementStatus } from "@/lib/procurement";

export default function AdminProcurementPage() {
    const viewer = useQuery(api.users.viewer, {});
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState("all");
    const requests = useQuery(api.admin.listProcurementRequests, viewer?.role === "superadmin" ? { query, status } : "skip");
    const updateStatus = useMutation(api.admin.updateProcurementStatus);
    const [savingId, setSavingId] = useState<Id<"procurementRequests"> | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function handleStatusChange(requestId: Id<"procurementRequests">, nextStatus: ProcurementStatus) {
        setSavingId(requestId);
        setError(null);
        try {
            await updateStatus({ requestId, status: nextStatus });
        } catch (err) {
            console.error(err);
            setError("Could not update the procurement request.");
        } finally {
            setSavingId(null);
        }
    }

    return (
        <AdminShell title="Procurement" description="Triage DPA, privacy, invoice language, and contract packet requests from districts.">
            <Card className="border-[var(--border-subtle)] shadow-[var(--shadow-soft)]">
                <CardContent className="space-y-5 p-6">
                    <div className="flex flex-col gap-3 md:flex-row">
                        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search district, requester, email, or notes" />
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="md:w-64">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All statuses</SelectItem>
                                {PROCUREMENT_STATUS_OPTIONS.map((option) => (
                                    <SelectItem key={option.id} value={option.id}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {error ? (
                        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>
                    ) : null}

                    {requests === undefined ? (
                        <Skeleton className="h-80 rounded-lg" />
                    ) : requests.length === 0 ? (
                        <p className="rounded-lg border border-dashed border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-8 text-center text-sm font-semibold text-[var(--text-secondary)]">
                            {adminEmptyState("procurement requests")}
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>District</TableHead>
                                    <TableHead>Requester</TableHead>
                                    <TableHead>Materials</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Deadline</TableHead>
                                    <TableHead className="text-right">Updated</TableHead>
                                    <TableHead className="w-24 text-right">Details</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.map((request) => (
                                    <TableRow key={request.id}>
                                        <TableCell>
                                            <div className="font-semibold">{request.districtName}</div>
                                            <div className="text-sm text-[var(--text-secondary)]">{request.state}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-semibold">{request.requesterName}</div>
                                            <div className="text-sm text-[var(--text-secondary)]">{request.requesterEmail}</div>
                                        </TableCell>
                                        <TableCell>{request.requestedMaterials.length}</TableCell>
                                        <TableCell>
                                            <AdminStatusBadge label={procurementStatusLabel(request.status)} tone={procurementStatusTone(request.status)} />
                                        </TableCell>
                                        <TableCell>{request.deadline ?? "Not set"}</TableCell>
                                        <TableCell className="text-right">{formatAdminDate(request.updatedAt)}</TableCell>
                                        <TableCell className="text-right">
                                            <Sheet>
                                                <SheetTrigger asChild>
                                                    <Button variant="outline" size="sm">
                                                        Open
                                                    </Button>
                                                </SheetTrigger>
                                                <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
                                                    <SheetHeader>
                                                        <SheetTitle className="font-heading text-2xl">{request.districtName}</SheetTitle>
                                                        <SheetDescription>
                                                            {request.requesterName} · {request.requesterEmail}
                                                        </SheetDescription>
                                                    </SheetHeader>
                                                    <div className="space-y-6 p-4">
                                                        <div className="grid gap-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4">
                                                            <Detail label="Requester title" value={request.requesterTitle ?? "Not provided"} />
                                                            <Detail label="Procurement contact" value={request.procurementContact ?? "Same as requester"} />
                                                            <Detail label="Deadline" value={request.deadline ?? "Not set"} />
                                                            <Detail label="Submitted" value={formatAdminDate(request.createdAt)} />
                                                            <Detail label="Requested materials" value={request.requestedMaterials.map(procurementMaterialLabel).join(", ")} />
                                                            <Detail label="District notes" value={request.notes ?? "No district notes"} />
                                                        </div>

                                                        <div className="rounded-lg border border-[var(--border-subtle)] bg-white p-4">
                                                            <label className="mb-2 block text-sm font-bold text-[var(--text-primary)]">Procurement status</label>
                                                            <Select
                                                                value={request.status}
                                                                onValueChange={(nextStatus) =>
                                                                    handleStatusChange(request.id, nextStatus as ProcurementStatus)
                                                                }
                                                                disabled={savingId === request.id}
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Status" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {PROCUREMENT_STATUS_OPTIONS.map((option) => (
                                                                        <SelectItem key={option.id} value={option.id}>
                                                                            {option.label}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <AdminNotes entityType="procurement_request" entityId={request.id} />
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

function Detail({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-tertiary)]">{label}</p>
            <p className="mt-1 font-semibold leading-6 text-[var(--text-primary)]">{value}</p>
        </div>
    );
}
