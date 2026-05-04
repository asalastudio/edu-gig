"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sidebar } from "@/components/shared/sidebar";
import { PageHeader } from "@/components/shared/page-header";
import { canAccessAdmin } from "@/lib/map-admin";

type AdminShellProps = {
    title: string;
    description?: string;
    children: React.ReactNode;
    actions?: React.ReactNode;
};

const adminTabs = [
    { href: "/dashboard/admin", label: "Overview", value: "overview" },
    { href: "/dashboard/admin/users", label: "Users", value: "users" },
    { href: "/dashboard/admin/districts", label: "Districts", value: "districts" },
    { href: "/dashboard/admin/educators", label: "Educators", value: "educators" },
    { href: "/dashboard/admin/orders", label: "Orders", value: "orders" },
    { href: "/dashboard/admin/procurement", label: "Procurement", value: "procurement" },
    { href: "/dashboard/admin/verification", label: "Verification", value: "verification" },
] as const;

export function AdminShell({ title, description, children, actions }: AdminShellProps) {
    const pathname = usePathname();
    const viewer = useQuery(api.users.viewer, {});
    const claimManualSuperadmin = useMutation(api.users.claimManualSuperadmin);
    const claimStartedRef = useRef(false);
    const [claimAttempted, setClaimAttempted] = useState(false);
    const activeTab =
        adminTabs.find((tab) =>
            tab.href === "/dashboard/admin" ? pathname === tab.href : pathname === tab.href || pathname.startsWith(`${tab.href}/`)
        )?.value ?? "overview";

    useEffect(() => {
        if (viewer === undefined || viewer?.role === "superadmin" || claimAttempted || claimStartedRef.current) return;
        claimStartedRef.current = true;
        claimManualSuperadmin()
            .catch(() => {
                setClaimAttempted(true);
            });
    }, [claimAttempted, claimManualSuperadmin, viewer]);

    if (viewer === undefined || ((viewer === null || viewer.role !== "superadmin") && !claimAttempted)) {
        return (
            <AdminFrame>
                <div className="max-w-[1600px] space-y-8">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-12 w-96 max-w-full" />
                    <Skeleton className="h-10 w-full max-w-4xl" />
                    <div className="grid gap-4 md:grid-cols-3">
                        <Skeleton className="h-32 rounded-lg" />
                        <Skeleton className="h-32 rounded-lg" />
                        <Skeleton className="h-32 rounded-lg" />
                    </div>
                </div>
            </AdminFrame>
        );
    }

    if (!viewer || !canAccessAdmin(viewer.role)) {
        return (
            <AdminFrame>
                <Card className="max-w-xl border-[var(--border-subtle)] shadow-[var(--shadow-soft)]">
                    <CardContent className="p-8">
                        <Badge variant="outline" className="mb-4">
                            Superadmin only
                        </Badge>
                        <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)]">Admin access required</h1>
                        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                            The operations workspace is limited to manually granted K12Gig superadmin accounts.
                        </p>
                        <Link
                            href="/dashboard/district"
                            className="mt-6 inline-flex text-sm font-bold text-[var(--accent-primary)] hover:underline"
                        >
                            Back to dashboard
                        </Link>
                    </CardContent>
                </Card>
            </AdminFrame>
        );
    }

    return (
        <AdminFrame>
            <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-8">
                <div className="flex flex-col gap-6 border-b border-[var(--border-subtle)] pb-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <PageHeader title={title} description={description} actions={actions} />
                        <Badge className="w-fit rounded-md bg-[#17261F] px-3 py-1 text-white hover:bg-[#17261F]">
                            Superadmin
                        </Badge>
                    </div>
                    <Tabs value={activeTab} className="w-full">
                        <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-lg border border-[var(--border-subtle)] bg-white p-1 shadow-sm">
                            {adminTabs.map((tab) => (
                                <TabsTrigger key={tab.value} value={tab.value} asChild className="shrink-0">
                                    <Link href={tab.href}>{tab.label}</Link>
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                </div>
                {children}
            </div>
        </AdminFrame>
    );
}

function AdminFrame({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen bg-[var(--bg-subtle)] font-sans">
            <Sidebar />
            <main className="flex-1 overflow-y-auto px-6 py-8 lg:px-10 lg:py-10">{children}</main>
        </div>
    );
}
