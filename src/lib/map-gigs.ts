import type { Doc } from "@/convex/_generated/dataModel";
import type { PricingType } from "@/lib/map-review";

export type GigCard = {
    id: string;
    title: string;
    areaOfNeed: string;
    pricingType: PricingType;
    price: number;
    isActive: boolean;
    createdAt: number;
};

export function demoGigCards(now = Date.now()): GigCard[] {
    return [
        {
            id: "demo-1",
            title: "Curriculum Mapping Workshop",
            areaOfNeed: "instruction_curriculum",
            pricingType: "fixed",
            price: 800,
            isActive: true,
            createdAt: now - 1000 * 60 * 60 * 24 * 10,
        },
        {
            id: "demo-2",
            title: "Coaching Session",
            areaOfNeed: "leadership",
            pricingType: "hourly",
            price: 75,
            isActive: true,
            createdAt: now - 1000 * 60 * 60 * 24 * 3,
        },
    ];
}

export function mapGigsToCards(gigs: Array<Doc<"gigs">>): GigCard[] {
    return gigs.map((gig) => ({
        id: gig._id,
        title: gig.title,
        areaOfNeed: gig.areaOfNeed,
        pricingType: gig.pricingType,
        price: gig.price,
        isActive: gig.isActive,
        createdAt: gig.createdAt,
    }));
}

export function formatCreatedAt(ts: number): string {
    const d = new Date(ts);
    return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}
