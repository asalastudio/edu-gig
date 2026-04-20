import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
    createCandidate,
    createInvitation,
    hasCheckrConfig,
} from "@/lib/checkr";

const hasClerk =
    !!process.env.CLERK_SECRET_KEY &&
    !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const hasConvex = !!process.env.NEXT_PUBLIC_CONVEX_URL;

const PACKAGE_NAME = process.env.CHECKR_PACKAGE ?? "driver_pro";

export async function POST() {
    if (!hasCheckrConfig()) {
        return NextResponse.json(
            { error: "Checkr not configured" },
            { status: 503 }
        );
    }
    if (!hasClerk) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!hasConvex) {
        return NextResponse.json(
            { error: "Convex is not configured." },
            { status: 503 }
        );
    }

    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const webhookSecret = process.env.CONVEX_WEBHOOK_SHARED_SECRET;
    if (!webhookSecret) {
        console.error("CONVEX_WEBHOOK_SHARED_SECRET not configured");
        return NextResponse.json(
            { error: "Server misconfigured" },
            { status: 500 }
        );
    }

    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    const viewer = await convex.query(api.users.viewer, {});
    if (!viewer || viewer.role !== "educator") {
        return NextResponse.json(
            { error: "Educator account required" },
            { status: 403 }
        );
    }

    const mine = await convex.query(api.educators.getMine, {});
    if (!mine) {
        return NextResponse.json(
            { error: "Educator profile not found" },
            { status: 404 }
        );
    }

    let candidate;
    let invitation;
    try {
        candidate = await createCandidate({
            email: viewer.email,
            firstName: viewer.firstName,
            lastName: viewer.lastName,
        });
        invitation = await createInvitation({
            candidateId: candidate.id,
            packageName: PACKAGE_NAME,
        });
    } catch (err) {
        console.error("Checkr invite failed:", err);
        return NextResponse.json(
            { error: "Failed to start background check" },
            { status: 502 }
        );
    }

    try {
        await convex.mutation(api.educators.updateVerificationFromWebhook, {
            webhookSecret,
            educatorId: mine._id as Id<"educators">,
            status: "pending",
            backgroundCheckId: candidate.id,
        });
    } catch (err) {
        console.error("Failed to persist pending verification status:", err);
        // Non-fatal — we still return the invitation URL; webhook will correct later.
    }

    return NextResponse.json({
        invitation_url: invitation.invitation_url,
        candidate_id: candidate.id,
    });
}
