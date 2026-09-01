import { v } from "convex/values";
import { authedMutation, authedQuery } from "./lib/customFunctions";
import { canAccessEngagement } from "./lib/auth";
import { contractStatusValidator } from "./lib/validators";

const contractRowValidator = v.object({
    _id: v.id("contracts"),
    engagementId: v.id("engagements"),
    uploadedByUserId: v.id("users"),
    title: v.string(),
    notes: v.optional(v.string()),
    status: contractStatusValidator,
    fileName: v.optional(v.string()),
    hasFile: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
    uploaderName: v.string(),
});

const contractEventValidator = v.object({
    _id: v.id("contractEvents"),
    action: v.string(),
    note: v.optional(v.string()),
    createdAt: v.number(),
    actorName: v.string(),
});

async function requireEngagementAccess(
    ctx: Parameters<typeof canAccessEngagement>[0] & { user: Parameters<typeof canAccessEngagement>[1]; db: Parameters<typeof canAccessEngagement>[0]["db"] },
    engagementId: Parameters<typeof canAccessEngagement>[2]["_id"]
) {
    const engagement = await ctx.db.get(engagementId);
    if (!engagement) throw new Error("Not found");
    if (!(await canAccessEngagement(ctx, ctx.user, engagement))) {
        throw new Error("Forbidden");
    }
    return engagement;
}

export const generateUploadUrl = authedMutation({
    args: { engagementId: v.id("engagements") },
    returns: v.string(),
    handler: async (ctx, args) => {
        await requireEngagementAccess(ctx, args.engagementId);
        return await ctx.storage.generateUploadUrl();
    },
});

export const create = authedMutation({
    args: {
        engagementId: v.id("engagements"),
        title: v.string(),
        notes: v.optional(v.string()),
        storageId: v.optional(v.id("_storage")),
        fileName: v.optional(v.string()),
        status: v.optional(contractStatusValidator),
    },
    returns: v.id("contracts"),
    handler: async (ctx, args) => {
        await requireEngagementAccess(ctx, args.engagementId);
        const title = args.title.trim();
        if (!title) throw new Error("Title is required");
        const now = Date.now();
        const contractId = await ctx.db.insert("contracts", {
            engagementId: args.engagementId,
            uploadedByUserId: ctx.user._id,
            title,
            notes: args.notes?.trim() || undefined,
            status: args.status ?? "draft",
            storageId: args.storageId,
            fileName: args.fileName?.trim() || undefined,
            createdAt: now,
            updatedAt: now,
        });
        await ctx.db.insert("contractEvents", {
            contractId,
            actorUserId: ctx.user._id,
            action: "created",
            note: args.fileName ? `Uploaded ${args.fileName}` : undefined,
            createdAt: now,
        });
        return contractId;
    },
});

export const updateStatus = authedMutation({
    args: {
        contractId: v.id("contracts"),
        status: contractStatusValidator,
        note: v.optional(v.string()),
    },
    returns: v.id("contracts"),
    handler: async (ctx, args) => {
        const contract = await ctx.db.get(args.contractId);
        if (!contract) throw new Error("Not found");
        await requireEngagementAccess(ctx, contract.engagementId);
        const now = Date.now();
        await ctx.db.patch(args.contractId, { status: args.status, updatedAt: now });
        await ctx.db.insert("contractEvents", {
            contractId: args.contractId,
            actorUserId: ctx.user._id,
            action: `status:${args.status}`,
            note: args.note?.trim() || undefined,
            createdAt: now,
        });
        return args.contractId;
    },
});

export const listForEngagement = authedQuery({
    args: { engagementId: v.id("engagements") },
    returns: v.array(contractRowValidator),
    handler: async (ctx, args) => {
        await requireEngagementAccess(ctx, args.engagementId);
        const rows = await ctx.db
            .query("contracts")
            .withIndex("by_engagement", (q) => q.eq("engagementId", args.engagementId))
            .order("desc")
            .collect();
        const out = [];
        for (const row of rows) {
            const uploader = await ctx.db.get(row.uploadedByUserId);
            out.push({
                _id: row._id,
                engagementId: row.engagementId,
                uploadedByUserId: row.uploadedByUserId,
                title: row.title,
                notes: row.notes,
                status: row.status,
                fileName: row.fileName,
                hasFile: !!row.storageId,
                createdAt: row.createdAt,
                updatedAt: row.updatedAt,
                uploaderName: uploader
                    ? [uploader.firstName, uploader.lastName].filter(Boolean).join(" ").trim() || uploader.email
                    : "Unknown",
            });
        }
        return out;
    },
});

