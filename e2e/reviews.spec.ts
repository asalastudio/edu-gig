import { test, expect } from "@playwright/test";

test.describe("Reviews (signed-out demo)", () => {
    test("review form shows sign-in empty state when signed out", async ({ page }) => {
        await page.goto("/dashboard/reviews/some-id");

        await expect(page.getByRole("heading", { name: "Leave a review", exact: true })).toBeVisible();
        await expect(page.getByRole("heading", { name: /Sign in to leave a review/i })).toBeVisible();
    });

    test("my-gigs renders a My Gigs heading", async ({ page }) => {
        await page.goto("/dashboard/educator/my-gigs");
        await expect(page.getByRole("heading", { name: /My Gigs/i })).toBeVisible();
    });
});
