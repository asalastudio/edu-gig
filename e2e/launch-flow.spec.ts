import { test, expect } from "@playwright/test";
import { expectClerkSignIn, hasClerkE2E } from "./helpers";

test.describe("Launch marketplace flow (public)", () => {
    test("pricing, help, and homepage describe off-platform payment and Contract Hub", async ({ page }) => {
        await page.goto("/");
        await expect(page.getByText(/Find qualified K–12 consultants/i)).toBeVisible();
        await expect(page.getByText(/reference checks/i)).toHaveCount(0);

        await page.goto("/pricing");
        await expect(page.getByText(/Payment stays between you/i)).toBeVisible();
        await expect(page.getByText(/does not charge an 18% fee/i)).toBeVisible();
        await expect(page.getByText(/Contract Hub/i).first()).toBeVisible();

        await page.goto("/help");
        await expect(page.getByText(/Contract Hub/i).first()).toBeVisible();
        await expect(page.getByText(/Educators are paid weekly via ACH/i)).toHaveCount(0);
    });

    test("checkout routes are retired and post-need stays behind sign-in", async ({ page }) => {
        await page.goto("/gigs/sample-gig-123");
        await expect(page.getByRole("heading", { name: /Checkout is not part of K12Gig/i })).toBeVisible();
        await expect(page.getByRole("button", { name: /Submit booking request|Pay with Stripe/i })).toHaveCount(0);

        await page.goto("/post");
        await expect(page.getByRole("heading", { name: /Sign in to post a need/i })).toBeVisible();
    });

    test("mobile navigation exposes browse, post, and pricing", async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto("/");
        await page.getByRole("button", { name: /Open menu/i }).click();
        await expect(page.getByRole("banner").getByRole("link", { name: /Post a need/i })).toBeVisible();
        await expect(page.getByRole("banner").getByRole("link", { name: /^Pricing$/i })).toBeVisible();
        await page.getByRole("banner").getByRole("link", { name: /^Pricing$/i }).click();
        await expect(page).toHaveURL(/\/pricing/);
    });
});

test.describe("Launch marketplace flow (auth-gated)", () => {
    test.skip(!hasClerkE2E, "Clerk is not configured in this environment.");

    test("district post, consultant My Gigs, Contract Hub, and engagement detail require sign-in", async ({ page }) => {
        await page.goto("/dashboard/district");
        await expectClerkSignIn(page);

        await page.goto("/dashboard/educator/my-gigs");
        await expectClerkSignIn(page);

        await page.goto("/dashboard/educator/contract-hub");
        await expectClerkSignIn(page);

        await page.goto("/dashboard/district/contract-hub");
        await expectClerkSignIn(page);

        await page.goto("/dashboard/engagements/placeholder");
        await expectClerkSignIn(page);

        await page.goto("/dashboard/messages");
        await expectClerkSignIn(page);

        await page.goto("/onboarding");
        await expect(page).toHaveURL(/sign-in|onboarding|login/i);
    });
});
