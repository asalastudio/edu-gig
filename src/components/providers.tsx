"use client";

import { ReactNode } from "react";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { MonitoringInit } from "@/components/monitoring-init";
import { SeedAccountLinker } from "@/components/seed-account-linker";
import { ConvexReactClient, ConvexProvider } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "https://dummy-url.convex.cloud";
const convex = new ConvexReactClient(convexUrl);

// Override Clerk's default "{{applicationName}}" copy so the auth UI reads
// "K12Gig" regardless of the application name configured in the Clerk dashboard.
const clerkLocalization = {
    signIn: {
        start: {
            title: "Sign in to K12Gig",
            subtitle: "Welcome back! Please sign in to continue",
        },
    },
    signUp: {
        start: {
            title: "Create your K12Gig account",
            subtitle: "Welcome! Please fill in the details to get started.",
        },
    },
};

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
        <ClerkProvider publishableKey={publishableKey} localization={clerkLocalization}>
            <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
                <MonitoringInit />
                <SeedAccountLinker />
                {children}
            </ConvexProviderWithClerk>
        </ClerkProvider>
    );
}

export function Providers({ children }: { children: ReactNode }) {
    return <ClerkConvexProviders>{children}</ClerkConvexProviders>;
}
