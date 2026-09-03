import Link from "next/link";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { PrimaryButton } from "@/components/shared/button";
import { supportMailto } from "@/lib/legal";

export const metadata = {
    title: "Pricing",
    description: "K12Gig is a connection marketplace. Consultants list rates; districts and consultants arrange payment directly.",
};

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)]">
            <SiteHeader />
            <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12 lg:px-12 lg:py-14">
                <section className="max-w-3xl">
                    <div className="education-rule mb-4" />
                    <h1 className="font-heading text-4xl font-bold leading-tight md:text-5xl">Transparent consultant rates. Payment stays between you.</h1>
                    <p className="mt-5 text-base leading-7 text-[var(--text-secondary)] md:text-lg">
                        K12Gig is a job board and connection marketplace. Consultants publish starting rates on their profiles. After a district accepts a proposal, scope, contracts, and payment are coordinated off-platform.
                    </p>
                </section>

                <section className="grid gap-6 md:grid-cols-3">
                    {[
                        ["Consultant rate", "Shown on directory cards and profiles when the consultant has published a starting hourly or daily rate. That rate is what they ask to receive."],
                        ["No platform checkout", "K12Gig does not charge an 18% fee, process cards, send ACH payouts, or issue 1099s. Those steps happen between the district and the consultant."],
                        ["Contract Hub", "Upload working agreements, track draft/sent/signed-externally status, and keep notes. Legally binding signatures happen in the district’s own process."],
                    ].map(([title, body]) => (
                        <div key={title} className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-subtle)] md:p-6">
                            <h2 className="font-heading text-xl font-bold">{title}</h2>
                            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{body}</p>
                        </div>
                    ))}
                </section>

                <section className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-subtle)] md:p-8">
                    <h2 className="font-heading text-2xl font-bold">How money works at launch</h2>
                    <ol className="mt-6 grid gap-4 text-sm leading-6 text-[var(--text-secondary)]">
                        <li><strong className="text-[var(--text-primary)]">1. Post and propose.</strong> Districts post a need. Consultants submit a proposal with a rate and resume.</li>
                        <li><strong className="text-[var(--text-primary)]">2. Accept.</strong> Acceptance creates an engagement both sides see on dashboards and My Gigs.</li>
                        <li><strong className="text-[var(--text-primary)]">3. Coordinate documents.</strong> Use Contract Hub to share the working agreement. Sign it with the district’s usual process.</li>
                        <li><strong className="text-[var(--text-primary)]">4. Pay directly.</strong> Purchase orders, invoices, and payment happen between the district and consultant.</li>
                    </ol>
                </section>

                <section className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-soft)] md:p-8">
                    <h2 className="font-heading text-2xl font-bold">District procurement notes</h2>
                    <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                        Purchase orders, invoice routing, tax-exemption documentation, and contract requirements stay with the district. K12Gig keeps the proposal, engagement, messages, and uploaded contract files available for the hiring team and consultant.
                    </p>
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                        <Link href="/post"><PrimaryButton>Post a need</PrimaryButton></Link>
                        <Link href="/dpa" className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[var(--border-strong)] px-4 text-sm font-bold">
                            Review district documents
                        </Link>
                        <a href={supportMailto("K12Gig pricing and contracting")} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[var(--border-subtle)] px-4 text-sm font-bold text-[var(--text-secondary)] hover:border-[var(--border-strong)]">
                            Ask about contracting
                        </a>
                    </div>
                </section>
            </main>
            <SiteFooter />
        </div>
    );
}
