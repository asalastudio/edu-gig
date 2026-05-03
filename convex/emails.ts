/**
 * Transactional email dispatchers — implemented as Convex internal actions
 * so they can be scheduled from mutations via `ctx.scheduler.runAfter`.
 *
 * Every action is graceful: if RESEND_API_KEY is unset we log and return
 * early. We never throw — failing an email must not poison the caller.
 *
 * We call the Resend HTTPS API via `fetch` rather than importing the SDK.
 * Actions run in the V8 isolate and fetch is universally supported there.
 */

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import {
    bookingConfirmation,
    newMessageAlert,
    newProposalAlert,
    proposalAcceptedAlert,
} from "../src/lib/email-templates";
import { generateInvoicePdf, invoiceNumber } from "../src/lib/invoice-pdf";
import { SUPPORT_EMAIL } from "../src/lib/legal";

type ResendAttachment = {
    filename: string;
    content: string; // base64
};

type ResendPayload = {
    from: string;
    to: string[];
    cc?: string[];
    subject: string;
    html: string;
    text: string;
    attachments?: ResendAttachment[];
};

async function sendViaResend(payload: ResendPayload): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.log("[emails] RESEND_API_KEY not set — skipping send", {
            to: payload.to,
            subject: payload.subject,
        });
        return;
    }

    try {
        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const body = await res.text().catch(() => "");
            console.error("[emails] Resend API returned non-2xx", res.status, body);
        }
    } catch (err) {
        console.error("[emails] Resend send failed", err);
    }
}

function fromAddress(): string {
    return process.env.RESEND_FROM_EMAIL || `K12Gig <${SUPPORT_EMAIL}>`;
}

function appUrl(): string {
    return process.env.NEXT_PUBLIC_APP_URL || "https://k12gig.com";
}

/** Uint8Array → base64 (works in V8 isolates where Buffer may not exist). */
function uint8ToBase64(bytes: Uint8Array): string {
    // Prefer Buffer when available (Node runtime).
    const bufferCtor = (globalThis as { Buffer?: { from: (a: Uint8Array) => { toString: (enc: string) => string } } }).Buffer;
    if (bufferCtor) {
        return bufferCtor.from(bytes).toString("base64");
    }
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, Array.from(chunk) as unknown as number[]);
    }
    return btoa(binary);
}

// ─── 1. Booking confirmation ─────────────────────────────────

export const sendBookingConfirmation = internalAction({
    args: { orderId: v.id("orders") },
    handler: async (ctx, args) => {
        if (!process.env.RESEND_API_KEY) {
            console.log("[emails] sendBookingConfirmation — RESEND_API_KEY missing, skipping.");
            return;
        }
        try {
            const order = await ctx.runQuery(
                (await import("./_generated/api")).api.orders.getInvoiceContext,
                { orderId: args.orderId }
            );
            if (!order) {
                console.log("[emails] sendBookingConfirmation — context missing for order", args.orderId);
                return;
            }

            const buyerName = `${order.buyer.firstName} ${order.buyer.lastName}`.trim() || "there";
            const educatorName =
                `${order.educator.firstName} ${order.educator.lastName}`.trim() || "your educator";

            const payload = bookingConfirmation({
                gigTitle: order.gig.title,
                educatorName,
                buyerName,
                orgName: order.district.name,
                totalAmount: order.order.totalAmount,
                platformFee: order.order.platformFee,
                educatorPayout: order.order.educatorPayout,
                startDate: order.order.startDate,
                paymentMethod: order.order.paymentMethod,
            });

            const attachments: ResendAttachment[] = [];
            if (order.order.paymentMethod === "invoice") {
                try {
                    const bytes = await generateInvoicePdf({
                        orderId: order.order._id,
                        orgName: order.district.name,
                        buyerName,
                        educatorName,
                        gigTitle: order.gig.title,
                        startDate: order.order.startDate,
                        totalAmount: order.order.totalAmount,
                        platformFee: order.order.platformFee,
                        educatorPayout: order.order.educatorPayout,
                        poNumber: order.order.poNumber,
                        issuedAt: order.order.createdAt ?? Date.now(),
                    });
                    attachments.push({
                        filename: `invoice-${invoiceNumber(order.order._id)}.pdf`,
                        content: uint8ToBase64(bytes),
                    });
                } catch (err) {
                    console.error("[emails] invoice PDF attach failed", err);
                }
            }

            const to = order.buyer.email ? [order.buyer.email] : [];
            if (to.length === 0) {
                console.log("[emails] sendBookingConfirmation — no buyer email.");
                return;
            }
            const cc = order.educator.email ? [order.educator.email] : undefined;

            await sendViaResend({
                from: fromAddress(),
                to,
                cc,
                subject: payload.subject,
                html: payload.html,
                text: payload.text,
                attachments: attachments.length ? attachments : undefined,
            });
        } catch (err) {
            console.error("[emails] sendBookingConfirmation failed", err);
        }
    },
});

// ─── 2. New message alert ────────────────────────────────────

