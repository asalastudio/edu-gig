import { expect, test } from "@playwright/test";
import { expectClerkSignIn } from "./helpers";

test.describe("Protected review and gig routes", () => {
    test("review form requires sign-in", async ({ page }) => {
        await page.goto("/dashboard/reviews/some-id");
        await expect(page.getByRole("heading", { name: "Leave a review", exact: true })).toBeVisible();
        await expect(page.getByRole("heading", { name: /Sign in to leave a review/i })).toBeVisible();
    });

    test("my-gigs requires sign-in", async ({ page }) => {
        await page.goto("/dashboard/educator/my-gigs");
        await expectClerkSignIn(page);
    });
});
