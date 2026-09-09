import { active, current, engagementAccess, receipt, saveReceipt } from "./lib/releaseDomain";
import { enqueue } from "./lib/outbox";
import type { Doc, Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { authedQuery, authedMutation } from "./lib/customFunctions";
import type { QueryCtx } from "./_generated/server";
import { canAccessEngagement, canAccessEngagementAsParty, canManageNeed, canManageNeedAsParty, getEducatorForUser } from "./lib/auth";
import { createEngagementFromAcceptance } from "./lib/createEngagement";
import { engagementStatusValidator, engagementSummaryValidator } from "./lib/validators";

const engagementDetailValidator = v.object({
    engagement: engagementSummaryValidator,
    needDescription: v.optional(v.string()),
    proposalMessage: v.optional(v.string()),
    counterpartName: v.string(),
    counterpartUserId: v.id("users"),
});

const engagementDetailResultValidator = v.union(
    v.object({ status: v.literal("available"), detail: engagementDetailValidator }),
    v.object({ status: v.literal("unavailable") }),
);

async function toSummary(
    ctx: QueryCtx & { user: Doc<"users"> },
    engagement: import("./_generated/dataModel").Doc<"engagements">
) {
    const educatorUser = await ctx.db.get(engagement.educatorUserId);
    const consultantName = educatorUser
        ? [educatorUser.firstName, educatorUser.lastName].filter(Boolean).join(" ").trim() || educatorUser.email
        : "Consultant";
    return {
        _id: engagement._id,
        revision: engagement.revision ?? 0,
        archivedForViewer: !!engagement.archivedBy?.includes(ctx.user._id),
        partyAccess: await canAccessEngagementAsParty(ctx, ctx.user, engagement),
        needId: engagement.needId,
        proposalId: engagement.proposalId,
        educatorId: engagement.educatorId,
        educatorUserId: engagement.educatorUserId,
        districtId: engagement.districtId,
        buyerUserId: engagement.buyerUserId,
        status: engagement.status,
        title: engagement.title,
        orgName: engagement.orgName,
        areaOfNeed: engagement.areaOfNeed,
        engagementType: engagement.engagementType,
        startDate: engagement.startDate,
        endDate: engagement.endDate,
        duration: engagement.duration,
        agreedRate: engagement.agreedRate,
        agreedRateUnit: engagement.agreedRateUnit,
        compensationNotes: engagement.compensationNotes,
        consultantName,
        createdAt: engagement.createdAt,
        updatedAt: engagement.updatedAt,
    };
}

export const listMine = authedQuery({
    args: { includeArchived: v.optional(v.boolean()) },
    returns: v.array(engagementSummaryValidator),
    handler: async (ctx, args) => {
        const user = ctx.user;
        if (user.role === "educator") {
            const educator = await getEducatorForUser(ctx, user._id);
            if (!educator) return [];
            const rows = await ctx.db
                .query("engagements")
                .withIndex("by_educator", (q) => q.eq("educatorId", educator._id))
                .order("desc")
                .collect();
            return await Promise.all(rows.filter(row => args.includeArchived || !row.archivedBy?.includes(user._id)).map((row) => toSummary(ctx, row)));
        }

        const byBuyer = await ctx.db
            .query("engagements")
            .withIndex("by_buyer", (q) => q.eq("buyerUserId", user._id))
            .order("desc")
            .collect();
        const seen = new Set(byBuyer.map((row) => row._id));
        const extra = [];
        const districtRows = await ctx.db.query("districts").collect();
        const mine = districtRows.find((district) => district.adminIds.includes(user._id));
        if (mine) {
            const byDistrict = await ctx.db
                .query("engagements")
                .withIndex("by_district", (q) => q.eq("districtId", mine._id))
                .order("desc")
                .collect();
            for (const row of byDistrict) {
                if (!seen.has(row._id)) extra.push(row);
            }
        }
        const combined = [...byBuyer, ...extra].sort((a, b) => b.createdAt - a.createdAt);
        return await Promise.all(combined.filter(row => args.includeArchived || !row.archivedBy?.includes(user._id)).map((row) => toSummary(ctx, row)));
    },
});

export const getById = authedQuery({
    args: { engagementId: v.id("engagements") },
    returns: v.union(engagementDetailValidator, v.null()),
    handler: async (ctx, args) => {
        const engagement = await ctx.db.get(args.engagementId);
        if (!engagement) return null;
        if (!(await canAccessEngagement(ctx, ctx.user, engagement))) {
            throw new Error("Forbidden");
        }
        const summary = await toSummary(ctx, engagement);
        const need = await ctx.db.get(engagement.needId);
        const proposal = await ctx.db.get(engagement.proposalId);
        const isConsultant = engagement.educatorUserId === ctx.user._id;
        const counterpart = isConsultant
            ? await ctx.db.get(engagement.buyerUserId)
            : await ctx.db.get(engagement.educatorUserId);
        const counterpartName = counterpart
            ? [counterpart.firstName, counterpart.lastName].filter(Boolean).join(" ").trim() || counterpart.email
            : isConsultant
              ? engagement.orgName
              : summary.consultantName;
        return {
            engagement: summary,
            needDescription: need?.description,
            proposalMessage: proposal?.message,
            counterpartName,
            counterpartUserId: isConsultant ? engagement.buyerUserId : engagement.educatorUserId,
        };
    },
});

/**
 * Detail-page contract that intentionally makes missing and inaccessible records
 * indistinguishable. Unexpected query failures still propagate to the client.
 */
export const getDetailPage = authedQuery({
    args: { engagementId: v.id("engagements") },
    returns: engagementDetailResultValidator,
    handler: async (ctx, args) => {
        const engagement = await ctx.db.get("engagements", args.engagementId);
        if (!engagement || !(await canAccessEngagement(ctx, ctx.user, engagement))) {
            return { status: "unavailable" as const };
        }
        const summary = await toSummary(ctx, engagement);
        const need = await ctx.db.get("needs", engagement.needId);
        const proposal = await ctx.db.get("proposals", engagement.proposalId);
        const isConsultant = engagement.educatorUserId === ctx.user._id;
        const counterpart = isConsultant
            ? await ctx.db.get("users", engagement.buyerUserId)
            : await ctx.db.get("users", engagement.educatorUserId);
        const counterpartName = counterpart
            ? [counterpart.firstName, counterpart.lastName].filter(Boolean).join(" ").trim() || counterpart.email
            : isConsultant
              ? engagement.orgName
              : summary.consultantName;
        return {
            status: "available" as const,
            detail: {
                engagement: summary,
                needDescription: need?.description,
                proposalMessage: proposal?.message,
                counterpartName,
                counterpartUserId: isConsultant ? engagement.buyerUserId : engagement.educatorUserId,
            },
        };
    },
});

export const setStatus = authedMutation({
    args: {
        engagementId: v.id("engagements"),
        status: engagementStatusValidator,
    },
    returns: v.id("engagements"),
    handler: async (ctx, args) => {
        const engagement = await ctx.db.get(args.engagementId);
        if (!engagement) throw new Error("Not found");
        if (!(await canAccessEngagement(ctx, ctx.user, engagement))) {
            throw new Error("Forbidden");
        }
        throw new Error("Use explicit engagement transition with revision and reason; refresh the application");
    },
});

/** Backfill engagements for historically placed needs with an accepted proposal. */
export const backfillFromPlacedNeeds = internalMutation({
    args: {},
    returns: v.object({ created: v.number(), skipped: v.number() }),
    handler: async (ctx) => {
        const placed = await ctx.db
            .query("needs")
            .withIndex("by_status", (q) => q.eq("status", "placed"))
            .collect();
        let created = 0;
        let skipped = 0;
        const now = Date.now();
        for (const need of placed) {
            const proposals = await ctx.db
                .query("proposals")
                .withIndex("by_need", (q) => q.eq("needId", need._id))
                .collect();
            const accepted = proposals.find((proposal) => proposal.status === "accepted");
            if (!accepted) {
                skipped += 1;
                continue;
            }
            const existing = await ctx.db
                .query("engagements")
                .withIndex("by_proposal", (q) => q.eq("proposalId", accepted._id))
                .unique();
            if (existing) {
                skipped += 1;
                continue;
            }
            await createEngagementFromAcceptance(ctx, {
                proposal: accepted,
                need,
                buyerUserId: need.postedByUserId,
                now,
            });
            created += 1;
        }
        return { created, skipped };
    },
});

export const listForNeed = authedQuery({
    args: { needId: v.id("needs") },
    returns: v.array(engagementSummaryValidator),
    handler: async (ctx, args) => {
        const need = await ctx.db.get(args.needId);
        if (!need) return [];
        if (!(await canManageNeed(ctx, ctx.user, need)) && ctx.user.role !== "educator") {
            throw new Error("Forbidden");
        }
        const rows = await ctx.db
            .query("engagements")
            .withIndex("by_need", (q) => q.eq("needId", args.needId))
            .collect();
        if (ctx.user.role === "educator") {
            const mine = rows.filter((row) => row.educatorUserId === ctx.user._id);
            return await Promise.all(mine.map((row) => toSummary(ctx, row)));
        }
        return await Promise.all(rows.map((row) => toSummary(ctx, row)));
    },
});

export const transition = authedMutation({
 args: { engagementId: v.id("engagements"), action: v.union(v.literal("start"), v.literal("complete"), v.literal("cancel"), v.literal("reopen_need"), v.literal("archive")), expectedRevision: v.number(), requestId: v.string(), reason: v.optional(v.string()), acknowledged: v.optional(v.boolean()) },
 handler: async (ctx, args): Promise<{ engagementId: Id<"engagements">; revision: number; status: string }> => {
  const e = await engagementAccess(ctx, args.engagementId); const fp = JSON.stringify(["transition", args]); const prior = await receipt(ctx, args.requestId, fp); if (prior) return prior;
  current(e.revision, args.expectedRevision);
  const need = await ctx.db.get(e.needId); if (!need) throw new Error("Need unavailable");
  if (["start", "complete", "reopen_need"].includes(args.action) && !await canManageNeedAsParty(ctx, ctx.user, need)) throw new Error("Forbidden");
  let status = e.status;
  if (args.action === "start") { if (e.status !== "active") throw new Error("Only active work can start"); status = "in_progress"; }
  if (args.action === "complete") { if (e.status !== "in_progress") throw new Error("Only in-progress work can complete"); status = "completed"; }
  if (args.action === "cancel") { active(e); if (!args.reason?.trim() || !args.acknowledged) throw new Error("Cancellation reason and acknowledgement required; external agreements are not voided"); status = "cancelled"; }
  if (args.action === "reopen_need") {
   if (e.status !== "cancelled" || !args.reason?.trim() || !args.acknowledged) throw new Error("Canceled engagement, reason and explicit correction required");
   const others = await ctx.db.query("engagements").withIndex("by_need", q => q.eq("needId", need._id)).collect();
   if (others.some(x => x.status !== "cancelled")) throw new Error("An active hire already exists");
   if (need.status !== "placed") throw new Error("Need must be placed before correction");
   await ctx.db.patch(need._id, { status: "open" });
  }
  if (args.action === "archive") {
   if (!["completed", "cancelled"].includes(e.status)) throw new Error("Only completed/cancelled work may be archived");
   await ctx.db.patch(e._id, { archivedBy: Array.from(new Set([...(e.archivedBy ?? []), ctx.user._id])) });
  }
  const revision = args.expectedRevision + 1;
  await ctx.db.patch(e._id, { status, revision, updatedAt: Date.now() });
  const eventId = await ctx.db.insert("engagementEvents", { engagementId: e._id, actorUserId: ctx.user._id, action: args.action, note: args.reason?.trim(), createdAt: Date.now() });
  if (args.action !== "archive") await enqueue(ctx, { eventKey: `engagement:${eventId}`, sourceId: e._id, recipientUserId: ctx.user._id === e.educatorUserId ? e.buyerUserId : e.educatorUserId, title: `Engagement update: ${args.action.replaceAll("_", " ")}`, body: `${e.title}. ${args.reason?.trim() ?? "Work status updated."}${args.action === "cancel" ? " External agreements are not voided." : ""}`, actionUrl: `/dashboard/engagements/${e._id}`, type: "engagement_update" });
  const result = { engagementId: e._id, revision, status }; await saveReceipt(ctx, args.requestId, fp, e._id, result); return result;
 },
});
export const activity = authedQuery({ args: { engagementId: v.id("engagements") }, handler: async (ctx, args) => {
 await engagementAccess(ctx, args.engagementId);
 return ctx.db.query("engagementEvents").withIndex("by_engagement", q => q.eq("engagementId", args.engagementId)).collect();
} });
