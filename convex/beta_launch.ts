import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import {
    BETA_CLEANUP_EMAILS,
    BETA_FOUNDING_EDUCATORS,
    BETA_FOUNDING_MARKER_CLERK_ID,
} from "./beta_founding_profiles";
import {
    classifyMarketplaceDistrict,
    classifyMarketplaceNeed,
    classifyMarketplaceNeedReviewSignals,
    classifyMarketplaceUser,
    computeCandidateDigest,
    getBetaLaunchAuthorizationIssue,
    getIncompletePublishedNeedFields,
} from "../src/lib/marketplace-data-hygiene";
import {
    actionUrlReferencesEntity,
    getMarketplaceCleanupSafetyIssues,
} from "../src/lib/marketplace-cleanup-safety";

export const CLEANUP_CONFIRMATION = "DELETE_FLAGGED_MARKETPLACE_DATA";

function assertBetaLaunchAllowed(launchSecret: string) {
    const issue = getBetaLaunchAuthorizationIssue(
        process.env.BETA_LAUNCH_ENABLED === "true",
        process.env.BETA_LAUNCH_SECRET,
        launchSecret
    );
    if (issue === "disabled") {
        throw new Error(
            "Beta launch mutations are disabled. Set BETA_LAUNCH_ENABLED=true on production Convex only during launch, then unset."
        );
    }
    if (issue === "forbidden") throw new Error("Forbidden");
}

type SweepCtx = QueryCtx | MutationCtx;

