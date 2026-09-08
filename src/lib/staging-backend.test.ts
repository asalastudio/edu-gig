// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { convexTest } from "convex-test";
import schema from "../../convex/schema";
import { api, internal } from "../../convex/_generated/api";
import resources from "../../scripts/staging/resources.json";
import { seeded, accounts, modules } from "./release-test-fixture";
const namespace = "human-review-v1";
describe("isolated staging backend (in-memory; no live fixtures touched)", () => {
    it("seeds twice without duplicates and resets only fixture records, preserving accounts/memberships", async () => {
        const { t, files, rows } = await seeded();
        const before = await t.query(internal.qa.status, { namespace });
        expect(await t.mutation(internal.qa.seedRows, { namespace, accounts, files })).toEqual({ seeded: false, count: before!.count });
        const unrelated = await t.run(ctx => ctx.db.insert("notifications", { userId: rows.users[0]._id, type: "test", title: "unrelated", body: "keep", read: false, createdAt: Date.now() }));
        await t.mutation(internal.qa.reset, { namespace, confirmation: "RESET_IDENTIFIED_QA_FIXTURES" });
        expect(await t.run(ctx => ctx.db.query("users").collect())).toHaveLength(10);
        expect(await t.run(ctx => ctx.db.query("districts").collect())).toHaveLength(2);
        expect(await t.run(ctx => ctx.db.query("contracts").collect())).toHaveLength(0);
        expect(await t.run(ctx => ctx.db.get(unrelated))).not.toBeNull();
    });
    it("rejects production, ambiguous backends, foreign Clerk and external delivery configuration", async () => {
        const t = convexTest(schema, modules);
        for (const [key, value] of [["APP_ENV", "production"], ["CONVEX_CLOUD_URL", `https://${resources.productionConvexDeployment}.convex.cloud`], ["CLERK_JWT_ISSUER_DOMAIN", resources.productionClerkIssuer], ["RESEND_API_KEY", "unexpected"]]) {
            const old = process.env[key]; vi.stubEnv(key, value);
            await expect(t.mutation(internal.qa.reset, { namespace, confirmation: "RESET_IDENTIFIED_QA_FIXTURES" })).rejects.toThrow("mismatch");
            vi.stubEnv(key, old);
        }
    });
    it("denies unrelated districts/consultants every contract operation and permits the real district teammate", async () => {
        const { rows, as } = await seeded(); const c = rows.contracts[0];
        for (const alias of ["district-b", "consultant-b"]) {
            const caller = as(alias);
            await expect(caller.query(api.contracts.listForEngagement, { engagementId: c.engagementId })).rejects.toThrow("Forbidden");
            await expect(caller.query(api.contracts.getFileUrl, { contractId: c._id })).rejects.toThrow("Forbidden");
            await expect(caller.query(api.contracts.listEvents, { contractId: c._id })).rejects.toThrow("Forbidden");
            await expect(caller.mutation(api.contracts.generateUploadUrl, { engagementId: c.engagementId })).rejects.toThrow("Forbidden");
            await expect(caller.mutation(api.contracts.create, { engagementId: c.engagementId, title: "invalid" })).rejects.toThrow("Forbidden");
            await expect(caller.mutation(api.contracts.updateStatus, { contractId: c._id, status: "completed" })).rejects.toThrow("Forbidden");
            await expect(caller.query(api.engagements.getById, { engagementId: c.engagementId })).rejects.toThrow("Forbidden");
            await expect(caller.mutation(api.engagements.setStatus, { engagementId: c.engagementId, status: "cancelled" })).rejects.toThrow("Forbidden");
            expect(await caller.query(api.contracts.listMine, {})).toHaveLength(0);
        }
        expect(await as("district-teammate").query(api.contracts.listForEngagement, { engagementId: c.engagementId })).toHaveLength(4);
    });
    it("denies unknown identities and unrelated conversation reads", async () => {
        const { t, as, rows } = await seeded();
        await expect(t.withIdentity({ subject: "user_intruder" }).query(api.users.viewer, {})).rejects.toThrow("reviewer");
        await expect(as("district-a").query(api.messages.listConversation, { conversationId: rows.messages[0].conversationId })).rejects.toThrow("Forbidden");
    });
    it("refuses reset when reviewer-created records depend on fixtures", async () => {
        const { t, rows, as } = await seeded();
        await as("district-a").mutation(api.contracts.create, { engagementId: rows.engagements[0]._id, title: "Reviewer work to preserve" });
        await expect(t.mutation(internal.qa.reset, { namespace, confirmation: "RESET_IDENTIFIED_QA_FIXTURES" })).rejects.toThrow("unrelated contracts");
        expect(await t.query(internal.qa.status, { namespace })).not.toBeNull();
    });
    it("does not capture delayed notifications whose source was reset", async () => {
        const { t, rows } = await seeded();
        await t.mutation(internal.qa.reset, { namespace, confirmation: "RESET_IDENTIFIED_QA_FIXTURES" });
        await t.mutation(internal.qa.captureNotification, { sourceId: rows.messages[0]._id, kind: "sendNewMessageAlert" });
        expect(await t.run(ctx => ctx.db.query("qaEmailCaptures").collect())).toHaveLength(0);
    });
    it("rejects unrelated message context after the release authorization repair", async () => {
        const { as, rows } = await seeded();
        const unrelated = rows.users.find(u => u.firstName === "consultant-b")!;
        // Both context parties must belong to the engagement.
        await expect(as("district-b").mutation(api.messages.send, { recipientUserId: unrelated._id, content: "Synthetic negative test", engagementId: rows.engagements[0]._id })).rejects.toThrow("Forbidden");
    });
});

