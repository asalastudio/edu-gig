import { describe, it, expect } from "vitest";
import { generateInvoicePdf, invoiceNumber, type InvoiceInput } from "./invoice-pdf";

const baseInput: InvoiceInput = {
    orderId: "jd8abc12xyz345def",
    orgName: "Austin ISD",
    buyerName: "Jane Buyer",
    educatorName: "Dr. Sarah Jenkins",
    gigTitle: "Curriculum Mapping Workshop",
    startDate: "2026-05-15",
    totalAmount: 531,
    platformFee: 81,
    educatorPayout: 450,
    issuedAt: new Date("2026-04-20T12:00:00Z").getTime(),
};

describe("invoiceNumber", () => {
    it("formats as K12G-<upper 8 chars>", () => {
        expect(invoiceNumber("jd8abc12xyz345def")).toBe("K12G-JD8ABC12");
    });

    it("pads with zeros when orderId is empty", () => {
        expect(invoiceNumber("")).toBe("K12G-00000000");
    });

    it("strips non-alphanumerics before slicing", () => {
        expect(invoiceNumber("jd-8a_b-c-1-2")).toBe("K12G-JD8ABC12");
    });
});

describe("generateInvoicePdf", () => {
    it("returns a Uint8Array that starts with the PDF magic bytes", async () => {
        const bytes = await generateInvoicePdf(baseInput);
        expect(bytes).toBeInstanceOf(Uint8Array);
        expect(bytes.length).toBeGreaterThan(100);
        // "%PDF-" header
        expect(String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3], bytes[4])).toBe("%PDF-");
    });

    it("produces output for a wide range of totals without throwing", async () => {
        for (const amount of [0, 1, 100, 10_000, 1_000_000]) {
            const bytes = await generateInvoicePdf({ ...baseInput, totalAmount: amount });
            expect(bytes.byteLength).toBeGreaterThan(100);
        }
    });

    it("generates consistently across calls (deterministic header)", async () => {
        const a = await generateInvoicePdf(baseInput);
        const b = await generateInvoicePdf(baseInput);
        // Both must be valid PDFs, though internal IDs may differ.
        expect(String.fromCharCode(...a.slice(0, 5))).toBe("%PDF-");
        expect(String.fromCharCode(...b.slice(0, 5))).toBe("%PDF-");
    });
});
