import Link from "next/link";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { PrimaryButton } from "@/components/shared/button";
import { SUPPORT_EMAIL, supportMailto } from "@/lib/legal";

export const metadata = {
    title: "Help",
    description: "Help for districts and educators using K12Gig.",
};

export default function HelpPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)]">
            <SiteHeader />
            <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12 lg:px-12 lg:py-14">
                <section className="max-w-3xl">
                    <div className="education-rule mb-4" />
                    <h1 className="font-heading text-4xl font-bold leading-tight md:text-5xl">Support for every hiring step.</h1>
                    <p className="mt-5 text-base leading-7 text-[var(--text-secondary)] md:text-lg">
                        Get help with district hiring workflows, educator profiles, invoices, credentials, and marketplace messages.
                    </p>
                </section>

                <section className="grid gap-6 md:grid-cols-2">
                    {[
                        ["Districts", "Post a need, browse educators, request availability, message candidates, and keep booking records organized from the dashboard."],
                        ["Educators", "Complete onboarding, publish your profile, create gigs, respond to district needs, manage credentials, and track bookings."],
                        ["Billing", "Card checkout, Net-30 invoice PDFs, PO numbers, and payment notices are handled in the booking flow."],
                        ["Trust and compliance", "Privacy, terms, DPA requests, credential review, and background-check status are available from profile and legal surfaces."],
                    ].map(([title, body]) => (
                        <div key={title} className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-subtle)] md:p-6">
                            <h2 className="font-heading text-xl font-bold">{title}</h2>
                            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{body}</p>
                        </div>
                    ))}
                </section>

                <section className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-soft)] md:p-8">
                    <h2 className="font-heading text-2xl font-bold">Contact</h2>
                    <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                        For launch support, contracting, or account help, email{" "}
                        <a className="font-bold text-[var(--accent-primary)] hover:underline" href={supportMailto("K12Gig support request")}>
                            {SUPPORT_EMAIL}
                        </a>
                        .
                    </p>
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                        <Link href="/login"><PrimaryButton>Open your workspace</PrimaryButton></Link>
                        <Link href="/privacy" className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[var(--border-strong)] px-4 text-sm font-bold">
                            Privacy details
                        </Link>
                    </div>
                </section>
            </main>
            <SiteFooter />
        </div>
    );
}
