import { getAppIdentity } from "./lib/staging";
import { query, mutation } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { acceptsEducatorProposals } from "../src/lib/need-status";
import { createEngagementFromAcceptance } from "./lib/createEngagement";
import { assertProposalAcceptable, assertProposalRejectable } from "./lib/proposalAcceptance";

const DISTRICT_ROLES = ["district_admin", "district_hr", "superintendent", "superadmin"] as const;

async function getUserByClerkId(ctx: QueryCtx | MutationCtx, clerkId: string) {
    return await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
        .first();
}

async function requireDistrictViewer(ctx: QueryCtx | MutationCtx) {
    const identity = await getAppIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");
    const user = await getUserByClerkId(ctx, identity.subject);
    if (!user || !DISTRICT_ROLES.includes(user.role as (typeof DISTRICT_ROLES)[number])) {
        throw new Error("Forbidden");
    }
    return user;
}

async function requireEducatorViewer(ctx: QueryCtx | MutationCtx) {
    const identity = await getAppIdentity(ctx);
    if (!identity) throw new Error("Unauthorized");
    const user = await getUserByClerkId(ctx, identity.subject);
    if (!user || user.role !== "educator") throw new Error("Forbidden");
    return user;
}

async function canManageNeed(ctx: QueryCtx | MutationCtx, user: Doc<"users">, need: Doc<"needs">) {
    if (user.role === "superadmin" || need.postedByUserId === user._id) return true;
    if (!need.districtId) return false;
    const district = await ctx.db.get(need.districtId);
    return !!district?.adminIds.includes(user._id);
}

const proposedRateUnitValidator = v.union(
    v.literal("hourly"),
    v.literal("daily"),
    v.literal("fixed")
);

const proposalDocValidator = v.object({
    _id: v.id("proposals"),
    _creationTime: v.number(),
    needId: v.id("needs"),
    educatorId: v.id("educators"),
    educatorUserId: v.id("users"),
    message: v.string(),
    attachmentStorageId: v.optional(v.id("_storage")),
    attachmentName: v.optional(v.string()),
    proposedRate: v.optional(v.number()),
    proposedRateUnit: v.optional(proposedRateUnitValidator),
    status: v.union(
        v.literal("pending"),
        v.literal("accepted"),
        v.literal("rejected"),
        v.literal("withdrawn")
    ),
    createdAt: v.number(),
});

/**
 * Educator submits a proposal on a district-posted need.
 * Rejects duplicate pending proposals from the same educator on the same need.
 * Notifies the district user that posted the need.
 */
/** Short-lived upload URL for a proposal attachment (resume / proposal doc). Educator only. */
export const generateAttachmentUploadUrl = mutation({
    args: {},
    returns: v.string(),
    handler: async (ctx) => {
        await requireEducatorViewer(ctx);
        return await ctx.storage.generateUploadUrl();
    },
});

