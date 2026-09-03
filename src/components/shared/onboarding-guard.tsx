"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const viewer = useQuery(api.users.viewer, hasClerk ? {} : "skip");

    useEffect(() => {
        if (!viewer) return;
        if (viewer.onboarded) return;
        const next = encodeURIComponent(pathname || "/dashboard");
        router.replace(`/onboarding?next=${next}`);
    }, [pathname, router, viewer]);

    if (viewer && !viewer.onboarded) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center px-6 text-sm text-[var(--text-secondary)]">
                Finish setting up your account to open the dashboard.
            </div>
        );
    }

    return <>{children}</>;
}
