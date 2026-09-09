import { test, expect } from "@playwright/test";

test.describe("Post a Need", () => {
    test("incomplete preview progress is preserved for sign-up instead of appearing published", async ({ page }) => {
        await page.goto("/post");

        await expect(page.getByRole("heading", { name: /Sign in to post a need/i })).toBeVisible();
        await page.getByRole("button", { name: /Preview the form/i }).click();

        // Step 1 — Role
        await expect(page.getByRole("heading", { name: /^The Role$/i })).toBeVisible();
        await page.locator("#orgName").fill("Ann Arbor Public Schools");
        await page.locator("#areaId").selectOption("instruction_curriculum");

        // Use nth(0) since there's only one Continue button visible per step.
        await page.locator('button:has-text("Continue")').click();
        await expect(page.getByRole("heading", { name: /The Logistics/i })).toBeVisible();

        // Step 2 — Logistics can remain incomplete because the work is saved as a draft.
        await page.locator('button:has-text("Continue")').click();

        await expect(page.getByRole("heading", { name: /The Details/i })).toBeVisible();

        await expect(page.getByRole("button", { name: /save draft/i })).toBeVisible();
        await expect(page.getByRole("button", { name: /review need/i })).toBeVisible();
        await page.getByRole("button", { name: /review need/i }).click();
        await expect(page.getByRole("heading", { name: /Review your need/i })).toBeVisible();
        await expect(page.getByRole("button", { name: /sign in to continue/i })).toBeVisible();

        // An incomplete anonymous preview preserves the work and carries the
        // district intent and return path into sign-in; it never publishes.
        await page.getByRole("button", { name: /sign in to continue/i }).click();

        await expect(page).toHaveURL(/\/sign-in\?[^#]*intent=district/);
        await expect(page.getByText(/your need has been posted/i)).toHaveCount(0);

        const savedDraft = await page.evaluate(() =>
            JSON.parse(window.sessionStorage.getItem("k12gig:post:anonymous:new") ?? "null")
        );
        expect(savedDraft).toMatchObject({
            input: {
                orgName: "Ann Arbor Public Schools",
                areaOfNeed: "instruction_curriculum",
            },
        });
    });
});
