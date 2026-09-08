import { seedReleaseRows, RELEASE_NAMESPACE } from "./lib/releaseFixtures";
import { BUILD_COMMIT } from "./buildIdentity";
import { encryptFile, validateFile } from "./lib/privateCrypto";
/** Internal-only synthetic staging fixtures. No user impersonation or auth bypass. */
import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id, TableNames } from "./_generated/dataModel";
import { assertBuildCommit, assertStagingEnvironment } from "./lib/staging";

const account = v.object({ alias: v.string(), email: v.string(), clerkId: v.string() });
const encryption = v.object({ sha256: v.string(), nonce: v.string(), keyId: v.string(), size: v.number() });
const file = v.object({ name: v.string(), base64: v.string() });
const receipt = v.object({ seeded: v.boolean(), count: v.number() });
const ALIASES = ["district-a", "consultant-a", "district-b", "consultant-b", "fresh-district", "fresh-consultant", "district-teammate", "consultant-unavailable", "consultant-reviewed", "review-admin"];
function namespace(value: string) {
    // Automation must use a separate deployment, not a namespace in human staging.
    if (!["human-review-v1", RELEASE_NAMESPACE].includes(value)) throw new Error("Unknown fixture namespace");
}

export const status = internalQuery({
    args: { namespace: v.string() }, returns: v.union(v.null(), v.object({ count: v.number(), createdAt: v.number() })),
    handler: async (ctx, args) => {
        assertStagingEnvironment(); namespace(args.namespace);
        const run = await ctx.db.query("qaRuns").withIndex("by_namespace", q => q.eq("namespace", args.namespace)).unique();
        return run ? { count: run.records.length, createdAt: run.createdAt } : null;
    },
});

export const seed = internalAction({
    args: { expectedCommit: v.optional(v.string()), namespace: v.string(), accounts: v.array(account), files: v.array(file) }, returns: receipt,
    handler: async (ctx, args): Promise<{ seeded: boolean; count: number }> => {
        assertStagingEnvironment(); assertBuildCommit(args.expectedCommit); namespace(args.namespace);
        const existing = await ctx.runQuery(internal.qa.status, { namespace: args.namespace });
        if (existing) return { seeded: false, count: existing.count };
        const storageIds: Id<"_storage">[] = [];
        const encryptedMetadata: Array<{ sha256: string; nonce: string; keyId: string; size: number }> = [];
        try {
            for (const file of args.files) {
                const bytes = Uint8Array.from(atob(file.base64), c => c.charCodeAt(0));
                if (bytes.length > 1024 * 1024) throw new Error("QA fixture too large");
                validateFile(bytes, { fileName: file.name, mimeType: "application/pdf", size: bytes.length, purpose: "agreement" });
                const encrypted = await encryptFile(bytes);
                storageIds.push(await ctx.storage.store(new Blob([encrypted.ciphertext], { type: "application/octet-stream" })));
                encryptedMetadata.push({ sha256: encrypted.sha256, nonce: encrypted.nonce, keyId: encrypted.keyId, size: bytes.length });
            }
            const result = await ctx.runMutation(internal.qa.seedRows, {
                expectedCommit: args.expectedCommit, namespace: args.namespace, accounts: args.accounts,
                files: args.files.map((f, i) => ({ name: f.name, storageId: storageIds[i], encryption: encryptedMetadata[i] })),
            });
            if (!result.seeded) for (const id of storageIds) await ctx.storage.delete(id);
            return result;
        } catch (error) {
            for (const id of storageIds) await ctx.storage.delete(id);
            throw error;
        }
    },
});

