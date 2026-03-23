"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { PrimaryButton } from "./button";
import { TAXONOMY } from "@/lib/taxonomy";

export function HeroSearch() {
    const router = useRouter();
    const [area, setArea] = useState("");
    const [spec, setSpec] = useState("");
    const [grade, setGrade] = useState("");
    const [location, setLocation] = useState("");

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (area) params.append("area", area);
        if (spec) params.append("spec", spec);
        if (grade) params.append("grade", grade);
        if (location) params.append("location", location);
        
        router.push(`/browse?${params.toString()}`);
    };

    const selectedAreaObj = TAXONOMY.areasOfNeed.find(a => a.id === area);
    const specs = selectedAreaObj?.subCategories || [];

    return (
        <div className="w-full max-w-4xl mx-auto bg-[--bg-surface]/80 backdrop-blur-xl border border-[--border-default] rounded-2xl p-6 shadow-xl animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out mt-10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <select 
                    className="w-full h-12 px-4 rounded-xl border border-[--border-subtle] bg-white text-[--text-primary] text-sm focus:outline-none focus:ring-2 focus:ring-[--accent-primary]/20 focus:border-[--accent-primary] transition-all"
                    value={area}
                    onChange={(e) => {
                        setArea(e.target.value);
                        setSpec("");
                    }}
                >
                    <option value="">Area of Need</option>
                    {TAXONOMY.areasOfNeed.map(a => (
                        <option key={a.id} value={a.id}>{a.label}</option>
                    ))}
                </select>

                <select 
                    className="w-full h-12 px-4 rounded-xl border border-[--border-subtle] bg-white text-[--text-primary] text-sm focus:outline-none focus:ring-2 focus:ring-[--accent-primary]/20 focus:border-[--accent-primary] transition-all disabled:opacity-50"
                    value={spec}
                    onChange={(e) => setSpec(e.target.value)}
                    disabled={!area || specs.length === 0}
                >
                    <option value="">Specialization</option>
                    {specs.map(s => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                </select>

                <select 
                    className="w-full h-12 px-4 rounded-xl border border-[--border-subtle] bg-white text-[--text-primary] text-sm focus:outline-none focus:ring-2 focus:ring-[--accent-primary]/20 focus:border-[--accent-primary] transition-all"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                >
                    <option value="">Grade Level</option>
                    {TAXONOMY.gradeLevelBands.filter(g => g.id !== "other").map(g => (
                        <option key={g.id} value={g.id}>{g.label}</option>
                    ))}
                </select>

                <input 
                    type="text" 
                    placeholder="City, State or Remote" 
                    className="w-full h-12 px-4 rounded-xl border border-[--border-subtle] bg-white text-[--text-primary] text-sm focus:outline-none focus:ring-2 focus:ring-[--accent-primary]/20 focus:border-[--accent-primary] transition-all"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                />
            </div>
            <PrimaryButton className="w-full py-3 text-base shadow-sm" onClick={handleSearch}>
                Search Educators
            </PrimaryButton>
        </div>
    );
}
