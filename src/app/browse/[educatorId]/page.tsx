"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { PrimaryButton } from "@/components/shared/button";
import { VerificationBadge } from "@/components/shared/verification-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlayCircle, Medal, MapPin, Briefcase, CheckCircle, ChatCircle, BookmarkSimple, Star, ShieldCheck, Clock } from "@phosphor-icons/react";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { getMockEducatorProfileView } from "@/lib/mock-educators";

export default function EducatorProfilePage() {
    const params = useParams();
    const router = useRouter();
    const educatorId = typeof params.educatorId === "string" ? params.educatorId : params.educatorId?.[0] ?? "";

    const profile = getMockEducatorProfileView(educatorId);

    if (!profile) {
        return (
            <div className="min-h-screen bg-[--bg-app] flex flex-col font-sans">
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
            ? "Accepting Offers"
            : profile.availabilityStatus === "limited"
              ? "Limited availability"
              : "Not accepting new requests";

    const availabilityClass =
        profile.availabilityStatus === "open"
            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
            : profile.availabilityStatus === "limited"
              ? "bg-amber-100 text-amber-900 border-amber-200"
              : "bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border-strong)]";

    return (
        <div className="min-h-screen bg-[--bg-app] flex flex-col font-sans">
            <SiteHeader />
            
            {/* Main Content */}
            <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                <button onClick={() => router.back()} className="text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--accent-primary)] mb-8 inline-flex items-center gap-2 transition-colors">
                    &larr; Back to Browse
                </button>

                <div className="bg-white rounded-3xl shadow-sm border border-[var(--border-subtle)] overflow-hidden relative">
                    
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
                                <p className="text-[var(--accent-primary)] font-bold text-lg md:text-xl">{profile.headline}</p>
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
                            
                            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-2">
                                <button onClick={() => alert("Opening message thread...")} className="flex items-center justify-center gap-2 px-8 py-3 bg-[var(--accent-primary)] text-white font-bold rounded-xl hover:bg-[var(--accent-primary-h)] transition-all shadow-sm w-full sm:w-auto text-base cursor-pointer">
                                    <ChatCircle weight="fill" className="w-5 h-5" /> Message Educator
                                </button>
                                <button onClick={() => alert("Educator saved to your list.")} className="flex items-center justify-center gap-2 px-8 py-3 bg-white border-2 border-[var(--border-strong)] text-[var(--text-primary)] font-bold rounded-xl hover:bg-[var(--bg-subtle)] transition-all w-full sm:w-auto text-base cursor-pointer">
                                    <BookmarkSimple weight="bold" className="w-5 h-5" /> Save to List
                                </button>
                            </div>
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
                                <TabsTrigger value="about" className="text-lg font-bold h-full px-0 data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none border-b-4 border-transparent data-[state=active]:border-[var(--accent-primary)] data-[state=active]:text-[var(--accent-primary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer">About</TabsTrigger>
                                <TabsTrigger value="credentials" className="text-lg font-bold h-full px-0 data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none border-b-4 border-transparent data-[state=active]:border-[var(--accent-primary)] data-[state=active]:text-[var(--accent-primary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer">Credentials</TabsTrigger>
                                <TabsTrigger value="experience" className="text-lg font-bold h-full px-0 data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none border-b-4 border-transparent data-[state=active]:border-[var(--accent-primary)] data-[state=active]:text-[var(--accent-primary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer">Experience</TabsTrigger>
                                <TabsTrigger value="reviews" className="text-lg font-bold h-full px-0 data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none border-b-4 border-transparent data-[state=active]:border-[var(--accent-primary)] data-[state=active]:text-[var(--accent-primary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer">Reviews</TabsTrigger>
                                <TabsTrigger value="availability" className="text-lg font-bold h-full px-0 data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none border-b-4 border-transparent data-[state=active]:border-[var(--accent-primary)] data-[state=active]:text-[var(--accent-primary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer">Availability</TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="p-8 md:p-12">
                            <TabsContent value="about" className="mt-0 outline-none flex flex-col gap-8 animate-in fade-in duration-300">
                                <div>
                                    <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Professional Overview</h2>
                                    <p className="text-lg text-[var(--text-secondary)] leading-relaxed">{profile.bio}</p>
                                </div>
                                {profile.videoIntro && (
                                    <div>
                                        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Video Introduction</h2>
                                        <div className="w-full aspect-video bg-[var(--bg-subtle)] rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-[var(--border-strong)] mt-2 group cursor-pointer hover:border-[var(--accent-primary)] transition-all hover:bg-[var(--accent-primary)]/5">
                                            <div className="w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <PlayCircle weight="fill" className="w-10 h-10 text-[var(--accent-primary)]" />
                                            </div>
                                            <span className="mt-4 font-bold text-[var(--text-primary)] text-lg">Play Video</span>
                                        </div>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="credentials" className="mt-0 outline-none animate-in fade-in duration-300">
                                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Licenses & Certifications</h2>
                                <div className="overflow-x-auto border border-[var(--border-subtle)] rounded-2xl">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-[var(--bg-subtle)] text-[var(--text-secondary)] uppercase tracking-wider font-bold text-sm border-b border-[var(--border-subtle)]">
                                            <tr>
                                                <th className="py-4 px-6">Credential</th>
                                                <th className="py-4 px-6">Issuer</th>
                                                <th className="py-4 px-6">Status</th>
                                                <th className="py-4 px-6">Expiry</th>
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
                                                            <span className="inline-flex items-center gap-1.5 text-[var(--text-secondary)] font-bold bg-[var(--bg-active)] border border-[var(--border-strong)] px-3 py-1.5 rounded-lg text-sm">
                                                                <Clock weight="bold" className="w-4 h-4" /> Pending
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-5 px-6 text-[var(--text-secondary)] font-medium text-base">{lic.expiry}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </TabsContent>

                            <TabsContent value="experience" className="mt-0 outline-none animate-in fade-in duration-300">
                                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-8">Work Experience</h2>
                                <div className="border-l-4 border-[var(--border-strong)] ml-4 pl-8 py-2 flex flex-col gap-10">
                                    {profile.experience.map((exp, i) => (
                                        <div key={i} className="relative">
                                            <div className="absolute -left-[46px] top-1 w-6 h-6 rounded-full bg-[var(--bg-subtle)] border-4 border-white shadow-sm flex items-center justify-center">
                                                <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)]" />
                                            </div>
                                            <h3 className="text-xl font-bold text-[var(--text-primary)]">{exp.role}</h3>
                                            <div className="flex items-center gap-2 mt-2">
                                                <Briefcase weight="fill" className="w-5 h-5 text-[var(--text-tertiary)]" />
                                                <span className="text-[var(--text-secondary)] font-bold text-base">{exp.district}</span>
                                                <span className="text-[var(--text-tertiary)] mx-1">&bull;</span>
                                                <span className="text-[var(--text-secondary)] font-medium text-base">{exp.years}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </TabsContent>

                            <TabsContent value="reviews" className="mt-0 outline-none animate-in fade-in duration-300">
                                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Ratings & Reviews</h2>
                                <div className="flex flex-col gap-10">
                                    <div className="flex flex-col md:flex-row gap-8 items-start md:items-center bg-[var(--bg-subtle)] p-8 rounded-2xl border border-[var(--border-subtle)]">
                                        <div className="flex flex-col gap-1 items-center justify-center p-8 bg-white rounded-xl border border-[var(--border-subtle)] min-w-[200px] shadow-sm">
                                            <span className="text-5xl font-heading font-bold text-[var(--text-primary)]">{profile.avgRating}</span>
                                            <div className="flex text-[var(--accent-secondary)] mt-2">
                                                {[1,2,3,4,5].map(s => <Star weight="fill" key={s} className="w-6 h-6 fill-current" />)}
                                            </div>
                                            <span className="text-base font-bold text-[var(--text-secondary)] mt-2">{profile.reviewCount} Reviews</span>
                                        </div>
                                        <div className="flex-1 flex flex-col gap-4 w-full">
                                            {[
                                                { label: "Subject Expertise", val: 98 },
                                                { label: "Classroom Management", val: 95 },
                                                { label: "Communication", val: 100 },
                                                { label: "Reliability", val: 98 }
                                            ].map(cat => (
                                                <div key={cat.label} className="flex flex-col gap-2">
                                                    <div className="flex justify-between text-base font-bold">
                                                        <span className="text-[var(--text-secondary)]">{cat.label}</span>
                                                        <span className="text-[var(--text-primary)]">{cat.val}%</span>
                                                    </div>
                                                    <div className="w-full h-3 bg-[var(--border-strong)] rounded-full overflow-hidden">
                                                        <div className="h-full bg-[var(--accent-secondary)] rounded-full" style={{ width: `${cat.val}%` }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-6">
                                        <div className="p-8 bg-white border border-[var(--border-subtle)] rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center font-bold text-[var(--text-tertiary)]">
                                                        DA
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-[var(--text-primary)] text-lg">District Admin</div>
                                                        <div className="flex text-[var(--accent-secondary)] mt-1">
                                                            {[1,2,3,4,5].map(s => <Star weight="fill" key={s} className="w-4 h-4 fill-current" />)}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className="text-sm text-[var(--text-tertiary)] font-bold uppercase tracking-wider">Jan 2026</span>
                                            </div>
                                            <p className="text-[var(--text-secondary)] text-lg leading-relaxed">"Exceptional expertise and professionalism. Made an immediate impact on our team's curriculum planning process. Highly recommended for any school looking to elevate their math department."</p>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="availability" className="mt-0 outline-none animate-in fade-in duration-300">
                                <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
                                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">Current Availability</h2>
                                    <span className={cn("inline-flex items-center gap-2 px-4 py-2 border rounded-xl font-bold text-sm", availabilityClass)}>
                                        {profile.availabilityStatus === "open" && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                                        {availabilityLabel}
                                    </span>
                                </div>
                                <div className="overflow-x-auto bg-white border border-[var(--border-subtle)] rounded-2xl shadow-sm">
                                    <div className="grid grid-cols-6 gap-0 min-w-[600px] divide-x divide-y divide-[var(--border-subtle)]">
                                        <div className="p-4 bg-[var(--bg-subtle)]"></div>
                                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(d => (
                                            <div key={d} className="p-4 bg-[var(--bg-subtle)] text-center text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">{d}</div>
                                        ))}
                                        
                                        <div className="p-6 bg-[var(--bg-subtle)] text-center text-sm font-bold text-[var(--text-secondary)] flex items-center justify-center">Morning<br/>(AM)</div>
                                        {['M','T','W','Th','F'].map((d) => (
                                            <div key={`am-${d}`} className="p-6 flex items-center justify-center transition-colors">
                                                {profile.availableDays[d as keyof typeof profile.availableDays].am ? (
                                                    <div className="flex flex-col items-center gap-1 text-[var(--accent-primary)]">
                                                        <CheckCircle weight="fill" className="w-8 h-8" />
                                                        <span className="text-xs font-bold uppercase">Available</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-1 text-[var(--text-tertiary)] opacity-50">
                                                        <div className="w-8 h-1 rounded-full bg-current mb-1 mt-3" />
                                                        <span className="text-xs font-bold uppercase">Busy</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        <div className="p-6 bg-[var(--bg-subtle)] text-center text-sm font-bold text-[var(--text-secondary)] flex items-center justify-center">Afternoon<br/>(PM)</div>
                                        {['M','T','W','Th','F'].map((d) => (
                                            <div key={`pm-${d}`} className="p-6 flex items-center justify-center transition-colors">
                                                {profile.availableDays[d as keyof typeof profile.availableDays].pm ? (
                                                    <div className="flex flex-col items-center gap-1 text-[var(--accent-primary)]">
                                                        <CheckCircle weight="fill" className="w-8 h-8" />
                                                        <span className="text-xs font-bold uppercase">Available</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-1 text-[var(--text-tertiary)] opacity-50">
                                                        <div className="w-8 h-1 rounded-full bg-current mb-1 mt-3" />
                                                        <span className="text-xs font-bold uppercase">Busy</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
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

            {/* Sticky Mobile CTA */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-[--border-subtle] shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-50">
                <PrimaryButton onClick={() => alert("Opening message thread...")} className="w-full py-3 text-base flex items-center justify-center gap-2">
                    <ChatCircle weight="bold" className="w-5 h-5" /> Message Educator
                </PrimaryButton>
            </div>

            <SiteFooter />
        </div>
    );
}
