"use client";

import { useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { privateFileMime, uploadPrivateFile } from "@/lib/private-upload";

const ACCEPTED = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_BYTES = 10 * 1024 * 1024;
const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export function ResumeUpload() {
    if (!hasClerk) return <ResumeUploadView getToken={async () => null} />;
    return <ResumeUploadWithClerk />;
}

function ResumeUploadWithClerk() {
    const { getToken } = useAuth();
    return <ResumeUploadView getToken={() => getToken({ template: "convex" })} />;
}

function ResumeUploadView({ getToken }: { getToken: () => Promise<string | null> }) {
    const inputRef = useRef<HTMLInputElement>(null);
    const mine = useQuery(api.educators.getMine, {});
    const requestUpload = useMutation(api.privateFiles.requestUpload);
    const setResume = useMutation(api.educators.setResume);
    const clearResume = useMutation(api.educators.clearResume);
    const resume = useQuery(
        api.educators.getResumeUrl,
        mine ? { educatorId: mine._id } : "skip"
    );
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selected, setSelected] = useState<{ file: File; requestId: string } | null>(null);

    async function uploadSelected(next = selected) {
        if (!next) return;
        setBusy(true);
        setError(null);
        try {
            const ticket = await requestUpload({
                purpose: "resume",
                fileName: next.file.name,
                mimeType: privateFileMime(next.file),
                size: next.file.size,
                requestId: next.requestId,
            });
            const token = await getToken();
            if (!token) throw new Error("Your session expired. Sign in again, then retry.");
            const receipt = await uploadPrivateFile({ file: next.file, ticketId: ticket.ticketId, token });
            await setResume({ privateFileId: receipt.privateFileId, fileName: next.file.name });
            setSelected(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not upload resume.");
        } finally {
            setBusy(false);
        }
    }

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
        const next = { file, requestId: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}` };
        setSelected(next);
        void uploadSelected(next);
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
                {error && selected && (
                    <button type="button" className="text-sm font-bold text-[var(--accent-primary)]" disabled={busy} onClick={() => void uploadSelected()}>
                        Retry upload
                    </button>
                )}
            </div>
            <input ref={inputRef} type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleFile} />
            {selected && <p className="break-all text-sm font-semibold">{selected.file.name}</p>}
            {busy && <p role="status" aria-live="polite" className="text-sm text-[var(--text-secondary)]">Uploading resume…</p>}
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        </div>
    );
}
