"use client";

import React, { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { Sidebar } from "@/components/shared/sidebar";
import { Briefcase, TrendUp, CalendarCheck, ArrowRight, ChatCircle, Power } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { formatEducatorKpis, formatOrderStatus, type EducatorPipelineRow } from "@/lib/map-dashboard";

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
        <div className="flex h-screen bg-[var(--bg-subtle)] font-sans">
            <Sidebar />
            <main className="flex-1 overflow-y-auto w-full relative">
                
                <div className="max-w-[1600px] w-full mx-auto px-8 lg:px-12 py-10 flex flex-col gap-10">

                    {/* Header Row */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[var(--border-subtle)] pb-8">
                        <div>
                            <div className="education-rule mb-4" />
                            <h1 className="font-heading text-4xl font-bold text-[var(--text-primary)] tracking-tight mb-2">
                                Educator Dashboard
                            </h1>
                            <p className="text-lg text-[var(--text-secondary)] font-medium">Welcome back, {kpiValues.greetingName}. Track your active gigs and earnings pipeline.</p>
                        </div>
                        
                        <div className="flex items-center gap-4 bg-white p-2.5 pr-5 rounded-lg border border-[var(--border-subtle)] shadow-sm hover:shadow-md transition-shadow">
                            <button 
                                onClick={handleAvailabilityToggle}
                                disabled={availabilitySaving}
                                className={cn(
                                    "relative flex items-center justify-center w-14 h-10 rounded-lg transition-colors shadow-inner",
                                    isActive ? "bg-emerald-500 text-white" : "bg-[var(--border-strong)] text-white"
                                )}
                            >
                                {isActive ? <Power weight="bold" className="w-5 h-5" /> : <Power className="w-5 h-5" />}
                            </button>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-[var(--text-primary)] leading-none mb-1">
                                    {isActive ? "Accept new district requests" : "Do not accept new requests"}
                                </span>
                                <span className="text-xs font-medium text-[var(--text-tertiary)] leading-none">
                                    {availabilitySaving ? "Saving…" : "Districts can still view your profile"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats Banner (Sales CRM style) */}
                    <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-[var(--border-subtle)] p-0 border border-[var(--border-default)] shadow-[var(--shadow-soft)] rounded-lg bg-white overflow-hidden">
	                        {[
	                            { label: "Pipeline (Active Orders)", value: kpiValues.pipelineValue, sub: kpiValues.activeCount, icon: Briefcase, color: "blue" },
	                            { label: "Total Earnings YTD", value: kpiValues.ytdPayout, sub: kpiValues.completedLabel, icon: TrendUp, color: "amber" },
	                        ].map((stat, i) => (
                            <div key={i} className="flex-1 p-8 flex items-start justify-between min-w-[250px] hover:bg-[var(--bg-hover)] transition-colors">
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-3">{stat.label}</span>
                                    <div className="flex items-center gap-3">
                                        <span className="font-heading text-4xl font-bold text-[var(--text-primary)]">{stat.value}</span>
                                    </div>
                                    <span className="text-sm font-medium text-[var(--text-secondary)] mt-2">{stat.sub}</span>
                                </div>
                                <div className={cn(
                                    "p-4 rounded-lg shadow-sm border",
                                    stat.color === 'blue' ? "bg-blue-50 text-blue-600 border-blue-100" :
                                        stat.color === 'emerald' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                            "bg-amber-50 text-amber-600 border-amber-100"
                                )}>
                                    <stat.icon weight="duotone" className="w-8 h-8" />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12">

                        {/* Deals / Tasks Pipeline (Spans 8) */}
                        <div className="lg:col-span-8 flex flex-col gap-6">
                            <h2 className="font-heading text-2xl font-bold text-[var(--text-primary)] px-1">Active Pipeline</h2>

                            <div className="grid grid-cols-1 gap-5">
                                {pipelineRows.length === 0 ? (
                                    <div className="p-10 border border-[var(--border-subtle)] shadow-sm rounded-lg bg-white text-center text-[var(--text-secondary)]">
                                        No active orders yet. District placements will appear here once you accept a gig.
                                    </div>
                                ) : pipelineRows.map((gig, i) => {
                                    const label = formatOrderStatus(gig.status);
                                    const barColor = label.color === "blue" ? "bg-blue-400" : label.color === "emerald" ? "bg-emerald-400" : "bg-amber-400";
                                    const chipColor = label.color === "blue" ? "bg-blue-50 text-blue-700" : label.color === "emerald" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700";
                                    return (
                                        <div key={gig.id + i} className="p-0 border border-[var(--border-default)] shadow-[var(--shadow-subtle)] rounded-lg bg-white overflow-hidden group hover:-translate-y-1 hover:border-[var(--accent-primary)]/40 hover:shadow-[var(--shadow-soft)] transition-all duration-300 cursor-pointer">
                                            <div className="flex flex-col sm:flex-row h-full">
                                                <div className={cn("w-full sm:w-3 h-3 sm:h-auto", barColor)} />
                                                <div className="flex-1 p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                                                    <div className="flex flex-col">
                                                        <h3 className="font-bold text-[var(--text-primary)] text-xl mb-2 group-hover:text-[var(--accent-primary)] transition-colors">{gig.title}</h3>
                                                        <div className="flex items-center gap-3 text-base text-[var(--text-secondary)] font-medium">
                                                            <span>{gig.district}</span>
                                                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--border-strong)]" />
                                                            <span className={cn("font-bold px-2 py-0.5 rounded-md text-sm", chipColor)}>{label.text}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-6 self-end sm:self-auto">
                                                        <div className="flex flex-col items-end">
                                                            <span className="font-bold text-[var(--text-primary)] text-2xl">${gig.amount.toLocaleString("en-US")}</span>
                                                            <span className="text-xs text-[var(--text-tertiary)] font-bold uppercase tracking-widest mt-1">{gig.startDate ?? ""}</span>
                                                        </div>
                                                        <div className="h-12 w-12 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-center group-hover:bg-[var(--accent-primary)] group-hover:text-white transition-colors">
                                                            <ArrowRight weight="bold" className="w-5 h-5" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Right Sidebar - Calendar & Messages (Spans 4) */}
                        <div className="lg:col-span-4 flex flex-col gap-8">

                            {/* Schedule Overview */}
                            <div className="p-8 border border-[var(--border-default)] shadow-[var(--shadow-soft)] rounded-lg bg-white flex flex-col">
                                <div className="flex justify-between items-center mb-8">
                                    <h2 className="font-heading text-2xl font-bold text-[var(--text-primary)]">Up Next</h2>
                                    <div className="p-2 bg-[var(--bg-subtle)] rounded-lg">
                                        <CalendarCheck weight="fill" className="w-6 h-6 text-[var(--accent-secondary)]" />
                                    </div>
                                </div>

	                                <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-6 text-center">
	                                    <p className="font-bold text-[var(--text-primary)] mb-2">No upcoming bookings</p>
	                                    <p className="text-sm text-[var(--text-secondary)]">
	                                        Accepted engagements and district meetings will appear here once they are scheduled.
	                                    </p>
	                                </div>
	                            </div>

	                            {/* Unread Messages */}
	                            <Link href="/dashboard/messages" className="p-10 border border-[var(--border-default)] shadow-[var(--shadow-subtle)] rounded-lg bg-[var(--bg-subtle)] flex flex-col items-center justify-center text-center hover:border-[var(--accent-primary)]/40 hover:shadow-[var(--shadow-soft)] transition-all">
	                                <div className="w-20 h-20 rounded-full bg-white shadow-md flex items-center justify-center mb-6 text-emerald-600">
	                                    <ChatCircle weight="fill" className="w-10 h-10" />
	                                </div>
	                                <h3 className="font-heading text-xl font-bold text-[var(--text-primary)] mb-2">Messages</h3>
	                                <p className="text-base text-[var(--text-secondary)] font-medium">Open conversations with districts and respond to new requests.</p>
	                            </Link>

                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}
