import type { QueryCtx, MutationCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
/** Explicit admin review records are independent of historical verification flags. */
export async function credentialWasReviewed(ctx: QueryCtx | MutationCtx, credentialId: Id<'credentials'>): Promise<boolean> {
    const record = await ctx.db.query('credentialReviewRecords').withIndex('by_credential', q => q.eq('credentialId', credentialId)).order('desc').first();
    return !!record?.reviewed;
}
