import { query, mutation } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
    getNeedPublishIssues,
    normalizeNeedInput,
    type NeedInput,
} from "../src/lib/need-publish-policy";

/** Cap the per-need email/notification fan-out so a single posting can't blast the whole roster. */
const MATCH_FANOUT_CAP = 50;

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

async function findDistrictForUser(ctx: QueryCtx | MutationCtx, userId: Doc<"users">["_id"]) {
    const districts = await ctx.db.query("districts").collect();
    return districts.find((district) => district.adminIds.includes(userId)) ?? null;
}

async function canManageNeed(ctx: QueryCtx | MutationCtx, user: Doc<"users">, need: Doc<"needs">) {
    if (user.role === "superadmin" || need.postedByUserId === user._id) return true;
    if (!need.districtId) return false;
    const district = await ctx.db.get(need.districtId);
    return !!district?.adminIds.includes(user._id);
}

/**
 * Finds active, onboarded educators whose profile matches a freshly-posted need:
 *   - educator.areasOfNeed includes the need's areaOfNeed
 *   - need.gradeLevel is unset, OR the educator covers it (or covers "all")
 * Needs carry no region concept, so region is not part of the match.
 * Returns { educator, user } pairs sorted by profileCompletePct (highest first)
 * and capped at MATCH_FANOUT_CAP so the highest-signal educators win the slots.
 */
async function matchEducatorsForNeed(ctx: MutationCtx, need: Doc<"needs">) {
    const educators = await ctx.db.query("educators").collect();
    const matches: Array<{ educator: Doc<"educators">; user: Doc<"users"> }> = [];

    for (const educator of educators) {
        if (!educator.isActive) continue;
        if (!educator.areasOfNeed.includes(need.areaOfNeed)) continue;
        if (need.gradeLevel) {
            const coversGrade =
                educator.gradeLevelBands.includes(need.gradeLevel) ||
                educator.gradeLevelBands.includes("all");
            if (!coversGrade) continue;
        }
        const user = await ctx.db.get(educator.userId);
        if (!user || !user.onboarded) continue;
        matches.push({ educator, user });
    }

    matches.sort((a, b) => b.educator.profileCompletePct - a.educator.profileCompletePct);
    return matches.slice(0, MATCH_FANOUT_CAP);
}

async function fanOutNeedAlerts(ctx: MutationCtx, need: Doc<"needs">) {
    const matches = await matchEducatorsForNeed(ctx, need);
    for (const { user: educatorUser } of matches) {
        await ctx.db.insert("notifications", {
            userId: educatorUser._id,
            type: "new_need",
            title: `New need at ${need.orgName}`,
            body: "A district posted an open need that matches your profile.",
            read: false,
            actionUrl: "/dashboard/educator/needs",
            createdAt: Date.now(),
        });
        if (educatorUser.email && educatorUser.emailRemindersOptOut !== true) {
            await ctx.scheduler.runAfter(0, internal.emails.sendNewNeedAlert, {
                needId: need._id,
                recipientUserId: educatorUser._id,
            });
        }
    }
}

const publishedNeedStatusValidator = v.union(
    v.literal("open"),
    v.literal("interviewing"),
    v.literal("placed"),
    v.literal("closed")
);

const needInputArgs = {
    orgName: v.string(),
    areaOfNeed: v.string(),
    subCategory: v.optional(v.string()),
    gradeLevel: v.optional(v.string()),
    engagementType: v.optional(v.string()),
    startDate: v.optional(v.string()),
    duration: v.optional(v.string()),
    compensationRange: v.optional(v.string()),
    description: v.optional(v.string()),
};

function assertDraftMinimum(input: NeedInput) {
    const normalized = normalizeNeedInput(input);
    if (!normalized.orgName) throw new Error("Organization name is required to save a draft.");
    if (!normalized.areaOfNeed) throw new Error("Support type is required to save a draft.");
    return normalized;
}

function assertReadyToPublish(input: NeedInput) {
    const normalized = normalizeNeedInput(input);
    const issues = getNeedPublishIssues(normalized);
    if (issues.length > 0) {
        throw new Error(`Need is not ready to publish. ${issues.map((issue) => issue.message).join(" ")}`);
    }
    return normalized;
}

/** Create or update an owned draft without exposing it to educators. */
export const saveDraft = mutation({
    args: {
        needId: v.optional(v.id("needs")),
        ...needInputArgs,
    },
    handler: async (ctx, args) => {
        const user = await requireDistrictViewer(ctx);
        const input = assertDraftMinimum(args);
        const now = Date.now();

        if (args.needId) {
            const existing = await ctx.db.get(args.needId);
            if (!existing) throw new Error("Draft not found.");
            if (!(await canManageNeed(ctx, user, existing))) throw new Error("Forbidden");
            if (existing.status !== "draft") {
                throw new Error("Only draft needs can be edited from the post flow.");
            }
            await ctx.db.patch(args.needId, { ...input, updatedAt: now });
            return args.needId;
        }

        const district = await findDistrictForUser(ctx, user._id);
        return await ctx.db.insert("needs", {
            districtId: district?._id,
            postedByUserId: user._id,
            ...input,
            status: "draft",
            createdAt: now,
            updatedAt: now,
        });
    },
});

