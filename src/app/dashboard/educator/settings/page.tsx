"use client";

import React, { useEffect, useRef, useState } from "react";
import { UserButton, SignOutButton } from "@clerk/nextjs";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Sidebar } from "@/components/shared/sidebar";
import { PageHeader } from "@/components/shared/page-header";
import { CredentialsSection } from "@/components/educator/credentials-section";
import { AvatarUpload } from "@/components/educator/avatar-upload";
import { ResumeUpload } from "@/components/educator/resume-upload";
import { TeamMembersEditor, type TeamMember } from "@/components/educator/team-members-editor";
import { PrimaryButton } from "@/components/shared/button";
import { RateField } from "@/components/educator/rate-field";
import { RegionCoverageLink } from "@/components/shared/region-coverage-link";
import { EDUCATOR_AVAILABILITY_OPTIONS } from "@/lib/onboarding";
import { TAXONOMY } from "@/lib/taxonomy";
import { ArrowLeft } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export default function EducatorSettingsPage() {
    const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    const mine = useQuery(api.educators.getMine, hasClerk ? {} : "skip");
    const viewer = useQuery(api.users.viewer, hasClerk ? {} : "skip");
    const updateProfile = useMutation(api.educators.updateMyProfile);
    const updateMyName = useMutation(api.users.updateMyName);
    const setEmailReminderPreference = useMutation(api.users.setEmailReminderPreference);
    const profileHref = mine ? `/browse/${mine._id}` : "/browse";
    const [businessName, setBusinessName] = useState("");
    const [headline, setHeadline] = useState("");
    const [bio, setBio] = useState("");
    const [presenterBio, setPresenterBio] = useState("");
    const [yearsExperience, setYearsExperience] = useState("0");
    const [rateAmount, setRateAmount] = useState("");
    const [rateHourly, setRateHourly] = useState(false);
    const [rateDaily, setRateDaily] = useState(false);
    const [availabilityStatus, setAvailabilityStatus] = useState<"open" | "limited" | "closed">("open");
    const [gradeLevels, setGradeLevels] = useState<string[]>([]);
    const [areas, setAreas] = useState<string[]>([]);
    const [engagementTypes, setEngagementTypes] = useState<string[]>([]);
    const [coverageRegions, setCoverageRegions] = useState<string[]>([]);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [profileType, setProfileType] = useState<"individual" | "firm">("individual");
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);
    const hydrated = useRef(false);

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [savingName, setSavingName] = useState(false);
    const [nameMessage, setNameMessage] = useState<string | null>(null);
    const nameHydrated = useRef(false);

    // checked = opted IN (emailRemindersOptOut is not true)
    const [emailRemindersOn, setEmailRemindersOn] = useState(true);
    const [emailPrefSaved, setEmailPrefSaved] = useState(false);

    useEffect(() => {
        if (!mine) return;
        // Seed the form once; later `mine` updates (e.g. after a save) must not
        // clobber in-progress edits, especially the teamMembers array.
        if (hydrated.current) return;
        hydrated.current = true;
        setBusinessName(mine.businessName ?? "");
        setHeadline(mine.headline);
        setBio(mine.bio);
        setPresenterBio(mine.presenterBio ?? "");
        setYearsExperience(String(mine.yearsExperience));
        const hasHourly = typeof mine.hourlyRate === "number";
        const hasDaily = typeof mine.dailyRate === "number";
        setRateHourly(hasHourly);
        setRateDaily(hasDaily);
        setRateAmount(
            hasHourly
                ? String(mine.hourlyRate)
                : hasDaily
                  ? String(mine.dailyRate)
                  : ""
        );
        setAvailabilityStatus(mine.availabilityStatus);
        setGradeLevels(mine.gradeLevelBands);
        setAreas(mine.areasOfNeed);
        setEngagementTypes(mine.engagementTypes ?? []);
        setCoverageRegions(mine.coverageRegions);
        setTeamMembers(mine.teamMembers ?? []);
        setProfileType(mine.profileType ?? (mine.businessName ? "firm" : "individual"));
    }, [mine]);

    useEffect(() => {
        if (!viewer) return;
        if (nameHydrated.current) return;
        nameHydrated.current = true;
        setFirstName(viewer.firstName ?? "");
        setLastName(viewer.lastName ?? "");
        setEmailRemindersOn(viewer.emailRemindersOptOut !== true);
    }, [viewer]);

    async function handleToggleEmailReminders(next: boolean) {
        setEmailRemindersOn(next);
        setEmailPrefSaved(false);
        try {
            await setEmailReminderPreference({ optOut: !next });
            setEmailPrefSaved(true);
        } catch {
            // Revert the optimistic toggle if the save fails.
            setEmailRemindersOn(!next);
        }
    }

    async function handleSaveName(e: React.FormEvent) {
        e.preventDefault();
        setNameMessage(null);
        if (!firstName.trim()) {
            setNameMessage("First name is required.");
            return;
        }
        setSavingName(true);
        try {
            await updateMyName({ firstName: firstName.trim(), lastName: lastName.trim() });
            setNameMessage("Name updated.");
        } catch (err) {
            setNameMessage(err instanceof Error ? err.message : "Could not save name.");
        } finally {
            setSavingName(false);
        }
    }

    function toggle(list: string[], id: string, setter: React.Dispatch<React.SetStateAction<string[]>>) {
        setter(list.includes(id) ? list.filter((value) => value !== id) : [...list, id]);
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setSaveMessage(null);
        try {
            const amount = rateAmount ? Number(rateAmount) : undefined;
            await updateProfile({
                businessName: businessName.trim(),
                headline: headline.trim(),
                bio: bio.trim(),
                presenterBio: presenterBio.trim(),
                yearsExperience: Number(yearsExperience) || 0,
                hourlyRate: rateHourly && amount ? amount : undefined,
                dailyRate: rateDaily && amount ? amount : undefined,
                availabilityStatus,
                gradeLevelBands: gradeLevels,
                areasOfNeed: areas,
                engagementTypes: engagementTypes.length ? engagementTypes : ["consulting"],
                teamMembers,
                coverageRegions,
                profileType,
            });
            setSaveMessage("Profile updated.");
        } catch (err) {
            setSaveMessage(err instanceof Error ? err.message : "Could not save profile.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="flex h-screen bg-[var(--bg-subtle)] font-sans pt-14 lg:pt-0">
            <Sidebar />
            <main className="flex-1 overflow-y-auto w-full relative">
                <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-10">
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
                    <div className="mt-10 flex flex-col gap-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                        <section className="p-8 rounded-lg bg-white border border-[var(--border-subtle)] shadow-sm">
                            <h2 className="font-heading text-lg font-bold text-[var(--text-primary)] mb-4">Account</h2>
                            {hasClerk ? (
                                <div className="flex flex-col gap-8">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                                        <UserButton />
                                        <p className="text-sm text-[var(--text-secondary)]">
                                            Manage your profile and sign-in methods.
                                        </p>
                                    </div>
                                    <AvatarUpload />
                                    <ResumeUpload />
                                    <form onSubmit={handleSaveName} className="flex flex-col gap-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm font-semibold text-[var(--text-primary)]">Display name on K12Gig</span>
                                            <span className="text-sm text-[var(--text-secondary)]">This name appears on your public profile and directory card.</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="flex flex-col gap-2">
                                                <label htmlFor="firstName" className="text-sm font-semibold text-[var(--text-primary)]">First name</label>
                                                <input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="h-11 rounded-lg border border-[var(--border-subtle)] px-4 text-sm" />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label htmlFor="lastName" className="text-sm font-semibold text-[var(--text-primary)]">Last name</label>
                                                <input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} className="h-11 rounded-lg border border-[var(--border-subtle)] px-4 text-sm" />
                                            </div>
                                        </div>
                                        {nameMessage && <p className="text-sm font-medium text-[var(--text-secondary)]">{nameMessage}</p>}
                                        <div>
                                            <PrimaryButton type="submit" disabled={savingName}>{savingName ? "Saving…" : "Save name"}</PrimaryButton>
                                        </div>
                                    </form>
                                    <div className="flex flex-col gap-3 pt-2 border-t border-[var(--border-subtle)]">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm font-semibold text-[var(--text-primary)]">Email preferences</span>
                                            <span className="text-sm text-[var(--text-secondary)]">Reminders and new-need alerts. Booking and account emails are always sent.</span>
                                        </div>
                                        <label className="flex items-start gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={emailRemindersOn}
                                                onChange={(e) => handleToggleEmailReminders(e.target.checked)}
                                                className="mt-0.5 h-4 w-4 rounded border-[var(--border-subtle)] accent-[var(--accent-primary)]"
                                            />
                                            <span className="text-sm text-[var(--text-primary)]">Email me reminders and new-need alerts</span>
                                        </label>
                                        {emailPrefSaved && <p className="text-sm font-medium text-[var(--text-secondary)]">Saved.</p>}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-[var(--text-secondary)]">
                                    Authentication is not configured. Add Clerk keys to enable account management.
                                </p>
                            )}
                        </section>
                        <CredentialsSection />
                        </div>
                        <section className="p-8 rounded-lg bg-white border border-[var(--border-subtle)] shadow-sm">
                            <h2 className="font-heading text-lg font-bold text-[var(--text-primary)] mb-4">Public profile</h2>
                            {mine ? (
                                <form onSubmit={handleSave} className="flex flex-col gap-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                        <div className="flex flex-col gap-2">
                                            <label htmlFor="businessName" className="text-sm font-semibold text-[var(--text-primary)]">Business / organization name (optional)</label>
                                            <input id="businessName" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="h-11 rounded-lg border border-[var(--border-subtle)] px-4 text-sm" />
                                            <p className="text-sm text-[var(--text-secondary)]">Shown as your public profile name. Your personal name appears beneath it.</p>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <span className="text-sm font-semibold text-[var(--text-primary)]">Profile type</span>
                                            <div className="flex flex-wrap gap-3">
                                                {(["individual", "firm"] as const).map((type) => (
                                                    <label key={type} className="inline-flex items-center gap-2 text-sm font-semibold">
                                                        <input
                                                            type="radio"
                                                            name="profileType"
                                                            checked={profileType === type}
                                                            onChange={() => setProfileType(type)}
                                                        />
                                                        {type === "individual" ? "Individual" : "Firm"}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label htmlFor="headline" className="text-sm font-semibold text-[var(--text-primary)]">Headline</label>
                                            <input id="headline" value={headline} onChange={(e) => setHeadline(e.target.value)} className="h-11 rounded-lg border border-[var(--border-subtle)] px-4 text-sm" />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="bio" className="text-sm font-semibold text-[var(--text-primary)]">Bio</label>
                                        <textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={5} className="rounded-lg border border-[var(--border-subtle)] px-4 py-3 text-sm" />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="presenterBio" className="text-sm font-semibold text-[var(--text-primary)]">Presenter bio for SCECH applications (optional)</label>
                                        <textarea id="presenterBio" value={presenterBio} onChange={(e) => setPresenterBio(e.target.value)} rows={4} className="rounded-lg border border-[var(--border-subtle)] px-4 py-3 text-sm" />
                                        <p className="text-sm text-[var(--text-secondary)]">Districts can copy this bio when filing Michigan SCECH continuing-education paperwork.</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="flex flex-col gap-2">
                                            <label htmlFor="yearsExperience" className="text-sm font-semibold text-[var(--text-primary)]">Years experience</label>
                                            <input id="yearsExperience" type="number" min={0} value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)} className="h-11 rounded-lg border border-[var(--border-subtle)] px-4 text-sm" />
                                        </div>
                                        <div className="flex flex-col gap-2 md:col-span-2">
                                            <RateField
                                                amount={rateAmount}
                                                onAmountChange={setRateAmount}
                                                hourly={rateHourly}
                                                onHourlyChange={setRateHourly}
                                                daily={rateDaily}
                                                onDailyChange={setRateDaily}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2 md:col-span-3">
                                            <label htmlFor="availabilityStatus" className="text-sm font-semibold text-[var(--text-primary)]">Availability</label>
                                            <select id="availabilityStatus" value={availabilityStatus} onChange={(e) => setAvailabilityStatus(e.target.value as typeof availabilityStatus)} className="h-11 rounded-lg border border-[var(--border-subtle)] px-4 text-sm">
                                                {EDUCATOR_AVAILABILITY_OPTIONS.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    {[
                                        { label: "Support types", values: TAXONOMY.areasOfNeed, selected: areas, setter: setAreas },
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
                                            {group.label === "Coverage areas" && <RegionCoverageLink />}
                                        </div>
                                    ))}
                                    <div className="flex flex-col gap-3">
                                        <span className="text-sm font-semibold text-[var(--text-primary)]">Team</span>
                                        <TeamMembersEditor value={teamMembers} onChange={setTeamMembers} />
                                    </div>
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
