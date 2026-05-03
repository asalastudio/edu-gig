"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
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
    planTypeLabel,
    procurementStatusLabel,
    procurementStatusTone,
} from "@/lib/map-admin";

const planOptions = [
    { value: "all", label: "All plans" },
    { value: "free", label: "Free" },
    { value: "essential", label: "Essential" },
    { value: "professional", label: "Professional" },
    { value: "enterprise", label: "Enterprise" },
];

export default function AdminDistrictsPage() {
    const viewer = useQuery(api.users.viewer, {});
    const [query, setQuery] = useState("");
    const [plan, setPlan] = useState("all");
    const districts = useQuery(api.admin.listDistricts, viewer?.role === "superadmin" ? { query, plan } : "skip");

    return (
        <AdminShell title="Districts" description="Monitor district accounts, administrators, plans, and procurement readiness.">
            <Card className="border-[var(--border-subtle)] shadow-[var(--shadow-soft)]">
                <CardContent className="space-y-5 p-6">
                    <div className="flex flex-col gap-3 md:flex-row">
                        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search district, state, region, or NCEA ID" />
                        <Select value={plan} onValueChange={setPlan}>
                            <SelectTrigger className="md:w-56">
                                <SelectValue placeholder="Plan" />
                            </SelectTrigger>
                            <SelectContent>
                                {planOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {districts === undefined ? (
                        <Skeleton className="h-80 rounded-lg" />
                    ) : districts.length === 0 ? (
                        <p className="rounded-lg border border-dashed border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-8 text-center text-sm font-semibold text-[var(--text-secondary)]">
                            {adminEmptyState("districts")}
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>District</TableHead>
                                    <TableHead>State</TableHead>
                                    <TableHead>Plan</TableHead>
                                    <TableHead>Admins</TableHead>
                                    <TableHead>Procurement</TableHead>
                                    <TableHead className="text-right">Created</TableHead>
                                    <TableHead className="w-24 text-right">Details</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {districts.map((district) => (
                                    <TableRow key={district.id}>
                                        <TableCell className="font-semibold">{district.name}</TableCell>
                                        <TableCell>{district.state}</TableCell>
                                        <TableCell>
                                            <AdminStatusBadge label={planTypeLabel(district.planType)} tone={district.planType === "enterprise" ? "violet" : "neutral"} />
                                        </TableCell>
                                        <TableCell>{district.adminCount}</TableCell>
                                        <TableCell>
                                            {district.latestProcurementStatus ? (
                                                <AdminStatusBadge
                                                    label={procurementStatusLabel(district.latestProcurementStatus)}
                                                    tone={procurementStatusTone(district.latestProcurementStatus)}
                                                />
                                            ) : (
                                                <span className="text-sm text-[var(--text-tertiary)]">No requests</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">{formatAdminDate(district.createdAt)}</TableCell>
                                        <TableCell className="text-right">
                                            <Sheet>
                                                <SheetTrigger asChild>
                                                    <Button variant="outline" size="sm">
                                                        Open
                                                    </Button>
                                                </SheetTrigger>
                                                <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
                                                    <SheetHeader>
                                                        <SheetTitle className="font-heading text-2xl">{district.name}</SheetTitle>
                                                        <SheetDescription>
                                                            {district.region} · {district.state}
                                                        </SheetDescription>
                                                    </SheetHeader>
                                                    <div className="space-y-6 p-4">
                                                        <div className="grid gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4">
                                                            <Detail label="Plan" value={planTypeLabel(district.planType)} />
                                                            <Detail label="NCEA ID" value={district.nceaId ?? "Not set"} />
                                                            <Detail label="Admins" value={district.adminNames.join(", ") || "No admins linked"} />
                                                            <Detail label="Procurement requests" value={String(district.procurementCount)} />
                                                        </div>
                                                        <AdminNotes entityType="district" entityId={district.id} />
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
            <p className="mt-1 font-semibold text-[var(--text-primary)]">{value}</p>
        </div>
    );
}
