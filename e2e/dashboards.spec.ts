import { test, expect } from "@playwright/test";

test.describe("Dashboards (signed-out demo)", () => {
    test("district dashboard renders KPI cards and pipeline table", async ({ page }) => {
        await page.goto("/dashboard/district");
        await expect(page.getByRole("heading", { name: /District HR Overview/i })).toBeVisible();
        await expect(page.getByText(/Active Openings/i)).toBeVisible();
        await expect(page.getByText(/Total Spend YTD/i)).toBeVisible();
        await expect(page.getByText(/Talent Pipeline/i)).toBeVisible();
    });

    test("educator dashboard renders pipeline and Up Next", async ({ page }) => {
        await page.goto("/dashboard/educator");
        await expect(page.getByRole("heading", { name: /Educator Dashboard/i })).toBeVisible();
        await expect(page.getByText(/Pipeline \(Active Orders\)/i)).toBeVisible();
        await expect(page.getByText(/Up Next/i)).toBeVisible();
    });

    test("messages hub tells signed-out users to sign in", async ({ page }) => {
        await page.goto("/dashboard/messages");
        await expect(page.getByRole("heading", { name: /^Messages$/i })).toBeVisible();
        await expect(page.getByText(/Sign in to see your conversations/i)).toBeVisible();
    });
});
