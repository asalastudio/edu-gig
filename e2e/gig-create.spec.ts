import { test } from "@playwright/test";
import { expectClerkSignIn, hasClerkE2E } from "./helpers";

test.describe("New gig form", () => {
    test.skip(!hasClerkE2E, "Clerk is not configured in this environment.");

    test("requires educator sign-in", async ({ page }) => {
        await page.goto("/dashboard/educator/gigs/new");
        await expectClerkSignIn(page);
    });
});
