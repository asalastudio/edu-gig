type CleanupId = string;

export type MarketplaceCleanupDataset = {
    educators: Array<{ id: CleanupId; userId: CleanupId; stateLicenseIds: CleanupId[] }>;
    credentials: Array<{ id: CleanupId; educatorId: CleanupId }>;
    gigs: Array<{ id: CleanupId; educatorId: CleanupId }>;
    needs: Array<{ id: CleanupId; postedByUserId: CleanupId; districtId?: CleanupId }>;
    proposals: Array<{
        id: CleanupId;
        needId: CleanupId;
        educatorId: CleanupId;
        educatorUserId: CleanupId;
    }>;
    orders: Array<{
        id: CleanupId;
        gigId: CleanupId;
        educatorId: CleanupId;
        districtId: CleanupId;
        buyerUserId: CleanupId;
    }>;
    reviews: Array<{ id: CleanupId; orderId: CleanupId; revieweeId: CleanupId }>;
    messages: Array<{ id: CleanupId; senderId: CleanupId; recipientId: CleanupId }>;
    notifications: Array<{ id: CleanupId; userId: CleanupId; actionUrl?: string }>;
    procurementRequests: Array<{
        id: CleanupId;
        districtId?: CleanupId;
        requesterUserId?: CleanupId;
    }>;
    adminNotes: Array<{ id: CleanupId; authorUserId: CleanupId; entityId: CleanupId }>;
    adminAuditEvents: Array<{ id: CleanupId; actorUserId: CleanupId; entityId: CleanupId }>;
    stripeWebhookEvents: Array<{ id: CleanupId; orderId?: CleanupId }>;
};

export type MarketplaceCleanupRemovalManifest = {
    users: CleanupId[];
    districts: CleanupId[];
    educators: CleanupId[];
    credentials: CleanupId[];
    gigs: CleanupId[];
    needs: CleanupId[];
    proposals: CleanupId[];
    orders: CleanupId[];
    reviews: CleanupId[];
    messages: CleanupId[];
    notifications: CleanupId[];
    procurementRequests: CleanupId[];
    adminNotes: CleanupId[];
    adminAuditEvents: CleanupId[];
    stripeWebhookEvents: CleanupId[];
};

type DistrictAdminPatch = { districtId: CleanupId; adminIds: CleanupId[] };

function decodeSegment(segment: string): string {
    try {
        return decodeURIComponent(segment);
    } catch {
        return segment;
    }
}

/** Only exact URL path segments and query values count as entity references. */
export function actionUrlReferencesEntity(actionUrl: string, entityIds: ReadonlySet<string>): boolean {
    try {
        const url = new URL(actionUrl, "https://k12gig.local");
        const pathSegments = url.pathname.split("/").filter(Boolean).map(decodeSegment);
        if (pathSegments.some((segment) => entityIds.has(segment))) return true;
        return [...url.searchParams.values()].some((value) => entityIds.has(value));
    } catch {
        return false;
    }
}

