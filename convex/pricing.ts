// Shared pricing math used by Convex mutations AND Next.js routes.
// Must be importable from both `convex/*` and `src/*`.
export const PLATFORM_FEE_PCT = 0.18;

export type PricingBreakdown = {
    gigPrice: number;        // educator's listed rate
    platformFee: number;     // 18% of gigPrice
    totalCharged: number;    // gigPrice + platformFee — what district pays
    educatorPayout: number;  // gigPrice — what educator receives
};

export function computePricing(gigPrice: number): PricingBreakdown {
    const platformFee = Math.round(gigPrice * PLATFORM_FEE_PCT * 100) / 100;
    const totalCharged = Math.round((gigPrice + platformFee) * 100) / 100;
    return {
        gigPrice,
        platformFee,
        totalCharged,
        educatorPayout: gigPrice,
    };
}
