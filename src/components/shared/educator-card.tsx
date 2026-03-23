import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { PlayCircle, Star, ShieldCheck, Medal, GraduationCap, MapPin, CurrencyDollar } from "@phosphor-icons/react"
import { Card } from "./card"
import { VerificationBadge } from "./verification-badge"
import { AvailabilityPill } from "./availability-pill"
import Link from "next/link";

export interface EducatorCardProps {
    id: string;
    name: string;
    headline: string;
    avatarUrl?: string;
    verificationTier: 'basic' | 'verified' | 'premier';
    overallRating: number;       // 0–5
    reviewCount: number;
    gradeLevels: string[];
    areasOfNeed: string[];
    engagementTypes: string[];
    coverageRegions: string[];
    startingRate?: number;
    availabilityStatus: 'open' | 'limited' | 'closed';
    hasVideoIntro: boolean;
    badges?: string[];
}

export function EducatorCard({ educator }: { educator: EducatorCardProps }) {
    return (
        <Card className="p-0 flex flex-col group hover:-translate-y-1 hover:shadow-lg transition-all duration-300 border-none shadow-[0_4px_24px_rgba(0,0,0,0.04)] rounded-3xl bg-white overflow-hidden">
            
            <div className="p-6 flex flex-col gap-5 flex-1">
                {/* — Header Row ——————————————————— */}
                <div className="flex items-start justify-between gap-3">
                    <div className="relative">
                        <Avatar className="h-14 w-14 rounded-2xl ring-2 ring-[--border-subtle] shadow-sm">
                            <AvatarImage src={educator.avatarUrl} />
                            <AvatarFallback className="bg-gradient-to-br from-[--bg-subtle] to-[--bg-hover] text-[--text-primary] text-lg font-heading font-bold rounded-2xl">
                                {educator.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                        </Avatar>
                        {educator.hasVideoIntro && (
                            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full 
                              bg-[--accent-primary] flex items-center justify-center border-2 border-white shadow-sm">
                                <PlayCircle weight="fill" className="h-3 w-3 text-white" />
                            </div>
                        )}
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                        <AvailabilityPill status={educator.availabilityStatus} />
                        <div className="flex items-center gap-1 bg-[--accent-secondary]/10 px-2 py-0.5 rounded-md border border-[--accent-secondary]/20">
                            <Star weight="fill" className="h-3 w-3 text-[--accent-secondary]" />
                            <span className="text-xs font-bold text-[--text-primary]">
                                {educator.overallRating.toFixed(1)}
                            </span>
                            <span className="text-[10px] text-[--text-tertiary] font-medium">
                                ({educator.reviewCount})
                            </span>
                        </div>
                    </div>
                </div>

                {/* — Title & Headline ———————————————— */}
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <h3 className="font-heading text-lg font-bold text-[--text-primary] group-hover:text-[--accent-primary] transition-colors line-clamp-1">
                            {educator.name}
                        </h3>
                        <VerificationBadge tier={educator.verificationTier} />
                    </div>
                    <p className="text-sm text-[--text-secondary] line-clamp-2 font-medium">
                        {educator.headline}
                    </p>
                </div>

                {/* — Key Attributes (Icon heavy) ———————————————— */}
                <div className="flex flex-col gap-2.5 mt-auto">
                    {/* Areas */}
                    <div className="flex items-center gap-2 text-sm text-[--text-secondary]">
                        <GraduationCap weight="regular" className="h-4 w-4 text-[--text-tertiary] flex-shrink-0" />
                        <span className="line-clamp-1 font-medium">{educator.areasOfNeed.join(', ')}</span>
                    </div>
                    
                    {/* Grades & Locations */}
                    <div className="flex items-center gap-4 text-sm text-[--text-secondary]">
                        <div className="flex items-center gap-2">
                            <MapPin weight="regular" className="h-4 w-4 text-[--text-tertiary] flex-shrink-0" />
                            <span className="font-medium">TX</span>
                        </div>
                        <div className="w-1 h-1 rounded-full bg-[--border-strong]" />
                        <span className="font-medium">Grades: {educator.gradeLevels.map(g => g.replace('_','-')).join(', ')}</span>
                    </div>

                    {/* Badges inline */}
                    {(educator.badges && educator.badges.length > 0) && (
                        <div className="flex items-center gap-1.5 mt-1">
                            {educator.badges.some(b => b.includes('Background')) && (
                                <ShieldCheck weight="fill" className="h-4 w-4 text-emerald-500" />
                            )}
                            {educator.badges.some(b => b.includes('Licensed')) && (
                                <Medal weight="fill" className="h-4 w-4 text-[--accent-secondary]" />
                            )}
                            <span className="text-xs font-semibold text-[--text-tertiary]">Verified Cleared</span>
                        </div>
                    )}
                </div>
            </div>

            {/* — Footer Action Row ——————————————————— */}
            <div className="bg-[--bg-subtle] border-t border-[--border-subtle] p-4 flex items-center justify-between">
                {educator.startingRate ? (
                    <div className="flex items-center gap-1.5 text-[--text-primary]">
                        <CurrencyDollar weight="bold" className="w-4 h-4 text-[--text-tertiary]" />
                        <span className="font-bold text-base">${educator.startingRate}</span>
                        <span className="text-xs font-semibold text-[--text-tertiary] uppercase tracking-wider mt-0.5">/ hr</span>
                    </div>
                ) : <span />}
                
                <Link href={`/browse/${educator.id}`}>
                    <button className="px-5 py-2 text-sm font-bold text-[--text-primary] bg-white border border-[--border-strong] rounded-xl hover:bg-[--text-primary] hover:text-white hover:border-[--text-primary] transition-all shadow-sm">
                        View Profile
                    </button>
                </Link>
            </div>
        </Card>
    )
}
