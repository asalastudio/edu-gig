import type { MutationCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import { getAreaOfNeedLabel } from "../../src/lib/taxonomy";

export async function findEngagementByProposal(
    ctx: MutationCtx,
    proposalId: Id<"proposals">
) {
    return await ctx.db
        .query("engagements")
        .withIndex("by_proposal", (q) => q.eq("proposalId", proposalId))
        .unique();
}

/** Display title for an engagement, e.g. "keynote" -> "Keynote Speaking". */
export function titleFromNeed(need: Pick<Doc<"needs">, "areaOfNeed">): string {
    return getAreaOfNeedLabel(need.areaOfNeed);
}

export function engagementInsertFields(args: {
    proposal: Pick<
        Doc<"proposals">,
        "_id" | "educatorId" | "educatorUserId" | "proposedRate" | "proposedRateUnit"
    >;
    need: Pick<
        Doc<"needs">,
        "_id" | "districtId" | "orgName" | "areaOfNeed" | "engagementType" | "startDate" | "duration" | "compensationRange"
    >;
    buyerUserId: Id<"users">;
    now: number;
}) {
    return {
        needId: args.need._id,
        proposalId: args.proposal._id,
        educatorId: args.proposal.educatorId,
        educatorUserId: args.proposal.educatorUserId,
        districtId: args.need.districtId,
        buyerUserId: args.buyerUserId,
        status: "active" as const,
        title: titleFromNeed(args.need),
        orgName: args.need.orgName,
        areaOfNeed: args.need.areaOfNeed,
        engagementType: args.need.engagementType,
        startDate: args.need.startDate,
        duration: args.need.duration,
        agreedRate: args.proposal.proposedRate,
        agreedRateUnit: args.proposal.proposedRateUnit,
        compensationNotes: args.need.compensationRange,
        createdAt: args.now,
        updatedAt: args.now,
    };
}

/**
 * Idempotently create an engagement for an accepted proposal.
 * Safe to call from accept and from historical backfill.
 */
export async function createEngagementFromAcceptance(
    ctx: MutationCtx,
    args: {
        proposal: Doc<"proposals">;
        need: Doc<"needs">;
        buyerUserId: Id<"users">;
        now: number;
    }
): Promise<Id<"engagements">> {
    const existing = await findEngagementByProposal(ctx, args.proposal._id);
    if (existing) return existing._id;

    return await ctx.db.insert("engagements", engagementInsertFields(args));
}
