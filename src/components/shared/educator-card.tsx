import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { PlayCircle, ShieldCheck, Medal, GraduationCap, MapPin, CurrencyDollar } from "@phosphor-icons/react"
import { Card } from "./card"
import { VerificationBadge } from "./verification-badge"
import { AvailabilityPill } from "./availability-pill"
import { TAXONOMY, getAreaOfNeedLabel, getCoverageRegionLabel } from "@/lib/taxonomy"
import { orderAreasForDisplay } from "@/lib/filter-educators"
import Link from "next/link";

export interface EducatorCardProps {
    id: string;
    name: string;
    /** Personal name, shown as a small secondary line when a business name is set. */
    secondaryName?: string;
    headline: string;
    avatarUrl?: string;
    verificationTier: 'basic' | 'verified' | 'premier';
    overallRating: number;       // 0–5
    reviewCount: number;
    gradeLevels: string[];
    areasOfNeed: string[];
    subCategories?: string[];
    engagementTypes: string[];
    coverageRegions: string[];
    startingRate?: number;
    rateUnit?: "hour" | "day";
    availabilityStatus: 'open' | 'limited' | 'closed';
    hasVideoIntro: boolean;
    badges?: string[];
}

export function EducatorCard({
    educator,
    highlightedAreaIds = [],
    returnTo,
}: {
    educator: EducatorCardProps;
    highlightedAreaIds?: string[];
    returnTo?: string;
}) {
    const orderedAreas = orderAreasForDisplay(educator.areasOfNeed, highlightedAreaIds);
    const primaryArea = orderedAreas[0] ? getAreaOfNeedLabel(orderedAreas[0]) : "K-12 support";
    const remainingAreaCount = Math.max(0, orderedAreas.length - 1);
    const coverage = educator.coverageRegions[0] ? getCoverageRegionLabel(educator.coverageRegions[0]) : "Coverage varies";
    const gradeLabels = educator.gradeLevels.map(
        (grade) => TAXONOMY.gradeLevelBands.find((option) => option.id === grade)?.label ?? grade.replace("_", "–")
    );

    return (
        <Card className="p-0 flex flex-col group hover:-translate-y-1 transition-all duration-300 bg-[var(--bg-surface)] overflow-hidden">
            <div className="h-1 w-full bg-[linear-gradient(90deg,var(--accent-primary),var(--accent-tertiary),var(--accent-secondary))]" />
            
            <div className="p-6 flex flex-col gap-5 flex-1">
                {/* — Header Row ——————————————————— */}
                <div className="flex items-start justify-between gap-3">
                    <div className="relative">
                        <Avatar className="h-14 w-14 rounded-lg ring-2 ring-[var(--border-subtle)] shadow-sm">
                            <AvatarImage src={educator.avatarUrl} />
                            <AvatarFallback className="bg-gradient-to-br from-[var(--bg-subtle)] to-[var(--bg-hover)] text-[var(--text-primary)] text-lg font-heading font-bold rounded-lg">
                                {educator.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                        </Avatar>
                        {educator.hasVideoIntro && (
                            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full 
                              bg-[var(--accent-primary)] flex items-center justify-center border-2 border-[var(--bg-surface)] shadow-sm">
                                <PlayCircle weight="fill" className="h-3 w-3 text-white" />
                            </div>
                        )}
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                        <AvailabilityPill status={educator.availabilityStatus} />
                    </div>
                </div>

                {/* — Title & Headline ———————————————— */}
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <h3 className="font-heading text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors line-clamp-1">
                            {educator.name}
                        </h3>
                        <VerificationBadge tier={educator.verificationTier} />
                    </div>
                    {educator.secondaryName && (
                        <p className="text-xs font-semibold text-[var(--text-secondary)] line-clamp-1">
                            {educator.secondaryName}
                        </p>
                    )}
                    <p className="text-sm text-[var(--text-secondary)] line-clamp-2 font-medium">
                        {educator.headline}
                    </p>
                </div>

                {/* — Key Attributes (Icon heavy) ———————————————— */}
                <div className="flex flex-col gap-2.5 mt-auto">
                    {/* Areas */}
                    <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                        <GraduationCap weight="regular" className="h-4 w-4 text-[var(--text-tertiary)] flex-shrink-0" />
                        <span className="line-clamp-1 font-medium">{primaryArea}</span>
                        {remainingAreaCount > 0 && (
                            <span className="shrink-0 text-xs font-bold text-[var(--text-tertiary)]">
                                +{remainingAreaCount} more
                            </span>
                        )}
                    </div>
                    
                    {/* Grades & Locations */}
                    <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
                        <div className="flex min-w-0 items-center gap-2">
                            <MapPin weight="regular" className="h-4 w-4 text-[var(--text-tertiary)] flex-shrink-0" />
                            <span className="font-medium line-clamp-1">{coverage}</span>
                        </div>
                        <div className="w-1 h-1 rounded-full bg-[var(--border-strong)]" />
                        <span className="font-medium">Grades: {gradeLabels.join(", ")}</span>
                    </div>

                    {/* Badges inline */}
                    {(educator.badges && educator.badges.length > 0) && (
                        <div className="flex items-center gap-1.5 mt-1">
                            {educator.badges.some(b => b.includes('Background')) && (
                                <ShieldCheck weight="fill" className="h-4 w-4 text-emerald-500" />
                            )}
                            {educator.badges.some(b => b.includes('Credential')) && (
                                <Medal weight="fill" className="h-4 w-4 text-[var(--accent-secondary)]" />
                            )}
                            <span className="text-xs font-semibold text-[var(--text-tertiary)]">{educator.badges[0]}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* — Footer Action Row ——————————————————— */}
            <div className="bg-[var(--bg-subtle)] border-t border-[var(--border-subtle)] p-4 flex items-center justify-between">
                {educator.startingRate ? (
                    <div className="flex items-center gap-1.5 text-[var(--text-primary)]">
                        <CurrencyDollar weight="bold" className="w-4 h-4 text-[var(--text-tertiary)]" />
                        <span className="font-bold text-base">${educator.startingRate}</span>
                        <span className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mt-0.5">
                            / {educator.rateUnit ?? "hr"}
                        </span>
                    </div>
                ) : <span />}
                
                <Link href={`/browse/${educator.id}${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`} className="px-4 py-2 text-sm font-bold text-[var(--text-primary)] bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-lg hover:bg-[var(--accent-primary)] hover:text-white hover:border-[var(--accent-primary)] transition-all shadow-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2">
                        View Profile
                    </Link>
            </div>
        </Card>
    )
}
