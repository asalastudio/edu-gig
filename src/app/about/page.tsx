import Link from "next/link";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { PrimaryButton } from "@/components/shared/button";

export const metadata = {
    title: "About",
    description: "K12Gig connects school systems with verified K-12 educators, coaches, substitutes, and specialists.",
};

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)]">
            <SiteHeader />
            <main className="mx-auto flex max-w-6xl flex-col gap-14 px-6 py-16 lg:px-12">
                <section className="max-w-3xl">
                    <div className="education-rule mb-5" />
                    <h1 className="font-heading text-4xl font-bold leading-tight md:text-6xl">
                        A clearer marketplace for K-12 talent.
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-[var(--text-secondary)]">
                        K12Gig is built for districts that need trusted educator support without opaque staffing markups, and for educators who want direct, professional access to district opportunities.
                    </p>
                </section>

                <section className="grid gap-6 md:grid-cols-3">
                    {[
                        ["District-first", "Search by instructional need, grade band, coverage area, verification tier, and availability."],
                        ["Educator-respecting", "Profiles foreground credentials, expertise, rates, and engagement preferences."],
                        ["Procurement-aware", "Legal, privacy, DPA, invoice, and purchase-order workflows are treated as part of the product."],
                    ].map(([title, body]) => (
                        <div key={title} className="rounded-lg border border-[var(--border-default)] bg-white p-6 shadow-[var(--shadow-subtle)]">
                            <h2 className="font-heading text-xl font-bold">{title}</h2>
                            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{body}</p>
                        </div>
                    ))}
                </section>

                <section className="rounded-lg border border-[var(--border-default)] bg-white p-8 shadow-[var(--shadow-soft)]">
                    <h2 className="font-heading text-2xl font-bold">Who K12Gig serves</h2>
                    <div className="mt-6 grid gap-6 md:grid-cols-2">
                        <div>
                            <h3 className="font-bold">District leaders</h3>
                            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                                Superintendents, HR teams, principals, and department leaders can source vetted educators for short-term, consulting, intervention, and placement needs.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-bold">Educators and specialists</h3>
                            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                                Teachers, coaches, therapists, interventionists, substitutes, and consultants can present their expertise and work directly with districts.
                            </p>
                        </div>
                    </div>
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                        <Link href="/browse"><PrimaryButton>Browse educators</PrimaryButton></Link>
                        <Link href="/#for-educators" className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[var(--border-strong)] px-4 text-sm font-bold">
                            Educator path
                        </Link>
                    </div>
                </section>
            </main>
            <SiteFooter />
        </div>
    );
}
