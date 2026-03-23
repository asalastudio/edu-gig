/** Avoid static prerender of onboarding (Clerk hooks need request-time context). */
export const dynamic = "force-dynamic";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
    return children;
}
