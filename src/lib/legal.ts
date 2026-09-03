export const SUPPORT_EMAIL = "support@k12gig.com";
export const LEGAL_LAST_UPDATED = "September 1, 2026";
/** Bumped 2026-09-01: connection-marketplace model, payment and signatures off-platform. */
export const TERMS_VERSION = "2026-09-01";
export const PRIVACY_VERSION = "2026-05-02";

export function supportMailto(subject?: string) {
    return subject ? `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}` : `mailto:${SUPPORT_EMAIL}`;
}
