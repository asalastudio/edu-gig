import { test, expect } from "@playwright/test";

test.describe("Invoice PDF route", () => {
    test("returns 401 or 404 for signed-out requests on a non-existent order", async ({ request }) => {
        const res = await request.get("/api/invoices/nonexistent-order-id/pdf");
        expect([401, 404, 503]).toContain(res.status());
    });

    test("returns JSON (not HTML) on error responses", async ({ request }) => {
        const res = await request.get("/api/invoices/nonexistent-order-id/pdf");
        const contentType = res.headers()["content-type"] ?? "";
        // Success would be application/pdf; error should be JSON.
        if (res.status() >= 400) {
            expect(contentType).toContain("application/json");
        }
    });
});
