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
    return {
        educatorHelp:
            "Complete onboarding, publish your profile, respond to district needs, manage credentials, and track bookings.",
        billingHelp: cardCheckoutEnabled
            ? "Card payments, Net-30 invoices, PO numbers, and payment notices are handled in the booking flow."
            : "Net-30 invoices, PO numbers, and payment notices are handled in the booking flow. Card payments are not yet available.",
        paymentModeLabel: cardCheckoutEnabled
            ? "Card or purchase order / Net-30 invoice"
            : "Purchase order / Net-30 invoice",
        districtPaymentCopy: cardCheckoutEnabled
            ? "Card payment and approved purchase order / Net-30 invoice are available in the booking flow."
            : "During beta, districts pay by approved purchase order or Net-30 invoice. Card payments are not yet available.",
        checkoutInvoiceOption: "Purchase order / Net-30 invoice",
        checkoutInvoiceNotice: cardCheckoutEnabled
            ? "Choose card payment or submit an approved purchase order / Net-30 invoice request."
            : "During beta, districts pay by approved purchase order or Net-30 invoice. Card payments are not yet available.",
        checkoutInvoiceAction: "Submit booking request",
    };
}
