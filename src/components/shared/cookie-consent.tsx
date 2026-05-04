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
        <div className="fixed left-4 right-4 top-20 z-[80] pointer-events-none sm:left-auto sm:max-w-md">
            <div className="flex flex-col gap-4 rounded-lg border border-[var(--border-default)] bg-white p-5 shadow-[0_18px_60px_rgba(22,32,26,0.22)] pointer-events-auto">
                <div>
                    <p className="font-heading text-base font-bold text-[var(--text-primary)]">
                        Cookies for sign-in, security, and product improvement
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                        K12Gig uses required cookies for authentication and account security. Optional analytics cookies help us improve hiring workflows for districts and educators.
                        See our <Link href="/privacy" className="font-bold text-[var(--accent-primary)] hover:underline">Privacy Policy</Link>
                        {" "}and <Link href="/terms" className="font-bold text-[var(--accent-primary)] hover:underline">Terms of Service</Link>.
                    </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                        type="button"
                        onClick={() => accept("essential")}
                        className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[var(--border-strong)] bg-white px-4 py-2 text-sm font-bold text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]"
                    >
                        Essential only
                    </button>
                    <PrimaryButton type="button" onClick={() => accept("all")}>
                        Accept all
                    </PrimaryButton>
                </div>
            </div>
        </div>
    );
}
