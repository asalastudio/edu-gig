import { query, mutation } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";

const roleFilterValidator = v.optional(v.string());
const queryFilterValidator = v.optional(v.string());

const procurementStatusValidator = v.union(
    v.literal("new"),
    v.literal("in_review"),
    v.literal("packet_sent"),
    v.literal("waiting_on_district"),
    v.literal("approved"),
    v.literal("closed")
);

const verificationStatusValidator = v.union(
    v.literal("unverified"),
    v.literal("pending"),
    v.literal("verified"),
    v.literal("premier")
);

type AdminCtx = QueryCtx | MutationCtx;
type Viewer = Doc<"users">;

async function getViewer(ctx: AdminCtx) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .first();
}

async function requireSuperadmin(ctx: AdminCtx) {
    const viewer = await getViewer(ctx);
    if (!viewer || viewer.role !== "superadmin") {
        throw new Error("Forbidden");
    }
    return viewer;
}

function fullName(user: Pick<Doc<"users">, "firstName" | "lastName" | "email"> | null | undefined) {
    const name = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
    return name || user?.email || "Unknown";
}

function normalizeQuery(value: string | undefined) {
    return value?.trim().toLowerCase() ?? "";
}

function includesQuery(queryText: string, ...values: Array<string | undefined | null>) {
    if (!queryText) return true;
    return values.some((value) => value?.toLowerCase().includes(queryText));
}

function countBy<T extends string>(values: T[]) {
    return values.reduce<Record<T, number>>((acc, value) => {
        acc[value] = (acc[value] ?? 0) + 1;
        return acc;
    }, {} as Record<T, number>);
}

async function writeAuditEvent(
    ctx: MutationCtx,
    actor: Viewer,
    action: string,
    entityType: string,
    entityId: string,
    summary: string
) {
    await ctx.db.insert("adminAuditEvents", {
        actorUserId: actor._id,
        action,
        entityType,
        entityId,
        summary,
        createdAt: Date.now(),
    });
}

export const overviewStats = query({
    args: {},
    handler: async (ctx) => {
        await requireSuperadmin(ctx);

        const [users, districts, educators, orders, procurementRequests, auditEvents] = await Promise.all([
            ctx.db.query("users").collect(),
            ctx.db.query("districts").collect(),
            ctx.db.query("educators").collect(),
            ctx.db.query("orders").collect(),
            ctx.db.query("procurementRequests").collect(),
            ctx.db.query("adminAuditEvents").collect(),
        ]);

        const pendingVerification = educators.filter(
            (educator) => educator.verificationStatus === "pending" || educator.verificationStatus === "unverified"
        ).length;
        const pendingProcurement = procurementRequests.filter(
            (request) => request.status === "new" || request.status === "in_review" || request.status === "waiting_on_district"
        ).length;
        const openOrders = orders.filter(
            (order) => order.status === "pending" || order.status === "accepted" || order.status === "in_progress"
        ).length;
        const totalGMV = orders.reduce((sum, order) => sum + order.totalAmount, 0);

        return {
            users: users.length,
            districts: districts.length,
            educators: educators.length,
            orders: orders.length,
            openOrders,
            procurementRequests: procurementRequests.length,
            pendingProcurement,
            pendingVerification,
            totalGMV,
            byRole: countBy(users.map((user) => user.role)),
            recentAuditEvents: auditEvents
                .sort((a, b) => b.createdAt - a.createdAt)
                .slice(0, 8)
                .map((event) => ({
                    id: event._id,
                    action: event.action,
                    entityType: event.entityType,
                    entityId: event.entityId,
                    summary: event.summary,
                    createdAt: event.createdAt,
                })),
        };
    },
});

