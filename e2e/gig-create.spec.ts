import { test } from "@playwright/test";
import { expectClerkSignIn } from "./helpers";

test.describe("New gig form", () => {
    test("requires educator sign-in", async ({ page }) => {
        await page.goto("/dashboard/educator/gigs/new");
        await expectClerkSignIn(page);
    });
});