export const seedRows = internalMutation({
    args: { expectedCommit: v.optional(v.string()), namespace: v.string(), accounts: v.array(account), files: v.array(v.object({ name: v.string(), storageId: v.id("_storage"), encryption })) }, returns: receipt,
    handler: async (ctx, args) => {
        assertStagingEnvironment(); assertBuildCommit(args.expectedCommit); namespace(args.namespace);
        const old = await ctx.db.query("qaRuns").withIndex("by_namespace", q => q.eq("namespace", args.namespace)).unique();
        if (old) return { seeded: false, count: old.records.length };
        if (args.accounts.length !== ALIASES.length || ALIASES.some(alias => args.accounts.filter(a => a.alias === alias).length !== 1)) throw new Error("Exact QA roster required");
        if (args.files.length !== 6) throw new Error("Six marked synthetic PDFs required");
        if (args.namespace === RELEASE_NAMESPACE) return seedReleaseRows(ctx, args);
        const allowed = (process.env.QA_ALLOWED_CLERK_IDS ?? "").split(",");
        const now = Date.now();
        const users: Record<string, Id<"users">> = {};
        const educators: Record<string, Id<"educators">> = {};
        // Accounts, normal role rows, membership and profiles survive fixture reset.
        for (const a of args.accounts) {
            if (!allowed.includes(a.clerkId) || a.email !== `k12gig-staging-${a.alias}+clerk_test@example.com`) throw new Error("Unapproved QA identity");
            const existing = await ctx.db.query("users").withIndex("by_clerk_id", q => q.eq("clerkId", a.clerkId)).unique();
            const role = a.alias === "review-admin" ? "superadmin" as const : a.alias.includes("consultant") ? "educator" as const : a.alias === "district-teammate" ? "district_hr" as const : "district_admin" as const;
            if (existing && (existing.email !== a.email || existing.role !== role)) throw new Error("Existing account mismatch");
            users[a.alias] = existing?._id ?? await ctx.db.insert("users", {
                clerkId: a.clerkId, email: a.email, role, firstName: a.alias, lastName: "Synthetic QA",
                onboarded: !a.alias.startsWith("fresh-"), createdAt: now,
            });
            if (role === "educator" && !a.alias.startsWith("fresh-")) {
                const profile = await ctx.db.query("educators").withIndex("by_user_id", q => q.eq("userId", users[a.alias])).unique();
                educators[a.alias] = profile?._id ?? await ctx.db.insert("educators", {
                    userId: users[a.alias], headline: "SYNTHETIC QA - MICIP school improvement consultant",
                    bio: "Synthetic QA profile for school improvement and MICIP workflow review. This person does not provide real services.",
                    yearsExperience: 5, gradeLevelBands: ["all"], areasOfNeed: ["school_improvement"], subCategories: ["micip"],
                    engagementTypes: ["consulting"], coverageRegions: ["region_6"], stateLicenses: [],
                    verificationStatus: a.alias === "consultant-reviewed" ? "verified" : "unverified", availabilityStatus: a.alias === "consultant-unavailable" ? "closed" : a.alias === "consultant-b" ? "limited" : "open",
                    hourlyRate: 100, profileType: "individual", isActive: true, profileCompletePct: 100,
                });
            }
        }
        const reviewedId = educators["consultant-reviewed"];
        const existingCredentials = await ctx.db.query("credentials").withIndex("by_educator", q => q.eq("educatorId", reviewedId)).take(1);
        if (!existingCredentials.length) {
            const credentialId = await ctx.db.insert("credentials", { educatorId: reviewedId, type: "certification", title: "SYNTHETIC QA credential - not a real qualification", issuingBody: "Synthetic QA issuer", issueDate: new Date(now).toISOString().slice(0, 10), verified: true });
            await ctx.db.patch(reviewedId, { stateLicenses: [credentialId] });
            await ctx.db.insert("adminAuditEvents", { actorUserId: users["review-admin"], action: "qa_fixture_review", entityType: "educator", entityId: reviewedId, summary: "Synthetic review fixture only; no real credentials reviewed", createdAt: now });
        }
        const districts: Record<string, Id<"districts">> = {};
        for (const letter of ["a", "b"]) {
            const name = `Synthetic District ${letter.toUpperCase()}`;
            const rows = await ctx.db.query("districts").take(100);
            if (rows.length === 100) throw new Error("District safety bound exceeded");
            const found = rows.find(d => d.adminIds.includes(users[`district-${letter}`]));
            if (found && found.name !== name) throw new Error("Existing district mismatch");
            districts[letter] = found?._id ?? await ctx.db.insert("districts", {
                name, state: "MI", region: "region_6", planType: "free", createdAt: now,
                adminIds: letter === "a" ? [users["district-a"], users["district-teammate"]] : [users["district-b"]],
            });
        }
        const records: Array<{ table: string; id: string }> = [];
        const track = <T extends TableNames>(table: T, id: Id<T>) => { records.push({ table, id }); return id; };
        for (const f of args.files) records.push({ table: "_storage", id: f.storageId });
        const date = new Date(now + 30 * 86400000).toISOString().slice(0, 10);
        const createNeed = async (key: string, status: "draft" | "open" | "placed") => track("needs", await ctx.db.insert("needs", {
            districtId: districts.a, postedByUserId: users["district-a"], orgName: "Synthetic District A",
            areaOfNeed: "school_improvement", subCategory: "micip", gradeLevel: "all", engagementType: "consulting",
            startDate: date, duration: "8 weeks", compensationRange: "$100/hour - synthetic",
            description: `SYNTHETIC QA — NOT A REAL AGREEMENT. ${key}. MICIP school improvement planning and progress review for a fictional school.`,
            status, createdAt: now, updatedAt: now,
        }));
        const propose = async (needId: Id<"needs">, alias: string, status: "pending" | "accepted" | "rejected") => track("proposals", await ctx.db.insert("proposals", {
            needId, educatorId: educators[alias], educatorUserId: users[alias], message: "SYNTHETIC QA — NOT A REAL AGREEMENT. Proposal for testing only.",
            attachmentStorageId: args.files[alias === "consultant-a" ? 0 : 1].storageId, attachmentName: "synthetic-resume.pdf",
            proposedRate: 100, proposedRateUnit: "hourly", status, createdAt: now,
        }));
        await createNeed("draft incomplete logistics", "draft");
        const draft = records.find(r => r.table === "needs")!;
        await ctx.db.patch(draft.id as Id<"needs">, { startDate: undefined, compensationRange: undefined });
        const published = await createNeed("published with competing proposals", "open");
        await propose(published, "consultant-a", "pending"); await propose(published, "consultant-b", "pending");
        for (const [key, status] of [["accepted without agreement", "active"], ["agreement lifecycle cards", "in_progress"], ["completed engagement", "completed"], ["cancelled engagement", "cancelled"]] as const) {
            const needId = await createNeed(key, "placed");
            const proposalId = await propose(needId, "consultant-a", "accepted");
            const engagementId = track("engagements", await ctx.db.insert("engagements", {
                needId, proposalId, educatorId: educators["consultant-a"], educatorUserId: users["consultant-a"], districtId: districts.a,
                buyerUserId: users["district-a"], status, title: `SYNTHETIC QA - ${key}`, orgName: "Synthetic District A",
                areaOfNeed: "school_improvement", engagementType: "consulting", startDate: date, duration: "8 weeks", agreedRate: 100,
                agreedRateUnit: "hourly", createdAt: now, updatedAt: now,
            }));
            if (key === "agreement lifecycle cards") for (const [i, status] of (["draft", "sent", "signed_externally", "completed"] as const).entries()) {
                const contractId = track("contracts", await ctx.db.insert("contracts", {
                    engagementId, uploadedByUserId: users[i === 2 ? "consultant-a" : "district-a"], title: `SYNTHETIC QA - ${["Draft v1", "Shared v2", "Returned signed copy v3 (no real signature)", "Superseded v1 (scenario only)"][i]}`,
                    notes: "SYNTHETIC QA — NOT A REAL AGREEMENT. Independent document cards: the application has no version/current/superseded relationship. Complete is not superseded.",
                    status, storageId: args.files[i + 2].storageId, fileName: "consulting-agreement.pdf", createdAt: now + i, updatedAt: now + i,
                }));
                track("contractEvents", await ctx.db.insert("contractEvents", { contractId, actorUserId: users["district-a"], action: "qa_fixture_created", createdAt: now }));
            }
        }
        track("messages", await ctx.db.insert("messages", {
            conversationId: [users["district-b"], users["consultant-b"]].sort().join(":"), senderId: users["district-b"], recipientId: users["consultant-b"],
            content: "SYNTHETIC QA: message-only conversation; no engagement exists.", read: false, createdAt: now,
        }));
        track("qaEmailCaptures", await ctx.db.insert("qaEmailCaptures", {
            sourceId: "synthetic-failure", kind: "fixture", status: "simulated_failure", subject: "Synthetic provider failure; no external request made", appUrl: process.env.NEXT_PUBLIC_APP_URL!, createdAt: now,
        }));
        // Internal row finalization receives only encrypted storage receipts from seed.
        {
            for (const record of [...records]) {
                if (record.table === "contracts") {
                    const c = await ctx.db.get(record.id as Id<"contracts">); if (!c?.storageId) continue;
                    const f = args.files.find(x => x.storageId === c.storageId)!;
                    const privateFileId = track("privateFiles", await ctx.db.insert("privateFiles", { ownerUserId: c.uploadedByUserId, purpose: "agreement", engagementId: c.engagementId, storageId: f.storageId, fileName: c.fileName ?? f.name, mimeType: "application/pdf", ...f.encryption!, createdAt: c.createdAt }));
                    const versionId = track("agreementVersions", await ctx.db.insert("agreementVersions", { contractId: c._id, privateFileId, number: 1, kind: "original", uploadedByUserId: c.uploadedByUserId, fileName: c.fileName ?? f.name, createdAt: c.createdAt, legacyStatus: c.status, ...(c.status === "draft" ? {} : { sharedAt: c.createdAt, sharedByUserId: c.uploadedByUserId }) }));
                    await ctx.db.patch(c._id, { managed: true, revision: 1, privateFileId, currentSharedVersionId: c.status === "draft" ? undefined : versionId, storageId: undefined });
                } else if (record.table === "proposals") {
                    const p = await ctx.db.get(record.id as Id<"proposals">); if (!p?.attachmentStorageId) continue;
                    const f = args.files.find(x => x.storageId === p.attachmentStorageId)!;
                    const privateFileId = track("privateFiles", await ctx.db.insert("privateFiles", { ownerUserId: p.educatorUserId, purpose: "proposal", needId: p.needId, storageId: f.storageId, fileName: p.attachmentName ?? f.name, mimeType: "application/pdf", ...f.encryption!, createdAt: p.createdAt }));
                    await ctx.db.patch(p._id, { attachmentPrivateFileId: privateFileId, attachmentStorageId: undefined });
                }
            }
        }
        await ctx.db.insert("qaRuns", { namespace: args.namespace, records, createdAt: now });
        return { seeded: true, count: records.length };
    },
});

