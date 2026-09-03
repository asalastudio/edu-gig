import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, getCurrentUserOrNull } from "./lib/auth";

const notificationValidator = v.object({
    _id: v.id("notifications"),
    type: v.string(),
    title: v.string(),
    body: v.string(),
    read: v.boolean(),
    actionUrl: v.optional(v.string()),
    createdAt: v.number(),
});

export const listUnread = query({
    args: {},
    returns: v.array(notificationValidator),
    handler: async (ctx) => {
        const user = await getCurrentUserOrNull(ctx);
        if (!user) return [];
        const rows = await ctx.db
            .query("notifications")
            .withIndex("by_user_and_read", (q) => q.eq("userId", user._id).eq("read", false))
            .order("desc")
            .take(20);
        return rows.map((row) => ({
            _id: row._id,
            type: row.type,
            title: row.title,
            body: row.body,
            read: row.read,
            actionUrl: row.actionUrl,
            createdAt: row.createdAt,
        }));
    },
});

export const listRecent = query({
    args: {},
    returns: v.array(notificationValidator),
    handler: async (ctx) => {
        const user = await getCurrentUserOrNull(ctx);
        if (!user) return [];
        const rows = await ctx.db
            .query("notifications")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .order("desc")
            .take(20);
        return rows.map((row) => ({
            _id: row._id,
            type: row.type,
            title: row.title,
            body: row.body,
            read: row.read,
            actionUrl: row.actionUrl,
            createdAt: row.createdAt,
        }));
    },
});

export const unreadCount = query({
    args: {},
    returns: v.number(),
    handler: async (ctx) => {
        const user = await getCurrentUserOrNull(ctx);
        if (!user) return 0;
        const rows = await ctx.db
            .query("notifications")
            .withIndex("by_user_and_read", (q) => q.eq("userId", user._id).eq("read", false))
            .take(50);
        return rows.length;
    },
});

export const markRead = mutation({
    args: { notificationId: v.id("notifications") },
    returns: v.null(),
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        const note = await ctx.db.get(args.notificationId);
        if (!note) throw new Error("Not found");
        if (note.userId !== user._id) throw new Error("Forbidden");
        await ctx.db.patch(args.notificationId, { read: true });
        return null;
    },
});

export const markAllRead = mutation({
    args: {},
    returns: v.number(),
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        const unread = await ctx.db
            .query("notifications")
            .withIndex("by_user_and_read", (q) => q.eq("userId", user._id).eq("read", false))
            .take(50);
        for (const note of unread) {
            await ctx.db.patch(note._id, { read: true });
        }
        return unread.length;
    },
});
