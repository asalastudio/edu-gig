import { test, expect } from "@playwright/test";

const cardCheckoutEnabled = /^(1|true|yes|on)$/i.test(
    (process.env.NEXT_PUBLIC_ENABLE_CARD_CHECKOUT ?? "").trim()
);

test.describe("Gig checkout (demo invoice path)", () => {
    test("defaults to invoice/PO and requires a district session before submission", async ({ page }) => {
        await page.goto("/gigs/sample-gig-123");
        const futureStartDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 10);

        await expect(page.getByRole("heading", { name: /Checkout/i })).toBeVisible();
        await expect(page.getByText(/Order Summary/i)).toBeVisible();

        // Invoice / PO is pre-selected; submit without a date first to hit validation.
        await page.getByRole("button", { name: /Submit booking request|Pay with Stripe/i }).click();
        const error = page.getByRole("alert").filter({ hasText: /Please choose a desired start date/i });
        await expect(error).toHaveText(/Please choose a desired start date/i);
        await expect(page.getByLabel("Desired Start Date")).toHaveAttribute("aria-invalid", "true");

        // Fill date and submit.
        await page.getByLabel("Desired Start Date").fill(futureStartDate);
        await page.getByRole("button", { name: /Submit booking request|Pay with Stripe/i }).click();

        await expect(page).toHaveURL(/\/sign-in\?intent=district/);
        await expect(page.getByRole("heading", { name: /Booking request submitted/i })).toHaveCount(0);
    });

    test("hides card checkout and explains the invoice-only beta", async ({ page }) => {
        test.skip(cardCheckoutEnabled, "Card checkout lane is enabled in this environment.");
        await page.goto("/gigs/sample-gig-123");
        await expect(page.getByText(/Card payments are not yet available/i)).toBeVisible();
        await expect(page.locator("input[type=radio][value=card]")).toHaveCount(0);
    });

    test("toggles to Credit Card and shows the Stripe button label", async ({ page }) => {
        test.skip(!cardCheckoutEnabled, "Card checkout is disabled for the controlled beta.");
        await page.goto("/gigs/sample-gig-123");
        await page.locator("input[type=radio][value=card]").check();
        await expect(page.getByRole("button", { name: /Pay with Stripe/i })).toBeVisible();
    });
});
