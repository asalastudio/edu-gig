export type EducatorTeamMemberView = {
    name: string;
    title: string;
    bio: string;
};

export type EducatorProfileView = {
    name: string;
    /** Personal name, shown beneath the business name when one is set. */
    secondaryName?: string;
    initials: string;
    headline: string;
    verificationTier: "basic" | "verified" | "premier";
    availabilityStatus: "open" | "limited" | "closed";
    avatarUrl?: string;
    bio: string;
    yearsExperience: number;
    placements: number;
    avgRating: number;
    reviewCount: number;
    location: string;
    education: string;
    areas: string[];
    badges: string[];
    licenses: {
        type: string;
        issuer: string;
        status: "Verified" | "Pending";
        expiry: string;
        /** Present only for real credential rows (not tier placeholders). */
        credentialId?: string;
        hasFile?: boolean;
    }[];
    /** Copyable bio for district SCECH applications. */
    presenterBio?: string;
    teamMembers?: EducatorTeamMemberView[];
    experience: { role: string; district: string; years: string }[];
    videoIntro: boolean;
    availableDays: Record<string, { am: boolean; pm: boolean }>;
    primarySubjectLabel: string;
    gradeLevelsLabel: string;
    certCount: number;
    startingRate?: number;
    rateUnit: "hour" | "day";
    rateLabel: string;
};
