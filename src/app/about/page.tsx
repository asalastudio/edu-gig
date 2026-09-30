import Link from "next/link";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { PrimaryButton } from "@/components/shared/button";

export const metadata = {
    title: "About",
    description: "K12Gig connects school districts with K-12 consultants, coaches, and specialists.",
};

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)]">
            <SiteHeader />
            <main id="main-content" className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12 lg:px-12 lg:py-14">
                <section className="max-w-3xl">
                    <div className="education-rule mb-4" />
                    <h1 className="font-heading text-4xl font-bold leading-tight md:text-5xl">
                        A clearer marketplace for K-12 talent.
                    </h1>
                    <p className="mt-5 text-base leading-7 text-[var(--text-secondary)] md:text-lg">
                        K12Gig is built for districts that need experienced consultant support without opaque staffing markups, and for consultants who want direct, professional access to district opportunities.
                    </p>
                </section>

                <section className="grid gap-6 md:grid-cols-3">
                    {[
                        ["District-first", "Search by support area, grade band, and coverage area, then post a gig consultants can propose on."],
                        ["Consultant-respecting", "Profiles foreground credentials, resumes, expertise, rates, and availability."],
                        ["Off-platform by design", "K12Gig connects districts and consultants. Contracts, purchase orders, and payment are arranged directly between them."],
                    ].map(([title, body]) => (
                        <div key={title} className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-subtle)] md:p-6">
                            <h2 className="font-heading text-xl font-bold">{title}</h2>
                            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{body}</p>
                        </div>
                    ))}
                </section>

                <section className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-soft)] md:p-8">
                    <h2 className="font-heading text-2xl font-bold">Who K12Gig serves</h2>
                    <div className="mt-6 grid gap-6 md:grid-cols-2">
                        <div>
                            <h3 className="font-bold">District leaders</h3>
                            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                                Superintendents, HR teams, principals, and department leaders can post gigs, review consultant proposals, and find support for short-term and consulting work.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-bold">Consultants and specialists</h3>
                            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                                Coaches, interventionists, speakers, therapists, and consulting firms can present their expertise and work directly with districts.
                            </p>
                        </div>
                    </div>
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                        <Link href="/browse"><PrimaryButton>Find consultants</PrimaryButton></Link>
                        <Link href="/#for-educators" className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[var(--border-strong)] px-4 text-sm font-bold">
                            For consultants
                        </Link>
                    </div>
                </section>
            </main>
            <SiteFooter />
        </div>
    );
}
