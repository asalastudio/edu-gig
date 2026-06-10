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
});
