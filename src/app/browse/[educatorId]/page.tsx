"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { PrimaryButton } from "@/components/shared/button";
import { VerificationBadge } from "@/components/shared/verification-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlayCircle, Medal, MapPin, Briefcase, CheckCircle, ChatCircle, BookmarkSimple, ShieldCheck, Certificate, CurrencyDollar, ArrowLeft } from "@phosphor-icons/react";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Sidebar } from "@/components/shared/sidebar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { mapConvexEducatorToProfileView } from "@/lib/map-convex-educator-profile";
import { CopyButton } from "@/components/shared/copy-button";
import { CredentialFileLink } from "@/components/shared/credential-file-link";
import { isDistrictRole } from "@/lib/roles";
import { AUTH_INTENT_PARAM } from "@/lib/auth-intent";
import { formatPrice } from "@/lib/map-review";

const USE_CONVEX = process.env.NEXT_PUBLIC_USE_CONVEX_BROWSE === "true";

function isSavedEducator(educatorId: string): boolean {
    if (typeof window === "undefined" || !educatorId) return false;
    try {
        const raw = window.localStorage.getItem("k12gig_saved_educators");
        const ids: string[] = raw ? JSON.parse(raw) : [];
        return ids.includes(educatorId);
    } catch {
        return false;
    }
}

