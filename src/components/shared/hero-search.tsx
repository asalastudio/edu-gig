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
    const [region, setRegion] = useState("");

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (area) params.append("area", area);
        if (spec) params.append("spec", spec);
        if (grade) params.append("grade", grade);
        if (region) params.append("region", region);

        router.push(`/browse?${params.toString()}`);
    };

    const selectedAreaObj = TAXONOMY.areasOfNeed.find(a => a.id === area);
    const specs = selectedAreaObj?.subCategories || [];

    return (
        <div className="w-full max-w-4xl mx-auto bg-white/95 backdrop-blur-xl border border-white/40 rounded-lg p-5 shadow-[0_22px_70px_rgba(0,0,0,0.24)] animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out mt-4 text-left">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <select
                    className="field-control w-full px-4 text-sm"
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
                    className="field-control w-full px-4 text-sm disabled:opacity-50"
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
                    className="field-control w-full px-4 text-sm"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                >
                    <option value="">Grade Level</option>
                    {TAXONOMY.gradeLevelBands.filter(g => g.id !== "other").map(g => (
                        <option key={g.id} value={g.id}>{g.label}</option>
                    ))}
                </select>

                <select
                    className="field-control w-full px-4 text-sm"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                >
                    <option value="">Coverage Area</option>
                    {TAXONOMY.coverageRegions.map(r => (
                        <option key={r.id} value={r.id}>{r.label}</option>
                    ))}
                </select>
            </div>
            {!area && (
                <p className="text-xs font-medium text-[var(--text-tertiary)] text-left mb-4">
                    Choose an area of need first to narrow specializations.
                </p>
            )}
            <PrimaryButton className="w-full py-3 text-base shadow-sm" onClick={handleSearch}>
                Search Educators
            </PrimaryButton>
        </div>
    );
}
