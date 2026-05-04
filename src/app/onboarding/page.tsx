"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Buildings,
    ChalkboardTeacher,
    CheckCircle,
    ClipboardText,
    Compass,
    GraduationCap,
    IdentificationBadge,
    SealCheck,
    UsersThree,
} from "@phosphor-icons/react";
import { api } from "@/convex/_generated/api";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { PrimaryButton } from "@/components/shared/button";
import {
    AUTH_INTENT_PARAM,
    AUTH_NEXT_PARAM,
    dashboardPathForIntent,
    intentFromRole,
    isAuthIntent,
    safeInternalPath,
    type AuthIntent,
} from "@/lib/auth-intent";
import {
    DISTRICT_FIRST_ACTIONS,
    DISTRICT_ROLE_OPTIONS,
    EDUCATOR_AVAILABILITY_OPTIONS,
    defaultDestinationForIntent,
    destinationForFirstAction,
    educatorProfileCompletionScore,
    roleForDistrictOnboarding,
    type DistrictFirstAction,
    type DistrictOnboardingRole,
} from "@/lib/onboarding";
import { TAXONOMY } from "@/lib/taxonomy";
import { PRIVACY_VERSION, TERMS_VERSION } from "@/lib/legal";
import { US_STATES } from "@/lib/us-states";
import { cn } from "@/lib/utils";

const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

const DISTRICT_STEPS = ["Role", "Organization", "First action"];
const EDUCATOR_STEPS = ["Identity", "Expertise", "Availability", "Review"];

/** Avoid calling `useUser` when Clerk isn't configured (no ClerkProvider) - required for static build. */
export default function OnboardingPage() {
    if (!hasClerk) {
        return <OnboardingWithoutClerk />;
    }
    return <OnboardingWithClerk />;
}

function OnboardingWithoutClerk() {
    const router = useRouter();
    return (
        <div className="min-h-screen bg-[var(--bg-app)] flex flex-col">
            <SiteHeader />
            <main className="flex-1 max-w-lg mx-auto px-6 py-16 text-center">
                <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)] mb-4">Onboarding</h1>
                <p className="text-[var(--text-secondary)] mb-8">
                    Sign in is not configured. Use the demo dashboards from the home page, or add Clerk keys to your environment.
                </p>
                <PrimaryButton onClick={() => router.push("/")}>Home</PrimaryButton>
            </main>
            <SiteFooter />
        </div>
    );
}

