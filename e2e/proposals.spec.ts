import { test, expect } from "@playwright/test";

test.describe("Proposals (signed-out demo)", () => {
    test("educator needs page shows the signed-out empty state", async ({ page }) => {
        await page.goto("/dashboard/educator/needs");
        await expect(page.getByRole("heading", { name: /Open Needs/i })).toBeVisible();
        await expect(
            page.getByText(/Sign in as an educator to browse open needs/i)
        ).toBeVisible();
    });

    test("district need detail page renders a graceful error for invalid IDs", async ({ page }) => {
        await page.goto("/dashboard/district/needs/some-invalid-id");
        // Signed-out users should see the 'Sign in to review proposals' empty state;
        // either that or the 'Need not found' fallback is acceptable — both render a heading.
        const signIn = page.getByRole("heading", {
            name: /Sign in to review proposals/i,
        });
        const notFound = page.getByRole("heading", { name: /Need not found/i });
        const ownership = page.getByRole("heading", {
            name: /This need belongs to another district/i,
        });
        await expect(signIn.or(notFound).or(ownership)).toBeVisible();
    });
});
