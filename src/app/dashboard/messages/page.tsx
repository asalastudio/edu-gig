"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Sidebar } from "@/components/shared/sidebar";
import { PageHeader } from "@/components/shared/page-header";
import { PrimaryButton } from "@/components/shared/button";
import { cn } from "@/lib/utils";
import { AUTH_INTENT_PARAM } from "@/lib/auth-intent";
import { ChatCircleText, MagnifyingGlass, PaperPlaneRight, UserCircle } from "@phosphor-icons/react";

export default function MessagesPage() {
    return (
        <Suspense fallback={null}>
            <MessagesPageInner />
        </Suspense>
    );
}

function MessagesPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pendingRecipientId = searchParams.get("to") ?? null;
    const pendingRecipientName = searchParams.get("name") ?? null;
    const returnTo = `/dashboard/messages${pendingRecipientId ? `?to=${encodeURIComponent(pendingRecipientId)}${pendingRecipientName ? `&name=${encodeURIComponent(pendingRecipientName)}` : ""}` : ""}`;

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
    const messageEndRef = useRef<HTMLDivElement | null>(null);

    // When a ?to=... pending recipient is supplied, pre-select that "virtual" thread on first mount.
    useEffect(() => {
        if (!pendingRecipientId || selectedConversationId || selectedPendingRecipientId) return;
        const existingConversation = convList.find((c) => c.counterpartId === pendingRecipientId);
        if (existingConversation) {
            setSelectedConversationId(existingConversation.conversationId);
        } else {
            setSelectedPendingRecipientId(pendingRecipientId);
        }
    }, [convList, pendingRecipientId, selectedConversationId, selectedPendingRecipientId]);

    // If conversations load after a pending deep link, swap the placeholder for the real thread.
    useEffect(() => {
        if (!selectedPendingRecipientId) return;
        const existingConversation = convList.find((c) => c.counterpartId === selectedPendingRecipientId);
        if (!existingConversation) return;
        setSelectedConversationId(existingConversation.conversationId);
        setSelectedPendingRecipientId(null);
    }, [convList, selectedPendingRecipientId]);

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

    const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    const signedOut = !hasClerk || viewer === null;

    const activeConversationRow = activeConversationId
        ? convList.find((c) => c.conversationId === activeConversationId) ?? null
        : null;

    // The recipient for a send — either the counterpart of the active thread, or a pending start.
    const activeCounterpartId: Id<"users"> | null = selectedPendingRecipientId
        ? (selectedPendingRecipientId as Id<"users">)
        : activeConversationRow
          ? (activeConversationRow.counterpartId as Id<"users">)
          : null;

    useEffect(() => {
        setComposerValue("");
        setSendError(null);
    }, [activeCounterpartId]);

    const pendingRecipientLabel = selectedPendingRecipientId
        ? pendingRecipientName?.trim() || "New conversation"
        : null;
    const activeThreadName = pendingRecipientLabel ?? activeConversationRow?.counterpartName ?? "Messages";
    const hasMessages = (activeConversation?.length ?? 0) > 0;

    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ block: "end" });
    }, [activeConversation?.length, activeConversationId, selectedPendingRecipientId]);

    const starterMessages = [
        `Hi ${activeThreadName}, we'd like to confirm your availability for an upcoming need.`,
        `Hi ${activeThreadName}, can you share a bit more about your fit for this role?`,
        `Hi ${activeThreadName}, what details would help you decide if this request is a good match?`,
    ];

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
        <div className="flex h-screen bg-[var(--bg-subtle)] font-sans pt-14 lg:pt-0">
            <Sidebar />
            <main className="flex-1 overflow-y-auto w-full">
                <div className="max-w-[1200px] w-full mx-auto px-8 lg:px-12 py-10">
                    <PageHeader
                        title="Messages"
                        description="Coordinate availability, request details, and next steps with educators."
                        actions={
                            <Link href="/browse">
                                <button className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--border-strong)] bg-white px-4 py-2.5 text-sm font-bold text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]">
                                    <MagnifyingGlass className="h-4 w-4" />
                                    Find educators
                                </button>
                            </Link>
                        }
                    />

                    {signedOut && (
                        <div className="mt-8 p-8 rounded-lg bg-white border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                            <h2 className="font-heading text-xl font-bold text-[var(--text-primary)] mb-2">
                                Sign in to continue messaging
                            </h2>
                            <p className="text-sm font-medium mb-6">
                                Your conversations are tied to your K12Gig account. Sign in and we’ll bring you back here.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Link href={`/sign-in?next=${encodeURIComponent(returnTo)}`}>
                                    <PrimaryButton className="w-full sm:w-auto">Sign in</PrimaryButton>
                                </Link>
                                <Link href={`/sign-up?${AUTH_INTENT_PARAM}=district&next=${encodeURIComponent(returnTo)}`}>
                                    <button className="w-full sm:w-auto px-6 py-3 rounded-lg border border-[var(--border-strong)] font-bold text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]">
                                        Create account
                                    </button>
                                </Link>
                            </div>
                        </div>
                    )}

                    {!signedOut && (
                        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-[320px_minmax(0,1fr)]">
                            <aside className="bg-white rounded-lg border border-[var(--border-subtle)] overflow-hidden">
                                <div className="border-b border-[var(--border-subtle)] px-5 py-4">
                                    <p className="font-heading text-lg font-bold text-[var(--text-primary)]">
                                        Conversations
                                    </p>
                                    <p className="mt-1 text-xs font-medium text-[var(--text-secondary)]">
                                        {convList.length} active {convList.length === 1 ? "thread" : "threads"}
                                    </p>
                                </div>
                                {selectedPendingRecipientId && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            // keep the pending thread selected when clicked
                                            setSelectedPendingRecipientId(selectedPendingRecipientId);
                                            setSelectedConversationId(null);
                                        }}
                                        className="w-full text-left px-5 py-4 border-b border-[var(--border-subtle)] hover:bg-[var(--bg-subtle)] transition-colors flex flex-col gap-1 bg-[var(--bg-subtle)]"
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
                                    <div className="p-6 text-sm leading-6 text-[var(--text-secondary)]">
                                        <ChatCircleText className="mb-3 h-8 w-8 text-[var(--accent-primary)]" />
                                        Start from an educator profile, then your district thread will appear here.
                                    </div>
                                ) : (
                                    convList.map((c) => (
                                        <button
                                            key={c.conversationId}
                                            onClick={() => {
                                                setSelectedConversationId(c.conversationId);
                                                setSelectedPendingRecipientId(null);
                                                router.replace(
                                                    `/dashboard/messages?to=${encodeURIComponent(c.counterpartId)}&name=${encodeURIComponent(c.counterpartName)}`,
                                                    { scroll: false }
                                                );
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

                            <section className="bg-white rounded-lg border border-[var(--border-subtle)] min-h-[560px] flex flex-col overflow-hidden">
                                <div className="flex items-center justify-between gap-4 border-b border-[var(--border-subtle)] px-5 py-4">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-subtle)] text-[var(--accent-primary)]">
                                            <UserCircle className="h-6 w-6" weight="fill" />
                                        </div>
                                        <div className="min-w-0">
                                            <h2 className="truncate font-heading text-lg font-bold text-[var(--text-primary)]">
                                                {activeThreadName}
                                            </h2>
                                            <p className="text-xs font-medium text-[var(--text-secondary)]">
                                                K12Gig internal message thread
                                            </p>
                                        </div>
                                    </div>
                                    {activeConversationRow?.unread ? (
                                        <span className="rounded-full bg-[var(--accent-primary)] px-2.5 py-1 text-xs font-bold text-white">
                                            {activeConversationRow.unread} unread
                                        </span>
                                    ) : null}
                                </div>

                                <div className="flex-1 p-5">
                                {selectedPendingRecipientId ? (
                                    <div className="flex h-full flex-col items-center justify-center text-center gap-3 text-sm text-[var(--text-secondary)]">
                                        <ChatCircleText className="h-10 w-10 text-[var(--accent-primary)]" />
                                        <div className="font-heading font-bold text-[var(--text-primary)] text-lg">
                                            {pendingRecipientLabel}
                                        </div>
                                        <p>Start with a short note about availability, fit, or request details.</p>
                                    </div>
                                ) : !activeConversationId ? (
                                    <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-sm text-[var(--text-secondary)]">
                                        <ChatCircleText className="h-10 w-10 text-[var(--accent-primary)]" />
                                        <p>Select a conversation or message an educator from the directory.</p>
                                    </div>
                                ) : activeConversation === undefined ? (
                                    <div className="flex h-full items-center justify-center text-sm text-[var(--text-secondary)]">
                                        Loading…
                                    </div>
                                ) : (
                                    <div className="flex h-full max-h-[430px] flex-col gap-3 overflow-y-auto pr-1">
                                        {activeConversation.map((m) => (
                                            <div
                                                key={m._id}
                                                className={cn(
                                                    "max-w-[78%] px-4 py-3 rounded-lg text-sm shadow-[0_1px_2px_rgba(22,32,26,0.08)]",
                                                    m.senderId === viewer?._id
                                                        ? "self-end bg-[var(--accent-primary)] text-white"
                                                        : "self-start bg-[var(--bg-subtle)] text-[var(--text-primary)]"
                                                )}
                                            >
                                                <p className="leading-6">{m.content}</p>
                                                <p
                                                    className={cn(
                                                        "mt-1 text-[11px] font-medium",
                                                        m.senderId === viewer?._id
                                                            ? "text-white/70"
                                                            : "text-[var(--text-tertiary)]"
                                                    )}
                                                >
                                                    {formatMessageTime(m.createdAt)}
                                                </p>
                                            </div>
                                        ))}
                                        <div ref={messageEndRef} />
                                    </div>
                                )}
                                </div>

                                <form
                                    className="border-t border-[var(--border-subtle)] bg-[var(--bg-app)] p-5 flex flex-col gap-3"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        void handleSend();
                                    }}
                                >
                                    {(selectedPendingRecipientId || !hasMessages) && activeCounterpartId && (
                                        <div className="flex flex-wrap gap-2">
                                            {starterMessages.map((message) => (
                                                <button
                                                    key={message}
                                                    type="button"
                                                    onClick={() => setComposerValue(message)}
                                                    className="rounded-full border border-[var(--border-subtle)] bg-white px-3 py-1.5 text-xs font-bold text-[var(--text-secondary)] hover:border-[var(--accent-primary)]/40 hover:text-[var(--accent-primary)]"
                                                >
                                                    {message.startsWith(`Hi ${activeThreadName}, we'd`) ? "Ask availability" : message.includes("fit") ? "Ask about fit" : "Ask what they need"}
                                                </button>
                                            ))}
                                        </div>
                                    )}
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
                                        className="w-full resize-none rounded-lg border border-[var(--border-subtle)] bg-white px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-1 disabled:opacity-50"
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
                                            <PaperPlaneRight className="h-4 w-4" weight="fill" />
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

function formatMessageTime(timestamp: number) {
    return new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    }).format(new Date(timestamp));
}
