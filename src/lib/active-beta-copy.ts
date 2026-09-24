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
            "Complete onboarding, publish your profile, upload a resume, respond to district needs, and coordinate accepted work in My Gigs. After a proposal is accepted, reach out if you don't hear from the school in 3 business days.",
        billingHelp:
            "K12Gig does not process payments, payouts, ACH, or 1099s. After a proposal is accepted, districts and consultants arrange contracts and payment directly off-platform.",
        paymentModeLabel: "Off-platform (district and consultant)",
        districtPaymentCopy:
            "Payment is arranged directly with the consultant. K12Gig does not run checkout.",
        checkoutInvoiceOption: "Off-platform payment",
        checkoutInvoiceNotice:
            "K12Gig checkout is retired. Accept a proposal, then coordinate the contract and payment outside the platform.",
        checkoutInvoiceAction: "Post a gig",
    };
}
