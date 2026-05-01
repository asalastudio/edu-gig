import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";

export const metadata: Metadata = {
    title: "Privacy Policy | K12Gig",
    description: "How K12Gig handles personal information and district data.",
};

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-[--bg-app] flex flex-col font-sans">
            <SiteHeader />
            <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12 lg:py-16">
                <Link href="/" className="text-sm font-semibold text-[--text-secondary] hover:text-[--accent-primary] mb-8 inline-block">
                    ← Home
                </Link>
                <h1 className="font-heading text-3xl font-bold text-[--text-primary] mb-6">Privacy Policy</h1>
                <p className="text-[--text-secondary] text-sm mb-8">Last updated: March 2026</p>
                <div className="prose prose-neutral max-w-none text-[--text-secondary] space-y-4">
                    <p>
                        K12Gig connects educators and districts. This page is a placeholder; replace with counsel-reviewed language before
                        production launch.
                    </p>
                    <h2 className="font-heading text-xl font-bold text-[--text-primary] pt-4">Information we collect</h2>
                    <p>Account credentials (via Clerk), profile and professional information you provide, and usage data needed to operate the service.</p>
                    <h2 className="font-heading text-xl font-bold text-[--text-primary] pt-4">How we use data</h2>
                    <p>To provide matching, messaging, billing, safety, and support — and to improve the product in line with your agreements.</p>
                    <h2 className="font-heading text-xl font-bold text-[--text-primary] pt-4">Contact</h2>
                    <p>Questions: <a className="underline font-semibold text-[--accent-primary]" href="mailto:hello@edugig.com">hello@edugig.com</a></p>
                </div>
            </main>
            <SiteFooter />
        </div>
    );
}
