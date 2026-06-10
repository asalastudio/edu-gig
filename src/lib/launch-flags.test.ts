import { describe, expect, it } from "vitest";
import {
    isCardCheckoutEnabled,
    isCheckrEnabled,
    paymentModeLabel,
} from "./launch-flags";

describe("launch flags", () => {
    it("defaults June beta to invoice-only and Checkr deferred", () => {
        expect(isCardCheckoutEnabled({})).toBe(false);
        expect(isCheckrEnabled({})).toBe(false);
        expect(paymentModeLabel({})).toBe("Invoice / PO only");
    });

    it("enables card checkout only with an explicit public flag", () => {
        expect(isCardCheckoutEnabled({ NEXT_PUBLIC_ENABLE_CARD_CHECKOUT: "true" })).toBe(true);
        expect(paymentModeLabel({ NEXT_PUBLIC_ENABLE_CARD_CHECKOUT: "true" })).toBe("Card or invoice");
    });

    it("enables Checkr only with an explicit public flag", () => {
        expect(isCheckrEnabled({ NEXT_PUBLIC_ENABLE_CHECKR: "1" })).toBe(true);
        expect(isCheckrEnabled({ NEXT_PUBLIC_ENABLE_CHECKR: "false" })).toBe(false);
    });
});
