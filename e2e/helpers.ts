import { expect, type Page } from "@playwright/test";

export const hasClerkE2E = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export async function expectClerkSignIn(page: Page) {
    await expect(page.getByRole("heading", { name: /Sign in/i })).toBeVisible();
}