export const listUsers = query({
    args: {
        query: queryFilterValidator,
        role: roleFilterValidator,
    },
    handler: async (ctx, args) => {
        await requireSuperadmin(ctx);
        const q = normalizeQuery(args.query);
        const role = args.role && args.role !== "all" ? args.role : "";
        const users = await ctx.db.query("users").collect();

        return users
            .filter((user) => (!role || user.role === role) && includesQuery(q, user.email, user.firstName, user.lastName, user.role))
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 150)
            .map((user) => ({
                id: user._id,
                name: fullName(user),
                email: user.email,
                role: user.role,
                onboarded: user.onboarded,
                createdAt: user.createdAt,
            }));
    },
});

export const listDistricts = query({
    args: {
        query: queryFilterValidator,
        plan: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await requireSuperadmin(ctx);
        const q = normalizeQuery(args.query);
        const plan = args.plan && args.plan !== "all" ? args.plan : "";
        const [districts, users, procurementRequests] = await Promise.all([
            ctx.db.query("districts").collect(),
            ctx.db.query("users").collect(),
            ctx.db.query("procurementRequests").collect(),
        ]);
        const usersById = new Map(users.map((user) => [user._id, user]));

        return districts
            .filter(
                (district) =>
                    (!plan || district.planType === plan) &&
                    includesQuery(q, district.name, district.state, district.region, district.nceaId)
            )
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 150)
            .map((district) => {
                const admins = district.adminIds.map((adminId) => usersById.get(adminId)).filter(Boolean) as Doc<"users">[];
                const procurement = procurementRequests
                    .filter((request) => request.districtId === district._id || request.districtName === district.name)
                    .sort((a, b) => b.updatedAt - a.updatedAt);

                return {
                    id: district._id,
                    name: district.name,
                    state: district.state,
                    region: district.region,
                    nceaId: district.nceaId,
                    planType: district.planType,
                    adminCount: admins.length,
                    adminNames: admins.map(fullName),
                    procurementCount: procurement.length,
                    latestProcurementStatus: procurement[0]?.status ?? null,
                    createdAt: district.createdAt,
                };
            });
    },
});

export const listEducators = query({
    args: {
        query: queryFilterValidator,
        verificationStatus: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await requireSuperadmin(ctx);
        const q = normalizeQuery(args.query);
        const status = args.verificationStatus && args.verificationStatus !== "all" ? args.verificationStatus : "";
        const [educators, users, credentials, gigs] = await Promise.all([
            ctx.db.query("educators").collect(),
            ctx.db.query("users").collect(),
            ctx.db.query("credentials").collect(),
            ctx.db.query("gigs").collect(),
        ]);
        const usersById = new Map(users.map((user) => [user._id, user]));

        return educators
            .filter((educator) => {
                const user = usersById.get(educator.userId);
                return (
                    (!status || educator.verificationStatus === status) &&
                    includesQuery(q, user?.email, user?.firstName, user?.lastName, educator.headline, educator.bio)
                );
            })
            .sort((a, b) => {
                const userA = usersById.get(a.userId);
                const userB = usersById.get(b.userId);
                return (userB?.createdAt ?? 0) - (userA?.createdAt ?? 0);
            })
            .slice(0, 150)
            .map((educator) => {
                const user = usersById.get(educator.userId);
                const educatorCredentials = credentials.filter((credential) => credential.educatorId === educator._id);
                const educatorGigs = gigs.filter((gig) => gig.educatorId === educator._id);
                return {
                    id: educator._id,
                    userId: educator.userId,
                    name: fullName(user),
                    email: user?.email ?? "",
                    headline: educator.headline,
                    verificationStatus: educator.verificationStatus,
                    availabilityStatus: educator.availabilityStatus,
                    profileCompletePct: educator.profileCompletePct,
                    credentialCount: educatorCredentials.length,
                    unverifiedCredentialCount: educatorCredentials.filter((credential) => !credential.verified).length,
                    gigCount: educatorGigs.length,
                    createdAt: user?.createdAt ?? 0,
                };
            });
    },
});

