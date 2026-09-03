import { describe, expect, it } from "vitest";
import {
    isCardCheckoutEnabled,
    isCheckrEnabled,
    isLegacyCheckoutEnabled,
    paymentModeLabel,
} from "./launch-flags";

describe("launch flags", () => {
    it("defaults launch to off-platform payment and Checkr deferred", () => {
        expect(isCardCheckoutEnabled({})).toBe(false);
        expect(isCheckrEnabled({})).toBe(false);
        expect(paymentModeLabel({})).toBe("Off-platform");
    });

    it("keeps payment off-platform even if the unused card flag is set", () => {
        expect(isCardCheckoutEnabled({ NEXT_PUBLIC_ENABLE_CARD_CHECKOUT: "true" })).toBe(true);
        expect(paymentModeLabel({ NEXT_PUBLIC_ENABLE_CARD_CHECKOUT: "true" })).toBe("Off-platform");
    });

    it("keeps legacy checkout off unless both checkout flags are set", () => {
        expect(isLegacyCheckoutEnabled({})).toBe(false);
        expect(isLegacyCheckoutEnabled({ NEXT_PUBLIC_ENABLE_LEGACY_CHECKOUT: "true" })).toBe(false);
        expect(
            isLegacyCheckoutEnabled({
                NEXT_PUBLIC_ENABLE_LEGACY_CHECKOUT: "true",
                NEXT_PUBLIC_ENABLE_CARD_CHECKOUT: "true",
            })
        ).toBe(true);
        expect(
            paymentModeLabel({
                NEXT_PUBLIC_ENABLE_LEGACY_CHECKOUT: "true",
                NEXT_PUBLIC_ENABLE_CARD_CHECKOUT: "true",
            })
        ).toBe("Card or invoice");
    });
});
