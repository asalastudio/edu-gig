import { expect, type Page } from "@playwright/test";

export async function expectClerkSignIn(page: Page) {
    await expect(page.getByRole("heading", { name: /Sign in/i })).toBeVisible();
}
