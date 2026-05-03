import { test } from "@playwright/test";
import { expectClerkSignIn } from "./helpers";

test.describe("Protected dashboards", () => {
    test("district dashboard requires sign-in", async ({ page }) => {
        await page.goto("/dashboard/district");
        await expectClerkSignIn(page);
    });

    test("educator dashboard requires sign-in", async ({ page }) => {
        await page.goto("/dashboard/educator");
        await expectClerkSignIn(page);
    });

    test("messages hub requires sign-in", async ({ page }) => {
        await page.goto("/dashboard/messages");
        await expectClerkSignIn(page);
    });
});
