"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/shared/sidebar";

/**
 * The educator Open Needs board has been folded into the shared Gig Board at
 * `/dashboard/board`. This route now just redirects so old links and
 * notifications keep working without a second competing surface.
 */
export default function EducatorNeedsRedirectPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/dashboard/board");
    }, [router]);

    return (
        <div className="flex h-screen bg-[var(--bg-subtle)] font-sans pt-14 lg:pt-0">
            <Sidebar />
            <main className="flex-1 overflow-y-auto w-full relative">
                <div className="max-w-[1600px] w-full mx-auto px-8 lg:px-12 py-10">
                    <p className="text-[var(--text-secondary)]">Redirecting…</p>
                </div>
            </main>
        </div>
    );
}
