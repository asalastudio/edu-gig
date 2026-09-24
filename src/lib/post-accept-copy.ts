/** Post-accept copy after Contract Hub removal (Chris Sep 11). */

export const DISTRICT_POST_ACCEPT_COPY =
    "You've accepted this gig. Reach out to the consultant within 3 business days to coordinate scope, contracts, and payment off-platform.";

export const CONSULTANT_POST_ACCEPT_COPY =
    "Your proposal has been approved. If you don't hear from the school in 3 business days, reach out to them. Contracts and payment are handled off-platform.";

export function getPostAcceptCopy(role: "district" | "educator"): string {
    return role === "district" ? DISTRICT_POST_ACCEPT_COPY : CONSULTANT_POST_ACCEPT_COPY;
}
