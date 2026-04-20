import { query, mutation } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

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

/** Deterministic conversation key for a pair of users. */
function conversationKey(a: string, b: string): string {
    return [a, b].sort().join(":");
}

/** Send a message from the current user to a recipient. */
export const send = mutation({
    args: {
        recipientUserId: v.id("users"),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        const sender = await requireViewer(ctx);
        if (sender._id === args.recipientUserId) throw new Error("Cannot message yourself");

        const recipient = await ctx.db.get(args.recipientUserId);
        if (!recipient) throw new Error("Recipient not found");

        const conversationId = conversationKey(sender._id, args.recipientUserId);

        const messageId = await ctx.db.insert("messages", {
            conversationId,
            senderId: sender._id,
            recipientId: args.recipientUserId,
            content: args.content,
            read: false,
            createdAt: Date.now(),
        });

        await ctx.db.insert("notifications", {
            userId: args.recipientUserId,
            type: "message",
            title: `New message from ${sender.firstName}`,
            body: args.content.slice(0, 140),
            read: false,
            actionUrl: "/dashboard/messages",
            createdAt: Date.now(),
        });

        try {
            await ctx.scheduler.runAfter(0, internal.emails.sendNewMessageAlert, { messageId });
        } catch (err) {
            console.log("[messages.send] email schedule skipped:", err);
        }

        return messageId;
    },
});

/** List the current user's most recent conversations (one row per counterpart). */
export const listMyConversations = query({
    args: {},
    handler: async (ctx) => {
        const user = await requireViewer(ctx);
        const all = await ctx.db.query("messages").collect();
        const mine = all.filter((m) => m.senderId === user._id || m.recipientId === user._id);

        type Conversation = {
            conversationId: string;
            counterpartId: string;
            counterpartName: string;
            lastMessage: string;
            lastAt: number;
            unread: number;
        };
        const byConv = new Map<string, Conversation>();
        for (const m of mine) {
            const counterpartId = m.senderId === user._id ? m.recipientId : m.senderId;
            const prev = byConv.get(m.conversationId);
            if (!prev || m.createdAt > prev.lastAt) {
                const counterpart = await ctx.db.get(counterpartId);
                byConv.set(m.conversationId, {
                    conversationId: m.conversationId,
                    counterpartId,
                    counterpartName: counterpart
                        ? `${counterpart.firstName} ${counterpart.lastName}`.trim()
                        : "Unknown",
                    lastMessage: m.content,
                    lastAt: m.createdAt,
                    unread: prev?.unread ?? 0,
                });
            }
            if (m.recipientId === user._id && !m.read) {
                const conv = byConv.get(m.conversationId)!;
                conv.unread += 1;
            }
        }
        return Array.from(byConv.values()).sort((a, b) => b.lastAt - a.lastAt);
    },
});

/** All messages in a conversation the viewer is part of. */
export const listConversation = query({
    args: { conversationId: v.string() },
    handler: async (ctx, args) => {
        const user = await requireViewer(ctx);
        const messages = await ctx.db
            .query("messages")
            .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
            .collect();
        if (!messages.some((m) => m.senderId === user._id || m.recipientId === user._id)) {
            throw new Error("Forbidden");
        }
        return messages.sort((a, b) => a.createdAt - b.createdAt);
    },
});

/** Mark all messages received in a conversation as read. */
export const markConversationRead = mutation({
    args: { conversationId: v.string() },
    handler: async (ctx, args) => {
        const user = await requireViewer(ctx);
        const messages = await ctx.db
            .query("messages")
            .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
            .collect();
        for (const m of messages) {
            if (m.recipientId === user._id && !m.read) {
                await ctx.db.patch(m._id, { read: true });
            }
        }
    },
});
