"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, Copy } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export function CopyButton({
    text,
    label,
    className,
}: {
    text: string;
    label?: string;
    className?: string;
}) {
    const [copied, setCopied] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    async function handleCopy() {
        if (!navigator?.clipboard?.writeText) return;
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard denied or unavailable — no-op.
        }
    }

    return (
        <button
            type="button"
            onClick={handleCopy}
            className={cn(
                "inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--accent-primary)]",
                className
            )}
        >
            {copied ? (
                <Check weight="bold" className="h-4 w-4 text-emerald-600" />
            ) : (
                <Copy className="h-4 w-4" />
            )}
            {copied ? "Copied" : label ?? "Copy"}
        </button>
    );
}
