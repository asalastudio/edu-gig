import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function proxy(_req: NextRequest) {
    // Temporary no-op middleware.
    // This keeps production healthy when Clerk env vars are not configured.
    return NextResponse.next();
}

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
