/**
 * View-model mappers for review data — keep price/rating formatting out of React.
 * Mirrors the shape of src/lib/map-dashboard.ts.
 */

export type PricingType = "hourly" | "daily" | "fixed";

export type ReviewSummaryInput = {
    overallRating: number;
    subjectExpertise?: number;
    classroomMgmt?: number;
    communication?: number;
    reliability?: number;
};

export type ReviewBreakdown = {
    subjectExpertise: number;
    classroomMgmt: number;
    communication: number;
    reliability: number;
};

export type ReviewSummary = {
    average: number;
    count: number;
    breakdown: ReviewBreakdown;
};

/** Clamp n to [0, 5] and render as `X.X / 5`. */
export function formatRating(n: number): string {
    if (!Number.isFinite(n)) return "0.0 / 5";
    const clamped = Math.max(0, Math.min(5, n));
    return `${clamped.toFixed(1)} / 5`;
}

/** Price formatter aware of pricingType. */
export function formatPrice(amount: number, pricingType: PricingType): string {
    if (!Number.isFinite(amount)) return "—";
    const rounded = Math.round(amount);
    const formatted = `$${rounded.toLocaleString("en-US")}`;
    switch (pricingType) {
        case "hourly":
            return `${formatted}/hr`;
        case "daily":
            return `${formatted}/day`;
        case "fixed":
            return `${formatted} flat`;
    }
}

/**
 * Aggregate reviews — average overall rating, count, and average of the
 * four optional sub-ratings (only values that are present contribute).
 */
export function summarizeReviews(reviews: ReviewSummaryInput[]): ReviewSummary {
    const count = reviews.length;
    if (count === 0) {
        return {
            average: 0,
            count: 0,
            breakdown: {
                subjectExpertise: 0,
                classroomMgmt: 0,
                communication: 0,
                reliability: 0,
            },
        };
    }

    const average =
        reviews.reduce((sum, r) => sum + r.overallRating, 0) / count;

    function avgOf(key: keyof ReviewBreakdown): number {
        const values = reviews
            .map((r) => r[key as keyof ReviewSummaryInput])
            .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
        if (values.length === 0) return 0;
        return values.reduce((s, v) => s + v, 0) / values.length;
    }

    return {
        average,
        count,
        breakdown: {
            subjectExpertise: avgOf("subjectExpertise"),
            classroomMgmt: avgOf("classroomMgmt"),
            communication: avgOf("communication"),
            reliability: avgOf("reliability"),
        },
    };
}