async function collectMarketplaceSweep(ctx: SweepCtx, excludedPrimaryIds: string[] = []) {
    const [
        users,
        districts,
        educators,
        credentials,
        gigs,
        needs,
        proposals,
        orders,
        reviews,
        messages,
        notifications,
        procurementRequests,
        adminNotes,
        adminAuditEvents,
        stripeWebhookEvents,
    ] = await Promise.all([
        ctx.db.query("users").collect(),
        ctx.db.query("districts").collect(),
        ctx.db.query("educators").collect(),
        ctx.db.query("credentials").collect(),
        ctx.db.query("gigs").collect(),
        ctx.db.query("needs").collect(),
        ctx.db.query("proposals").collect(),
        ctx.db.query("orders").collect(),
        ctx.db.query("reviews").collect(),
        ctx.db.query("messages").collect(),
        ctx.db.query("notifications").collect(),
        ctx.db.query("procurementRequests").collect(),
        ctx.db.query("adminNotes").collect(),
        ctx.db.query("adminAuditEvents").collect(),
        ctx.db.query("stripeWebhookEvents").collect(),
    ]);

    const excludedIds = new Set(excludedPrimaryIds);
    const cleanupEmails = new Set(BETA_CLEANUP_EMAILS.map((email) => email.toLowerCase()));
    const userFindings = users.flatMap((user) => {
        if (excludedIds.has(String(user._id))) return [];
        const reasons = classifyMarketplaceUser(user);
        if (cleanupEmails.has(user.email.trim().toLowerCase())) reasons.push("explicit_cleanup_email");
        const uniqueReasons = [...new Set(reasons)];
        return uniqueReasons.length > 0
            ? [{ id: user._id, email: user.email, name: `${user.firstName} ${user.lastName}`.trim(), reasons: uniqueReasons }]
            : [];
    });
    const flaggedUserIds = new Set<Id<"users">>(userFindings.map((finding) => finding.id));
    const districtFindings = districts.flatMap((district) => {
        if (excludedIds.has(String(district._id))) return [];
        const reasons = classifyMarketplaceDistrict(district);
        if (
            district.adminIds.length > 0 &&
            district.adminIds.every((adminId) => flaggedUserIds.has(adminId))
        ) {
            reasons.push("all_admins_flagged");
        }
        return reasons.length > 0
            ? [{ id: district._id, name: district.name, reasons: [...new Set(reasons)] }]
            : [];
    });

    const flaggedDistrictIds = new Set<Id<"districts">>(districtFindings.map((finding) => finding.id));
    const flaggedEducators = educators.filter((educator) => flaggedUserIds.has(educator.userId));
    const flaggedEducatorIds = new Set<Id<"educators">>(flaggedEducators.map((educator) => educator._id));

    const needFindings = needs.flatMap((need) => {
        if (excludedIds.has(String(need._id))) return [];
        const reasons = classifyMarketplaceNeed(need);
        if (flaggedUserIds.has(need.postedByUserId)) reasons.push("flagged_owner");
        if (need.districtId && flaggedDistrictIds.has(need.districtId)) reasons.push("flagged_district");
        const uniqueReasons = [...new Set(reasons)];
        return uniqueReasons.length > 0
            ? [{ id: need._id, orgName: need.orgName, reasons: uniqueReasons }]
            : [];
    });
    const incompleteNeeds = needs.flatMap((need) => {
        const fields = getIncompletePublishedNeedFields(need);
        return fields.length > 0
            ? [{ id: need._id, orgName: need.orgName, status: need.status, fields }]
            : [];
    });
    const reviewOnlyNeedSignals = needs.flatMap((need) => {
        const reasons = classifyMarketplaceNeedReviewSignals(need);
        return reasons.length > 0
            ? [{ id: need._id, orgName: need.orgName, reasons }]
            : [];
    });
    const flaggedNeedIds = new Set<Id<"needs">>(needFindings.map((finding) => finding.id));

    const flaggedCredentials = credentials.filter((credential) =>
        flaggedEducatorIds.has(credential.educatorId)
    );
    const flaggedGigs = gigs.filter((gig) => flaggedEducatorIds.has(gig.educatorId));
    const flaggedGigIds = new Set<Id<"gigs">>(flaggedGigs.map((gig) => gig._id));
    const flaggedProposals = proposals.filter(
        (proposal) =>
            flaggedNeedIds.has(proposal.needId) ||
            flaggedEducatorIds.has(proposal.educatorId) ||
            flaggedUserIds.has(proposal.educatorUserId)
    );
    const flaggedProposalIds = new Set<Id<"proposals">>(
        flaggedProposals.map((proposal) => proposal._id)
    );
    const flaggedOrders = orders.filter(
        (order) =>
            flaggedGigIds.has(order.gigId) ||
            flaggedEducatorIds.has(order.educatorId) ||
            flaggedDistrictIds.has(order.districtId) ||
            flaggedUserIds.has(order.buyerUserId)
    );
    const flaggedOrderIds = new Set<Id<"orders">>(flaggedOrders.map((order) => order._id));
    const flaggedReviews = reviews.filter(
        (review) => flaggedOrderIds.has(review.orderId) || flaggedUserIds.has(review.revieweeId)
    );
    const flaggedReviewIds = new Set<Id<"reviews">>(flaggedReviews.map((review) => review._id));
    const flaggedMessages = messages.filter(
        (message) =>
            flaggedUserIds.has(message.senderId) || flaggedUserIds.has(message.recipientId)
    );
    const flaggedProcurementRequests = procurementRequests.filter(
        (request) =>
            (request.districtId ? flaggedDistrictIds.has(request.districtId) : false) ||
            (request.requesterUserId ? flaggedUserIds.has(request.requesterUserId) : false)
    );
    const reviewOnlyProcurementSignals = procurementRequests.flatMap((request) => {
        if (flaggedProcurementRequests.some((candidate) => candidate._id === request._id)) return [];
        const reasons = classifyMarketplaceDistrict({ name: request.districtName });
        return reasons.length > 0
            ? [{ id: request._id, districtName: request.districtName, reasons }]
            : [];
    });
    const flaggedProcurementIds = new Set<Id<"procurementRequests">>(
        flaggedProcurementRequests.map((request) => request._id)
    );

    const flaggedEntityIds = new Set<string>([
        ...[...flaggedUserIds].map(String),
        ...[...flaggedDistrictIds].map(String),
        ...[...flaggedEducatorIds].map(String),
        ...[...flaggedNeedIds].map(String),
        ...[...flaggedGigIds].map(String),
        ...flaggedCredentials.map((credential) => String(credential._id)),
        ...[...flaggedProposalIds].map(String),
        ...[...flaggedOrderIds].map(String),
        ...[...flaggedReviewIds].map(String),
        ...[...flaggedProcurementIds].map(String),
    ]);
    const flaggedNeedOrgNames = new Set(needFindings.map((finding) => finding.orgName));
    const flaggedNotifications = notifications.filter(
        (notification) =>
            flaggedUserIds.has(notification.userId) ||
            (notification.actionUrl
                ? actionUrlReferencesEntity(notification.actionUrl, flaggedEntityIds)
                : false)
    );
    const reviewOnlyNotificationSignals = notifications.flatMap((notification) => {
        if (flaggedNotifications.some((candidate) => candidate._id === notification._id)) return [];
        const matchedOrgName =
            notification.type === "new_need"
                ? [...flaggedNeedOrgNames].find((orgName) => notification.title.includes(orgName))
                : undefined;
        return matchedOrgName
            ? [{
                id: notification._id,
                reasons: ["title_matches_flagged_need_org"],
                matchedOrgName,
            }]
            : [];
    });
    const flaggedAdminNotes = adminNotes.filter(
        (note) => flaggedUserIds.has(note.authorUserId) || flaggedEntityIds.has(note.entityId)
    );
    const flaggedAdminAuditEvents = adminAuditEvents.filter(
        (event) => flaggedUserIds.has(event.actorUserId) || flaggedEntityIds.has(event.entityId)
    );
    const flaggedStripeWebhookEvents = stripeWebhookEvents.filter(
        (event) => event.orderId && flaggedOrderIds.has(event.orderId)
    );
    const districtAdminPatches = districts
        .filter(
            (district) =>
                !flaggedDistrictIds.has(district._id) &&
                district.adminIds.some((adminId) => flaggedUserIds.has(adminId))
        )
        .map((district) => ({
            districtId: district._id,
            adminIds: district.adminIds.filter((adminId) => !flaggedUserIds.has(adminId)),
        }));

    const storageIds = new Set<Id<"_storage">>();
    for (const user of users.filter((user) => flaggedUserIds.has(user._id))) {
        if (user.avatarStorageId) storageIds.add(user.avatarStorageId);
    }
    const reviewOnlyLegacyStorage: Array<{
        credentialId: Id<"credentials">;
        reason: string;
    }> = [];
    for (const credential of flaggedCredentials) {
        if (credential.storageId) storageIds.add(credential.storageId);
        if (!credential.storageId && credential.documentUrl) {
            const candidate = ctx.db.system.normalizeId("_storage", credential.documentUrl);
            if (!candidate) {
                reviewOnlyLegacyStorage.push({
                    credentialId: credential._id,
                    reason: "invalid_legacy_storage_id",
                });
                continue;
            }
            const metadata = await ctx.db.system.get("_storage", candidate);
            if (metadata) {
                storageIds.add(candidate);
            } else {
                reviewOnlyLegacyStorage.push({
                    credentialId: credential._id,
                    reason: "legacy_storage_object_not_found",
                });
            }
        }
    }
    for (const proposal of flaggedProposals) {
        if (proposal.attachmentStorageId) storageIds.add(proposal.attachmentStorageId);
    }

    const rows = {
        users: users.filter((user) => flaggedUserIds.has(user._id)),
        districts: districts.filter((district) => flaggedDistrictIds.has(district._id)),
        educators: flaggedEducators,
        credentials: flaggedCredentials,
        gigs: flaggedGigs,
        needs: needs.filter((need) => flaggedNeedIds.has(need._id)),
        proposals: flaggedProposals,
        orders: flaggedOrders,
        reviews: flaggedReviews,
        messages: flaggedMessages,
        notifications: flaggedNotifications,
        procurementRequests: flaggedProcurementRequests,
        adminNotes: flaggedAdminNotes,
        adminAuditEvents: flaggedAdminAuditEvents,
        stripeWebhookEvents: flaggedStripeWebhookEvents,
    };
    const counts = Object.fromEntries(
        Object.entries(rows).map(([name, records]) => [name, records.length])
    );
    const candidateKeys = [
        ...Object.entries(rows).flatMap(([table, records]) =>
            records.map((record) => `${table}:${record._id}`)
        ),
        ...[...storageIds].map((storageId) => `storage:${storageId}`),
        ...districtAdminPatches.map((item) =>
            `districtPatch:${item.districtId}:${item.adminIds.map(String).sort().join(",")}`
        ),
    ];
    const candidateDigest = await computeCandidateDigest(candidateKeys);

    const safetyIssues = getMarketplaceCleanupSafetyIssues({
        dataset: {
            educators: educators.map((row) => ({
                id: String(row._id),
                userId: String(row.userId),
                stateLicenseIds: row.stateLicenses.map(String),
            })),
            credentials: credentials.map((row) => ({
                id: String(row._id),
                educatorId: String(row.educatorId),
            })),
            gigs: gigs.map((row) => ({ id: String(row._id), educatorId: String(row.educatorId) })),
            needs: needs.map((row) => ({
                id: String(row._id),
                postedByUserId: String(row.postedByUserId),
                districtId: row.districtId ? String(row.districtId) : undefined,
            })),
            proposals: proposals.map((row) => ({
                id: String(row._id),
                needId: String(row.needId),
                educatorId: String(row.educatorId),
                educatorUserId: String(row.educatorUserId),
            })),
            orders: orders.map((row) => ({
                id: String(row._id),
                gigId: String(row.gigId),
                educatorId: String(row.educatorId),
                districtId: String(row.districtId),
                buyerUserId: String(row.buyerUserId),
            })),
            reviews: reviews.map((row) => ({
                id: String(row._id),
                orderId: String(row.orderId),
                revieweeId: String(row.revieweeId),
            })),
            messages: messages.map((row) => ({
                id: String(row._id),
                senderId: String(row.senderId),
                recipientId: String(row.recipientId),
            })),
            notifications: notifications.map((row) => ({
                id: String(row._id),
                userId: String(row.userId),
                actionUrl: row.actionUrl,
            })),
            procurementRequests: procurementRequests.map((row) => ({
                id: String(row._id),
                districtId: row.districtId ? String(row.districtId) : undefined,
                requesterUserId: row.requesterUserId ? String(row.requesterUserId) : undefined,
            })),
            adminNotes: adminNotes.map((row) => ({
                id: String(row._id),
                authorUserId: String(row.authorUserId),
                entityId: row.entityId,
            })),
            adminAuditEvents: adminAuditEvents.map((row) => ({
                id: String(row._id),
                actorUserId: String(row.actorUserId),
                entityId: row.entityId,
            })),
            stripeWebhookEvents: stripeWebhookEvents.map((row) => ({
                id: String(row._id),
                orderId: row.orderId ? String(row.orderId) : undefined,
            })),
        },
        removed: Object.fromEntries(
            Object.entries(rows).map(([table, records]) => [
                table,
                records.map((record) => String(record._id)),
            ])
        ) as {
            [K in keyof typeof rows]: string[];
        },
        districtAdminPatches: districtAdminPatches.map((patch) => ({
            districtId: String(patch.districtId),
            adminIds: patch.adminIds.map(String),
        })),
        flaggedEntityIds,
    });

    return {
        findings: {
            users: userFindings,
            districts: districtFindings,
            needs: needFindings,
            incompleteNeeds,
            reviewOnlyNeedSignals,
            reviewOnlyProcurementSignals,
            reviewOnlyNotificationSignals,
            reviewOnlyLegacyStorage,
        },
        rows,
        counts: {
            ...counts,
            storageObjects: storageIds.size,
            districtAdminPatches: districtAdminPatches.length,
        },
        storageIds: [...storageIds],
        districtAdminPatches,
        excludedPrimaryIds: [...excludedIds].sort(),
        candidateDigest,
        safetyIssues,
    };
}

