import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { authedQuery, authedMutation } from "./lib/customFunctions";
import { canAccessEngagement, canManageNeed, getEducatorForUser } from "./lib/auth";
import { createEngagementFromAcceptance } from "./lib/createEngagement";
import { engagementStatusValidator, engagementSummaryValidator } from "./lib/validators";

const engagementDetailValidator = v.object({
    engagement: engagementSummaryValidator,
    needDescription: v.optional(v.string()),
    proposalMessage: v.optional(v.string()),
    counterpartName: v.string(),
    counterpartUserId: v.id("users"),
});

async function toSummary(
    ctx: { db: import("./_generated/server").QueryCtx["db"] },
    engagement: import("./_generated/dataModel").Doc<"engagements">
) {
    const educatorUser = await ctx.db.get(engagement.educatorUserId);
    const consultantName = educatorUser
        ? [educatorUser.firstName, educatorUser.lastName].filter(Boolean).join(" ").trim() || educatorUser.email
        : "Consultant";
    return {
        _id: engagement._id,
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
    args: {},
    returns: v.array(engagementSummaryValidator),
    handler: async (ctx) => {
        const user = ctx.user;
        if (user.role === "educator") {
            const educator = await getEducatorForUser(ctx, user._id);
            if (!educator) return [];
            const rows = await ctx.db
                .query("engagements")
                .withIndex("by_educator", (q) => q.eq("educatorId", educator._id))
                .order("desc")
                .collect();
            return await Promise.all(rows.map((row) => toSummary(ctx, row)));
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
        return await Promise.all(combined.map((row) => toSummary(ctx, row)));
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
        await ctx.db.patch(args.engagementId, {
            status: args.status,
            updatedAt: Date.now(),
        });
        return args.engagementId;
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
