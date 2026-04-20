"use client";

import React from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Sidebar } from "@/components/shared/sidebar";
import { PageHeader } from "@/components/shared/page-header";
import { PrimaryButton } from "@/components/shared/button";
import { Card } from "@/components/shared/card";
import { ArrowLeft, Briefcase, Plus } from "@phosphor-icons/react";
import { getAreaOfNeedLabel } from "@/lib/taxonomy";
import { formatPrice, type PricingType } from "@/lib/map-review";
import type { Id } from "@/convex/_generated/dataModel";

type GigCard = {
    id: string;
    title: string;
    areaOfNeed: string;
    pricingType: PricingType;
    price: number;
    isActive: boolean;
    createdAt: number;
};

const DEMO_CARDS: GigCard[] = [
    {
        id: "demo-1",
        title: "Curriculum Mapping Workshop",
        areaOfNeed: "instruction_curriculum",
        pricingType: "fixed",
        price: 800,
        isActive: true,
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
    },
    {
        id: "demo-2",
        title: "Coaching Session",
        areaOfNeed: "leadership",
        pricingType: "hourly",
        price: 75,
        isActive: true,
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    },
];

function formatCreatedAt(ts: number): string {
    const d = new Date(ts);
    return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

export default function EducatorMyGigsPage() {
    const viewer = useQuery(api.users.viewer, {});
    const gigs = useQuery(api.gigs.listMine, viewer ? {} : "skip");
    const deactivate = useMutation(api.gigs.deactivate);

    const isDemo = viewer === null;
    const cards: GigCard[] = isDemo
        ? DEMO_CARDS
        : (gigs ?? []).map((g) => ({
              id: g._id as string,
              title: g.title,
              areaOfNeed: g.areaOfNeed,
              pricingType: g.pricingType,
              price: g.price,
              isActive: g.isActive,
              createdAt: g.createdAt,
          }));

    const isEmpty = !isDemo && Array.isArray(gigs) && gigs.length === 0;

    const handleDeactivate = async (id: string) => {
        if (isDemo) {
            window.alert("Demo mode — sign in to deactivate a real gig.");
            return;
        }
        if (!window.confirm("Deactivate this gig? Buyers will no longer be able to find it.")) return;
        try {
            await deactivate({ gigId: id as Id<"gigs"> });
        } catch (err) {
            console.error(err);
            window.alert(err instanceof Error ? err.message : "Could not deactivate gig.");
        }
    };

    return (
        <div className="flex h-screen bg-[var(--bg-subtle)] font-sans">
            <Sidebar />
            <main className="flex-1 overflow-y-auto w-full relative">
                <div className="max-w-[1600px] w-full mx-auto px-8 lg:px-12 py-10">
                    <Link
                        href="/dashboard/educator"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--accent-primary)] mb-8"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to dashboard
                    </Link>
                    <PageHeader
                        title="My Gigs"
                        description="Your service listings."
                        actions={
                            <Link href="/dashboard/educator/gigs/new">
                                <PrimaryButton>
                                    <Plus className="w-4 h-4" /> New gig
                                </PrimaryButton>
                            </Link>
                        }
                    />

                    {gigs === undefined && !isDemo ? (
                        <div className="mt-10 text-[var(--text-secondary)]">Loading your gigs…</div>
                    ) : isEmpty ? (
                        <Card className="mt-10 p-12 flex flex-col items-center text-center">
                            <div className="h-12 w-12 rounded-xl border border-[--border-default] flex items-center justify-center mb-4 bg-[--bg-subtle]">
                                <Briefcase className="w-6 h-6 text-[--text-tertiary]" />
                            </div>
                            <h3 className="font-heading text-xl font-bold text-[var(--text-primary)] mb-2">
                                You haven&apos;t listed any services yet.
                            </h3>
                            <p className="text-sm text-[var(--text-secondary)] max-w-sm mb-6">
                                Create your first gig so districts can book you for consulting, coaching, or substitute work.
                            </p>
                            <Link href="/dashboard/educator/gigs/new">
                                <PrimaryButton>
                                    <Plus className="w-4 h-4" /> Create your first gig
                                </PrimaryButton>
                            </Link>
                        </Card>
                    ) : (
                        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {cards.map((gig) => (
                                <Card key={gig.id} className="p-6 flex flex-col gap-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <h3 className="font-heading text-lg font-bold text-[var(--text-primary)] leading-snug">
                                            {gig.title}
                                        </h3>
                                        <span
                                            className={
                                                gig.isActive
                                                    ? "text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md bg-emerald-50 text-emerald-700"
                                                    : "text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md bg-[var(--bg-subtle)] text-[var(--text-tertiary)]"
                                            }
                                        >
                                            {gig.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </div>

                                    <div className="flex flex-col gap-1 text-sm text-[var(--text-secondary)]">
                                        <span>
                                            <span className="font-semibold text-[var(--text-primary)]">Area:</span>{" "}
                                            {getAreaOfNeedLabel(gig.areaOfNeed)}
                                        </span>
                                        <span>
                                            <span className="font-semibold text-[var(--text-primary)]">Price:</span>{" "}
                                            {formatPrice(gig.price, gig.pricingType)}
                                        </span>
                                        <span>
                                            <span className="font-semibold text-[var(--text-primary)]">Listed:</span>{" "}
                                            {formatCreatedAt(gig.createdAt)}
                                        </span>
                                    </div>

                                    <div className="pt-2 mt-auto flex items-center justify-end border-t border-[var(--border-subtle)]">
                                        <button
                                            type="button"
                                            onClick={() => handleDeactivate(gig.id)}
                                            disabled={!gig.isActive}
                                            className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] hover:text-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Deactivate
                                        </button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
