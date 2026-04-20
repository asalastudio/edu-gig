import { test, expect } from "@playwright/test";

test.describe("New gig form (demo path)", () => {
    test("fills required fields and redirects to my-gigs", async ({ page }) => {
        await page.goto("/dashboard/educator/gigs/new");

        await expect(page.getByRole("heading", { name: /Create a new gig/i })).toBeVisible();

        await page.locator("#title").fill("Coaching Session for New Teachers");
        await page
            .locator("#description")
            .fill("Weekly coaching sessions focused on classroom routines and formative assessment.");
        await page.locator("#areaOfNeed").selectOption("instruction_curriculum");

        // Engagement (radio)
        await page.locator('input[type="radio"][name="engagementType"][value="consulting"]').check();

        // At least one grade level
        await page.locator('input[type="checkbox"][value="6_8"]').first().check();

        // At least one coverage region
        await page.locator('input[type="checkbox"][value="region_1"]').first().check();

        // Pricing type
        await page.locator('input[type="radio"][name="pricingType"][value="hourly"]').check();

        // Price
        await page.locator("#price").fill("125");

        // Submit — in demo mode button label is "Save (Demo)".
        await page.getByRole("button", { name: /Save/i }).click();

        await expect(page).toHaveURL(/\/dashboard\/educator\/my-gigs/);
        await expect(page.getByRole("heading", { name: /My Gigs/i })).toBeVisible();
    });
});
