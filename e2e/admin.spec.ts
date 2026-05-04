import { test } from "@playwright/test";
import { expectClerkSignIn, hasClerkE2E } from "./helpers";

test.describe("Protected admin workspace", () => {
    test.skip(!hasClerkE2E, "Clerk is not configured in this environment.");

    test("admin overview requires sign-in", async ({ page }) => {
        await page.goto("/dashboard/admin");
        await expectClerkSignIn(page);
    });

    test("admin procurement requires sign-in", async ({ page }) => {
        await page.goto("/dashboard/admin/procurement");
        await expectClerkSignIn(page);
    });

    test("admin verification requires sign-in", async ({ page }) => {
        await page.goto("/dashboard/admin/verification");
        await expectClerkSignIn(page);
    });
});
