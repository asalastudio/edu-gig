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
        <div className="fixed inset-x-3 bottom-2 z-[80] pointer-events-none sm:inset-x-auto sm:bottom-5 sm:right-5 sm:max-w-sm">
            <div className="flex flex-col gap-2 rounded-lg border border-[var(--border-default)] bg-white p-3 shadow-[0_14px_44px_rgba(22,32,26,0.18)] pointer-events-auto sm:gap-3 sm:p-4">
                <div>
                    <p className="font-heading text-sm font-bold text-[var(--text-primary)]">
                        Cookies for sign-in and security
                    </p>
                    <p className="mt-1 text-xs leading-4 text-[var(--text-secondary)] sm:leading-5">
                        We use required cookies for secure sign-in and optional analytics. See{" "}
                        <Link href="/privacy" className="font-bold text-[var(--accent-primary)] hover:underline">Privacy</Link>
                        {" "}and <Link href="/terms" className="font-bold text-[var(--accent-primary)] hover:underline">Terms</Link>.
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row">
                    <button
                        type="button"
                        onClick={() => accept("essential")}
                        className="inline-flex min-h-8 items-center justify-center rounded-lg border border-[var(--border-strong)] bg-white px-3 py-2 text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] sm:min-h-9"
                    >
                        Essential only
                    </button>
                    <PrimaryButton type="button" onClick={() => accept("all")} className="min-h-8 px-3 py-2 text-xs sm:min-h-9">
                        Accept all
                    </PrimaryButton>
                </div>
            </div>
        </div>
    );
}
