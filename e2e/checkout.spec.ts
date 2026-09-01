import { test, expect } from "@playwright/test";

test.describe("Gig checkout retirement", () => {
    test("explains that checkout is not part of K12Gig", async ({ page }) => {
        await page.goto("/gigs/sample-gig-123");
        await expect(page.getByRole("heading", { name: /Checkout is not part of K12Gig/i })).toBeVisible();
        await expect(page.getByRole("main").getByRole("link", { name: /Post a need/i })).toBeVisible();
        await expect(page.getByRole("button", { name: /Submit booking request|Pay with Stripe/i })).toHaveCount(0);
    });
});
