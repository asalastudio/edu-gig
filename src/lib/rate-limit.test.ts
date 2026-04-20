import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRateLimiter } from "./rate-limit";

describe("createRateLimiter", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-04-19T00:00:00Z"));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("allows requests up to the configured limit", async () => {
        const limiter = createRateLimiter({ maxRequests: 3, windowMs: 60_000 });
        const a = await limiter.check("user_1");
        const b = await limiter.check("user_1");
        const c = await limiter.check("user_1");
        expect(a.success).toBe(true);
        expect(b.success).toBe(true);
        expect(c.success).toBe(true);
        if (c.success) {
            expect(c.remaining).toBe(0);
        }
    });

    it("rejects once the bucket is exhausted and reports retryAfterMs", async () => {
        const limiter = createRateLimiter({ maxRequests: 2, windowMs: 60_000 });
        await limiter.check("user_exhaust");
        await limiter.check("user_exhaust");
        const third = await limiter.check("user_exhaust");
        expect(third.success).toBe(false);
        if (!third.success) {
            expect(third.retryAfterMs).toBeGreaterThan(0);
            expect(third.retryAfterMs).toBeLessThanOrEqual(60_000);
        }
    });

    it("refills tokens as time elapses", async () => {
        const limiter = createRateLimiter({ maxRequests: 2, windowMs: 1_000 });
        await limiter.check("user_refill");
        await limiter.check("user_refill");
        const blocked = await limiter.check("user_refill");
        expect(blocked.success).toBe(false);

        // Advance half the window — should have refilled one token.
        vi.advanceTimersByTime(500);

        const unblocked = await limiter.check("user_refill");
        expect(unblocked.success).toBe(true);
    });

    it("isolates buckets per key", async () => {
        const limiter = createRateLimiter({ maxRequests: 1, windowMs: 60_000 });
        const aOk = await limiter.check("alice");
        const aBlocked = await limiter.check("alice");
        const bOk = await limiter.check("bob");

        expect(aOk.success).toBe(true);
        expect(aBlocked.success).toBe(false);
        expect(bOk.success).toBe(true);
    });

    it("throws on invalid options", () => {
        expect(() => createRateLimiter({ maxRequests: 0, windowMs: 1_000 })).toThrow();
        expect(() => createRateLimiter({ maxRequests: 5, windowMs: 0 })).toThrow();
    });
});
