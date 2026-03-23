"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/shared/sidebar";
import { Briefcase, TrendUp, Users, CalendarCheck, ArrowRight, CheckCircle, WarningCircle, X, Power } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export default function EducatorDashboardPage() {
    const [showAlert, setShowAlert] = useState(true);
    const [isActive, setIsActive] = useState(true);

    return (
        <div className="flex h-screen bg-[var(--bg-subtle)] font-sans">
            <Sidebar />
            <main className="flex-1 overflow-y-auto w-full relative">
                
                {/* Action Center Banner */}
                {showAlert && (
                    <div className="w-full bg-blue-100 border-b border-blue-300 py-4 px-8 lg:px-12 flex items-center justify-between shadow-sm z-10 relative">
                        <div className="flex items-center gap-4 text-blue-900">
                            <WarningCircle weight="fill" className="w-6 h-6 text-blue-600" />
                            <span className="text-base font-bold">Action Required: <span className="font-medium">District 204 has sent you a message regarding your recent proposal.</span></span>
                            <button onClick={() => alert("Opening message thread...")} className="ml-2 text-sm font-black uppercase tracking-wider underline hover:text-blue-700 transition-colors flex items-center gap-1">Reply Now <ArrowRight weight="bold" className="w-4 h-4" /></button>
                        </div>
                        <button onClick={() => setShowAlert(false)} className="text-blue-600 hover:text-blue-900 hover:bg-blue-200 p-1.5 rounded-full transition-colors">
                            <X weight="bold" className="w-5 h-5" />
                        </button>
                    </div>
                )}

                <div className="max-w-[1600px] w-full mx-auto px-8 lg:px-12 py-10 flex flex-col gap-10">

                    {/* Header Row */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[var(--border-subtle)] pb-8">
                        <div>
                            <h1 className="font-heading text-4xl font-bold text-[var(--text-primary)] tracking-tight mb-2">
                                Educator Dashboard
                            </h1>
                            <p className="text-lg text-[var(--text-secondary)] font-medium">Welcome back, Sarah. Track your active gigs and earnings pipeline.</p>
                        </div>
                        
                        <div className="flex items-center gap-4 bg-white p-2.5 pr-5 rounded-2xl border border-[var(--border-subtle)] shadow-sm hover:shadow-md transition-shadow">
                            <button 
                                onClick={() => setIsActive(!isActive)}
                                className={cn(
                                    "relative flex items-center justify-center w-14 h-10 rounded-xl transition-colors shadow-inner",
                                    isActive ? "bg-emerald-500 text-white" : "bg-[var(--border-strong)] text-white"
                                )}
                            >
                                {isActive ? <Power weight="bold" className="w-5 h-5" /> : <Power className="w-5 h-5" />}
                            </button>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-[var(--text-primary)] leading-none mb-1">
                                    {isActive ? "Accepting Offers" : "Paused / Booked"}
                                </span>
                                <span className="text-xs font-medium text-[var(--text-tertiary)] leading-none">
                                    Profile Visibility Toggle
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats Banner (Sales CRM style) */}
                    <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-[var(--border-subtle)] p-0 border border-[var(--border-subtle)] shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-3xl bg-white overflow-hidden">
                        {[
                            { label: "Pipeline (Active Orders)", value: "$6,200", sub: "3 Active Gigs", icon: Briefcase, color: "blue" },
                            { label: "Profile Conversions", value: "8.4%", sub: "48 Profile Views", icon: Users, color: "emerald", trend: "+1.2%" },
                            { label: "Total Earnings YTD", value: "$14,500", sub: "12 completed tasks", icon: TrendUp, color: "amber", trend: "+$2.1k" },
                        ].map((stat, i) => (
                            <div key={i} className="flex-1 p-8 flex items-start justify-between min-w-[250px] hover:bg-[var(--bg-hover)] transition-colors">
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-3">{stat.label}</span>
                                    <div className="flex items-center gap-3">
                                        <span className="font-heading text-4xl font-bold text-[var(--text-primary)]">{stat.value}</span>
                                        {stat.trend && (
                                            <span className="px-2.5 py-1 rounded-md bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-sm font-bold text-[var(--text-primary)]">
                                                {stat.trend}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-sm font-medium text-[var(--text-secondary)] mt-2">{stat.sub}</span>
                                </div>
                                <div className={cn(
                                    "p-4 rounded-2xl shadow-sm border",
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
                                {[
                                    { title: "Curriculum Mapping Workshop", district: "Lincoln Tech High", status: "In Progress", amount: "$800", date: "Due in 3 days" },
                                    { title: "Long-Term Math Substitute", district: "Westside ISD", status: "Review pending", amount: "$4,200", date: "Completed on Monday" },
                                    { title: "Bilingual Resource Teacher", district: "Austin Elementary", status: "Awaiting signature", amount: "$1,200", date: "Starts next week" }
                                ].map((gig, i) => (
                                    <div key={i} className="p-0 border border-[var(--border-subtle)] shadow-[0_8px_30px_rgba(0,0,0,0.03)] rounded-3xl bg-white overflow-hidden group hover:-translate-y-1 hover:border-[var(--accent-primary)]/40 hover:shadow-lg transition-all duration-300 cursor-pointer">
                                        <div className="flex flex-col sm:flex-row h-full">
                                            {/* Status indicator bar */}
                                            <div className={cn(
                                                "w-full sm:w-3 h-3 sm:h-auto",
                                                i === 0 ? "bg-blue-400" : i === 1 ? "bg-emerald-400" : "bg-amber-400"
                                            )} />

                                            <div className="flex-1 p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                                                <div className="flex flex-col">
                                                    <h3 className="font-bold text-[var(--text-primary)] text-xl mb-2 group-hover:text-[var(--accent-primary)] transition-colors">{gig.title}</h3>
                                                    <div className="flex items-center gap-3 text-base text-[var(--text-secondary)] font-medium">
                                                        <span>{gig.district}</span>
                                                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--border-strong)]" />
                                                        <span className={cn(
                                                            "font-bold px-2 py-0.5 rounded-md text-sm",
                                                            i === 0 ? "bg-blue-50 text-blue-700" : i === 1 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                                                        )}>{gig.status}</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-6 self-end sm:self-auto">
                                                    <div className="flex flex-col items-end">
                                                        <span className="font-bold text-[var(--text-primary)] text-2xl">{gig.amount}</span>
                                                        <span className="text-xs text-[var(--text-tertiary)] font-bold uppercase tracking-widest mt-1">{gig.date}</span>
                                                    </div>
                                                    <div className="h-12 w-12 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-center group-hover:bg-[var(--accent-primary)] group-hover:text-white transition-colors">
                                                        <ArrowRight weight="bold" className="w-5 h-5" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Sidebar - Calendar & Messages (Spans 4) */}
                        <div className="lg:col-span-4 flex flex-col gap-8">

                            {/* Schedule Overview */}
                            <div className="p-8 border border-[var(--border-subtle)] shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-3xl bg-white flex flex-col">
                                <div className="flex justify-between items-center mb-8">
                                    <h2 className="font-heading text-2xl font-bold text-[var(--text-primary)]">Up Next</h2>
                                    <div className="p-2 bg-[var(--bg-subtle)] rounded-xl">
                                        <CalendarCheck weight="fill" className="w-6 h-6 text-[var(--accent-secondary)]" />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-6 relative">
                                    <div className="absolute left-[13px] top-6 bottom-6 w-0.5 bg-[var(--border-subtle)]" />

                                    {[
                                        { time: "09:00 AM", title: "Lincoln Interview", type: "Virtual", state: "current" },
                                        { time: "02:30 PM", title: "Review Contract", type: "Admin", state: "upcoming" }
                                    ].map((event, i) => (
                                        <div key={i} className="flex gap-5 relative z-10 group cursor-pointer">
                                            <div className={cn(
                                                "w-7 h-7 rounded-full border-4 border-white flex-shrink-0 mt-1 shadow-sm transition-colors",
                                                event.state === 'current' ? "bg-[var(--accent-secondary)]" : "bg-[var(--border-strong)] group-hover:bg-[var(--accent-primary)]"
                                            )} />
                                            <div className="flex flex-col bg-[var(--bg-subtle)] p-5 rounded-2xl flex-1 border border-[var(--border-subtle)] group-hover:border-[var(--accent-primary)]/40 group-hover:shadow-md transition-all">
                                                <span className="text-sm font-bold text-[var(--accent-primary)] mb-1">{event.time}</span>
                                                <span className="font-bold text-[var(--text-primary)] text-base group-hover:text-[var(--accent-primary)] transition-colors">{event.title}</span>
                                                <span className="text-sm text-[var(--text-secondary)] font-medium mt-1">{event.type}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={() => alert("Loading full calendar...")} className="w-full mt-6 py-3 text-sm font-bold text-[var(--text-secondary)] bg-white border-2 border-[var(--border-strong)] rounded-xl hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-all">
                                    View Full Calendar
                                </button>
                            </div>

                            {/* Unread Messages */}
                            <div className="p-10 border border-[var(--border-subtle)] shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-3xl bg-[var(--bg-subtle)] flex flex-col items-center justify-center text-center">
                                <div className="w-20 h-20 rounded-full bg-white shadow-md flex items-center justify-center mb-6 text-emerald-600">
                                    <CheckCircle weight="fill" className="w-10 h-10" />
                                </div>
                                <h3 className="font-heading text-xl font-bold text-[var(--text-primary)] mb-2">Inbox Zero</h3>
                                <p className="text-base text-[var(--text-secondary)] font-medium">You&apos;re all caught up on district communications today.</p>
                            </div>

                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}
