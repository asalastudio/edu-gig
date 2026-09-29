"use client";

import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { isDistrictRole } from "@/lib/roles";

export type AccountNav = {
    loading: boolean;
    signedIn: boolean;
    /** Onboarded consultant: they can't post gigs, so nav points them at the Gig Board. */
    isConsultant: boolean;
    dashboardHref: string;
    dashboardLabel: string;
};

export const SIGNED_OUT_NAV: AccountNav = {
    loading: false,
    signedIn: false,
    isConsultant: false,
    dashboardHref: "/onboarding",
    dashboardLabel: "Finish setup",
};

export const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

/**
 * Header/footer account state. Only call under ClerkProvider (when `hasClerk`).
 * Auth state comes from Clerk (the actual session) — not the Convex profile
 * row, which only exists after onboarding completes. Otherwise a signed-in
 * user who hasn't finished setup wrongly reads as logged out.
 */
export function useAccountNav(): AccountNav {
    const { isLoaded, isSignedIn } = useUser();
    const viewer = useQuery(api.users.viewer, {});
    const signedIn = !!isSignedIn;
    const loading = !isLoaded || (signedIn && viewer === undefined);

    if (!viewer?.onboarded) {
        return { ...SIGNED_OUT_NAV, loading, signedIn };
    }

    let dashboardHref = "/dashboard/educator";
    if (viewer.role === "superadmin") dashboardHref = "/dashboard/admin";
    else if (isDistrictRole(viewer.role)) dashboardHref = "/dashboard/district";

    return {
        loading,
        signedIn,
        isConsultant: signedIn && viewer.role === "educator",
        dashboardHref,
        dashboardLabel: "Dashboard",
    };
}
