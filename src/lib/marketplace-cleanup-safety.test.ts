import { describe, expect, it } from "vitest";
import {
    actionUrlReferencesEntity,
    getMarketplaceCleanupSafetyIssues,
    type MarketplaceCleanupDataset,
    type MarketplaceCleanupRemovalManifest,
} from "./marketplace-cleanup-safety";

const emptyDataset = (): MarketplaceCleanupDataset => ({
    educators: [],
    credentials: [],
    gigs: [],
    needs: [],
    proposals: [],
    engagements: [],
    contracts: [],
    orders: [],
    reviews: [],
    messages: [],
    notifications: [],
    procurementRequests: [],
    adminNotes: [],
    adminAuditEvents: [],
    stripeWebhookEvents: [],
});

const emptyRemovalManifest = (): MarketplaceCleanupRemovalManifest => ({
    users: [],
    districts: [],
    educators: [],
    credentials: [],
    gigs: [],
    needs: [],
    proposals: [],
    engagements: [],
    contracts: [],
    orders: [],
    reviews: [],
    messages: [],
    notifications: [],
    procurementRequests: [],
    adminNotes: [],
    adminAuditEvents: [],
    stripeWebhookEvents: [],
});

describe("actionUrlReferencesEntity", () => {
    it("matches exact path segments and query values", () => {
        expect(actionUrlReferencesEntity("/needs/need_123", new Set(["need_123"]))).toBe(true);
        expect(
            actionUrlReferencesEntity("/messages?proposal=proposal_456", new Set(["proposal_456"]))
        ).toBe(true);
    });

    it("does not match an id that is only a substring", () => {
        expect(actionUrlReferencesEntity("/needs/need_1234", new Set(["need_123"]))).toBe(false);
        expect(actionUrlReferencesEntity("/search?q=need_1234", new Set(["need_123"]))).toBe(false);
    });
});