describe('staging notification and acceptance execution', () => {
    it('captures rendered email with staging links and makes no provider request', async () => {
        const { t, rows } = await seeded();
        const send = vi.spyOn(globalThis, 'fetch');
        await t.action(internal.emails.sendNewMessageAlert, { messageId: rows.messages[0]._id });
        const captures = await t.run(ctx => ctx.db.query('qaEmailCaptures').collect());
        const capture = captures.find(c => c.sourceId === rows.messages[0]._id)!;
        expect(capture.status).toBe('captured');
        expect(capture.payload).toContain(`${resources.appUrl}/dashboard/messages`);
        expect(send).not.toHaveBeenCalled(); send.mockRestore();
    });
    it('cancels only scheduled work referencing reset fixtures', async () => {
        vi.useFakeTimers();
        try {
            const { t, rows } = await seeded();
            const id = await t.run(ctx => ctx.scheduler.runAfter(60_000, internal.emails.sendNewMessageAlert, { messageId: rows.messages[0]._id }));
            const result = await t.mutation(internal.qa.reset, { namespace, confirmation: 'RESET_IDENTIFIED_QA_FIXTURES' });
            expect(result.cancelledJobs).toBe(1);
            expect((await t.run(ctx => ctx.db.system.get(id)))?.state.kind).toBe('canceled');
        } finally { vi.useRealTimers(); }
    });
    it('accepts once transactionally, rejects competitors and replays duplicate acceptance', async () => {
        vi.useFakeTimers();
        try {
            const { t, as, rows } = await seeded();
            const pending = rows.proposals.filter(p => p.status === 'pending');
            const district = as('district-a');
            const accepted = await district.mutation(api.proposals.accept, { proposalId: pending[0]._id });
            expect(await district.mutation(api.proposals.accept, { proposalId: pending[0]._id })).toEqual(accepted);
            await expect(district.mutation(api.proposals.accept, { proposalId: pending[1]._id })).rejects.toThrow('pending');
            expect((await t.run(ctx => ctx.db.get(pending[1]._id)))?.status).toBe('rejected');
            expect(await t.run(ctx => ctx.db.query('engagements').withIndex('by_need', q => q.eq('needId', pending[0].needId)).collect())).toHaveLength(1);
            await t.finishAllScheduledFunctions(vi.runAllTimers);
        } finally { vi.useRealTimers(); }
    });
});

describe('document ownership characterization', () => {
    it('rejects raw storage IDs even when engagement access is legitimate', async () => {
        const { t, as, rows, files } = await seeded();
        const b = rows.users.find(u => u.firstName === 'district-b')!;
        const c = rows.users.find(u => u.firstName === 'consultant-b')!;
        const foreignEngagement = await t.run(async ctx => {
            const original = await ctx.db.get(rows.engagements[0]._id);
            const { _id, _creationTime, ...copy } = original!;
            void _id; void _creationTime;
            return await ctx.db.insert('engagements', { ...copy, buyerUserId: b._id, educatorUserId: c._id, districtId: undefined });
        });
        // Own-engagement access is insufficient to attach another upload.
        await expect(as('district-b').mutation(api.contracts.create, { engagementId: foreignEngagement, title: 'Synthetic relink probe', storageId: files[2].storageId })).rejects.toThrow('raw storage');
    });
});
