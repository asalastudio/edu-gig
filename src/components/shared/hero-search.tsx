"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { TAXONOMY } from "@/lib/taxonomy";
import { MagnifyingGlass } from "@phosphor-icons/react";

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
        <div className="w-full rounded-lg border border-[#F7F1E3]/65 bg-[#FBF8EF]/96 p-3 text-left text-[var(--text-primary)] shadow-[0_20px_56px_rgba(4,18,12,0.26)] backdrop-blur-xl">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[repeat(2,minmax(0,1fr))_3.5rem] 2xl:grid-cols-[repeat(4,minmax(0,1fr))_3.5rem]">
                <HeroSelect
                    label="Support Type"
                    value={area}
                    onChange={(value) => {
                        setArea(value);
                        setSpec("");
                    }}
                    options={TAXONOMY.areasOfNeed}
                    placeholder="Support Type"
                />

                <HeroSelect
                    label="Area of Expertise"
                    value={spec}
                    onChange={setSpec}
                    options={specs}
                    placeholder="Area of Expertise"
                    disabled={!area || specs.length === 0}
                />

                <HeroSelect
                    label="Grade Level"
                    value={grade}
                    onChange={setGrade}
                    options={TAXONOMY.gradeLevelBands.filter(g => g.id !== "other")}
                    placeholder="Grade Level"
                />

                <HeroSelect
                    label="Coverage Area"
                    value={region}
                    onChange={setRegion}
                    options={TAXONOMY.coverageRegions}
                    placeholder="Coverage Area"
                />

                <button
                    type="button"
                    onClick={handleSearch}
                    aria-label="Search educators"
                    className="flex min-h-12 items-center justify-center rounded-lg bg-[var(--accent-primary)] text-white shadow-[0_10px_22px_rgba(20,48,38,0.22)] transition hover:bg-[var(--accent-primary-h)] sm:col-start-3 sm:row-span-2 sm:row-start-1 2xl:col-start-auto 2xl:row-span-1 2xl:row-start-auto"
                >
                    <MagnifyingGlass className="h-6 w-6" weight="bold" />
                </button>
            </div>
        </div>
    );
}

function HeroSelect({
    label,
    value,
    onChange,
    options,
    placeholder,
    disabled,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: readonly { id: string; label: string }[];
    placeholder: string;
    disabled?: boolean;
}) {
    return (
        <label className="block min-w-0 rounded-lg border border-[var(--border-default)] bg-white px-3 shadow-[var(--shadow-subtle)]">
            <span className="sr-only">
                {label}
            </span>
            <select
                aria-label={label}
                className="h-12 w-full truncate bg-transparent text-sm font-medium text-[var(--text-secondary)] outline-none disabled:opacity-45"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
            >
                <option value="">{placeholder}</option>
                {options.map(option => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                ))}
            </select>
        </label>
    );
}
