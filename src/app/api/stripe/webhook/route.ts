import { NextResponse } from "next/server";
import Stripe from "stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

const hasStripe = !!process.env.STRIPE_SECRET_KEY && !!process.env.STRIPE_WEBHOOK_SECRET;
const hasConvex = !!process.env.NEXT_PUBLIC_CONVEX_URL;

function stripeObjectId(value: unknown): string {
    if (typeof value === "string") return value;
    if (value && typeof value === "object" && "id" in value) {
        const id = (value as { id?: unknown }).id;
        return typeof id === "string" ? id : "";
    }
    return "";
}

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

    const webhookSecret = process.env.CONVEX_WEBHOOK_SHARED_SECRET;
    if (!webhookSecret) {
        console.error("CONVEX_WEBHOOK_SHARED_SECRET not configured");
        return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    const eventType = event.type as string;
    if (eventType === "payment_intent.refunded") {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await convex.mutation(api.orders.markRefundedFromWebhook, {
            webhookSecret,
            stripeEventId: event.id,
            stripePaymentIntentId: paymentIntent.id,
            refundAmount: Math.max(0, (paymentIntent.amount_received - paymentIntent.amount) / 100),
        });
        return NextResponse.json({ received: true });
    }

    if (eventType === "charge.refunded") {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = stripeObjectId(charge.payment_intent);
        if (!paymentIntentId) {
            return NextResponse.json({ error: "Missing payment intent" }, { status: 400 });
        }
        await convex.mutation(api.orders.markRefundedFromWebhook, {
            webhookSecret,
            stripeEventId: event.id,
            stripePaymentIntentId: paymentIntentId,
            refundAmount: (charge.amount_refunded ?? 0) / 100,
        });
        return NextResponse.json({ received: true });
    }

    if (eventType === "charge.dispute.created") {
        const dispute = event.data.object as Stripe.Dispute;
        const paymentIntentId = stripeObjectId(dispute.payment_intent);
        if (!paymentIntentId) {
            return NextResponse.json({ error: "Dispute missing payment intent" }, { status: 400 });
        }
        await convex.mutation(api.orders.markDisputedFromWebhook, {
            webhookSecret,
            stripeEventId: event.id,
            stripePaymentIntentId: paymentIntentId,
            disputeId: dispute.id,
            amount: dispute.amount / 100,
            reason: dispute.reason || undefined,
        });
        return NextResponse.json({ received: true });
    }

    if (eventType !== "checkout.session.completed") {
        return NextResponse.json({ received: true, ignored: event.type });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata ?? {};
    const gigId = metadata.gigId;
    const buyerClerkId = metadata.buyerClerkId;
    const startDate = metadata.startDate;
    const pricingMetadataKeys = ["gigPrice", "platformFee", "educatorPayout", "totalAmount"] as const;
    const missingPricingMetadata = pricingMetadataKeys.filter((key) => !metadata[key]);
    const paymentIntentId =
        typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id ?? "";

    if (!gigId || !buyerClerkId || !startDate || !paymentIntentId || missingPricingMetadata.length > 0) {
        console.error("Incomplete Stripe metadata", metadata);
        return NextResponse.json({ error: "Incomplete session metadata" }, { status: 400 });
    }

    const gigPrice = Number(metadata.gigPrice);
    const platformFee = Number(metadata.platformFee);
    const educatorPayout = Number(metadata.educatorPayout);
    const totalAmount = Number(metadata.totalAmount);
    if (![gigPrice, platformFee, educatorPayout, totalAmount].every(Number.isFinite)) {
        console.error("Invalid Stripe pricing metadata", metadata);
        return NextResponse.json({ error: "Invalid session metadata" }, { status: 400 });
    }

    try {
        await convex.mutation(api.orders.createFromWebhook, {
            webhookSecret,
            stripeEventId: event.id,
            gigId: gigId as Id<"gigs">,
            buyerClerkId,
            startDate,
            endDate: metadata.endDate || undefined,
            poNumber: metadata.poNumber || undefined,
            paymentMethod: "card",
            stripePaymentIntentId: paymentIntentId,
            gigPrice,
            platformFee,
            educatorPayout,
            totalAmount,
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes("Pricing tampered with")) {
            console.error("Stripe metadata pricing mismatch", { eventId: event.id, metadata });
            return NextResponse.json({ error: "Pricing tampered with" }, { status: 400 });
        }
        console.error("Convex order creation from webhook failed:", err);
        return NextResponse.json({ error: "Order creation failed" }, { status: 500 });
    }

    return NextResponse.json({ received: true });
}
