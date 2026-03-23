import { test, expect } from "@playwright/test";

test.describe("public smoke", () => {
    test("home, browse, login hub, and legal pages load", async ({ page }) => {
        await page.goto("/");
        await expect(page.getByText(/Find top educators/i)).toBeVisible();

        await page.goto("/browse");
        await expect(page.getByText(/Find K-12 Educators/i)).toBeVisible();

        await page.goto("/login");
        await expect(page.getByRole("heading", { name: /Sign in to EduGig/i })).toBeVisible();

        await page.goto("/privacy");
        await expect(page.getByRole("heading", { name: /Privacy Policy/i })).toBeVisible();

        await page.goto("/terms");
        await expect(page.getByRole("heading", { name: /Terms of Service/i })).toBeVisible();
    });
});
