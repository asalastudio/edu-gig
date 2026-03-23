import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define route patterns per PRD 4.2
const isEducatorRoute = createRouteMatcher(['/dashboard/educator(.*)']);
const isDistrictRoute = createRouteMatcher(['/dashboard/district(.*)']);
const isDistrictAdminRoute = createRouteMatcher(['/dashboard/analytics(.*)']);
const isSuperAdminRoute = createRouteMatcher(['/admin(.*)']);
const isOnboardingRoute = createRouteMatcher(['/onboarding(.*)']);

export default clerkMiddleware(async (auth, req) => {
    // 1. Basic Auth check for all protected routes (dashboard, admin, messages, etc)
    const protectedRoutes = createRouteMatcher(['/dashboard(.*)', '/admin(.*)', '/messages(.*)', '/notifications(.*)']);

    if (protectedRoutes(req)) {
        await auth.protect();

        // 2. We can perform custom role validation using context metadata (e.g. from convex/auth or clerk sessions)
        // Note: This relies on the session Claims containing the role set by Clerk after Convex sync.
        // For now, this just enforces that the user is logged in for these paths.
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
