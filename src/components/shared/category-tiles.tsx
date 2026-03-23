"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { 
    ChalkboardTeacher, 
    Student, 
    ChartLineUp, 
    UsersThree, 
    Target, 
    Strategy, 
    Database, 
    Calculator,
    GraduationCap,
    Lightbulb,
    Buildings
} from "@phosphor-icons/react";
import { TAXONOMY } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";

// Map the detailed taxonomy IDs to Phosphor Icons
const CAT_ICONS: Record<string, React.ElementType> = {
    "instruction_curriculum": ChalkboardTeacher,
    "developmental_medical": Student,
    "school_improvement": ChartLineUp,
    
    "leadership": GraduationCap,
    "strategic_planning": Target,
    "project_implementation": Strategy,
    
    "data": Database,
    "mgmt_planning": Buildings,
    "human_resources": UsersThree,
    "accounting": Calculator,
    "meeting_facilitation": UsersThree,
    "systems_development": Lightbulb
};

// Organize the 12 areas into 3 meta-categories for easier cognitive processing
const META_CATEGORIES = [
    {
        id: "meta_instruction",
        title: "Instruction & Direct Support",
        description: "Teachers, curriculum experts, and specialized student support.",
        color: "blue",
        icon: ChalkboardTeacher,
        areas: ["instruction_curriculum", "developmental_medical", "school_improvement"]
    },
    {
        id: "meta_leadership",
        title: "Leadership & Strategy",
        description: "Principals, coaches, and strategic planners to guide your schools.",
        color: "amber",
        icon: Target,
        areas: ["leadership", "strategic_planning", "project_implementation"]
    },
    {
        id: "meta_ops",
        title: "Operations & Admin",
        description: "Data specialists, HR, accounting, and systems management.",
        color: "emerald",
        icon: Buildings,
        areas: ["data", "mgmt_planning", "human_resources", "accounting", "meeting_facilitation", "systems_development"]
    }
];

export function CategoryTiles() {
    const router = useRouter();

    const handleCategoryClick = (areaId: string) => {
        router.push(`/browse?area=${areaId}`);
    };

    return (
        <section className="py-24 px-6 lg:px-12 bg-[--bg-subtle]">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16 max-w-3xl mx-auto">
                    <h2 className="font-heading text-3xl md:text-4xl font-bold text-[--text-primary] mb-4">
                        Browse by Area of Need
                    </h2>
                    <p className="text-lg text-[--text-secondary]">
                        Whether you need immediate classroom coverage or long-term operational consulting, find verified professionals ready to step in.
                    </p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {META_CATEGORIES.map(meta => (
                        <div key={meta.id} className="flex flex-col bg-white rounded-3xl p-8 border border-[--border-subtle] shadow-sm relative overflow-hidden">
                            {/* Background accent block */}
                            <div className={cn(
                                "absolute top-0 right-0 w-32 h-32 rounded-bl-[100px] pointer-events-none opacity-10",
                                meta.color === "blue" ? "bg-blue-500" :
                                meta.color === "amber" ? "bg-amber-500" : "bg-emerald-500"
                            )} />

                            <div className="flex items-center gap-4 mb-4 relative z-10">
                                <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm",
                                    meta.color === "blue" ? "bg-blue-50 text-blue-600 border border-blue-100" :
                                    meta.color === "amber" ? "bg-amber-50 text-amber-600 border border-amber-100" : 
                                    "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                )}>
                                    <meta.icon weight="duotone" className="w-6 h-6" />
                                </div>
                                <h3 className="font-heading text-2xl font-bold text-[--text-primary]">{meta.title}</h3>
                            </div>
                            <p className="text-[--text-secondary] mb-8 relative z-10">{meta.description}</p>

                            <div className="flex flex-col gap-3 mt-auto relative z-10">
                                {meta.areas.map(areaId => {
                                    const areaData = TAXONOMY.areasOfNeed.find(a => a.id === areaId);
                                    if (!areaData) return null;
                                    const Icon = CAT_ICONS[areaId] || ChalkboardTeacher;

                                    return (
                                        <button 
                                            key={areaId}
                                            onClick={() => handleCategoryClick(areaId)}
                                            className="group flex items-center justify-between p-4 rounded-xl border border-[--border-default] bg-[--bg-app] hover:border-[--accent-primary]/40 hover:shadow-sm transition-all text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Icon weight="regular" className="w-5 h-5 text-[--text-tertiary] group-hover:text-[--accent-primary] transition-colors" />
                                                <span className="font-semibold text-[--text-primary] text-sm group-hover:text-[--accent-primary] transition-colors">
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
