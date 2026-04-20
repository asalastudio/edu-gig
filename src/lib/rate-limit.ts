/**
 * Token-bucket rate limiter — in-memory by default, Upstash-swappable later.
 *
 * Keyed by arbitrary string (Clerk user id, IP address, etc). Each key gets its
 * own bucket; buckets refill linearly based on elapsed wall-clock time.
 *
 * If Upstash env vars are present we log a warning and still use the in-memory
 * implementation — the expectation is that a future PR will wire up real
 * Upstash Redis while keeping the same interface.
 */

export type RateLimitResult =
    | { success: true; remaining: number }
    | { success: false; retryAfterMs: number };

export interface RateLimiter {
    check(key: string): Promise<RateLimitResult>;
}

export interface RateLimiterOptions {
    maxRequests: number;
    windowMs: number;
}

interface Bucket {
    tokens: number;
    lastRefill: number;
}

/**
 * Factory. Returns an in-memory token-bucket limiter. If Upstash credentials
 * are present we log a one-time warning but continue with the in-memory
 * implementation so the API shape is stable for future swap-in.
 */
export function createRateLimiter({ maxRequests, windowMs }: RateLimiterOptions): RateLimiter {
    if (maxRequests <= 0) {
        throw new Error("rate-limit: maxRequests must be > 0");
    }
    if (windowMs <= 0) {
        throw new Error("rate-limit: windowMs must be > 0");
    }

    const hasUpstash =
        typeof process !== "undefined" &&
        !!process.env.UPSTASH_REDIS_REST_URL &&
        !!process.env.UPSTASH_REDIS_REST_TOKEN;

    if (hasUpstash && !warnedAboutUpstashFallback) {
        warnedAboutUpstashFallback = true;
        console.warn("Upstash fallback not implemented; using in-memory");
    }

    const buckets = new Map<string, Bucket>();
    const refillRatePerMs = maxRequests / windowMs;

    return {
        async check(key: string): Promise<RateLimitResult> {
            const now = Date.now();
            const existing = buckets.get(key);

            let tokens: number;
            if (!existing) {
                tokens = maxRequests;
            } else {
                const elapsed = Math.max(0, now - existing.lastRefill);
                tokens = Math.min(maxRequests, existing.tokens + elapsed * refillRatePerMs);
            }

            if (tokens >= 1) {
                const remainingTokens = tokens - 1;
                buckets.set(key, { tokens: remainingTokens, lastRefill: now });
                return { success: true, remaining: Math.floor(remainingTokens) };
            }

            // Not enough tokens — compute how long until one is available.
            const deficit = 1 - tokens;
            const retryAfterMs = Math.ceil(deficit / refillRatePerMs);
            buckets.set(key, { tokens, lastRefill: now });
            return { success: false, retryAfterMs };
        },
    };
}

let warnedAboutUpstashFallback = false;

/**
 * Pre-configured limiter for the Stripe checkout route: 10 requests per
 * 60 seconds per Clerk user id (or per IP when signed out).
 */
export const stripeCheckoutLimiter: RateLimiter = createRateLimiter({
    maxRequests: 10,
    windowMs: 60_000,
});
