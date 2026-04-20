import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import {
    hasCheckrConfig,
    hasCheckrWebhookSecret,
    verifyWebhookSignature,
} from "@/lib/checkr";

const hasConvex = !!process.env.NEXT_PUBLIC_CONVEX_URL;

type CheckrWebhookEvent = {
    type?: string;
    data?: {
        object?: {
            id?: string;
            candidate_id?: string;
            status?: string;
            result?: string;
        };
    };
};

export async function POST(req: Request) {
    if (!hasCheckrConfig() || !hasCheckrWebhookSecret()) {
        return NextResponse.json(
            { error: "Checkr webhook not configured" },
            { status: 503 }
        );
    }
    if (!hasConvex) {
        return NextResponse.json(
            { error: "Convex is not configured." },
            { status: 503 }
        );
    }

    const webhookSecret = process.env.CONVEX_WEBHOOK_SHARED_SECRET;
    if (!webhookSecret) {
        console.error("CONVEX_WEBHOOK_SHARED_SECRET not configured");
        return NextResponse.json(
            { error: "Server misconfigured" },
            { status: 500 }
        );
    }

    const rawBody = await req.text();
    const signature = req.headers.get("x-checkr-signature");
    const ok = verifyWebhookSignature(
        rawBody,
        signature,
        process.env.CHECKR_WEBHOOK_SECRET!
    );
    if (!ok) {
        return NextResponse.json(
            { error: "Signature verification failed" },
            { status: 400 }
        );
    }

    let event: CheckrWebhookEvent;
    try {
        event = JSON.parse(rawBody) as CheckrWebhookEvent;
    } catch {
        return NextResponse.json(
            { error: "Invalid JSON body" },
            { status: 400 }
        );
    }

    if (event.type !== "report.completed") {
        return NextResponse.json({
            received: true,
            ignored: event.type ?? "unknown",
        });
    }

    const obj = event.data?.object ?? {};
    const candidateId = obj.candidate_id;
    const reportId = obj.id;
    const result = obj.result;

    if (!candidateId || !reportId) {
        return NextResponse.json(
            { error: "Missing candidate_id or report id" },
            { status: 400 }
        );
    }

    // Candidate id was saved on educator.backgroundCheckId during /invite.
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    const nextStatus = result === "clear" ? "verified" : "unverified";

    try {
        await convex.mutation(api.educators.updateVerificationFromWebhook, {
            webhookSecret,
            lookupBackgroundCheckId: candidateId,
            status: nextStatus,
            backgroundCheckId: reportId,
        });
    } catch (err) {
        // The mutation throws "Educator not found" when the candidate id isn't
        // attached to any educator row. Log and ack so Checkr doesn't retry indefinitely.
        console.error("Checkr verification mutation failed:", err);
    }

    return NextResponse.json({ received: true });
}
