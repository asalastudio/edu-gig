"use client";

import React, { useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

function initials(firstName?: string, lastName?: string) {
    const first = firstName?.trim()?.[0] ?? "";
    const last = lastName?.trim()?.[0] ?? "";
    return (first + last).toUpperCase() || "?";
}

export function AvatarUpload() {
    const viewer = useQuery(api.users.viewer, hasClerk ? {} : "skip");
    const generateAvatarUploadUrl = useMutation(api.users.generateAvatarUploadUrl);
    const setAvatar = useMutation(api.users.setAvatar);
    const clearAvatar = useMutation(api.users.clearAvatar);

    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [removing, setRemoving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const avatarUrl = viewer?.avatarUrl;

    async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        // Reset the input so re-selecting the same file fires onChange again.
        e.target.value = "";
        if (!file) return;

        setError(null);
        if (!ACCEPTED_TYPES.includes(file.type)) {
            setError("Choose a PNG, JPG, or WebP image.");
            return;
        }
        if (file.size > MAX_BYTES) {
            setError("Image is too large. Keep it under 5 MB.");
            return;
        }

        setUploading(true);
        try {
            const url = await generateAvatarUploadUrl({});
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });
            if (!res.ok) throw new Error("Upload failed");
            const { storageId } = (await res.json()) as { storageId: Id<"_storage"> };
            await setAvatar({ storageId });
        } catch (err) {
            console.error("Avatar upload failed:", err);
            setError("Could not upload image. Please try again.");
        } finally {
            setUploading(false);
        }
    }

    async function handleRemove() {
        setError(null);
        setRemoving(true);
        try {
            await clearAvatar({});
        } catch (err) {
            console.error("Avatar remove failed:", err);
            setError("Could not remove image. Please try again.");
        } finally {
            setRemoving(false);
        }
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                    Business logo or profile photo
                </span>
                <span className="text-sm text-[var(--text-secondary)]">
                    Shown on your public profile and directory card.
                </span>
            </div>
            <div className="flex items-center gap-5">
                <Avatar size="lg" className="size-16">
                    {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
                    <AvatarFallback className="text-base font-bold">
                        {initials(viewer?.firstName, viewer?.lastName)}
                    </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-2">
                    <input
                        ref={inputRef}
                        type="file"
                        accept=".png,.jpg,.jpeg,.webp"
                        onChange={handleFile}
                        className="hidden"
                    />
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            disabled={uploading}
                            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[var(--border-subtle)] px-4 py-2 text-sm font-bold text-[var(--text-secondary)] hover:border-[var(--accent-primary)]/40 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {uploading ? "Uploading…" : "Upload logo or photo"}
                        </button>
                        {avatarUrl && (
                            <button
                                type="button"
                                onClick={handleRemove}
                                disabled={removing || uploading}
                                className="text-sm font-semibold text-red-700 hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {removing ? "Removing…" : "Remove"}
                            </button>
                        )}
                    </div>
                    <span className="text-xs text-[var(--text-tertiary)]">
                        PNG, JPG, or WebP. Up to 5 MB.
                    </span>
                </div>
            </div>
            {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
        </div>
    );
}
