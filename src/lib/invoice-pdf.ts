/**
 * Invoice PDF generator using pdf-lib (pure JS, works in Node and V8
 * isolate runtimes like Convex actions). Returns a Uint8Array.
 *
 * Layout is A4 single-page with the EduGig wordmark in the header
 * and a Net-30 footer. Fonts use the embedded Helvetica family so no
 * external asset loading is required.
 */

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export type InvoiceInput = {
    orderId: string;
    orgName: string;
    buyerName: string;
    educatorName: string;
    gigTitle: string;
    startDate: string;
    totalAmount: number;
    platformFee: number;
    educatorPayout: number;
    poNumber?: string;
    /** Epoch millis — if omitted, defaults to Date.now() at generate time. */
    issuedAt: number;
};

const BRAND_RGB = rgb(0x2d / 255, 0x3b / 255, 0x24 / 255);
const TEXT_RGB = rgb(0.1, 0.1, 0.1);
const MUTED_RGB = rgb(0.4, 0.42, 0.35);
const RULE_RGB = rgb(0.85, 0.87, 0.82);

/** Format an invoice id from an order id, matching `EDG-<first 8 chars>`. */
export function invoiceNumber(orderId: string): string {
    const slug = (orderId || "").replace(/[^a-zA-Z0-9]/g, "");
    return `EDG-${(slug.slice(0, 8) || "00000000").toUpperCase()}`;
}

