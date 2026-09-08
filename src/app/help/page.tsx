import Link from "next/link";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { primaryButtonClassName } from "@/components/shared/button";
import { SUPPORT_EMAIL, supportMailto } from "@/lib/legal";
import { isCardCheckoutEnabled } from "@/lib/launch-flags";
import { getActiveBetaCopy } from "@/lib/active-beta-copy";

export const metadata = {
    title: "Help",
    description: "Help for districts and educators using K12Gig.",
};

export default function HelpPage() {
    const betaCopy = getActiveBetaCopy(isCardCheckoutEnabled());
    return (
        <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)]">
            <SiteHeader />
            <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12 lg:px-12 lg:py-14">
                <section className="max-w-3xl">
                    <div className="education-rule mb-4" />
                    <h1 className="font-heading text-4xl font-bold leading-tight md:text-5xl">Support for every hiring step.</h1>
                    <p className="mt-5 text-base leading-7 text-[var(--text-secondary)] md:text-lg">
                        Get help with district hiring workflows, consultant profiles, Contract Hub documents, credentials, and marketplace messages.
                    </p>
                </section>

                <section className="grid gap-6 md:grid-cols-2">
                    {[
                        ["Districts", "Post a need, browse consultants, review proposals, accept work, message candidates, and keep contract files in Contract Hub."],
                        ["Consultants", betaCopy.educatorHelp],
                        ["Billing", betaCopy.billingHelp],
                        ["Drafts and posting", "A preview draft stays in this browser session. Sign in, explicitly import it into the intended district account, review the scope, and publish. Use Save draft for an account draft you can return to later."],
                        ["Finding consultants", "Choose support, specialization, grades, service area and availability. Accepting new clients includes limited availability. Saved consultants stay with the signed-in account in this browser."],
                        ["Credential status", "Credentials reviewed means an administrator recorded a review of submitted credentials with supporting evidence. It does not establish a background check or replace your district's checks. Profile complete describes profile fields, not verification."],
                        ["Agreement coordination", "After accepting a proposal, use the engagement's Contract Hub. Upload saves a private draft; Share sends it to the other party. A signed-copy upload does not record external signing or complete the work. Record these actions separately. Payment and signing happen outside K12Gig."],
                        ["Service area and timing", "Confirm the consultant's coverage, remote or on-site delivery, availability and schedule directly. Contact support for policy and account questions."],
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
                        <Link href="/login" className={primaryButtonClassName()}>Open your dashboard</Link>
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
