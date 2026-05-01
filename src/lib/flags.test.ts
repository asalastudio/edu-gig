import { afterEach, describe, expect, it, vi } from "vitest";
import { isFlagEnabled, isFlagEnabledClient, resolveFlag, type FlagName } from "./flags";

const makeEnv = (values: Record<string, string | undefined>) => (key: string) => values[key];

describe("resolveFlag precedence", () => {
    it("falls back to the baked-in default when nothing is set", () => {
        expect(resolveFlag("convex_live_browse", makeEnv({}), "")).toBe(false);
        expect(resolveFlag("experimental_messaging", makeEnv({}), "")).toBe(false);
        expect(resolveFlag("premium_tier_ui", makeEnv({}), "")).toBe(false);
    });

    it("env var overrides the default", () => {
        const env = makeEnv({ FLAG_CONVEX_LIVE_BROWSE: "true" });
        expect(resolveFlag("convex_live_browse", env, "")).toBe(true);
    });

    it("cookie overrides the env var", () => {
        const env = makeEnv({ FLAG_PREMIUM_TIER_UI: "true" });
        const cookies = "k12gig_flag_premium_tier_ui=0; other=ignored";
        expect(resolveFlag("premium_tier_ui", env, cookies)).toBe(false);
    });

    it("accepts various truthy/falsy spellings", () => {
        expect(resolveFlag("convex_live_browse", makeEnv({ FLAG_CONVEX_LIVE_BROWSE: "YES" }), "")).toBe(true);
        expect(resolveFlag("convex_live_browse", makeEnv({ FLAG_CONVEX_LIVE_BROWSE: "off" }), "")).toBe(false);
        expect(resolveFlag("convex_live_browse", makeEnv({ FLAG_CONVEX_LIVE_BROWSE: "1" }), "")).toBe(true);
    });

    it("returns false for unknown flags", () => {
        // Intentional cast — unknown flag is the scenario under test.
        expect(resolveFlag("bogus_flag" as FlagName, makeEnv({}), "")).toBe(false);
    });

    it("ignores unparseable cookie values and falls through to env", () => {
        const env = makeEnv({ FLAG_EXPERIMENTAL_MESSAGING: "true" });
        const cookies = "k12gig_flag_experimental_messaging=maybe";
        expect(resolveFlag("experimental_messaging", env, cookies)).toBe(true);
    });
});

describe("isFlagEnabled (server)", () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it("reads from process.env", () => {
        vi.stubEnv("FLAG_CONVEX_LIVE_BROWSE", "true");
        expect(isFlagEnabled("convex_live_browse")).toBe(true);
    });

    it("returns default when env is not set", () => {
        vi.stubEnv("FLAG_CONVEX_LIVE_BROWSE", "");
        expect(isFlagEnabled("convex_live_browse")).toBe(false);
    });
});

describe("isFlagEnabledClient", () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it("honors cookie override over env", () => {
        vi.stubEnv("FLAG_PREMIUM_TIER_UI", "true");
        expect(isFlagEnabledClient("premium_tier_ui", "k12gig_flag_premium_tier_ui=0")).toBe(false);
    });

    it("returns false for unknown flags regardless of input", () => {
        expect(isFlagEnabledClient("nope" as FlagName, "k12gig_flag_nope=1")).toBe(false);
    });
});
