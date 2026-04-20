/**
 * Thin Checkr API client.
 *
 * Environment:
 *  - CHECKR_API_KEY       – basic-auth username; password is empty
 *  - CHECKR_WEBHOOK_SECRET – HMAC-SHA256 shared secret for incoming webhooks
 *
 * All network calls go through `fetch`; we do not add an SDK dependency.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

const CHECKR_BASE = "https://api.checkr.com/v1";

export function hasCheckrConfig(): boolean {
    return !!process.env.CHECKR_API_KEY;
}

export function hasCheckrWebhookSecret(): boolean {
    return !!process.env.CHECKR_WEBHOOK_SECRET;
}

function authHeader(): string {
    const key = process.env.CHECKR_API_KEY ?? "";
    return `Basic ${Buffer.from(`${key}:`).toString("base64")}`;
}

async function checkrRequest<T>(
    path: string,
    init: RequestInit & { body?: string } = {}
): Promise<T> {
    const res = await fetch(`${CHECKR_BASE}${path}`, {
        ...init,
        headers: {
            Authorization: authHeader(),
            "Content-Type": "application/json",
            Accept: "application/json",
            ...(init.headers ?? {}),
        },
    });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
            `Checkr ${init.method ?? "GET"} ${path} failed: ${res.status} ${text}`
        );
    }
    return (await res.json()) as T;
}

// ─── Candidates ──────────────────────────────────────────────

export interface CheckrCandidate {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
}

export async function createCandidate(params: {
    email: string;
    firstName: string;
    lastName: string;
}): Promise<CheckrCandidate> {
    return await checkrRequest<CheckrCandidate>("/candidates", {
        method: "POST",
        body: JSON.stringify({
            email: params.email,
            first_name: params.firstName,
            last_name: params.lastName,
        }),
    });
}

// ─── Invitations ─────────────────────────────────────────────

export interface CheckrInvitation {
    id: string;
    invitation_url: string;
    status?: string;
    candidate_id?: string;
    package?: string;
}

export async function createInvitation(params: {
    candidateId: string;
    packageName: string;
}): Promise<CheckrInvitation> {
    return await checkrRequest<CheckrInvitation>("/invitations", {
        method: "POST",
        body: JSON.stringify({
            candidate_id: params.candidateId,
            package: params.packageName,
        }),
    });
}

// ─── Reports ─────────────────────────────────────────────────

export interface CheckrReport {
    id: string;
    status: string;
    result?: string;
    candidate_id?: string;
}

export async function getReport(params: {
    reportId: string;
}): Promise<CheckrReport> {
    return await checkrRequest<CheckrReport>(
        `/reports/${encodeURIComponent(params.reportId)}`
    );
}

// ─── Webhook signature ───────────────────────────────────────

/**
 * Verify an HMAC-SHA256 signature on the raw request body.
 * Returns false on any mismatch or malformed signature header.
 */
export function verifyWebhookSignature(
    rawBody: string,
    signature: string | null,
    secret: string
): boolean {
    if (!signature || !secret) return false;
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    // Accept either `hex` or `sha256=hex` style headers.
    const provided = signature.startsWith("sha256=")
        ? signature.slice("sha256=".length)
        : signature;
    if (provided.length !== expected.length) return false;
    try {
        return timingSafeEqual(
            Buffer.from(provided, "hex"),
            Buffer.from(expected, "hex")
        );
    } catch {
        return false;
    }
}
