import { test, expect } from "@playwright/test";

test.describe("Post a Need", () => {
    test("signed-out users see a real-post intercept and can preview the form", async ({ page }) => {
        await page.goto("/post");

        await expect(page.getByRole("heading", { name: /Sign in to post a real need/i })).toBeVisible();
        await page.getByRole("button", { name: /Preview the form/i }).click();

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

        // Submit preserves the draft and sends the user to account creation.
        await page.locator('button[type="submit"]').click();

        await expect(page).toHaveURL(/\/sign-up/);
    });
});