/** Publish an owned, complete draft and only then alert matching educators. */
export const publishDraft = mutation({
    args: { needId: v.id("needs") },
    handler: async (ctx, args) => {
        const user = await requireDistrictViewer(ctx);
        const draft = await ctx.db.get(args.needId);
        if (!draft) throw new Error("Draft not found.");
        if (!(await canManageNeed(ctx, user, draft))) throw new Error("Forbidden");
        if (draft.status !== "draft") throw new Error("This need has already been published.");

        const input = assertReadyToPublish(draft);
        await ctx.db.patch(args.needId, {
            ...input,
            status: "open",
            updatedAt: Date.now(),
        });

        try {
            const published = await ctx.db.get(args.needId);
            if (published) await fanOutNeedAlerts(ctx, published);
        } catch (err) {
            console.log("[needs.publishDraft] RFP alert fan-out skipped:", err);
        }

        return args.needId;
    },
});

/** District posts a new open need. */
export const create = mutation({
    args: needInputArgs,
    handler: async (ctx, args) => {
        const user = await requireDistrictViewer(ctx);
        const input = assertReadyToPublish(args);

        // Link to the district this user administers even when the district has
        // multiple admins. Convex array equality only matched single-admin rows.
        const district = await findDistrictForUser(ctx, user._id);
        const districtId = district?._id;

        const needId = await ctx.db.insert("needs", {
            districtId,
            postedByUserId: user._id,
            ...input,
            status: "open",
            createdAt: Date.now(),
        });

        // RFP alerts: notify matching educators. Matching + notification inserts
        // happen here (fast, transactional); the Resend calls go through an
        // internalAction, one scheduled send per matched educator.
        try {
            const need = await ctx.db.get(needId);
            if (need) await fanOutNeedAlerts(ctx, need);
        } catch (err) {
            console.log("[needs.create] RFP alert fan-out skipped:", err);
        }

        return needId;
    },
});

/** District workspace: all needs posted by the current user (or their district). */
export const listMine = query({
    args: {},
    handler: async (ctx) => {
        const user = await requireDistrictViewer(ctx);
        const district = await findDistrictForUser(ctx, user._id);
        const byDistrict = district
            ? await ctx.db
                  .query("needs")
                  .withIndex("by_district", (q) => q.eq("districtId", district._id))
                  .order("desc")
                  .collect()
            : [];
        const byUser = await ctx.db
            .query("needs")
            .withIndex("by_posted_by", (q) => q.eq("postedByUserId", user._id))
            .order("desc")
            .collect();
        return Array.from(new Map([...byDistrict, ...byUser].map((need) => [need._id, need])).values()).sort(
            (a, b) => b.createdAt - a.createdAt
        );
    },
});

/**
 * District workspace board: the same needs as `listMine`, each augmented with
 * `proposalCount` (all proposals on the need) and `pendingCount` (still-pending
 * proposals) so the Gig Board can surface "N proposals · M new" per card.
 */
export const listMineWithCounts = query({
    args: {},
    handler: async (ctx) => {
        const user = await requireDistrictViewer(ctx);
        const district = await findDistrictForUser(ctx, user._id);
        const byDistrict = district
            ? await ctx.db
                  .query("needs")
                  .withIndex("by_district", (q) => q.eq("districtId", district._id))
                  .order("desc")
                  .collect()
            : [];
        const byUser = await ctx.db
            .query("needs")
            .withIndex("by_posted_by", (q) => q.eq("postedByUserId", user._id))
            .order("desc")
            .collect();
        const needs = Array.from(
            new Map([...byDistrict, ...byUser].map((need) => [need._id, need])).values()
        ).sort((a, b) => b.createdAt - a.createdAt);

        const withCounts = [];
        for (const need of needs) {
            const proposals = await ctx.db
                .query("proposals")
                .withIndex("by_need", (q) => q.eq("needId", need._id))
                .collect();
            withCounts.push({
                ...need,
                proposalCount: proposals.length,
                pendingCount: proposals.filter((p) => p.status === "pending").length,
            });
        }
        return withCounts;
    },
});

/** Lookup a single need (district only). */
export const getById = query({
    args: { needId: v.id("needs") },
    handler: async (ctx, args) => {
        const user = await requireDistrictViewer(ctx);
        const need = await ctx.db.get(args.needId);
        if (!need) return null;
        if (!(await canManageNeed(ctx, user, need))) throw new Error("Forbidden");
        return need;
    },
});

/**
 * Educator-facing browse: open + interviewing needs across all districts.
 * Ordered by createdAt desc so newest roles surface first.
 */
export const listOpenForEducators = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");
        const user = await getUserByClerkId(ctx, identity.subject);
        if (!user || user.role !== "educator") throw new Error("Forbidden");

        const needs = await ctx.db.query("needs").order("desc").collect();
        return needs.filter((n) => n.status === "open" || n.status === "interviewing");
    },
});

/** Move a need between statuses (e.g. open → interviewing → placed). */
export const updateStatus = mutation({
    args: {
        needId: v.id("needs"),
        status: publishedNeedStatusValidator,
    },
    handler: async (ctx, args) => {
        const user = await requireDistrictViewer(ctx);
        const need = await ctx.db.get(args.needId);
        if (!need) throw new Error("Not found");
        if (!(await canManageNeed(ctx, user, need))) {
            throw new Error("Forbidden");
        }
        await ctx.db.patch(args.needId, { status: args.status });
        return args.needId;
    },
});
