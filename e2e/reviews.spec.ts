import { expect, test } from "@playwright/test";
import { expectClerkSignIn, hasClerkE2E } from "./helpers";

test.describe("Protected review and gig routes", () => {
    test("review form requires sign-in", async ({ page }) => {
        await page.goto("/dashboard/reviews/some-id");
        await expect(page.getByRole("heading", { name: /Sign in/i }).first()).toBeVisible();
    });

    test("my-gigs requires sign-in", async ({ page }) => {
        test.skip(!hasClerkE2E, "Clerk is not configured in this environment.");

        await page.goto("/dashboard/educator/my-gigs");
        await expectClerkSignIn(page);
    });
});
