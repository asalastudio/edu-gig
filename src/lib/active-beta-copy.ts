export type ActiveBetaCopy = {
    educatorHelp: string;
    billingHelp: string;
    paymentModeLabel: string;
    districtPaymentCopy: string;
    checkoutInvoiceOption: string;
    checkoutInvoiceNotice: string;
    checkoutInvoiceAction: string;
};

export function getActiveBetaCopy(cardCheckoutEnabled: boolean): ActiveBetaCopy {
    void cardCheckoutEnabled;
    return {
        educatorHelp:
            "Complete onboarding, publish your profile, upload a resume, respond to district needs, and coordinate accepted work in My Gigs and Contract Hub.",
        billingHelp:
            "K12Gig does not process payments, payouts, ACH, or 1099s. After a proposal is accepted, districts and consultants arrange payment directly and keep working documents in Contract Hub.",
        paymentModeLabel: "Off-platform (district and consultant)",
        districtPaymentCopy:
            "Payment is arranged directly with the consultant. Use Contract Hub for working documents; K12Gig does not run checkout.",
        checkoutInvoiceOption: "Off-platform payment",
        checkoutInvoiceNotice:
            "K12Gig checkout is retired. Accept a proposal, then coordinate the contract and payment outside the platform.",
        checkoutInvoiceAction: "Post a need",
    };
}
