"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const ACCEPTED = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_BYTES = 10 * 1024 * 1024;

export function ResumeUpload() {
    const inputRef = useRef<HTMLInputElement>(null);
    const mine = useQuery(api.educators.getMine, {});
    const generateUrl = useMutation(api.educators.generateResumeUploadUrl);
    const setResume = useMutation(api.educators.setResume);
    const clearResume = useMutation(api.educators.clearResume);
    const resume = useQuery(
        api.educators.getResumeUrl,
        mine ? { educatorId: mine._id } : "skip"
    );
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;
        if (!ACCEPTED.includes(file.type) && !file.name.match(/\.(pdf|doc|docx)$/i)) {
            setError("Upload a PDF or Word document.");
            return;
        }
        if (file.size > MAX_BYTES) {
            setError("Keep the file under 10 MB.");
            return;
        }
        setBusy(true);
        setError(null);
        try {
            const uploadUrl = await generateUrl({});
            const result = await fetch(uploadUrl, {
                method: "POST",
                headers: { "Content-Type": file.type || "application/octet-stream" },
                body: file,
            });
            const json = (await result.json()) as { storageId: string };
            await setResume({ storageId: json.storageId as never, fileName: file.name });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not upload resume.");
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="flex flex-col gap-3">
            <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">Resume / CV</p>
                <p className="text-sm text-[var(--text-secondary)]">Districts can download this from your profile and you can reuse it on proposals.</p>
            </div>
            {resume ? (
                <a href={resume.url} target="_blank" rel="noreferrer" className="text-sm font-bold text-[var(--accent-primary)]">
                    {resume.fileName}
                </a>
            ) : (
                <p className="text-sm text-[var(--text-tertiary)]">No resume uploaded yet.</p>
            )}
            <div className="flex flex-wrap gap-3">
                <button
                    type="button"
                    className="rounded-md border border-[var(--border-strong)] px-3 py-2 text-sm font-bold"
                    disabled={busy}
                    onClick={() => inputRef.current?.click()}
                >
                    {busy ? "Uploading…" : resume ? "Replace file" : "Upload resume"}
                </button>
                {resume && (
                    <button
                        type="button"
                        className="text-sm font-bold text-red-600"
                        onClick={() => void clearResume({})}
                    >
                        Remove
                    </button>
                )}
            </div>
            <input ref={inputRef} type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleFile} />
            {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
    );
}