function OnboardingWithClerk() {
    const { user, isLoaded } = useUser();
    const router = useRouter();
    const searchParams = useSearchParams();
    const intentParam = searchParams.get(AUTH_INTENT_PARAM);
    const intent: AuthIntent | null = isAuthIntent(intentParam) ? intentParam : null;
    const safeNext = safeInternalPath(searchParams.get(AUTH_NEXT_PARAM));

    const viewer = useQuery(api.users.viewer);
    const completeOnboarding = useMutation(api.users.completeOnboarding);

    const [step, setStep] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [acceptedLegal, setAcceptedLegal] = useState(false);

    const [districtRole, setDistrictRole] = useState<DistrictOnboardingRole>("superintendent");
    const [organizationName, setOrganizationName] = useState("");
    const [districtState, setDistrictState] = useState("TX");
    const [districtRegion, setDistrictRegion] = useState("region_2");
    const [districtNceaId, setDistrictNceaId] = useState("");
    const [districtAction, setDistrictAction] = useState<DistrictFirstAction>("post_need");

    const [headline, setHeadline] = useState("");
    const [bio, setBio] = useState("");
    const [yearsExperience, setYearsExperience] = useState("5");
    const [hourlyRate, setHourlyRate] = useState("");
    const [availabilityStatus, setAvailabilityStatus] = useState<"open" | "limited" | "closed">("open");
    const [gradeLevelBands, setGradeLevelBands] = useState<string[]>([]);
    const [areasOfNeed, setAreasOfNeed] = useState<string[]>([]);
    const [engagementTypes, setEngagementTypes] = useState<string[]>([]);
    const [coverageRegions, setCoverageRegions] = useState<string[]>([]);

    const isEducator = intent === "educator";
    const steps = isEducator ? EDUCATOR_STEPS : DISTRICT_STEPS;
    const finalStep = steps.length - 1;
    const firstName = user?.firstName ?? "there";

    const educatorCompletion = useMemo(
        () =>
            educatorProfileCompletionScore({
                headline,
                bio,
                yearsExperience: Number(yearsExperience) || 0,
                hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
                gradeLevelBands,
                areasOfNeed,
                engagementTypes,
                coverageRegions,
            }),
        [areasOfNeed, bio, coverageRegions, engagementTypes, gradeLevelBands, headline, hourlyRate, yearsExperience]
    );

    useEffect(() => {
        if (!isLoaded) return;
        if (!user) {
            router.replace("/sign-in");
            return;
        }
        if (viewer === undefined) return;
        if (viewer?.onboarded) {
            router.replace(safeNext ?? dashboardPathForIntent(intentFromRole(viewer.role)));
        }
    }, [isLoaded, user, viewer, router, safeNext]);

    useEffect(() => {
        setStep(0);
        setError(null);
        setAcceptedLegal(false);
    }, [intent]);

    function validateStep(targetStep = step) {
        if (!intent) return null;
        if (intent === "district") {
            if (targetStep === 1) {
                if (organizationName.trim().length < 2) return "Enter the district, school, or organization name.";
                if (districtState.trim().length < 2) return "Choose the state for this district account.";
                if (!districtRegion) return "Choose the region this workspace should start with.";
            }
            return null;
        }

        if (targetStep === 0) {
            if (headline.trim().length < 12) return "Add a professional headline with at least a little context.";
            if (bio.trim().length < 40) return "Add a short bio so districts know what outcomes you support.";
        }
        if (targetStep === 1) {
            if (areasOfNeed.length === 0) return "Choose at least one area of need.";
            if (gradeLevelBands.length === 0) return "Choose at least one grade band.";
        }
        if (targetStep === 2) {
            if (engagementTypes.length === 0) return "Choose at least one engagement type.";
            if (coverageRegions.length === 0) return "Choose at least one coverage area.";
            if (!hourlyRate || Number(hourlyRate) < 20) return "Add a starting hourly rate of $20 or more.";
        }
        return null;
    }

    function validateAllSteps() {
        for (let index = 0; index < steps.length; index += 1) {
            const message = validateStep(index);
            if (message) {
                setStep(index);
                return message;
            }
        }
        return null;
    }

    function handleNext() {
        const message = validateStep();
        if (message) {
            setError(message);
            return;
        }
        setError(null);
        setStep((current) => Math.min(finalStep, current + 1));
    }

    async function handleSubmit() {
        if (!intent) return;
        const message = validateAllSteps();
        if (message) {
            setError(message);
            return;
        }
        if (!acceptedLegal) {
            setError("Review and accept the current Terms of Service and Privacy Policy before finishing setup.");
            return;
        }

        setError(null);
        setSubmitting(true);
        try {
            await completeOnboarding({
                role: intent === "educator" ? "educator" : roleForDistrictOnboarding(districtRole),
                organizationName: intent === "district" ? organizationName.trim() : undefined,
                districtState: intent === "district" ? districtState.trim().toUpperCase() : undefined,
                districtRegion: intent === "district" ? districtRegion : undefined,
                state: intent === "district" ? districtState.trim().toUpperCase() : undefined,
                region: intent === "district" ? districtRegion : undefined,
                districtNceaId: intent === "district" ? districtNceaId.trim() || undefined : undefined,
                headline: intent === "educator" ? headline.trim() : undefined,
                bio: intent === "educator" ? bio.trim() : undefined,
                yearsExperience: intent === "educator" ? Number(yearsExperience) || 0 : undefined,
                hourlyRate: intent === "educator" && hourlyRate ? Number(hourlyRate) : undefined,
                gradeLevelBands: intent === "educator" ? gradeLevelBands : undefined,
                areasOfNeed: intent === "educator" ? areasOfNeed : undefined,
                engagementTypes: intent === "educator" ? engagementTypes : undefined,
                coverageRegions: intent === "educator" ? coverageRegions : undefined,
                availabilityStatus: intent === "educator" ? availabilityStatus : undefined,
                termsVersion: TERMS_VERSION,
                privacyVersion: PRIVACY_VERSION,
                legalAcceptedAt: Date.now(),
            });

            const destination =
                intent === "district"
                    ? destinationForFirstAction(districtAction, safeNext)
                    : safeNext ?? defaultDestinationForIntent(intent);
            router.replace(destination);
        } catch (err) {
            console.error(err);
            setError(
                "Could not save your setup. If you just enabled Clerk, confirm Convex is using the same Clerk issuer and try again."
            );
        } finally {
            setSubmitting(false);
        }
    }

    if (!isLoaded || viewer === undefined) {
        return (
            <div className="min-h-screen bg-[var(--bg-app)] flex flex-col">
                <SiteHeader />
                <main className="flex-1 flex items-center justify-center">
                    <p className="text-[var(--text-secondary)] font-medium">Loading setup...</p>
                </main>
                <SiteFooter />
            </div>
        );
    }

    if (!user || viewer?.onboarded) {
        return null;
    }

    if (!intent) {
        return <RoleChoice firstName={firstName} />;
    }

    return (
        <div className="min-h-screen bg-[var(--bg-app)] flex flex-col">
            <SiteHeader />
            <main className="flex-1 px-5 py-8 md:px-8 md:py-12">
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
                    <section className="rounded-lg border border-[var(--border-default)] bg-white shadow-[var(--shadow-soft)] overflow-hidden">
                        <div className="px-6 md:px-8 py-7 border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
                            <div className="education-rule mb-4" />
                            <p className="eyebrow mb-3">{isEducator ? "Educator setup" : "District setup"}</p>
                            <h1 className="font-heading text-3xl md:text-4xl font-bold text-[var(--text-primary)] tracking-tight">
                                {isEducator
                                    ? `Welcome, ${firstName}. Build a profile districts can trust.`
                                    : `Welcome, ${firstName}. Prepare a district-ready workspace.`}
                            </h1>
                            <p className="mt-3 max-w-2xl text-base md:text-lg font-medium text-[var(--text-secondary)]">
                                {isEducator
                                    ? "Start with the details a superintendent, HR leader, or principal needs before they reach out."
                                    : "Set the role, organization, and first move so K12Gig feels like a hiring workspace from the first visit."}
                            </p>
                        </div>

                        <div className="px-6 md:px-8 pt-6">
                            <StepRail steps={steps} currentStep={step} />
                        </div>

                        <div className="px-6 md:px-8 py-8 min-h-[430px]">
                            {intent === "district" ? (
                                <DistrictStep
                                    step={step}
                                    role={districtRole}
                                    onRoleChange={setDistrictRole}
                                    organizationName={organizationName}
                                    onOrganizationNameChange={setOrganizationName}
                                    state={districtState}
                                    onStateChange={setDistrictState}
                                    region={districtRegion}
                                    onRegionChange={setDistrictRegion}
                                    nceaId={districtNceaId}
                                    onNceaIdChange={setDistrictNceaId}
                                    action={districtAction}
                                    onActionChange={setDistrictAction}
                                />
                            ) : (
                                <EducatorStep
                                    step={step}
                                    headline={headline}
                                    onHeadlineChange={setHeadline}
                                    bio={bio}
                                    onBioChange={setBio}
                                    yearsExperience={yearsExperience}
                                    onYearsExperienceChange={setYearsExperience}
                                    hourlyRate={hourlyRate}
                                    onHourlyRateChange={setHourlyRate}
                                    availabilityStatus={availabilityStatus}
                                    onAvailabilityStatusChange={setAvailabilityStatus}
                                    gradeLevelBands={gradeLevelBands}
                                    onGradeLevelBandsChange={setGradeLevelBands}
                                    areasOfNeed={areasOfNeed}
                                    onAreasOfNeedChange={setAreasOfNeed}
                                    engagementTypes={engagementTypes}
                                    onEngagementTypesChange={setEngagementTypes}
                                    coverageRegions={coverageRegions}
                                    onCoverageRegionsChange={setCoverageRegions}
                                    completion={educatorCompletion}
                                />
                            )}

                            {error && (
                                <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                                    {error}
                                </div>
                            )}

                            {step === finalStep && (
                                <LegalAcceptance
                                    intent={intent}
                                    accepted={acceptedLegal}
                                    onAcceptedChange={setAcceptedLegal}
                                />
                            )}
                        </div>

                        <div className="px-6 md:px-8 py-5 border-t border-[var(--border-subtle)] bg-white flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setError(null);
                                    setStep((current) => Math.max(0, current - 1));
                                }}
                                disabled={step === 0 || submitting}
                                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[var(--border-subtle)] px-4 py-2.5 text-sm font-bold text-[var(--text-secondary)] disabled:opacity-40"
                            >
                                Back
                            </button>
                            <PrimaryButton
                                type="button"
                                onClick={step === finalStep ? handleSubmit : handleNext}
                                disabled={submitting}
                                className="w-full sm:w-auto"
                            >
                                {submitting ? "Saving setup..." : step === finalStep ? "Finish setup" : "Continue"}
                            </PrimaryButton>
                        </div>
                    </section>

                    <OnboardingAside intent={intent} completion={educatorCompletion} districtAction={districtAction} />
                </div>
            </main>
            <SiteFooter />
        </div>
    );
}

