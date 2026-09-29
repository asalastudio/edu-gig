"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PrimaryButton } from "@/components/shared/button";

const CONSENT_KEY = "k12gig_cookie_consent_v1";

type ConsentChoice = "essential" | "all";

function saveConsent(choice: ConsentChoice) {
    window.localStorage.setItem(
        CONSENT_KEY,
        JSON.stringify({ choice, savedAt: new Date().toISOString() })
    );
    document.cookie = `k12gig_cookie_consent=${choice}; Max-Age=31536000; Path=/; SameSite=Lax`;
}

export function CookieConsent() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            try {
                setVisible(!window.localStorage.getItem(CONSENT_KEY));
            } catch {
                setVisible(false);
            }
        }, 0);
        return () => window.clearTimeout(timer);
    }, []);

    if (!visible) return null;

    const accept = (choice: ConsentChoice) => {
        saveConsent(choice);
        setVisible(false);
    };

    return (
        <section
            aria-label="Cookie preferences"
            className="fixed inset-x-3 bottom-2 z-[80] pointer-events-none sm:inset-x-auto sm:bottom-5 sm:right-5 sm:max-w-sm"
        >
            {/* Compact single row on phones so it doesn't cover forms; full card from sm up. */}
            <div className="flex items-center gap-3 rounded-lg border border-[var(--border-default)] bg-white px-3 py-2 shadow-[0_14px_44px_rgba(22,32,26,0.18)] pointer-events-auto sm:flex-col sm:items-stretch sm:gap-3 sm:p-4">
                <div className="min-w-0 flex-1">
                    <p className="font-heading text-xs font-bold text-[var(--text-primary)] sm:text-sm">
                        Cookies for sign-in and security
                    </p>
                    <p className="mt-0.5 text-[11px] leading-4 text-[var(--text-secondary)] sm:mt-1 sm:text-xs sm:leading-5">
                        <span className="hidden sm:inline">We use required cookies for secure sign-in and optional analytics. See </span>
                        <Link href="/privacy" className="font-bold text-[var(--accent-primary)] hover:underline">Privacy</Link>
                        {" "}and <Link href="/terms" className="font-bold text-[var(--accent-primary)] hover:underline">Terms</Link>
                        <span className="hidden sm:inline">.</span>
                    </p>
                </div>
                <div className="flex shrink-0 gap-2 sm:grid sm:grid-cols-2">
                    <button
                        type="button"
                        onClick={() => accept("essential")}
                        className="inline-flex min-h-9 items-center justify-center rounded-lg border border-[var(--border-strong)] bg-white px-3 py-2 text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]"
                    >
                        <span className="sm:hidden">Essential</span>
                        <span className="hidden sm:inline">Essential only</span>
                    </button>
                    <PrimaryButton type="button" onClick={() => accept("all")} className="min-h-9 px-3 py-2 text-xs">
                        Accept all
                    </PrimaryButton>
                </div>
            </div>
        </section>
    );
}
