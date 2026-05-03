import { test } from "@playwright/test";
import { expectClerkSignIn } from "./helpers";

test.describe("Protected admin workspace", () => {
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