function RoleChoice({ firstName }: { firstName: string }) {
    return (
        <div className="min-h-screen bg-[var(--bg-app)] flex flex-col">
            <SiteHeader />
            <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-14">
                <div className="text-center max-w-2xl mx-auto">
                    <div className="education-rule mx-auto mb-5" />
                    <p className="eyebrow mb-3">Choose your workspace</p>
                    <h1 className="font-heading text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-3">
                        Welcome, {firstName}. Where should we start?
                    </h1>
                    <p className="text-lg font-medium text-[var(--text-secondary)]">
                        K12Gig separates district hiring tools from educator profile tools so each workspace starts with the right defaults.
                    </p>
                </div>
                <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Link
                        href={`/onboarding?${AUTH_INTENT_PARAM}=district`}
                        className="group rounded-lg border border-[var(--border-default)] bg-white p-7 shadow-[var(--shadow-subtle)] hover:border-[var(--accent-primary)]/40 hover:shadow-[var(--shadow-soft)] transition-all"
                    >
                        <Buildings weight="duotone" className="h-11 w-11 text-[var(--accent-primary)] mb-5" />
                        <h2 className="font-heading text-2xl font-bold text-[var(--text-primary)] mb-2">I hire for a district or school</h2>
                        <p className="text-sm font-medium leading-6 text-[var(--text-secondary)]">
                            For superintendents, HR teams, principals, and school leaders posting needs or comparing educators.
                        </p>
                        <span className="mt-6 inline-flex text-sm font-bold text-[var(--accent-primary)] group-hover:underline">
                            Set up district workspace
                        </span>
                    </Link>
                    <Link
                        href={`/onboarding?${AUTH_INTENT_PARAM}=educator`}
                        className="group rounded-lg border border-[var(--border-default)] bg-white p-7 shadow-[var(--shadow-subtle)] hover:border-[var(--accent-primary)]/40 hover:shadow-[var(--shadow-soft)] transition-all"
                    >
                        <ChalkboardTeacher weight="duotone" className="h-11 w-11 text-[var(--accent-primary)] mb-5" />
                        <h2 className="font-heading text-2xl font-bold text-[var(--text-primary)] mb-2">I offer education services</h2>
                        <p className="text-sm font-medium leading-6 text-[var(--text-secondary)]">
                            For teachers, coaches, specialists, facilitators, and consultants creating a district-facing profile.
                        </p>
                        <span className="mt-6 inline-flex text-sm font-bold text-[var(--accent-primary)] group-hover:underline">
                            Build educator profile
                        </span>
                    </Link>
                </div>
            </main>
            <SiteFooter />
        </div>
    );
}

