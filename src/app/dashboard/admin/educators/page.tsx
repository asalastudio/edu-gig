"use client";

import { useState } from "react";
import Link from "next/link";
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
    availabilityStatusLabel,
    availabilityStatusTone,
    formatAdminDate,
    verificationStatusLabel,
    verificationStatusTone,
} from "@/lib/map-admin";

const verificationOptions = [
    { value: "all", label: "All statuses" },
    { value: "unverified", label: "Unverified" },
    { value: "pending", label: "Pending review" },
    { value: "verified", label: "Verified" },
    { value: "premier", label: "Premier" },
];

export default function AdminEducatorsPage() {
    const viewer = useQuery(api.users.viewer, {});
    const [query, setQuery] = useState("");
    const [verificationStatus, setVerificationStatus] = useState("all");
    const educators = useQuery(
        api.admin.listEducators,
        viewer?.role === "superadmin" ? { query, verificationStatus } : "skip"
    );

    return (
        <AdminShell title="Educators" description="Review educator profile readiness, credentials, gigs, and verification state.">
            <Card className="border-[var(--border-subtle)] shadow-[var(--shadow-soft)]">
                <CardContent className="space-y-5 p-6">
                    <div className="flex flex-col gap-3 md:flex-row">
                        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search educator, email, or headline" />
                        <Select value={verificationStatus} onValueChange={setVerificationStatus}>
                            <SelectTrigger className="md:w-56">
                                <SelectValue placeholder="Verification" />
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

                    {educators === undefined ? (
                        <Skeleton className="h-80 rounded-lg" />
                    ) : educators.length === 0 ? (
                        <p className="rounded-lg border border-dashed border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-8 text-center text-sm font-semibold text-[var(--text-secondary)]">
                            {adminEmptyState("educators")}
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Educator</TableHead>
                                    <TableHead>Verification</TableHead>
                                    <TableHead>Availability</TableHead>
                                    <TableHead>Profile</TableHead>
                                    <TableHead>Credentials</TableHead>
                                    <TableHead>Gigs</TableHead>
                                    <TableHead className="w-24 text-right">Details</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {educators.map((educator) => (
                                    <TableRow key={educator.id}>
                                        <TableCell>
                                            <div className="font-semibold">{educator.name}</div>
                                            <div className="max-w-sm truncate text-sm text-[var(--text-secondary)]">{educator.headline}</div>
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
                                            {educator.unverifiedCredentialCount > 0 ? (
                                                <span className="ml-2 text-xs font-bold text-amber-700">
                                                    {educator.unverifiedCredentialCount} pending
                                                </span>
                                            ) : null}
                                        </TableCell>
                                        <TableCell>{educator.gigCount}</TableCell>
                                        <TableCell className="text-right">
                                            <Sheet>
                                                <SheetTrigger asChild>
                                                    <Button variant="outline" size="sm">
                                                        Open
                                                    </Button>
                                                </SheetTrigger>
                                                <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
                                                    <SheetHeader>
                                                        <SheetTitle className="font-heading text-2xl">{educator.name}</SheetTitle>
                                                        <SheetDescription>{educator.email}</SheetDescription>
                                                    </SheetHeader>
                                                    <div className="space-y-6 p-4">
                                                        <div className="grid gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4">
                                                            <Detail label="Headline" value={educator.headline} />
                                                            <Detail label="Profile completion" value={`${educator.profileCompletePct}%`} />
                                                            <Detail label="Credentials" value={`${educator.credentialCount} total, ${educator.unverifiedCredentialCount} pending`} />
                                                            <Detail label="Created" value={formatAdminDate(educator.createdAt)} />
                                                        </div>
                                                        <Button asChild variant="outline">
                                                            <Link href="/dashboard/admin/verification">Open verification queue</Link>
                                                        </Button>
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

function Detail({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-tertiary)]">{label}</p>
            <p className="mt-1 font-semibold text-[var(--text-primary)]">{value}</p>
        </div>
    );
}
