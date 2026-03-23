"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/shared/page-header";
import { TaxonomyFilter } from "@/components/shared/taxonomy-filter";
import { EducatorCard, type EducatorCardProps } from "@/components/shared/educator-card";
import { TAXONOMY } from "@/lib/taxonomy";
import { PrimaryButton } from "@/components/shared/button";
import { ArrowLeft, FadersHorizontal, Lightning, Star, Clock, MapPin, Funnel } from "@phosphor-icons/react";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { cn } from "@/lib/utils";
import { MOCK_EDUCATORS } from "@/lib/mock-educators";
import { isDistrictRole } from "@/lib/roles";

const USE_CONVEX_BROWSE = process.env.NEXT_PUBLIC_USE_CONVEX_BROWSE === "true";

const QUICK_FILTERS = [
    { id: "quick_avail", label: "Available Now", icon: Clock, color: "text-emerald-600", bg: "bg-emerald-50 hover:bg-emerald-100 border-emerald-200" },
    { id: "quick_top", label: "Top-Rated (4.8+)", icon: Star, color: "text-amber-500", bg: "bg-amber-50 hover:bg-amber-100 border-amber-200" },
    { id: "quick_local", label: "Local to Me", icon: MapPin, color: "text-blue-600", bg: "bg-blue-50 hover:bg-blue-100 border-blue-200" },
    { id: "quick_instant", label: "Instant Book", icon: Lightning, color: "text-purple-600", bg: "bg-purple-50 hover:bg-purple-100 border-purple-200" },
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

    const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
    const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
    const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
    const [selectedEngagements, setSelectedEngagements] = useState<string[]>([]);
    const [verifiedOnly, setVerifiedOnly] = useState(false);
    const [availableNow, setAvailableNow] = useState(false);
    const [sortOption, setSortOption] = useState("relevance");
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
    
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
            if (id === "quick_avail") setAvailableNow(true);
        }
    };

    // Filter logic
    const filteredEducators = roster.filter((educator) => {
        if (selectedAreas.length > 0 && !selectedAreas.some(area => educator.areasOfNeed.includes(area))) return false;
        if (selectedGrades.length > 0 && !selectedGrades.some(grade => educator.gradeLevels.includes(grade))) return false;
        if (selectedRegions.length > 0 && !selectedRegions.some(region => educator.coverageRegions.includes(region))) return false;
        if (selectedEngagements.length > 0 && !selectedEngagements.some(eng => educator.engagementTypes.includes(eng))) return false;
        if (verifiedOnly && (educator.verificationTier as string) === 'basic') return false; 
        if (availableNow && educator.availabilityStatus !== 'open') return false;
        if (activeQuickFilter === "quick_top" && educator.overallRating < 4.8) return false;
        return true;
    });

    // Sort logic
    if (sortOption === "rating") {
        filteredEducators.sort((a, b) => b.overallRating - a.overallRating);
    } else if (sortOption === "availability") {
        filteredEducators.sort((a, b) => (b.availabilityStatus === 'open' ? 1 : 0) - (a.availabilityStatus === 'open' ? 1 : 0));
    } else if (sortOption === "rate") {
        filteredEducators.sort((a, b) => (a.startingRate ?? 0) - (b.startingRate ?? 0));
    }

    return (
        <div className="min-h-screen bg-[--bg-app] flex flex-col font-sans">
            <SiteHeader />
            <div className="max-w-7xl mx-auto w-full flex flex-col flex-1 pt-8 pb-16 px-6 lg:px-12">
                
                <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-[--text-secondary] hover:text-[--text-primary] mb-6 w-fit">
                    <ArrowLeft className="w-4 h-4" /> Home
                </Link>

                <PageHeader
                    title="Find K-12 Educators"
                    description="Browse and connect with verified specialists for your district's needs."
                    actions={<PrimaryButton onClick={() => alert("Loading saved educators...")}>Saved Educators</PrimaryButton>}
                />

                {USE_CONVEX_BROWSE && (
                    <div
                        className={cn(
                            "mt-4 rounded-xl border px-4 py-3 text-sm font-medium",
                            convexLive
                                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                                : convexLoading
                                  ? "border-amber-200 bg-amber-50 text-amber-950"
                                  : "border-[--border-subtle] bg-[--bg-surface] text-[--text-secondary]"
                        )}
                    >
                        {convexLoading && "Loading live directory from Convex…"}
                        {!convexLoading && convexLive && "Showing live directory data (Convex)."}
                        {!convexLoading && !convexLive && viewer === null && "Signed out — showing demo directory. Sign in as a district user to use live data."}
                        {!convexLoading && !convexLive && viewer && !districtOK && "Educator workspace — showing demo directory. Use a district account for the live roster."}
                        {!convexLoading && !convexLive && viewer === undefined && "Checking session…"}
                    </div>
                )}

                <div className="flex flex-col lg:flex-row gap-8 mt-8">
                    
                    {/* Mobile Filter Toggle */}
                    <button 
                        className="lg:hidden flex items-center justify-center gap-2 w-full py-3 bg-[--bg-surface] border border-[--border-default] rounded-xl text-[--text-primary] font-semibold shadow-sm"
                        onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
                    >
                        <Funnel weight="bold" className="w-4 h-4" /> {mobileFilterOpen ? "Hide Filters" : "Show Filters"}
                    </button>

                    {/* Facet Panel */}
                    <aside className={`w-full lg:w-[280px] flex-shrink-0 flex-col gap-6 lg:flex ${mobileFilterOpen ? 'flex' : 'hidden'}`}>
                        <div className="bg-[--bg-surface] border border-[--border-subtle] rounded-2xl p-6 flex flex-col gap-6 sticky top-24 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
                            <h3 className="font-heading text-lg font-bold text-[--text-primary] flex items-center gap-2">
                                <FadersHorizontal weight="bold" className="w-4 h-4 text-[--text-tertiary]" /> Filters
                            </h3>

                            <div className="flex flex-col gap-3">
                                <span className="text-xs font-bold text-[--text-tertiary] uppercase tracking-wider">
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
                                <span className="text-xs font-bold text-[--text-tertiary] uppercase tracking-wider">
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
                                <span className="text-xs font-bold text-[--text-tertiary] uppercase tracking-wider">
                                    Grade Level
                                </span>
                                <TaxonomyFilter
                                    label="Select Grades"
                                    options={TAXONOMY.gradeLevelBands}
                                    selected={selectedGrades}
                                    onChange={(id) => toggleFilter(setSelectedGrades, id)}
                                />
                            </div>

                            <div className="h-px bg-[--border-subtle] w-full my-1" />

                            <div className="flex flex-col gap-4">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 rounded border-[--border-strong] text-[--accent-primary] focus:ring-[--accent-primary]"
                                        checked={verifiedOnly}
                                        onChange={(e) => setVerifiedOnly(e.target.checked)}
                                    />
                                    <span className="text-sm font-semibold text-[--text-secondary] group-hover:text-[--text-primary]">Verified Only</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 rounded border-[--border-strong] text-[--accent-primary] focus:ring-[--accent-primary]"
                                        checked={availableNow}
                                        onChange={(e) => setAvailableNow(e.target.checked)}
                                    />
                                    <span className="text-sm font-semibold text-[--text-secondary] group-hover:text-[--text-primary]">Available Now</span>
                                </label>
                            </div>

                            <div className="h-px bg-[--border-subtle] w-full my-1" />

                            <button
                                className="text-sm font-bold text-[--text-tertiary] hover:text-[--text-primary] text-left transition-colors"
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
                                        activeQuickFilter === f.id ? f.bg + " ring-2 ring-offset-2 ring-" + f.color.split('-')[1] + "-200" : "bg-white border-[--border-subtle] text-[--text-secondary] hover:border-[--border-strong] hover:shadow-sm"
                                    )}
                                >
                                    <f.icon weight={f.id === 'quick_top' ? 'fill' : 'regular'} className={cn("w-4 h-4", activeQuickFilter === f.id ? f.color : "text-[--text-tertiary]")} />
                                    <span className={activeQuickFilter === f.id ? "text-[--text-primary]" : ""}>{f.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                            <span className="text-sm font-semibold text-[--text-secondary]">
                                Showing {filteredEducators.length} result{filteredEducators.length !== 1 ? 's' : ''}
                            </span>

                            <select 
                                className="h-10 px-3 rounded-lg border border-[--border-subtle] bg-white text-[--text-primary] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[--accent-primary]/20 shadow-sm cursor-pointer"
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
                            <div className="flex flex-col items-center justify-center p-16 bg-white border border-[--border-subtle] shadow-sm rounded-3xl text-center">
                                <div className="w-20 h-20 bg-[--bg-subtle] rounded-full flex items-center justify-center mb-5">
                                    <Funnel weight="regular" className="w-10 h-10 text-[--text-tertiary]" />
                                </div>
                                <h3 className="text-2xl font-heading font-bold text-[--text-primary] mb-2">No educators found</h3>
                                <p className="text-[--text-secondary] max-w-sm mb-8">We couldn&apos;t find any educators matching your exact criteria. Try removing some filters to see more results.</p>
                                <PrimaryButton 
                                    className="px-8 shadow-sm bg-[--accent-secondary] text-[--text-primary] hover:bg-[--accent-secondary]/90"
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
            <SiteFooter />
        </div>
    );
}