export const captureNotification = internalMutation({
    args: { kind: v.string(), sourceId: v.string(), payload: v.optional(v.string()) }, returns: v.null(),
    handler: async (ctx, args) => {
        assertStagingEnvironment();
        const table = args.kind.includes("Message") ? "messages" : args.kind.includes("Proposal") ? "proposals" : args.kind.includes("Need") ? "needs" : "orders";
        const id = ctx.db.normalizeId(table, args.sourceId);
        if (!id || !await ctx.db.get(id)) return null; // reset/deletion invalidates delayed sends
        await ctx.db.insert("qaEmailCaptures", { ...args, status: "captured", subject: `Captured ${args.kind}`, appUrl: process.env.NEXT_PUBLIC_APP_URL!, createdAt: Date.now() });
        return null;
    },
});

export const reset = internalMutation({
    args: { expectedCommit: v.optional(v.string()), namespace: v.string(), confirmation: v.literal("RESET_IDENTIFIED_QA_FIXTURES") }, returns: v.object({ deleted: v.number(), cancelledJobs: v.number() }),
    handler: async (ctx, args) => {
        assertStagingEnvironment(); assertBuildCommit(args.expectedCommit); namespace(args.namespace);
        const run = await ctx.db.query("qaRuns").withIndex("by_namespace", q => q.eq("namespace", args.namespace)).unique();
        if (!run) return { deleted: 0, cancelledJobs: 0 };
        const records = [...run.records];
        const ids = new Set(records.map(r => r.id));
        const outbox = await ctx.db.query("deliveryOutbox").take(500);
        if (outbox.length === 500) throw new Error("Outbox reset safety bound exceeded");
        for (const job of outbox) if (ids.has(job.sourceId)) {
            records.push({ table: "deliveryOutbox", id: job._id }); ids.add(job._id);
            if (job.notificationId) { records.push({ table: "notifications", id: job.notificationId }); ids.add(job.notificationId); }
            for (const attempt of await ctx.db.query("deliveryAttempts").withIndex("by_outbox", q => q.eq("outboxId", job._id)).collect()) { records.push({ table: "deliveryAttempts", id: attempt._id }); ids.add(attempt._id); }
        }
        const referencesFixture = (value: unknown): boolean => typeof value === "string" ? ids.has(value) : Array.isArray(value) ? value.some(referencesFixture) : !!value && typeof value === "object" ? Object.values(value).some(referencesFixture) : false;
        // Never orphan reviewer-created records. Refuse reset if they depend on fixtures.
        for (const table of ["users", "needs", "proposals", "engagements", "contracts", "contractEvents", "messages", "credentials", "credentialReviewRecords", "educators", "orders", "reviews", "agreementVersions", "privateFiles", "uploadTickets", "operationReceipts", "engagementEvents", "privateMigration"] as const) {
            const rows = await ctx.db.query(table).take(500);
            if (rows.length === 500) throw new Error("Reset safety scan bound exceeded");
            if (rows.some(r => !ids.has(r._id) && referencesFixture(r))) throw new Error(`Reset refused: unrelated ${table} record references fixtures`);
        }
        const jobs = await ctx.db.system.query("_scheduled_functions").take(500);
        if (jobs.length === 500) throw new Error("Scheduler safety scan bound exceeded");
        let cancelledJobs = 0;
        for (const job of jobs) if (referencesFixture(job.args) && job.state.kind === "pending") { await ctx.scheduler.cancel(job._id); cancelledJobs++; }
        for (const table of ["qaEmailCaptures"] as const) {
            const rows = await ctx.db.query(table).take(500);
            if (rows.length === 500) throw new Error("Capture safety scan bound exceeded");
            for (const row of rows) if (!ids.has(row._id) && ids.has(row.sourceId)) await ctx.db.delete(row._id);
        }
        for (const row of records.reverse()) {
            if (row.table === "_storage") { if (await ctx.db.system.get(row.id as Id<"_storage">)) await ctx.storage.delete(row.id as Id<"_storage">); }
            else await ctx.db.delete(row.id as Id<TableNames>);
        }
        await ctx.db.delete(run._id);
        return { deleted: records.length, cancelledJobs };
    },
});