export const listOrders = query({
    args: {
        query: queryFilterValidator,
        status: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await requireSuperadmin(ctx);
        const q = normalizeQuery(args.query);
        const status = args.status && args.status !== "all" ? args.status : "";
        const [orders, districts, educators, users, gigs] = await Promise.all([
            ctx.db.query("orders").collect(),
            ctx.db.query("districts").collect(),
            ctx.db.query("educators").collect(),
            ctx.db.query("users").collect(),
            ctx.db.query("gigs").collect(),
        ]);
        const districtsById = new Map(districts.map((district) => [district._id, district]));
        const educatorsById = new Map(educators.map((educator) => [educator._id, educator]));
        const usersById = new Map(users.map((user) => [user._id, user]));
        const gigsById = new Map(gigs.map((gig) => [gig._id, gig]));

        return orders
            .map((order) => {
                const educator = educatorsById.get(order.educatorId);
                const educatorUser = educator ? usersById.get(educator.userId) : null;
                const district = districtsById.get(order.districtId);
                const gig = gigsById.get(order.gigId);
                return {
                    id: order._id,
                    status: order.status,
                    districtName: district?.name ?? "Unknown district",
                    educatorName: fullName(educatorUser),
                    gigTitle: gig?.title ?? "Engagement",
                    totalAmount: order.totalAmount,
                    educatorPayout: order.educatorPayout,
                    platformFee: order.platformFee,
                    paymentMethod: order.paymentMethod,
                    startDate: order.startDate,
                    createdAt: order.createdAt,
                };
            })
            .filter(
                (order) =>
                    (!status || order.status === status) &&
                    includesQuery(q, order.districtName, order.educatorName, order.gigTitle, order.paymentMethod, order.status)
            )
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 150);
    },
});

export const listProcurementRequests = query({
    args: {
        query: queryFilterValidator,
        status: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await requireSuperadmin(ctx);
        const q = normalizeQuery(args.query);
        const status = args.status && args.status !== "all" ? args.status : "";
        const requests = await ctx.db.query("procurementRequests").collect();

        return requests
            .filter(
                (request) =>
                    (!status || request.status === status) &&
                    includesQuery(
                        q,
                        request.districtName,
                        request.state,
                        request.requesterName,
                        request.requesterEmail,
                        request.requesterTitle,
                        request.procurementContact,
                        request.notes
                    )
            )
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .slice(0, 150)
            .map((request) => ({
                id: request._id,
                districtId: request.districtId,
                requesterUserId: request.requesterUserId,
                requesterName: request.requesterName,
                requesterEmail: request.requesterEmail,
                requesterTitle: request.requesterTitle,
                districtName: request.districtName,
                state: request.state,
                requestedMaterials: request.requestedMaterials,
                deadline: request.deadline,
                procurementContact: request.procurementContact,
                notes: request.notes,
                status: request.status,
                internalNotes: request.internalNotes,
                createdAt: request.createdAt,
                updatedAt: request.updatedAt,
            }));
    },
});

export const listVerificationQueue = query({
    args: {
        query: queryFilterValidator,
    },
    handler: async (ctx, args) => {
        await requireSuperadmin(ctx);
        const q = normalizeQuery(args.query);
        const [educators, users, credentials] = await Promise.all([
            ctx.db.query("educators").collect(),
            ctx.db.query("users").collect(),
            ctx.db.query("credentials").collect(),
        ]);
        const usersById = new Map(users.map((user) => [user._id, user]));

        return educators
            .map((educator) => {
                const user = usersById.get(educator.userId);
                const educatorCredentials = credentials.filter((credential) => credential.educatorId === educator._id);
                const pendingCredentialCount = educatorCredentials.filter((credential) => !credential.verified).length;
                return {
                    id: educator._id,
                    userId: educator.userId,
                    name: fullName(user),
                    email: user?.email ?? "",
                    headline: educator.headline,
                    verificationStatus: educator.verificationStatus,
                    availabilityStatus: educator.availabilityStatus,
                    profileCompletePct: educator.profileCompletePct,
                    pendingCredentialCount,
                    credentialCount: educatorCredentials.length,
                    credentials: educatorCredentials.map((credential) => ({
                        id: credential._id,
                        type: credential.type,
                        title: credential.title,
                        issuingBody: credential.issuingBody,
                        state: credential.state,
                        issueDate: credential.issueDate,
                        expiryDate: credential.expiryDate,
                        documentUrl: credential.documentUrl,
                        verified: credential.verified,
                    })),
                    createdAt: user?.createdAt ?? 0,
                };
            })
            .filter(
                (row) =>
                    (row.verificationStatus === "pending" ||
                        row.verificationStatus === "unverified" ||
                        row.pendingCredentialCount > 0) &&
                    includesQuery(q, row.name, row.email, row.headline, row.verificationStatus)
            )
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 150);
    },
});

