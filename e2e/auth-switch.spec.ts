import { expect, test } from "@playwright/test";
import { hasClerkE2E } from "./helpers";

test.describe("Auth account switch", () => {
    test.skip(!hasClerkE2E, "Clerk is not configured in this environment.");

    test("sign-in keeps one prominent sign-up path and forwards intent", async ({ page }) => {
        await page.goto("/sign-in?intent=educator");
        const main = page.locator("main");

        await expect(main.getByRole("heading", { name: /Sign in to K12Gig/i })).toBeVisible();
        await expect(main.getByText("Don't have an account?")).toHaveCount(1);
        await expect(main.getByText(/finish your profile after you verify email/i)).toBeVisible();
        const signUp = main.getByRole("link", { name: /^Sign up$/i });
        await expect(signUp).toHaveCount(1);
        await expect(signUp).toHaveAttribute("href", /intent=educator/);
        await expect(main.getByRole("button", { name: /^Sign up$/i })).toHaveCount(0);
        await expect(page.locator(".k12-clerk-card .cl-header, .k12-clerk-card .cl-footerAction")).toBeHidden();
    });

    test("sign-up keeps one sign-in path and forwards intent", async ({ page }) => {
        await page.goto("/sign-up?intent=district&next=/post");
        const main = page.locator("main");

        await expect(main.getByRole("heading", { name: /Create your K12Gig account/i })).toBeVisible();
        await expect(main.getByText("Already have an account?")).toHaveCount(1);
        const signIn = main.getByRole("link", { name: /^Sign in$/i });
        await expect(signIn).toHaveCount(1);
        await expect(signIn).toHaveAttribute("href", /intent=district/);
        await expect(signIn).toHaveAttribute("href", /next=%2Fpost/);
        await expect(page.locator(".k12-clerk-card .cl-header, .k12-clerk-card .cl-footerAction")).toBeHidden();
    });
});
