"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useSearchParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Sidebar } from "@/components/shared/sidebar";
import { PageHeader } from "@/components/shared/page-header";
import { PrimaryButton } from "@/components/shared/button";
import { cn } from "@/lib/utils";

export default function MessagesPage() {
    return (
        <Suspense fallback={null}>
            <MessagesPageInner />
        </Suspense>
    );
}

function MessagesPageInner() {
    const searchParams = useSearchParams();
    const pendingRecipientId = searchParams.get("to") ?? null;
    const pendingRecipientName = searchParams.get("name") ?? null;

    const viewer = useQuery(api.users.viewer, {});
    const conversations = useQuery(api.messages.listMyConversations, viewer ? {} : "skip");
    const markRead = useMutation(api.messages.markConversationRead);
    const sendMessage = useMutation(api.messages.send);

    const convList = useMemo(() => conversations ?? [], [conversations]);

    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [selectedPendingRecipientId, setSelectedPendingRecipientId] = useState<string | null>(null);
    const [composerValue, setComposerValue] = useState("");
    const [sending, setSending] = useState(false);
    const [sendError, setSendError] = useState<string | null>(null);

    // When a ?to=... pending recipient is supplied, pre-select that "virtual" thread on first mount.
    useEffect(() => {
        if (pendingRecipientId && !selectedConversationId && !selectedPendingRecipientId) {
            setSelectedPendingRecipientId(pendingRecipientId);
        }
    }, [pendingRecipientId, selectedConversationId, selectedPendingRecipientId]);

    const activeConversationId = selectedPendingRecipientId
        ? null
        : selectedConversationId ?? convList[0]?.conversationId ?? null;

    const activeConversation = useQuery(
        api.messages.listConversation,
        activeConversationId ? { conversationId: activeConversationId } : "skip"
    );

    useEffect(() => {
        if (!activeConversationId) return;
        markRead({ conversationId: activeConversationId }).catch(() => {});
    }, [activeConversationId, markRead]);

    const signedOut = viewer === null;

    const activeConversationRow = activeConversationId
        ? convList.find((c) => c.conversationId === activeConversationId) ?? null
        : null;

    // The recipient for a send — either the counterpart of the active thread, or a pending start.
    const activeCounterpartId: Id<"users"> | null = selectedPendingRecipientId
        ? (selectedPendingRecipientId as Id<"users">)
        : activeConversationRow
          ? (activeConversationRow.counterpartId as Id<"users">)
          : null;

    const pendingRecipientLabel = selectedPendingRecipientId
        ? pendingRecipientName?.trim() || "New conversation"
        : null;

    async function handleSend() {
        if (!activeCounterpartId) return;
        const content = composerValue.trim();
        if (!content) return;
        setSending(true);
        setSendError(null);
        try {
            await sendMessage({ recipientUserId: activeCounterpartId, content });
            setComposerValue("");
            // When the first message lands, switch from the pending placeholder to the real thread.
            if (selectedPendingRecipientId && viewer?._id) {
                const conversationId = [viewer._id, selectedPendingRecipientId].sort().join(":");
                setSelectedConversationId(conversationId);
                setSelectedPendingRecipientId(null);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to send message.";
            setSendError(message);
        } finally {
            setSending(false);
        }
    }

    const composerDisabled = !activeCounterpartId || composerValue.trim().length === 0 || sending;

    return (
        <div className="flex h-screen bg-[var(--bg-subtle)] font-sans">
            <Sidebar />
            <main className="flex-1 overflow-y-auto w-full">
                <div className="max-w-[1200px] w-full mx-auto px-8 lg:px-12 py-10">
                    <PageHeader
                        title="Messages"
                        description="District ↔ educator conversations happen here."
                    />

                    {signedOut && (
                        <div className="mt-8 p-8 rounded-3xl bg-white border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                            Sign in to see your conversations.
                        </div>
                    )}

                    {!signedOut && (
                        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <aside className="md:col-span-1 bg-white rounded-3xl border border-[var(--border-subtle)] overflow-hidden">
                                {selectedPendingRecipientId && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            // keep the pending thread selected when clicked
                                            setSelectedPendingRecipientId(selectedPendingRecipientId);
                                            setSelectedConversationId(null);
                                        }}
                                        className={cn(
                                            "w-full text-left px-5 py-4 border-b border-[var(--border-subtle)] hover:bg-[var(--bg-subtle)] transition-colors flex flex-col gap-1 bg-[var(--bg-subtle)]"
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-[var(--text-primary)]">
                                                {pendingRecipientLabel}
                                            </span>
                                            <span className="px-2 py-0.5 bg-[var(--accent-secondary)] text-[var(--text-primary)] text-xs font-bold rounded-full">
                                                New
                                            </span>
                                        </div>
                                        <span className="text-sm text-[var(--text-secondary)] line-clamp-1">
                                            Start a new conversation
                                        </span>
                                    </button>
                                )}
                                {convList.length === 0 && !selectedPendingRecipientId ? (
                                    <div className="p-6 text-sm text-[var(--text-secondary)]">
                                        No conversations yet. Start one from an educator profile.
                                    </div>
                                ) : (
                                    convList.map((c) => (
                                        <button
                                            key={c.conversationId}
                                            onClick={() => {
                                                setSelectedConversationId(c.conversationId);
                                                setSelectedPendingRecipientId(null);
                                            }}
                                            className={cn(
                                                "w-full text-left px-5 py-4 border-b border-[var(--border-subtle)] hover:bg-[var(--bg-subtle)] transition-colors flex flex-col gap-1",
                                                activeConversationId === c.conversationId && "bg-[var(--bg-subtle)]"
                                            )}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-[var(--text-primary)]">
                                                    {c.counterpartName}
                                                </span>
                                                {c.unread > 0 && (
                                                    <span className="px-2 py-0.5 bg-[var(--accent-primary)] text-white text-xs font-bold rounded-full">
                                                        {c.unread}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-sm text-[var(--text-secondary)] line-clamp-1">
                                                {c.lastMessage}
                                            </span>
                                        </button>
                                    ))
                                )}
                            </aside>

                            <section className="md:col-span-2 bg-white rounded-3xl border border-[var(--border-subtle)] p-6 min-h-[500px] flex flex-col">
                                {selectedPendingRecipientId ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 text-sm text-[var(--text-secondary)]">
                                        <div className="font-bold text-[var(--text-primary)] text-base">
                                            {pendingRecipientLabel}
                                        </div>
                                        <p>No messages yet — send the first one below.</p>
                                    </div>
                                ) : !activeConversationId ? (
                                    <div className="flex-1 flex items-center justify-center text-sm text-[var(--text-secondary)]">
                                        Pick a conversation to view.
                                    </div>
                                ) : activeConversation === undefined ? (
                                    <div className="flex-1 flex items-center justify-center text-sm text-[var(--text-secondary)]">
                                        Loading…
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
                                        {activeConversation.map((m) => (
                                            <div
                                                key={m._id}
                                                className={cn(
                                                    "max-w-[75%] px-4 py-2 rounded-2xl text-sm",
                                                    m.senderId === viewer?._id
                                                        ? "self-end bg-[var(--accent-primary)] text-white"
                                                        : "self-start bg-[var(--bg-subtle)] text-[var(--text-primary)]"
                                                )}
                                            >
                                                {m.content}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <form
                                    className="mt-4 flex flex-col gap-2"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        void handleSend();
                                    }}
                                >
                                    <label htmlFor="message-composer" className="sr-only">
                                        Write a message
                                    </label>
                                    <textarea
                                        id="message-composer"
                                        value={composerValue}
                                        onChange={(e) => setComposerValue(e.target.value)}
                                        placeholder={
                                            activeCounterpartId
                                                ? "Write a message…"
                                                : "Pick a conversation or start a new one to reply."
                                        }
                                        disabled={!activeCounterpartId || sending}
                                        rows={3}
                                        className="w-full resize-none rounded-2xl border border-[var(--border-subtle)] bg-white px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-1 disabled:opacity-50"
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                                                e.preventDefault();
                                                void handleSend();
                                            }
                                        }}
                                    />
                                    {sendError && (
                                        <p className="text-xs text-[var(--accent-danger)]">{sendError}</p>
                                    )}
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-[var(--text-tertiary)]">
                                            Press ⌘/Ctrl + Enter to send.
                                        </p>
                                        <PrimaryButton type="submit" disabled={composerDisabled}>
                                            {sending ? "Sending…" : "Send"}
                                        </PrimaryButton>
                                    </div>
                                </form>
                            </section>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
