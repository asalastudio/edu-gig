"use client";

import React, { useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

function initials(firstName?: string | null, lastName?: string | null) {
    const first = firstName?.trim()?.[0] ?? "";
    const last = lastName?.trim()?.[0] ?? "";
    return (first + last).toUpperCase() || "?";
}

/**
 * Profile photo / business logo control. The image lives in Clerk (the account's
 * single source of truth, shown in the account menu), and we mirror Clerk's URL
 * into Convex so the public profile and directory render the same image.
 */
export function AvatarUpload() {
    const { user, isLoaded } = useUser();
    const syncAvatar = useMutation(api.users.syncAvatarFromClerk);

    const inputRef = useRef<HTMLInputElement>(null);
    const [busy, setBusy] = useState<null | "upload" | "remove">(null);
    const [error, setError] = useState<string | null>(null);

    const showImage = !!user?.hasImage;
    const imageUrl = user?.imageUrl;

    async function persist() {
        if (!user) return;
        await user.reload();
        await syncAvatar({ imageUrl: user.hasImage ? user.imageUrl : undefined });
    }

    async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file || !user) return;

        setError(null);
        if (!ACCEPTED_TYPES.includes(file.type)) {
            setError("Choose a PNG, JPG, or WebP image.");
            return;
        }
        if (file.size > MAX_BYTES) {
            setError("Image is too large. Keep it under 5 MB.");
            return;
        }

        setBusy("upload");
        try {
            await user.setProfileImage({ file });
            await persist();
        } catch (err) {
            console.error("Avatar upload failed:", err);
            setError("Could not upload image. Please try again.");
        } finally {
            setBusy(null);
        }
    }

    async function handleRemove() {
        if (!user) return;
        setError(null);
        setBusy("remove");
        try {
            await user.setProfileImage({ file: null });
            await persist();
        } catch (err) {
            console.error("Avatar remove failed:", err);
            setError("Could not remove image. Please try again.");
        } finally {
            setBusy(null);
        }
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                    Profile photo &amp; business logo
                </span>
                <span className="text-sm text-[var(--text-secondary)]">
                    One image, used everywhere — your account menu, your public profile, and your directory listing.
                </span>
            </div>
            <div className="flex items-center gap-5">
                <Avatar size="lg" className="size-16">
                    {showImage && <AvatarImage src={imageUrl} alt="" />}
                    <AvatarFallback className="text-base font-bold">
                        {initials(user?.firstName, user?.lastName)}
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
                            disabled={!isLoaded || busy !== null}
                            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[var(--border-subtle)] px-4 py-2 text-sm font-bold text-[var(--text-secondary)] hover:border-[var(--accent-primary)]/40 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {busy === "upload" ? "Uploading…" : showImage ? "Replace image" : "Upload logo or photo"}
                        </button>
                        {showImage && (
                            <button
                                type="button"
                                onClick={handleRemove}
                                disabled={busy !== null}
                                className="text-sm font-semibold text-red-700 hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {busy === "remove" ? "Removing…" : "Remove"}
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
