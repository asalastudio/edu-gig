import { ownedFile } from "./privateFiles";
import { downloadPath } from "./lib/releaseDomain";
import { getAppIdentity } from "./lib/staging";
/**
 * Educator credential CRUD backed by Convex file storage.
 *
 * STORAGE NOTE (documentUrl vs. storageId):
 *   New rows store the Convex storage id in the dedicated `storageId` field.
 *   Rows written before that field existed hold the raw storage ID (a string)
 *   in `documentUrl` — readers must fall back via `credentialStorageId()` and
 *   must NEVER treat that string as a public URL. To display a file, call the
 *   `getCredentialFileUrl` query — it resolves
 *   the authenticated private-file application route after migration.
 */

import { query, mutation } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
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
    const identity = await getAppIdentity(ctx);
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

/** Storage id for a credential row: dedicated field, else the legacy documentUrl stash. */
function credentialStorageId(credential: {
    storageId?: Id<"_storage">;
    documentUrl?: string;
}): Id<"_storage"> | undefined {
    return credential.storageId ?? (credential.documentUrl as Id<"_storage"> | undefined);
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
        throw new Error("Private upload required; refresh the application");
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
        privateFileId: v.optional(v.id("privateFiles")),
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

        if (args.storageId) throw new Error("Raw storage IDs are forbidden");
        if (args.privateFileId) await ownedFile({ ...ctx, user }, args.privateFileId, "credential");
        return await ctx.db.insert("credentials", {
            educatorId: educator._id,
            type: args.type,
            title: args.title.trim(),
            issuingBody: args.issuingBody.trim(),
            state: args.state?.trim() || undefined,
            issueDate: args.issueDate,
            expiryDate: args.expiryDate || undefined,
            privateFileId: args.privateFileId,
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

        await ctx.db.delete(args.credentialId);
        return args.credentialId;
    },
});

// ─── Queries ─────────────────────────────────────────────────

/** The signed-in educator's own credentials, newest first. */
export const listMine = query({
    args: {},
    handler: async (ctx) => {
        const identity = await getAppIdentity(ctx);
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
 * Returns an authenticated application route for a private credential file.
 * Educator can view their own; district accounts and superadmins can view any
 * educator's credential file for verification purposes.
 */
export const getCredentialFileUrl = query({
    args: { credentialId: v.id("credentials") },
    handler: async (ctx, args) => {
        const identity = await getAppIdentity(ctx);
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
        return credential.privateFileId ? downloadPath(credential.privateFileId) : null;
    },
});

/**
 * Sanitized credential rows for an educator's public profile.
 * Owner sees their own; district accounts and superadmins see any educator's.
 * Never exposes storage ids — files are fetched via `getCredentialFileUrl`.
 */
export const listForEducatorProfile = query({
    args: { educatorId: v.id("educators") },
    handler: async (ctx, args) => {
        const identity = await getAppIdentity(ctx);
        if (!identity) return null;
        const user = await getUserByClerkId(ctx, identity.subject);
        if (!user) return null;

        const educator = await ctx.db.get(args.educatorId);
        if (!educator) return null;

        const isDistrict = (DISTRICT_ROLES as readonly string[]).includes(user.role);
        const isOwner = educator.userId === user._id;
        if (!isOwner && !isDistrict) return null;

        const rows = await ctx.db
            .query("credentials")
            .withIndex("by_educator", (q) => q.eq("educatorId", args.educatorId))
            .order("desc")
            .collect();

        return rows.map((credential) => ({
            id: credential._id,
            type: credential.type,
            title: credential.title,
            issuingBody: credential.issuingBody,
            state: credential.state,
            issueDate: credential.issueDate,
            expiryDate: credential.expiryDate,
            verified: credential.verified,
            hasFile: !!credential.privateFileId || !!credentialStorageId(credential),
        }));
    },
});
