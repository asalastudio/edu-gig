import { engagementAccess } from "./lib/releaseDomain";
import { v } from "convex/values";
import { internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { authedMutation, authedQuery } from "./lib/customFunctions";
import { sourceExists } from "./lib/outbox";
import { assertStagingEnvironment } from "./lib/staging";
const MAX_ATTEMPTS = 3;
const LEASE_MS = 60_000;
const escapeHtml = (s: string) => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
export const claim = internalMutation({
 args: { outboxId: v.id("deliveryOutbox"), token: v.string() },
 handler: async (ctx, args) => {
  const job = await ctx.db.get(args.outboxId); if (!job) return null;
  if (!await sourceExists(ctx, job.sourceId)) { await ctx.db.patch(job._id, { state: "invalidated", updatedAt: Date.now() }); return null; }
  if (["captured", "provider_accepted", "invalidated", "suppressed"].includes(job.state) || (job.state === "sending" && (job.leaseUntil ?? 0) > Date.now())) return null;
  const firstAttemptAt = job.firstAttemptAt ?? (job.attempts > 0 ? job.createdAt : Date.now());
  if (job.attempts > 0 && Date.now() - firstAttemptAt >= 23 * 60 * 60_000) {
   await ctx.db.patch(job._id, { state: "failed", leaseToken: undefined, leaseUntil: undefined, lastError: "Provider idempotency window elapsed; manual reconciliation required", updatedAt: Date.now() });
   return null;
  }
  if (job.attempts >= MAX_ATTEMPTS) {
   if (job.state === "sending") {
    await ctx.db.patch(job._id, { state: "failed", leaseToken: undefined, leaseUntil: undefined, lastError: "Delivery outcome uncertain; retry limit exhausted", updatedAt: Date.now() });
    await ctx.db.insert("deliveryAttempts", { outboxId: job._id, attempt: job.attempts, state: "failed", error: "Delivery outcome uncertain; retry limit exhausted", createdAt: Date.now() });
   }
   return null;
  }
  const recipient = await ctx.db.get(job.recipientUserId);
  if (!recipient) { await ctx.db.patch(job._id, { state: "invalidated", updatedAt: Date.now() }); return null; }
  let payload = job.payload;
  if (!payload) {
   const origin = process.env.NEXT_PUBLIC_APP_URL;
   if (!origin || new URL(origin).origin !== origin || !job.actionUrl.startsWith("/") || job.actionUrl.startsWith("//")) {
    await ctx.db.patch(job._id, { state: "failed", lastError: "Delivery origin unavailable", updatedAt: Date.now() }); return null;
   }
   const url = `${origin}${job.actionUrl}`;
   payload = JSON.stringify({ from: process.env.RESEND_FROM_EMAIL || "K12Gig <support@k12gig.com>", to: [recipient.email], subject: job.title, text: `${job.body}\n\n${url}`, html: `<p>${escapeHtml(job.body)}</p><p><a href="${escapeHtml(url)}">Open K12Gig</a></p>` });
  }
  const attempt = job.attempts + 1;
  await ctx.db.patch(job._id, { payload, firstAttemptAt, state: "sending", attempts: attempt, leaseToken: args.token, leaseUntil: Date.now() + LEASE_MS, updatedAt: Date.now() });
  await ctx.db.insert("deliveryAttempts", { outboxId: job._id, attempt, state: "sending", createdAt: Date.now() });
  // Recover an action that dies after claim, retaining the same provider key.
  await ctx.scheduler.runAfter(LEASE_MS + 1, internal.delivery.dispatch, { outboxId: job._id });
  return { ...job, payload, attempts: attempt };
 },
});
export const finish = internalMutation({
 args: { outboxId: v.id("deliveryOutbox"), token: v.string(), outcome: v.union(v.literal("captured"), v.literal("provider_accepted"), v.literal("failed")), error: v.optional(v.string()), providerId: v.optional(v.string()), payload: v.optional(v.string()) },
 handler: async (ctx, args) => {
  const job = await ctx.db.get(args.outboxId);
  if (!job || job.leaseToken !== args.token || job.state !== "sending") return null;
  if (!await sourceExists(ctx, job.sourceId)) { await ctx.db.patch(job._id, { state: "invalidated", updatedAt: Date.now() }); return null; }
  await ctx.db.patch(job._id, { state: args.outcome, lastError: args.error, providerId: args.providerId, leaseUntil: undefined, leaseToken: undefined, updatedAt: Date.now() });
  await ctx.db.insert("deliveryAttempts", { outboxId: job._id, attempt: job.attempts, state: args.outcome, error: args.error, createdAt: Date.now() });
  if (args.outcome === "captured") {
   assertStagingEnvironment();
   await ctx.db.insert("qaEmailCaptures", { sourceId: job.sourceId, kind: job.eventKey, status: "captured", subject: job.title, appUrl: process.env.NEXT_PUBLIC_APP_URL!, payload: args.payload, createdAt: Date.now() });
  }
  if (args.outcome === "failed" && job.attempts < MAX_ATTEMPTS) await ctx.scheduler.runAfter(2 ** job.attempts * 1000, internal.delivery.dispatch, { outboxId: job._id });
  return null;
 },
});
export const dispatch = internalAction({
 args: { outboxId: v.id("deliveryOutbox") },
 handler: async (ctx, args): Promise<void> => {
  const token = crypto.randomUUID(); const job = await ctx.runMutation(internal.delivery.claim, { ...args, token }); if (!job) return;
  try {
   if (process.env.APP_ENV === "staging") {
    assertStagingEnvironment();
    await ctx.runMutation(internal.delivery.finish, { ...args, token, outcome: "captured", payload: job.payload }); return;
   }
   if (!process.env.RESEND_API_KEY) throw new Error("Email provider not configured");
   const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": `k12gig:${job._id}` }, body: job.payload });
   if (!response.ok) throw new Error(`Email provider HTTP ${response.status}`);
   const result = await response.json() as { id?: string };
   await ctx.runMutation(internal.delivery.finish, { ...args, token, outcome: "provider_accepted", providerId: result.id });
  } catch (error) {
   await ctx.runMutation(internal.delivery.finish, { ...args, token, outcome: "failed", error: error instanceof Error ? error.message.slice(0, 240) : "Delivery failed" });
  }
 },
});
export const listMine = authedQuery({ args: {}, handler: async ctx => {
 const jobs = await ctx.db.query("deliveryOutbox").withIndex("by_recipient", q => q.eq("recipientUserId", ctx.user._id)).order("desc").take(200);
 return await Promise.all(jobs.map(async j => ({ ...j, history: await ctx.db.query("deliveryAttempts").withIndex("by_outbox", q => q.eq("outboxId", j._id)).collect() })));
} });
export const retry = authedMutation({ args: { outboxId: v.id("deliveryOutbox") }, handler: async (ctx, args) => {
 const job = await ctx.db.get(args.outboxId);
 if (!job || job.recipientUserId !== ctx.user._id) throw new Error("Forbidden");
 if (job.state !== "failed" || job.attempts >= MAX_ATTEMPTS || (job.attempts > 0 && Date.now() - (job.firstAttemptAt ?? job.createdAt) >= 23 * 60 * 60_000)) throw new Error("Retry unavailable");
 await ctx.scheduler.runAfter(0, internal.delivery.dispatch, args); return job._id;
} });

/** Compatibility bridge for already-scheduled pre-release transactional actions. */
export const enqueueLegacy = internalMutation({
 args: { kind: v.string(), sourceId: v.string(), subject: v.string(), text: v.string(), recipientEmail: v.string() },
 handler: async (ctx, args) => {
  if (!await sourceExists(ctx, args.sourceId)) return null;
  const user = await ctx.db.query("users").withIndex("by_email", q => q.eq("email", args.recipientEmail)).first();
  if (!user) return null;
  const prefix = args.kind === "sendNewMessageAlert" ? "message" : args.kind === "sendNewProposalAlert" ? "proposal" : args.kind === "sendProposalAcceptedAlert" ? "proposal-accepted" : "need";
  const eventKey = `${prefix}:${args.sourceId}`;
  const prior = await ctx.db.query("deliveryOutbox").withIndex("by_key", q => q.eq("eventKey", eventKey).eq("recipientUserId", user._id)).unique(); if (prior) return prior._id;
  let actionUrl = "/dashboard";
  if (prefix === "message") {
   const messageId = ctx.db.normalizeId("messages", args.sourceId); const message = messageId ? await ctx.db.get(messageId) : null;
   if (message) actionUrl = `/dashboard/messages?to=${message.senderId}`;
  } else if (prefix === "need") actionUrl = `/dashboard/board/${args.sourceId}/propose`;
  else {
   const proposalId = ctx.db.normalizeId("proposals", args.sourceId); const proposal = proposalId ? await ctx.db.get(proposalId) : null;
   if (proposal) {
    const engagement = await ctx.db.query("engagements").withIndex("by_proposal", q => q.eq("proposalId", proposal._id)).first();
    actionUrl = prefix === "proposal-accepted" && engagement ? `/dashboard/engagements/${engagement._id}` : `/dashboard/district/needs/${proposal.needId}`;
   }
  }
  // Original mutations already created their in-app notification. Do not insert it again.
  const id = await ctx.db.insert("deliveryOutbox", { eventKey, sourceId: args.sourceId, recipientUserId: user._id, title: args.subject, body: args.text, actionUrl, state: "queued", attempts: 0, createdAt: Date.now(), updatedAt: Date.now() });
  await ctx.scheduler.runAfter(0, internal.delivery.dispatch, { outboxId: id }); return id;
 },
});

export const listForEngagement = authedQuery({ args: { engagementId: v.id("engagements") }, handler: async (ctx, args) => {
 const e = await engagementAccess(ctx, args.engagementId);
 const contracts = await ctx.db.query("contracts").withIndex("by_engagement", q => q.eq("engagementId", e._id)).collect();
 const sourceIds = [e._id, e.proposalId, ...contracts.map(c => c._id)]; const result = [];
 for (const sourceId of sourceIds) for (const job of await ctx.db.query("deliveryOutbox").withIndex("by_source", q => q.eq("sourceId", sourceId)).collect()) {
  result.push({ outboxId: job._id, eventKey: job.eventKey, state: job.state, title: job.title, attempts: job.attempts, lastError: job.lastError, createdAt: job.createdAt, updatedAt: job.updatedAt, history: await ctx.db.query("deliveryAttempts").withIndex("by_outbox", q => q.eq("outboxId", job._id)).collect() });
 }
 return result.sort((a,b) => b.createdAt-a.createdAt);
} });
