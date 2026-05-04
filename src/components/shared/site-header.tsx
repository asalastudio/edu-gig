"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PrimaryButton } from "./button";
import { ArrowRight, List, X } from "@phosphor-icons/react";
import { BrandLogo } from "@/components/shared/brand-logo";

export function SiteHeader() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <header className="w-full bg-[var(--bg-surface)]/90 backdrop-blur-md border-b border-[var(--border-default)] sticky top-0 z-50 shadow-[0_1px_0_rgba(255,255,255,0.7)]">
            <div className="max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center justify-between gap-4">
                <Link href="/" className="flex-shrink-0 group" aria-label="K12Gig home">
                    <BrandLogo className="transition-transform group-hover:-translate-y-0.5" />
                </Link>
                
                <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-[var(--text-secondary)]">
                    <Link href="/browse" className="hover:text-[var(--accent-primary)] transition-colors">Browse Educators</Link>
                    <Link href="/post" className="hover:text-[var(--accent-primary)] transition-colors">Post a Need</Link>
                    <Link href="/#for-districts" className="hover:text-[var(--accent-primary)] transition-colors">How It Works</Link>
                </nav>
                
                <div className="hidden md:flex items-center gap-3 justify-end">
                    <Link
                        href="/login"
                        className="text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors whitespace-nowrap"
                    >
                        Sign in
                    </Link>
                    <Link href="/sign-up">
                        <PrimaryButton className="text-sm">
                            Get started <ArrowRight weight="bold" className="h-4 w-4" />
                        </PrimaryButton>
                    </Link>
                </div>

                <button 
                    className="md:hidden p-2 -mr-2 text-[var(--text-primary)]"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                >
                    {mobileMenuOpen ? <X weight="bold" className="h-6 w-6" /> : <List weight="bold" className="h-6 w-6" />}
                </button>
            </div>

            {mobileMenuOpen && (
                <div className="md:hidden absolute top-16 left-0 w-full bg-white border-b border-[var(--border-default)] shadow-[var(--shadow-soft)] flex flex-col p-6 gap-4 z-50">
                    <Link href="/browse" className="text-[var(--text-primary)] font-medium" onClick={() => setMobileMenuOpen(false)}>Browse Educators</Link>
                    <Link href="/post" className="text-[var(--text-primary)] font-medium" onClick={() => setMobileMenuOpen(false)}>Post a Need</Link>
                    <Link href="/#for-districts" className="text-[var(--text-primary)] font-medium" onClick={() => setMobileMenuOpen(false)}>How It Works</Link>
                    <hr className="border-[var(--border-subtle)] my-2" />
                    <Link href="/login" className="text-[var(--text-primary)] font-semibold" onClick={() => setMobileMenuOpen(false)}>
                        Sign in
                    </Link>
                    <Link href="/sign-up" onClick={() => setMobileMenuOpen(false)}>
                        <PrimaryButton className="w-full mt-2">Get started</PrimaryButton>
                    </Link>
                </div>
            )}
        </header>
    );
}
