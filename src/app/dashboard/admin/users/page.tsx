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
import { adminEmptyState, adminRoleLabel, formatAdminDate } from "@/lib/map-admin";

const roleOptions = [
    { value: "all", label: "All roles" },
    { value: "educator", label: "Educator" },
    { value: "district_admin", label: "District Admin" },
    { value: "district_hr", label: "District HR" },
    { value: "superintendent", label: "Superintendent" },
    { value: "superadmin", label: "Superadmin" },
];

export default function AdminUsersPage() {
    const viewer = useQuery(api.users.viewer, {});
    const [query, setQuery] = useState("");
    const [role, setRole] = useState("all");
    const users = useQuery(api.admin.listUsers, viewer?.role === "superadmin" ? { query, role } : "skip");

    return (
        <AdminShell title="Users" description="Review account roles, onboarding state, and account creation history.">
            <Card className="border-[var(--border-subtle)] shadow-[var(--shadow-soft)]">
                <CardContent className="space-y-5 p-6">
                    <div className="flex flex-col gap-3 md:flex-row">
                        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email, or role" />
                        <Select value={role} onValueChange={setRole}>
                            <SelectTrigger className="md:w-56">
                                <SelectValue placeholder="Role" />
                            </SelectTrigger>
                            <SelectContent>
                                {roleOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {users === undefined ? (
                        <Skeleton className="h-80 rounded-lg" />
                    ) : users.length === 0 ? (
                        <p className="rounded-lg border border-dashed border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-8 text-center text-sm font-semibold text-[var(--text-secondary)]">
                            {adminEmptyState("users")}
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Onboarding</TableHead>
                                    <TableHead className="text-right">Created</TableHead>
                                    <TableHead className="w-24 text-right">Details</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-semibold">{user.name}</TableCell>
                                        <TableCell className="text-[var(--text-secondary)]">{user.email}</TableCell>
                                        <TableCell>
                                            <AdminStatusBadge label={adminRoleLabel(user.role)} tone={user.role === "superadmin" ? "violet" : "neutral"} />
                                        </TableCell>
                                        <TableCell>
                                            <AdminStatusBadge label={user.onboarded ? "Complete" : "Incomplete"} tone={user.onboarded ? "emerald" : "amber"} />
                                        </TableCell>
                                        <TableCell className="text-right">{formatAdminDate(user.createdAt)}</TableCell>
                                        <TableCell className="text-right">
                                            <Sheet>
                                                <SheetTrigger asChild>
                                                    <Button variant="outline" size="sm">
                                                        Open
                                                    </Button>
                                                </SheetTrigger>
                                                <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
                                                    <SheetHeader>
                                                        <SheetTitle className="font-heading text-2xl">{user.name}</SheetTitle>
                                                        <SheetDescription>{user.email}</SheetDescription>
                                                    </SheetHeader>
                                                    <div className="space-y-6 p-4">
                                                        <div className="grid gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4">
                                                            <Detail label="Role" value={adminRoleLabel(user.role)} />
                                                            <Detail label="Onboarding" value={user.onboarded ? "Complete" : "Incomplete"} />
                                                            <Detail label="Created" value={formatAdminDate(user.createdAt)} />
                                                        </div>
                                                        <AdminNotes entityType="user" entityId={user.id} />
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
