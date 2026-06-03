#!/usr/bin/env node
/**
 * Creates (or skips) Clerk dev users matching convex/demo_seed_constants emails.
 * Email-code sign-in only — use OTP 424242 for any +clerk_test address in dev.
 * Usage: node scripts/create-demo-clerk-users.mjs
 * Requires CLERK_SECRET_KEY in environment or .env.local
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnvLocal() {
    try {
        const raw = readFileSync(resolve(root, ".env.local"), "utf8");
        for (const line of raw.split("\n")) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("#")) continue;
            const eq = trimmed.indexOf("=");
            if (eq === -1) continue;
            const key = trimmed.slice(0, eq);
            let value = trimmed.slice(eq + 1);
            if (
                (value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))
            ) {
                value = value.slice(1, -1);
            }
            if (!process.env[key]) process.env[key] = value;
        }
    } catch {
        // .env.local optional if env already set
    }
}

loadEnvLocal();

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
if (!CLERK_SECRET_KEY) {
    console.error("Missing CLERK_SECRET_KEY. Set it in .env.local or the environment.");
    process.exit(1);
}

const DEMO_ACCOUNTS = [
    { email: "demo-district+clerk_test@example.com", firstName: "Jordan", lastName: "Rivera" },
    { email: "demo-educator1+clerk_test@example.com", firstName: "Sarah", lastName: "Jenkins" },
    { email: "demo-educator2+clerk_test@example.com", firstName: "Miguel", lastName: "Rodriguez" },
    { email: "demo-educator3+clerk_test@example.com", firstName: "Alana", lastName: "Williams" },
];

const EMAIL_CODE = "424242";

async function listUsersByEmail(email) {
    const url = new URL("https://api.clerk.com/v1/users");
    url.searchParams.append("email_address", email);
    url.searchParams.set("limit", "1");
    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${CLERK_SECRET_KEY}` },
    });
    if (!res.ok) {
        return null;
    }
    const data = await res.json();
    if (Array.isArray(data)) return data[0] ?? null;
    if (Array.isArray(data?.data)) return data.data[0] ?? null;
    return null;
}

async function createUser({ email, firstName, lastName }) {
    const existing = await listUsersByEmail(email);
    if (existing) {
        console.log(`✓ Already exists: ${email} (${existing.id})`);
        return existing;
    }

    const res = await fetch("https://api.clerk.com/v1/users", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${CLERK_SECRET_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            email_address: [email],
            skip_password_requirement: true,
            first_name: firstName,
            last_name: lastName,
        }),
    });

    const body = await res.json();
    if (res.status === 422 && body?.errors?.[0]?.code === "form_identifier_exists") {
        const again = await listUsersByEmail(email);
        console.log(`✓ Already exists: ${email}${again ? ` (${again.id})` : ""}`);
        return again;
    }
    if (!res.ok) {
        throw new Error(`Create ${email} failed (${res.status}): ${JSON.stringify(body)}`);
    }

    console.log(`✓ Created: ${email} (${body.id})`);
    return body;
}

async function main() {
    console.log("Creating Clerk demo users (dev, email-code only)…\n");
    for (const account of DEMO_ACCOUNTS) {
        await createUser(account);
    }
    console.log("\nDone. Sign in with any email above, then enter code:", EMAIL_CODE);
    console.log("Then run seed:populate if Convex rows are missing (see docs/DEMO_SEED_CREDENTIALS.md).");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
