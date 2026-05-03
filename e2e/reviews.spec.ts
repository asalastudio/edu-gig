import { test } from "@playwright/test";
import { expectClerkSignIn } from "./helpers";

test.describe("Protected review and gig routes", () => {
    test("review form requires sign-in", async ({ page }) => {
        await page.goto("/dashboard/reviews/some-id");
        await expectClerkSignIn(page);
    });

    test("my-gigs requires sign-in", async ({ page }) => {
        await page.goto("/dashboard/educator/my-gigs");
        await expectClerkSignIn(page);
    });
});
