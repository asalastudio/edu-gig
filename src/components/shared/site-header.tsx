"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { UserButton } from "@clerk/nextjs";
import { PrimaryButton } from "./button";
import { ArrowRight, List, X } from "@phosphor-icons/react";
import { BrandLogo } from "@/components/shared/brand-logo";
import { isDistrictRole } from "@/lib/roles";

export function SiteHeader() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const viewer = useQuery(api.users.viewer, {});
    const loading = viewer === undefined;
    const signedIn = !!viewer;

    let dashboardHref = "/onboarding";
    if (viewer) {
        if (viewer.onboarded) {
            if (viewer.role === "superadmin") {
                dashboardHref = "/dashboard/admin";
            } else if (isDistrictRole(viewer.role)) {
                dashboardHref = "/dashboard/district";
            } else {
                dashboardHref = "/dashboard/educator";
            }
        }
    }

    return (
        <header className="w-full bg-[var(--bg-surface)]/90 backdrop-blur-md border-b border-[var(--border-default)] sticky top-0 z-50 shadow-[0_1px_0_rgba(255,255,255,0.7)] dark:shadow-none">
            <div className="max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center justify-between gap-4">
                <Link href="/" className="flex-shrink-0 group" aria-label="K12Gig home">
                    <BrandLogo className="transition-transform group-hover:-translate-y-0.5" />
                </Link>
                
                <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-[var(--text-secondary)]">
                    <Link href="/browse" className="hover:text-[var(--accent-primary)] transition-colors">Browse Educators</Link>
                    <Link href="/post" className="hover:text-[var(--accent-primary)] transition-colors">Post a Need</Link>
                    <Link href="/pricing" className="hover:text-[var(--accent-primary)] transition-colors">Pricing</Link>
                    <Link href="/#for-districts" className="hover:text-[var(--accent-primary)] transition-colors">How It Works</Link>
                </nav>
                
                <div className="hidden md:flex items-center gap-4 justify-end">
                    {!loading && signedIn && (
                        <div className="flex items-center gap-4">
                            <Link href={dashboardHref}>
                                <PrimaryButton className="text-sm px-4 min-h-9 h-9">
                                    Dashboard
                                </PrimaryButton>
                            </Link>
                            <div className="flex items-center shrink-0 border-l border-[var(--border-default)] pl-4">
                                <UserButton />
                            </div>
                        </div>
                    )}

                    {!loading && !signedIn && (
                        <>
                            <Link
                                href="/login"
                                className="text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors whitespace-nowrap"
                            >
                                Sign in
                            </Link>
                            <Link href="/login">
                                <PrimaryButton className="text-sm px-4 min-h-9 h-9">
                                    Get started <ArrowRight weight="bold" className="h-3.5 w-3.5" />
                                </PrimaryButton>
                            </Link>
                        </>
                    )}

                    {loading && (
                        <div className="h-9 w-24 bg-[var(--bg-hover)] animate-pulse rounded-lg border border-[var(--border-default)]" />
                    )}
                </div>

                <div className="lg:hidden flex items-center gap-3">
                    <button 
                        className="p-2 -mr-2 text-[var(--text-primary)]"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                    >
                        {mobileMenuOpen ? <X weight="bold" className="h-6 w-6" /> : <List weight="bold" className="h-6 w-6" />}
                    </button>
                </div>
            </div>

            {mobileMenuOpen && (
                <div className="lg:hidden absolute top-16 left-0 w-full bg-[var(--bg-surface)] border-b border-[var(--border-default)] shadow-[var(--shadow-soft)] flex flex-col p-6 gap-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <Link href="/browse" className="text-[var(--text-primary)] font-semibold" onClick={() => setMobileMenuOpen(false)}>Browse Educators</Link>
                    <Link href="/post" className="text-[var(--text-primary)] font-semibold" onClick={() => setMobileMenuOpen(false)}>Post a Need</Link>
                    <Link href="/pricing" className="text-[var(--text-primary)] font-semibold" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
                    <Link href="/#for-districts" className="text-[var(--text-primary)] font-semibold" onClick={() => setMobileMenuOpen(false)}>How It Works</Link>
                    
                    <hr className="border-[var(--border-subtle)] my-1" />

                    {!loading && signedIn && (
                        <div className="flex items-center justify-between gap-4 py-2">
                            <Link href={dashboardHref} className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                                <PrimaryButton className="w-full">Dashboard</PrimaryButton>
                            </Link>
                             <div className="border border-[var(--border-default)] p-1 rounded-full flex items-center justify-center">
                                <UserButton />
                            </div>
                        </div>
                    )}

                    {!loading && !signedIn && (
                        <>
                            <Link href="/login" className="text-[var(--text-primary)] font-bold text-center py-2" onClick={() => setMobileMenuOpen(false)}>
                                Sign in
                            </Link>
                            <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                                <PrimaryButton className="w-full">Get started</PrimaryButton>
                            </Link>
                        </>
                    )}
                </div>
            )}
        </header>
    );
}
