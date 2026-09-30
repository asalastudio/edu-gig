import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

/**
 * Operator-only directory cleanup, run from the CLI:
 *   npx convex run --prod directoryAdmin:setListingActive '{"educatorId":"…","expectedName":"…","isActive":false,"reason":"…"}'
 * Internal mutations, so the app can't call them. Each one logs and returns the previous
 * values so a change can be reversed by running it again with those values.
 */

export const setListingActive = internalMutation({
    args: {
        educatorId: v.id("educators"),
        isActive: v.boolean(),
        reason: v.string(),
        /** Guard against a mistyped id: refuse unless the listing's display name matches. */
        expectedName: v.string(),
    },
    returns: v.object({
        educatorId: v.id("educators"),
        name: v.string(),
        previous: v.boolean(),
        now: v.boolean(),
    }),
    handler: async (ctx, { educatorId, isActive, reason, expectedName }) => {
        const educator = await ctx.db.get(educatorId);
        if (!educator) throw new Error(`No consultant listing ${educatorId}`);
        const user = await ctx.db.get(educator.userId);
        const name =
            educator.businessName?.trim() || `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || "(no name)";
        if (name !== expectedName.trim()) {
            throw new Error(`Listing ${educatorId} is "${name}", not "${expectedName}"; nothing changed`);
        }
        await ctx.db.patch(educatorId, { isActive });
        console.log(`setListingActive ${educatorId} "${name}": ${educator.isActive} -> ${isActive} (${reason})`);
        return { educatorId, name, previous: educator.isActive, now: isActive };
    },
});

export const correctListing = internalMutation({
    args: {
        educatorId: v.id("educators"),
        firstName: v.optional(v.string()),
        lastName: v.optional(v.string()),
        headline: v.optional(v.string()),
        reason: v.string(),
        expectedName: v.string(),
    },
    returns: v.object({
        previous: v.object({ firstName: v.string(), lastName: v.string(), headline: v.string() }),
    }),
    handler: async (ctx, { educatorId, firstName, lastName, headline, reason, expectedName }) => {
        const educator = await ctx.db.get(educatorId);
        if (!educator) throw new Error(`No consultant listing ${educatorId}`);
        const user = await ctx.db.get(educator.userId);
        if (!user) throw new Error(`Listing ${educatorId} has no user`);
        const name = educator.businessName?.trim() || `${user.firstName} ${user.lastName}`.trim();
        if (name !== expectedName.trim()) {
            throw new Error(`Listing ${educatorId} is "${name}", not "${expectedName}"; nothing changed`);
        }
        const previous = { firstName: user.firstName, lastName: user.lastName, headline: educator.headline };

        if (firstName !== undefined || lastName !== undefined) {
            await ctx.db.patch(user._id, {
                ...(firstName !== undefined ? { firstName: firstName.trim() } : {}),
                ...(lastName !== undefined ? { lastName: lastName.trim() } : {}),
            });
        }
        if (headline !== undefined) {
            await ctx.db.patch(educatorId, { headline: headline.trim() });
        }
        console.log(`correctListing ${educatorId}: was ${JSON.stringify(previous)} (${reason})`);
        return { previous };
    },
});
