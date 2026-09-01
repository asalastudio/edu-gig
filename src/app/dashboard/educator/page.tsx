"use client";

import React, { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { Sidebar } from "@/components/shared/sidebar";
import { Briefcase, CheckCircle, ChatCircle, Power, ArrowRight } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { formatAgreedRate, formatEducatorKpis, formatOrderStatus, type EducatorPipelineRow } from "@/lib/map-dashboard";

export default function EducatorDashboardPage() {
    const [isActive, setIsActive] = useState(true);
    const [availabilitySaving, setAvailabilitySaving] = useState(false);

    const viewer = useQuery(api.users.viewer, {});
    const live = !!viewer && viewer.role === "educator";
    const kpis = useQuery(api.dashboards.educatorKpis, live ? {} : "skip");
    const pipeline = useQuery(api.dashboards.educatorPipeline, live ? {} : "skip");
    const mine = useQuery(api.educators.getMine, live ? {} : "skip");
    const updateProfile = useMutation(api.educators.updateMyProfile);

    const kpiValues = formatEducatorKpis(live && kpis ? kpis : null);
    const pipelineRows: EducatorPipelineRow[] = live && pipeline ? pipeline : [];
    const displayName = viewer?.firstName?.trim() || kpiValues.greetingName;

    useEffect(() => {
        if (mine) setIsActive(mine.availabilityStatus !== "closed");
    }, [mine]);

    async function handleAvailabilityToggle() {
        const next = !isActive;
        setIsActive(next);
        if (!live) return;
        setAvailabilitySaving(true);
        try {
            await updateProfile({ availabilityStatus: next ? "open" : "closed" });
        } catch {
            setIsActive(!next);
        } finally {
            setAvailabilitySaving(false);
        }
    }

    return (
        <div className="flex h-screen bg-[var(--bg-subtle)] font-sans pt-14 lg:pt-0">
            <Sidebar />
            <main className="flex-1 overflow-y-auto w-full relative">
                <div className="max-w-[1600px] w-full mx-auto px-6 lg:px-10 py-8 flex flex-col gap-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5 border-b border-[var(--border-subtle)] pb-6">
                        <div>
                            <div className="education-rule mb-4" />
                            <p className="eyebrow mb-3">Consultant Dashboard</p>
                            <h1 className="font-heading text-3xl font-bold text-[var(--text-primary)] tracking-tight mb-3 md:text-4xl lg:text-5xl">
                                Welcome back, {displayName}
                            </h1>
                            <p className="max-w-3xl text-base leading-7 text-[var(--text-secondary)] md:text-lg">
                                Track accepted gigs, pending proposals, and contract documents. Payment is handled off-platform with the district.
                            </p>
                        </div>
                        <div className="flex items-center gap-3 bg-white p-2 pr-4 rounded-lg border border-[var(--border-subtle)] shadow-sm hover:shadow-md transition-shadow">
                            <button
                                onClick={handleAvailabilityToggle}
                                disabled={availabilitySaving}
                                className={cn(
                                    "relative flex items-center justify-center w-12 h-9 rounded-lg transition-colors shadow-inner",
                                    isActive ? "bg-emerald-500 text-white" : "bg-[var(--border-strong)] text-white"
                                )}
                            >
                                {isActive ? <Power weight="bold" className="w-5 h-5" /> : <Power className="w-5 h-5" />}
                            </button>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-[var(--text-primary)] leading-none mb-1">
                                    {isActive ? "Open to new clients" : "Not accepting new clients"}
                                </span>
                                <span className="text-xs font-medium text-[var(--text-tertiary)] leading-none">
                                    {availabilitySaving ? "Saving…" : "Districts can still view your profile"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-[var(--border-subtle)] p-0 border border-[var(--border-default)] shadow-[var(--shadow-soft)] rounded-lg bg-white overflow-hidden">
                        {[
                            { label: "Active Gigs", value: String(kpis?.activeCount ?? 0), sub: kpiValues.activeCount, icon: Briefcase, color: "blue" },
                            { label: "Completed Engagements", value: String(kpis?.completedCount ?? 0), sub: kpiValues.pendingLabel, icon: CheckCircle, color: "emerald" },
                        ].map((stat, i) => (
                            <div key={i} className="flex-1 p-6 flex items-start justify-between min-w-[250px] hover:bg-[var(--bg-hover)] transition-colors">
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-3">{stat.label}</span>
                                    <span className="font-heading text-3xl font-bold text-[var(--text-primary)]">{stat.value}</span>
                                    <span className="text-sm font-medium text-[var(--text-secondary)] mt-2">{stat.sub}</span>
                                </div>
                                <div className={cn(
                                    "p-4 rounded-lg shadow-sm border",
                                    stat.color === "blue" ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                                )}>
                                    <stat.icon weight="duotone" className="w-8 h-8" />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-10">
                        <div className="lg:col-span-8 flex flex-col gap-6">
                            <h2 className="font-heading text-xl font-bold text-[var(--text-primary)] px-1">Active Gigs</h2>
                            <div className="grid grid-cols-1 gap-5">
                                {pipelineRows.length === 0 ? (
                                    <div className="p-8 border border-[var(--border-subtle)] shadow-sm rounded-lg bg-white text-center text-sm leading-6 text-[var(--text-secondary)]">
                                        Accepted district work will appear here. Browse the Gig Board to submit a proposal.
                                    </div>
                                ) : pipelineRows.map((gig) => {
                                    const label = formatOrderStatus(gig.status);
                                    return (
                                        <Link key={gig.id} href={`/dashboard/engagements/${gig.id}`} className="p-0 border border-[var(--border-default)] shadow-[var(--shadow-subtle)] rounded-lg bg-white overflow-hidden group hover:-translate-y-1 hover:border-[var(--accent-primary)]/40 hover:shadow-[var(--shadow-soft)] transition-all duration-300">
                                            <div className="flex flex-col sm:flex-row h-full">
                                                <div className={cn("w-full sm:w-3 h-3 sm:h-auto", label.color === "emerald" ? "bg-emerald-400" : label.color === "amber" ? "bg-amber-400" : "bg-blue-400")} />
                                                <div className="flex-1 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
                                                    <div className="flex flex-col">
                                                        <h3 className="font-bold text-[var(--text-primary)] text-lg mb-2 group-hover:text-[var(--accent-primary)] transition-colors">{gig.title}</h3>
                                                        <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)] font-medium">
                                                            <span>{gig.district}</span>
                                                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--border-strong)]" />
                                                            <span className="font-bold px-2 py-0.5 rounded-md text-sm bg-[var(--bg-subtle)]">{label.text}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-6 self-end sm:self-auto">
                                                        <div className="flex flex-col items-end">
                                                            <span className="font-bold text-[var(--text-primary)] text-xl">{formatAgreedRate(gig.amount)}</span>
                                                            <span className="text-xs text-[var(--text-tertiary)] font-bold uppercase tracking-widest mt-1">{gig.startDate ?? ""}</span>
                                                        </div>
                                                        <div className="h-12 w-12 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-center group-hover:bg-[var(--accent-primary)] group-hover:text-white transition-colors">
                                                            <ArrowRight weight="bold" className="w-5 h-5" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="lg:col-span-4 flex flex-col gap-8">
                            <Link href="/dashboard/messages" className="p-8 border border-[var(--border-default)] shadow-[var(--shadow-subtle)] rounded-lg bg-[var(--bg-subtle)] flex flex-col items-center justify-center text-center hover:border-[var(--accent-primary)]/40 hover:shadow-[var(--shadow-soft)] transition-all">
                                <div className="w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center mb-5 text-emerald-600">
                                    <ChatCircle weight="fill" className="w-8 h-8" />
                                </div>
                                <h3 className="font-heading text-xl font-bold text-[var(--text-primary)] mb-2">Messages</h3>
                                <p className="text-sm leading-6 text-[var(--text-secondary)] font-medium">Reply after a district starts the conversation.</p>
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
