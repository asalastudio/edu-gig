"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { formatAdminDate } from "@/lib/map-admin";

export function AdminNotes({ entityType, entityId }: { entityType: string; entityId: string }) {
    const notes = useQuery(api.admin.listAdminNotes, { entityType, entityId });
    const addNote = useMutation(api.admin.addAdminNote);
    const [body, setBody] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleAddNote() {
        const nextBody = body.trim();
        if (!nextBody) return;
        setSaving(true);
        setError(null);
        try {
            await addNote({ entityType, entityId, body: nextBody });
            setBody("");
        } catch (err) {
            console.error(err);
            setError("Could not save the note.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <section className="space-y-4">
            <div>
                <h3 className="font-heading text-lg font-bold text-[var(--text-primary)]">Internal notes</h3>
                <p className="text-sm text-[var(--text-secondary)]">Visible only in the K12Gig admin workspace.</p>
            </div>
            <div className="space-y-3">
                <Textarea
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    placeholder="Add a procurement, verification, or support note..."
                    rows={4}
                />
                {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}
                <Button type="button" onClick={handleAddNote} disabled={saving || !body.trim()}>
                    {saving ? "Saving..." : "Add note"}
                </Button>
            </div>
            <div className="space-y-3">
                {notes === undefined ? (
                    <>
                        <Skeleton className="h-20 rounded-lg" />
                        <Skeleton className="h-20 rounded-lg" />
                    </>
                ) : notes.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4 text-sm font-semibold text-[var(--text-secondary)]">
                        No internal notes yet.
                    </p>
                ) : (
                    notes.map((note) => (
                        <article key={note.id} className="rounded-lg border border-[var(--border-subtle)] bg-white p-4">
                            <p className="text-sm leading-6 text-[var(--text-secondary)]">{note.body}</p>
                            <p className="mt-3 text-xs font-bold uppercase tracking-wide text-[var(--text-tertiary)]">
                                {note.authorName} · {formatAdminDate(note.createdAt)}
                            </p>
                        </article>
                    ))
                )}
            </div>
        </section>
    );
}
