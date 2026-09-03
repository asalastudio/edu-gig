import { query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserOrNull, isDistrictRole, getEducatorForUser, findDistrictForUser } from "./lib/auth";
import { engagementStatusValidator } from "./lib/validators";
import { startOfMonth } from "./lib/time";

const districtKpiValidator = v.object({
    activeOpenings: v.number(),
    placementsThisMonth: v.number(),
    needsCount: v.number(),
    engagementCount: v.number(),
});

const recentPlacementValidator = v.object({
    id: v.id("engagements"),
    title: v.string(),
    consultantName: v.string(),
    orgName: v.string(),
    status: engagementStatusValidator,
    createdAt: v.number(),
});

const pipelineRowValidator = v.object({
    id: v.id("needs"),
    role: v.string(),
    spec: v.string(),
    status: v.string(),
    daysOpen: v.number(),
    candidates: v.number(),
});

const educatorKpiValidator = v.object({
    activeCount: v.number(),
    completedCount: v.number(),
    pendingProposals: v.number(),
    firstName: v.string(),
});

const educatorPipelineRowValidator = v.object({
    id: v.id("engagements"),
    title: v.string(),
    district: v.string(),
    status: v.string(),
    amount: v.optional(v.number()),
    startDate: v.optional(v.string()),
});

export const districtKpis = query({
    args: { now: v.number() },
    returns: v.union(districtKpiValidator, v.null()),
    handler: async (ctx, args) => {
        const user = await getCurrentUserOrNull(ctx);
        if (!user || !isDistrictRole(user.role)) return null;

        const district = await findDistrictForUser(ctx, user._id);
        const byDistrict = district
            ? await ctx.db
                  .query("needs")
                  .withIndex("by_district", (q) => q.eq("districtId", district._id))
                  .collect()
            : [];
        const byUser = await ctx.db
            .query("needs")
            .withIndex("by_posted_by", (q) => q.eq("postedByUserId", user._id))
            .collect();
        const needs = Array.from(new Map([...byDistrict, ...byUser].map((need) => [need._id, need])).values());

        const engagements = district
            ? await ctx.db
                  .query("engagements")
                  .withIndex("by_district", (q) => q.eq("districtId", district._id))
                  .collect()
            : await ctx.db
                  .query("engagements")
                  .withIndex("by_buyer", (q) => q.eq("buyerUserId", user._id))
                  .collect();

        const monthStart = startOfMonth(args.now);
        const activeOpenings = needs.filter((n) => n.status === "open" || n.status === "interviewing").length;
        const placementsThisMonth = engagements.filter(
            (engagement) =>
                engagement.status !== "cancelled" && engagement.createdAt >= monthStart
        ).length;

        return {
            activeOpenings,
            placementsThisMonth,
            needsCount: needs.length,
            engagementCount: engagements.length,
        };
    },
});

export const districtRecentPlacements = query({
    args: {},
    returns: v.array(recentPlacementValidator),
    handler: async (ctx) => {
        const user = await getCurrentUserOrNull(ctx);
        if (!user || !isDistrictRole(user.role)) return [];
        const district = await findDistrictForUser(ctx, user._id);
        const rows = district
            ? await ctx.db
                  .query("engagements")
                  .withIndex("by_district", (q) => q.eq("districtId", district._id))
                  .order("desc")
                  .take(5)
            : await ctx.db
                  .query("engagements")
                  .withIndex("by_buyer", (q) => q.eq("buyerUserId", user._id))
                  .order("desc")
                  .take(5);
        const out = [];
        for (const engagement of rows) {
            const educatorUser = await ctx.db.get(engagement.educatorUserId);
            out.push({
                id: engagement._id,
                title: engagement.title,
                consultantName: educatorUser
                    ? [educatorUser.firstName, educatorUser.lastName].filter(Boolean).join(" ").trim() || educatorUser.email
                    : "Consultant",
                orgName: engagement.orgName,
                status: engagement.status,
                createdAt: engagement.createdAt,
            });
        }
        return out;
    },
});

export const districtPipeline = query({
    args: { now: v.number() },
    returns: v.array(pipelineRowValidator),
    handler: async (ctx, args) => {
        const user = await getCurrentUserOrNull(ctx);
        if (!user || !isDistrictRole(user.role)) return [];

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
        const needs = Array.from(new Map([...byDistrict, ...byUser].map((need) => [need._id, need])).values()).sort(
            (a, b) => b.createdAt - a.createdAt
        );

        const rows = [];
        for (const n of needs) {
            const proposals = await ctx.db
                .query("proposals")
                .withIndex("by_need", (q) => q.eq("needId", n._id))
                .collect();
            rows.push({
                id: n._id,
                role: n.areaOfNeed,
                spec: n.subCategory ?? n.description?.slice(0, 60) ?? "",
                status: n.status,
                daysOpen: Math.max(0, Math.floor((args.now - n.createdAt) / (1000 * 60 * 60 * 24))),
                candidates: proposals.filter((proposal) => proposal.status !== "withdrawn").length,
            });
        }
        return rows;
    },
});

export const educatorKpis = query({
    args: {},
    returns: v.union(educatorKpiValidator, v.null()),
    handler: async (ctx) => {
        const user = await getCurrentUserOrNull(ctx);
        if (!user || user.role !== "educator") return null;
        const educator = await getEducatorForUser(ctx, user._id);
        if (!educator) return null;

        const engagements = await ctx.db
            .query("engagements")
            .withIndex("by_educator", (q) => q.eq("educatorId", educator._id))
            .collect();
        const proposals = await ctx.db
            .query("proposals")
            .withIndex("by_educator", (q) => q.eq("educatorId", educator._id))
            .collect();

        return {
            activeCount: engagements.filter(
                (engagement) => engagement.status === "active" || engagement.status === "in_progress"
            ).length,
            completedCount: engagements.filter((engagement) => engagement.status === "completed").length,
            pendingProposals: proposals.filter((proposal) => proposal.status === "pending").length,
            firstName: user.firstName,
        };
    },
});

export const educatorPipeline = query({
    args: {},
    returns: v.array(educatorPipelineRowValidator),
    handler: async (ctx) => {
        const user = await getCurrentUserOrNull(ctx);
        if (!user || user.role !== "educator") return [];
        const educator = await getEducatorForUser(ctx, user._id);
        if (!educator) return [];

        const engagements = await ctx.db
            .query("engagements")
            .withIndex("by_educator", (q) => q.eq("educatorId", educator._id))
            .order("desc")
            .take(8);

        return engagements.map((engagement) => ({
            id: engagement._id,
            title: engagement.title,
            district: engagement.orgName,
            status: engagement.status,
            amount: engagement.agreedRate,
            startDate: engagement.startDate,
        }));
    },
});
