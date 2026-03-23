"use client";

import { ReactNode } from "react";
import { ConvexReactClient, ConvexProvider } from "convex/react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "https://dummy-url.convex.cloud";
const convex = new ConvexReactClient(convexUrl);

export function Providers({ children }: { children: ReactNode }) {
    // Currently using base ConvexProvider. We'll swap to ConvexProviderWithClerk once Clerk config is added to .env.local
    return (
        <ConvexProvider client={convex}>
            {children}
        </ConvexProvider>
    );
}
