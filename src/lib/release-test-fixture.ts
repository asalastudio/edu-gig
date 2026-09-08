vi.mock("../../convex/buildIdentity", () => ({ BUILD_COMMIT: "a".repeat(40) }));
import { beforeEach, afterEach, vi } from "vitest";
import { convexTest } from "convex-test";
import schema from "../../convex/schema";
import { internal } from "../../convex/_generated/api";
import resources from "../../scripts/staging/resources.json";
export const modules = import.meta.glob("../../convex/**/*.{ts,js}");
const aliases = ["district-a", "consultant-a", "district-b", "consultant-b", "fresh-district", "fresh-consultant", "district-teammate", "consultant-unavailable", "consultant-reviewed", "review-admin"];
export const accounts = aliases.map((alias, i) => ({ alias, email: `k12gig-staging-${alias}+clerk_test@example.com`, clerkId: `user_test${i}` }));
const namespace = "human-review-v1";
beforeEach(() => {
    vi.stubEnv("APP_ENV", "staging"); vi.stubEnv("CONVEX_CLOUD_URL", resources.convexUrl);
    vi.stubEnv("QA_CONVEX_DEPLOYMENT", resources.convexDeployment); vi.stubEnv("QA_CLERK_INSTANCE_ID", resources.clerkInstanceId);
    vi.stubEnv("CLERK_JWT_ISSUER_DOMAIN", resources.clerkIssuer); vi.stubEnv("NEXT_PUBLIC_APP_URL", resources.appUrl);
    vi.stubEnv("QA_EMAIL_MODE", "capture"); vi.stubEnv("QA_ALLOWED_CLERK_IDS", accounts.map(a => a.clerkId).join(","));
    for (const name of ["RESEND_API_KEY", "STRIPE_SECRET_KEY", "CHECKR_API_KEY"]) vi.stubEnv(name, "");
});
afterEach(() => vi.unstubAllEnvs());
export async function seeded() {
    const t = convexTest(schema, modules);
    const files = await t.run(async ctx => Promise.all(Array.from({ length: 6 }, async (_, i) => ({ name: `synthetic-${i}.pdf`, storageId: await ctx.storage.store(new Blob(["SYNTHETIC QA — NOT A REAL AGREEMENT"])), encryption: { sha256: "ab".repeat(32), nonce: "cd".repeat(12), keyId: "synthetic-legacy-test", size: 42 } }))));
    await t.mutation(internal.qa.seedRows, { expectedCommit: "a".repeat(40), namespace, accounts, files });
    // Shape historical records inside the test harness only. Production seedRows
    // always requires encrypted receipts; legacy-row tests do not add a production bypass.
    await t.run(async ctx => {
        const versions = await ctx.db.query("agreementVersions").collect();
        const privateFiles = await ctx.db.query("privateFiles").collect();
        for (const c of await ctx.db.query("contracts").collect()) {
            const f = privateFiles.find(f => f._id === c.privateFileId)!;
            await ctx.db.patch(c._id, { storageId: f.storageId, managed: undefined, revision: undefined, currentSharedVersionId: undefined, privateFileId: undefined });
        }
        for (const p of await ctx.db.query("proposals").collect()) {
            const f = privateFiles.find(f => f._id === p.attachmentPrivateFileId)!;
            await ctx.db.patch(p._id, { attachmentStorageId: f.storageId, attachmentPrivateFileId: undefined });
        }
        for (const v of versions) await ctx.db.delete(v._id);
        for (const f of privateFiles) await ctx.db.delete(f._id);
        const run = await ctx.db.query("qaRuns").first();
        await ctx.db.patch(run!._id, { records: run!.records.filter(r => !["privateFiles", "agreementVersions"].includes(r.table)) });
    });
    const rows = await t.run(async ctx => ({ users: await ctx.db.query("users").collect(), engagements: await ctx.db.query("engagements").collect(), contracts: await ctx.db.query("contracts").collect(), messages: await ctx.db.query("messages").collect(), proposals: await ctx.db.query("proposals").collect() }));
    const as = (alias: string) => t.withIdentity({ subject: accounts.find(a => a.alias === alias)!.clerkId, issuer: resources.clerkIssuer });
    return { t, files, rows, as };
}
