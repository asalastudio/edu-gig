"use client";

import React, { useState } from "react";
import { useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

export function CredentialFileLink({
    credentialId,
    className,
}: {
    credentialId: string;
    className?: string;
}) {
    const convex = useConvex();
    const [loading, setLoading] = useState(false);
    const [unavailable, setUnavailable] = useState(false);

    async function handleClick() {
        setUnavailable(false);
        setLoading(true);
        try {
            const url = await convex.query(api.credentials.getCredentialFileUrl, {
                credentialId: credentialId as Id<"credentials">,
            });
            if (!url) {
                setUnavailable(true);
                return;
            }
            window.open(url, "_blank", "noopener");
        } catch (err) {
            console.error("Credential file fetch failed:", err);
            setUnavailable(true);
        } finally {
            setLoading(false);
        }
    }

    if (unavailable) {
        return (
            <span className={cn("text-xs font-semibold text-[var(--text-tertiary)]", className)}>
                File unavailable
            </span>
        );
    }

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={loading}
            className={cn(
                "text-xs font-semibold text-[var(--accent-primary)] hover:underline disabled:opacity-40",
                className
            )}
        >
            {loading ? "Opening…" : "View file"}
        </button>
    );
}
