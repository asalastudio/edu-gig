"use client";

import React, { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/shared/page-header";
import { TaxonomyFilter } from "@/components/shared/taxonomy-filter";
import { EducatorCard, type EducatorCardProps } from "@/components/shared/educator-card";
import { TAXONOMY, getAreaOfNeedLabel, getCoverageRegionLabel } from "@/lib/taxonomy";
import {
    filterEducatorRoster,
} from "@/lib/filter-educators";
import { PrimaryButton } from "@/components/shared/button";
import { ArrowLeft, FadersHorizontal, Funnel } from "@phosphor-icons/react";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Sidebar } from "@/components/shared/sidebar";
import { cn } from "@/lib/utils";
import { isDistrictRole } from "@/lib/roles";
import { authPagePath } from "@/lib/auth-intent";
import { readDirectoryState, writeDirectoryState, type DirectoryState } from "@/lib/discovery-state";
import { useSavedConsultants } from "@/lib/use-saved-consultants";

const USE_CONVEX_BROWSE = process.env.NEXT_PUBLIC_USE_CONVEX_BROWSE === "true";

export default function BrowsePage() { return <Suspense fallback={null}><BrowseDirectory /></Suspense>; }
function BrowseDirectory() {
    const router = useRouter();
    const viewer = useQuery(api.users.viewer, {});
    const districtOK = !!viewer && isDistrictRole(viewer.role);

    // Educators must not be able to browse other educators. Bounce a signed-in
    // educator to the shared Gig Board instead of showing a "use a district
    // account" gate. Only redirect once the viewer is loaded and confirmed
    // educator — never districts or signed-out users.
    useEffect(() => {
        if (viewer?.role === "educator") {
            router.replace("/dashboard/board");
        }
    }, [viewer, router]);
    const districtMine = useQuery(api.districts.getMine, districtOK ? {} : "skip");
    const convexEducators = useQuery(
        api.educators.listForBrowse,
        USE_CONVEX_BROWSE && districtOK ? {} : "skip"
    );

    const roster: EducatorCardProps[] = useMemo(() => {
        if (USE_CONVEX_BROWSE && viewer !== undefined && districtOK && convexEducators !== undefined) {
            return convexEducators;
        }
        return [];
    }, [viewer, districtOK, convexEducators]);

    const convexLive =
        USE_CONVEX_BROWSE && viewer !== undefined && districtOK && convexEducators !== undefined;
    const convexLoading =
        USE_CONVEX_BROWSE && viewer !== undefined && districtOK && convexEducators === undefined;
    const sessionChecking = USE_CONVEX_BROWSE && viewer === undefined;
    const needsDistrictSignIn = USE_CONVEX_BROWSE && viewer === null;
    const wrongAccountType = USE_CONVEX_BROWSE && !!viewer && !districtOK;

    const searchParams = useSearchParams();
    const directoryState = readDirectoryState(new URLSearchParams(searchParams.toString()));
    const {selectedAreas, selectedSpecializations, selectedGrades, selectedRegions, selectedEngagements, verifiedOnly, availableNow, sortOption, showSavedOnly} = directoryState;
    const directoryPath = `/browse${searchParams.toString() ? `?${searchParams}` : ""}`;
    const setField = <K extends keyof DirectoryState>(key:K) => (value: React.SetStateAction<DirectoryState[K]>) => {
        const next = typeof value === 'function' ? (value as (old:DirectoryState[K])=>DirectoryState[K])(directoryState[key]) : value;
        const query=writeDirectoryState({...directoryState,[key]:next});
        router.replace(`/browse${query ? `?${query}` : ""}`,{scroll:false});
    };
    const setSelectedAreas=setField('selectedAreas'), setSelectedSpecializations=setField('selectedSpecializations'), setSelectedGrades=setField('selectedGrades'), setSelectedRegions=setField('selectedRegions'), setSelectedEngagements=setField('selectedEngagements');
    const setVerifiedOnly=setField('verifiedOnly'),setAvailableNow=setField('availableNow'),setSortOption=setField('sortOption'),setShowSavedOnly=setField('showSavedOnly');
    const [mobileFilterOpen,setMobileFilterOpen]=useState(false);
    const {ids:savedEducatorIds}=useSavedConsultants(viewer?._id ?? null);
    const toggleFilter = (setter: React.Dispatch<React.SetStateAction<string[]>>, id: string) => setter(prev=>prev.includes(id)?prev.filter(v=>v!==id):[...prev,id]);
    const clearAvailableNow=()=>setAvailableNow(false);
    const resetFilters=()=>router.replace('/browse',{scroll:false});

    // Filter logic
    const filteredEducators = filterEducatorRoster(roster, {
        selectedAreas,
        selectedSpecializations,
        selectedGrades,
        selectedRegions,
        selectedEngagements,
        verifiedOnly,
        availableNow,
        showSavedOnly,
        savedEducatorIds,
        activeQuickFilter: null,
        districtRegion: districtMine?.region,
    });

    const activeFilterChips = [
        ...selectedSpecializations.map(id=>({id:`specialization:${id}`,label:getAreaOfNeedLabel(id),clear:()=>setSelectedSpecializations(prev=>prev.filter(v=>v!==id))})),
        ...selectedAreas.map((id) => ({ id: `area:${id}`, label: getAreaOfNeedLabel(id), clear: () => setSelectedAreas((prev) => prev.filter((v) => v !== id)) })),
        ...selectedGrades.map((id) => ({ id: `grade:${id}`, label: TAXONOMY.gradeLevelBands.find((g) => g.id === id)?.label ?? id, clear: () => setSelectedGrades((prev) => prev.filter((v) => v !== id)) })),
        ...selectedRegions.map((id) => ({ id: `region:${id}`, label: getCoverageRegionLabel(id), clear: () => setSelectedRegions((prev) => prev.filter((v) => v !== id)) })),
        ...selectedEngagements.map((id) => ({ id: `engagement:${id}`, label: TAXONOMY.engagementTypes.find((e) => e.id === id)?.label ?? id, clear: () => setSelectedEngagements((prev) => prev.filter((v) => v !== id)) })),
        ...(availableNow ? [{ id: "available", label: "Accepting new clients", clear: clearAvailableNow }] : []),
        ...(verifiedOnly ? [{ id: "verified", label: "Credentials reviewed", clear: () => setVerifiedOnly(false) }] : []),
        ...(showSavedOnly ? [{ id: "saved", label: "Saved consultants", clear: () => setShowSavedOnly(false) }] : []),
    ];

    // Sort logic
    if (sortOption === "availability") {
        filteredEducators.sort((a, b) => (b.availabilityStatus === 'open' ? 1 : 0) - (a.availabilityStatus === 'open' ? 1 : 0));
    } else if (sortOption === "rate") {
        filteredEducators.sort((a, b) => (a.startingRate ?? 0) - (b.startingRate ?? 0));
    }

    const canUseDirectory = convexLive;
    const signedIn = !!viewer;
    const emptyState = (() => {
        if (sessionChecking) {
            return {
                title: "Preparing the directory",
                body: "We’re checking your session before loading district-ready educator profiles.",
                action: null,
            };
        }
        if (needsDistrictSignIn) {
            return {
                title: "Sign in to view the live directory",
                body: "The educator directory is available to district hiring teams. Sign in or create a district account to browse profiles, save favorites, and discuss a need.",
                action: (
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link href={authPagePath("/sign-in", "district", directoryPath)}>
                            <PrimaryButton>Sign in to browse</PrimaryButton>
                        </Link>
                        <Link href={authPagePath("/sign-up", "district", directoryPath)}>
                            <button className="w-full sm:w-auto px-6 py-3 rounded-lg border border-[var(--border-strong)] font-bold text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]">
                                Create district account
                            </button>
                        </Link>
                    </div>
                ),
            };
        }
        if (wrongAccountType) {
            return {
                title: "Use a district account",
                body: "Educator accounts can manage profiles and gigs. Browse access is reserved for district hiring teams.",
                action: (
                    <Link href={authPagePath("/sign-in", "district", directoryPath)}>
                        <PrimaryButton>Choose another account</PrimaryButton>
                    </Link>
                ),
            };
        }
        return {
            title: "No educators found",
            body: "Try removing a filter or broadening the coverage area to see more profiles.",
            action: (
                <PrimaryButton
                    className="px-6 shadow-sm bg-[var(--accent-secondary)] text-[var(--text-primary)] hover:bg-[var(--accent-secondary)]/90"
                    onClick={resetFilters}
                >
                    Clear filters
                </PrimaryButton>
            ),
        };
    })();

    const directoryBody = (
            <div className="max-w-7xl mx-auto w-full flex flex-col flex-1 px-6 pb-14 pt-6 lg:px-12 lg:pb-16 lg:pt-8">

                {!signedIn && (
                    <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-5 w-fit">
                        <ArrowLeft className="w-4 h-4" /> Home
                    </Link>
                )}

                <PageHeader
                    title="Find K-12 Consultants"
                    description={
                        needsDistrictSignIn
                            ? "The live educator directory is available to district hiring teams."
                            : "Browse and connect with consultants for your district's needs."
                    }
                    actions={
                        districtOK ? (
                            <PrimaryButton onClick={() => setShowSavedOnly((v) => !v)}>
                                {showSavedOnly ? "Show All" : `Saved Consultants (${savedEducatorIds.length})`}
                            </PrimaryButton>
                        ) : undefined
                    }
                />

                {USE_CONVEX_BROWSE && !needsDistrictSignIn && (
                    <div
                        className={cn(
                            "mt-4 inline-flex w-fit max-w-full rounded-lg border px-3 py-2 text-xs font-semibold",
                            convexLive
                                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                                : convexLoading
                                  ? "border-amber-200 bg-amber-50 text-amber-950"
                                  : "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)]"
                        )}
                    >
                        {convexLoading && "Loading district directory…"}
                        {!convexLoading && convexLive && "Showing the district directory."}
                        {!convexLoading && !convexLive && viewer === null && "Sign in with a district account to save educators and use the live roster."}
                        {!convexLoading && !convexLive && viewer && !districtOK && "Use a district account to access live district hiring tools."}
                        {!convexLoading && !convexLive && viewer === undefined && "Checking session…"}
                    </div>
                )}

                <div className="flex flex-col lg:flex-row gap-6 mt-7">
                    
                    {/* Mobile Filter Toggle */}
                    <button 
                        className="lg:hidden flex items-center justify-center gap-2 w-full py-3 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] font-semibold shadow-sm"
                        onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
                    >
                        <Funnel weight="bold" className="w-4 h-4" /> {mobileFilterOpen ? "Hide Filters" : "Show Filters"}
                    </button>

                    {/* Facet Panel */}
                    <aside className={`w-full lg:w-[280px] flex-shrink-0 flex-col gap-6 lg:flex ${mobileFilterOpen ? 'flex' : 'hidden'}`}>
                        <div className="surface-raised p-5 flex flex-col gap-5 sticky top-24">
                            <h3 className="font-heading text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                                <FadersHorizontal weight="bold" className="w-4 h-4 text-[var(--text-secondary)]" /> Filters
                            </h3>

                            <div className="flex flex-col gap-3">
                                <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                                    Support Type
                                </span>
                                <TaxonomyFilter
                                    label="Select Support"
                                    options={TAXONOMY.areasOfNeed}
                                    selected={selectedAreas}
                                    onChange={(id) => toggleFilter(setSelectedAreas, id)}
                                />
                            </div>

                            <div className="flex flex-col gap-3">
                                <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Specialization</span>
                                <TaxonomyFilter label="Select Specializations" options={TAXONOMY.areasOfNeed.filter(a=>selectedAreas.length===0 || selectedAreas.includes(a.id)).flatMap(a=>a.subCategories.map(s=>({id:s.id,label:s.label})))} selected={selectedSpecializations} onChange={id=>toggleFilter(setSelectedSpecializations,id)} />
                            </div>
                            {/* Hidden while the platform is consulting-only (PRD v3
                                Issue #6) — a single-option filter is noise. Restore
                                when more engagement types launch. */}
                            {TAXONOMY.engagementTypes.length > 1 && (
                                <div className="flex flex-col gap-3">
                                    <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                                        Engagement Type
                                    </span>
                                    <TaxonomyFilter
                                        label="Select Engagement"
                                        options={TAXONOMY.engagementTypes}
                                        selected={selectedEngagements}
                                        onChange={(id) => toggleFilter(setSelectedEngagements, id)}
                                    />
                                </div>
                            )}

                            <div className="flex flex-col gap-3">
                                <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                                    Grade Level
                                </span>
                                <TaxonomyFilter
                                    label="Select Grades"
                                    options={TAXONOMY.gradeLevelBands}
                                    selected={selectedGrades}
                                    onChange={(id) => toggleFilter(setSelectedGrades, id)}
                                />
                            </div>

                            <div className="flex flex-col gap-3">
                                <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                                    Coverage Area
                                </span>
                                <TaxonomyFilter
                                    label="Select Areas"
                                    options={TAXONOMY.coverageRegions}
                                    selected={selectedRegions}
                                    onChange={(id) => toggleFilter(setSelectedRegions, id)}
                                />
                            </div>

                            <div className="h-px bg-[var(--border-subtle)] w-full my-1" />

                            <div className="flex flex-col gap-4">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 rounded border-[var(--border-strong)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
                                        checked={verifiedOnly}
                                        onChange={(e) => setVerifiedOnly(e.target.checked)}
                                    />
                                    <span className="text-sm font-semibold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">Credentials reviewed</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 rounded border-[var(--border-strong)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
                                        checked={availableNow}
                                        onChange={(e) => setAvailableNow(e.target.checked)}
                                    />
                                    <span className="text-sm font-semibold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">Accepting new clients</span>
                                </label>
                            </div>

                            <div className="h-px bg-[var(--border-subtle)] w-full my-1" />

                            <button
                                className="text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-left transition-colors"
                                onClick={resetFilters}
                            >
                                Clear All Filters
                            </button>
                        </div>
                    </aside>

                    {/* Results Grid */}
                    <main className="flex-1 flex flex-col">
                        
                        {activeFilterChips.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-5">
                                {activeFilterChips.map((chip) => (
                                    <button
                                        key={chip.id}
                                        onClick={chip.clear}
                                        className="px-3 py-1.5 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                    >
                                        {chip.label} ×
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                            <span className="text-sm font-semibold text-[var(--text-secondary)]">
                                {canUseDirectory
                                    ? `Showing ${filteredEducators.length} result${filteredEducators.length !== 1 ? "s" : ""}`
                                    : needsDistrictSignIn
                                      ? "Sign in to see educator results"
                                      : sessionChecking
                                        ? "Checking your session…"
                                        : `Showing ${filteredEducators.length} result${filteredEducators.length !== 1 ? "s" : ""}`}
                            </span>

                            <select aria-label="Sort consultants"
                                className="h-10 px-3 rounded-lg border border-[var(--border-subtle)] bg-white text-[var(--text-primary)] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 shadow-sm cursor-pointer"
                                value={sortOption}
                                onChange={(e) => setSortOption(e.target.value as DirectoryState["sortOption"])}
                            >
                                <option value="relevance">Sort by: Relevance</option>
                                <option value="availability">Sort by: Availability</option>
                                <option value="rate">Sort by: Rate</option>
                            </select>
                        </div>

                        {filteredEducators.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                {filteredEducators.map(educator => (
                                    <EducatorCard
                                        key={educator.id}
                                        educator={educator}
                                        highlightedAreaIds={selectedAreas}
                                        returnTo={directoryPath}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="flex min-h-[360px] flex-col items-center justify-center surface-raised p-8 text-center md:p-10">
                                <div className="w-16 h-16 bg-[var(--bg-subtle)] rounded-full flex items-center justify-center mb-4">
                                    <Funnel weight="regular" className="w-8 h-8 text-[var(--text-secondary)]" />
                                </div>
                                <h3 className="text-xl font-heading font-bold text-[var(--text-primary)] mb-2">{emptyState.title}</h3>
                                <p className="text-sm leading-6 text-[var(--text-secondary)] max-w-sm mb-6">{emptyState.body}</p>
                                {emptyState.action}
                            </div>
                        )}
                    </main>

                </div>
            </div>
    );

    return signedIn ? (
        <div className="flex h-screen bg-[var(--bg-subtle)] font-sans pt-14 lg:pt-0">
            <Sidebar />
            <div className="flex-1 overflow-y-auto w-full flex flex-col">
                {directoryBody}
            </div>
        </div>
    ) : (
        <div className="min-h-screen bg-[var(--bg-app)] flex flex-col font-sans">
            <SiteHeader />
            {directoryBody}
            <SiteFooter />
        </div>
    );
}
