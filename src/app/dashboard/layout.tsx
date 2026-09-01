import { OnboardingGuard } from "@/components/shared/onboarding-guard";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return <OnboardingGuard>{children}</OnboardingGuard>;
}
