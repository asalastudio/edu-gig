"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/shared/page-header";
import { TaxonomyFilter } from "@/components/shared/taxonomy-filter";
import { EducatorCard, type EducatorCardProps } from "@/components/shared/educator-card";
import { TAXONOMY, getAreaOfNeedLabel, getCoverageRegionLabel } from "@/lib/taxonomy";
import { PrimaryButton } from "@/components/shared/button";
import { ArrowLeft, FadersHorizontal, Lightning, Star, Clock, MapPin, Funnel } from "@phosphor-icons/react";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Sidebar } from "@/components/shared/sidebar";
import { cn } from "@/lib/utils";
import { MOCK_EDUCATORS } from "@/lib/mock-educators";
import { isDistrictRole } from "@/lib/roles";

const USE_CONVEX_BROWSE = process.env.NEXT_PUBLIC_USE_CONVEX_BROWSE === "true";

function searchParamList(name: string, fallback?: string): string[] {
    if (typeof window === "undefined") return [];
    const params = new URLSearchParams(window.location.search);
    const value = params.get(name) ?? (fallback ? params.get(fallback) : null);
    return value ? [value] : [];
}

function savedEducatorIdsFromStorage(): string[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = window.localStorage.getItem("k12gig_saved_educators");
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

const QUICK_FILTERS = [
    { id: "quick_avail", label: "Available Now", icon: Clock, color: "text-emerald-700", active: "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 ring-emerald-100" },
    { id: "quick_top", label: "Top-Rated (4.8+)", icon: Star, color: "text-[var(--accent-secondary)]", active: "bg-amber-50 hover:bg-amber-100 border-amber-200 ring-amber-100" },
    { id: "quick_local", label: "Local to Me", icon: MapPin, color: "text-[var(--accent-tertiary)]", active: "bg-sky-50 hover:bg-sky-100 border-sky-200 ring-sky-100" },
    { id: "quick_instant", label: "Instant Book", icon: Lightning, color: "text-[var(--accent-primary)]", active: "bg-green-50 hover:bg-green-100 border-green-200 ring-green-100" },
];

export default function BrowsePage() {
    const viewer = useQuery(api.users.viewer, {});
    const districtOK = !!viewer && isDistrictRole(viewer.role);
    const convexEducators = useQuery(
        api.educators.listForBrowse,
        USE_CONVEX_BROWSE && districtOK ? {} : "skip"
    );

    const roster: EducatorCardProps[] = useMemo(() => {
        if (USE_CONVEX_BROWSE && viewer !== undefined && districtOK && convexEducators !== undefined) {
            return convexEducators;
        }
        return MOCK_EDUCATORS;
    }, [viewer, districtOK, convexEducators]);

    const convexLive =
        USE_CONVEX_BROWSE && viewer !== undefined && districtOK && convexEducators !== undefined;
    const convexLoading =
        USE_CONVEX_BROWSE && viewer !== undefined && districtOK && convexEducators === undefined;

    const [selectedAreas, setSelectedAreas] = useState<string[]>(() => searchParamList("area"));
    const [selectedGrades, setSelectedGrades] = useState<string[]>(() => searchParamList("grade"));
    const [selectedRegions, setSelectedRegions] = useState<string[]>(() => searchParamList("region", "location"));
    const [selectedEngagements, setSelectedEngagements] = useState<string[]>(() => searchParamList("engagement"));
    const [verifiedOnly, setVerifiedOnly] = useState(false);
    const [availableNow, setAvailableNow] = useState(false);
    const [sortOption, setSortOption] = useState("relevance");
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
    const [showSavedOnly, setShowSavedOnly] = useState(false);
    const [savedEducatorIds] = useState<string[]>(() => savedEducatorIdsFromStorage());
    
    // Quick filter active state
    const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>(null);

    const toggleFilter = (setter: React.Dispatch<React.SetStateAction<string[]>>, id: string) => {
        setter(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]);
    };

    const handleQuickFilter = (id: string) => {
        if (activeQuickFilter === id) {
            setActiveQuickFilter(null);
            setAvailableNow(false);
        } else {
            setActiveQuickFilter(id);
            setAvailableNow(id === "quick_avail" || id === "quick_instant");
        }
    };

    // Filter logic
    const filteredEducators = roster.filter((educator) => {
        if (selectedAreas.length > 0 && !selectedAreas.some(area => educator.areasOfNeed.includes(area))) return false;
        if (selectedGrades.length > 0 && !selectedGrades.some(grade => educator.gradeLevels.includes(grade))) return false;
        if (selectedRegions.length > 0 && !selectedRegions.some(region => educator.coverageRegions.includes(region))) return false;
        if (selectedEngagements.length > 0 && !selectedEngagements.some(eng => educator.engagementTypes.includes(eng))) return false;
        if (showSavedOnly && !savedEducatorIds.includes(educator.id)) return false;
        if (verifiedOnly && (educator.verificationTier as string) === 'basic') return false; 
        if (availableNow && educator.availabilityStatus !== 'open') return false;
        if (activeQuickFilter === "quick_top" && educator.overallRating < 4.8) return false;
        if (activeQuickFilter === "quick_local" && !educator.coverageRegions.some((region) => region === "all" || region === "region_1")) return false;
        if (activeQuickFilter === "quick_instant" && (!educator.startingRate || educator.availabilityStatus !== "open")) return false;
        return true;
    });

    const activeFilterChips = [
        ...selectedAreas.map((id) => ({ id: `area:${id}`, label: getAreaOfNeedLabel(id), clear: () => setSelectedAreas((prev) => prev.filter((v) => v !== id)) })),
        ...selectedGrades.map((id) => ({ id: `grade:${id}`, label: TAXONOMY.gradeLevelBands.find((g) => g.id === id)?.label ?? id, clear: () => setSelectedGrades((prev) => prev.filter((v) => v !== id)) })),
        ...selectedRegions.map((id) => ({ id: `region:${id}`, label: getCoverageRegionLabel(id), clear: () => setSelectedRegions((prev) => prev.filter((v) => v !== id)) })),
        ...selectedEngagements.map((id) => ({ id: `engagement:${id}`, label: TAXONOMY.engagementTypes.find((e) => e.id === id)?.label ?? id, clear: () => setSelectedEngagements((prev) => prev.filter((v) => v !== id)) })),
        ...(availableNow ? [{ id: "available", label: "Available now", clear: () => setAvailableNow(false) }] : []),
        ...(activeQuickFilter === "quick_top" ? [{ id: "quick_top", label: "Top-rated", clear: () => setActiveQuickFilter(null) }] : []),
        ...(activeQuickFilter === "quick_local" ? [{ id: "quick_local", label: "Local coverage", clear: () => setActiveQuickFilter(null) }] : []),
        ...(activeQuickFilter === "quick_instant" ? [{ id: "quick_instant", label: "Ready to request", clear: () => setActiveQuickFilter(null) }] : []),
        ...(verifiedOnly ? [{ id: "verified", label: "Verified only", clear: () => setVerifiedOnly(false) }] : []),
        ...(showSavedOnly ? [{ id: "saved", label: "Saved educators", clear: () => setShowSavedOnly(false) }] : []),
    ];

    // Sort logic
    if (sortOption === "rating") {
        filteredEducators.sort((a, b) => b.overallRating - a.overallRating);
    } else if (sortOption === "availability") {
        filteredEducators.sort((a, b) => (b.availabilityStatus === 'open' ? 1 : 0) - (a.availabilityStatus === 'open' ? 1 : 0));
    } else if (sortOption === "rate") {
        filteredEducators.sort((a, b) => (a.startingRate ?? 0) - (b.startingRate ?? 0));
    }

    const signedIn = !!viewer;
    const directoryBody = (
            <div className="max-w-7xl mx-auto w-full flex flex-col flex-1 pt-8 pb-16 px-6 lg:px-12">

                {!signedIn && (
                    <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-6 w-fit">
                        <ArrowLeft className="w-4 h-4" /> Home
                    </Link>
                )}

                <PageHeader
                    title="Find K-12 Educators"
                    description="Browse and connect with verified specialists for your district's needs."
                    actions={<PrimaryButton onClick={() => setShowSavedOnly((v) => !v)}>{showSavedOnly ? "Show All" : `Saved Educators (${savedEducatorIds.length})`}</PrimaryButton>}
                />

                {USE_CONVEX_BROWSE && (
                    <div
                        className={cn(
                            "mt-4 rounded-lg border px-4 py-3 text-sm font-medium",
                            convexLive
                                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                                : convexLoading
                                  ? "border-amber-200 bg-amber-50 text-amber-950"
                                  : "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)]"
                        )}
                    >
                        {convexLoading && "Loading district directory…"}
                        {!convexLoading && convexLive && "Showing verified district directory."}
                        {!convexLoading && !convexLive && viewer === null && "Sign in with a district account to save educators and use the live roster."}
                        {!convexLoading && !convexLive && viewer && !districtOK && "Use a district account to access live district hiring tools."}
                        {!convexLoading && !convexLive && viewer === undefined && "Checking session…"}
                    </div>
                )}

                <div className="flex flex-col lg:flex-row gap-8 mt-8">
                    
                    {/* Mobile Filter Toggle */}
                    <button 
                        className="lg:hidden flex items-center justify-center gap-2 w-full py-3 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] font-semibold shadow-sm"
                        onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
                    >
                        <Funnel weight="bold" className="w-4 h-4" /> {mobileFilterOpen ? "Hide Filters" : "Show Filters"}
                    </button>

                    {/* Facet Panel */}
                    <aside className={`w-full lg:w-[280px] flex-shrink-0 flex-col gap-6 lg:flex ${mobileFilterOpen ? 'flex' : 'hidden'}`}>
                        <div className="surface-raised p-6 flex flex-col gap-6 sticky top-24">
                            <h3 className="font-heading text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                                <FadersHorizontal weight="bold" className="w-4 h-4 text-[var(--text-tertiary)]" /> Filters
                            </h3>

                            <div className="flex flex-col gap-3">
                                <span className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
                                    Area of Need
                                </span>
                                <TaxonomyFilter
                                    label="Select Areas"
                                    options={TAXONOMY.areasOfNeed}
                                    selected={selectedAreas}
                                    onChange={(id) => toggleFilter(setSelectedAreas, id)}
                                />
                            </div>

                            <div className="flex flex-col gap-3">
                                <span className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
                                    Engagement Type
                                </span>
                                <TaxonomyFilter
                                    label="Select Engagement"
                                    options={TAXONOMY.engagementTypes}
                                    selected={selectedEngagements}
                                    onChange={(id) => toggleFilter(setSelectedEngagements, id)}
                                />
                            </div>

                            <div className="flex flex-col gap-3">
                                <span className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
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
                                <span className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
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
                                    <span className="text-sm font-semibold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">Verified Only</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 rounded border-[var(--border-strong)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
                                        checked={availableNow}
                                        onChange={(e) => setAvailableNow(e.target.checked)}
                                    />
                                    <span className="text-sm font-semibold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">Available Now</span>
                                </label>
                            </div>

                            <div className="h-px bg-[var(--border-subtle)] w-full my-1" />

                            <button
                                className="text-sm font-bold text-[var(--text-tertiary)] hover:text-[var(--text-primary)] text-left transition-colors"
                                onClick={() => {
                                    setSelectedAreas([]);
                                    setSelectedGrades([]);
                                    setSelectedRegions([]);
                                    setSelectedEngagements([]);
                                    setVerifiedOnly(false);
                                    setAvailableNow(false);
                                    setActiveQuickFilter(null);
                                }}
                            >
                                Clear All Filters
                            </button>
                        </div>
                    </aside>

                    {/* Results Grid */}
                    <main className="flex-1 flex flex-col">
                        
                        {/* Quick Action Filter Chips */}
                        <div className="flex flex-wrap gap-3 mb-6">
                            {QUICK_FILTERS.map(f => (
                                <button 
                                    key={f.id}
                                    onClick={() => handleQuickFilter(f.id)}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold transition-all duration-200",
                                        activeQuickFilter === f.id
                                            ? `${f.active} ring-2 ring-offset-2`
                                            : "bg-white border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:shadow-sm"
                                    )}
                                >
                                    <f.icon weight={f.id === 'quick_top' ? 'fill' : 'regular'} className={cn("w-4 h-4", activeQuickFilter === f.id ? f.color : "text-[var(--text-tertiary)]")} />
                                    <span className={activeQuickFilter === f.id ? "text-[var(--text-primary)]" : ""}>{f.label}</span>
                                </button>
                            ))}
                        </div>

                        {activeFilterChips.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-6">
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

                        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                            <span className="text-sm font-semibold text-[var(--text-secondary)]">
                                Showing {filteredEducators.length} result{filteredEducators.length !== 1 ? 's' : ''}
                            </span>

                            <select 
                                className="h-10 px-3 rounded-lg border border-[var(--border-subtle)] bg-white text-[var(--text-primary)] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 shadow-sm cursor-pointer"
                                value={sortOption}
                                onChange={(e) => setSortOption(e.target.value)}
                            >
                                <option value="relevance">Sort by: Relevance</option>
                                <option value="rating">Sort by: Rating</option>
                                <option value="availability">Sort by: Availability</option>
                                <option value="rate">Sort by: Rate</option>
                            </select>
                        </div>

                        {filteredEducators.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                {filteredEducators.map(educator => (
                                    <EducatorCard key={educator.id} educator={educator} />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-16 surface-raised text-center">
                                <div className="w-20 h-20 bg-[var(--bg-subtle)] rounded-full flex items-center justify-center mb-5">
                                    <Funnel weight="regular" className="w-10 h-10 text-[var(--text-tertiary)]" />
                                </div>
                                <h3 className="text-2xl font-heading font-bold text-[var(--text-primary)] mb-2">No educators found</h3>
                                <p className="text-[var(--text-secondary)] max-w-sm mb-8">We couldn&apos;t find any educators matching your exact criteria. Try removing some filters to see more results.</p>
                                <PrimaryButton 
                                    className="px-8 shadow-sm bg-[var(--accent-secondary)] text-[var(--text-primary)] hover:bg-[var(--accent-secondary)]/90"
                                    onClick={() => {
                                        setSelectedAreas([]);
                                        setSelectedGrades([]);
                                        setSelectedRegions([]);
                                        setSelectedEngagements([]);
                                        setVerifiedOnly(false);
                                        setAvailableNow(false);
                                        setActiveQuickFilter(null);
                                    }}
                                >
                                    Clear All Filters
                                </PrimaryButton>
                            </div>
                        )}
                    </main>

                </div>
            </div>
    );

    return signedIn ? (
        <div className="flex h-screen bg-[var(--bg-subtle)] font-sans">
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
