/**
 * Educator credential CRUD backed by Convex file storage.
 *
 * STORAGE NOTE (documentUrl vs. storageId):
 *   The `credentials` table schema (schema.ts) defines `documentUrl: v.optional(v.string())`
 *   and has no `storageId` field. Because schema.ts is out-of-bounds for this feature,
 *   we use `documentUrl` to hold the raw Convex storage ID (a string).
 *
 *   When a row is written via `finalizeUpload`, `documentUrl` contains the storageId.
 *   Readers should NEVER treat this string as a public URL. To display a file,
 *   call the `getCredentialFileUrl` query — it resolves the current signed URL via
 *   `ctx.storage.getUrl(storageId)`.
 *
 *   If/when schema.ts is extended with a dedicated `storageId` field, migrate by
 *   copying values from documentUrl → storageId and clearing documentUrl.
 */

import { query, mutation } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";

const DISTRICT_ROLES = [
    "district_admin",
    "district_hr",
    "superintendent",
    "superadmin",
] as const;

async function getUserByClerkId(
    ctx: QueryCtx | MutationCtx,
    clerkId: string
) {
    return await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
        .first();
}

async function requireEducatorViewer(ctx: QueryCtx | MutationCtx) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await getUserByClerkId(ctx, identity.subject);
    if (!user || user.role !== "educator") throw new Error("Forbidden");
    return user;
}

async function getEducatorForUser(
    ctx: QueryCtx | MutationCtx,
    userId: string
) {
    return await ctx.db
        .query("educators")
        .withIndex("by_user_id", (q) =>
            q.eq("userId", userId as unknown as never)
        )
        .first();
}

const credentialTypeValidator = v.union(
    v.literal("state_license"),
    v.literal("certification"),
    v.literal("degree"),
    v.literal("endorsement")
);

// ─── File storage helpers ───────────────────────────────────

/** Generates a short-lived upload URL for the signed-in educator. */
export const generateUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        await requireEducatorViewer(ctx);
        return await ctx.storage.generateUploadUrl();
    },
});

// ─── Mutations ───────────────────────────────────────────────

/**
 * Finalize an upload by persisting a credential row.
 * `storageId` is the id returned from the upload URL POST (or undefined when
 * no file was attached — a bare credential record is still allowed).
 *
 * The storageId is stored in `documentUrl` per the header note above.
 */
export const finalizeUpload = mutation({
    args: {
        storageId: v.optional(v.id("_storage")),
        type: credentialTypeValidator,
        title: v.string(),
        issuingBody: v.string(),
        state: v.optional(v.string()),
        issueDate: v.string(),
        expiryDate: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await requireEducatorViewer(ctx);
        const educator = await getEducatorForUser(ctx, user._id);
        if (!educator) throw new Error("No educator profile");

        return await ctx.db.insert("credentials", {
            educatorId: educator._id,
            type: args.type,
            title: args.title.trim(),
            issuingBody: args.issuingBody.trim(),
            state: args.state?.trim() || undefined,
            issueDate: args.issueDate,
            expiryDate: args.expiryDate || undefined,
            documentUrl: args.storageId ?? undefined,
            verified: false,
        });
    },
});

/** Delete one of my credentials (and the underlying stored file, if any). */
export const remove = mutation({
    args: { credentialId: v.id("credentials") },
    handler: async (ctx, args) => {
        const user = await requireEducatorViewer(ctx);
        const educator = await getEducatorForUser(ctx, user._id);
        if (!educator) throw new Error("No educator profile");

        const credential = await ctx.db.get(args.credentialId);
        if (!credential) throw new Error("Not found");
        if (credential.educatorId !== educator._id) throw new Error("Forbidden");

        if (credential.documentUrl) {
            try {
                await ctx.storage.delete(
                    credential.documentUrl as unknown as never
                );
            } catch (err) {
                // Non-fatal: the row still goes away even if the file was already gone.
                console.warn("storage.delete failed", err);
            }
        }
        await ctx.db.delete(args.credentialId);
        return args.credentialId;
    },
});

// ─── Queries ─────────────────────────────────────────────────

/** The signed-in educator's own credentials, newest first. */
export const listMine = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];
        const user = await getUserByClerkId(ctx, identity.subject);
        if (!user || user.role !== "educator") return [];
        const educator = await getEducatorForUser(ctx, user._id);
        if (!educator) return [];
        return await ctx.db
            .query("credentials")
            .withIndex("by_educator", (q) => q.eq("educatorId", educator._id))
            .order("desc")
            .collect();
    },
});

/**
 * Returns a fresh signed URL for displaying/downloading a credential file.
 * Educator can view their own; district accounts and superadmins can view any
 * educator's credential file for verification purposes.
 */
export const getCredentialFileUrl = query({
    args: { credentialId: v.id("credentials") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;
        const user = await getUserByClerkId(ctx, identity.subject);
        if (!user) return null;

        const credential = await ctx.db.get(args.credentialId);
        if (!credential) return null;

        const isDistrict = (
            DISTRICT_ROLES as readonly string[]
        ).includes(user.role);
        const educator = await ctx.db.get(credential.educatorId);
        if (!educator) return null;
        const isOwner = educator.userId === user._id;

        if (!isOwner && !isDistrict) return null;
        if (!credential.documentUrl) return null;
        return await ctx.storage.getUrl(
            credential.documentUrl as unknown as never
        );
    },
});
