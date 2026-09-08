import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

const isProtectedRoute = createRouteMatcher([
    "/dashboard(.*)",
    "/onboarding(.*)",
]);

export default hasClerk
    ? clerkMiddleware(async (auth, req) => {
          if (process.env.APP_ENV === "staging" && !req.nextUrl.pathname.startsWith("/sign-in") && !req.nextUrl.pathname.startsWith("/sign-up")) {
              const session = await auth();
              if (!session.userId) return session.redirectToSignIn({ returnBackUrl: req.url });
              if (!(process.env.QA_ALLOWED_CLERK_IDS ?? "").split(",").includes(session.userId)) {
                  return new NextResponse("Staging reviewer access required", { status: 403 });
              }
          }
          if (isProtectedRoute(req)) {
              await auth.protect();
          }
          return NextResponse.next();
      })
    : function proxy() {
          return NextResponse.next();
      };

export const config = {
    matcher: [
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        "/(api|trpc)(.*)",
    ],
};