export const listMine = authedQuery({
    args: {},
    returns: v.array(v.object({
        contract: contractRowValidator,
        engagementTitle: v.string(),
        orgName: v.string(),
        consultantName: v.string(),
        engagementId: v.id("engagements"),
        counterpartUserId: v.id("users"),
    })),
    handler: async (ctx) => {
        const user = ctx.user;
        let engagements: Array<import("./_generated/dataModel").Doc<"engagements">> = [];
        if (user.role === "educator") {
            const educator = await ctx.db
                .query("educators")
                .withIndex("by_user_id", (q) => q.eq("userId", user._id))
                .first();
            if (educator) {
                engagements = await ctx.db
                    .query("engagements")
                    .withIndex("by_educator", (q) => q.eq("educatorId", educator._id))
                    .collect();
            }
        } else {
            const byBuyer = await ctx.db
                .query("engagements")
                .withIndex("by_buyer", (q) => q.eq("buyerUserId", user._id))
                .collect();
            const seen = new Set(byBuyer.map((row) => row._id));
            engagements = [...byBuyer];
            const districts = await ctx.db.query("districts").collect();
            const mine = districts.find((district) => district.adminIds.includes(user._id));
            if (mine) {
                const byDistrict = await ctx.db
                    .query("engagements")
                    .withIndex("by_district", (q) => q.eq("districtId", mine._id))
                    .collect();
                for (const row of byDistrict) {
                    if (!seen.has(row._id)) engagements.push(row);
                }
            }
        }
        const items = [];
        for (const engagement of engagements) {
            const contracts = await ctx.db
                .query("contracts")
                .withIndex("by_engagement", (q) => q.eq("engagementId", engagement._id))
                .order("desc")
                .collect();
            const educatorUser = await ctx.db.get(engagement.educatorUserId);
            const consultantName = educatorUser
                ? [educatorUser.firstName, educatorUser.lastName].filter(Boolean).join(" ").trim() || educatorUser.email
                : "Consultant";
            for (const row of contracts) {
                const uploader = await ctx.db.get(row.uploadedByUserId);
                items.push({
                    contract: {
                        _id: row._id,
                        engagementId: row.engagementId,
                        uploadedByUserId: row.uploadedByUserId,
                        title: row.title,
                        notes: row.notes,
                        status: row.status,
                        fileName: row.fileName,
                        hasFile: !!row.storageId,
                        createdAt: row.createdAt,
                        updatedAt: row.updatedAt,
                        uploaderName: uploader
                            ? [uploader.firstName, uploader.lastName].filter(Boolean).join(" ").trim() || uploader.email
                            : "Unknown",
                    },
                    engagementTitle: engagement.title,
                    orgName: engagement.orgName,
                    consultantName,
                    engagementId: engagement._id,
                    counterpartUserId:
                        engagement.educatorUserId === ctx.user._id
                            ? engagement.buyerUserId
                            : engagement.educatorUserId,
                });
            }
        }
        return items.sort((a, b) => b.contract.updatedAt - a.contract.updatedAt);
    },
});

export const getFileUrl = authedQuery({
    args: { contractId: v.id("contracts") },
    returns: v.union(v.string(), v.null()),
    handler: async (ctx, args) => {
        const contract = await ctx.db.get(args.contractId);
        if (!contract || !contract.storageId) return null;
        await requireEngagementAccess(ctx, contract.engagementId);
        return await ctx.storage.getUrl(contract.storageId);
    },
});

export const listEvents = authedQuery({
    args: { contractId: v.id("contracts") },
    returns: v.array(contractEventValidator),
    handler: async (ctx, args) => {
        const contract = await ctx.db.get(args.contractId);
        if (!contract) return [];
        await requireEngagementAccess(ctx, contract.engagementId);
        const events = await ctx.db
            .query("contractEvents")
            .withIndex("by_contract", (q) => q.eq("contractId", args.contractId))
            .order("desc")
            .collect();
        const out = [];
        for (const event of events) {
            const actor = await ctx.db.get(event.actorUserId);
            out.push({
                _id: event._id,
                action: event.action,
                note: event.note,
                createdAt: event.createdAt,
                actorName: actor
                    ? [actor.firstName, actor.lastName].filter(Boolean).join(" ").trim() || actor.email
                    : "Unknown",
            });
        }
        return out;
    },
});
