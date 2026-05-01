/**
 * Feature flags with layered precedence:
 *
 *   cookie (dev override) > env var > default
 *
 * - Env var names follow `FLAG_<UPPERCASE>` (e.g. `FLAG_CONVEX_LIVE_BROWSE=true`).
 * - Cookie names follow `k12gig_flag_<name>=1|0`.
 *
 * Use `isFlagEnabled` on the server (reads env + cookies via the passed string)
 * and `isFlagEnabledClient` in the browser, passing `document.cookie` directly.
 */

export type FlagName = "convex_live_browse" | "experimental_messaging" | "premium_tier_ui";

const DEFAULTS: Record<FlagName, boolean> = {
    convex_live_browse: false,
    experimental_messaging: false,
    premium_tier_ui: false,
};

const KNOWN_FLAGS = new Set<string>(Object.keys(DEFAULTS));

function envVarName(flag: FlagName): string {
    return `FLAG_${flag.toUpperCase()}`;
}

function cookieName(flag: FlagName): string {
    return `k12gig_flag_${flag}`;
}

/** Parse a truthy/falsy string. Returns undefined if the value doesn't clearly map. */
function parseBoolish(raw: string | undefined): boolean | undefined {
    if (raw === undefined) return undefined;
    const v = raw.trim().toLowerCase();
    if (v === "1" || v === "true" || v === "yes" || v === "on") return true;
    if (v === "0" || v === "false" || v === "no" || v === "off") return false;
    return undefined;
}

/** Look up a cookie value by name in a `document.cookie`-style string. */
function readCookie(cookies: string, name: string): string | undefined {
    if (!cookies) return undefined;
    const parts = cookies.split(";");
    for (const part of parts) {
        const [rawK, ...rest] = part.split("=");
        const key = rawK?.trim();
        if (key === name) {
            return decodeURIComponent(rest.join("=").trim());
        }
    }
    return undefined;
}

/** Resolve a flag given the env-getter and cookies string. Exported for testing. */
export function resolveFlag(
    name: FlagName,
    env: (key: string) => string | undefined,
    cookies: string
): boolean {
    if (!KNOWN_FLAGS.has(name)) return false;

    // 1. Cookie override wins.
    const cookieVal = parseBoolish(readCookie(cookies, cookieName(name)));
    if (cookieVal !== undefined) return cookieVal;

    // 2. Env var.
    const envVal = parseBoolish(env(envVarName(name)));
    if (envVal !== undefined) return envVal;

    // 3. Default.
    return DEFAULTS[name];
}

/**
 * Server-side flag check. Reads from `process.env`; cookie overrides are not
 * honored here because server-side code typically doesn't have raw cookies
 * available at import time. Use `isFlagEnabledClient` to honor cookies.
 */
export function isFlagEnabled(name: FlagName): boolean {
    if (!KNOWN_FLAGS.has(name)) return false;
    return resolveFlag(name, (k) => (typeof process !== "undefined" ? process.env[k] : undefined), "");
}

/**
 * Client-accessible variant. Pass `document.cookie` (browser) or the serialized
 * cookie header (server in a request context) so cookie overrides are honored.
 */
export function isFlagEnabledClient(name: FlagName, cookies: string): boolean {
    if (!KNOWN_FLAGS.has(name)) return false;
    return resolveFlag(
        name,
        (k) => (typeof process !== "undefined" ? process.env[k] : undefined),
        cookies
    );
}
