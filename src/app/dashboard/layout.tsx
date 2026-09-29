import type { Metadata } from "next";
import { OnboardingGuard } from "@/components/shared/onboarding-guard";

export const metadata: Metadata = { title: { default: "Dashboard", template: "%s | K12Gig" } };

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return <OnboardingGuard>{children}</OnboardingGuard>;
}