export const environment = internalQuery({
    args: {}, returns: v.object({ convexUrl: v.string(), clerkIssuer: v.string(), appUrl: v.string(), emailMode: v.literal("capture"), reviewers: v.number(), buildCommit: v.string(), convexDeployment: v.string() }),
    handler: async () => {
        assertStagingEnvironment();
        return { buildCommit: BUILD_COMMIT, convexDeployment: assertStagingEnvironment().convexDeployment, convexUrl: process.env.CONVEX_CLOUD_URL!, clerkIssuer: process.env.CLERK_JWT_ISSUER_DOMAIN!, appUrl: process.env.NEXT_PUBLIC_APP_URL!, emailMode: "capture" as const, reviewers: (process.env.QA_ALLOWED_CLERK_IDS ?? "").split(",").length };
    },
});

export const emailCaptures = internalQuery({
    args: {}, returns: v.array(v.object({ _id: v.id("qaEmailCaptures"), _creationTime: v.number(), sourceId: v.string(), kind: v.string(), status: v.string(), subject: v.string(), appUrl: v.string(), createdAt: v.number(), payload: v.optional(v.string()) })),
    handler: async (ctx) => { assertStagingEnvironment(); return await ctx.db.query("qaEmailCaptures").order("desc").take(100); },
});

export const messageFixtureId = internalQuery({
    args: {}, returns: v.union(v.id("messages"), v.null()),
    handler: async (ctx) => {
        assertStagingEnvironment();
        const run = await ctx.db.query("qaRuns").withIndex("by_namespace", q => q.eq("namespace", "human-review-v1")).unique();
        return (run?.records.find(r => r.table === "messages")?.id as Id<"messages"> | undefined) ?? null;
    },
});

