export const SUPPORT_EMAIL = "support@k12gig.com";
export const LEGAL_LAST_UPDATED = "May 2, 2026";
export const TERMS_VERSION = "2026-05-02";
export const PRIVACY_VERSION = "2026-05-02";

export function supportMailto(subject?: string) {
    return subject ? `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}` : `mailto:${SUPPORT_EMAIL}`;
}
