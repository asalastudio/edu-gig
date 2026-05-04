"use client";

import React, { useEffect, useState } from "react";
import { UserButton, SignOutButton } from "@clerk/nextjs";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Sidebar } from "@/components/shared/sidebar";
import { PageHeader } from "@/components/shared/page-header";
import { CredentialsSection } from "@/components/educator/credentials-section";
import { PrimaryButton } from "@/components/shared/button";
import { TAXONOMY } from "@/lib/taxonomy";
import { ArrowLeft } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export default function EducatorSettingsPage() {
    const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    const mine = useQuery(api.educators.getMine, hasClerk ? {} : "skip");
    const updateProfile = useMutation(api.educators.updateMyProfile);
    const profileHref = mine ? `/browse/${mine._id}` : "/browse";
    const [headline, setHeadline] = useState("");
    const [bio, setBio] = useState("");
    const [yearsExperience, setYearsExperience] = useState("0");
    const [hourlyRate, setHourlyRate] = useState("");
    const [availabilityStatus, setAvailabilityStatus] = useState<"open" | "limited" | "closed">("open");
    const [gradeLevels, setGradeLevels] = useState<string[]>([]);
    const [areas, setAreas] = useState<string[]>([]);
    const [engagementTypes, setEngagementTypes] = useState<string[]>([]);
    const [coverageRegions, setCoverageRegions] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!mine) return;
        setHeadline(mine.headline);
        setBio(mine.bio);
        setYearsExperience(String(mine.yearsExperience));
        setHourlyRate(mine.hourlyRate ? String(mine.hourlyRate) : "");
        setAvailabilityStatus(mine.availabilityStatus);
        setGradeLevels(mine.gradeLevelBands);
        setAreas(mine.areasOfNeed);
        setEngagementTypes(mine.engagementTypes);
        setCoverageRegions(mine.coverageRegions);
    }, [mine]);

    function toggle(list: string[], id: string, setter: React.Dispatch<React.SetStateAction<string[]>>) {
        setter(list.includes(id) ? list.filter((value) => value !== id) : [...list, id]);
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setSaveMessage(null);
        try {
            await updateProfile({
                headline: headline.trim(),
                bio: bio.trim(),
                yearsExperience: Number(yearsExperience) || 0,
                hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
                availabilityStatus,
                gradeLevelBands: gradeLevels,
                areasOfNeed: areas,
                engagementTypes,
                coverageRegions,
            });
            setSaveMessage("Profile updated.");
        } catch (err) {
            setSaveMessage(err instanceof Error ? err.message : "Could not save profile.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="flex h-screen bg-[var(--bg-subtle)] font-sans">
            <Sidebar />
            <main className="flex-1 overflow-y-auto w-full relative">
                <div className="max-w-3xl mx-auto px-8 lg:px-12 py-10">
                    <Link
                        href="/dashboard/educator"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--accent-primary)] mb-8"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to dashboard
                    </Link>
                    <PageHeader
                        title="Educator settings"
                        description="Profile visibility, rates, and notifications."
                    />
                    <div className="mt-10 space-y-8">
                        <section className="p-8 rounded-lg bg-white border border-[var(--border-subtle)] shadow-sm">
                            <h2 className="font-heading text-lg font-bold text-[var(--text-primary)] mb-4">Account</h2>
                            {hasClerk ? (
                                <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                                    <UserButton />
                                    <p className="text-sm text-[var(--text-secondary)]">
                                        Manage your profile and sign-in methods.
                                    </p>
                                </div>
                            ) : (
                                <p className="text-sm text-[var(--text-secondary)]">
                                    Authentication is not configured. Add Clerk keys to enable account management.
                                </p>
                            )}
                        </section>
                        <CredentialsSection />
                        <section className="p-8 rounded-lg bg-white border border-[var(--border-subtle)] shadow-sm">
                            <h2 className="font-heading text-lg font-bold text-[var(--text-primary)] mb-4">Public profile</h2>
                            {mine ? (
                                <form onSubmit={handleSave} className="flex flex-col gap-6">
                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="headline" className="text-sm font-semibold text-[var(--text-primary)]">Headline</label>
                                        <input id="headline" value={headline} onChange={(e) => setHeadline(e.target.value)} className="h-11 rounded-lg border border-[var(--border-subtle)] px-4 text-sm" />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="bio" className="text-sm font-semibold text-[var(--text-primary)]">Bio</label>
                                        <textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={5} className="rounded-lg border border-[var(--border-subtle)] px-4 py-3 text-sm" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="flex flex-col gap-2">
                                            <label htmlFor="yearsExperience" className="text-sm font-semibold text-[var(--text-primary)]">Years experience</label>
                                            <input id="yearsExperience" type="number" min={0} value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)} className="h-11 rounded-lg border border-[var(--border-subtle)] px-4 text-sm" />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label htmlFor="hourlyRate" className="text-sm font-semibold text-[var(--text-primary)]">Starting hourly rate</label>
                                            <input id="hourlyRate" type="number" min={0} value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} className="h-11 rounded-lg border border-[var(--border-subtle)] px-4 text-sm" />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label htmlFor="availabilityStatus" className="text-sm font-semibold text-[var(--text-primary)]">Request status</label>
                                            <select id="availabilityStatus" value={availabilityStatus} onChange={(e) => setAvailabilityStatus(e.target.value as typeof availabilityStatus)} className="h-11 rounded-lg border border-[var(--border-subtle)] px-4 text-sm">
                                                <option value="open">Accept new requests</option>
                                                <option value="limited">Limited availability</option>
                                                <option value="closed">Do not accept requests</option>
                                            </select>
                                        </div>
                                    </div>
                                    {[
                                        { label: "Areas of need", values: TAXONOMY.areasOfNeed, selected: areas, setter: setAreas },
                                        { label: "Grade levels", values: TAXONOMY.gradeLevelBands.filter((g) => g.id !== "other"), selected: gradeLevels, setter: setGradeLevels },
                                        { label: "Engagement types", values: TAXONOMY.engagementTypes, selected: engagementTypes, setter: setEngagementTypes },
                                        { label: "Coverage areas", values: TAXONOMY.coverageRegions, selected: coverageRegions, setter: setCoverageRegions },
                                    ].map((group) => (
                                        <div key={group.label} className="flex flex-col gap-3">
                                            <span className="text-sm font-semibold text-[var(--text-primary)]">{group.label}</span>
                                            <div className="flex flex-wrap gap-2">
                                                {group.values.map((item) => (
                                                    <button
                                                        key={item.id}
                                                        type="button"
                                                        onClick={() => toggle(group.selected, item.id, group.setter)}
                                                        className={cn(
                                                            "px-3 py-2 rounded-full border text-xs font-bold",
                                                            group.selected.includes(item.id)
                                                                ? "bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]"
                                                                : "bg-white text-[var(--text-secondary)] border-[var(--border-subtle)]"
                                                        )}
                                                    >
                                                        {item.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    {saveMessage && <p className="text-sm font-medium text-[var(--text-secondary)]">{saveMessage}</p>}
                                    <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                                        <PrimaryButton type="submit" disabled={saving}>{saving ? "Saving…" : "Save public profile"}</PrimaryButton>
                                        <Link href={profileHref} className="text-sm font-bold text-[var(--accent-primary)] hover:underline">
                                            View public profile
                                        </Link>
                                    </div>
                                </form>
                            ) : (
                                <p className="text-sm text-[var(--text-secondary)]">
                                    Finish onboarding to create your public educator profile.
                                </p>
                            )}
                        </section>
                        {hasClerk && (
                            <div className="pt-4">
                                <SignOutButton>
                                    <button
                                        type="button"
                                        className="text-sm font-bold text-red-700 hover:underline"
                                    >
                                        Sign out
                                    </button>
                                </SignOutButton>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