/** Internal operator fixture; never an auth bypass or a real provider failure claim. */
export const deliveryFixtures = internalMutation({
 args: { namespace: v.literal('release-candidate-v1'), expectedCommit: v.string(), confirmation: v.literal('SIMULATE_CAPTURE_ONLY_DELIVERY') },
 handler: async (ctx,args) => {
  if (assertStagingEnvironment().convexDeployment !== "dapper-curlew-192") throw new Error("Delivery fault fixtures require exact automation deployment");
  namespace(args.namespace); assertBuildCommit(args.expectedCommit);
  const run=await ctx.db.query('qaRuns').withIndex('by_namespace',q=>q.eq('namespace',args.namespace)).unique();
  const source=run?.records.find(r=>r.table==='contracts');
  if (!source) throw new Error('Seed release fixtures first');
  const contract=await ctx.db.get('contracts', source.id as Id<'contracts'>); const e=contract?await ctx.db.get("engagements", contract.engagementId):null;
  if (!e) throw new Error('Fixture source missing');
  const result: Id<'deliveryOutbox'>[]=[];
  for (const state of ['failed','queued'] as const) {
   const eventKey=`synthetic-release-fault:${state}:${source.id}`;
   const old=await ctx.db.query('deliveryOutbox').withIndex('by_key',q=>q.eq('eventKey',eventKey).eq('recipientUserId',e.educatorUserId)).unique();
   if (old) { result.push(old._id); continue; }
   const now=Date.now();
   const notificationId=await ctx.db.insert('notifications',{userId:e.educatorUserId,type:'synthetic_delivery_fixture',title:`SYNTHETIC QA - ${state} delivery`,body:'Simulated failure/queue fixture. No provider request was made.',actionUrl:`/dashboard/engagements/${e._id}`,read:false,createdAt:now});
   const outboxId=await ctx.db.insert('deliveryOutbox',{eventKey,sourceId:source.id,recipientUserId:e.educatorUserId,notificationId,title:`SYNTHETIC QA - ${state} delivery`,body:'Induced test condition; not a real provider rejection.',actionUrl:`/dashboard/engagements/${e._id}`,state,attempts:state==='failed'?1:0,firstAttemptAt:state==='failed'?now:undefined,lastError:state==='failed'?'SIMULATED provider failure; no external request':undefined,createdAt:now,updatedAt:now});
   if (state==='failed') await ctx.db.insert('deliveryAttempts',{outboxId,attempt:1,state:'failed',error:'SIMULATED provider failure; no external request',createdAt:now});
   result.push(outboxId);
  }
  return {failedId:result[0],queuedId:result[1]};
 },
});
