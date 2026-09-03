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
        await expect(page.getByRole("button", { name: /publish need/i })).toBeVisible();

        // An incomplete publish attempt preserves the work and sends the user to
        // account creation; it never shows the published-success state.
        await page.getByRole("button", { name: /publish need/i }).click();

        await expect(page).toHaveURL(/\/sign-up/);
        await expect(page.getByText(/your need has been posted/i)).toHaveCount(0);

        const savedDraft = await page.evaluate(() =>
            JSON.parse(window.localStorage.getItem("k12gig_post_need_draft") ?? "null")
        );
        expect(savedDraft).toMatchObject({
            orgName: "Ann Arbor Public Schools",
            areaOfNeed: "instruction_curriculum",
        });
    });
});
