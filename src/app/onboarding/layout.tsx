/** Avoid static prerender of onboarding (Clerk hooks need request-time context). */
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Set up your account" };

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
    return children;
}
