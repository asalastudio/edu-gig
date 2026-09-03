import { expect, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

function clerkPublishableKey() {
    if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
        return process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    }
    try {
        const raw = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
        const line = raw.split(/\r?\n/).find((entry) => entry.startsWith("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="));
        return line?.slice("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=".length).replace(/^["']|["']$/g, "").trim();
    } catch {
        return undefined;
    }
}

export const hasClerkE2E = !!clerkPublishableKey();

export async function expectClerkSignIn(page: Page) {
    await expect(page.getByRole("heading", { name: /Sign in/i })).toBeVisible();
}
