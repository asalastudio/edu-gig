"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useRef } from "react";
import { api } from "@/convex/_generated/api";

/** After Clerk sign-in, attach pre-seeded Convex demo rows (`seed:<email>`) to the live Clerk user id. */
export function SeedAccountLinker() {
    const { isSignedIn, isLoaded } = useAuth();
    const viewer = useQuery(api.users.viewer, isSignedIn ? {} : "skip");
    const claimSeededDemoAccount = useMutation(api.users.claimSeededDemoAccount);
    const attempted = useRef(false);

    useEffect(() => {
        if (!isLoaded || !isSignedIn || viewer !== null || attempted.current) return;
        attempted.current = true;
        void claimSeededDemoAccount().catch(() => {
            attempted.current = false;
        });
    }, [isLoaded, isSignedIn, viewer, claimSeededDemoAccount]);

    return null;
}
