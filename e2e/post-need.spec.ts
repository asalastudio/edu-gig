import { test, expect } from "@playwright/test";

test.describe("Post a gig", () => {
    test("incomplete preview progress is preserved for sign-up instead of appearing published", async ({ page }) => {
        await page.goto("/post");

        await expect(page.getByRole("heading", { name: /Sign in to post a gig/i })).toBeVisible();
        await page.getByRole("button", { name: /Preview the form/i }).click();

        // Step 1 — Role
        await expect(page.getByRole("heading", { name: /^The Role$/i })).toBeVisible();
        await expect(page.getByRole("heading", { name: /Post a Need/i })).toHaveCount(0);
        await expect(page.getByLabel(/Primary Support Area/i)).toBeVisible();
        await expect(page.getByText(/Support Type/i)).toHaveCount(0);
        await page.locator("#orgName").fill("Ann Arbor Public Schools");
        await page.locator("#areaId").selectOption("instruction_curriculum");
        await expect(page.getByLabel(/Specific Expertise Needed/i)).toBeVisible();
        await expect(page.getByText(/Area of Expertise/i)).toHaveCount(0);

        // Use nth(0) since there's only one Continue button visible per step.
        await page.locator('button:has-text("Continue")').click();
        await expect(page.getByRole("heading", { name: /The Logistics/i })).toBeVisible();

        // Step 2 — Logistics can remain incomplete because the work is saved as a draft.
        await page.locator('button:has-text("Continue")').click();

        await expect(page.getByRole("heading", { name: /The Details/i })).toBeVisible();

        await expect(page.getByRole("button", { name: /save draft/i })).toBeVisible();
        await expect(page.getByRole("button", { name: /publish gig/i })).toBeVisible();

        // An incomplete publish attempt preserves the work and sends the user to
        // account creation; it never shows the published-success state.
        await page.getByRole("button", { name: /publish gig/i }).click();

        await expect(page).toHaveURL(/\/sign-up/);
        await expect(page.getByText(/your (need|gig) has been posted/i)).toHaveCount(0);

        const savedDraft = await page.evaluate(() =>
            JSON.parse(window.localStorage.getItem("k12gig_post_need_draft") ?? "null")
        );
        expect(savedDraft).toMatchObject({
            orgName: "Ann Arbor Public Schools",
            areaOfNeed: "instruction_curriculum",
        });
    });

    test("Keynote Speaking is a top-level Primary Support Area and does not require expertise", async ({ page }) => {
        await page.goto("/post");
        await page.getByRole("button", { name: /Preview the form/i }).click();

        const supportType = page.locator("#areaId");
        await expect(supportType.locator("option[value='keynote']")).toHaveText("Keynote Speaking");
        await supportType.selectOption("keynote");

        await expect(page.locator("#specId")).toHaveCount(0);
        await expect(page.getByText(/Area of Expertise/i)).toHaveCount(0);
        await expect(page.getByText(/Specific Expertise Needed/i)).toHaveCount(0);
    });
});
