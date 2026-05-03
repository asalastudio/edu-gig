"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatAdminDate, formatAdminMoney } from "@/lib/map-admin";

export default function AdminOverviewPage() {
    const viewer = useQuery(api.users.viewer, {});
    const stats = useQuery(api.admin.overviewStats, viewer?.role === "superadmin" ? {} : "skip");

    return (
        <AdminShell
            title="K12Gig Operations"
            description="A launch-focused control room for account health, procurement readiness, verification, and marketplace activity."
        >
            {stats === undefined ? (
                <OverviewSkeleton />
            ) : (
                <div className="space-y-8">
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <StatCard label="Users" value={String(stats.users)} detail={`${stats.educators} educators`} />
                        <StatCard label="Districts" value={String(stats.districts)} detail={`${stats.procurementRequests} procurement requests`} />
                        <StatCard label="Orders" value={String(stats.orders)} detail={`${stats.openOrders} active or pending`} />
                        <StatCard label="Marketplace GMV" value={formatAdminMoney(stats.totalGMV)} detail="Across all orders" />
                    </div>

                    <div className="grid gap-4 lg:grid-cols-3">
                        <Card className="border-[var(--border-subtle)] shadow-[var(--shadow-soft)]">
                            <CardHeader>
                                <CardTitle className="font-heading text-xl">Launch Watchlist</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-3">
                                <WatchlistRow label="Pending verification" value={stats.pendingVerification} />
                                <WatchlistRow label="Open procurement" value={stats.pendingProcurement} />
                                <WatchlistRow label="Open orders" value={stats.openOrders} />
                            </CardContent>
                        </Card>

                        <Card className="border-[var(--border-subtle)] shadow-[var(--shadow-soft)] lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="font-heading text-xl">Recent Admin Activity</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {stats.recentAuditEvents.length === 0 ? (
                                    <p className="rounded-lg border border-dashed border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-6 text-sm font-semibold text-[var(--text-secondary)]">
                                        No admin actions recorded yet.
                                    </p>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Action</TableHead>
                                                <TableHead>Entity</TableHead>
                                                <TableHead>Summary</TableHead>
                                                <TableHead className="text-right">Date</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {stats.recentAuditEvents.map((event) => (
                                                <TableRow key={event.id}>
                                                    <TableCell className="font-semibold">{event.action}</TableCell>
                                                    <TableCell>{event.entityType}</TableCell>
                                                    <TableCell className="text-[var(--text-secondary)]">{event.summary}</TableCell>
                                                    <TableCell className="text-right">{formatAdminDate(event.createdAt)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </AdminShell>
    );
}

function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
    return (
        <Card className="border-[var(--border-subtle)] shadow-[var(--shadow-soft)]">
            <CardContent className="p-6">
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)]">{label}</p>
                <p className="mt-3 font-heading text-3xl font-bold text-[var(--text-primary)]">{value}</p>
                <p className="mt-2 text-sm font-medium text-[var(--text-secondary)]">{detail}</p>
            </CardContent>
        </Card>
    );
}

function WatchlistRow({ label, value }: { label: string; value: number }) {
    return (
        <div className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-4 py-3">
            <span className="text-sm font-semibold text-[var(--text-secondary)]">{label}</span>
            <span className="font-heading text-xl font-bold text-[var(--text-primary)]">{value}</span>
        </div>
    );
}

function OverviewSkeleton() {
    return (
        <div className="space-y-8">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-32 rounded-lg" />
                ))}
            </div>
            <Skeleton className="h-96 rounded-lg" />
        </div>
    );
}
