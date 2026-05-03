"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Sidebar } from "@/components/shared/sidebar";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/shared/card";
import { PrimaryButton } from "@/components/shared/button";
import { ArrowLeft, Wallet } from "@phosphor-icons/react";
import type { Doc } from "@/convex/_generated/dataModel";

type OrderRow = Doc<"orders">;

function nextFridayISO(now = new Date()): { iso: string; label: string } {
    const date = new Date(now);
    const day = date.getDay();
    const offset = day <= 5 ? (5 - day) : 6;
    date.setDate(date.getDate() + offset);
    return {
        iso: date.toISOString().slice(0, 10),
        label: date.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" }),
    };
}

function money(amount: number): string {
    return amount.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function formatOrderDate(ts: number): string {
    return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function paymentMethodLabel(method: OrderRow["paymentMethod"]): string {
    if (method === "card") return "Card";
    if (method === "ach") return "ACH";
    return "Net-30 invoice";
}

function payoutStatusLabel(order: OrderRow, nextPayout: string): string {
    if (order.status === "completed") return `Queued for ${nextPayout}`;
    if (order.status === "in_progress") return "Pending completion";
    if (order.status === "accepted") return "Pending completion";
    if (order.status === "pending") return "Awaiting your acceptance";
    if (order.status === "cancelled") return "Cancelled — no payout";
    if (order.status === "disputed") return "On hold (in dispute)";
    return "—";
}

function statusTone(status: OrderRow["status"]): string {
    if (status === "completed") return "bg-[var(--accent-success)]/10 text-[var(--accent-success)] border-[var(--accent-success)]/25";
    if (status === "in_progress" || status === "accepted") return "bg-[var(--accent-info)]/10 text-[var(--accent-info)] border-[var(--accent-info)]/25";
    if (status === "pending") return "bg-[var(--accent-secondary)]/15 text-[var(--text-primary)] border-[var(--accent-secondary)]/30";
    if (status === "cancelled") return "bg-[var(--bg-subtle)] text-[var(--text-tertiary)] border-[var(--border-subtle)]";
    return "bg-[var(--accent-warning,#b45309)]/10 text-[var(--accent-warning,#b45309)] border-[var(--accent-warning,#b45309)]/25";
}

export default function EducatorEarningsPage() {
    const viewer = useQuery(api.users.viewer, {});
    const orders = useQuery(api.orders.listForEducator, viewer ? {} : "skip");

    const signedOut = viewer === null;
    const loading = viewer === undefined || (!signedOut && orders === undefined);
    const list: OrderRow[] = orders ?? [];

    const nextPayout = nextFridayISO();
    const startOfMonth = (() => {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    })();

    const completedAll = list.filter((o) => o.status === "completed");
    const lifetime = completedAll.reduce((sum, o) => sum + o.educatorPayout, 0);
    const earnedThisMonth = completedAll
        .filter((o) => o.createdAt >= startOfMonth)
        .reduce((sum, o) => sum + o.educatorPayout, 0);
    const queuedForPayout = completedAll.reduce((sum, o) => sum + o.educatorPayout, 0);
    const totalBookings = list.length;

    return (
        <div className="min-h-screen bg-[var(--bg-app)] flex font-sans">
            <Sidebar />
            <main className="flex-1 flex flex-col">
                <div className="max-w-6xl mx-auto w-full px-6 py-10 lg:px-12 flex flex-col gap-8">
                    <Link href="/dashboard/educator" className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] w-fit">
                        <ArrowLeft className="w-4 h-4" /> Educator dashboard
                    </Link>

                    <PageHeader
                        title="Earnings"
                        description={`Track what districts owe you. K12Gig pays educators weekly via ACH — your next payout is ${nextPayout.label}.`}
                    />

                    {signedOut && (
                        <Card className="p-6 text-sm text-[var(--text-secondary)]">
                            Sign in with an educator account to see your earnings.
                        </Card>
                    )}

                    {!signedOut && loading && (
                        <Card className="p-6 text-sm text-[var(--text-secondary)]">Loading earnings…</Card>
                    )}

                    {!signedOut && !loading && (
                        <>
                            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <KpiTile label="Lifetime earned" value={money(lifetime)} icon={<Wallet weight="duotone" className="h-5 w-5" />} />
                                <KpiTile label="Earned this month" value={money(earnedThisMonth)} />
                                <KpiTile label={`Queued for ${nextPayout.label}`} value={money(queuedForPayout)} accent />
                                <KpiTile label="Total bookings" value={totalBookings.toString()} />
                            </section>

                            <Card className="overflow-hidden p-0">
                                <div className="px-6 py-5 border-b border-[var(--border-subtle)] flex items-center justify-between gap-4">
                                    <div>
                                        <h2 className="font-heading text-lg font-bold text-[var(--text-primary)]">Order history</h2>
                                        <p className="text-sm text-[var(--text-secondary)] mt-1">Read-only view. Payouts run every Friday.</p>
                                    </div>
                                </div>

                                {list.length === 0 ? (
                                    <div className="p-10 text-center text-sm text-[var(--text-secondary)]">
                                        No orders yet. When districts book your gigs, your earnings will appear here.
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-[var(--bg-subtle)] text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                                                <tr>
                                                    <th className="px-6 py-3 text-left">Date</th>
                                                    <th className="px-6 py-3 text-left">Engagement</th>
                                                    <th className="px-6 py-3 text-left">Status</th>
                                                    <th className="px-6 py-3 text-left">Payment method</th>
                                                    <th className="px-6 py-3 text-right">Your payout</th>
                                                    <th className="px-6 py-3 text-left">Payout status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[var(--border-subtle)]">
                                                {list.map((order) => (
                                                    <tr key={order._id}>
                                                        <td className="px-6 py-4 text-[var(--text-secondary)] whitespace-nowrap">{formatOrderDate(order.createdAt)}</td>
                                                        <td className="px-6 py-4 font-medium text-[var(--text-primary)]">{order.engagementType}</td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-bold capitalize ${statusTone(order.status)}`}>
                                                                {order.status.replace("_", " ")}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-[var(--text-secondary)] whitespace-nowrap">{paymentMethodLabel(order.paymentMethod)}</td>
                                                        <td className="px-6 py-4 text-right font-bold tabular-nums text-[var(--text-primary)]">{money(order.educatorPayout)}</td>
                                                        <td className="px-6 py-4 text-[var(--text-secondary)]">{payoutStatusLabel(order, nextPayout.label)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </Card>

                            <Card className="p-6 flex flex-col gap-3 text-sm text-[var(--text-secondary)]">
                                <h3 className="font-heading text-base font-bold text-[var(--text-primary)]">How payouts work</h3>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>Educators receive 100% of their listed rate. Districts pay an 18% platform fee on top of that, disclosed at checkout.</li>
                                    <li>Payouts disburse via ACH every Friday for orders that are <strong>completed</strong> by Wednesday of that week.</li>
                                    <li>Net-30 invoice orders pay out only after the district has cleared payment to K12Gig.</li>
                                    <li>You&apos;ll receive a 1099 from K12Gig at year-end if you earn $600 or more.</li>
                                    <li>Questions? Email <Link href="mailto:support@k12gig.com" className="font-semibold text-[var(--accent-primary)] underline">support@k12gig.com</Link>.</li>
                                </ul>
                                <p className="text-xs text-[var(--text-tertiary)] mt-2">Automated payouts via Stripe Connect are on the roadmap (target summer 2026). Until then, payouts are processed manually each week by the K12Gig team.</p>
                            </Card>

                            <div>
                                <Link href="/dashboard/educator">
                                    <PrimaryButton className="w-fit">Back to dashboard</PrimaryButton>
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}

function KpiTile({ label, value, accent, icon }: { label: string; value: string; accent?: boolean; icon?: React.ReactNode }) {
    return (
        <div className={`rounded-lg border p-5 flex flex-col gap-1.5 shadow-[var(--shadow-subtle)] ${accent ? "border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/5" : "border-[var(--border-default)] bg-white"}`}>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                {icon}
                {label}
            </div>
            <div className="font-heading text-2xl font-bold text-[var(--text-primary)] tabular-nums">{value}</div>
        </div>
    );
}
