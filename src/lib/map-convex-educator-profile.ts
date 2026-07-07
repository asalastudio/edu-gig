import type { Doc } from "@/convex/_generated/dataModel";
import type { EducatorProfileView } from "@/lib/educator-profile-view";
import { formatEducatorRateSummary } from "@/lib/onboarding";
import { TAXONOMY, getAreaOfNeedLabel, getEngagementTypeLabel } from "@/lib/taxonomy";

function initialsFromName(name: string): string {
    const parts = name.replace(/^(Dr\.|Mr\.|Ms\.|Mrs\.)\s+/i, "").split(/\s+/);
    const a = parts[0]?.[0] ?? "";
    const b = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
    return (a + b).toUpperCase() || "EG";
}

function verificationToTier(status: Doc<"educators">["verificationStatus"]): EducatorProfileView["verificationTier"] {
    if (status === "unverified" || status === "pending") return "basic";
    if (status === "verified") return "verified";
    return "premier";
}

const gradeLabelMap: Record<string, string> = Object.fromEntries(
    TAXONOMY.gradeLevelBands.map((g) => [g.id, g.label])
);

/** Sanitized credential row from `api.credentials.listForEducatorProfile`. */
export type PublicCredentialRow = {
    id: string;
    type: string;
    title: string;
    issuingBody: string;
    state?: string;
    issueDate: string;
    expiryDate?: string;
    verified: boolean;
    hasFile: boolean;
};

export function mapConvexEducatorToProfileView(
    educator: Doc<"educators">,
    user: Doc<"users">,
    credentials?: PublicCredentialRow[]
): EducatorProfileView {
    const personalName = `${user.firstName} ${user.lastName}`.trim();
    const businessName = educator.businessName?.trim();
    const name = businessName || personalName || "Educator";
    const secondaryName = businessName && personalName ? personalName : undefined;
    const tier = verificationToTier(educator.verificationStatus);
    const gradeLevelsLabel = educator.gradeLevelBands.includes("all")
        ? "All grades"
        : educator.gradeLevelBands.map((g) => gradeLabelMap[g] ?? g.replace("_", "–")).join(", ");

    const areaLabels = educator.areasOfNeed.slice(0, 6).map((id) => getAreaOfNeedLabel(id));

    // Real rows when the caller fetched them; tier-based placeholders keep the
    // legacy/mock path (no credentials arg) rendering as before.
    const licenses: EducatorProfileView["licenses"] = credentials
        ? credentials.map((credential) => ({
              type: credential.title,
              issuer: credential.state
                  ? `${credential.issuingBody} (${credential.state})`
                  : credential.issuingBody,
              status: credential.verified ? "Verified" : "Pending",
              expiry: credential.expiryDate || "—",
              credentialId: credential.id,
              hasFile: credential.hasFile,
          }))
        : tier === "basic"
          ? [{ type: "Credentials pending review", issuer: "—", status: "Pending", expiry: "—" }]
          : [
                {
                    type: "Professional credentials",
                    issuer: "State / district records",
                    status: "Verified",
                    expiry: "—",
                },
            ];

    const amOpen = educator.availabilityStatus === "open";
    const pmOpen = educator.availabilityStatus !== "closed";

    return {
        name,
        secondaryName,
        initials: initialsFromName(name),
        headline: educator.headline,
        verificationTier: tier,
        availabilityStatus: educator.availabilityStatus,
        engagementTypes: educator.engagementTypes.map(getEngagementTypeLabel),
        avatarUrl: user.avatarUrl,
        bio: educator.bio,
        yearsExperience: educator.yearsExperience,
        placements: Math.min(50, Math.max(0, educator.profileCompletePct / 5)),
        avgRating: 0,
        reviewCount: 0,
        location: "Michigan (see coverage regions)",
        education: "See credentials",
        areas: areaLabels.length ? areaLabels : ["K-12 support"],
        badges:
            tier === "premier"
                ? ["Credentials reviewed", "Premier educator"]
                : tier === "verified"
                  ? ["Credentials reviewed"]
                  : ["Profile in progress"],
        licenses,
        presenterBio: educator.presenterBio?.trim() || undefined,
        teamMembers: educator.teamMembers?.length ? educator.teamMembers : undefined,
        experience: [
            {
                role: educator.headline,
                district: "District partners",
                years: "Recent",
            },
        ],
        videoIntro: !!educator.videoIntroUrl,
        availableDays: {
            M: { am: amOpen, pm: pmOpen },
            T: { am: amOpen, pm: pmOpen },
            W: { am: amOpen, pm: pmOpen },
            Th: { am: amOpen, pm: educator.availabilityStatus !== "closed" },
            F: { am: educator.availabilityStatus === "open", pm: false },
        },
        primarySubjectLabel: areaLabels[0] ?? "General",
        gradeLevelsLabel,
        certCount: licenses.length,
        startingRate: educator.hourlyRate ?? educator.dailyRate,
        rateUnit: educator.hourlyRate ? "hour" : "day",
        rateLabel: formatEducatorRateSummary({
            hourlyRate: educator.hourlyRate,
            dailyRate: educator.dailyRate,
        }),
    };
}
