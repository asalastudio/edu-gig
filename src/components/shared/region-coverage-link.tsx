"use client";

import React, { useState } from "react";
import { MapTrifold } from "@phosphor-icons/react";
import { RegionCoverageMap } from "@/components/shared/region-coverage-map";
import { cn } from "@/lib/utils";

/**
 * Inline "What does each region cover?" link that opens the county-by-region
 * reference modal. Place directly below a region/coverage picker.
 */
export function RegionCoverageLink({ className }: { className?: string }) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                aria-haspopup="dialog"
                aria-label="What does each region cover? Opens a county-by-region reference."
                className={cn(
                    "inline-flex w-fit items-center gap-1.5 text-sm font-bold text-[var(--accent-primary)] hover:underline",
                    className
                )}
            >
                <MapTrifold weight="duotone" className="h-4 w-4 shrink-0" />
                What does each region cover?
            </button>
            {open && <RegionCoverageMap onClose={() => setOpen(false)} />}
        </>
    );
}
