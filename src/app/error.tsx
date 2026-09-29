"use client";

import { useEffect } from "react";
import Link from "next/link";
import { PrimaryButton } from "@/components/shared/button";

/**
 * Last-resort boundary so a failed query or render shows a way back instead of
 * a blank screen (e.g. a Convex call that runs before sign-in finishes).
 */
export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <main id="main-content" className="min-h-screen flex items-center justify-center bg-[var(--bg-app)] px-6">
            <div className="max-w-md w-full rounded-lg border border-[var(--border-default)] bg-white p-8 text-center shadow-[var(--shadow-soft)]">
                <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)]">Something went wrong</h1>
                <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                    This page didn&apos;t load. Try again — if it keeps happening, email support@k12gig.com.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <PrimaryButton type="button" onClick={reset}>Try again</PrimaryButton>
                    <Link
                        href="/"
                        className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[var(--border-strong)] px-4 text-sm font-bold text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                    >
                        Go to home
                    </Link>
                </div>
            </div>
        </main>
    );
}
