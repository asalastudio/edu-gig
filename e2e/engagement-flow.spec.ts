import { test } from "@playwright/test";
import { expectClerkSignIn, hasClerkE2E } from "./helpers";

test.describe("Engagement and Contract Hub routes", () => {
    test.skip(!hasClerkE2E, "Clerk is not configured in this environment.");

    test("My Gigs requires sign-in", async ({ page }) => {
        await page.goto("/dashboard/educator/my-gigs");
        await expectClerkSignIn(page);
    });

    test("consultant Contract Hub requires sign-in", async ({ page }) => {
        await page.goto("/dashboard/educator/contract-hub");
        await expectClerkSignIn(page);
    });

    test("district Contract Hub requires sign-in", async ({ page }) => {
        await page.goto("/dashboard/district/contract-hub");
        await expectClerkSignIn(page);
    });

    test("engagement detail requires sign-in", async ({ page }) => {
        await page.goto("/dashboard/engagements/placeholder");
        await expectClerkSignIn(page);
    });

    test("onboarding is the destination for unsigned dashboard traffic", async ({ page }) => {
        await page.goto("/dashboard/educator");
        await expectClerkSignIn(page);
    });
});
