import { describe, expect, it } from "vitest";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { demoGigCards, formatCreatedAt, mapGigsToCards } from "./map-gigs";

describe("mapGigsToCards", () => {
    it("maps Convex gig rows into dashboard cards", () => {
        const gig = {
            _id: "gig_1" as Id<"gigs">,
            _creationTime: 1,
            educatorId: "educator_1" as Id<"educators">,
            title: "Executive Function Coaching",
            description: "Support for middle school intervention teams.",
            areaOfNeed: "instruction_curriculum",
            engagementType: "consulting",
            gradeLevels: ["6_8"],
            coverageRegions: ["region_1"],
            deliverables: ["90-minute session"],
            pricingType: "fixed",
            price: 1200,
            isActive: true,
            createdAt: 1_700_000_000_000,
        } satisfies Doc<"gigs">;

        expect(mapGigsToCards([gig])).toEqual([
            {
                id: "gig_1",
                title: "Executive Function Coaching",
                areaOfNeed: "instruction_curriculum",
                pricingType: "fixed",
                price: 1200,
                isActive: true,
                createdAt: 1_700_000_000_000,
            },
        ]);
    });
});

describe("demoGigCards", () => {
    it("returns stable demo cards from a provided clock", () => {
        const cards = demoGigCards(1_700_000_000_000);

        expect(cards).toHaveLength(2);
        expect(cards[0].id).toBe("demo-1");
        expect(cards[0].createdAt).toBeLessThan(1_700_000_000_000);
    });
});

describe("formatCreatedAt", () => {
    it("formats dashboard dates consistently", () => {
        expect(formatCreatedAt(Date.UTC(2026, 4, 2, 12))).toBe("May 2, 2026");
    });
});
