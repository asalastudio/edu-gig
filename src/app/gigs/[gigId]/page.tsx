"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { PrimaryButton } from "@/components/shared/button";
import { isLegacyCheckoutEnabled } from "@/lib/launch-flags";

export default function GigCheckoutPage() {
    const params = useParams<{ gigId: string }>();
    const gigId = typeof params.gigId === "string" ? params.gigId : "";
    const looksLikeConvexId = gigId.length >= 20 && !gigId.includes("-");
    const gigData = useQuery(
        api.gigs.getById,
        looksLikeConvexId && isLegacyCheckoutEnabled() ? { gigId: gigId as Id<"gigs"> } : "skip"
    );

    return (
        <div className="min-h-screen bg-[var(--bg-app)] flex flex-col font-sans">
            <SiteHeader />
            <main className="flex-1 py-16 px-6">
                <div className="max-w-2xl mx-auto rounded-lg border border-[var(--border-subtle)] bg-white p-8 text-center">
                    <h1 className="font-heading text-3xl font-bold mb-3">Checkout is not part of K12Gig</h1>
                    <p className="text-[var(--text-secondary)] leading-7 mb-6">
                        {gigData ? `${gigData.educatorName} · ${gigData.gig.title}. ` : ""}
                        Districts post a need, review proposals, and coordinate contracts in Contract Hub. Payment is arranged directly with the consultant.
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                        <Link href="/post"><PrimaryButton>Post a need</PrimaryButton></Link>
                        <Link href="/browse" className="inline-flex items-center px-4 py-2 rounded-md border border-[var(--border-strong)] text-sm font-bold">Browse consultants</Link>
                    </div>
                </div>
            </main>
            <SiteFooter />
        </div>
    );
}
