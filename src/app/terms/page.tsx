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
                        These Terms govern access to K12Gig, a connection marketplace that helps school districts post consulting
                        needs, discover and message education consultants, review proposals, and coordinate engagements.
                    </p>
                    <h2 className="font-heading text-xl font-bold text-[var(--text-primary)] pt-4">Acceptance and authority</h2>
                    <p>
                        By creating an account or using K12Gig, users agree to these Terms and the Privacy Policy. District users confirm
                        they are using K12Gig for a school, district, agency, or approved education organization and have authority to act
                        for that organization or are evaluating K12Gig before a formal agreement is signed.
                    </p>
                    <h2 className="font-heading text-xl font-bold text-[var(--text-primary)] pt-4">Use of the platform</h2>
                    <p>
                        Users must provide accurate account, organization, credential, and engagement information. District users
                        are responsible for confirming purchasing authority and following local procurement rules. Consultant users are
                        responsible for keeping profiles, credentials, resumes, rates, and availability accurate.
                    </p>
                    <h2 className="font-heading text-xl font-bold text-[var(--text-primary)] pt-4">Marketplace roles</h2>
                    <p>
                        K12Gig provides software and marketplace infrastructure. Districts choose which consultants to contact or engage,
                        and consultants decide which needs to propose on. Unless a written agreement says otherwise, K12Gig is not the
                        employer of consultants, is not a party to any engagement, and does not control district hiring decisions,
                        scope of work, or day-to-day services.
                    </p>
                    <h2 className="font-heading text-xl font-bold text-[var(--text-primary)] pt-4">District agreements and DPA review</h2>
                    <p>
                        A signed district agreement, purchase order, statement of work, data processing agreement, or privacy addendum may
                        add or replace terms for a specific district. If there is a conflict between these online Terms and a signed
                        district agreement, the signed agreement controls for that district.
                    </p>
                    <h2 className="font-heading text-xl font-bold text-[var(--text-primary)] pt-4">Engagements, payment, and signatures</h2>
                    <p>
                        When a district accepts a consultant&apos;s proposal, K12Gig records an engagement so both sides can coordinate
                        through the Contract Hub. K12Gig does not charge a platform fee, does not process payments, does not issue
                        invoices, payouts, or tax forms, and does not provide legally binding electronic signatures.
                    </p>
                    <p>
                        Pricing, purchase orders, invoicing, payment timing, taxes, and the signed agreement for each engagement are
                        arranged directly between the district and the consultant, outside K12Gig, under the district&apos;s procurement
                        rules. Documents shared in the Contract Hub are working copies for coordination only; the executed agreement
                        held by the district and the consultant controls.
                    </p>
                    <h2 className="font-heading text-xl font-bold text-[var(--text-primary)] pt-4">Cancellations and disputes</h2>
                    <p>
                        Districts and consultants should document scope, schedule, deliverables, and payment terms in their own agreement
                        before work begins. Cancellation and dispute outcomes are governed by that agreement and by district requirements,
                        not by K12Gig. K12Gig may review marketplace records and communications to help the parties resolve a
                        disagreement, but it does not hold funds, issue refunds, or adjudicate payment disputes.
                    </p>
                    <h2 className="font-heading text-xl font-bold text-[var(--text-primary)] pt-4">Credentials and background checks</h2>
                    <p>
                        Verification badges indicate the review status available in K12Gig at the time displayed. Districts remain
                        responsible for any legally required hiring review, board approval, employment eligibility checks, fingerprinting,
                        background checks, or local onboarding steps that apply to their engagement.
                    </p>
                    <h2 className="font-heading text-xl font-bold text-[var(--text-primary)] pt-4">Acceptable use</h2>
                    <p>
                        Users may not misrepresent credentials or experience, submit proposals they do not intend to honor, scrape
                        marketplace data, upload unlawful or sensitive student data without authorization, harass other users, send
                        unsolicited outreach outside the messaging rules, interfere with security, or use K12Gig for anything outside
                        lawful K-12 consulting and education services.
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
