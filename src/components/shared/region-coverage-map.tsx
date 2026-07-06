"use client";

import React, { useEffect, useRef } from "react";
import { X } from "@phosphor-icons/react";
import { REGION_COVERAGE } from "@/lib/region-coverage";

/**
 * Modal reference listing which Michigan counties each service region covers.
 * Opened from RegionCoverageLink next to any region/coverage picker.
 */
export function RegionCoverageMap({ onClose }: { onClose: () => void }) {
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        closeButtonRef.current?.focus();
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") onClose();
        }
        document.addEventListener("keydown", handleKeyDown);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div
                className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
                onClick={onClose}
                aria-hidden="true"
            />
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="region-coverage-title"
                className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-lg border border-[var(--border-default)] bg-white shadow-[var(--shadow-soft)]"
            >
                <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-[var(--border-subtle)] bg-white px-6 py-5">
                    <div>
                        <h2 id="region-coverage-title" className="font-heading text-2xl font-bold text-[var(--text-primary)]">
                            What does each region cover?
                        </h2>
                        <p className="mt-1 text-sm font-medium text-[var(--text-secondary)]">
                            Michigan service regions and the counties inside each one.
                        </p>
                    </div>
                    <button
                        ref={closeButtonRef}
                        type="button"
                        onClick={onClose}
                        aria-label="Close region coverage reference"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] transition-colors"
                    >
                        <X className="h-4 w-4" weight="bold" />
                    </button>
                </div>
                <div className="flex flex-col gap-4 px-6 py-5">
                    {REGION_COVERAGE.map((region) => (
                        <div key={region.id} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4">
                            <h3 className="font-heading text-base font-bold text-[var(--text-primary)]">{region.label}</h3>
                            <p className="mt-1 text-sm font-medium text-[var(--text-secondary)]">{region.description}</p>
                            {region.counties.length > 0 && (
                                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                                    <span className="font-bold text-[var(--text-primary)]">Counties: </span>
                                    {region.counties.join(", ")}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
