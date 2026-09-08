import { v } from "convex/values";

export const rateUnitValidator = v.union(
    v.literal("hourly"),
    v.literal("daily"),
    v.literal("fixed")
);

export const engagementStatusValidator = v.union(
    v.literal("active"),
    v.literal("in_progress"),
    v.literal("completed"),
    v.literal("cancelled")
);

export const contractStatusValidator = v.union(
    v.literal("draft"),
    v.literal("sent"),
    v.literal("signed_externally"),
    v.literal("completed")
);

export const notificationPreferencesValidator = v.object({
    emailNewProposals: v.boolean(),
    emailNewMessages: v.boolean(),
    emailPlacementUpdates: v.boolean(),
});

export const engagementSummaryValidator = v.object({
    revision: v.optional(v.number()),
    archivedForViewer: v.optional(v.boolean()),
    partyAccess: v.boolean(),
    _id: v.id("engagements"),
    needId: v.id("needs"),
    proposalId: v.id("proposals"),
    educatorId: v.id("educators"),
    educatorUserId: v.id("users"),
    districtId: v.optional(v.id("districts")),
    buyerUserId: v.id("users"),
    status: engagementStatusValidator,
    title: v.string(),
    orgName: v.string(),
    areaOfNeed: v.string(),
    engagementType: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    duration: v.optional(v.string()),
    agreedRate: v.optional(v.number()),
    agreedRateUnit: v.optional(rateUnitValidator),
    compensationNotes: v.optional(v.string()),
    consultantName: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
});