export const sendNewMessageAlert = internalAction({
    args: { messageId: v.id("messages") },
    handler: async (ctx, args) => {
        if (!process.env.RESEND_API_KEY) {
            console.log("[emails] sendNewMessageAlert — RESEND_API_KEY missing, skipping.");
            return;
        }
        try {
            const ctxData = await ctx.runQuery(
                (await import("./_generated/api")).internal.emails.getMessageContext,
                { messageId: args.messageId }
            );
            if (!ctxData) return;

            const { sender, recipient, content } = ctxData;
            if (!recipient?.email) {
                console.log("[emails] sendNewMessageAlert — recipient has no email.");
                return;
            }

            const senderName = `${sender.firstName} ${sender.lastName}`.trim() || "Someone";
            const recipientFirstName = recipient.firstName || "there";

            const payload = newMessageAlert({
                senderName,
                recipientFirstName,
                messagePreview: content,
                conversationUrl: `${appUrl()}/dashboard/messages`,
            });

            await sendViaResend({
                from: fromAddress(),
                to: [recipient.email],
                subject: payload.subject,
                html: payload.html,
                text: payload.text,
            });
        } catch (err) {
            console.error("[emails] sendNewMessageAlert failed", err);
        }
    },
});

// ─── 3. New proposal alert ───────────────────────────────────

export const sendNewProposalAlert = internalAction({
    args: { proposalId: v.id("proposals") },
    handler: async (ctx, args) => {
        if (!process.env.RESEND_API_KEY) {
            console.log("[emails] sendNewProposalAlert — RESEND_API_KEY missing, skipping.");
            return;
        }
        try {
            const data = await ctx.runQuery(
                (await import("./_generated/api")).internal.emails.getProposalContext,
                { proposalId: args.proposalId }
            );
            if (!data) return;

            const { proposal, need, educatorUser, districtUser } = data;
            if (!districtUser?.email) {
                console.log("[emails] sendNewProposalAlert — no district user email.");
                return;
            }

            const educatorName =
                `${educatorUser.firstName} ${educatorUser.lastName}`.trim() || "An educator";

            const payload = newProposalAlert({
                educatorName,
                needTitle: need.areaOfNeed || "your posting",
                orgName: need.orgName,
                proposedRate: proposal.proposedRate,
                proposedRateUnit: proposal.proposedRateUnit,
                needUrl: `${appUrl()}/dashboard/district/needs/${need._id}`,
            });

            await sendViaResend({
                from: fromAddress(),
                to: [districtUser.email],
                subject: payload.subject,
                html: payload.html,
                text: payload.text,
            });
        } catch (err) {
            console.error("[emails] sendNewProposalAlert failed", err);
        }
    },
});

// ─── 4. Proposal accepted alert ──────────────────────────────

export const sendProposalAcceptedAlert = internalAction({
    args: { proposalId: v.id("proposals") },
    handler: async (ctx, args) => {
        if (!process.env.RESEND_API_KEY) {
            console.log("[emails] sendProposalAcceptedAlert — RESEND_API_KEY missing, skipping.");
            return;
        }
        try {
            const data = await ctx.runQuery(
                (await import("./_generated/api")).internal.emails.getProposalContext,
                { proposalId: args.proposalId }
            );
            if (!data) return;

            const { need, educatorUser } = data;
            if (!educatorUser?.email) {
                console.log("[emails] sendProposalAcceptedAlert — no educator email.");
                return;
            }

            const payload = proposalAcceptedAlert({
                needTitle: need.areaOfNeed || "your placement",
                orgName: need.orgName,
                educatorFirstName: educatorUser.firstName || "there",
                needUrl: `${appUrl()}/dashboard/educator/needs`,
            });

            await sendViaResend({
                from: fromAddress(),
                to: [educatorUser.email],
                subject: payload.subject,
                html: payload.html,
                text: payload.text,
            });
        } catch (err) {
            console.error("[emails] sendProposalAcceptedAlert failed", err);
        }
    },
});

// ─── Internal helper queries (joined data lookups) ───────────

import { internalQuery } from "./_generated/server";

export const getMessageContext = internalQuery({
    args: { messageId: v.id("messages") },
    handler: async (ctx, args) => {
        const message = await ctx.db.get(args.messageId);
        if (!message) return null;
        const sender = await ctx.db.get(message.senderId);
        const recipient = await ctx.db.get(message.recipientId);
        if (!sender || !recipient) return null;
        return { sender, recipient, content: message.content };
    },
});

export const getProposalContext = internalQuery({
    args: { proposalId: v.id("proposals") },
    handler: async (ctx, args) => {
        const proposal = await ctx.db.get(args.proposalId);
        if (!proposal) return null;
        const need = await ctx.db.get(proposal.needId);
        if (!need) return null;
        const educatorUser = await ctx.db.get(proposal.educatorUserId);
        const districtUser = await ctx.db.get(need.postedByUserId);
        if (!educatorUser || !districtUser) return null;
        return { proposal, need, educatorUser, districtUser };
    },
});
