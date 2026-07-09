import { describe, expect, it } from "vitest";
import { getActiveBetaCopy } from "./active-beta-copy";

describe("getActiveBetaCopy", () => {
    it("describes the invoice/PO-first beta without claiming card or gig creation is active", () => {
        const copy = getActiveBetaCopy(false);

        expect(copy.educatorHelp).toMatch(/publish your profile/i);
        expect(copy.educatorHelp).not.toMatch(/create gigs/i);
        expect(copy.billingHelp).toMatch(/Net-30 invoices/i);
        expect(copy.billingHelp).toMatch(/card payments are not yet available/i);
        expect(copy.checkoutInvoiceOption).toBe("Purchase order / Net-30 invoice");
        expect(copy.checkoutInvoiceAction).toBe("Submit booking request");
    });

    it("mentions card payment only when the feature is active", () => {
        const copy = getActiveBetaCopy(true);

        expect(copy.billingHelp).toMatch(/card payments/i);
        expect(copy.paymentModeLabel).toMatch(/Card/i);
    });
});
