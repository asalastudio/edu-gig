"use client";

import { CaretDown } from "@phosphor-icons/react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export interface FilterOption {
    id: string;
    label: string;
}

export interface FilterProps {
    label: string;
    options: readonly FilterOption[];
    selected: string[];
    onChange: (id: string) => void;
}

export function TaxonomyFilter({ label, options, selected, onChange }: FilterProps) {
    // Reflect the actual selection in the trigger: the placeholder when empty,
    // the chosen label when one is picked, and a count when several are.
    const selectedLabels = options.filter((o) => selected.includes(o.id)).map((o) => o.label);
    const display =
        selectedLabels.length === 0
            ? label
            : selectedLabels.length === 1
              ? selectedLabels[0]
              : `${selectedLabels.length} selected`;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button className={cn(
                    "inline-flex items-center gap-2 px-3 py-1.5 rounded-md",
                    "border border-[var(--border-default)] bg-[var(--bg-surface)]",
                    "text-sm text-[var(--text-secondary)]",
                    "hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]",
                    "transition-[border-color,color] duration-100",
                    selected.length > 0 && "border-[var(--accent-primary)] bg-[var(--accent-primary)]/5 text-[var(--accent-primary)] font-semibold"
                )}>
                    <span className="flex-1 min-w-0 truncate text-left">{display}</span>
                    {selected.length > 1 && (
                        <span className="h-4 min-w-4 px-1 rounded-full bg-[var(--accent-primary)] text-white
                             text-[10px] font-bold flex items-center justify-center shrink-0">
                            {selected.length}
                        </span>
                    )}
                    <CaretDown weight="bold" className="h-3.5 w-3.5 opacity-50 shrink-0" />
                </button>
            </PopoverTrigger>

            <PopoverContent
                className="w-56 p-1 rounded-lg border border-[var(--border-default)]
                   bg-white dark:bg-[#1A1A18] shadow-lg z-50"
                align="start">
                {options.map(option => (
                    <label key={option.id}
                        className="flex items-center gap-2.5 px-2 py-1.5 rounded-md
                       cursor-pointer text-sm text-[var(--text-secondary)]
                       hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]
                       transition-colors duration-75">
                        <Checkbox
                            checked={selected.includes(option.id)}
                            onCheckedChange={() => onChange(option.id)}
                            className="rounded-[3px]"
                        />
                        {option.label}
                    </label>
                ))}
            </PopoverContent>
        </Popover>
    )
}
