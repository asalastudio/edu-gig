import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";

export const metadata: Metadata = {
    title: "Terms of Service | K12Gig",
    description: "Terms governing use of the K12Gig platform.",
};

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-[--bg-app] flex flex-col font-sans">
            <SiteHeader />
            <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12 lg:py-16">
                <Link href="/" className="text-sm font-semibold text-[--text-secondary] hover:text-[--accent-primary] mb-8 inline-block">
                    ← Home
                </Link>
                <h1 className="font-heading text-3xl font-bold text-[--text-primary] mb-6">Terms of Service</h1>
                <p className="text-[--text-secondary] text-sm mb-8">Last updated: March 2026</p>
                <div className="prose prose-neutral max-w-none text-[--text-secondary] space-y-4">
                    <p>
                        These terms are a placeholder. Have legal counsel review and replace with your production terms before go-live.
                    </p>
                    <h2 className="font-heading text-xl font-bold text-[--text-primary] pt-4">Use of the platform</h2>
                    <p>Users agree to provide accurate information, comply with applicable laws, and use K12Gig only for lawful purposes.</p>
                    <h2 className="font-heading text-xl font-bold text-[--text-primary] pt-4">Limitation of liability</h2>
                    <p>To be defined with your legal team — including disclaimers appropriate for your jurisdiction and insurance posture.</p>
                    <h2 className="font-heading text-xl font-bold text-[--text-primary] pt-4">Contact</h2>
                    <p>Questions: <a className="underline font-semibold text-[--accent-primary]" href="mailto:hello@edugig.com">hello@edugig.com</a></p>
                </div>
            </main>
            <SiteFooter />
        </div>
    );
}
