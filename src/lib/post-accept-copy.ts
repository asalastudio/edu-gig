/** Post-accept copy after Contract Hub removal (Chris Sep 11). */

export const DISTRICT_POST_ACCEPT_COPY =
    "You've accepted this gig. Reach out to the consultant within 3 business days to coordinate scope, contracts, and payment off-platform.";

export const CONSULTANT_POST_ACCEPT_COPY =
    "Your proposal has been approved. If you don't hear from the school in 3 business days, reach out to them. Contracts and payment are handled off-platform.";

export function getPostAcceptCopy(role: "district" | "educator"): string {
    return role === "district" ? DISTRICT_POST_ACCEPT_COPY : CONSULTANT_POST_ACCEPT_COPY;
}

export const FOLLOW_UP_BUSINESS_DAYS = 3;

/** Adds weekdays only (Sat/Sun skipped; school holidays are not modeled). */
export function addBusinessDays(from: Date, days: number): Date {
    const date = new Date(from);
    let remaining = days;
    while (remaining > 0) {
        date.setDate(date.getDate() + 1);
        const weekday = date.getDay();
        if (weekday !== 0 && weekday !== 6) remaining -= 1;
    }
    return date;
}

/** e.g. "Fri, Oct 2" — the reach-out deadline 3 business days after acceptance. */
export function formatFollowUpDeadline(acceptedAt: number | Date, locale = "en-US"): string {
    const deadline = addBusinessDays(new Date(acceptedAt), FOLLOW_UP_BUSINESS_DAYS);
    return deadline.toLocaleDateString(locale, { weekday: "short", month: "short", day: "numeric" });
}

/**
 * Chris's Sep 11 wording, split so the deadline can be emphasized:
 * `${lead}<strong>${deadline}</strong>${rest}`.
 */
export function getPostAcceptNextStep(role: "district" | "educator", acceptedAt: number | Date) {
    const deadline = `by ${formatFollowUpDeadline(acceptedAt)} (${FOLLOW_UP_BUSINESS_DAYS} business days)`;
    return role === "district"
        ? {
              lead: "You've accepted this gig. Reach out to the consultant ",
              deadline,
              rest: " to coordinate scope, contracts, and payment off-platform.",
          }
        : {
              lead: "Your proposal has been approved. If you don't hear from the school ",
              deadline,
              rest: ", reach out to them. Contracts and payment are handled off-platform.",
          };
}
