import { query, mutation } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { v } from "convex/values";
import { internal } from "./_generated/api";

const DISTRICT_ROLES = ["district_admin", "district_hr", "superintendent", "superadmin"] as const;

async function getUserByClerkId(ctx: QueryCtx | MutationCtx, clerkId: string) {
    return await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
        .first();
}

async function requireDistrictViewer(ctx: QueryCtx | MutationCtx) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await getUserByClerkId(ctx, identity.subject);
    if (!user || !DISTRICT_ROLES.includes(user.role as (typeof DISTRICT_ROLES)[number])) {
        throw new Error("Forbidden");
    }
    return user;
}

async function requireEducatorViewer(ctx: QueryCtx | MutationCtx) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await getUserByClerkId(ctx, identity.subject);
    if (!user || user.role !== "educator") throw new Error("Forbidden");
    return user;
}

const proposedRateUnitValidator = v.union(
    v.literal("hourly"),
    v.literal("daily"),
    v.literal("fixed")
);

/**
 * Educator submits a proposal on a district-posted need.
 * Rejects duplicate pending proposals from the same educator on the same need.
 * Notifies the district user that posted the need.
 */
export const submit = mutation({
    args: {
        needId: v.id("needs"),
        message: v.string(),
        proposedRate: v.optional(v.number()),
        proposedRateUnit: v.optional(proposedRateUnitValidator),
    },
    handler: async (ctx, args) => {
        const user = await requireEducatorViewer(ctx);

        const educator = await ctx.db
            .query("educators")
            .withIndex("by_user_id", (q) => q.eq("userId", user._id))
            .first();
        if (!educator) throw new Error("No educator profile");

        const need = await ctx.db.get(args.needId);
        if (!need) throw new Error("Not found");

        // Block duplicate pending proposals on the same need from the same educator.
        const existing = await ctx.db
            .query("proposals")
            .withIndex("by_need_and_educator", (q) =>
                q.eq("needId", args.needId).eq("educatorId", educator._id)
            )
            .collect();
        if (existing.some((p) => p.status === "pending")) {
            throw new Error("You already have a pending proposal on this need.");
        }

        const trimmed = args.message.trim();
        if (!trimmed) throw new Error("Message is required.");

        const proposalId = await ctx.db.insert("proposals", {
            needId: args.needId,
            educatorId: educator._id,
            educatorUserId: user._id,
            message: trimmed,
            proposedRate: args.proposedRate,
            proposedRateUnit: args.proposedRateUnit,
            status: "pending",
            createdAt: Date.now(),
        });

        // Notify the poster.
        const educatorName = `${user.firstName} ${user.lastName}`.trim() || "An educator";
        await ctx.db.insert("notifications", {
            userId: need.postedByUserId,
            type: "proposal",
            title: `New proposal from ${educatorName}`,
            body: trimmed.slice(0, 140),
            read: false,
            actionUrl: `/dashboard/district/needs/${args.needId}`,
            createdAt: Date.now(),
        });

        try {
            await ctx.scheduler.runAfter(0, internal.emails.sendNewProposalAlert, { proposalId });
        } catch (err) {
            console.log("[proposals.submit] email schedule skipped:", err);
        }

        return proposalId;
    },
});

/** Educator's own proposals, newest first. */
export const listMine = query({
    args: {},
    handler: async (ctx) => {
        const user = await requireEducatorViewer(ctx);
        const educator = await ctx.db
            .query("educators")
            .withIndex("by_user_id", (q) => q.eq("userId", user._id))
            .first();
        if (!educator) return [];
        return await ctx.db
            .query("proposals")
            .withIndex("by_educator", (q) => q.eq("educatorId", educator._id))
            .order("desc")
            .collect();
    },
});

/**
 * Proposals for a specific need. District-only.
 * Verifies ownership of the need (or superadmin). Joins educator + user for display.
 */
