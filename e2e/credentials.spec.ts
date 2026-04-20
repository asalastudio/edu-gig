import { test, expect } from "@playwright/test";

test.describe("Credentials & Checkr integration", () => {
    test("GET /api/checkr/invite returns 405 (only POST is allowed)", async ({ request }) => {
        const res = await request.get("/api/checkr/invite");
        // Next.js route handlers return 405 for an unexported method on a valid route.
        expect(res.status()).toBe(405);
    });

    test("POST /api/checkr/webhook without a valid signature is rejected", async ({ request }) => {
        const res = await request.post("/api/checkr/webhook", {
            data: { type: "report.completed" },
        });
        // 503 when CHECKR_* env vars are unset (demo mode), otherwise 400 for bad signature.
        expect([400, 503]).toContain(res.status());
    });

    test("educator settings page renders the Credentials & Verification section", async ({ page }) => {
        await page.goto("/dashboard/educator/settings");
        await expect(
            page.getByRole("heading", { name: /Credentials\s*&\s*Verification/i })
        ).toBeVisible();
    });
});
