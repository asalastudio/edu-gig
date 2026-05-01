import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { stripeCheckoutLimiter } from "@/lib/rate-limit";
import { PLATFORM_FEE_PCT, computePricing } from "@/convex/pricing";

const hasStripe = !!process.env.STRIPE_SECRET_KEY;
const hasClerk = !!process.env.CLERK_SECRET_KEY && !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const hasConvex = !!process.env.NEXT_PUBLIC_CONVEX_URL;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function POST(req: Request) {
    if (!hasStripe) {
        return NextResponse.json(
            { error: "Stripe is not configured. Set STRIPE_SECRET_KEY to enable card payments." },
            { status: 503 }
        );
    }

    // Rate limit: 10 req/min per Clerk user id (when authed) or IP (when not).
    const { userId: rlUserId } = hasClerk ? await auth() : { userId: null };
    const rlKey = rlUserId || req.headers.get("x-forwarded-for") || "anonymous";
    const rl = await stripeCheckoutLimiter.check(rlKey);
    if (!rl.success) {
        return NextResponse.json(
            { error: "Too many requests" },
            {
                status: 429,
                headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) },
            }
        );
    }

    let body: {
        gigId?: string;
        startDate?: string;
        endDate?: string;
        poNumber?: string;
    };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { gigId, startDate, endDate, poNumber } = body;
    if (!gigId || !startDate) {
        return NextResponse.json({ error: "gigId and startDate are required" }, { status: 400 });
    }

    if (!hasClerk) {
        return NextResponse.json(
            { error: "Authentication is not configured. Sign-in required for checkout." },
            { status: 401 }
        );
    }

    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasConvex) {
        return NextResponse.json({ error: "Convex is not configured." }, { status: 503 });
    }

    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    const gigData = await convex.query(api.gigs.getById, { gigId: gigId as Id<"gigs"> });
    if (!gigData) {
        return NextResponse.json({ error: "Gig not found" }, { status: 404 });
    }

    const { gigPrice, totalCharged, platformFee, educatorPayout } = computePricing(gigData.gig.price);
    const unitAmountCents = Math.round(totalCharged * 100);

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
            {
                quantity: 1,
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: gigData.gig.title,
                        description: `Includes ${Math.round(PLATFORM_FEE_PCT * 100)}% platform fee ($${platformFee.toFixed(2)})`,
                    },
                    unit_amount: unitAmountCents,
                },
            },
        ],
        success_url: `${APP_URL}/gigs/${gigId}?checkout=success`,
        cancel_url: `${APP_URL}/gigs/${gigId}?checkout=cancelled`,
        metadata: {
            gigId,
            buyerClerkId: userId,
            startDate,
            endDate: endDate ?? "",
            poNumber: poNumber ?? "",
            gigPrice: String(gigPrice),
            platformFee: String(platformFee),
            educatorPayout: String(educatorPayout),
            totalAmount: String(totalCharged),
        },
    });

    return NextResponse.json({ url: session.url });
}
