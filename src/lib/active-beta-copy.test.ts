import { describe, expect, it } from "vitest";
import { getActiveBetaCopy } from "./active-beta-copy";

describe("getActiveBetaCopy", () => {
    it("describes off-platform payment and Contract Hub", () => {
        const copy = getActiveBetaCopy(false);

        expect(copy.educatorHelp).toMatch(/publish your profile/i);
        expect(copy.educatorHelp).toMatch(/Contract Hub/i);
        expect(copy.educatorHelp).not.toMatch(/create gigs/i);
        expect(copy.billingHelp).toMatch(/does not process payments/i);
        expect(copy.checkoutInvoiceAction).toBe("Post a need");
        expect(copy.paymentModeLabel).toMatch(/Off-platform/i);
    });

    it("does not advertise card checkout when the unused flag is true", () => {
        const copy = getActiveBetaCopy(true);

        expect(copy.billingHelp).not.toMatch(/Card payment and approved purchase order/i);
        expect(copy.paymentModeLabel).toMatch(/Off-platform/i);
    });
});
