"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/shared/sidebar";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { PrimaryButton } from "@/components/shared/button";
import { SquaresFour, UserCircleCheck, TrendDown, Clock, DownloadSimple, Plus, MapPin, WarningCircle, X, ArrowRight } from "@phosphor-icons/react";
import { Card } from "@/components/shared/card";
import { cn } from "@/lib/utils";

export default function DistrictDashboardPage() {
    const [showAlert, setShowAlert] = useState(true);

    return (
        <div className="flex h-screen bg-[var(--bg-subtle)] font-sans">
            <Sidebar />
            <main className="flex-1 overflow-y-auto w-full relative">
                
                {/* Action Center Banner */}
                {showAlert && (
                    <div className="w-full bg-amber-100 border-b border-amber-300 py-4 px-8 lg:px-12 flex items-center justify-between shadow-sm z-10 relative">
                        <div className="flex items-center gap-4 text-amber-900">
                            <WarningCircle weight="fill" className="w-6 h-6 text-amber-600" />
                            <span className="text-base font-bold">Action Required: <span className="font-medium">You have 1 pending placement contract to sign for Lincoln High.</span></span>
                            <button className="ml-2 text-sm font-black uppercase tracking-wider underline hover:text-amber-700 transition-colors flex items-center gap-1">Review Contract <ArrowRight weight="bold" className="w-4 h-4" /></button>
                        </div>
                        <button onClick={() => setShowAlert(false)} className="text-amber-600 hover:text-amber-900 hover:bg-amber-200 p-1.5 rounded-full transition-colors">
                            <X weight="bold" className="w-5 h-5" />
                        </button>
                    </div>
                )}

                <div className="max-w-[1600px] w-full mx-auto px-8 lg:px-12 py-10 flex flex-col gap-10">

                    {/* Header Row */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[var(--border-subtle)] pb-8">
                        <div>
                            <h1 className="font-heading text-4xl font-bold text-[var(--text-primary)] tracking-tight mb-2">
                                District HR Overview
                            </h1>
                            <p className="text-lg text-[var(--text-secondary)] font-medium">Monitor active placements, pending requests, and hiring pipelines across the district.</p>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => alert("Report downloaded successfully!")} className="flex items-center gap-2 px-6 py-3 text-base font-bold text-[var(--text-primary)] bg-white border-2 border-[var(--border-strong)] rounded-2xl hover:bg-[var(--bg-hover)] transition-all shadow-sm">
                                <DownloadSimple weight="bold" className="h-5 w-5" /> Export Report
                            </button>
                            <Link href="/post">
                                <PrimaryButton className="gap-2 px-8 py-3 text-base rounded-2xl shadow-md bg-[var(--accent-secondary)] text-[var(--text-primary)] hover:bg-[var(--accent-secondary)]/90 border-none font-bold">
                                    <Plus weight="bold" className="h-5 w-5" /> Create Request
                                </PrimaryButton>
                            </Link>
                        </div>
                    </div>

                    {/* KPI Cards Row (Soft Depth Style) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        <StatCard label="Active Openings" value="12" icon={SquaresFour} delta={-2} deltaLabel="resolved openings" />
                        <StatCard label="Placements This Mo" value="4" icon={UserCircleCheck} />
                        <StatCard label="Avg Time-to-Fill" value="18 days" icon={Clock} delta={15} deltaLabel="faster than prior" />
                        <StatCard label="Total Spend YTD" value="$128.5K" icon={TrendDown} />
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 pb-12">

                        {/* Talent Pipeline Table (Spans 2 columns) */}
                        <div className="xl:col-span-2 flex flex-col p-0 border border-[var(--border-subtle)] shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-3xl bg-white overflow-hidden">
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
                                        {[
                                            { role: "Instructional Coach", spec: "Math", cand: "3 Contacted", status: "Interviewing", color: "amber", days: 14 },
                                            { role: "Resource Teacher", spec: "Special Ed", cand: "1 Contacted", status: "Placed", color: "emerald", days: 2 },
                                            { role: "AP Physics Sub", spec: "Long-term (12 wks)", cand: "0 Found", status: "Sourcing", color: "blue", days: 21 },
                                        ].map((row, i) => (
                                            <tr key={i} className="hover:bg-[var(--bg-hover)] transition-colors group cursor-pointer">
                                                <td className="py-6 px-8">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-lg text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">{row.role}</span>
                                                        <span className="text-sm font-semibold text-[var(--text-tertiary)] mt-1">{row.spec}</span>
                                                    </div>
                                                </td>
                                                <td className="py-6 px-6 font-bold text-[var(--text-secondary)]">{row.cand}</td>
                                                <td className="py-6 px-6">
                                                    <span className={cn(
                                                        "px-4 py-2 font-bold rounded-xl text-sm leading-none border shadow-sm inline-block",
                                                        row.color === 'emerald' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                                            row.color === 'amber' ? "bg-amber-50 text-amber-700 border-amber-200" :
                                                                "bg-blue-50 text-blue-700 border-blue-200"
                                                    )}>
                                                        {row.status}
                                                    </span>
                                                </td>
                                                <td className="py-6 px-8 tabular-nums font-bold text-xl text-right text-[var(--text-primary)]">{row.days}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Recent Activity / Placements (Sidebar Column) */}
                        <div className="flex flex-col gap-6">

                            <div className="flex-1 p-8 border border-[var(--border-subtle)] shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-3xl bg-white flex flex-col relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--accent-primary)]/5 rounded-bl-full pointer-events-none" />
                                
                                <h2 className="font-heading text-2xl font-bold text-[var(--text-primary)] mb-8 relative z-10">Recent Placements</h2>

                                <div className="flex flex-col gap-4 flex-1 justify-center relative z-10">
                                    {[
                                        { name: "Dr. Sarah Jenkins", id: "e_1", role: "SpEd Consultant", location: "Lincoln High", date: "Today" },
                                        { name: "Miguel Rodriguez", id: "e_1", role: "Math Interventionist", location: "District Wide", date: "Yesterday" }
                                    ].map((item, i) => (
                                        <Link key={i} href={`/browse/${item.id}`} className="block">
                                            <div className="flex gap-4 p-5 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)] hover:shadow-md transition-all cursor-pointer group">
                                                <div className="h-12 w-12 rounded-xl bg-white border border-[var(--border-strong)] flex items-center justify-center flex-shrink-0 text-[var(--text-tertiary)] font-heading font-bold text-base shadow-sm group-hover:text-[var(--accent-primary)] group-hover:border-[var(--accent-primary)]/30 transition-colors">
                                                    {item.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                </div>
                                                <div className="flex flex-col flex-1">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="font-bold text-[var(--text-primary)] text-base group-hover:text-[var(--accent-primary)] transition-colors">{item.name}</span>
                                                        <span className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">{item.date}</span>
                                                    </div>
                                                    <span className="text-sm font-bold text-[var(--text-secondary)]">{item.role}</span>
                                                    <div className="flex items-center gap-1.5 mt-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                                        <MapPin weight="fill" className="w-4 h-4 text-[var(--accent-secondary)]" />
                                                        <span className="text-xs font-bold text-[var(--text-tertiary)]">{item.location}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>

                                <Link href="/browse" className="w-full mt-8 relative z-10">
                                    <button className="w-full py-4 text-base font-bold text-[var(--text-primary)] border-2 border-[var(--border-strong)] hover:bg-[var(--bg-subtle)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)]/30 transition-all rounded-2xl shadow-sm cursor-pointer">
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
