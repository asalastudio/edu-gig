"use client";

import { ReactNode, useEffect, useState, useRef } from "react";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { MonitoringInit } from "@/components/monitoring-init";
import { ConvexReactClient, ConvexProvider } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "https://dummy-url.convex.cloud";


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

function useSessionClient() {
    const [client]=useState(()=>new ConvexReactClient(convexUrl));
    const closeTimer=useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(()=>{
        if(closeTimer.current) clearTimeout(closeTimer.current);
        return ()=>{closeTimer.current=setTimeout(()=>{void client.close();},0);};
    },[client]);
    return client;
}
function AccountConvexSession({ children }: { children: ReactNode }) {
    const client=useSessionClient();
    return <ConvexProviderWithClerk client={client} useAuth={useAuth}><MonitoringInit />{children}</ConvexProviderWithClerk>;
}
function IdentityBoundary({ children }: { children: ReactNode }) {
    const { isLoaded, userId, sessionId } = useAuth();
    if (!isLoaded) return <div role="status">Checking your session…</div>;
    return <AccountConvexSession key={`${userId ?? "anonymous"}:${sessionId ?? "none"}`}>{children}</AccountConvexSession>;
}
function PublicConvexSession({ children }: { children: ReactNode }) {
    const client=useSessionClient();
    return <ConvexProvider client={client}><MonitoringInit />{children}</ConvexProvider>;
}
function ClerkConvexProviders({ children }: { children: ReactNode }) {
    const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    if (!publishableKey) {
        return (
            <PublicConvexSession>{children}</PublicConvexSession>
        );
    }
    return (
        <ClerkProvider publishableKey={publishableKey} localization={clerkLocalization}>
            <IdentityBoundary>{children}</IdentityBoundary>
        </ClerkProvider>
    );
}

export function Providers({ children }: { children: ReactNode }) {
    return <ClerkConvexProviders>{children}</ClerkConvexProviders>;
}