function LegalAcceptance({
    intent,
    accepted,
    onAcceptedChange,
}: {
    intent: AuthIntent;
    accepted: boolean;
    onAcceptedChange: (value: boolean) => void;
}) {
    return (
        <label className="mt-6 flex cursor-pointer gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4 text-left">
            <input
                type="checkbox"
                checked={accepted}
                onChange={(event) => onAcceptedChange(event.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 accent-[var(--accent-primary)]"
            />
            <span className="text-sm leading-6 text-[var(--text-secondary)]">
                I agree to K12Gig&apos;s{" "}
                <Link href="/terms" className="font-bold text-[var(--accent-primary)] hover:underline">
                    Terms of Service
                </Link>{" "}
                version {TERMS_VERSION} and{" "}
                <Link href="/privacy" className="font-bold text-[var(--accent-primary)] hover:underline">
                    Privacy Policy
                </Link>{" "}
                version {PRIVACY_VERSION}
                {intent === "district"
                    ? ", and I understand that district DPA, purchase-order, and invoice requirements should be reviewed before paid use."
                    : ", and I understand that my public profile, rates, credentials, and availability must stay accurate for district review."}
            </span>
        </label>
    );
}

function DistrictStep(props: {
    step: number;
    role: DistrictOnboardingRole;
    onRoleChange: (value: DistrictOnboardingRole) => void;
    organizationName: string;
    onOrganizationNameChange: (value: string) => void;
    state: string;
    onStateChange: (value: string) => void;
    region: string;
    onRegionChange: (value: string) => void;
    nceaId: string;
    onNceaIdChange: (value: string) => void;
    action: DistrictFirstAction;
    onActionChange: (value: DistrictFirstAction) => void;
}) {
    if (props.step === 0) {
        return (
            <div className="space-y-6">
                <SectionIntro
                    icon={IdentificationBadge}
                    title="What role should this workspace support?"
                    description="This sets the account role and the tone of the hiring dashboard."
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {DISTRICT_ROLE_OPTIONS.map((option) => (
                        <OptionCard
                            key={option.id}
                            selected={props.role === option.id}
                            title={option.label}
                            description={option.description}
                            onClick={() => props.onRoleChange(option.id)}
                        />
                    ))}
                </div>
            </div>
        );
    }

    if (props.step === 1) {
        return (
            <div className="space-y-6">
                <SectionIntro
                    icon={Buildings}
                    title="Identify the district or school."
                    description="Educators need a real organization name and service region before they trust a request."
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="District, school, or organization name" className="md:col-span-2">
                        <input
                            value={props.organizationName}
                            onChange={(e) => props.onOrganizationNameChange(e.target.value)}
                            placeholder="Austin ISD"
                            autoFocus
                            className="field-control"
                        />
                    </Field>
                    <Field label="State">
                        <select value={props.state} onChange={(e) => props.onStateChange(e.target.value)} className="field-control">
                            {US_STATES.map((state) => (
                                <option key={state.code} value={state.code}>
                                    {state.name}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Primary service region">
                        <select value={props.region} onChange={(e) => props.onRegionChange(e.target.value)} className="field-control">
                            {TAXONOMY.coverageRegions.map((region) => (
                                <option key={region.id} value={region.id}>
                                    {region.label}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label="District identifier" hint="Optional">
                        <input
                            value={props.nceaId}
                            onChange={(e) => props.onNceaIdChange(e.target.value)}
                            placeholder="NCES or internal ID"
                            className="field-control"
                        />
                    </Field>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <SectionIntro
                icon={Compass}
                title="Choose the first action after setup."
                description="This keeps the handoff crisp for a busy superintendent, principal, or HR lead."
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {DISTRICT_FIRST_ACTIONS.map((option) => (
                    <OptionCard
                        key={option.id}
                        selected={props.action === option.id}
                        title={option.label}
                        description={option.description}
                        onClick={() => props.onActionChange(option.id)}
                    />
                ))}
            </div>
        </div>
    );
}

function EducatorStep(props: {
    step: number;
    headline: string;
    onHeadlineChange: (value: string) => void;
    bio: string;
    onBioChange: (value: string) => void;
    yearsExperience: string;
    onYearsExperienceChange: (value: string) => void;
    hourlyRate: string;
    onHourlyRateChange: (value: string) => void;
    availabilityStatus: "open" | "limited" | "closed";
    onAvailabilityStatusChange: (value: "open" | "limited" | "closed") => void;
    gradeLevelBands: string[];
    onGradeLevelBandsChange: (value: string[]) => void;
    areasOfNeed: string[];
    onAreasOfNeedChange: (value: string[]) => void;
    engagementTypes: string[];
    onEngagementTypesChange: (value: string[]) => void;
    coverageRegions: string[];
    onCoverageRegionsChange: (value: string[]) => void;
    completion: number;
}) {
    if (props.step === 0) {
        return (
            <div className="space-y-6">
                <SectionIntro
                    icon={GraduationCap}
                    title="Start with professional credibility."
                    description="District leaders scan for role clarity, outcomes, and evidence that you understand K-12 environments."
                />
                <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_180px] gap-4">
                    <Field label="Professional headline">
                        <input
                            value={props.headline}
                            onChange={(e) => props.onHeadlineChange(e.target.value)}
                            placeholder="Math interventionist and instructional coach"
                            autoFocus
                            className="field-control"
                        />
                    </Field>
                    <Field label="Years in education">
                        <input
                            type="number"
                            min={0}
                            value={props.yearsExperience}
                            onChange={(e) => props.onYearsExperienceChange(e.target.value)}
                            className="field-control"
                        />
                    </Field>
                    <Field label="Short district-facing bio" className="md:col-span-2">
                        <textarea
                            value={props.bio}
                            onChange={(e) => props.onBioChange(e.target.value)}
                            rows={5}
                            placeholder="I help campuses strengthen Tier 2 math intervention, coach teachers through data cycles, and support implementation with practical classroom routines."
                            className="field-control min-h-32 py-3"
                        />
                    </Field>
                </div>
            </div>
        );
    }

    if (props.step === 1) {
        return (
            <div className="space-y-7">
                <SectionIntro
                    icon={ClipboardText}
                    title="Match your work to district needs."
                    description="These choices power search, profile chips, and the first filtering pass for hiring teams."
                />
                <MultiSelectGroup
                    label="Areas of need"
                    values={TAXONOMY.areasOfNeed}
                    selected={props.areasOfNeed}
                    onChange={props.onAreasOfNeedChange}
                />
                <MultiSelectGroup
                    label="Grade bands"
                    values={TAXONOMY.gradeLevelBands.filter((grade) => grade.id !== "other")}
                    selected={props.gradeLevelBands}
                    onChange={props.onGradeLevelBandsChange}
                />
            </div>
        );
    }

    if (props.step === 2) {
        return (
            <div className="space-y-7">
                <SectionIntro
                    icon={SealCheck}
                    title="Set availability, coverage, and rate."
                    description="Transparent availability and pricing reduce back-and-forth for district teams."
                />
                <MultiSelectGroup
                    label="Engagement types"
                    values={TAXONOMY.engagementTypes}
                    selected={props.engagementTypes}
                    onChange={props.onEngagementTypesChange}
                />
                <MultiSelectGroup
                    label="Coverage areas"
                    values={TAXONOMY.coverageRegions}
                    selected={props.coverageRegions}
                    onChange={props.onCoverageRegionsChange}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Request status">
                        <select
                            value={props.availabilityStatus}
                            onChange={(e) => props.onAvailabilityStatusChange(e.target.value as typeof props.availabilityStatus)}
                            className="field-control"
                        >
                            {EDUCATOR_AVAILABILITY_OPTIONS.map((option) => (
                                <option key={option.id} value={option.id}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Starting hourly rate">
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--text-tertiary)]">$</span>
                            <input
                                type="number"
                                min={20}
                                value={props.hourlyRate}
                                onChange={(e) => props.onHourlyRateChange(e.target.value)}
                                placeholder="95"
                                className="field-control pl-8"
                            />
                        </div>
                    </Field>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <SectionIntro
                icon={CheckCircle}
                title="Review your launch profile."
                description="This is enough to create a credible profile and keep polishing from educator settings."
            />
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-5">
                <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                        <p className="text-sm font-bold text-[var(--text-primary)]">Profile strength</p>
                        <p className="text-sm text-[var(--text-secondary)]">Based on the setup details districts see first.</p>
                    </div>
                    <span className="font-heading text-3xl font-bold text-[var(--accent-primary)]">{props.completion}%</span>
                </div>
                <div className="h-2 rounded-full bg-white border border-[var(--border-subtle)] overflow-hidden">
                    <div className="h-full bg-[var(--accent-primary)]" style={{ width: `${props.completion}%` }} />
                </div>
            </div>
            <SummaryGrid
                items={[
                    ["Headline", props.headline],
                    ["Experience", `${Number(props.yearsExperience) || 0} years`],
                    ["Areas", props.areasOfNeed.length ? `${props.areasOfNeed.length} selected` : "None selected"],
                    ["Grades", props.gradeLevelBands.length ? `${props.gradeLevelBands.length} selected` : "None selected"],
                    ["Coverage", props.coverageRegions.length ? `${props.coverageRegions.length} selected` : "None selected"],
                    ["Rate", props.hourlyRate ? `$${props.hourlyRate}/hr` : "Not set"],
                ]}
            />
        </div>
    );
}

function OnboardingAside({
    intent,
    completion,
    districtAction,
}: {
    intent: AuthIntent;
    completion: number;
    districtAction: DistrictFirstAction;
}) {
    const districtDestination = DISTRICT_FIRST_ACTIONS.find((option) => option.id === districtAction)?.label ?? "Open workspace";
    const items =
        intent === "educator"
            ? ["Public profile created", "Expertise filters ready", "Rate visible to districts", "Credentials can be added next"]
            : ["Account role assigned", "District profile created", "Region defaults saved", `Next: ${districtDestination}`];

    return (
        <aside className="space-y-4">
            <div className="rounded-lg border border-[var(--border-default)] bg-white p-6 shadow-[var(--shadow-subtle)]">
                <p className="eyebrow mb-3">Setup outcome</p>
                <h2 className="font-heading text-xl font-bold text-[var(--text-primary)] mb-4">
                    {intent === "educator" ? `${completion}% profile baseline` : "District-ready defaults"}
                </h2>
                <div className="space-y-3">
                    {items.map((item) => (
                        <div key={item} className="flex items-start gap-3 text-sm font-semibold text-[var(--text-secondary)]">
                            <CheckCircle weight="fill" className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-primary)]" />
                            <span>{item}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="rounded-lg border border-[var(--border-default)] bg-[#17352D] p-6 text-white shadow-[var(--shadow-soft)]">
                <UsersThree weight="duotone" className="h-9 w-9 text-[var(--accent-secondary)] mb-4" />
                <h2 className="font-heading text-lg font-bold mb-2">Built for school decision cycles</h2>
                <p className="text-sm leading-6 text-white/75">
                    The setup favors clear roles, real district identity, visible educator qualifications, and practical next steps over generic marketplace signup.
                </p>
            </div>
        </aside>
    );
}

function StepRail({ steps, currentStep }: { steps: string[]; currentStep: number }) {
    return (
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
            {steps.map((label, index) => {
                const done = index < currentStep;
                const active = index === currentStep;
                return (
                    <div key={label} className="min-w-0">
                        <div
                            className={cn(
                                "h-1.5 rounded-full mb-2",
                                done || active ? "bg-[var(--accent-primary)]" : "bg-[var(--border-subtle)]"
                            )}
                        />
                        <p className={cn("truncate text-xs font-bold", active ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]")}>
                            {label}
                        </p>
                    </div>
                );
            })}
        </div>
    );
}

function SectionIntro({
    icon: Icon,
    title,
    description,
}: {
    icon: React.ComponentType<{ className?: string; weight?: "duotone" | "fill" | "bold" | "regular" }>;
    title: string;
    description: string;
}) {
    return (
        <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center text-[var(--accent-primary)] shrink-0">
                <Icon weight="duotone" className="h-6 w-6" />
            </div>
            <div>
                <h2 className="font-heading text-2xl font-bold text-[var(--text-primary)]">{title}</h2>
                <p className="mt-2 text-sm md:text-base font-medium leading-6 text-[var(--text-secondary)]">{description}</p>
            </div>
        </div>
    );
}

function OptionCard({
    selected,
    title,
    description,
    onClick,
}: {
    selected: boolean;
    title: string;
    description: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "text-left rounded-lg border p-5 transition-all min-h-44",
                selected
                    ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/5 shadow-[var(--shadow-subtle)]"
                    : "border-[var(--border-subtle)] bg-white hover:border-[var(--accent-primary)]/40 hover:shadow-[var(--shadow-subtle)]"
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <h3 className="font-heading text-lg font-bold text-[var(--text-primary)]">{title}</h3>
                <span
                    className={cn(
                        "h-5 w-5 rounded-full border flex items-center justify-center shrink-0",
                        selected ? "border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white" : "border-[var(--border-strong)]"
                    )}
                >
                    {selected && <CheckCircle weight="fill" className="h-4 w-4" />}
                </span>
            </div>
            <p className="mt-3 text-sm font-medium leading-6 text-[var(--text-secondary)]">{description}</p>
        </button>
    );
}

function Field({
    label,
    hint,
    className,
    children,
}: {
    label: string;
    hint?: string;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <label className={cn("flex flex-col gap-2", className)}>
            <span className="flex items-center justify-between gap-3 text-sm font-bold text-[var(--text-primary)]">
                {label}
                {hint && <span className="text-xs font-semibold text-[var(--text-tertiary)]">{hint}</span>}
            </span>
            {children}
        </label>
    );
}

function MultiSelectGroup({
    label,
    values,
    selected,
    onChange,
}: {
    label: string;
    values: ReadonlyArray<{ id: string; label: string }>;
    selected: string[];
    onChange: (value: string[]) => void;
}) {
    function toggle(id: string) {
        onChange(selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id]);
    }

    return (
        <div className="space-y-3">
            <p className="text-sm font-bold text-[var(--text-primary)]">{label}</p>
            <div className="flex flex-wrap gap-2">
                {values.map((item) => {
                    const active = selected.includes(item.id);
                    return (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => toggle(item.id)}
                            className={cn(
                                "min-h-10 rounded-lg border px-3 py-2 text-sm font-bold transition-colors",
                                active
                                    ? "border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white"
                                    : "border-[var(--border-subtle)] bg-white text-[var(--text-secondary)] hover:border-[var(--accent-primary)]/40"
                            )}
                        >
                            {item.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function SummaryGrid({ items }: { items: Array<[string, string]> }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {items.map(([label, value]) => (
                <div key={label} className="rounded-lg border border-[var(--border-subtle)] bg-white p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)]">{label}</p>
                    <p className="mt-1 text-sm font-bold text-[var(--text-primary)]">{value}</p>
                </div>
            ))}
        </div>
    );
}
