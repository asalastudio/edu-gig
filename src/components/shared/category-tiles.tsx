"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { 
    ChalkboardTeacher, 
    Student, 
    ChartLineUp, 
    Target, 
    Database, 
    GraduationCap,
    Lightbulb,
    ClipboardText,
    Scales
} from "@phosphor-icons/react";
import { TAXONOMY } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";

// Map the detailed taxonomy IDs to Phosphor Icons
const CAT_ICONS: Record<string, React.ElementType> = {
    "ai_edtech": Lightbulb,
    "data_accountability": Database,
    "grading_assessment": ClipboardText,
    "instruction_curriculum": ChalkboardTeacher,
    "school_improvement": ChartLineUp,
    "leadership_operations": GraduationCap,
    "student_support_services": Student,
};

// Organize support types into 3 meta-categories for easier cognitive processing
const META_CATEGORIES = [
    {
        id: "meta_instruction",
        title: "Instruction & Direct Support",
        description: "Curriculum, assessment, intervention, and specialized student support.",
        color: "blue",
        icon: ChalkboardTeacher,
        areas: ["instruction_curriculum", "grading_assessment", "student_support_services"]
    },
    {
        id: "meta_leadership",
        title: "Leadership & Improvement",
        description: "Administrative, board, planning, and school improvement expertise.",
        color: "amber",
        icon: Target,
        areas: ["school_improvement", "leadership_operations"]
    },
    {
        id: "meta_ops",
        title: "Data & Innovation",
        description: "Data, accountability, AI governance, and educational technology support.",
        color: "emerald",
        icon: Scales,
        areas: ["data_accountability", "ai_edtech"]
    }
];

export function CategoryTiles() {
    const router = useRouter();

    const handleCategoryClick = (areaId: string) => {
        router.push(`/browse?area=${areaId}`);
    };

    return (
        <section className="py-16 px-6 lg:px-12 lg:py-20 bg-[var(--bg-subtle)]">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-10 max-w-3xl mx-auto lg:mb-12">
                    <div className="education-rule mx-auto mb-4" />
                    <h2 className="font-heading text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-4">
                        Browse by Support Type
                    </h2>
                    <p className="text-base leading-7 text-[var(--text-secondary)] md:text-lg">
                        Whether you need immediate classroom coverage or long-term operational consulting, find verified professionals ready to step in.
                    </p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {META_CATEGORIES.map(meta => (
                        <div key={meta.id} className="flex flex-col bg-white rounded-lg p-6 border border-[var(--border-default)] shadow-[var(--shadow-subtle)] relative overflow-hidden hover:shadow-[var(--shadow-soft)] transition-shadow">
                            <div className={cn(
                                "absolute inset-x-0 top-0 h-1",
                                meta.color === "blue" ? "bg-[var(--accent-tertiary)]" :
                                meta.color === "amber" ? "bg-[var(--accent-secondary)]" : "bg-[var(--accent-primary)]"
                            )} />
                            <div className="flex items-center gap-4 mb-4 relative z-10">
                                <div className={cn(
                                    "w-12 h-12 rounded-lg flex items-center justify-center shadow-sm",
                                    meta.color === "blue" ? "bg-blue-50 text-blue-600 border border-blue-100" :
                                    meta.color === "amber" ? "bg-amber-50 text-amber-600 border border-amber-100" : 
                                    "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                )}>
                                    <meta.icon weight="duotone" className="w-6 h-6" />
                                </div>
                                <h3 className="font-heading text-xl font-bold text-[var(--text-primary)]">{meta.title}</h3>
                            </div>
                            <p className="text-sm leading-6 text-[var(--text-secondary)] mb-6 relative z-10">{meta.description}</p>

                            <div className="flex flex-col gap-3 mt-auto relative z-10">
                                {meta.areas.map(areaId => {
                                    const areaData = TAXONOMY.areasOfNeed.find(a => a.id === areaId);
                                    if (!areaData) return null;
                                    const Icon = CAT_ICONS[areaId] || ChalkboardTeacher;

                                    return (
                                        <button 
                                            key={areaId}
                                            onClick={() => handleCategoryClick(areaId)}
                                            className="group flex items-center justify-between p-3.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-app)] hover:border-[var(--accent-primary)]/40 hover:bg-white hover:shadow-sm transition-all text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Icon weight="regular" className="w-5 h-5 text-[var(--text-tertiary)] group-hover:text-[var(--accent-primary)] transition-colors" />
                                                <span className="font-semibold text-[var(--text-primary)] text-sm group-hover:text-[var(--accent-primary)] transition-colors">
                                                    {areaData.label}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
