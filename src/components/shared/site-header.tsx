"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PrimaryButton } from "./button";
import { List, X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export function SiteHeader() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <header className="w-full bg-[--bg-surface]/80 backdrop-blur-md border-b border-[--border-subtle] sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <span className="font-heading text-2xl font-bold text-[--accent-primary]">EduGig</span>
                </Link>
                
                <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[--text-secondary]">
                    <Link href="/browse" className="hover:text-[--text-primary] transition-colors">Browse Educators</Link>
                    <Link href="/post" className="hover:text-[--text-primary] transition-colors">Post a Need</Link>
                    <Link href="/#for-districts" className="hover:text-[--text-primary] transition-colors">How It Works</Link>
                </nav>
                
                <div className="hidden md:flex items-center gap-4">
                    <Link href="/dashboard/district" className="text-sm font-medium text-[--text-primary] hover:text-[--accent-primary] transition-colors">Sign In</Link>
                    <Link href="/browse">
                        <PrimaryButton>Find an Educator</PrimaryButton>
                    </Link>
                </div>

                <button 
                    className="md:hidden p-2 -mr-2 text-[--text-primary]"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X weight="bold" className="h-6 w-6" /> : <List weight="bold" className="h-6 w-6" />}
                </button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden absolute top-16 left-0 w-full bg-white border-b border-[--border-subtle] shadow-lg flex flex-col p-6 gap-4">
                    <Link href="/browse" className="text-[--text-primary] font-medium" onClick={() => setMobileMenuOpen(false)}>Browse Educators</Link>
                    <Link href="/post" className="text-[--text-primary] font-medium" onClick={() => setMobileMenuOpen(false)}>Post a Need</Link>
                    <Link href="/#for-districts" className="text-[--text-primary] font-medium" onClick={() => setMobileMenuOpen(false)}>How It Works</Link>
                    <hr className="border-[--border-subtle] my-2" />
                    <Link href="/dashboard/district" className="text-[--text-primary] font-medium" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
                    <Link href="/browse" onClick={() => setMobileMenuOpen(false)}>
                        <PrimaryButton className="w-full mt-2">Find an Educator</PrimaryButton>
                    </Link>
                </div>
            )}
        </header>
    );
}
