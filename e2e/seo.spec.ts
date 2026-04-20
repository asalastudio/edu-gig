import { test, expect } from "@playwright/test";

test.describe("SEO basics", () => {
    test("robots.txt is served and references the sitemap", async ({ request }) => {
        const res = await request.get("/robots.txt");
        expect(res.status()).toBe(200);
        const body = await res.text();
        expect(body.toLowerCase()).toContain("sitemap");
    });

    test("sitemap.xml is served and contains a urlset", async ({ request }) => {
        const res = await request.get("/sitemap.xml");
        expect(res.status()).toBe(200);
        const body = await res.text();
        expect(body).toContain("<urlset");
    });

    test("default opengraph-image is served with an image content-type", async ({ request }) => {
        const res = await request.get("/opengraph-image");
        expect(res.status()).toBe(200);
        const contentType = res.headers()["content-type"] ?? "";
        expect(contentType.startsWith("image/")).toBe(true);
    });

    test("home page exposes an OG meta tag", async ({ request }) => {
        const res = await request.get("/");
        expect(res.status()).toBe(200);
        const html = await res.text();
        // Either og:title, og:description, or og:image — any presence confirms OG metadata shipped.
        expect(html).toMatch(/<meta[^>]+property=["']og:(title|description|image|url)["']/i);
    });
});
