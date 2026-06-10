"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PrimaryButton } from "@/components/shared/button";
import { isDistrictRole } from "@/lib/roles";

const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

type ExpectedRole = "educator" | "district";

const BLOCKED_COPY: Record<ExpectedRole, { title: string; body: string; href: string; cta: string }> = {
    educator: {
        title: "This area is for educator accounts",
        body: "Your account is set up as a district hiring team. Educator tools — gigs, credentials, and earnings — live in the educator workspace.",
        href: "/dashboard/district",
        cta: "Go to district dashboard",
    },
    district: {
        title: "This area is for district accounts",
        body: "Your account is set up as an educator. District tools — browsing educators, posting needs, and bookings — live in the district workspace.",
        href: "/dashboard/educator",
        cta: "Go to educator dashboard",
    },
};

/**
 * Hard separation between educator and district dashboard surfaces.
 * Signed-out and demo-mode visitors pass through (middleware + per-page
 * guards handle those); superadmin can view both workspaces.
 */
export function RoleGuard({ expected, children }: { expected: ExpectedRole; children: React.ReactNode }) {
    const viewer = useQuery(api.users.viewer, hasClerk ? {} : "skip");

    const isWrongRole =
        !!viewer &&
        viewer.role !== "superadmin" &&
        (expected === "educator" ? viewer.role !== "educator" : !isDistrictRole(viewer.role));

    if (!isWrongRole) return <>{children}</>;

    const copy = BLOCKED_COPY[expected];
    return (
        <div className="flex min-h-[60vh] items-center justify-center px-6">
            <div className="max-w-md rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] p-8 text-center">
                <h1 className="text-lg font-semibold text-[var(--text-primary)]">{copy.title}</h1>
                <p className="mt-3 text-sm text-[var(--text-secondary)]">{copy.body}</p>
                <div className="mt-6 flex justify-center">
                    <Link href={copy.href}>
                        <PrimaryButton>{copy.cta}</PrimaryButton>
                    </Link>
                </div>
            </div>
        </div>
    );
}
