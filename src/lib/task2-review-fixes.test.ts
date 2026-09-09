// @vitest-environment node
import { describe, expect, it } from "vitest";
import { api } from "../../convex/_generated/api";
import { seeded } from "./release-test-fixture";

describe("Task 2 server-derived UI capabilities", () => {
    it("emits the canonical agreement notification route with agreement and version context", async () => {
        const { t, as, rows } = await seeded();
        const engagement = rows.engagements[0];
        const owner = rows.users.find((user) => user._id === engagement.buyerUserId)!;
        const privateFileId = await t.run(async (ctx) => ctx.db.insert("privateFiles", {
            ownerUserId: owner._id,
            purpose: "agreement",
            engagementId: engagement._id,
            storageId: await ctx.storage.store(new Blob(["synthetic encrypted file"])),
            fileName: "scope.pdf",
            mimeType: "application/pdf",
            size: 24,
            sha256: "ab".repeat(32),
            nonce: "cd".repeat(12),
            keyId: "test",
            createdAt: Date.now(),
        }));
        const draft = await as("district-a").mutation(api.agreementVersions.createDraft, { engagementId: engagement._id, title: "Scope", privateFileId, requestId: "task2-notification-create" });
        await as("district-a").mutation(api.agreementVersions.share, { contractId: draft.contractId, versionId: draft.versionId, expectedRevision: 1, requestId: "task2-notification-share" });

        const notification = await t.run((ctx) => ctx.db.query("notifications").withIndex("by_user", (q) => q.eq("userId", engagement.educatorUserId)).filter((q) => q.eq(q.field("type"), "agreement_shared")).unique());

        expect(notification?.actionUrl).toBe(`/dashboard/engagements/${engagement._id}?agreement=${draft.contractId}&version=${draft.versionId}`);
    });

    it("marks a district teammate as a private party and an unrelated administrator as outside the party", async () => {
        const { as, rows } = await seeded();
        const engagementId = rows.engagements[0]._id;

        const teammateRows = await as("district-teammate").query(api.engagements.listMine, { includeArchived: true });
        const adminDetail = await as("review-admin").query(api.engagements.getById, { engagementId });

        expect(teammateRows.find((row) => row._id === engagementId)?.partyAccess).toBe(true);
        expect(adminDetail?.engagement.partyAccess).toBe(false);
    });

    it("offers delivery retry only to the failed job recipient", async () => {
        const { t, as, rows } = await seeded();
        const engagement = rows.engagements[0];
        const outboxId = await t.run((ctx) => ctx.db.insert("deliveryOutbox", {
            eventKey: "task2-review-delivery",
            sourceId: engagement._id,
            recipientUserId: engagement.educatorUserId,
            title: "Agreement update",
            body: "Review the agreement",
            actionUrl: `/dashboard/engagements/${engagement._id}`,
            state: "failed",
            attempts: 1,
            firstAttemptAt: Date.now(),
            lastError: "Synthetic failure",
            createdAt: Date.now(),
            updatedAt: Date.now(),
        }));

        const recipientView = await as("consultant-a").query(api.delivery.listForEngagement, { engagementId: engagement._id });
        const teammateView = await as("district-teammate").query(api.delivery.listForEngagement, { engagementId: engagement._id });

        expect(recipientView.find((row) => row.outboxId === outboxId)?.canRetry).toBe(true);
        expect(teammateView.find((row) => row.outboxId === outboxId)?.canRetry).toBe(false);
    });
});
