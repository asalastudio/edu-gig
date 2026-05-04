import Link from "next/link";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { PrimaryButton } from "@/components/shared/button";
import { supportMailto } from "@/lib/legal";
import { PLATFORM_FEE_PCT, computePricing } from "@/convex/pricing";

export const metadata = {
    title: "Pricing",
    description: "K12Gig pricing for districts and educators.",
};

const PLATFORM_FEE_PERCENT_LABEL = `${Math.round(PLATFORM_FEE_PCT * 100)}%`;
const SAMPLE_HOURLY_RATE = 100;
const sample = computePricing(SAMPLE_HOURLY_RATE);

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)]">
            <SiteHeader />
            <main className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-16 lg:px-12">
                <section className="max-w-3xl">
                    <div className="education-rule mb-5" />
                    <h1 className="font-heading text-4xl font-bold md:text-6xl">Transparent marketplace pricing.</h1>
                    <p className="mt-6 text-lg leading-8 text-[var(--text-secondary)]">
                        Districts see educator rates before requesting availability. K12Gig adds a flat <strong>{PLATFORM_FEE_PERCENT_LABEL} platform fee</strong> at checkout — fully disclosed before payment.
                    </p>
                </section>

                <section className="grid gap-6 md:grid-cols-3">
                    {[
                        ["Educator rate", "Shown on cards and profiles when the educator has published a starting hourly or daily rate. Educators receive 100% of their listed rate."],
                        ["Platform fee", `Flat ${PLATFORM_FEE_PERCENT_LABEL} of the educator's rate, added at checkout and shown line-item in the final booking total before payment.`],
                        ["District payment", "Card checkout via Stripe today. Net-30 invoice with PO number is supported for eligible district bookings. ACH from districts is on the roadmap."],
                    ].map(([title, body]) => (
                        <div key={title} className="rounded-lg border border-[var(--border-default)] bg-white p-6 shadow-[var(--shadow-subtle)]">
                            <h2 className="font-heading text-xl font-bold">{title}</h2>
                            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{body}</p>
                        </div>
                    ))}
                </section>

                <section className="rounded-lg border border-[var(--border-default)] bg-white p-8 shadow-[var(--shadow-subtle)]">
                    <h2 className="font-heading text-2xl font-bold">Sample booking</h2>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">For an educator who lists ${SAMPLE_HOURLY_RATE.toFixed(2)}/hour:</p>
                    <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
                        <div className="flex justify-between rounded-lg bg-[var(--bg-subtle)] px-4 py-3">
                            <dt className="text-[var(--text-secondary)]">Educator rate</dt>
                            <dd className="font-bold text-[var(--text-primary)] tabular-nums">${sample.gigPrice.toFixed(2)}</dd>
                        </div>
                        <div className="flex justify-between rounded-lg bg-[var(--bg-subtle)] px-4 py-3">
                            <dt className="text-[var(--text-secondary)]">Platform fee ({PLATFORM_FEE_PERCENT_LABEL})</dt>
                            <dd className="font-bold text-[var(--text-primary)] tabular-nums">${sample.platformFee.toFixed(2)}</dd>
                        </div>
                        <div className="flex justify-between rounded-lg border border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/5 px-4 py-3 sm:col-span-2">
                            <dt className="font-bold text-[var(--text-primary)]">District pays</dt>
                            <dd className="font-bold text-[var(--text-primary)] tabular-nums">${sample.totalCharged.toFixed(2)}</dd>
                        </div>
                        <div className="flex justify-between rounded-lg border border-[var(--accent-success)]/30 bg-[var(--accent-success)]/5 px-4 py-3 sm:col-span-2">
                            <dt className="font-bold text-[var(--text-primary)]">Educator receives</dt>
                            <dd className="font-bold text-[var(--text-primary)] tabular-nums">${sample.educatorPayout.toFixed(2)}</dd>
                        </div>
                    </dl>
                    <p className="mt-4 text-xs text-[var(--text-tertiary)]">Educators are paid weekly via ACH during the K12Gig private beta. A 1099 is issued at year-end.</p>
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
