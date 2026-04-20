import { query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";

const DISTRICT_ROLES = ["district_admin", "district_hr", "superintendent", "superadmin"] as const;

async function getUserByClerkId(ctx: QueryCtx, clerkId: string) {
    return await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
        .first();
}

function startOfMonth(now = Date.now()) {
    const d = new Date(now);
    return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}

function startOfYear(now = Date.now()) {
    return new Date(new Date(now).getFullYear(), 0, 1).getTime();
}

export const districtKpis = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;
        const user = await getUserByClerkId(ctx, identity.subject);
        if (!user || !DISTRICT_ROLES.includes(user.role as (typeof DISTRICT_ROLES)[number])) {
            return null;
        }

        const districts = await ctx.db.query("districts").collect();
        const district = districts.find((d) => d.adminIds.includes(user._id));

        const needs = await ctx.db
            .query("needs")
            .withIndex("by_posted_by", (q) => q.eq("postedByUserId", user._id))
            .collect();

        const orders = district
            ? await ctx.db
                  .query("orders")
                  .withIndex("by_district", (q) => q.eq("districtId", district._id))
                  .collect()
            : [];

        const monthStart = startOfMonth();
        const yearStart = startOfYear();

        const activeOpenings = needs.filter((n) => n.status === "open" || n.status === "interviewing").length;

        const placementsThisMonth = orders.filter(
            (o) =>
                (o.status === "accepted" || o.status === "in_progress" || o.status === "completed") &&
                o.createdAt >= monthStart
        ).length;

        const placedNeeds = needs.filter((n) => n.status === "placed");
        const avgTimeToFillDays =
            placedNeeds.length === 0
                ? null
                : Math.round(
                      placedNeeds.reduce((sum, n) => sum + (Date.now() - n.createdAt), 0) /
                          placedNeeds.length /
                          (1000 * 60 * 60 * 24)
                  );

        const totalSpendYtd = orders
            .filter((o) => o.createdAt >= yearStart)
            .reduce((sum, o) => sum + o.totalAmount, 0);

        return {
            activeOpenings,
            placementsThisMonth,
            avgTimeToFillDays,
            totalSpendYtd,
            needsCount: needs.length,
            ordersCount: orders.length,
        };
    },
});

/** Rows for the district "Talent Pipeline" table. */
export const districtPipeline = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];
        const user = await getUserByClerkId(ctx, identity.subject);
        if (!user || !DISTRICT_ROLES.includes(user.role as (typeof DISTRICT_ROLES)[number])) {
            return [];
        }

        const needs = await ctx.db
            .query("needs")
            .withIndex("by_posted_by", (q) => q.eq("postedByUserId", user._id))
            .order("desc")
            .collect();

        return needs.map((n) => ({
            id: n._id,
            role: n.areaOfNeed,
            spec: n.subCategory ?? n.description?.slice(0, 60) ?? "",
            status: n.status,
            daysOpen: Math.max(0, Math.floor((Date.now() - n.createdAt) / (1000 * 60 * 60 * 24))),
        }));
    },
});

export const educatorKpis = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;
        const user = await getUserByClerkId(ctx, identity.subject);
        if (!user || user.role !== "educator") return null;

        const educator = await ctx.db
            .query("educators")
            .withIndex("by_user_id", (q) => q.eq("userId", user._id))
            .first();
        if (!educator) return null;

        const orders = await ctx.db
            .query("orders")
            .withIndex("by_educator", (q) => q.eq("educatorId", educator._id))
            .collect();

        const yearStart = startOfYear();

        const pipeline = orders.filter(
            (o) => o.status === "pending" || o.status === "accepted" || o.status === "in_progress"
        );
        const pipelineValue = pipeline.reduce((sum, o) => sum + o.educatorPayout, 0);
        const activeCount = pipeline.length;

        const ytdPayout = orders
            .filter((o) => o.status === "completed" && o.createdAt >= yearStart)
            .reduce((sum, o) => sum + o.educatorPayout, 0);
        const completedCount = orders.filter((o) => o.status === "completed").length;

        return {
            pipelineValue,
            activeCount,
            ytdPayout,
            completedCount,
            firstName: user.firstName,
        };
    },
});

/** Rows for the educator "Active Pipeline" list. */
export const educatorPipeline = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];
        const user = await getUserByClerkId(ctx, identity.subject);
        if (!user || user.role !== "educator") return [];

        const educator = await ctx.db
            .query("educators")
            .withIndex("by_user_id", (q) => q.eq("userId", user._id))
            .first();
        if (!educator) return [];

        const orders = await ctx.db
            .query("orders")
            .withIndex("by_educator", (q) => q.eq("educatorId", educator._id))
            .order("desc")
            .collect();

        const rows: Array<{
            id: string;
            title: string;
            district: string;
            status: string;
            amount: number;
            startDate?: string;
        }> = [];
        for (const order of orders.slice(0, 5)) {
            const gig = await ctx.db.get(order.gigId);
            const district = await ctx.db.get(order.districtId);
            rows.push({
                id: order._id,
                title: gig?.title ?? "Engagement",
                district: district?.name ?? "District",
                status: order.status,
                amount: order.educatorPayout,
                startDate: order.startDate,
            });
        }
        return rows;
    },
});
