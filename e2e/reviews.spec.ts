import { expect, test } from "@playwright/test";
import { expectClerkSignIn, hasClerkE2E } from "./helpers";

test.describe("Protected review and gig routes", () => {
    test("review form requires sign-in", async ({ page }) => {
        await page.goto("/dashboard/reviews/some-id");
        const clerkSignInHeading = page.getByRole("heading", { name: /Sign in/i });
        const leaveReviewHeading = page.getByRole("heading", { name: "Leave a review", exact: true });

        await expect(clerkSignInHeading.or(leaveReviewHeading)).toBeVisible();
        if (await clerkSignInHeading.isVisible()) {
            await expectClerkSignIn(page);
            return;
        }

        await expect(leaveReviewHeading).toBeVisible();
        await expect(page.getByRole("heading", { name: /Sign in to leave a review/i })).toBeVisible();
    });

    test("my-gigs requires sign-in", async ({ page }) => {
        test.skip(!hasClerkE2E, "Clerk is not configured in this environment.");

        await page.goto("/dashboard/educator/my-gigs");
        await expectClerkSignIn(page);
    });
});
