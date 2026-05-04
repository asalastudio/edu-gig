/**
 * Token-bucket rate limiter.
 *
 * Keyed by arbitrary string (Clerk user id, IP address, etc). Each key gets its
 * own bucket; buckets refill linearly based on elapsed wall-clock time.
 * In production, set Upstash REST credentials to share limits across Vercel
 * instances instead of falling back to a per-process bucket.
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
    namespace?: string;
}

interface Bucket {
    tokens: number;
    lastRefill: number;
}

type UpstashPipelineResult = Array<{ result?: unknown; error?: string }>;

function assertValidOptions({ maxRequests, windowMs }: RateLimiterOptions) {
    if (maxRequests <= 0) {
        throw new Error("rate-limit: maxRequests must be > 0");
    }
    if (windowMs <= 0) {
        throw new Error("rate-limit: windowMs must be > 0");
    }
}

function normalizeKey(key: string): string {
    return key.replace(/[^a-zA-Z0-9:_@.-]/g, "_").slice(0, 180) || "anonymous";
}

function createMemoryRateLimiter({ maxRequests, windowMs }: RateLimiterOptions): RateLimiter {
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

            const deficit = 1 - tokens;
            const retryAfterMs = Math.ceil(deficit / refillRatePerMs);
            buckets.set(key, { tokens, lastRefill: now });
            return { success: false, retryAfterMs };
        },
    };
}

function createUpstashRateLimiter(
    options: RateLimiterOptions,
    restUrl: string,
    token: string,
    fallback: RateLimiter
): RateLimiter {
    const namespace = options.namespace ?? "default";
    const windowSeconds = Math.max(1, Math.ceil(options.windowMs / 1000));

    return {
        async check(key: string): Promise<RateLimitResult> {
            const redisKey = `k12gig:rl:${namespace}:${normalizeKey(key)}`;
            try {
                const response = await fetch(`${restUrl.replace(/\/$/, "")}/pipeline`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify([
                        ["INCR", redisKey],
                        ["EXPIRE", redisKey, String(windowSeconds)],
                        ["PTTL", redisKey],
                    ]),
                    cache: "no-store",
                });

                if (!response.ok) {
                    throw new Error(`Upstash ${response.status}`);
                }

                const data = (await response.json()) as UpstashPipelineResult;
                const count = Number(data[0]?.result ?? NaN);
                const ttl = Number(data[2]?.result ?? options.windowMs);
                if (!Number.isFinite(count)) {
                    throw new Error("Upstash returned an invalid counter");
                }

                if (count <= options.maxRequests) {
                    return {
                        success: true,
                        remaining: Math.max(0, options.maxRequests - count),
                    };
                }

                return {
                    success: false,
                    retryAfterMs: Number.isFinite(ttl) && ttl > 0 ? ttl : options.windowMs,
                };
            } catch (err) {
                console.error("[rate-limit] Upstash unavailable; using in-memory fallback", err);
                return fallback.check(key);
            }
        },
    };
}

function readPositiveNumber(name: string, fallback: number): number {
    const raw = typeof process === "undefined" ? undefined : process.env[name];
    if (!raw) return fallback;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * Factory. Uses Upstash Redis when both REST env vars are present; otherwise
 * returns the in-memory limiter used by local development and tests.
 */
export function createRateLimiter(options: RateLimiterOptions): RateLimiter {
    assertValidOptions(options);
    const fallback = createMemoryRateLimiter(options);
    const restUrl = typeof process === "undefined" ? undefined : process.env.UPSTASH_REDIS_REST_URL;
    const token = typeof process === "undefined" ? undefined : process.env.UPSTASH_REDIS_REST_TOKEN;

    if (restUrl && token) {
        return createUpstashRateLimiter(options, restUrl, token, fallback);
    }

    if ((restUrl || token) && !warnedAboutPartialUpstashConfig) {
        warnedAboutPartialUpstashConfig = true;
        console.warn("[rate-limit] Upstash is partially configured; using in-memory limiter");
    }

    return fallback;
}

let warnedAboutPartialUpstashConfig = false;

/**
 * Pre-configured limiter for the Stripe checkout route.
 * Defaults to 10 requests per 60 seconds per Clerk user id or IP, configurable
 * in production with STRIPE_CHECKOUT_RATE_LIMIT_MAX and
 * STRIPE_CHECKOUT_RATE_LIMIT_WINDOW_MS.
 */
export const stripeCheckoutLimiter: RateLimiter = createRateLimiter({
    maxRequests: readPositiveNumber("STRIPE_CHECKOUT_RATE_LIMIT_MAX", 10),
    windowMs: readPositiveNumber("STRIPE_CHECKOUT_RATE_LIMIT_WINDOW_MS", 60_000),
    namespace: "stripe_checkout",
});