export const listForNeed = query({
    args: { needId: v.id("needs") },
    handler: async (ctx, args) => {
        const user = await requireDistrictViewer(ctx);
        const need = await ctx.db.get(args.needId);
        if (!need) throw new Error("Not found");
        if (need.postedByUserId !== user._id && user.role !== "superadmin") {
            throw new Error("Forbidden");
        }

        const proposals = await ctx.db
            .query("proposals")
            .withIndex("by_need", (q) => q.eq("needId", args.needId))
            .order("desc")
            .collect();

        const rows: Array<{
            proposal: Doc<"proposals">;
            educator: Doc<"educators"> | null;
            user: Doc<"users"> | null;
        }> = [];
        for (const proposal of proposals) {
            const educator = await ctx.db.get(proposal.educatorId);
            const educatorUser = await ctx.db.get(proposal.educatorUserId);
            rows.push({ proposal, educator, user: educatorUser });
        }
        return rows;
    },
});

/**
 * District accepts a proposal:
 * - patches the proposal to "accepted"
 * - patches the need to "placed"
 * - rejects all other pending proposals on this need
 * - notifies the educator
 */
export const accept = mutation({
    args: { proposalId: v.id("proposals") },
    handler: async (ctx, args) => {
        const user = await requireDistrictViewer(ctx);
        const proposal = await ctx.db.get(args.proposalId);
        if (!proposal) throw new Error("Not found");

        const need = await ctx.db.get(proposal.needId);
        if (!need) throw new Error("Need not found");
        if (need.postedByUserId !== user._id && user.role !== "superadmin") {
            throw new Error("Forbidden");
        }

        await ctx.db.patch(args.proposalId, { status: "accepted" });
        await ctx.db.patch(proposal.needId, { status: "placed" });

        // Reject all other pending proposals on this need.
        const siblings = await ctx.db
            .query("proposals")
            .withIndex("by_need", (q) => q.eq("needId", proposal.needId))
            .collect();
        for (const sibling of siblings) {
            if (sibling._id !== args.proposalId && sibling.status === "pending") {
                await ctx.db.patch(sibling._id, { status: "rejected" });
            }
        }

        await ctx.db.insert("notifications", {
            userId: proposal.educatorUserId,
            type: "proposal_accepted",
            title: "Your proposal was accepted",
            body: `${need.orgName} accepted your proposal.`,
            read: false,
            actionUrl: `/dashboard/educator/needs`,
            createdAt: Date.now(),
        });

        try {
            await ctx.scheduler.runAfter(0, internal.emails.sendProposalAcceptedAlert, {
                proposalId: args.proposalId,
            });
        } catch (err) {
            console.log("[proposals.accept] email schedule skipped:", err);
        }

        return args.proposalId;
    },
});

/** District rejects a proposal. */
export const reject = mutation({
    args: { proposalId: v.id("proposals") },
    handler: async (ctx, args) => {
        const user = await requireDistrictViewer(ctx);
        const proposal = await ctx.db.get(args.proposalId);
        if (!proposal) throw new Error("Not found");

        const need = await ctx.db.get(proposal.needId);
        if (!need) throw new Error("Need not found");
        if (need.postedByUserId !== user._id && user.role !== "superadmin") {
            throw new Error("Forbidden");
        }

        await ctx.db.patch(args.proposalId, { status: "rejected" });

        await ctx.db.insert("notifications", {
            userId: proposal.educatorUserId,
            type: "proposal_rejected",
            title: "Your proposal was not selected",
            body: `${need.orgName} moved in another direction.`,
            read: false,
            actionUrl: `/dashboard/educator/needs`,
            createdAt: Date.now(),
        });

        return args.proposalId;
    },
});

/** Educator withdraws a pending proposal. */
export const withdraw = mutation({
    args: { proposalId: v.id("proposals") },
    handler: async (ctx, args) => {
        const user = await requireEducatorViewer(ctx);
        const proposal = await ctx.db.get(args.proposalId);
        if (!proposal) throw new Error("Not found");
        if (proposal.educatorUserId !== user._id) throw new Error("Forbidden");
        if (proposal.status !== "pending") {
            throw new Error("Only pending proposals can be withdrawn.");
        }
        await ctx.db.patch(args.proposalId, { status: "withdrawn" });
        return args.proposalId;
    },
});
