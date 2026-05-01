"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PrimaryButton } from "./button";
import { List, X } from "@phosphor-icons/react";
import { AUTH_INTENT_PARAM } from "@/lib/auth-intent";

export function SiteHeader() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <header className="w-full bg-[--bg-surface]/80 backdrop-blur-md border-b border-[--border-subtle] sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center justify-between gap-4">
                <Link href="/" className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-heading text-2xl font-bold text-[--accent-primary]">K12Gig</span>
                </Link>
                
                <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-[--text-secondary]">
                    <Link href="/browse" className="hover:text-[--text-primary] transition-colors">Browse Educators</Link>
                    <Link href="/post" className="hover:text-[--text-primary] transition-colors">Post a Need</Link>
                    <Link href="/#for-districts" className="hover:text-[--text-primary] transition-colors">How It Works</Link>
                </nav>
                
                <div className="hidden md:flex items-center gap-3 flex-wrap justify-end">
                    <Link
                        href={`/sign-in?${AUTH_INTENT_PARAM}=district`}
                        className="text-sm font-semibold text-[--text-secondary] hover:text-[--accent-primary] transition-colors whitespace-nowrap"
                    >
                        Sign in — Hire
                    </Link>
                    <span className="text-[--text-tertiary] select-none" aria-hidden>|</span>
                    <Link
                        href={`/sign-in?${AUTH_INTENT_PARAM}=educator`}
                        className="text-sm font-semibold text-[--text-secondary] hover:text-[--accent-primary] transition-colors whitespace-nowrap"
                    >
                        Sign in — Educators
                    </Link>
                    <Link href="/login" className="text-xs font-medium text-[--text-tertiary] hover:text-[--text-primary] ml-1">
                        All options
                    </Link>
                    <Link href="/browse" className="ml-1">
                        <PrimaryButton className="text-sm">Find an Educator</PrimaryButton>
                    </Link>
                </div>

                <button 
                    className="md:hidden p-2 -mr-2 text-[--text-primary]"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                >
                    {mobileMenuOpen ? <X weight="bold" className="h-6 w-6" /> : <List weight="bold" className="h-6 w-6" />}
                </button>
            </div>

            {mobileMenuOpen && (
                <div className="md:hidden absolute top-16 left-0 w-full bg-white border-b border-[--border-subtle] shadow-lg flex flex-col p-6 gap-4 z-50">
                    <Link href="/browse" className="text-[--text-primary] font-medium" onClick={() => setMobileMenuOpen(false)}>Browse Educators</Link>
                    <Link href="/post" className="text-[--text-primary] font-medium" onClick={() => setMobileMenuOpen(false)}>Post a Need</Link>
                    <Link href="/#for-districts" className="text-[--text-primary] font-medium" onClick={() => setMobileMenuOpen(false)}>How It Works</Link>
                    <hr className="border-[--border-subtle] my-2" />
                    <Link href={`/sign-in?${AUTH_INTENT_PARAM}=district`} className="text-[--text-primary] font-semibold" onClick={() => setMobileMenuOpen(false)}>
                        Sign in — Hire (district)
                    </Link>
                    <Link href={`/sign-in?${AUTH_INTENT_PARAM}=educator`} className="text-[--text-primary] font-semibold" onClick={() => setMobileMenuOpen(false)}>
                        Sign in — Educators
                    </Link>
                    <Link href="/login" className="text-sm text-[--text-tertiary] font-medium" onClick={() => setMobileMenuOpen(false)}>More sign-in options</Link>
                    <Link href="/browse" onClick={() => setMobileMenuOpen(false)}>
                        <PrimaryButton className="w-full mt-2">Find an Educator</PrimaryButton>
                    </Link>
                </div>
            )}
        </header>
    );
}
