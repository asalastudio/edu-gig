import { test, expect } from "@playwright/test";

test.describe("Post a Need (demo path)", () => {
    test("fills three-step form and sees confirmation", async ({ page }) => {
        await page.goto("/post");

        // Step 1 — Role
        await expect(page.getByRole("heading", { name: /^The Role$/i })).toBeVisible();
        await page.locator("#orgName").fill("Austin ISD");
        await page.locator("#areaId").selectOption("instruction_curriculum");

        // Use nth(0) since there's only one Continue button visible per step.
        await page.locator('button:has-text("Continue")').click();
        await expect(page.getByRole("heading", { name: /The Logistics/i })).toBeVisible();

        // Step 2 — Logistics
        await page.locator("#startDate").fill("2026-05-15");
        await page.locator("#duration").fill("1 semester");
        await page.locator('button:has-text("Continue")').click();

        await expect(page.getByRole("heading", { name: /The Details/i })).toBeVisible();

        // Step 3 — Details
        await page.locator("#compRange").fill("$80-$100/hr");
        await page.locator("#description").fill("Curriculum support for Q4.");

        // Submit — without Clerk configured, button label includes "Post".
        await page.locator('button[type="submit"]').click();

        await expect(page.getByRole("heading", { name: /Your need has been posted!/i })).toBeVisible();
    });
});
