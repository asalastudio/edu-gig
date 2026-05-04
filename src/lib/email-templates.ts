/**
 * Pure-function email templates. No side effects — these return the
 * payload strings ready to hand off to Resend (or any transactional
 * provider). HTML is inline-styled so no external CSS is required.
 *
 * Brand accent: #2D3B24 (chalkboard green).
 */

const BRAND_COLOR = "#2D3B24";
const TEXT_COLOR = "#1a1a1a";
const MUTED_COLOR = "#5f6b4f";
const BG_COLOR = "#ffffff";
const PANEL_COLOR = "#f7f8f5";
const APP_URL = (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_APP_URL) || "https://k12gig.com";

/** Extremely minimal HTML-escape for text that's being embedded into markup. */
function escapeHtml(input: string): string {
    return String(input)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

/** Format a USD number to a currency string like "$1,234.56". */
function money(n: number): string {
    const value = Number.isFinite(n) ? n : 0;
    return value.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function renderLayout(opts: { title: string; bodyHtml: string }): string {
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(opts.title)}</title>
</head>
<body style="margin:0;padding:0;background-color:${PANEL_COLOR};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${TEXT_COLOR};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${PANEL_COLOR};padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:${BG_COLOR};border-radius:12px;border:1px solid #e5e7db;overflow:hidden;">
<tr><td style="background-color:${BRAND_COLOR};padding:20px 28px;">
<div style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:0.5px;">K12Gig</div>
</td></tr>
<tr><td style="padding:28px;color:${TEXT_COLOR};font-size:15px;line-height:1.55;">
${opts.bodyHtml}
</td></tr>
<tr><td style="padding:20px 28px;background-color:${PANEL_COLOR};border-top:1px solid #e5e7db;color:${MUTED_COLOR};font-size:12px;line-height:1.5;">
<div><strong>K12Gig</strong> — The K-12 Educator Marketplace</div>
<div style="margin-top:6px;">
You received this email because of activity on your K12Gig account.
<a href="{{unsubscribe_url}}" style="color:${MUTED_COLOR};text-decoration:underline;">Unsubscribe</a>
</div>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

export type EmailPayload = {
    subject: string;
    html: string;
    text: string;
};

// ─── 1. Booking confirmation ────────────────────────────────

export type BookingConfirmationInput = {
    gigTitle: string;
    educatorName: string;
    buyerName: string;
    orgName: string;
    totalAmount: number;
    platformFee: number;
    educatorPayout: number;
    startDate: string;
    paymentMethod: "card" | "ach" | "invoice";
};

export function bookingConfirmation(input: BookingConfirmationInput): EmailPayload {
    const {
        gigTitle,
        educatorName,
        buyerName,
        orgName,
        totalAmount,
        platformFee,
        educatorPayout,
        startDate,
        paymentMethod,
    } = input;

    const subject = `Booking confirmed: ${gigTitle}`;

    const paymentLabel =
        paymentMethod === "card"
            ? "Card payment received"
            : paymentMethod === "ach"
              ? "ACH transfer received"
              : "Net-30 invoice (PDF attached)";

    const bodyHtml = `
<h1 style="margin:0 0 16px;font-size:22px;color:${BRAND_COLOR};">Booking confirmed</h1>
<p style="margin:0 0 16px;">Hi ${escapeHtml(buyerName)}, your K12Gig booking is confirmed.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 20px;">
  <tr><td style="padding:6px 0;color:${MUTED_COLOR};width:140px;">Gig</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(gigTitle)}</td></tr>
  <tr><td style="padding:6px 0;color:${MUTED_COLOR};">Educator</td><td style="padding:6px 0;">${escapeHtml(educatorName)}</td></tr>
  <tr><td style="padding:6px 0;color:${MUTED_COLOR};">Organization</td><td style="padding:6px 0;">${escapeHtml(orgName)}</td></tr>
  <tr><td style="padding:6px 0;color:${MUTED_COLOR};">Start date</td><td style="padding:6px 0;">${escapeHtml(startDate)}</td></tr>
  <tr><td style="padding:6px 0;color:${MUTED_COLOR};">Payment</td><td style="padding:6px 0;">${escapeHtml(paymentLabel)}</td></tr>
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background-color:${PANEL_COLOR};border-radius:8px;">
  <tr><td style="padding:12px 16px;color:${MUTED_COLOR};">Educator services</td><td style="padding:12px 16px;text-align:right;">${escapeHtml(money(educatorPayout))}</td></tr>
  <tr><td style="padding:4px 16px;color:${MUTED_COLOR};">Platform fee (18%)</td><td style="padding:4px 16px;text-align:right;">${escapeHtml(money(platformFee))}</td></tr>
  <tr><td style="padding:12px 16px;font-weight:700;color:${BRAND_COLOR};border-top:1px solid #e5e7db;">Total</td><td style="padding:12px 16px;text-align:right;font-weight:700;color:${BRAND_COLOR};border-top:1px solid #e5e7db;">${escapeHtml(money(totalAmount))}</td></tr>
</table>
<p style="margin:12px 0 0;color:${MUTED_COLOR};font-size:13px;">The educator receives ${escapeHtml(money(educatorPayout))}; K12Gig adds the disclosed platform fee on top.</p>
<p style="margin:24px 0 0;">
  <a href="${APP_URL}/dashboard/district/orders" style="display:inline-block;padding:10px 18px;background-color:${BRAND_COLOR};color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;">View booking</a>
</p>
${paymentMethod === "invoice" ? `<p style="margin:20px 0 0;color:${MUTED_COLOR};font-size:13px;">A Net-30 invoice PDF is attached. Payment is due within 30 days of the issue date.</p>` : ""}
`;

    const text = [
        `Booking confirmed: ${gigTitle}`,
        ``,
        `Hi ${buyerName},`,
        ``,
        `Your K12Gig booking has been confirmed.`,
        ``,
        `Gig: ${gigTitle}`,
        `Educator: ${educatorName}`,
        `Organization: ${orgName}`,
        `Start date: ${startDate}`,
        `Payment: ${paymentLabel}`,
        ``,
        `Educator services: ${money(educatorPayout)}`,
        `Platform fee (18%): ${money(platformFee)}`,
        `Total: ${money(totalAmount)}`,
        `Educator receives: ${money(educatorPayout)}`,
        ``,
        `View booking: ${APP_URL}/dashboard/district/orders`,
        ``,
        paymentMethod === "invoice"
            ? `A Net-30 invoice PDF is attached. Payment is due within 30 days.`
            : ``,
        `— K12Gig, The K-12 Educator Marketplace`,
    ]
        .filter(Boolean)
        .join("\n");

    return { subject, html: renderLayout({ title: subject, bodyHtml }), text };
}

// ─── 2. New message alert ───────────────────────────────────

export type NewMessageAlertInput = {
    senderName: string;
    recipientFirstName: string;
    messagePreview: string;
    conversationUrl: string;
};

export function newMessageAlert(input: NewMessageAlertInput): EmailPayload {
    const { senderName, recipientFirstName, messagePreview, conversationUrl } = input;
    const subject = `New message from ${senderName}`;

    const preview = messagePreview.length > 240 ? `${messagePreview.slice(0, 240)}…` : messagePreview;

    const bodyHtml = `
<h1 style="margin:0 0 16px;font-size:22px;color:${BRAND_COLOR};">New message</h1>
<p style="margin:0 0 12px;">Hi ${escapeHtml(recipientFirstName)},</p>
<p style="margin:0 0 16px;">You have a new message from <strong>${escapeHtml(senderName)}</strong>:</p>
<blockquote style="margin:0 0 20px;padding:12px 16px;background-color:${PANEL_COLOR};border-left:3px solid ${BRAND_COLOR};color:${TEXT_COLOR};font-style:italic;">
${escapeHtml(preview)}
</blockquote>
<p style="margin:0 0 0;">
  <a href="${escapeHtml(conversationUrl)}" style="display:inline-block;padding:10px 18px;background-color:${BRAND_COLOR};color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;">Reply on K12Gig</a>
</p>
`;

    const text = [
        `New message from ${senderName}`,
        ``,
        `Hi ${recipientFirstName},`,
        ``,
        `You have a new message from ${senderName}:`,
        ``,
        `"${preview}"`,
        ``,
        `Reply: ${conversationUrl}`,
        ``,
        `— K12Gig, The K-12 Educator Marketplace`,
    ].join("\n");

    return { subject, html: renderLayout({ title: subject, bodyHtml }), text };
}

// ─── 3. New proposal alert ──────────────────────────────────

export type NewProposalAlertInput = {
    educatorName: string;
    needTitle: string;
    orgName: string;
    proposedRate?: number;
    proposedRateUnit?: "hourly" | "daily" | "fixed";
    needUrl: string;
};

export function newProposalAlert(input: NewProposalAlertInput): EmailPayload {
    const { educatorName, needTitle, orgName, proposedRate, proposedRateUnit, needUrl } = input;
    const subject = `New proposal on "${needTitle}"`;

    let rateLabel = "Rate not specified";
    if (typeof proposedRate === "number" && Number.isFinite(proposedRate) && proposedRateUnit) {
        const formatted = proposedRate.toLocaleString("en-US");
        rateLabel =
            proposedRateUnit === "hourly"
                ? `$${formatted}/hr`
                : proposedRateUnit === "daily"
                  ? `$${formatted}/day`
                  : `$${formatted} flat`;
    }

    const bodyHtml = `
<h1 style="margin:0 0 16px;font-size:22px;color:${BRAND_COLOR};">New proposal received</h1>
<p style="margin:0 0 16px;"><strong>${escapeHtml(educatorName)}</strong> has submitted a proposal for <strong>${escapeHtml(needTitle)}</strong> at ${escapeHtml(orgName)}.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 20px;background-color:${PANEL_COLOR};border-radius:8px;">
  <tr><td style="padding:10px 16px;color:${MUTED_COLOR};width:160px;">Educator</td><td style="padding:10px 16px;font-weight:600;">${escapeHtml(educatorName)}</td></tr>
  <tr><td style="padding:10px 16px;color:${MUTED_COLOR};">Proposed rate</td><td style="padding:10px 16px;">${escapeHtml(rateLabel)}</td></tr>
</table>
<p style="margin:0 0 0;">
  <a href="${escapeHtml(needUrl)}" style="display:inline-block;padding:10px 18px;background-color:${BRAND_COLOR};color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;">Review proposal</a>
</p>
`;

    const text = [
        `New proposal on "${needTitle}"`,
        ``,
        `${educatorName} has submitted a proposal for "${needTitle}" at ${orgName}.`,
        ``,
        `Proposed rate: ${rateLabel}`,
        ``,
        `Review: ${needUrl}`,
        ``,
        `— K12Gig, The K-12 Educator Marketplace`,
    ].join("\n");

    return { subject, html: renderLayout({ title: subject, bodyHtml }), text };
}

// ─── 4. Proposal accepted alert ─────────────────────────────

export type ProposalAcceptedAlertInput = {
    needTitle: string;
    orgName: string;
    educatorFirstName: string;
    needUrl: string;
};

export function proposalAcceptedAlert(input: ProposalAcceptedAlertInput): EmailPayload {
    const { needTitle, orgName, educatorFirstName, needUrl } = input;
    const subject = `Your proposal was accepted — ${needTitle}`;

    const bodyHtml = `
<h1 style="margin:0 0 16px;font-size:22px;color:${BRAND_COLOR};">Congratulations — your proposal was accepted</h1>
<p style="margin:0 0 16px;">Hi ${escapeHtml(educatorFirstName)},</p>
<p style="margin:0 0 16px;"><strong>${escapeHtml(orgName)}</strong> accepted your proposal for <strong>${escapeHtml(needTitle)}</strong>.</p>
<p style="margin:0 0 20px;">The district will be in touch with next steps. You can also reach out directly through K12Gig's messaging.</p>
<p style="margin:0 0 0;">
  <a href="${escapeHtml(needUrl)}" style="display:inline-block;padding:10px 18px;background-color:${BRAND_COLOR};color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;">Open placement</a>
</p>
`;

    const text = [
        `Your proposal was accepted — ${needTitle}`,
        ``,
        `Hi ${educatorFirstName},`,
        ``,
        `${orgName} accepted your proposal for "${needTitle}".`,
        ``,
        `The district will be in touch with next steps.`,
        ``,
        `Open placement: ${needUrl}`,
        ``,
        `— K12Gig, The K-12 Educator Marketplace`,
    ].join("\n");

    return { subject, html: renderLayout({ title: subject, bodyHtml }), text };
}

export function refundIssuedAlert(input: {
    buyerFirstName: string;
    orderId: string;
    refundAmount: number;
    reason?: string;
}): EmailPayload {
    const subject = `Refund issued for order ${input.orderId}`;
    const reason = input.reason ? `Reason: ${input.reason}` : "Reason: Not provided";
    const bodyHtml = `<h1 style="margin:0 0 16px;font-size:22px;color:${BRAND_COLOR};">Refund issued</h1>
<p>Hi ${escapeHtml(input.buyerFirstName)}, we have issued a refund for order ${escapeHtml(input.orderId)}.</p>
<p><strong>Amount:</strong> ${escapeHtml(money(input.refundAmount))}</p>
<p><strong>${escapeHtml(reason)}</strong></p>`;
    const text = `Refund issued for order ${input.orderId}\nAmount: ${money(input.refundAmount)}\n${reason}`;
    return { subject, html: renderLayout({ title: subject, bodyHtml }), text };
}

export function disputeCreatedAdminAlert(input: {
    orderId: string;
    disputeId: string;
    amount: number;
    reason?: string;
}): EmailPayload {
    const subject = `Stripe dispute opened: ${input.orderId}`;
    const reason = input.reason || "not_provided";
    const bodyHtml = `<h1 style="margin:0 0 16px;font-size:22px;color:${BRAND_COLOR};">Dispute flagged</h1>
<p>An order has been marked disputed and requires manual review.</p>
<p><strong>Order:</strong> ${escapeHtml(input.orderId)}<br/>
<strong>Dispute:</strong> ${escapeHtml(input.disputeId)}<br/>
<strong>Amount:</strong> ${escapeHtml(money(input.amount))}<br/>
<strong>Reason:</strong> ${escapeHtml(reason)}</p>`;
    const text = `Dispute flagged\nOrder: ${input.orderId}\nDispute: ${input.disputeId}\nAmount: ${money(input.amount)}\nReason: ${reason}`;
    return { subject, html: renderLayout({ title: subject, bodyHtml }), text };
}
