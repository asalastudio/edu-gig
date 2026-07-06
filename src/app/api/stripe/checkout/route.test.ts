import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({
    auth: vi.fn(),
}));

vi.mock("convex/browser", () => ({
    ConvexHttpClient: vi.fn(),
}));

vi.mock("@/convex/_generated/api", () => ({
    api: {
        gigs: {
            getById: {},
        },
    },
}));

vi.mock("@/lib/rate-limit", () => ({
    stripeCheckoutLimiter: {
        check: vi.fn(),
    },
}));

describe("POST /api/stripe/checkout", () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        vi.resetModules();
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it("keeps card checkout disabled unless the launch flag is explicitly enabled", async () => {
        process.env.STRIPE_SECRET_KEY = "sk_live_placeholder";
        process.env.NEXT_PUBLIC_ENABLE_CARD_CHECKOUT = "false";

        const { POST } = await import("./route");
        const response = await POST(
            new Request("https://k12gig.com/api/stripe/checkout", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    gigId: "jd770nx90wgvgpzdc8tt5pvdrd88q62b",
                    startDate: "2026-06-30",
                }),
            })
        );

        await expect(response.json()).resolves.toEqual({
            error: "Card checkout is disabled. Use invoice / PO booking.",
        });
        expect(response.status).toBe(503);
    });
});
