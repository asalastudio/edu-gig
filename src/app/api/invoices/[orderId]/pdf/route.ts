import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { generateInvoicePdf, invoiceNumber } from "@/lib/invoice-pdf";

const hasClerk = !!process.env.CLERK_SECRET_KEY && !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const hasConvex = !!process.env.NEXT_PUBLIC_CONVEX_URL;

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ orderId: string }> }
) {
    const { orderId } = await params;
    if (!orderId) {
        return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    if (!hasClerk) {
        return NextResponse.json({ error: "Authentication not configured" }, { status: 401 });
    }

    const { userId, getToken } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasConvex) {
        return NextResponse.json({ error: "Convex is not configured" }, { status: 503 });
    }

    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    try {
        const token = await getToken({ template: "convex" });
        if (token) convex.setAuth(token);
    } catch {
        // Leave auth unset; Convex will return null for the query which we treat as 404.
    }

    let context: Awaited<ReturnType<typeof convex.query<typeof api.orders.getInvoiceContext>>>;
    try {
        context = await convex.query(api.orders.getInvoiceContext, {
            orderId: orderId as Id<"orders">,
        });
    } catch (err) {
        console.error("[invoice route] query failed", err);
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!context) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const buyerName = `${context.buyer.firstName} ${context.buyer.lastName}`.trim() || "Buyer";
    const educatorName =
        `${context.educator.firstName} ${context.educator.lastName}`.trim() || "Educator";

    const bytes = await generateInvoicePdf({
        orderId: context.order._id,
        orgName: context.district.name,
        buyerName,
        educatorName,
        gigTitle: context.gig.title,
        startDate: context.order.startDate,
        totalAmount: context.order.totalAmount,
        platformFee: context.order.platformFee,
        educatorPayout: context.order.educatorPayout,
        poNumber: context.order.poNumber,
        issuedAt: context.order.createdAt ?? Date.now(),
    });

    const filename = `invoice-${invoiceNumber(context.order._id)}.pdf`;
    // Uint8Array is a valid BodyInit — pass directly to NextResponse.
    return new NextResponse(bytes as unknown as BodyInit, {
        status: 200,
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `inline; filename="${filename}"`,
            "Cache-Control": "private, no-store",
        },
    });
}