export const submit = mutation({
    args: {
        needId: v.id("needs"),
        message: v.string(),
        attachmentStorageId: v.optional(v.id("_storage")),
        attachmentName: v.optional(v.string()),
        proposedRate: v.optional(v.number()),
        proposedRateUnit: v.optional(proposedRateUnitValidator),
    },
    returns: v.id("proposals"),
    handler: async (ctx, args) => {
        const user = await requireEducatorViewer(ctx);

        const educator = await ctx.db
            .query("educators")
            .withIndex("by_user_id", (q) => q.eq("userId", user._id))
            .first();
        if (!educator) throw new Error("No educator profile");
        if (!args.attachmentStorageId && !educator.resumeStorageId) {
            throw new Error("Attach a resume/CV or upload one on your profile before submitting a proposal.");
        }

        const need = await ctx.db.get(args.needId);
        if (!need) throw new Error("Not found");
        if (!acceptsEducatorProposals(need.status)) {
            throw new Error("This need is not accepting proposals.");
        }

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
            attachmentStorageId: args.attachmentStorageId ?? educator.resumeStorageId,
            attachmentName: args.attachmentName?.trim() || educator.resumeFileName,
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
    returns: v.array(proposalDocValidator),
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
    returns: v.array(v.object({
        proposal: proposalDocValidator,
        user: v.union(
            v.object({
                firstName: v.string(),
                lastName: v.string(),
                avatarUrl: v.optional(v.string()),
            }),
            v.null()
        ),
    })),
    handler: async (ctx, args) => {
        const user = await requireDistrictViewer(ctx);
        const need = await ctx.db.get(args.needId);
        if (!need) throw new Error("Not found");
        if (!(await canManageNeed(ctx, user, need))) {
            throw new Error("Forbidden");
        }

        const proposals = await ctx.db
            .query("proposals")
            .withIndex("by_need", (q) => q.eq("needId", args.needId))
            .order("desc")
            .collect();

        const rows: Array<{
            proposal: Doc<"proposals">;
            user: { firstName: string; lastName: string; avatarUrl?: string } | null;
        }> = [];
        for (const proposal of proposals) {
            const educatorUser = await ctx.db.get(proposal.educatorUserId);
            rows.push({
                proposal,
                user: educatorUser
                    ? {
                          firstName: educatorUser.firstName,
                          lastName: educatorUser.lastName,
                          avatarUrl: educatorUser.avatarUrl,
                      }
                    : null,
            });
        }
        return rows;
    },
});

/**
 * Signed URL for a proposal's attachment. Visible to the educator who submitted
 * it and to the district that can manage the need. Returns null otherwise.
 */
export const getAttachmentUrl = query({
    args: { proposalId: v.id("proposals") },
    returns: v.union(v.string(), v.null()),
    handler: async (ctx, args) => {
        const identity = await getAppIdentity(ctx);
        if (!identity) return null;
        const user = await getUserByClerkId(ctx, identity.subject);
        if (!user) return null;

        const proposal = await ctx.db.get(args.proposalId);
        if (!proposal || !proposal.attachmentStorageId) return null;

        const isOwner = proposal.educatorUserId === user._id;
        let allowed = isOwner;
        if (!allowed) {
            const need = await ctx.db.get(proposal.needId);
            allowed = !!need && (await canManageNeed(ctx, user, need));
        }
        if (!allowed) return null;

        return await ctx.storage.getUrl(proposal.attachmentStorageId);
    },
});

/**
 * District accepts a proposal:
 * - requires the proposal to be pending and the need to be open/interviewing
 * - requires that no other proposal on the need is accepted and no
 *   engagement exists for the need (one acceptance, one engagement per need)
 * - patches the proposal to "accepted"
 * - patches the need to "placed"
 * - rejects all other pending proposals on this need
 * - notifies the educator
 *
 * All reads and writes happen inside one Convex mutation, so the invariant
 * checks and the state change are transactional.
 */
export const accept = mutation({
    args: { proposalId: v.id("proposals") },
    returns: v.object({
        proposalId: v.id("proposals"),
        engagementId: v.id("engagements"),
    }),
    handler: async (ctx, args) => {
        const user = await requireDistrictViewer(ctx);
        const proposal = await ctx.db.get(args.proposalId);
        if (!proposal) throw new Error("Not found");

        const need = await ctx.db.get(proposal.needId);
        if (!need) throw new Error("Need not found");
        if (!(await canManageNeed(ctx, user, need))) {
            throw new Error("Forbidden");
        }

        const siblings = await ctx.db
            .query("proposals")
            .withIndex("by_need", (q) => q.eq("needId", proposal.needId))
            .collect();
        const existingEngagement = await ctx.db
            .query("engagements")
            .withIndex("by_need", (q) => q.eq("needId", proposal.needId))
            .first();
        assertProposalAcceptable({ proposal, need, siblings, existingEngagement });

        await ctx.db.patch(args.proposalId, { status: "accepted" });
        await ctx.db.patch(proposal.needId, { status: "placed" });

        for (const sibling of siblings) {
            if (sibling._id !== args.proposalId && sibling.status === "pending") {
                await ctx.db.patch(sibling._id, { status: "rejected" });
            }
        }

        const accepted = await ctx.db.get(args.proposalId);
        if (!accepted) throw new Error("Not found");
        const engagementId = await createEngagementFromAcceptance(ctx, {
            proposal: accepted,
            need: { ...need, status: "placed" },
            buyerUserId: user._id,
            now: Date.now(),
        });

        await ctx.db.insert("notifications", {
            userId: proposal.educatorUserId,
            type: "proposal_accepted",
            title: "Your proposal was accepted",
            body: `${need.orgName} accepted your proposal. Open My Gigs to coordinate the engagement.`,
            read: false,
            actionUrl: `/dashboard/engagements/${engagementId}`,
            createdAt: Date.now(),
        });

        try {
            await ctx.scheduler.runAfter(0, internal.emails.sendProposalAcceptedAlert, {
                proposalId: args.proposalId,
            });
        } catch (err) {
            console.log("[proposals.accept] email schedule skipped:", err);
        }

        return { proposalId: args.proposalId, engagementId };
    },
});

/** District rejects a proposal. */
export const reject = mutation({
    args: { proposalId: v.id("proposals") },
    returns: v.id("proposals"),
    handler: async (ctx, args) => {
        const user = await requireDistrictViewer(ctx);
        const proposal = await ctx.db.get(args.proposalId);
        if (!proposal) throw new Error("Not found");

        const need = await ctx.db.get(proposal.needId);
        if (!need) throw new Error("Need not found");
        if (!(await canManageNeed(ctx, user, need))) {
            throw new Error("Forbidden");
        }
        assertProposalRejectable(proposal);

        await ctx.db.patch(args.proposalId, { status: "rejected" });

        await ctx.db.insert("notifications", {
            userId: proposal.educatorUserId,
            type: "proposal_rejected",
            title: "Your proposal was not selected",
            body: `${need.orgName} moved in another direction.`,
            read: false,
            actionUrl: `/dashboard/board`,
            createdAt: Date.now(),
        });

        return args.proposalId;
    },
});

/** Educator withdraws a pending proposal. */
export const withdraw = mutation({
    args: { proposalId: v.id("proposals") },
    returns: v.id("proposals"),
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