describe("getMarketplaceCleanupSafetyIssues", () => {
    it("accepts a complete cascade fixture", () => {
        const dataset = emptyDataset();
        dataset.educators.push({ id: "educator_1", userId: "user_1", stateLicenseIds: [] });
        dataset.credentials.push({ id: "credential_1", educatorId: "educator_1" });
        dataset.gigs.push({ id: "gig_1", educatorId: "educator_1" });
        dataset.needs.push({ id: "need_1", postedByUserId: "user_1", districtId: "district_1" });
        dataset.proposals.push({
            id: "proposal_1",
            needId: "need_1",
            educatorId: "educator_1",
            educatorUserId: "user_1",
        });
        dataset.orders.push({
            id: "order_1",
            gigId: "gig_1",
            educatorId: "educator_1",
            districtId: "district_1",
            buyerUserId: "user_1",
        });
        dataset.reviews.push({ id: "review_1", orderId: "order_1", revieweeId: "user_1" });
        dataset.messages.push({ id: "message_1", senderId: "user_1", recipientId: "user_2" });
        dataset.notifications.push({ id: "notification_1", userId: "user_2", actionUrl: "/needs/need_1" });
        dataset.procurementRequests.push({
            id: "procurement_1",
            districtId: "district_1",
            requesterUserId: "user_1",
        });
        dataset.adminNotes.push({ id: "note_1", authorUserId: "user_2", entityId: "need_1" });
        dataset.adminAuditEvents.push({ id: "audit_1", actorUserId: "user_2", entityId: "order_1" });
        dataset.stripeWebhookEvents.push({ id: "stripe_1", orderId: "order_1" });

        const removed: MarketplaceCleanupRemovalManifest = {
            users: ["user_1"],
            districts: ["district_1"],
            educators: ["educator_1"],
            credentials: ["credential_1"],
            gigs: ["gig_1"],
            needs: ["need_1"],
            proposals: ["proposal_1"],
            engagements: [],
            contracts: [],
            orders: ["order_1"],
            reviews: ["review_1"],
            messages: ["message_1"],
            notifications: ["notification_1"],
            procurementRequests: ["procurement_1"],
            adminNotes: ["note_1"],
            adminAuditEvents: ["audit_1"],
            stripeWebhookEvents: ["stripe_1"],
        };

        expect(
            getMarketplaceCleanupSafetyIssues({
                dataset,
                removed,
                districtAdminPatches: [],
                flaggedEntityIds: new Set([
                    "user_1",
                    "district_1",
                    "educator_1",
                    "credential_1",
                    "gig_1",
                    "need_1",
                    "proposal_1",
                    "order_1",
                ]),
            })
        ).toEqual([]);
    });

    it("fails closed when a dependent row is omitted from the cascade", () => {
        const dataset = emptyDataset();
        dataset.proposals.push({
            id: "proposal_survivor",
            needId: "need_removed",
            educatorId: "educator_safe",
            educatorUserId: "user_safe",
        });
        const removed = emptyRemovalManifest();
        removed.needs.push("need_removed");

        expect(
            getMarketplaceCleanupSafetyIssues({
                dataset,
                removed,
                districtAdminPatches: [],
                flaggedEntityIds: new Set(["need_removed"]),
            })
        ).toContain("surviving_proposal_references_removed_entity");
    });

    it.each<{
        name: string;
        arrange: (
            dataset: MarketplaceCleanupDataset,
            removed: MarketplaceCleanupRemovalManifest
        ) => void;
        issue: string;
    }>([
        {
            name: "educator → user",
            arrange: (dataset, removed) => {
                dataset.educators.push({ id: "educator_safe", userId: "user_removed", stateLicenseIds: [] });
                removed.users.push("user_removed");
            },
            issue: "surviving_educator_references_removed_user",
        },
        {
            name: "credential → educator",
            arrange: (dataset, removed) => {
                dataset.credentials.push({ id: "credential_safe", educatorId: "educator_removed" });
                removed.educators.push("educator_removed");
            },
            issue: "surviving_credential_references_removed_educator",
        },
        {
            name: "gig → educator",
            arrange: (dataset, removed) => {
                dataset.gigs.push({ id: "gig_safe", educatorId: "educator_removed" });
                removed.educators.push("educator_removed");
            },
            issue: "surviving_gig_references_removed_educator",
        },
        {
            name: "educator → credential",
            arrange: (dataset, removed) => {
                dataset.educators.push({
                    id: "educator_safe",
                    userId: "user_safe",
                    stateLicenseIds: ["credential_removed"],
                });
                removed.credentials.push("credential_removed");
            },
            issue: "surviving_educator_references_removed_credential",
        },
        {
            name: "need → owner",
            arrange: (dataset, removed) => {
                dataset.needs.push({ id: "need_safe", postedByUserId: "user_removed" });
                removed.users.push("user_removed");
            },
            issue: "surviving_need_references_removed_owner",
        },
        {
            name: "order → gig",
            arrange: (dataset, removed) => {
                dataset.orders.push({
                    id: "order_safe",
                    gigId: "gig_removed",
                    educatorId: "educator_safe",
                    districtId: "district_safe",
                    buyerUserId: "user_safe",
                });
                removed.gigs.push("gig_removed");
            },
            issue: "surviving_order_references_removed_entity",
        },
        {
            name: "review → order",
            arrange: (dataset, removed) => {
                dataset.reviews.push({ id: "review_safe", orderId: "order_removed", revieweeId: "user_safe" });
                removed.orders.push("order_removed");
            },
            issue: "surviving_review_references_removed_entity",
        },
        {
            name: "message → user",
            arrange: (dataset, removed) => {
                dataset.messages.push({ id: "message_safe", senderId: "user_removed", recipientId: "user_safe" });
                removed.users.push("user_removed");
            },
            issue: "surviving_message_references_removed_user",
        },
        {
            name: "notification → entity URL",
            arrange: (dataset, removed) => {
                dataset.notifications.push({ id: "notification_safe", userId: "user_safe", actionUrl: "/needs/need_removed" });
                removed.needs.push("need_removed");
            },
            issue: "surviving_notification_references_removed_user",
        },
        {
            name: "procurement request → district",
            arrange: (dataset, removed) => {
                dataset.procurementRequests.push({ id: "procurement_safe", districtId: "district_removed" });
                removed.districts.push("district_removed");
            },
            issue: "surviving_procurement_request_references_removed_entity",
        },
        {
            name: "admin note → entity",
            arrange: (dataset, removed) => {
                dataset.adminNotes.push({ id: "note_safe", authorUserId: "user_safe", entityId: "need_removed" });
                removed.needs.push("need_removed");
            },
            issue: "surviving_admin_note_references_removed_entity",
        },
        {
            name: "admin audit event → entity",
            arrange: (dataset, removed) => {
                dataset.adminAuditEvents.push({ id: "audit_safe", actorUserId: "user_safe", entityId: "need_removed" });
                removed.needs.push("need_removed");
            },
            issue: "surviving_admin_audit_event_references_removed_entity",
        },
        {
            name: "Stripe event → order",
            arrange: (dataset, removed) => {
                dataset.stripeWebhookEvents.push({ id: "stripe_safe", orderId: "order_removed" });
                removed.orders.push("order_removed");
            },
            issue: "surviving_stripe_event_references_removed_order",
        },
    ])("detects an omitted $name relationship", ({ arrange, issue }) => {
        const dataset = emptyDataset();
        const removed = emptyRemovalManifest();
        arrange(dataset, removed);
        const flaggedEntityIds = new Set(Object.values(removed).flat());

        expect(
            getMarketplaceCleanupSafetyIssues({
                dataset,
                removed,
                districtAdminPatches: [],
                flaggedEntityIds,
            })
        ).toContain(issue);
    });

    it("fails closed when a surviving district patch would remove every admin", () => {
        expect(
            getMarketplaceCleanupSafetyIssues({
                dataset: emptyDataset(),
                removed: emptyRemovalManifest(),
                districtAdminPatches: [{ districtId: "district_survivor", adminIds: [] }],
                flaggedEntityIds: new Set(),
            })
        ).toEqual(["district_adminless:district_survivor"]);
    });
});
