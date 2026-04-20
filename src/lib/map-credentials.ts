/**
 * View-model helpers for educator credentials.
 * Keeps label/expiry formatting out of React.
 */

export type CredentialType =
    | "state_license"
    | "certification"
    | "degree"
    | "endorsement";

const TYPE_LABELS: Record<CredentialType, string> = {
    state_license: "State License",
    certification: "Certification",
    degree: "Degree",
    endorsement: "Endorsement",
};

/** Human label for a credential type; falls back to the raw code. */
export function formatCredentialType(type: string): string {
    if (type in TYPE_LABELS) {
        return TYPE_LABELS[type as CredentialType];
    }
    return type
        .split("_")
        .map((p) => (p.length > 0 ? p[0].toUpperCase() + p.slice(1) : p))
        .join(" ");
}

/**
 * Render an expiry date label.
 *  - undefined / empty → "No expiration"
 *  - ISO date (YYYY-MM-DD) in the past → "Expired YYYY-MM-DD"
 *  - otherwise → "Expires YYYY-MM-DD"
 *
 * Accepts a mockable `now` for deterministic tests.
 */
export function formatExpiry(
    expiryDate: string | null | undefined,
    now: Date = new Date()
): string {
    if (!expiryDate) return "No expiration";
    const trimmed = expiryDate.trim();
    if (trimmed.length === 0) return "No expiration";

    // Parse YYYY-MM-DD as UTC to avoid TZ drift.
    const parsed = parseIsoDate(trimmed);
    if (parsed === null) return `Expires ${trimmed}`;

    const today = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );
    if (parsed.getTime() < today.getTime()) {
        return `Expired ${trimmed}`;
    }
    return `Expires ${trimmed}`;
}

function parseIsoDate(s: string): Date | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (!match) return null;
    const y = Number(match[1]);
    const m = Number(match[2]);
    const d = Number(match[3]);
    if (m < 1 || m > 12 || d < 1 || d > 31) return null;
    const utc = Date.UTC(y, m - 1, d);
    if (Number.isNaN(utc)) return null;
    return new Date(utc);
}
