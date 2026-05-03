import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { LEGAL_LAST_UPDATED, SUPPORT_EMAIL } from "@/lib/legal";

export const metadata: Metadata = {
    title: "Privacy Policy",
    description: "How K12Gig handles personal information and district data.",
};

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-app)] flex flex-col font-sans">
            <SiteHeader />
            <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12 lg:py-16">
                <Link href="/" className="text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--accent-primary)] mb-8 inline-block">
                    ← Home
                </Link>
                <h1 className="font-heading text-3xl font-bold text-[var(--text-primary)] mb-6">Privacy Policy</h1>
                <p className="text-[var(--text-secondary)] text-sm mb-8">Last updated: {LEGAL_LAST_UPDATED}</p>
                <div className="prose prose-neutral max-w-none text-[var(--text-secondary)] space-y-4">
                    <p>
                        K12Gig connects school districts with educators, coaches, and specialists. This policy explains the information
                        we collect, how we use it to operate the marketplace, and how districts, educators, and guardians can contact us
                        about privacy and security.
                    </p>
                    <h2 className="font-heading text-xl font-bold text-[var(--text-primary)] pt-4">Who this service is for</h2>
                    <p>
                        K12Gig is intended for adult district personnel and adult educators. It is not a student application and is not
                        directed to children under 13. Districts and educators should not ask students or guardians to create K12Gig
                        accounts.
                    </p>
                    <h2 className="font-heading text-xl font-bold text-[var(--text-primary)] pt-4">Information we collect</h2>
                    <p>
                        We collect account information, role and organization details, educator profile information, credentials submitted
                        for review, messages, marketplace activity, billing records, support requests, device data, and security logs needed
                        to provide K12Gig.
                    </p>
                    <h2 className="font-heading text-xl font-bold text-[var(--text-primary)] pt-4">How we use data</h2>
                    <p>
                        We use information to create accounts, match districts with educators, support messaging and bookings, process
                        payments, verify credentials, prevent abuse, provide customer support, improve the service, and meet legal,
                        contractual, and security obligations.
                    </p>
                    <h2 className="font-heading text-xl font-bold text-[var(--text-primary)] pt-4">Student data and school privacy laws</h2>
                    <p>
                        K12Gig is designed for educator staffing and services, not for collecting student records. Districts and educators
                        should not upload student education records, student medical information, or other student personal information
                        unless a written agreement authorizes that use. When K12Gig processes student-related information under a district
                        agreement, we treat it as confidential district data, use it only for the authorized education-service purpose, and
                        support FERPA, COPPA, and applicable state student privacy requirements through the terms of that agreement.
                    </p>
                    <h2 className="font-heading text-xl font-bold text-[var(--text-primary)] pt-4">Service providers and subprocessors</h2>
                    <p>
                        We use vetted service providers for hosting, authentication, database infrastructure, payments, email delivery,
                        background-check workflows, analytics, and support operations. These providers may process information only as
                        needed to deliver their services to K12Gig and must protect it under appropriate confidentiality and security terms.
                    </p>
                    <p>
                        Current operational categories include application hosting, identity and authentication, managed database,
                        payment processing, email delivery, background-check workflow support, rate limiting, monitoring, and customer
                        support tooling. Districts can request a current subprocessor list during procurement review.
                    </p>
                    <h2 className="font-heading text-xl font-bold text-[var(--text-primary)] pt-4">Retention and deletion</h2>
                    <p>
                        We retain account, marketplace, payment, and security records for as long as needed to provide K12Gig, comply with
                        law, resolve disputes, enforce agreements, and support district audit requirements. Districts and educators can
                        request deletion or correction of account information by contacting support, subject to legal and contractual
                        retention obligations.
                    </p>
                    <h2 className="font-heading text-xl font-bold text-[var(--text-primary)] pt-4">Security and incidents</h2>
                    <p>
                        K12Gig uses access controls, encrypted transport, managed authentication, audit-oriented logging, and operational
                        monitoring to protect marketplace data. If we learn of a security incident affecting district or educator data, we
                        will investigate, contain the issue, and notify affected customers as required by law and applicable agreements.
                    </p>
                    <h2 className="font-heading text-xl font-bold text-[var(--text-primary)] pt-4">District privacy review and DPA requests</h2>
                    <p>
                        District procurement, security, DPA, and subprocessor questions can be sent to{" "}
                        <a className="underline font-semibold text-[var(--accent-primary)]" href={`mailto:${SUPPORT_EMAIL}`}>
                            {SUPPORT_EMAIL}
                        </a>
                        . Include the district name, state, requested review deadline, and any required privacy addendum so we can route the
                        request to the right contracting contact.
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
