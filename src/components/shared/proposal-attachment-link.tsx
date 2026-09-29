"use client";

import { useState } from "react";
import { useConvex } from "convex/react";
import { Paperclip } from "@phosphor-icons/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

/** One-shot signed-URL fetch for a proposal attachment; opens it in a new tab. */
export function ProposalAttachmentLink({
    proposalId,
    attachmentName,
}: {
    proposalId: Id<"proposals">;
    attachmentName?: string;
}) {
    const convex = useConvex();
    const [loading, setLoading] = useState(false);
    const [unavailable, setUnavailable] = useState(false);

    async function handleClick() {
        setUnavailable(false);
        setLoading(true);
        try {
            const url = await convex.query(api.proposals.getAttachmentUrl, { proposalId });
            if (!url) {
                setUnavailable(true);
                return;
            }
            window.open(url, "_blank", "noopener");
        } catch (err) {
            console.error("Attachment fetch failed:", err);
            setUnavailable(true);
        } finally {
            setLoading(false);
        }
    }

    if (unavailable) {
        return <span className="text-[var(--text-tertiary)]">Attachment unavailable</span>;
    }

    return (
        <button
            type="button"
            onClick={() => void handleClick()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 font-semibold text-[var(--accent-primary)] hover:underline disabled:opacity-40"
        >
            <Paperclip weight="bold" className="w-4 h-4" />
            {loading ? "Opening…" : attachmentName || "View attachment"}
        </button>
    );
}
