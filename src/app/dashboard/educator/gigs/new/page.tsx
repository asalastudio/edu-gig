"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { z } from "zod";
import { api } from "@/convex/_generated/api";
import { Sidebar } from "@/components/shared/sidebar";
import { PageHeader } from "@/components/shared/page-header";
import { PrimaryButton } from "@/components/shared/button";
import { TAXONOMY } from "@/lib/taxonomy";
import { ArrowLeft } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const gigSchema = z.object({
    title: z.string().trim().min(4, "Title must be at least 4 characters."),
    description: z.string().trim().min(20, "Description must be at least 20 characters."),
    areaOfNeed: z.string().min(1, "Please select an area of need."),
    subCategory: z.string().optional(),
    engagementType: z.string().min(1, "Please choose an engagement type."),
    gradeLevels: z.array(z.string()).min(1, "Pick at least one grade level."),
    coverageRegions: z.array(z.string()).min(1, "Pick at least one region."),
    deliverables: z.array(z.string()),
    pricingType: z.enum(["hourly", "daily", "fixed"]),
    price: z.number().positive("Price must be greater than zero."),
    estimatedDuration: z.string().optional(),
});

export default function NewGigPage() {
    const router = useRouter();
    const viewer = useQuery(api.users.viewer, {});
    const canPersist = !!viewer && viewer.role === "educator";
    const createGig = useMutation(api.gigs.create);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [areaOfNeed, setAreaOfNeed] = useState("");
    const [subCategory, setSubCategory] = useState("");
    const [engagementType, setEngagementType] = useState<string>("");
    const [gradeLevels, setGradeLevels] = useState<string[]>([]);
    const [coverageRegions, setCoverageRegions] = useState<string[]>([]);
    const [deliverablesText, setDeliverablesText] = useState("");
    const [pricingType, setPricingType] = useState<"hourly" | "daily" | "fixed">("hourly");
    const [price, setPrice] = useState<string>("");
    const [estimatedDuration, setEstimatedDuration] = useState("");

    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const selectedArea = TAXONOMY.areasOfNeed.find((a) => a.id === areaOfNeed);
    const subs = selectedArea?.subCategories ?? [];

    function toggleInArray(arr: string[], id: string): string[] {
        return arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);

        const deliverables = deliverablesText
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean);

        const priceNumber = Number(price);
        const parsed = gigSchema.safeParse({
            title,
            description,
            areaOfNeed,
            subCategory: subCategory || undefined,
            engagementType,
            gradeLevels,
            coverageRegions,
            deliverables,
            pricingType,
            price: Number.isFinite(priceNumber) ? priceNumber : 0,
            estimatedDuration: estimatedDuration || undefined,
        });

        if (!parsed.success) {
            const first = parsed.error.issues[0];
            setSubmitError(first?.message ?? "Please review the form and try again.");
            return;
        }

        if (!canPersist) {
            router.push("/dashboard/educator/my-gigs");
            return;
        }

        setSubmitting(true);
        try {
            await createGig(parsed.data);
            router.push("/dashboard/educator/my-gigs");
        } catch (err) {
            console.error(err);
            setSubmitError(
                err instanceof Error ? err.message : "Could not create gig. Please try again."
            );
            setSubmitting(false);
        }
    };

    const inputBase =
        "w-full h-12 px-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] focus:bg-white transition-all";

    return (
        <div className="flex h-screen bg-[var(--bg-subtle)] font-sans">
            <Sidebar />
            <main className="flex-1 overflow-y-auto w-full relative">
                <div className="max-w-3xl mx-auto px-8 lg:px-12 py-10">
                    <Link
                        href="/dashboard/educator/my-gigs"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--accent-primary)] mb-8"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to My Gigs
                    </Link>

                    <PageHeader
                        title="Create a new gig"
                        description="Describe the service you offer so districts can find and book you."
                    />

                    <form
                        onSubmit={handleSubmit}
                        className="mt-10 bg-white p-8 md:p-10 rounded-lg shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-[var(--border-subtle)] flex flex-col gap-6"
                    >
                        <div className="flex flex-col gap-2">
                            <label htmlFor="title" className="text-sm font-semibold text-[var(--text-primary)]">
                                Title *
                            </label>
                            <input
                                id="title"
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Curriculum Mapping Workshop"
                                className={inputBase}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label htmlFor="description" className="text-sm font-semibold text-[var(--text-primary)]">
                                Description *
                            </label>
                            <textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={5}
                                placeholder="What will you deliver? Who is it for? What makes your service stand out?"
                                className="w-full p-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] focus:bg-white transition-all resize-y"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                                <label htmlFor="areaOfNeed" className="text-sm font-semibold text-[var(--text-primary)]">
                                    Area of Need *
                                </label>
                                <select
                                    id="areaOfNeed"
                                    value={areaOfNeed}
                                    onChange={(e) => {
                                        setAreaOfNeed(e.target.value);
                                        setSubCategory("");
                                    }}
                                    className={inputBase}
                                >
                                    <option value="">Select area</option>
                                    {TAXONOMY.areasOfNeed.map((a) => (
                                        <option key={a.id} value={a.id}>
                                            {a.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label htmlFor="subCategory" className="text-sm font-semibold text-[var(--text-primary)]">
                                    Sub-category
                                </label>
                                <select
                                    id="subCategory"
                                    value={subCategory}
                                    onChange={(e) => setSubCategory(e.target.value)}
                                    disabled={!areaOfNeed || subs.length === 0}
                                    className={cn(inputBase, "disabled:opacity-50")}
                                >
                                    <option value="">Select sub-category</option>
                                    {subs.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <label className="text-sm font-semibold text-[var(--text-primary)]">Engagement Type *</label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {TAXONOMY.engagementTypes.map((eng) => (
                                    <label
                                        key={eng.id}
                                        className="flex flex-col items-start gap-2 p-4 border border-[var(--border-subtle)] bg-[var(--bg-app)] rounded-lg cursor-pointer hover:border-[var(--accent-primary)]/50 has-[:checked]:bg-[var(--accent-primary)]/5 has-[:checked]:border-[var(--accent-primary)] transition-all"
                                    >
                                        <input
                                            type="radio"
                                            name="engagementType"
                                            value={eng.id}
                                            checked={engagementType === eng.id}
                                            onChange={() => setEngagementType(eng.id)}
                                            className="w-4 h-4 text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
                                        />
                                        <span className="text-[var(--text-primary)] font-semibold text-sm">{eng.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <label className="text-sm font-semibold text-[var(--text-primary)]">Grade Levels *</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {TAXONOMY.gradeLevelBands
                                    .filter((g) => g.id !== "other")
                                    .map((g) => (
                                        <label
                                            key={g.id}
                                            className="flex items-center gap-2 p-3 border border-[var(--border-subtle)] bg-[var(--bg-app)] rounded-lg cursor-pointer hover:border-[var(--accent-primary)]/50 has-[:checked]:bg-[var(--accent-primary)]/5 has-[:checked]:border-[var(--accent-primary)] transition-all"
                                        >
                                            <input
                                                type="checkbox"
                                                value={g.id}
                                                checked={gradeLevels.includes(g.id)}
                                                onChange={() =>
                                                    setGradeLevels((prev) => toggleInArray(prev, g.id))
                                                }
                                                className="w-4 h-4 text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
                                            />
                                            <span className="text-sm font-semibold text-[var(--text-primary)]">
                                                {g.label}
                                            </span>
                                        </label>
                                    ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <label className="text-sm font-semibold text-[var(--text-primary)]">Coverage Areas *</label>
                            <p className="text-sm text-[var(--text-secondary)]">
                                Pick where you can serve districts. Use Statewide / Remote if your service does not require travel.
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {TAXONOMY.coverageRegions.map((r) => (
                                    <label
                                        key={r.id}
                                        className="flex items-center gap-2 p-3 border border-[var(--border-subtle)] bg-[var(--bg-app)] rounded-lg cursor-pointer hover:border-[var(--accent-primary)]/50 has-[:checked]:bg-[var(--accent-primary)]/5 has-[:checked]:border-[var(--accent-primary)] transition-all"
                                    >
                                        <input
                                            type="checkbox"
                                            value={r.id}
                                            checked={coverageRegions.includes(r.id)}
                                            onChange={() =>
                                                setCoverageRegions((prev) => toggleInArray(prev, r.id))
                                            }
                                            className="w-4 h-4 text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
                                        />
                                        <span className="text-sm font-semibold text-[var(--text-primary)]">{r.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label htmlFor="deliverables" className="text-sm font-semibold text-[var(--text-primary)]">
                                Deliverables (one per line)
                            </label>
                            <textarea
                                id="deliverables"
                                value={deliverablesText}
                                onChange={(e) => setDeliverablesText(e.target.value)}
                                rows={4}
                                placeholder={"Scope document\nWeekly coaching session\nFinal report"}
                                className="w-full p-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] focus:bg-white transition-all resize-y"
                            />
                        </div>

                        <div className="flex flex-col gap-3">
                            <label className="text-sm font-semibold text-[var(--text-primary)]">Pricing *</label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {(
                                    [
                                        { id: "hourly" as const, label: "Hourly" },
                                        { id: "daily" as const, label: "Daily" },
                                        { id: "fixed" as const, label: "Fixed" },
                                    ] as const
                                ).map((t) => (
                                    <label
                                        key={t.id}
                                        className="flex items-center gap-2 p-4 border border-[var(--border-subtle)] bg-[var(--bg-app)] rounded-lg cursor-pointer hover:border-[var(--accent-primary)]/50 has-[:checked]:bg-[var(--accent-primary)]/5 has-[:checked]:border-[var(--accent-primary)] transition-all"
                                    >
                                        <input
                                            type="radio"
                                            name="pricingType"
                                            value={t.id}
                                            checked={pricingType === t.id}
                                            onChange={() => setPricingType(t.id)}
                                            className="w-4 h-4 text-[var(--accent-primary)]"
                                        />
                                        <span className="text-[var(--text-primary)] font-semibold text-sm">{t.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                                <label htmlFor="price" className="text-sm font-semibold text-[var(--text-primary)]">
                                    Price (USD) *
                                </label>
                                <input
                                    id="price"
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    placeholder="75"
                                    className={inputBase}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label
                                    htmlFor="estimatedDuration"
                                    className="text-sm font-semibold text-[var(--text-primary)]"
                                >
                                    Estimated duration
                                </label>
                                <input
                                    id="estimatedDuration"
                                    type="text"
                                    value={estimatedDuration}
                                    onChange={(e) => setEstimatedDuration(e.target.value)}
                                    placeholder="e.g. 4 weeks"
                                    className={inputBase}
                                />
                            </div>
                        </div>

                        {submitError && (
                            <p role="alert" className="text-sm text-red-600 font-medium">
                                {submitError}
                            </p>
                        )}

                        <div className="flex items-center justify-between mt-4 pt-6 border-t border-[var(--border-subtle)]">
                            <Link
                                href="/dashboard/educator/my-gigs"
                                className="px-6 py-2.5 rounded-lg text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] transition-colors"
                            >
                                Cancel
                            </Link>
                            <PrimaryButton type="submit" disabled={submitting}>
                                {submitting ? "Saving…" : canPersist ? "Save" : "Save (Demo)"}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