/** Protected, read-only inventory of records requiring launch review. */
export const auditMarketplaceData = query({
    args: {
        launchSecret: v.string(),
        excludedPrimaryIds: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        assertBetaLaunchAllowed(args.launchSecret);
        const sweep = await collectMarketplaceSweep(ctx, args.excludedPrimaryIds ?? []);
        return {
            mode: "audit_only" as const,
            findings: sweep.findings,
            cleanupPreview: sweep.counts,
            excludedPrimaryIds: sweep.excludedPrimaryIds,
            candidateDigest: sweep.candidateDigest,
            safetyIssues: sweep.safetyIssues,
            confirmationRequired: CLEANUP_CONFIRMATION,
        };
    },
});

/**
 * Remove legacy test rows before prod Clerk goes live.
 * Safe to run after switching Clerk — old dev-linked accounts cannot sign in anyway.
 */
export const cleanupPreLaunch = mutation({
    args: {
        launchSecret: v.string(),
        confirmation: v.string(),
        candidateDigest: v.string(),
        excludedPrimaryIds: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        assertBetaLaunchAllowed(args.launchSecret);
        if (args.confirmation !== CLEANUP_CONFIRMATION) {
            throw new Error(
                `Cleanup not confirmed. Run audit first, then pass confirmation=${CLEANUP_CONFIRMATION}.`
            );
        }

        const sweep = await collectMarketplaceSweep(ctx, args.excludedPrimaryIds ?? []);
        if (sweep.safetyIssues.length > 0) {
            throw new Error(`Cleanup safety checks failed: ${sweep.safetyIssues.join(", ")}`);
        }
        if (args.candidateDigest !== sweep.candidateDigest) {
            throw new Error("Cleanup candidate set changed after audit. Run and review the audit again.");
        }
        for (const storageId of sweep.storageIds) await ctx.storage.delete(storageId);
        for (const row of sweep.rows.reviews) await ctx.db.delete(row._id);
        for (const row of sweep.rows.stripeWebhookEvents) await ctx.db.delete(row._id);
        for (const row of sweep.rows.proposals) await ctx.db.delete(row._id);
        for (const row of sweep.rows.orders) await ctx.db.delete(row._id);
        for (const row of sweep.rows.messages) await ctx.db.delete(row._id);
        for (const row of sweep.rows.notifications) await ctx.db.delete(row._id);
        for (const row of sweep.rows.procurementRequests) await ctx.db.delete(row._id);
        for (const row of sweep.rows.adminNotes) await ctx.db.delete(row._id);
        for (const row of sweep.rows.adminAuditEvents) await ctx.db.delete(row._id);
        for (const row of sweep.rows.credentials) await ctx.db.delete(row._id);
        for (const row of sweep.rows.gigs) await ctx.db.delete(row._id);
        for (const row of sweep.rows.needs) await ctx.db.delete(row._id);
        for (const row of sweep.rows.educators) await ctx.db.delete(row._id);
        for (const patch of sweep.districtAdminPatches) {
            await ctx.db.patch(patch.districtId, { adminIds: patch.adminIds });
        }
        for (const row of sweep.rows.districts) await ctx.db.delete(row._id);
        for (const row of sweep.rows.users) await ctx.db.delete(row._id);

        return {
            status: "cleaned" as const,
            removed: sweep.counts,
            candidateDigest: sweep.candidateDigest,
            reviewOnlyIncompleteNeeds: sweep.findings.incompleteNeeds,
        };
    },
});

