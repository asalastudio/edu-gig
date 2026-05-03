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
    formatAdminMoney,
    orderStatusLabel,
    orderStatusTone,
} from "@/lib/map-admin";

const orderStatusOptions = [
    { value: "all", label: "All statuses" },
    { value: "pending", label: "Pending" },
    { value: "accepted", label: "Accepted" },
    { value: "in_progress", label: "In progress" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
    { value: "disputed", label: "Disputed" },
];

export default function AdminOrdersPage() {
    const viewer = useQuery(api.users.viewer, {});
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState("all");
    const orders = useQuery(api.admin.listOrders, viewer?.role === "superadmin" ? { query, status } : "skip");

    return (
        <AdminShell title="Orders" description="Read-only visibility into marketplace bookings, payment method, payout, and platform fee.">
            <Card className="border-[var(--border-subtle)] shadow-[var(--shadow-soft)]">
                <CardContent className="space-y-5 p-6">
                    <div className="flex flex-col gap-3 md:flex-row">
                        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search district, educator, gig, or status" />
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="md:w-56">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                {orderStatusOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {orders === undefined ? (
                        <Skeleton className="h-80 rounded-lg" />
                    ) : orders.length === 0 ? (
                        <p className="rounded-lg border border-dashed border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-8 text-center text-sm font-semibold text-[var(--text-secondary)]">
                            {adminEmptyState("orders")}
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Gig</TableHead>
                                    <TableHead>District</TableHead>
                                    <TableHead>Educator</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Payment</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="w-24 text-right">Details</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-semibold">{order.gigTitle}</TableCell>
                                        <TableCell>{order.districtName}</TableCell>
                                        <TableCell>{order.educatorName}</TableCell>
                                        <TableCell>
                                            <AdminStatusBadge label={orderStatusLabel(order.status)} tone={orderStatusTone(order.status)} />
                                        </TableCell>
                                        <TableCell className="uppercase">{order.paymentMethod}</TableCell>
                                        <TableCell className="text-right font-semibold">{formatAdminMoney(order.totalAmount)}</TableCell>
                                        <TableCell className="text-right">
                                            <Sheet>
                                                <SheetTrigger asChild>
                                                    <Button variant="outline" size="sm">
                                                        Open
                                                    </Button>
                                                </SheetTrigger>
                                                <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
                                                    <SheetHeader>
                                                        <SheetTitle className="font-heading text-2xl">{order.gigTitle}</SheetTitle>
                                                        <SheetDescription>
                                                            {order.districtName} · {order.educatorName}
                                                        </SheetDescription>
                                                    </SheetHeader>
                                                    <div className="space-y-6 p-4">
                                                        <div className="grid gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4">
                                                            <Detail label="Status" value={orderStatusLabel(order.status)} />
                                                            <Detail label="Payment method" value={order.paymentMethod.toUpperCase()} />
                                                            <Detail label="Start date" value={order.startDate} />
                                                            <Detail label="Created" value={formatAdminDate(order.createdAt)} />
                                                            <Detail label="Total" value={formatAdminMoney(order.totalAmount)} />
                                                            <Detail label="Educator payout" value={formatAdminMoney(order.educatorPayout)} />
                                                            <Detail label="Platform fee" value={formatAdminMoney(order.platformFee)} />
                                                        </div>
                                                        <AdminNotes entityType="order" entityId={order.id} />
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
