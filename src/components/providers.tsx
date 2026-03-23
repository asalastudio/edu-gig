"use client";

import { ReactNode } from "react";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { MonitoringInit } from "@/components/monitoring-init";
import { ConvexReactClient, ConvexProvider } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "https://dummy-url.convex.cloud";
const convex = new ConvexReactClient(convexUrl);

function ClerkConvexProviders({ children }: { children: ReactNode }) {
    const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    if (!publishableKey) {
        return (
            <ConvexProvider client={convex}>
                <MonitoringInit />
                {children}
            </ConvexProvider>
        );
    }
    return (
        <ClerkProvider publishableKey={publishableKey}>
            <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
                <MonitoringInit />
                {children}
            </ConvexProviderWithClerk>
        </ClerkProvider>
    );
}

export function Providers({ children }: { children: ReactNode }) {
    return <ClerkConvexProviders>{children}</ClerkConvexProviders>;
}
