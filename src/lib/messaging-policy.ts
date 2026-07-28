/**
 * One-way messaging policy for K12Gig.
 *
 * Districts initiate contact with educators — never the other way around. This
 * protects district staff from unsolicited educator outreach and keeps the
 * marketplace's "districts reach out first" model honest at the data layer, not
 * just in the UI. An educator may only send into a conversation a district has
 * already started (i.e. one that already has messages).
 */

const DISTRICT_ROLES = ["district_admin", "district_hr", "superintendent", "superadmin"] as const;

/** Roles allowed to START a new conversation. */
export function canInitiateConversation(role: string): boolean {
    return (DISTRICT_ROLES as readonly string[]).includes(role);
}

/**
 * Whether `senderRole` may send a message given whether the conversation already
 * has messages. Replies (existing conversation) are always allowed; starting a
 * new conversation is limited to district-family roles.
 */
export function canSendMessage(args: {
    senderRole: string;
    conversationHasMessages: boolean;
}): boolean {
    if (args.conversationHasMessages) return true;
    return canInitiateConversation(args.senderRole);
}
