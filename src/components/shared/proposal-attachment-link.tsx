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
        // Open during the click so the later navigation keeps user activation.
        // Do not pass noopener here — that makes window.open return null.
        const tab = window.open("about:blank", "_blank");
        try {
            const url = await convex.query(api.proposals.getAttachmentUrl, { proposalId });
            if (!url) {
                tab?.close();
                setUnavailable(true);
                return;
            }
            if (tab) {
                tab.opener = null;
                tab.location.href = url;
            } else {
                window.open(url, "_blank", "noopener");
            }
        } catch (err) {
            console.error("Attachment fetch failed:", err);
            tab?.close();
            setUnavailable(true);
        } finally {
            setLoading(false);
        }
    }

    return (
        <span className="inline-flex items-center gap-2">
            <button
                type="button"
                onClick={() => void handleClick()}
                disabled={loading}
                className="inline-flex items-center gap-1.5 font-semibold text-[var(--accent-primary)] hover:underline disabled:opacity-40"
            >
                <Paperclip weight="bold" className="w-4 h-4" />
                {loading ? "Opening…" : attachmentName || "View attachment"}
            </button>
            {unavailable && <span className="text-[var(--text-tertiary)]">Attachment unavailable</span>}
        </span>
    );
}
