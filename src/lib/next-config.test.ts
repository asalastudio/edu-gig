import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";

describe("nextConfig", () => {
    it("sets a portable Turbopack root to this repo", () => {
        expect(nextConfig.turbopack?.root).toBe(process.cwd());
    });

    it("allows Clerk production custom domain assets in the CSP", async () => {
        const headers = await nextConfig.headers?.();
        const csp = headers?.[0]?.headers.find((header) => header.key === "Content-Security-Policy")?.value;

        expect(csp).toContain("https://clerk.k12gig.com");
    });

    it("redirects /get-started and retired Contract Hub paths", async () => {
        const redirects = await nextConfig.redirects?.();
        expect(redirects).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ source: "/get-started", destination: "/login" }),
                expect.objectContaining({
                    source: "/dashboard/educator/contract-hub",
                    destination: "/dashboard/educator/my-gigs",
                }),
                expect.objectContaining({
                    source: "/dashboard/district/contract-hub",
                    destination: "/dashboard/district",
                }),
            ])
        );
    });

    it("omits frame-blocking headers outside production so dev previews can embed the app", async () => {
        const headers = await nextConfig.headers?.();
        const csp = headers?.[0]?.headers.find((header) => header.key === "Content-Security-Policy")?.value;
        const frameOptions = headers?.[0]?.headers.find((header) => header.key === "X-Frame-Options");

        expect(csp).not.toContain("frame-ancestors");
        expect(frameOptions).toBeUndefined();
    });
});
