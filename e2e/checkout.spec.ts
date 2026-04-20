import { test, expect } from "@playwright/test";

test.describe("Gig checkout (demo ACH path)", () => {
    test("defaults to ACH and confirms booking in demo mode", async ({ page }) => {
        await page.goto("/gigs/sample-gig-123");

        await expect(page.getByRole("heading", { name: /Checkout/i })).toBeVisible();
        await expect(page.getByText(/Order Summary/i)).toBeVisible();

        // ACH Bank Transfer is pre-selected; submit without a date first to hit validation.
        await page.getByRole("button", { name: /Confirm & Invoice|Pay with Stripe/i }).click();
        await expect(page.getByText(/Please choose a desired start date/i)).toBeVisible();

        // Fill date and submit.
        await page.locator("input[type=date]").fill("2026-05-15");
        await page.getByRole("button", { name: /Confirm & Invoice|Pay with Stripe/i }).click();

        await expect(page.getByRole("heading", { name: /Booking confirmed/i })).toBeVisible();
    });

    test("toggles to Credit Card and shows the Stripe button label", async ({ page }) => {
        await page.goto("/gigs/sample-gig-123");
        await page.locator("input[type=radio][value=card]").check();
        await expect(page.getByRole("button", { name: /Pay with Stripe/i })).toBeVisible();
    });
});
