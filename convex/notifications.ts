import { query, mutation } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";

async function getUserByClerkId(ctx: QueryCtx | MutationCtx, clerkId: string) {
    return await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
        .first();
}

async function requireViewer(ctx: QueryCtx | MutationCtx) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await getUserByClerkId(ctx, identity.subject);
    if (!user) throw new Error("Unauthorized");
    return user;
}

export const listUnread = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];
        const user = await getUserByClerkId(ctx, identity.subject);
        if (!user) return [];
        return await ctx.db
            .query("notifications")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .filter((q) => q.eq(q.field("read"), false))
            .order("desc")
            .collect();
    },
});

export const unreadCount = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return 0;
        const user = await getUserByClerkId(ctx, identity.subject);
        if (!user) return 0;
        const rows = await ctx.db
            .query("notifications")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .filter((q) => q.eq(q.field("read"), false))
            .collect();
        return rows.length;
    },
});

export const markRead = mutation({
    args: { notificationId: v.id("notifications") },
    handler: async (ctx, args) => {
        const user = await requireViewer(ctx);
        const note = await ctx.db.get(args.notificationId);
        if (!note) throw new Error("Not found");
        if (note.userId !== user._id) throw new Error("Forbidden");
        await ctx.db.patch(args.notificationId, { read: true });
    },
});
