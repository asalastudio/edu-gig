import { test } from "@playwright/test";
import { expectClerkSignIn } from "./helpers";

test.describe("Protected proposal routes", () => {
    test("educator needs requires sign-in", async ({ page }) => {
        await page.goto("/dashboard/educator/needs");
        await expectClerkSignIn(page);
    });

    test("district need detail requires sign-in", async ({ page }) => {
        await page.goto("/dashboard/district/needs/some-invalid-id");
        await expectClerkSignIn(page);
    });
});
