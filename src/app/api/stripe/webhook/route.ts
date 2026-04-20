import { NextResponse } from "next/server";
import Stripe from "stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

const hasStripe = !!process.env.STRIPE_SECRET_KEY && !!process.env.STRIPE_WEBHOOK_SECRET;
const hasConvex = !!process.env.NEXT_PUBLIC_CONVEX_URL;

export async function POST(req: Request) {
    if (!hasStripe) {
        return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 503 });
    }
    if (!hasConvex) {
        return NextResponse.json({ error: "Convex is not configured." }, { status: 503 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
        return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
    }

    const rawBody = await req.text();
    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(
            rawBody,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err) {
        console.error("Stripe webhook signature failed:", err);
        return NextResponse.json({ error: "Signature verification failed" }, { status: 400 });
    }

    if (event.type !== "checkout.session.completed") {
        return NextResponse.json({ received: true, ignored: event.type });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata ?? {};
    const gigId = metadata.gigId;
    const buyerClerkId = metadata.buyerClerkId;
    const startDate = metadata.startDate;
    const totalAmount = Number(metadata.totalAmount ?? "0");
    const paymentIntentId =
        typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id ?? "";

    if (!gigId || !buyerClerkId || !startDate || !paymentIntentId || !totalAmount) {
        console.error("Incomplete Stripe metadata", metadata);
        return NextResponse.json({ error: "Incomplete session metadata" }, { status: 400 });
    }

    const webhookSecret = process.env.CONVEX_WEBHOOK_SHARED_SECRET;
    if (!webhookSecret) {
        console.error("CONVEX_WEBHOOK_SHARED_SECRET not configured");
        return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    try {
        await convex.mutation(api.orders.createFromWebhook, {
            webhookSecret,
            gigId: gigId as Id<"gigs">,
            buyerClerkId,
            startDate,
            endDate: metadata.endDate || undefined,
            poNumber: metadata.poNumber || undefined,
            paymentMethod: "card",
            stripePaymentIntentId: paymentIntentId,
            totalAmount,
        });
    } catch (err) {
        console.error("Convex order creation from webhook failed:", err);
        return NextResponse.json({ error: "Order creation failed" }, { status: 500 });
    }

    return NextResponse.json({ received: true });
}
