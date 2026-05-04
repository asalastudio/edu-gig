"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Sidebar } from "@/components/shared/sidebar";
import { StatCard } from "@/components/shared/stat-card";
import { PrimaryButton } from "@/components/shared/button";
import { SquaresFour, UserCircleCheck, TrendDown, Clock, Plus } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { isDistrictRole } from "@/lib/roles";
import { formatDistrictKpis, formatPipelineStatus, type PipelineRow } from "@/lib/map-dashboard";

export default function DistrictDashboardPage() {
    const viewer = useQuery(api.users.viewer, {});
    const live = !!viewer && isDistrictRole(viewer.role);
    const kpis = useQuery(api.dashboards.districtKpis, live ? {} : "skip");
    const pipeline = useQuery(api.dashboards.districtPipeline, live ? {} : "skip");

    const kpiValues = formatDistrictKpis(live && kpis ? kpis : null);
    const pipelineRows: PipelineRow[] =
        live && pipeline ? pipeline.map((p) => ({ ...p })) : [];

    return (
        <div className="flex h-screen bg-[var(--bg-subtle)] font-sans">
            <Sidebar />
            <main className="flex-1 overflow-y-auto w-full relative">
                
                <div className="max-w-[1600px] w-full mx-auto px-8 lg:px-12 py-10 flex flex-col gap-10">

                    {/* Header Row */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[var(--border-subtle)] pb-8">
                        <div>
                            <div className="education-rule mb-4" />
                            <h1 className="font-heading text-4xl font-bold text-[var(--text-primary)] tracking-tight mb-2">
                                District HR Overview
                            </h1>
                            <p className="text-lg text-[var(--text-secondary)] font-medium">Monitor active placements, pending requests, and hiring pipelines across the district.</p>
                        </div>
                        <div className="flex gap-4">
                            <Link href="/post">
                                <PrimaryButton className="gap-2 px-8 py-3 text-base rounded-lg shadow-md bg-[var(--accent-secondary)] text-[var(--text-primary)] hover:bg-[var(--accent-secondary)]/90 border-none font-bold">
                                    <Plus weight="bold" className="h-5 w-5" /> Create Request
                                </PrimaryButton>
                            </Link>
                        </div>
                    </div>

                    {/* KPI Cards Row (Soft Depth Style) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        <StatCard label="Active Openings" value={kpiValues.activeOpenings} icon={SquaresFour} />
                        <StatCard label="Placements This Mo" value={kpiValues.placementsThisMonth} icon={UserCircleCheck} />
                        <StatCard label="Avg Time-to-Fill" value={kpiValues.avgTimeToFill} icon={Clock} />
                        <StatCard label="Total Spend YTD" value={kpiValues.totalSpendYtd} icon={TrendDown} />
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 pb-12">

                        {/* Talent Pipeline Table (Spans 2 columns) */}
                        <div className="xl:col-span-2 flex flex-col p-0 border border-[var(--border-default)] shadow-[var(--shadow-soft)] rounded-lg bg-white overflow-hidden">
                            <div className="px-8 py-8 border-b border-[var(--border-subtle)] flex justify-between items-center bg-white">
                                <div>
                                    <h2 className="font-heading text-2xl font-bold text-[var(--text-primary)]">Talent Pipeline</h2>
                                    <p className="text-base text-[var(--text-secondary)] mt-1 font-medium">Active requests and candidate statuses</p>
                                </div>
                                <span className="bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-sm font-bold px-4 py-2 rounded-full border border-[var(--accent-primary)]/20 shadow-sm flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse" /> Active Hiring Phase
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-base text-left align-middle border-collapse">
                                    <thead className="bg-[var(--bg-subtle)] text-[var(--text-secondary)] font-bold uppercase tracking-wider text-sm border-b border-[var(--border-subtle)]">
                                        <tr>
                                            <th className="py-5 px-8">Position</th>
                                            <th className="py-5 px-6">Candidates</th>
                                            <th className="py-5 px-6">Status</th>
                                            <th className="py-5 px-8 text-right">Days Open</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border-subtle)] bg-white">
                                        {pipelineRows.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="py-10 px-8 text-center text-sm font-semibold text-[var(--text-tertiary)]">
                                                    No openings yet. <Link href="/post" className="text-[var(--accent-primary)] underline">Post your first need</Link>.
                                                </td>
                                            </tr>
                                        ) : pipelineRows.map((row) => {
                                            const label = formatPipelineStatus(row.status);
                                            return (
                                                <tr key={row.id} className="hover:bg-[var(--bg-hover)] transition-colors group cursor-pointer">
                                                    <td className="py-6 px-8">
                                                        <Link href={`/dashboard/district/needs/${row.id}`} className="flex flex-col group/link">
                                                            <span className="font-bold text-lg text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] group-hover/link:text-[var(--accent-primary)] transition-colors">{row.role}</span>
                                                            <span className="text-sm font-semibold text-[var(--text-tertiary)] mt-1">{row.spec}</span>
                                                        </Link>
                                                    </td>
                                                    <td className="py-6 px-6 font-bold text-[var(--text-secondary)]">
                                                        {row.candidates ?? 0}
                                                    </td>
                                                    <td className="py-6 px-6">
                                                        <span className={cn(
                                                            "px-4 py-2 font-bold rounded-lg text-sm leading-none border shadow-sm inline-block",
                                                            label.color === 'emerald' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                                                label.color === 'amber' ? "bg-amber-50 text-amber-700 border-amber-200" :
                                                                    "bg-blue-50 text-blue-700 border-blue-200"
                                                        )}>
                                                            {label.text}
                                                        </span>
                                                    </td>
                                                    <td className="py-6 px-8 tabular-nums font-bold text-xl text-right text-[var(--text-primary)]">{row.daysOpen}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Recent Activity / Placements (Sidebar Column) */}
                        <div className="flex flex-col gap-6">

                            <div className="flex-1 p-8 border border-[var(--border-default)] shadow-[var(--shadow-soft)] rounded-lg bg-white flex flex-col relative overflow-hidden">
                                <div className="absolute inset-x-0 top-0 h-1 bg-[var(--accent-tertiary)] pointer-events-none" />
                                
                                <h2 className="font-heading text-2xl font-bold text-[var(--text-primary)] mb-8 relative z-10">Recent Placements</h2>

                                <div className="flex flex-col gap-4 flex-1 justify-center relative z-10">
                                    <div className="p-8 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-center">
                                        <p className="font-bold text-[var(--text-primary)] mb-2">No placements yet</p>
                                        <p className="text-sm text-[var(--text-secondary)]">
                                            Completed bookings will appear here once your district starts hiring through K12Gig.
                                        </p>
                                    </div>
                                </div>

                                <Link href="/browse" className="w-full mt-8 relative z-10">
                                    <button className="w-full py-4 text-base font-bold text-[var(--text-primary)] border-2 border-[var(--border-strong)] hover:bg-[var(--bg-subtle)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)]/30 transition-all rounded-lg shadow-sm cursor-pointer">
                                        View Full Directory
                                    </button>
                                </Link>
                            </div>

                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}
