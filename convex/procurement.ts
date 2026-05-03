import { query, mutation } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";

const procurementStatusValidator = v.union(
    v.literal("new"),
    v.literal("in_review"),
    v.literal("packet_sent"),
    v.literal("waiting_on_district"),
    v.literal("approved"),
    v.literal("closed")
);

async function getViewer(ctx: QueryCtx | MutationCtx) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .first();
}

async function findDistrictForUser(ctx: QueryCtx | MutationCtx, userId: string) {
    const districts = await ctx.db.query("districts").collect();
    return districts.find((district) => district.adminIds.some((adminId) => adminId === userId)) ?? null;
}

function cleanText(value: string, fallback = "") {
    return value.trim().replace(/\s+/g, " ") || fallback;
}

function optionalText(value: string | undefined) {
    const cleaned = value?.trim().replace(/\s+/g, " ");
    return cleaned ? cleaned : undefined;
}

function normalizeEmail(email: string) {
    return email.trim().toLowerCase();
}

function assertEmail(email: string) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Enter a valid email address.");
    }
}

function assertMaterials(materials: string[]) {
    const unique = Array.from(new Set(materials.map((item) => item.trim()).filter(Boolean)));
    if (unique.length === 0) {
        throw new Error("Choose at least one procurement material.");
    }
    return unique.slice(0, 12);
}

function requireSuperadminRole(viewer: Awaited<ReturnType<typeof getViewer>>) {
    if (!viewer || viewer.role !== "superadmin") {
        throw new Error("Forbidden");
    }
    return viewer;
}

export const createRequest = mutation({
    args: {
        requesterName: v.string(),
        requesterEmail: v.string(),
        requesterTitle: v.optional(v.string()),
        districtName: v.string(),
        state: v.string(),
        requestedMaterials: v.array(v.string()),
        deadline: v.optional(v.string()),
        procurementContact: v.optional(v.string()),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const viewer = await getViewer(ctx);
        const district = viewer ? await findDistrictForUser(ctx, viewer._id) : null;
        const requesterEmail = normalizeEmail(args.requesterEmail);
        assertEmail(requesterEmail);

        const requesterName = cleanText(args.requesterName);
        const districtName = cleanText(args.districtName, district?.name ?? "");
        const state = cleanText(args.state, district?.state ?? "").toUpperCase();
        if (requesterName.length < 2) throw new Error("Enter the requester name.");
        if (districtName.length < 2) throw new Error("Enter the district or organization name.");
        if (state.length < 2) throw new Error("Choose the district state.");

        const now = Date.now();
        const requestId = await ctx.db.insert("procurementRequests", {
            ...(district ? { districtId: district._id } : {}),
            ...(viewer ? { requesterUserId: viewer._id } : {}),
            requesterName,
            requesterEmail,
            requesterTitle: optionalText(args.requesterTitle),
            districtName,
            state,
            requestedMaterials: assertMaterials(args.requestedMaterials),
            deadline: optionalText(args.deadline),
            procurementContact: optionalText(args.procurementContact),
            notes: optionalText(args.notes),
            status: "new",
            createdAt: now,
            updatedAt: now,
        });

        if (viewer) {
            await ctx.db.insert("notifications", {
                userId: viewer._id,
                type: "procurement_request",
                title: "Procurement request received",
                body: "K12Gig support will review the DPA/procurement request and follow up with next steps.",
                read: false,
                actionUrl: "/dashboard/district/settings#procurement",
                createdAt: now,
            });
        }

        return requestId;
    },
});

export const listMine = query({
    args: {},
    handler: async (ctx) => {
        const viewer = await getViewer(ctx);
        if (!viewer) return [];

        const district = await findDistrictForUser(ctx, viewer._id);
        const byUser = await ctx.db
            .query("procurementRequests")
            .withIndex("by_requester_user", (q) => q.eq("requesterUserId", viewer._id))
            .collect();

        if (!district) {
            return byUser.sort((a, b) => b.createdAt - a.createdAt);
        }

        const byDistrict = await ctx.db
            .query("procurementRequests")
            .withIndex("by_district", (q) => q.eq("districtId", district._id))
            .collect();

        const rows = new Map(byUser.map((row) => [row._id, row]));
        for (const row of byDistrict) rows.set(row._id, row);
        return Array.from(rows.values()).sort((a, b) => b.createdAt - a.createdAt);
    },
});

export const listAllForAdmin = query({
    args: {},
    handler: async (ctx) => {
        const viewer = await getViewer(ctx);
        requireSuperadminRole(viewer);
        const rows = await ctx.db.query("procurementRequests").collect();
        return rows.sort((a, b) => b.updatedAt - a.updatedAt);
    },
});

export const updateStatus = mutation({
    args: {
        requestId: v.id("procurementRequests"),
        status: procurementStatusValidator,
        internalNotes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const viewer = await getViewer(ctx);
        requireSuperadminRole(viewer);
        const request = await ctx.db.get(args.requestId);
        if (!request) throw new Error("Not found");
        await ctx.db.patch(args.requestId, {
            status: args.status,
            internalNotes: optionalText(args.internalNotes),
            updatedAt: Date.now(),
        });
        return args.requestId;
    },
});
