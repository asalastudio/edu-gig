import { describe, it, expect } from "vitest";
import {
    bookingConfirmation,
    newMessageAlert,
    newProposalAlert,
    proposalAcceptedAlert,
} from "./email-templates";

describe("bookingConfirmation", () => {
    const baseInput = {
        gigTitle: "Algebra II Substitute",
        educatorName: "Jane Educator",
        buyerName: "Sam Buyer",
        orgName: "Harborview District",
        totalAmount: 1180,
        platformFee: 180,
        educatorPayout: 1000,
        startDate: "2026-05-01",
        paymentMethod: "invoice" as const,
    };

    it("returns a payload with subject, html, and text strings", () => {
        const out = bookingConfirmation(baseInput);
        expect(typeof out.subject).toBe("string");
        expect(typeof out.html).toBe("string");
        expect(typeof out.text).toBe("string");
        expect(out.subject.length).toBeGreaterThan(0);
        expect(out.html.length).toBeGreaterThan(0);
        expect(out.text.length).toBeGreaterThan(0);
    });

    it("includes core variables in the subject and body", () => {
        const out = bookingConfirmation(baseInput);
        expect(out.subject).toContain("Algebra II Substitute");
        expect(out.html).toContain("Jane Educator");
        expect(out.html).toContain("Harborview District");
        expect(out.html).toContain("Sam Buyer");
        expect(out.text).toContain("2026-05-01");
        expect(out.html).toContain("$1,000.00");
        expect(out.html).toContain("$180.00");
        expect(out.html).toContain("$1,180.00");
        expect(out.text).toContain("Educator services: $1,000.00");
    });

    it("mentions the Net-30 invoice flow when paymentMethod is 'invoice'", () => {
        const out = bookingConfirmation(baseInput);
        expect(out.html).toContain("Net-30 invoice");
        expect(out.text).toContain("Net-30");
    });

    it("uses the card label when paymentMethod is 'card'", () => {
        const out = bookingConfirmation({ ...baseInput, paymentMethod: "card" });
        expect(out.html).toContain("Card payment received");
        expect(out.html).not.toContain("Net-30 invoice");
    });

    it("includes unsubscribe placeholder and brand footer", () => {
        const out = bookingConfirmation(baseInput);
        expect(out.html).toContain("{{unsubscribe_url}}");
        expect(out.html).toContain("K12Gig");
        expect(out.html).toContain("The K-12 Educator Marketplace");
    });

    it("escapes html-sensitive chars so untrusted strings don't break markup", () => {
        const out = bookingConfirmation({
            ...baseInput,
            gigTitle: "<script>alert(1)</script>",
            buyerName: 'O"Brien & Sons',
        });
        expect(out.html).not.toContain("<script>alert(1)</script>");
        expect(out.html).toContain("&lt;script&gt;");
        expect(out.html).toContain("O&quot;Brien &amp; Sons");
    });
});

describe("newMessageAlert", () => {
    it("returns a payload containing sender, recipient, and preview", () => {
        const out = newMessageAlert({
            senderName: "Alex Principal",
            recipientFirstName: "Jordan",
            messagePreview: "Thanks for the quick reply on scheduling!",
            conversationUrl: "https://k12gig.com/dashboard/messages",
        });
        expect(out.subject).toContain("Alex Principal");
        expect(out.html).toContain("Jordan");
        expect(out.html).toContain("Thanks for the quick reply");
        expect(out.html).toContain("https://k12gig.com/dashboard/messages");
        expect(out.text).toContain("Alex Principal");
    });

    it("truncates very long message previews", () => {
        const long = "x".repeat(500);
        const out = newMessageAlert({
            senderName: "A",
            recipientFirstName: "B",
            messagePreview: long,
            conversationUrl: "https://k12gig.com/dashboard/messages",
        });
        expect(out.html.length).toBeLessThan(long.length + 10_000);
        expect(out.html).toContain("…");
    });
});

describe("newProposalAlert", () => {
    it("formats hourly rates as $X/hr", () => {
        const out = newProposalAlert({
            educatorName: "Dana Teacher",
            needTitle: "Middle School Math Interventionist",
            orgName: "Pine Valley Schools",
            proposedRate: 85,
            proposedRateUnit: "hourly",
            needUrl: "https://k12gig.com/needs/abc",
        });
        expect(out.subject).toContain("Middle School Math Interventionist");
        expect(out.html).toContain("Dana Teacher");
        expect(out.html).toContain("Pine Valley Schools");
        expect(out.html).toContain("$85/hr");
        expect(out.html).toContain("https://k12gig.com/needs/abc");
    });

    it("shows 'Rate not specified' when rate is missing", () => {
        const out = newProposalAlert({
            educatorName: "Dana",
            needTitle: "Open Role",
            orgName: "District",
            needUrl: "https://k12gig.com/needs/x",
        });
        expect(out.html).toContain("Rate not specified");
    });
});

describe("proposalAcceptedAlert", () => {
    it("includes org and need title with celebratory copy", () => {
        const out = proposalAcceptedAlert({
            needTitle: "Fall STEM Coach",
            orgName: "Riverside USD",
            educatorFirstName: "Kai",
            needUrl: "https://k12gig.com/dashboard/educator/needs",
        });
        expect(out.subject).toContain("Fall STEM Coach");
        expect(out.html).toContain("Riverside USD");
        expect(out.text).toContain("Kai");
        expect(out.html.toLowerCase()).toContain("accepted");
    });
});
