"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Sidebar } from "@/components/shared/sidebar";
import { PageHeader } from "@/components/shared/page-header";
import { PrimaryButton } from "@/components/shared/button";
import { cn } from "@/lib/utils";

export default function MessagesPage() {
    const viewer = useQuery(api.users.viewer, {});
    const conversations = useQuery(api.messages.listMyConversations, viewer ? {} : "skip");
    const markRead = useMutation(api.messages.markConversationRead);

    const convList = useMemo(() => conversations ?? [], [conversations]);

    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const activeConversationId = selectedConversationId ?? convList[0]?.conversationId ?? null;

    const activeConversation = useQuery(
        api.messages.listConversation,
        activeConversationId ? { conversationId: activeConversationId } : "skip"
    );

    useEffect(() => {
        if (!activeConversationId) return;
        markRead({ conversationId: activeConversationId }).catch(() => {});
    }, [activeConversationId, markRead]);

    const signedOut = viewer === null;

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
                                {convList.length === 0 ? (
                                    <div className="p-6 text-sm text-[var(--text-secondary)]">
                                        No conversations yet. Start one from an educator profile.
                                    </div>
                                ) : convList.map((c) => (
                                    <button
                                        key={c.conversationId}
                                        onClick={() => setSelectedConversationId(c.conversationId)}
                                        className={cn(
                                            "w-full text-left px-5 py-4 border-b border-[var(--border-subtle)] hover:bg-[var(--bg-subtle)] transition-colors flex flex-col gap-1",
                                            activeConversationId === c.conversationId && "bg-[var(--bg-subtle)]"
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-[var(--text-primary)]">{c.counterpartName}</span>
                                            {c.unread > 0 && (
                                                <span className="px-2 py-0.5 bg-[var(--accent-primary)] text-white text-xs font-bold rounded-full">
                                                    {c.unread}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-sm text-[var(--text-secondary)] line-clamp-1">{c.lastMessage}</span>
                                    </button>
                                ))}
                            </aside>

                            <section className="md:col-span-2 bg-white rounded-3xl border border-[var(--border-subtle)] p-6 min-h-[500px] flex flex-col">
                                {!activeConversationId ? (
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
                                <p className="mt-4 text-xs text-[var(--text-tertiary)]">
                                    Reply composer coming in the next iteration.
                                </p>
                                <div className="mt-2">
                                    <PrimaryButton disabled>Reply (coming soon)</PrimaryButton>
                                </div>
                            </section>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
