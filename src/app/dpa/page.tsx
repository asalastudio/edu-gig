import Link from "next/link";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { PrimaryButton } from "@/components/shared/button";
import { ProcurementRequestForm } from "@/components/procurement/procurement-request-form";
import { SUPPORT_EMAIL } from "@/lib/legal";

export const metadata = {
    title: "District DPA",
    description: "District data-processing and procurement information for K12Gig.",
};

export default function DistrictDpaPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)]">
            <SiteHeader />
            <main id="main-content" className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12 lg:px-12 lg:py-14">
                <section className="max-w-3xl">
                    <div className="education-rule mb-4" />
                    <h1 className="font-heading text-4xl font-bold leading-tight md:text-5xl">District procurement and data review.</h1>
                    <p className="mt-5 text-base leading-7 text-[var(--text-secondary)] md:text-lg">
                        K12Gig supports district review of privacy, data processing, security, retention, and subprocessors before your team uses the platform.
                    </p>
                </section>

                <section className="grid gap-6 md:grid-cols-3">
                    {[
                        ["Student-data posture", "K12Gig connects districts with consultants; it is not a student-records system. Gig descriptions and messages should avoid unnecessary student-identifying details."],
                        ["Contract packet", "District teams can review the Privacy Policy, Terms of Service, DPA materials, and subprocessor details before using K12Gig."],
                        ["Security contacts", `Incident, privacy, contract, and procurement questions route through ${SUPPORT_EMAIL}.`],
                    ].map(([title, body]) => (
                        <div key={title} className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-subtle)] md:p-6">
                            <h2 className="font-heading text-xl font-bold">{title}</h2>
                            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{body}</p>
                        </div>
                    ))}
                </section>

                <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_440px]">
                    <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-soft)] md:p-8">
                        <h2 className="font-heading text-2xl font-bold">What the district packet covers</h2>
                        <div className="mt-6 grid gap-4 sm:grid-cols-2">
                            {[
                                "Authorized users and account roles",
                                "Student-data minimization posture",
                                "Confidentiality and permitted use",
                                "Subprocessor and hosting categories",
                                "Security incident contact path",
                                "Retention, deletion, and audit support",
                                "No payment processing — contracts and payment stay between district and consultant",
                                "Signed district agreement precedence",
                            ].map((item) => (
                                <div key={item} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4 text-sm font-semibold text-[var(--text-secondary)]">
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>

                    <ProcurementRequestForm />
                </section>

                <section className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-subtle)] md:p-8">
                    <h2 className="font-heading text-2xl font-bold">District onboarding path</h2>
                    <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                        During account setup, district users confirm the current Terms and Privacy Policy. Districts that need a DPA
                        or data-privacy review should request the packet before inviting staff. Contracts, purchase orders, and payment for
                        each engagement are handled directly between the district and the consultant.
                    </p>
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                        <Link href="/sign-up?intent=district">
                            <PrimaryButton>Create district account</PrimaryButton>
                        </Link>
                        <Link href="/pricing" className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[var(--border-strong)] px-4 text-sm font-bold">
                            How pricing works
                        </Link>
                    </div>
                </section>
            </main>
            <SiteFooter />
        </div>
    );
}
