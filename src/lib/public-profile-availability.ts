import { availabilityStatusLabel } from "./map-admin";

export type PublicAvailabilityStatus = "open" | "limited" | "closed";

/**
 * Public-profile availability copy. Consultants set open / limited / closed
 * in settings. This is not the retired "Available now" directory filter.
 */
export function publicProfileAvailabilityCopy(status: PublicAvailabilityStatus): {
    label: string;
    hint: string;
} {
    return {
        label: availabilityStatusLabel(status),
        hint: "Dates and scope are confirmed directly with the consultant after you start a gig.",
    };
}
