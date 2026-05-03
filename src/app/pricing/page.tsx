import Link from "next/link";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { PrimaryButton } from "@/components/shared/button";
import { supportMailto } from "@/lib/legal";

export const metadata = {
    title: "Pricing",
    description: "K12Gig pricing for districts and educators.",
};

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)]">
            <SiteHeader />
            <main className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-16 lg:px-12">
                <section className="max-w-3xl">
                    <div className="education-rule mb-5" />
                    <h1 className="font-heading text-4xl font-bold md:text-6xl">Transparent marketplace pricing.</h1>
                    <p className="mt-6 text-lg leading-8 text-[var(--text-secondary)]">
                        Districts see educator rates before requesting availability. Final totals are confirmed before checkout or invoice.
                    </p>
                </section>

                <section className="grid gap-6 md:grid-cols-3">
                    {[
                        ["Educator rate", "Shown on cards and profiles when the educator has published a starting hourly or daily rate."],
                        ["Platform fee", "Calculated at checkout and included in the final booking total before payment is submitted."],
                        ["District payment", "Card checkout is supported in Stripe. Net-30 invoice, PO number, and ACH workflows are available for eligible district bookings."],
                    ].map(([title, body]) => (
                        <div key={title} className="rounded-lg border border-[var(--border-default)] bg-white p-6 shadow-[var(--shadow-subtle)]">
                            <h2 className="font-heading text-xl font-bold">{title}</h2>
                            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{body}</p>
                        </div>
                    ))}
                </section>

                <section className="rounded-lg border border-[var(--border-default)] bg-white p-8 shadow-[var(--shadow-soft)]">
                    <h2 className="font-heading text-2xl font-bold">District procurement notes</h2>
                    <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                        Purchase orders, invoice routing, tax-exemption documentation, refund review, and contract requirements depend on the district and engagement scope. K12Gig keeps booking records, invoice PDFs, and marketplace messages available for district audit trails.
                    </p>
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                        <Link href="/post"><PrimaryButton>Post a need</PrimaryButton></Link>
                        <Link href="/dpa" className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[var(--border-strong)] px-4 text-sm font-bold">
                            Review district documents
                        </Link>
                        <a href={supportMailto("K12Gig pricing and invoice review")} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[var(--border-subtle)] px-4 text-sm font-bold text-[var(--text-secondary)] hover:border-[var(--border-strong)]">
                            Ask about invoice terms
                        </a>
                    </div>
                </section>
            </main>
            <SiteFooter />
        </div>
    );
}