export const listAdminNotes = query({
    args: {
        entityType: v.string(),
        entityId: v.string(),
    },
    handler: async (ctx, args) => {
        await requireSuperadmin(ctx);
        const [notes, users] = await Promise.all([
            ctx.db
                .query("adminNotes")
                .withIndex("by_entity", (q) => q.eq("entityType", args.entityType).eq("entityId", args.entityId))
                .collect(),
            ctx.db.query("users").collect(),
        ]);
        const usersById = new Map(users.map((user) => [user._id, user]));

        return notes
            .sort((a, b) => b.createdAt - a.createdAt)
            .map((note) => ({
                id: note._id,
                body: note.body,
                authorName: fullName(usersById.get(note.authorUserId)),
                createdAt: note.createdAt,
            }));
    },
});

export const addAdminNote = mutation({
    args: {
        entityType: v.string(),
        entityId: v.string(),
        body: v.string(),
    },
    handler: async (ctx, args) => {
        const viewer = await requireSuperadmin(ctx);
        const body = args.body.trim();
        if (body.length < 2) throw new Error("Note is too short.");
        if (body.length > 4_000) throw new Error("Note is too long.");

        const noteId = await ctx.db.insert("adminNotes", {
            entityType: args.entityType,
            entityId: args.entityId,
            authorUserId: viewer._id,
            body,
            createdAt: Date.now(),
        });
        await writeAuditEvent(ctx, viewer, "admin_note.added", args.entityType, args.entityId, "Added an internal admin note.");
        return noteId;
    },
});

export const updateProcurementStatus = mutation({
    args: {
        requestId: v.id("procurementRequests"),
        status: procurementStatusValidator,
    },
    handler: async (ctx, args) => {
        const viewer = await requireSuperadmin(ctx);
        const request = await ctx.db.get(args.requestId);
        if (!request) throw new Error("Not found");

        await ctx.db.patch(args.requestId, {
            status: args.status,
            updatedAt: Date.now(),
        });
        await writeAuditEvent(
            ctx,
            viewer,
            "procurement.status_updated",
            "procurement_request",
            args.requestId,
            `${request.status} -> ${args.status}`
        );
        return args.requestId;
    },
});

export const updateEducatorVerification = mutation({
    args: {
        educatorId: v.id("educators"),
        status: verificationStatusValidator,
    },
    handler: async (ctx, args) => {
        const viewer = await requireSuperadmin(ctx);
        const educator = await ctx.db.get(args.educatorId);
        if (!educator) throw new Error("Not found");

        await ctx.db.patch(args.educatorId, {
            verificationStatus: args.status,
        });

        const statusCopy =
            args.status === "premier"
                ? "Your profile is now marked as Premier Verified."
                : args.status === "verified"
                  ? "Your educator verification has been approved."
                  : args.status === "pending"
                    ? "Your educator verification is under review."
                    : "Your educator verification needs more information before it can be approved.";

        await ctx.db.insert("notifications", {
            userId: educator.userId,
            type: "educator_verification",
            title: "Verification status updated",
            body: statusCopy,
            read: false,
            actionUrl: "/dashboard/educator/settings",
            createdAt: Date.now(),
        });

        await writeAuditEvent(
            ctx,
            viewer,
            "educator.verification_updated",
            "educator",
            args.educatorId,
            `${educator.verificationStatus} -> ${args.status}`
        );
        return args.educatorId;
    },
});
