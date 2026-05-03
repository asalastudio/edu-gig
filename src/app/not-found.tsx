"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { PrimaryButton } from "@/components/shared/button";
import { MagnifyingGlass, Briefcase, House, Lifebuoy } from "@phosphor-icons/react";
import { supportMailto } from "@/lib/legal";

const recoveryLinks = [
    { href: "/browse", label: "Browse educators", icon: MagnifyingGlass },
    { href: "/post", label: "Post a need", icon: Briefcase },
    { href: "/", label: "Home", icon: House },
    { href: supportMailto("K12Gig broken link support"), label: "Contact support", icon: Lifebuoy },
];

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[var(--bg-app)] flex flex-col font-sans">
            <SiteHeader />
            <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-16 lg:py-24 text-center">
                <div className="education-rule mx-auto mb-6" />
                <p className="text-sm font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-4">
                    404
                </p>
                <h1 className="font-heading text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-4">
                    Page not found
                </h1>
                <p className="text-lg text-[var(--text-secondary)] max-w-xl mx-auto mb-10">
                    This link may have moved, expired, or never existed. You can get back to the marketplace from one of these paths.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
                    {recoveryLinks.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-3 rounded-lg border border-[var(--border-default)] bg-white px-5 py-4 text-left font-bold text-[var(--text-primary)] shadow-[var(--shadow-subtle)] hover:border-[var(--accent-primary)]/40 hover:bg-[var(--bg-subtle)] hover:shadow-[var(--shadow-soft)] transition-all"
                        >
                            <item.icon className="w-5 h-5 text-[var(--accent-primary)]" weight="bold" />
                            {item.label}
                        </Link>
                    ))}
                </div>
                <Link href="/browse">
                    <PrimaryButton>Find an educator</PrimaryButton>
                </Link>
            </main>
            <SiteFooter />
        </div>
    );
}