export default function EducatorProfilePage() {
    const params = useParams();
    const router = useRouter();
    const educatorId = typeof params.educatorId === "string" ? params.educatorId : params.educatorId?.[0] ?? "";
    const [saved, setSaved] = useState(() => isSavedEducator(educatorId));
    const [messageError, setMessageError] = useState<string | null>(null);

    const viewer = useQuery(api.users.viewer, {});
    const districtOK = !!viewer && isDistrictRole(viewer.role);
    // The viewer's own educator row, so they can preview their public profile.
    const mine = useQuery(
        api.educators.getMine,
        viewer?.role === "educator" ? {} : "skip"
    );
    const isOwnProfile = !!mine && mine._id === educatorId;
    const canViewConvex = districtOK || isOwnProfile;
    const useConvexProfile =
        USE_CONVEX && canViewConvex && viewer !== undefined && !educatorId.startsWith("e_");

    const convexData = useQuery(
        api.educators.getProfileForDistrict,
        useConvexProfile ? { educatorId: educatorId as Id<"educators"> } : "skip"
    );
    const educatorGigs = useQuery(
        api.gigs.listActiveByEducatorForDistrict,
        useConvexProfile ? { educatorId: educatorId as Id<"educators"> } : "skip"
    );
    const credentialRows = useQuery(
        api.credentials.listForEducatorProfile,
        useConvexProfile ? { educatorId: educatorId as Id<"educators"> } : "skip"
    );
    const resumeFile = useQuery(
        api.educators.getResumeUrl,
        useConvexProfile ? { educatorId: educatorId as Id<"educators"> } : "skip"
    );

    // Educators must not browse OTHER educators, but they may preview their own
    // public profile. Bounce a signed-in educator to the shared Gig Board only
    // once we know (mine !== undefined) the profile isn't theirs. Never redirect
    // on the owner's own profile, districts, or signed-out users.
    useEffect(() => {
        if (viewer?.role === "educator" && mine !== undefined && mine?._id !== educatorId) {
            router.replace("/dashboard/board");
        }
    }, [viewer, mine, educatorId, router]);

    // Hold on a loading state while we resolve whether an educator viewer owns
    // this profile, so the owner's self-preview never flashes "not available".
    const resolvingOwnership = viewer?.role === "educator" && mine === undefined;

    if (resolvingOwnership || (useConvexProfile && (convexData === undefined || credentialRows === undefined))) {
        return (
            <div className="min-h-screen bg-[var(--bg-app)] flex flex-col font-sans">
                <SiteHeader />
                <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-16 text-center">
                    <p className="text-[var(--text-secondary)]">Loading profile…</p>
                </main>
                <SiteFooter />
            </div>
        );
    }

    if (useConvexProfile && convexData === null) {
        return (
            <div className="min-h-screen bg-[var(--bg-app)] flex flex-col font-sans">
                <SiteHeader />
                <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-16 text-center">
                    <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)] mb-4">Educator not found</h1>
                    <p className="text-[var(--text-secondary)] mb-8">This profile isn’t available or the link is invalid.</p>
                    <PrimaryButton onClick={() => router.push("/browse")}>Back to directory</PrimaryButton>
                </main>
                <SiteFooter />
            </div>
        );
    }

    const profile =
        useConvexProfile && convexData
            ? mapConvexEducatorToProfileView(
                  convexData.educator,
                  convexData.user,
                  credentialRows ?? undefined
              )
            : null;

    const convexRecipientUserId: string | null =
        useConvexProfile && convexData ? convexData.user._id : null;

    const isMockProfile = educatorId.startsWith("e_");

    if (!profile) {
        const headline = isMockProfile ? "Sample profile retired" : "Profile not available";
        const body = isMockProfile
            ? "This profile id was part of an earlier demo dataset that is no longer rendered."
            : !viewer
              ? "Sign in with a district account to view real educator profiles."
              : !districtOK
                ? "Use a district account to view real educator profiles."
                : "This profile isn’t available — it may be unpublished or unverified.";
        return (
            <div className="min-h-screen bg-[var(--bg-app)] flex flex-col font-sans">
                <SiteHeader />
                <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-16 text-center">
                    <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)] mb-4">{headline}</h1>
                    <p className="text-[var(--text-secondary)] mb-8">{body}</p>
                    <PrimaryButton onClick={() => router.push("/browse")}>Back to directory</PrimaryButton>
                </main>
                <SiteFooter />
            </div>
        );
    }

    const handleMessageEducator = () => {
        setMessageError(null);
        const firstName = convexData?.user.firstName ?? "";
        const lastName = convexData?.user.lastName ?? "";
        // Prefer the business name districts see (profile.name); fall back to the
        // educator's personal name when no business name is set.
        const displayName = profile?.name ?? `${firstName} ${lastName}`.trim();

        if (!viewer) {
            const next = convexRecipientUserId
                ? `/dashboard/messages?to=${encodeURIComponent(convexRecipientUserId)}${
                      displayName ? `&name=${encodeURIComponent(displayName)}` : ""
                  }`
                : "/dashboard/messages";
            router.push(`/login?next=${encodeURIComponent(next)}`);
            return;
        }

        if (isMockProfile) {
            setMessageError(
                "This sample profile cannot receive messages. Return to the directory and choose a live educator profile."
            );
            return;
        }

        if (!convexRecipientUserId) {
            setMessageError(
                "Couldn't load this educator's account. Try returning to the directory and picking another profile."
            );
            return;
        }

        const query = `to=${encodeURIComponent(convexRecipientUserId)}${
            displayName ? `&name=${encodeURIComponent(displayName)}` : ""
        }`;
        router.push(`/dashboard/messages?${query}`);
    };

    const saveEducator = () => {
        if (typeof window === "undefined") return;
        const raw = window.localStorage.getItem("k12gig_saved_educators");
        const ids: string[] = raw ? JSON.parse(raw) : [];
        const next = ids.includes(educatorId) ? ids.filter((id) => id !== educatorId) : [...ids, educatorId];
        window.localStorage.setItem("k12gig_saved_educators", JSON.stringify(next));
        setSaved(next.includes(educatorId));
    };

    const handleSaveEducator = () => {
        saveEducator();
        if (!viewer) {
            const next = `/browse/${educatorId}`;
            router.push(`/sign-up?${AUTH_INTENT_PARAM}=district&next=${encodeURIComponent(next)}`);
        }
    };

    const handleRequestEducator = () => {
        const next = `/post?educator=${encodeURIComponent(educatorId)}&name=${encodeURIComponent(profile?.name ?? "Educator")}`;
        if (!viewer) {
            router.push(`/sign-up?${AUTH_INTENT_PARAM}=district&next=${encodeURIComponent(next)}`);
            return;
        }
        if (!districtOK) {
            router.push("/login");
            return;
        }
        router.push(next);
    };

    if (!profile) {
        return (
            <div className="min-h-screen bg-[var(--bg-app)] flex flex-col font-sans">
                <SiteHeader />
                <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-16 text-center">
                    <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)] mb-4">Educator not found</h1>
                    <p className="text-[var(--text-secondary)] mb-8">No demo profile matches this link. Try another educator from the directory.</p>
                    <PrimaryButton onClick={() => router.push("/browse")}>Back to directory</PrimaryButton>
                </main>
                <SiteFooter />
            </div>
        );
    }

    const availabilityLabel =
        profile.availabilityStatus === "open"
            ? "Open to New Clients"
            : profile.availabilityStatus === "limited"
              ? "Limited Availability"
              : "Not Accepting New Clients";

    const availabilityClass =
        profile.availabilityStatus === "open"
            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
            : profile.availabilityStatus === "limited"
              ? "bg-amber-100 text-amber-900 border-amber-200"
              : "bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border-strong)]";

    const signedIn = !!viewer;
    const pricingLabel = profile.rateLabel !== "Not set"
        ? profile.rateLabel
        : "Rate available by request";
    const savedLabel = saved ? "Saved" : "Save to List";
    const profileMain = (
            <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                {isOwnProfile && (
                    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                        <p className="text-sm font-semibold text-amber-900">
                            Preview — this is how districts see your profile.
                        </p>
                        <Link href="/dashboard/educator/settings" className="text-sm font-bold text-amber-900 hover:underline whitespace-nowrap">
                            Back to settings
                        </Link>
                    </div>
                )}
                {isOwnProfile ? (
                    <Link href="/dashboard/educator/settings" className="text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--accent-primary)] mb-8 inline-flex items-center gap-2 transition-colors">
                        &larr; Back to settings
                    </Link>
                ) : (
                    <button onClick={() => router.back()} className="text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--accent-primary)] mb-8 inline-flex items-center gap-2 transition-colors">
                        &larr; Back to Browse
                    </button>
                )}

                {messageError && (
                    <div role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
                        {messageError}
                    </div>
                )}

                <div className="bg-white rounded-lg shadow-[var(--shadow-soft)] border border-[var(--border-default)] overflow-hidden relative">
                    <div className="h-1 w-full bg-[linear-gradient(90deg,var(--accent-primary),var(--accent-tertiary),var(--accent-secondary))]" />
                    
                    {/* Hero Profile Header */}
                    <div className="bg-white p-8 md:p-12 flex flex-col md:flex-row items-center md:items-start gap-8 relative border-b border-[var(--border-subtle)]">
                        <Avatar className="h-32 w-32 md:h-40 md:w-40 rounded-full ring-4 ring-[var(--bg-subtle)] shadow-md bg-white flex-shrink-0">
                            <AvatarImage src={profile.avatarUrl} className="object-cover" />
                            <AvatarFallback className="bg-[var(--accent-primary)] text-white text-4xl font-heading font-bold">
                                {profile.initials}
                            </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 flex flex-col items-center md:items-start gap-4 w-full text-center md:text-left">
                            <div>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                                    <h1 className="font-heading text-3xl md:text-4xl font-bold text-[var(--text-primary)]">{profile.name}</h1>
                                    <VerificationBadge tier={profile.verificationTier} />
                                </div>
                                {profile.secondaryName && (
                                    <p className="text-[var(--text-secondary)] text-base mb-2">Led by {profile.secondaryName}</p>
                                )}
                                <p className="text-[var(--accent-primary)] font-bold text-lg md:text-xl">{profile.headline}</p>
                                {profile.engagementTypes && profile.engagementTypes.length > 0 && (
                                    <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-3">
                                        {profile.engagementTypes.map((t) => (
                                            <span
                                                key={t}
                                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[var(--accent-primary)]/25 bg-[var(--accent-primary)]/10 text-sm font-bold text-[var(--accent-primary)]"
                                            >
                                                <Briefcase weight="fill" className="w-4 h-4" />
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <p className="text-[var(--text-secondary)] text-base mt-2 flex items-center justify-center md:justify-start gap-2">
                                    <MapPin weight="fill" className="w-5 h-5 text-[var(--text-tertiary)]" /> {profile.location}
                                </p>
                            </div>
                            
                            <div className="flex flex-wrap justify-center md:justify-start gap-2">
                                {profile.badges.map(badge => (
                                    <span key={badge} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-sm font-semibold text-[var(--text-primary)]">
                                        {badge.includes('Background') && <ShieldCheck weight="fill" className="w-4 h-4 text-emerald-600" />}
                                        {badge.includes('Licensed') && <Medal weight="fill" className="w-4 h-4 text-[var(--accent-secondary)]" />}
                                        {badge}
                                    </span>
                                ))}
                            </div>
                            
                            <div className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4 flex flex-col sm:flex-row sm:items-center gap-4 mt-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 text-[var(--text-primary)]">
                                        <CurrencyDollar weight="bold" className="w-5 h-5 text-[var(--accent-primary)]" />
                                        <span className="font-heading text-2xl font-bold">{pricingLabel}</span>
                                    </div>
                                    <p className="text-sm font-medium text-[var(--text-secondary)] mt-1">
                                        Starting rate. Final scope and payment are confirmed directly with the consultant.
                                    </p>
                                </div>
                                <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
                                    Minimum engagement: 2 hours
                                </span>
                            </div>

                            {isOwnProfile ? (
                                <div className="hidden md:flex flex-row gap-3 w-full sm:w-auto mt-2">
                                    <Link href="/dashboard/educator/settings" className="flex items-center justify-center gap-2 px-8 py-3 bg-white border-2 border-[var(--border-strong)] text-[var(--text-primary)] font-bold rounded-lg hover:bg-[var(--bg-subtle)] transition-all w-full sm:w-auto text-base cursor-pointer">
                                        <ArrowLeft weight="bold" className="w-5 h-5" /> Back to settings
                                    </Link>
                                </div>
                            ) : (
                        <div className="hidden md:flex flex-row gap-3 w-full sm:w-auto mt-2">
                            <button onClick={() => handleRequestEducator()} className="flex items-center justify-center gap-2 px-8 py-3 bg-[var(--accent-primary)] text-white font-bold rounded-lg hover:bg-[var(--accent-primary-h)] transition-all shadow-sm w-full sm:w-auto text-base cursor-pointer">
                                    <Briefcase weight="fill" className="w-5 h-5" /> Post a need
                            </button>
                                    <button onClick={handleMessageEducator} className="flex items-center justify-center gap-2 px-8 py-3 bg-white border-2 border-[var(--border-strong)] text-[var(--text-primary)] font-bold rounded-lg hover:bg-[var(--bg-subtle)] transition-all w-full sm:w-auto text-base cursor-pointer">
                                        <ChatCircle weight="fill" className="w-5 h-5" /> Message Consultant
                                    </button>
                                    <button onClick={handleSaveEducator} className="flex items-center justify-center gap-2 px-8 py-3 bg-white border-2 border-[var(--border-strong)] text-[var(--text-primary)] font-bold rounded-lg hover:bg-[var(--bg-subtle)] transition-all w-full sm:w-auto text-base cursor-pointer">
                                        <BookmarkSimple weight={saved ? "fill" : "bold"} className="w-5 h-5" /> {savedLabel}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 bg-[var(--bg-subtle)] border-b border-[var(--border-subtle)]">
                        <div className="p-6 text-center border-r border-b md:border-b-0 border-[var(--border-strong)]">
                            <div className="font-heading text-3xl font-bold text-[var(--text-primary)]">{profile.yearsExperience}</div>
                            <div className="text-sm text-[var(--text-secondary)] font-bold uppercase tracking-widest mt-1">Years Exp.</div>
                        </div>
                        <div className="p-6 text-center border-r hidden md:block border-[var(--border-strong)]">
                            <div className="font-heading text-2xl md:text-3xl font-bold text-[var(--text-primary)] leading-tight px-1">{profile.primarySubjectLabel}</div>
                            <div className="text-sm text-[var(--text-secondary)] font-bold uppercase tracking-widest mt-1">Primary focus</div>
                        </div>
                        <div className="p-6 text-center border-r border-b md:border-b-0 border-[var(--border-strong)]">
                            <div className="font-heading text-2xl md:text-3xl font-bold text-[var(--text-primary)] leading-tight px-1">{profile.gradeLevelsLabel}</div>
                            <div className="text-sm text-[var(--text-secondary)] font-bold uppercase tracking-widest mt-1">Grade Levels</div>
                        </div>
                        <div className="p-6 text-center border-[var(--border-strong)] md:border-r-0">
                            <div className="font-heading text-3xl font-bold text-[var(--text-primary)]">{profile.certCount}</div>
                            <div className="text-sm text-[var(--text-secondary)] font-bold uppercase tracking-widest mt-1">Certifications</div>
                        </div>
                    </div>

                    {/* Tabs Section */}
                    <Tabs defaultValue="about" className="w-full">
                        <div className="px-6 md:px-12 border-b border-[var(--border-subtle)] overflow-x-auto no-scrollbar bg-white">
                            <TabsList className="h-16 bg-transparent p-0 flex gap-8" variant="line">
                                <TabsTrigger value="about" className="text-lg font-bold h-full px-0 data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none border-b-4 border-transparent data-[state=active]:border-b-[var(--accent-primary)] data-[state=active]:text-[var(--accent-primary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer">About</TabsTrigger>
                                <TabsTrigger value="services" className="text-lg font-bold h-full px-0 data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none border-b-4 border-transparent data-[state=active]:border-b-[var(--accent-primary)] data-[state=active]:text-[var(--accent-primary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer">Areas of Support</TabsTrigger>
                                <TabsTrigger value="credentials" className="text-lg font-bold h-full px-0 data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none border-b-4 border-transparent data-[state=active]:border-b-[var(--accent-primary)] data-[state=active]:text-[var(--accent-primary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer">Credentials</TabsTrigger>
                                <TabsTrigger value="experience" className="text-lg font-bold h-full px-0 data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none border-b-4 border-transparent data-[state=active]:border-b-[var(--accent-primary)] data-[state=active]:text-[var(--accent-primary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer">Resume / CV</TabsTrigger>
                                <TabsTrigger value="availability" className="text-lg font-bold h-full px-0 data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none border-b-4 border-transparent data-[state=active]:border-b-[var(--accent-primary)] data-[state=active]:text-[var(--accent-primary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer">Availability</TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="p-8 md:p-12">
                            <TabsContent value="about" className="mt-0 outline-none flex flex-col gap-8 animate-in fade-in duration-300">
                                <div>
                                    <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Professional Overview</h2>
                                    <p className="text-lg text-[var(--text-secondary)] leading-relaxed">{profile.bio}</p>
                                </div>
                                {profile.teamMembers && profile.teamMembers.length > 0 && (
                                    <div>
                                        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Our team</h2>
                                        <div className="flex flex-col gap-4">
                                            {profile.teamMembers.map((member, i) => (
                                                <div key={i} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-5">
                                                    <p className="font-semibold text-[var(--text-primary)] text-base">{member.name}</p>
                                                    {member.title && (
                                                        <p className="text-sm text-[var(--text-secondary)]">{member.title}</p>
                                                    )}
                                                    {member.bio && (
                                                        <p className="mt-2 text-[var(--text-secondary)] leading-relaxed">{member.bio}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {profile.videoIntro && (
                                    <div>
                                        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Video Introduction</h2>
                                        <div className="w-full aspect-video bg-[var(--bg-subtle)] rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-[var(--border-strong)] mt-2 group cursor-pointer hover:border-[var(--accent-primary)] transition-all hover:bg-[var(--accent-primary)]/5">
                                            <div className="w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <PlayCircle weight="fill" className="w-10 h-10 text-[var(--accent-primary)]" />
                                            </div>
                                            <span className="mt-4 font-bold text-[var(--text-primary)] text-lg">Play Video</span>
                                        </div>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="services" className="mt-0 outline-none animate-in fade-in duration-300">
                                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Areas of Support</h2>
                                <p className="text-sm text-[var(--text-secondary)] mb-8">
                                    Post a need and review available support options to start hiring.
                                </p>
                                {educatorGigs === undefined ? (
                                    <p className="text-[var(--text-secondary)]">Loading services…</p>
                                ) : educatorGigs.length === 0 ? (
                                    <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-8 text-center">
                                        <h3 className="font-heading text-lg font-bold text-[var(--text-primary)] mb-2">No support details yet</h3>
                                        <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-md mx-auto">
                                            This educator hasn&apos;t published fixed service details yet. You can still post a need to request support.
                                        </p>
                                        <PrimaryButton onClick={() => handleRequestEducator()}>
                                            Post a need
                                        </PrimaryButton>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {educatorGigs.map((gig) => (
                                            <div
                                                key={gig.id}
                                                className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-subtle)] p-5 flex flex-col gap-4"
                                            >
                                                <div>
                                                    <h3 className="font-heading text-lg font-bold text-[var(--text-primary)]">{gig.title}</h3>
                                                    <p className="text-sm font-semibold text-[var(--accent-primary)] mt-1">
                                                        {formatPrice(gig.price, gig.pricingType)}
                                                        {gig.estimatedDuration ? ` · ${gig.estimatedDuration}` : ""}
                                                    </p>
                                                </div>
                                                <PrimaryButton onClick={() => handleRequestEducator()} className="mt-auto w-full">
                                                    Post a need
                                                </PrimaryButton>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="mt-8">
                                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-3">
                                        Need a specific gig?
                                    </p>
                                    <PrimaryButton onClick={() => handleRequestEducator()} className="w-full md:w-auto">
                                        Post a need
                                    </PrimaryButton>
                                </div>
                            </TabsContent>

                            <TabsContent value="credentials" className="mt-0 outline-none animate-in fade-in duration-300 flex flex-col gap-8">
                                <div>
                                    <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Licenses & Certifications</h2>
                                    {profile.licenses.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center p-12 bg-[var(--bg-subtle)] rounded-lg border border-[var(--border-subtle)] text-center">
                                            <div className="w-16 h-16 rounded-full bg-white border border-[var(--border-subtle)] flex items-center justify-center mb-4">
                                                <Medal weight="regular" className="w-8 h-8 text-[var(--text-tertiary)]" />
                                            </div>
                                            <h3 className="text-lg font-heading font-bold text-[var(--text-primary)] mb-2">No credentials uploaded yet</h3>
                                            <p className="text-[var(--text-secondary)] max-w-md">This educator hasn&apos;t added licenses or certifications to their profile. You can message them to request documentation before booking.</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto border border-[var(--border-subtle)] rounded-lg">
                                            <table className="w-full text-left border-collapse">
                                                <thead className="bg-[var(--bg-subtle)] text-[var(--text-secondary)] uppercase tracking-wider font-bold text-sm border-b border-[var(--border-subtle)]">
                                                    <tr>
                                                        <th className="py-4 px-6">Credential</th>
                                                        <th className="py-4 px-6">Issuer</th>
                                                        <th className="py-4 px-6">Status</th>
                                                        <th className="py-4 px-6">Expiry</th>
                                                        <th className="py-4 px-6">File</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-[var(--border-subtle)]">
                                                    {profile.licenses.map((lic, i) => (
                                                        <tr key={i} className="hover:bg-[var(--bg-hover)] transition-colors">
                                                            <td className="py-5 px-6 font-bold text-[var(--text-primary)] text-base">{lic.type}</td>
                                                            <td className="py-5 px-6 text-[var(--text-secondary)] font-medium text-base">{lic.issuer}</td>
                                                            <td className="py-5 px-6">
                                                                {lic.status === "Verified" ? (
                                                                    <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg text-sm">
                                                                        <CheckCircle weight="fill" className="w-4 h-4" /> Verified
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1.5 text-[var(--text-secondary)] font-bold bg-[var(--bg-subtle)] border border-[var(--border-subtle)] px-3 py-1.5 rounded-lg text-sm">
                                                                        <Certificate weight="bold" className="w-4 h-4" /> Submitted
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="py-5 px-6 text-[var(--text-secondary)] font-medium text-base">{lic.expiry}</td>
                                                            <td className="py-5 px-6">
                                                                {lic.hasFile && lic.credentialId ? (
                                                                    <CredentialFileLink credentialId={lic.credentialId} />
                                                                ) : (
                                                                    <span className="text-[var(--text-tertiary)]">&mdash;</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                {profile.presenterBio && (
                                    <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-subtle)] p-6">
                                        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                                            <h3 className="font-heading text-lg font-bold text-[var(--text-primary)]">Presenter bio (SCECH)</h3>
                                            <CopyButton text={profile.presenterBio} label="Copy bio" />
                                        </div>
                                        <p className="text-sm text-[var(--text-secondary)] mb-4">
                                            Copy this bio for SCECH continuing-education applications.
                                        </p>
                                        <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">{profile.presenterBio}</p>
                                    </div>
                                )}

                                {profile.teamMembers && profile.teamMembers.length > 0 && (
                                    <div className="rounded-lg border border-[var(--border-default)] bg-white p-6">
                                        <h3 className="font-heading text-lg font-bold text-[var(--text-primary)] mb-1">Co-presenter bios</h3>
                                        <p className="text-sm text-[var(--text-secondary)] mb-4">
                                            Copy a team member&apos;s bio for SCECH paperwork listing multiple presenters.
                                        </p>
                                        <div className="flex flex-col gap-4">
                                            {profile.teamMembers.map((member, i) => (
                                                <div key={i} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4">
                                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                                                            {member.name}
                                                            {member.title && <span className="font-medium text-[var(--text-secondary)]"> — {member.title}</span>}
                                                        </p>
                                                        {member.bio && <CopyButton text={member.bio} />}
                                                    </div>
                                                    {member.bio && (
                                                        <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">{member.bio}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="experience" className="mt-0 outline-none animate-in fade-in duration-300">
                                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Resume / CV</h2>
                                <p className="text-sm text-[var(--text-secondary)] mb-6">
                                    Download the consultant&apos;s uploaded resume. Experience details live in the document itself.
                                </p>
                                {resumeFile ? (
                                    <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-subtle)] p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-[var(--text-primary)] truncate">{resumeFile.fileName}</p>
                                            <p className="text-sm text-[var(--text-secondary)] mt-1">PDF or Word document provided by the consultant.</p>
                                        </div>
                                        <a
                                            href={resumeFile.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center justify-center rounded-lg bg-[var(--accent-primary)] px-5 py-2.5 text-sm font-bold text-white hover:bg-[var(--accent-primary-h)]"
                                        >
                                            Download resume
                                        </a>
                                    </div>
                                ) : (
                                    <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-8 text-center">
                                        <h3 className="font-heading text-lg font-bold text-[var(--text-primary)] mb-2">No resume uploaded yet</h3>
                                        <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
                                            This consultant has not attached a Resume/CV. Message them or request it as part of a proposal.
                                        </p>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="availability" className="mt-0 outline-none animate-in fade-in duration-300">
                                <div className="flex justify-between items-start mb-6 flex-wrap gap-3">
                                    <div>
                                        <h2 className="text-2xl font-bold text-[var(--text-primary)]">Availability</h2>
                                        <p className="text-sm text-[var(--text-secondary)] font-medium mt-1">
                                            Availability is a status indicator only. Dates and scope are confirmed after you post a need.
                                        </p>
                                    </div>
                                    <span className={cn("inline-flex items-center gap-2 px-4 py-2 border rounded-lg font-bold text-sm", availabilityClass)}>
                                        {profile.availabilityStatus === "open" && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                                        {availabilityLabel}
                                    </span>
                                </div>
                                <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-5">
                                    <p className="text-sm text-[var(--text-secondary)]">
                                        Educators update this status manually. Use post-based hiring to confirm exact dates and expectations.
                                    </p>
                                </div>
                                <PrimaryButton onClick={() => handleRequestEducator()} className="w-full mt-4 sm:w-auto">
                                    Post a need
                                </PrimaryButton>
                            </TabsContent>
                        </div>

                        {/* Bottom Pills */}
                        <div className="px-8 md:px-12 pb-8 md:pb-12 flex flex-wrap gap-3">
                            {profile.areas.map((area) => (
                                <span key={area} className="px-4 py-2 bg-[var(--bg-hover)] border border-[var(--border-strong)] rounded-lg text-sm font-bold text-[var(--text-secondary)] cursor-default">
                                    {area}
                                </span>
                            ))}
                        </div>
                    </Tabs>
                </div>
            </main>
    );

    const mobileCta = isOwnProfile ? (
            <div className="md:hidden fixed bottom-0 left-0 right-0 p-3 bg-white border-t border-[var(--border-subtle)] shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-50">
                <Link href="/dashboard/educator/settings" className="flex items-center justify-center gap-2 w-full h-11 rounded-lg border border-[var(--border-strong)] font-bold text-[var(--text-primary)]">
                    <ArrowLeft weight="bold" className="w-5 h-5" /> Back to settings
                </Link>
            </div>
    ) : (
            <div className="md:hidden fixed bottom-0 left-0 right-0 p-3 bg-white border-t border-[var(--border-subtle)] shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-50">
                <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)]">From</p>
                        <p className="font-heading text-lg font-bold text-[var(--text-primary)] leading-tight">{pricingLabel}</p>
                    </div>
                    <button onClick={handleSaveEducator} aria-label={savedLabel} className="h-11 w-11 rounded-lg border border-[var(--border-strong)] flex items-center justify-center text-[var(--text-primary)]">
                        <BookmarkSimple weight={saved ? "fill" : "bold"} className="w-5 h-5" />
                    </button>
                    <button onClick={handleMessageEducator} aria-label="Message educator" className="h-11 w-11 rounded-lg border border-[var(--border-strong)] flex items-center justify-center text-[var(--text-primary)]">
                        <ChatCircle weight="bold" className="w-5 h-5" />
                    </button>
                    <PrimaryButton onClick={() => handleRequestEducator()} className="px-4 py-3 text-sm">
                        Post a need
                    </PrimaryButton>
                </div>
            </div>
    );

    return signedIn ? (
        <div className="flex h-screen bg-[var(--bg-subtle)] font-sans pt-14 lg:pt-0">
            <Sidebar />
            <div className="flex-1 overflow-y-auto w-full flex flex-col">
                {profileMain}
                {mobileCta}
            </div>
        </div>
    ) : (
        <div className="min-h-screen bg-[var(--bg-app)] flex flex-col font-sans">
            <SiteHeader />
            {profileMain}
            {mobileCta}
            <SiteFooter />
        </div>
    );
}
