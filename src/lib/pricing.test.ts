import { describe, expect, it } from "vitest";
import { computePricing } from "../../convex/pricing";

describe("computePricing", () => {
    it("adds the platform fee on top of a 450 gig price", () => {
        expect(computePricing(450)).toEqual({
            gigPrice: 450,
            platformFee: 81,
            totalCharged: 531,
            educatorPayout: 450,
        });
    });

    it("adds the platform fee on top of a 1000 gig price", () => {
        expect(computePricing(1000)).toEqual({
            gigPrice: 1000,
            platformFee: 180,
            totalCharged: 1180,
            educatorPayout: 1000,
        });
    });

    it("rounds awkward cent values to cents", () => {
        expect(computePricing(99.99)).toEqual({
            gigPrice: 99.99,
            platformFee: 18,
            totalCharged: 117.99,
            educatorPayout: 99.99,
        });
    });
});
