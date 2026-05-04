import { test } from "@playwright/test";
import { expectClerkSignIn, hasClerkE2E } from "./helpers";

test.describe("Protected proposal routes", () => {
    test.skip(!hasClerkE2E, "Clerk is not configured in this environment.");

    test("educator needs requires sign-in", async ({ page }) => {
        await page.goto("/dashboard/educator/needs");
        await expectClerkSignIn(page);
    });

    test("district need detail requires sign-in", async ({ page }) => {
        await page.goto("/dashboard/district/needs/some-invalid-id");
        await expectClerkSignIn(page);
    });
});