function money(n: number): string {
    const value = Number.isFinite(n) ? n : 0;
    return value.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function formatDate(ms: number): string {
    const d = new Date(ms);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function dueDate(ms: number): string {
    const due = new Date(ms);
    due.setDate(due.getDate() + 30);
    return due.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export async function generateInvoicePdf(input: InvoiceInput): Promise<Uint8Array> {
    const {
        orderId,
        orgName,
        buyerName,
        educatorName,
        gigTitle,
        startDate,
        totalAmount,
        platformFee,
        educatorPayout,
        poNumber,
        issuedAt,
    } = input;

    const pdf = await PDFDocument.create();
    pdf.setTitle(`EduGig Invoice ${invoiceNumber(orderId)}`);
    pdf.setAuthor("EduGig");
    pdf.setSubject("Net-30 Invoice");
    pdf.setProducer("EduGig Invoice Generator");
    pdf.setCreator("EduGig");

    const helvetica = await pdf.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdf.embedFont(StandardFonts.HelveticaBold);

    // A4 is 595 x 842 points.
    const page = pdf.addPage([595, 842]);
    const W = page.getWidth();
    const H = page.getHeight();

    const marginX = 48;
    let y = H - 60;

    // Header — EduGig wordmark (left) and INVOICE label (right).
    page.drawText("EduGig", {
        x: marginX,
        y,
        size: 24,
        font: helveticaBold,
        color: BRAND_RGB,
    });
    const invoiceLabel = "INVOICE";
    const invoiceLabelWidth = helveticaBold.widthOfTextAtSize(invoiceLabel, 18);
    page.drawText(invoiceLabel, {
        x: W - marginX - invoiceLabelWidth,
        y,
        size: 18,
        font: helveticaBold,
        color: TEXT_RGB,
    });

    y -= 10;
    page.drawLine({
        start: { x: marginX, y },
        end: { x: W - marginX, y },
        thickness: 1,
        color: BRAND_RGB,
    });

    y -= 28;

    // Invoice meta block (right-aligned key/values).
    const invoiceNo = invoiceNumber(orderId);
    const issued = formatDate(issuedAt);
    const due = dueDate(issuedAt);

    const metaEntries: Array<[string, string]> = [
        ["Invoice #", invoiceNo],
        ["Issued", issued],
        ["Due", due],
    ];
    if (poNumber) metaEntries.push(["PO #", poNumber]);

    let metaY = y;
    for (const [label, value] of metaEntries) {
        const labelText = label;
        const valueText = value;
        const valueWidth = helvetica.widthOfTextAtSize(valueText, 10);
        page.drawText(labelText, {
            x: W - marginX - 150,
            y: metaY,
            size: 10,
            font: helveticaBold,
            color: MUTED_RGB,
        });
        page.drawText(valueText, {
            x: W - marginX - valueWidth,
            y: metaY,
            size: 10,
            font: helvetica,
            color: TEXT_RGB,
        });
        metaY -= 16;
    }

    // "Bill to" block (left).
    page.drawText("Bill to", {
        x: marginX,
        y,
        size: 10,
        font: helveticaBold,
        color: MUTED_RGB,
    });
    y -= 16;
    page.drawText(orgName, {
        x: marginX,
        y,
        size: 12,
        font: helveticaBold,
        color: TEXT_RGB,
    });
    y -= 14;
    page.drawText(buyerName, {
        x: marginX,
        y,
        size: 11,
        font: helvetica,
        color: TEXT_RGB,
    });

    // Move below whichever block ends lower.
    y = Math.min(y, metaY) - 30;

    // "For" block.
    page.drawText("For", {
        x: marginX,
        y,
        size: 10,
        font: helveticaBold,
        color: MUTED_RGB,
    });
    y -= 16;
    page.drawText(gigTitle, {
        x: marginX,
        y,
        size: 12,
        font: helveticaBold,
        color: TEXT_RGB,
    });
    y -= 14;
    page.drawText(`Educator: ${educatorName}`, {
        x: marginX,
        y,
        size: 11,
        font: helvetica,
        color: TEXT_RGB,
    });
    y -= 14;
    page.drawText(`Start date: ${startDate}`, {
        x: marginX,
        y,
        size: 11,
        font: helvetica,
        color: TEXT_RGB,
    });

    y -= 36;

    // Line items header.
    page.drawLine({
        start: { x: marginX, y: y + 8 },
        end: { x: W - marginX, y: y + 8 },
        thickness: 0.5,
        color: RULE_RGB,
    });
    page.drawText("Description", {
        x: marginX,
        y: y - 6,
        size: 10,
        font: helveticaBold,
        color: MUTED_RGB,
    });
    const amtHeader = "Amount";
    const amtHeaderWidth = helveticaBold.widthOfTextAtSize(amtHeader, 10);
    page.drawText(amtHeader, {
        x: W - marginX - amtHeaderWidth,
        y: y - 6,
        size: 10,
        font: helveticaBold,
        color: MUTED_RGB,
    });
    y -= 22;
    page.drawLine({
        start: { x: marginX, y: y + 8 },
        end: { x: W - marginX, y: y + 8 },
        thickness: 0.5,
        color: RULE_RGB,
    });

    // Line items.
    const lineItems: Array<{ label: string; amount: number; bold?: boolean }> = [
        { label: "Subtotal", amount: totalAmount },
        { label: "Platform Fee (18%)", amount: platformFee },
        { label: "Educator Payout", amount: educatorPayout },
    ];

    for (const item of lineItems) {
        page.drawText(item.label, {
            x: marginX,
            y,
            size: 11,
            font: helvetica,
            color: TEXT_RGB,
        });
        const amount = money(item.amount);
        const amountWidth = helvetica.widthOfTextAtSize(amount, 11);
        page.drawText(amount, {
            x: W - marginX - amountWidth,
            y,
            size: 11,
            font: helvetica,
            color: TEXT_RGB,
        });
        y -= 18;
    }

    y -= 6;
    page.drawLine({
        start: { x: marginX, y: y + 10 },
        end: { x: W - marginX, y: y + 10 },
        thickness: 0.75,
        color: BRAND_RGB,
    });

    // Total due.
    page.drawText("Total Due", {
        x: marginX,
        y,
        size: 13,
        font: helveticaBold,
        color: BRAND_RGB,
    });
    const totalText = money(totalAmount);
    const totalWidth = helveticaBold.widthOfTextAtSize(totalText, 13);
    page.drawText(totalText, {
        x: W - marginX - totalWidth,
        y,
        size: 13,
        font: helveticaBold,
        color: BRAND_RGB,
    });

    // Footer block.
    page.drawText("Net-30 Payment Terms", {
        x: marginX,
        y: 80,
        size: 11,
        font: helveticaBold,
        color: TEXT_RGB,
    });
    page.drawText(
        "Payment is due within 30 days of the issue date. Please reference the invoice number on all remittances.",
        {
            x: marginX,
            y: 64,
            size: 9,
            font: helvetica,
            color: MUTED_RGB,
            maxWidth: W - marginX * 2,
        }
    );
    page.drawText("Questions? hello@edugig.com", {
        x: marginX,
        y: 44,
        size: 9,
        font: helvetica,
        color: MUTED_RGB,
    });
    const brandFooter = "EduGig — The K-12 Educator Marketplace";
    const brandFooterWidth = helvetica.widthOfTextAtSize(brandFooter, 9);
    page.drawText(brandFooter, {
        x: W - marginX - brandFooterWidth,
        y: 44,
        size: 9,
        font: helvetica,
        color: MUTED_RGB,
    });

    return await pdf.save();
}