export function getMarketplaceCleanupSafetyIssues({
    dataset,
    removed,
    districtAdminPatches,
    flaggedEntityIds,
}: {
    dataset: MarketplaceCleanupDataset;
    removed: MarketplaceCleanupRemovalManifest;
    districtAdminPatches: DistrictAdminPatch[];
    flaggedEntityIds: ReadonlySet<string>;
}): string[] {
    const issues: string[] = [];
    for (const patch of districtAdminPatches) {
        if (patch.adminIds.length === 0) issues.push(`district_adminless:${patch.districtId}`);
    }

    const removedIds = Object.fromEntries(
        Object.entries(removed).map(([table, ids]) => [table, new Set(ids)])
    ) as { [K in keyof MarketplaceCleanupRemovalManifest]: Set<string> };

    if (dataset.educators.some((row) => !removedIds.educators.has(row.id) && removedIds.users.has(row.userId))) {
        issues.push("surviving_educator_references_removed_user");
    }
    if (dataset.credentials.some((row) => !removedIds.credentials.has(row.id) && removedIds.educators.has(row.educatorId))) {
        issues.push("surviving_credential_references_removed_educator");
    }
    if (dataset.gigs.some((row) => !removedIds.gigs.has(row.id) && removedIds.educators.has(row.educatorId))) {
        issues.push("surviving_gig_references_removed_educator");
    }
    if (
        dataset.educators.some(
            (row) =>
                !removedIds.educators.has(row.id) &&
                row.stateLicenseIds.some((credentialId) => removedIds.credentials.has(credentialId))
        )
    ) {
        issues.push("surviving_educator_references_removed_credential");
    }
    if (
        dataset.needs.some(
            (row) =>
                !removedIds.needs.has(row.id) &&
                (removedIds.users.has(row.postedByUserId) ||
                    (row.districtId ? removedIds.districts.has(row.districtId) : false))
        )
    ) {
        issues.push("surviving_need_references_removed_owner");
    }
    if (
        dataset.proposals.some(
            (row) =>
                !removedIds.proposals.has(row.id) &&
                (removedIds.needs.has(row.needId) ||
                    removedIds.educators.has(row.educatorId) ||
                    removedIds.users.has(row.educatorUserId))
        )
    ) {
        issues.push("surviving_proposal_references_removed_entity");
    }
    if (
        dataset.orders.some(
            (row) =>
                !removedIds.orders.has(row.id) &&
                (removedIds.gigs.has(row.gigId) ||
                    removedIds.educators.has(row.educatorId) ||
                    removedIds.districts.has(row.districtId) ||
                    removedIds.users.has(row.buyerUserId))
        )
    ) {
        issues.push("surviving_order_references_removed_entity");
    }
    if (
        dataset.reviews.some(
            (row) =>
                !removedIds.reviews.has(row.id) &&
                (removedIds.orders.has(row.orderId) || removedIds.users.has(row.revieweeId))
        )
    ) {
        issues.push("surviving_review_references_removed_entity");
    }
    if (
        dataset.messages.some(
            (row) =>
                !removedIds.messages.has(row.id) &&
                (removedIds.users.has(row.senderId) || removedIds.users.has(row.recipientId))
        )
    ) {
        issues.push("surviving_message_references_removed_user");
    }
    if (
        dataset.notifications.some(
            (row) =>
                !removedIds.notifications.has(row.id) &&
                (removedIds.users.has(row.userId) ||
                    (row.actionUrl
                        ? actionUrlReferencesEntity(row.actionUrl, flaggedEntityIds)
                        : false))
        )
    ) {
        issues.push("surviving_notification_references_removed_user");
    }
    if (
        dataset.procurementRequests.some(
            (row) =>
                !removedIds.procurementRequests.has(row.id) &&
                ((row.districtId ? removedIds.districts.has(row.districtId) : false) ||
                    (row.requesterUserId ? removedIds.users.has(row.requesterUserId) : false))
        )
    ) {
        issues.push("surviving_procurement_request_references_removed_entity");
    }
    if (
        dataset.adminNotes.some(
            (row) =>
                !removedIds.adminNotes.has(row.id) &&
                (removedIds.users.has(row.authorUserId) || flaggedEntityIds.has(row.entityId))
        )
    ) {
        issues.push("surviving_admin_note_references_removed_entity");
    }
    if (
        dataset.adminAuditEvents.some(
            (row) =>
                !removedIds.adminAuditEvents.has(row.id) &&
                (removedIds.users.has(row.actorUserId) || flaggedEntityIds.has(row.entityId))
        )
    ) {
        issues.push("surviving_admin_audit_event_references_removed_entity");
    }
    if (
        dataset.stripeWebhookEvents.some(
            (row) =>
                !removedIds.stripeWebhookEvents.has(row.id) &&
                (row.orderId ? removedIds.orders.has(row.orderId) : false)
        )
    ) {
        issues.push("surviving_stripe_event_references_removed_order");
    }

    return issues;
}