/**
 * Seed polished founding educators with bookable gigs for controlled beta.
 * Idempotent — skips if marker row already exists.
 */
export const seedFoundingProfiles = mutation({
    args: { launchSecret: v.string() },
    handler: async (ctx, args) => {
        assertBetaLaunchAllowed(args.launchSecret);

        const marker = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", BETA_FOUNDING_MARKER_CLERK_ID))
            .first();
        if (marker) {
            return {
                status: "already_seeded" as const,
                message: "Founding beta profiles already exist.",
            };
        }

        const now = Date.now();
        let educatorsCreated = 0;
        let gigsCreated = 0;

        for (const profile of BETA_FOUNDING_EDUCATORS) {
            const userId = await ctx.db.insert("users", {
                clerkId: profile.clerkId,
                role: "educator",
                email: profile.email,
                firstName: profile.firstName,
                lastName: profile.lastName,
                onboarded: true,
                createdAt: now,
            });

            const educatorId = await ctx.db.insert("educators", {
                userId,
                headline: profile.headline,
                bio: profile.bio,
                yearsExperience: profile.yearsExperience,
                gradeLevelBands: [...profile.gradeLevelBands],
                areasOfNeed: [...profile.areasOfNeed],
                subCategories: [...profile.subCategories],
                engagementTypes: [...profile.engagementTypes],
                coverageRegions: [...profile.coverageRegions],
                stateLicenses: [],
                verificationStatus: profile.verificationStatus,
                availabilityStatus: profile.availabilityStatus,
                hourlyRate: "hourlyRate" in profile ? profile.hourlyRate : undefined,
                dailyRate: "dailyRate" in profile ? profile.dailyRate : undefined,
                isActive: true,
                profileCompletePct: profile.profileCompletePct,
            });
            educatorsCreated++;

            for (const gig of profile.gigs) {
                await ctx.db.insert("gigs", {
                    educatorId,
                    title: gig.title,
                    description: gig.description,
                    areaOfNeed: gig.areaOfNeed,
                    subCategory: gig.subCategory,
                    engagementType: gig.engagementType,
                    gradeLevels: [...gig.gradeLevels],
                    coverageRegions: [...gig.coverageRegions],
                    deliverables: [...gig.deliverables],
                    pricingType: gig.pricingType,
                    price: gig.price,
                    estimatedDuration: gig.estimatedDuration,
                    isActive: true,
                    createdAt: now,
                });
                gigsCreated++;
            }
        }

        await ctx.db.insert("users", {
            clerkId: BETA_FOUNDING_MARKER_CLERK_ID,
            role: "educator",
            email: "internal-beta-marker@k12gig.com",
            firstName: "Beta",
            lastName: "Marker",
            onboarded: true,
            createdAt: now,
        });

        return {
            status: "seeded" as const,
            educatorsCreated,
            gigsCreated,
            profiles: BETA_FOUNDING_EDUCATORS.map((p) => ({
                name: `${p.firstName} ${p.lastName}`,
                email: p.email,
                gigCount: p.gigs.length,
            })),
        };
    },
});
