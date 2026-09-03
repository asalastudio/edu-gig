"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Bell } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export function NotificationCenter({ unreadCount }: { unreadCount?: number }) {
    const [open, setOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const notes = useQuery(api.notifications.listRecent, open ? {} : "skip");
    const markRead = useMutation(api.notifications.markRead);
    const markAllRead = useMutation(api.notifications.markAllRead);

    useEffect(() => {
        if (!open) return;
        function onClick(event: MouseEvent) {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, [open]);

    return (
        <div className="relative" ref={panelRef}>
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-white/80 hover:bg-white/10"
                aria-expanded={open}
                aria-label="Notifications"
            >
                <Bell className="h-4 w-4" weight={unreadCount ? "fill" : "regular"} />
                <span>Notifications</span>
                {typeof unreadCount === "number" && unreadCount > 0 && (
                    <span className="ml-auto rounded-full bg-white/20 px-1.5 text-[10px] font-bold">{unreadCount}</span>
                )}
            </button>
            {open && (
                <div className="absolute bottom-10 left-0 z-50 w-[280px] max-h-80 overflow-y-auto rounded-lg border border-[#2B4338] bg-[#1d2f27] p-2 shadow-lg">
                    <div className="mb-2 flex items-center justify-between px-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">Recent</span>
                        <button
                            type="button"
                            className="text-[10px] font-bold uppercase tracking-widest text-white/70 hover:text-white"
                            onClick={() => void markAllRead({})}
                        >
                            Mark all read
                        </button>
                    </div>
                    {notes === undefined ? (
                        <p className="px-2 py-4 text-xs text-white/50">Loading…</p>
                    ) : notes.length === 0 ? (
                        <p className="px-2 py-4 text-xs text-white/50">No notifications yet.</p>
                    ) : (
                        notes.map((note) => (
                            <Link
                                key={note._id}
                                href={note.actionUrl ?? "/dashboard"}
                                onClick={() => {
                                    if (!note.read) void markRead({ notificationId: note._id });
                                    setOpen(false);
                                }}
                                className={cn(
                                    "mb-1 block rounded-md px-2 py-2 text-xs hover:bg-white/10",
                                    note.read ? "text-white/60" : "bg-white/5 text-white"
                                )}
                            >
                                <span className="block font-bold">{note.title}</span>
                                <span className="mt-0.5 block text-white/60">{note.body}</span>
                            </Link>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
