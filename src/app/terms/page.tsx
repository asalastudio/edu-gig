import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { LEGAL_LAST_UPDATED, SUPPORT_EMAIL, TERMS_VERSION } from "@/lib/legal";

export const metadata: Metadata = {
    title: "Terms of Service | K12Gig",
    description: "Terms governing use of the K12Gig platform.",
};

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-app)] flex flex-col font-sans">
            <SiteHeader />
            <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12 lg:py-16">
                <Link href="/" className="text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--accent-primary)] mb-8 inline-block">
                    ← Home
                </Link>
                <h1 className="font-heading text-3xl font-bold text-[var(--text-primary)] mb-6">Terms of Service</h1>
                <p className="text-[var(--text-secondary)] text-sm mb-8">
                    Last updated: {LEGAL_LAST_UPDATED} · Version {TERMS_VERSION}
                </p>
                <div className="prose prose-neutral max-w-none text-[var(--text-secondary)] space-y-4">
                    <p>
                        These Terms govern access to K12Gig, a marketplace that helps school districts discover, message, request, and
                        book educators, coaches, specialists, and other education professionals.
                    </p>
                    <h2 className="font-heading text-xl font-bold text-[var(--text-primary)] pt-4">Acceptance and authority</h2>
                    <p>
                        By creating an account or using K12Gig, users agree to these Terms and the Privacy Policy. District users confirm
                        they are using K12Gig for a school, district, agency, or approved education organization and have authority to act
                        for that organization or are evaluating K12Gig before a formal agreement is signed.
                    </p>
                    <h2 className="font-heading text-xl font-bold text-[var(--text-primary)] pt-4">Use of the platform</h2>
                    <p>
                        Users must provide accurate account, organization, credential, payment, and engagement information. District users
                        are responsible for confirming purchasing authority and following local procurement rules. Educator users are
                        responsible for keeping profiles, credentials, rates, availability, and tax or payout information accurate.
                    </p>
                    <h2 className="font-heading text-xl font-bold text-[var(--text-primary)] pt-4">Marketplace roles</h2>
                    <p>
                        K12Gig provides software and marketplace infrastructure. Districts choose which educators to contact or hire, and
                        educators decide which requests to accept. Unless a written agreement says otherwise, K12Gig is not the employer of
                        educators and does not control district hiring decisions, classroom assignments, or day-to-day services.
                    </p>
                    <h2 className="font-heading text-xl font-bold text-[var(--text-primary)] pt-4">District agreements and DPA review</h2>
                    <p>
                        A signed district agreement, purchase order, statement of work, data processing agreement, or privacy addendum may
                        add or replace terms for a specific district. If there is a conflict between these online Terms and a signed
                        district agreement, the signed agreement controls for that district.
                    </p>
                    <h2 className="font-heading text-xl font-bold text-[var(--text-primary)] pt-4">Bookings, payments, and fees</h2>
                    <p>
                        Engagement details, pricing, start dates, purchase-order information, platform fees, taxes, cancellation terms, and
                        payout timing are shown during booking or in the applicable district agreement. Payments may be processed by Stripe
                        and payouts may require educator identity, tax, and bank-account verification.
                    </p>
                    <p>
                        Net-30 invoices are available only for eligible district bookings. Districts are responsible for providing accurate
                        billing contacts, purchase-order numbers when required, exemption certificates when applicable, and timely payment
                        under the approved invoice terms.
                    </p>
                    <h2 className="font-heading text-xl font-bold text-[var(--text-primary)] pt-4">Cancellations, refunds, and disputes</h2>
                    <p>
                        Districts and educators should document scope, schedule, and deliverables before work begins. Cancellation,
                        refund, and dispute outcomes depend on the applicable booking terms, work completed, district requirements, and
                        payment status. K12Gig may review marketplace records and communications to help resolve disputes.
                    </p>
                    <h2 className="font-heading text-xl font-bold text-[var(--text-primary)] pt-4">Credentials and background checks</h2>
                    <p>
                        Verification badges indicate the review status available in K12Gig at the time displayed. Districts remain
                        responsible for any legally required hiring review, board approval, employment eligibility checks, fingerprinting,
                        background checks, or local onboarding steps that apply to their engagement.
                    </p>
                    <h2 className="font-heading text-xl font-bold text-[var(--text-primary)] pt-4">Acceptable use</h2>
                    <p>
                        Users may not misrepresent credentials, bypass platform payment flows, scrape marketplace data, upload unlawful or
                        sensitive student data without authorization, harass other users, interfere with security, or use K12Gig for
                        anything outside lawful K-12 staffing and education services.
                    </p>
                    <h2 className="font-heading text-xl font-bold text-[var(--text-primary)] pt-4">Limitation of liability</h2>
                    <p>
                        To the maximum extent allowed by law, K12Gig is not liable for indirect, incidental, special, consequential, or
                        punitive damages, lost profits, or lost data arising from use of the marketplace. Any additional liability terms in
                        a signed district agreement control for that district.
                    </p>
                    <h2 className="font-heading text-xl font-bold text-[var(--text-primary)] pt-4">Contact</h2>
                    <p>
                        Questions:{" "}
                        <a className="underline font-semibold text-[var(--accent-primary)]" href={`mailto:${SUPPORT_EMAIL}`}>
                            {SUPPORT_EMAIL}
                        </a>
                    </p>
                </div>
            </main>
            <SiteFooter />
        </div>
    );
}
