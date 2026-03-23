import type { Doc } from "@/convex/_generated/dataModel";
import type { MockEducatorProfileView } from "@/lib/mock-educators";
import { TAXONOMY, getAreaOfNeedLabel } from "@/lib/taxonomy";

function initialsFromName(name: string): string {
    const parts = name.replace(/^(Dr\.|Mr\.|Ms\.|Mrs\.)\s+/i, "").split(/\s+/);
    const a = parts[0]?.[0] ?? "";
    const b = parts[parts.length - 1]?.[0] ?? "";
    return (a + b).toUpperCase() || "EG";
}

function verificationToTier(status: Doc<"educators">["verificationStatus"]): MockEducatorProfileView["verificationTier"] {
    if (status === "unverified" || status === "pending") return "basic";
    if (status === "verified") return "verified";
    return "premier";
}

const gradeLabelMap: Record<string, string> = Object.fromEntries(
    TAXONOMY.gradeLevelBands.map((g) => [g.id, g.label])
);

export function mapConvexEducatorToProfileView(
    educator: Doc<"educators">,
    user: Doc<"users">
): MockEducatorProfileView {
    const name = `${user.firstName} ${user.lastName}`.trim() || "Educator";
    const tier = verificationToTier(educator.verificationStatus);
    const gradeLevelsLabel = educator.gradeLevelBands.includes("all")
        ? "All grades"
        : educator.gradeLevelBands.map((g) => gradeLabelMap[g] ?? g.replace("_", "–")).join(", ");

    const areaLabels = educator.areasOfNeed.slice(0, 6).map((id) => getAreaOfNeedLabel(id));

    const licenses: MockEducatorProfileView["licenses"] =
        tier === "basic"
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
        initials: initialsFromName(name),
        headline: educator.headline,
        verificationTier: tier,
        availabilityStatus: educator.availabilityStatus,
        avatarUrl: user.avatarUrl ?? "https://randomuser.me/api/portraits/lego/1.jpg",
        bio: educator.bio,
        yearsExperience: educator.yearsExperience,
        placements: Math.min(50, Math.max(0, educator.profileCompletePct / 5)),
        avgRating: 4.5,
        reviewCount: 0,
        location: "Texas (see coverage regions)",
        education: "See credentials",
        areas: areaLabels.length ? areaLabels : ["K-12 support"],
        badges:
            tier === "premier"
                ? ["Background Checked", "Premier educator"]
                : tier === "verified"
                  ? ["Background Checked"]
                  : ["Profile in progress"],
        licenses,
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
    };
}
