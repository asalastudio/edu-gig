"use client";

import {useOwnedFormState, clearOwnedOnboarding} from "@/lib/use-owned-form-state";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAuth, useUser } from "@clerk/nextjs";
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
    clearAuthIntent,
    dashboardPathForIntent,
    intentFromRole,
    isAuthIntent,
    recallAuthIntent,
    rememberAuthIntent,
    safeInternalPath,
    type AuthIntent,
} from "@/lib/auth-intent";
import {
    DEFAULT_ENGAGEMENT_TYPES,
    DISTRICT_FIRST_ACTIONS,
    DISTRICT_ROLE_OPTIONS,
    EDUCATOR_AVAILABILITY_OPTIONS,
    defaultDestinationForIntent,
    destinationForFirstAction,
    educatorProfileCompletionScore,
    formatEducatorRateSummary,
    roleForDistrictOnboarding,
    type DistrictFirstAction,
    type DistrictOnboardingRole,
} from "@/lib/onboarding";
import { RegionCoverageLink } from "@/components/shared/region-coverage-link";
import { TAXONOMY, getAreaOfNeedLabel } from "@/lib/taxonomy";
import { PRIVACY_VERSION, TERMS_VERSION } from "@/lib/legal";
import { US_STATES } from "@/lib/us-states";
import { cn } from "@/lib/utils";
import { privateFileMime, uploadPrivateFile } from "@/lib/private-upload";

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
    const {user,isLoaded}=useUser();
    if(!isLoaded) return <div role="status">Checking your session…</div>;
    return <OnboardingAccount key={user?.id ?? "anonymous"} />;
}
function OnboardingAccount() {
    const { user, isLoaded } = useUser();
    const { getToken } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const intentParam = searchParams.get(AUTH_INTENT_PARAM);
    const urlIntent: AuthIntent | null = isAuthIntent(intentParam) ? intentParam : null;
    // Clerk's redirect can strip the ?intent= param before we land here (Google
    // OAuth, static after-sign-in URL). Recover the role the user already picked
    // so we never ask district-vs-educator a second time.
    const [recalledIntent, setRecalledIntent] = useState<AuthIntent | null>(null);
    const intent: AuthIntent | null = urlIntent ?? recalledIntent;
    const safeNext = safeInternalPath(searchParams.get(AUTH_NEXT_PARAM));

    const viewer = useQuery(api.users.viewer);
    const completeOnboarding = useMutation(api.users.completeOnboarding);
    const requestUpload = useMutation(api.privateFiles.requestUpload);
    const setResume = useMutation(api.educators.setResume);

    const [step, setStep] = useOwnedFormState<number>(user?.id ?? null,"step",0);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [acceptedLegal, setAcceptedLegal] = useState(false);
    const [intentResolved, setIntentResolved] = useState(false);

    const [districtRole, setDistrictRole] = useOwnedFormState<DistrictOnboardingRole>(user?.id ?? null,"districtRole","superintendent");
    const [organizationName, setOrganizationName] = useOwnedFormState<string>(user?.id ?? null,"organizationName","");
    const [districtState, setDistrictState] = useOwnedFormState<string>(user?.id ?? null,"districtState","");
    const [districtRegion, setDistrictRegion] = useOwnedFormState<string>(user?.id ?? null,"districtRegion","");
    const [districtNceaId, setDistrictNceaId] = useOwnedFormState<string>(user?.id ?? null,"districtNceaId","");
    const [districtAction, setDistrictAction] = useOwnedFormState<DistrictFirstAction>(user?.id ?? null,"districtAction","post_need");

    const [firstName, setFirstName] = useOwnedFormState<string>(user?.id ?? null,"firstName",user?.firstName?.trim() ?? "");
    const [lastName, setLastName] = useOwnedFormState<string>(user?.id ?? null,"lastName",user?.lastName?.trim() ?? "");
    const [businessName, setBusinessName] = useOwnedFormState<string>(user?.id ?? null,"businessName","");
    const [headline, setHeadline] = useOwnedFormState<string>(user?.id ?? null,"headline","");
    const [bio, setBio] = useOwnedFormState<string>(user?.id ?? null,"bio","");
    const [engagementTypes, setEngagementTypes] = useOwnedFormState<string[]>(user?.id ?? null,"engagementTypes",[...DEFAULT_ENGAGEMENT_TYPES]);
    const [yearsExperience, setYearsExperience] = useOwnedFormState<string>(user?.id ?? null,"yearsExperience","");
    const [hourlyAmount, setHourlyAmount] = useOwnedFormState<string>(user?.id ?? null,"hourlyAmount","");
    const [dailyAmount,setDailyAmount]=useOwnedFormState<string>(user?.id ?? null,"dailyAmount","");
    const [availabilityStatus, setAvailabilityStatus] = useOwnedFormState<"open" | "limited" | "closed">(user?.id ?? null,"availabilityStatus","open");
    const [gradeLevelBands, setGradeLevelBands] = useOwnedFormState<string[]>(user?.id ?? null,"gradeLevelBands",[]);
    const [subCategories,setSubCategories]=useOwnedFormState<string[]>(user?.id ?? null,"subCategories",[]);
    const [areasOfNeed, setAreasOfNeed] = useOwnedFormState<string[]>(user?.id ?? null,"areasOfNeed",[]);
    const [coverageRegions, setCoverageRegions] = useOwnedFormState<string[]>(user?.id ?? null,"coverageRegions",[]);
    const [profileType, setProfileType] = useOwnedFormState<"individual" | "firm">(user?.id ?? null,"profileType","individual");
    const [resumeFile, setResumeFile] = useState<{ value: File; requestId: string } | null>(null);
    const [resumeBusy, setResumeBusy] = useState(false);
    const [profileCreated, setProfileCreated] = useState(false);
    const suppressOnboardedRedirect = useRef(false);
    const active=useRef(true);
    useEffect(()=>{active.current=true;return ()=>{active.current=false;};},[]);

    const hourlyRate = hourlyAmount ? Number(hourlyAmount) : undefined;
    const dailyRate = dailyAmount ? Number(dailyAmount) : undefined;

    const isEducator = intent === "educator";
    const steps = isEducator ? EDUCATOR_STEPS : DISTRICT_STEPS;
    const finalStep = steps.length - 1;
    // Email/password sign-ups don't collect a name; avoid "Welcome, there."
    const clerkFirstName = user?.firstName?.trim() || "";
    const welcome = clerkFirstName ? `Welcome, ${clerkFirstName}.` : "Welcome.";

    const educatorCompletion = useMemo(
        () =>
            educatorProfileCompletionScore({
                headline,
                bio,
                yearsExperience: Number(yearsExperience) || 0,
                hourlyRate,
                dailyRate,
                gradeLevelBands,
                areasOfNeed,
                coverageRegions,
            }),
        [areasOfNeed, bio, coverageRegions, dailyRate, gradeLevelBands, headline, hourlyRate, yearsExperience]
    );

    useEffect(() => {
        if (!isLoaded) return;
        if (!user) {
            router.replace("/sign-in");
            return;
        }
        if (viewer === undefined) return;
        if (viewer?.onboarded && !suppressOnboardedRedirect.current) {
            router.replace(safeNext ?? dashboardPathForIntent(intentFromRole(viewer.role)));
        }
    }, [isLoaded, user, viewer, router, safeNext]);

    // If the URL carries the intent, persist it; otherwise recover the role the
    // user picked before Clerk auth so we skip the redundant role question.
    useEffect(() => {
        if (urlIntent) {
            rememberAuthIntent(urlIntent);
            setRecalledIntent(urlIntent);
        } else {
            setRecalledIntent(recallAuthIntent());
        }
        setIntentResolved(true);
    }, [urlIntent]);

    const previousIntent=useRef(intent);
    useEffect(() => {
        if(previousIntent.current===intent) return;
        previousIntent.current=intent;
        setStep(0);
        setError(null);
        setAcceptedLegal(false);
    }, [intent,setStep]);

    function validateStep(targetStep = step) {
        if (!intent) return null;
        if (intent === "district") {
            if (targetStep === 1) {
                if (organizationName.trim().length < 2) return "Enter the district, school, or organization name.";
                if (districtState.trim().length < 2) return "Choose the state for this district account.";
        if (!districtRegion) return "Choose the region this account should start with.";
            }
            return null;
        }

        if (targetStep === 0) {
            if(yearsExperience === "" || !Number.isFinite(Number(yearsExperience)) || Number(yearsExperience)<0) return "Enter your years in education, including zero if applicable.";
            if (firstName.trim().length === 0) return "Add your first name.";
            if (headline.trim().length < 12) return "Add a professional headline with at least a little context.";
            if (bio.trim().length < 40) return "Add a short bio so districts know what outcomes you support.";
        }
        if (targetStep === 1) {
            if (areasOfNeed.length === 0) return "Choose at least one support type.";
            if (gradeLevelBands.length === 0) return "Choose at least one grade band.";
            if (engagementTypes.length === 0) return "Choose at least one engagement type.";
        }
        if (targetStep === 2) {
            if (coverageRegions.length === 0) return "Choose at least one coverage area.";
            if(!hourlyAmount && !dailyAmount) return "Add an hourly or daily rate.";
            if(hourlyAmount && (!Number.isFinite(hourlyRate) || hourlyRate! < 20)) return "Hourly rates should be $20 or more.";
            if(dailyAmount && (!Number.isFinite(dailyRate) || dailyRate! < 100)) return "Daily rates should be $100 or more.";
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
            suppressOnboardedRedirect.current = intent === "educator" && !!resumeFile;
            await completeOnboarding({
                role: intent === "educator" ? "educator" : roleForDistrictOnboarding(districtRole),
                firstName: intent === "educator" ? firstName.trim() : undefined,
                lastName: intent === "educator" ? lastName.trim() : undefined,
                businessName: intent === "educator" ? businessName.trim() || undefined : undefined,
                organizationName: intent === "district" ? organizationName.trim() : undefined,
                districtState: intent === "district" ? districtState.trim().toUpperCase() : undefined,
                districtRegion: intent === "district" ? districtRegion : undefined,
                state: intent === "district" ? districtState.trim().toUpperCase() : undefined,
                region: intent === "district" ? districtRegion : undefined,
                districtNceaId: intent === "district" ? districtNceaId.trim() || undefined : undefined,
                headline: intent === "educator" ? headline.trim() : undefined,
                bio: intent === "educator" ? bio.trim() : undefined,
                yearsExperience: intent === "educator" ? Number(yearsExperience) || 0 : undefined,
                hourlyRate: intent === "educator" ? hourlyRate : undefined,
                dailyRate: intent === "educator" ? dailyRate : undefined,
                gradeLevelBands: intent === "educator" ? gradeLevelBands : undefined,
                areasOfNeed: intent === "educator" ? areasOfNeed : undefined,
                subCategories: intent === "educator" ? subCategories : undefined,
                engagementTypes: intent === "educator" ? (engagementTypes.length ? engagementTypes : [...DEFAULT_ENGAGEMENT_TYPES]) : undefined,
                coverageRegions: intent === "educator" ? coverageRegions : undefined,
                availabilityStatus: intent === "educator" ? availabilityStatus : undefined,
                profileType: intent === "educator" ? profileType : undefined,
                termsVersion: TERMS_VERSION,
                privacyVersion: PRIVACY_VERSION,
            });
            if(!active.current) return;
            const destination =
                intent === "district"
                    ? destinationForFirstAction(districtAction, safeNext)
                    : safeNext ?? defaultDestinationForIntent(intent);
            setProfileCreated(true);
            if (intent === "educator" && resumeFile) {
                await attachResumeAndContinue(destination);
            } else {
                if(user) clearOwnedOnboarding(user.id);
                clearAuthIntent();
                router.replace(destination);
            }
        } catch {
            if(!active.current) return;
            if (!profileCreated) {
                suppressOnboardedRedirect.current = false;
                setError("Could not save your setup. If you just enabled Clerk, confirm Convex is using the same Clerk issuer and try again.");
            }
        } finally {
            setSubmitting(false);
        }
    }

    async function attachResumeAndContinue(destination = safeNext ?? defaultDestinationForIntent("educator")) {
        if (!resumeFile) return;
        setResumeBusy(true);
        setError(null);
        try {
            const ticket = await requestUpload({
                purpose: "resume",
                fileName: resumeFile.value.name,
                mimeType: privateFileMime(resumeFile.value),
                size: resumeFile.value.size,
                requestId: resumeFile.requestId,
            });
            if(!active.current) return;
            const token = await getToken({ template: "convex" });
            if(!active.current) return;
            if (!token) throw new Error("Your session expired. Sign in again, then retry.");
            const receipt = await uploadPrivateFile({ file: resumeFile.value, ticketId: ticket.ticketId, token });
            if(!active.current) return;
            await setResume({ privateFileId: receipt.privateFileId, fileName: resumeFile.value.name });
            if(!active.current) return;
            setResumeFile(null);
            suppressOnboardedRedirect.current = false;
            if(user) clearOwnedOnboarding(user.id);
            clearAuthIntent();
            router.replace(destination);
        } catch (err) {
            setProfileCreated(true);
            setError(`Your profile was saved, but the resume was not attached. ${err instanceof Error ? err.message : "Please retry."}`);
        } finally {
            setResumeBusy(false);
        }
    }

    function continueWithoutResume() {
        suppressOnboardedRedirect.current = false;
        if(user) clearOwnedOnboarding(user.id);
        clearAuthIntent();
        router.replace(safeNext ?? defaultDestinationForIntent("educator"));
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

    if (!user || (viewer?.onboarded && !(profileCreated && resumeFile))) {
        return null;
    }

    if (profileCreated && resumeFile) {
        return (
            <div className="min-h-screen bg-[var(--bg-app)] flex flex-col">
                <SiteHeader />
                <main className="flex-1 mx-auto flex w-full max-w-xl items-center px-6 py-16">
                    <div className="w-full rounded-xl border border-[var(--border-subtle)] bg-white p-6 sm:p-8">
                        <h1 className="font-heading text-2xl font-bold">Your profile is ready</h1>
                        <p className="mt-2 text-sm text-[var(--text-secondary)]">The selected resume is still on this page and has not been attached yet.</p>
                        <p className="mt-4 break-all text-sm font-semibold">{resumeFile.value.name}</p>
                        {resumeBusy && <p role="status" aria-live="polite" className="mt-3 text-sm">Uploading resume…</p>}
                        {error && <p role="alert" className="mt-3 text-sm font-semibold text-red-700">{error}</p>}
                        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                            <PrimaryButton type="button" disabled={resumeBusy} onClick={() => void attachResumeAndContinue()}>Retry resume upload</PrimaryButton>
                            <button type="button" disabled={resumeBusy} onClick={continueWithoutResume} className="rounded-lg border border-[var(--border-strong)] px-4 py-2.5 text-sm font-bold">Continue to profile without resume</button>
                        </div>
                    </div>
                </main>
                <SiteFooter />
            </div>
        );
    }

    if (!intentResolved) {
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

    if (!intent) {
        return <RoleChoice welcome={welcome} />;
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
                                    ? `${welcome} Build a profile districts can trust.`
                                    : `${welcome} Prepare your district hiring flow.`}
                            </h1>
                            <p className="mt-3 max-w-2xl text-base md:text-lg font-medium text-[var(--text-secondary)]">
                                {isEducator
                                    ? "Start with the details a superintendent, HR leader, or principal needs before they reach out."
                                    : "Set your role, organization, and first action so K12Gig starts in the hiring flow from the first visit."}
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
                                    firstName={firstName}
                                    onFirstNameChange={setFirstName}
                                    lastName={lastName}
                                    onLastNameChange={setLastName}
                                    businessName={businessName}
                                    onBusinessNameChange={setBusinessName}
                                    headline={headline}
                                    onHeadlineChange={setHeadline}
                                    bio={bio}
                                    onBioChange={setBio}
                                    engagementTypes={engagementTypes}
                                    onEngagementTypesChange={setEngagementTypes}
                                    yearsExperience={yearsExperience}
                                    onYearsExperienceChange={setYearsExperience}
                                    hourlyAmount={hourlyAmount} onHourlyAmountChange={setHourlyAmount}
                                    dailyAmount={dailyAmount} onDailyAmountChange={setDailyAmount}
                                    availabilityStatus={availabilityStatus}
                                    onAvailabilityStatusChange={setAvailabilityStatus}
                                    gradeLevelBands={gradeLevelBands}
                                    onGradeLevelBandsChange={setGradeLevelBands}
                                    subCategories={subCategories} onSubCategoriesChange={setSubCategories}
                                    areasOfNeed={areasOfNeed}
                                    onAreasOfNeedChange={setAreasOfNeed}
                                    coverageRegions={coverageRegions}
                                    onCoverageRegionsChange={setCoverageRegions}
                                    profileType={profileType}
                                    onProfileTypeChange={setProfileType}
                                    completion={educatorCompletion}
                                />
                            )}

                            {error && (
                                <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                                    {error}
                                </div>
                            )}

                            {step === finalStep && intent === "educator" && (
                                <div className="mt-6 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-5">
                                    <p className="text-sm font-bold text-[var(--text-primary)]">Resume / CV</p>
                                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                                        Districts require a resume on proposals. You can upload one now or later in settings.
                                    </p>
                                    {resumeFile ? (
                                        <p className="mt-3 break-all text-sm font-semibold text-[var(--text-primary)]">{resumeFile.value.name}</p>
                                    ) : null}
                                    <label className="mt-3 inline-flex cursor-pointer items-center rounded-lg border border-[var(--border-strong)] px-4 py-2 text-sm font-bold">
                                        {resumeFile ? "Replace selected file" : "Choose resume"}
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept=".pdf,.doc,.docx"
                                            disabled={submitting}
                                            onChange={(event) => {
                                                const file = event.target.files?.[0];
                                                event.target.value = "";
                                                if (!file) return;
                                                setError(null);
                                                if (file.size > 10 * 1024 * 1024) return setError("Keep the resume under 10 MB.");
                                                if (!/\.(pdf|doc|docx)$/i.test(file.name)) return setError("Choose a PDF, DOC, or DOCX resume.");
                                                setResumeFile({ value: file, requestId: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}` });
                                            }}
                                        />
                                    </label>
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

function RoleChoice({ welcome }: { welcome: string }) {
    return (
        <div className="min-h-screen bg-[var(--bg-app)] flex flex-col">
            <SiteHeader />
            <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-14">
                <div className="text-center max-w-2xl mx-auto">
                    <div className="education-rule mx-auto mb-5" />
                    <p className="eyebrow mb-3">Choose your account path</p>
                    <h1 className="font-heading text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-3">
                        {welcome} Where should we start?
                    </h1>
                    <p className="text-lg font-medium text-[var(--text-secondary)]">
                        K12Gig separates district hiring tools from educator profile tools so each account path starts with the right defaults.
                    </p>
                </div>
                <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Link
                        href={`/onboarding?${AUTH_INTENT_PARAM}=district`}
                        className="group rounded-lg border border-[var(--border-default)] bg-white p-7 shadow-[var(--shadow-subtle)] hover:border-[var(--accent-primary)]/40 hover:shadow-[var(--shadow-soft)] transition-all"
                    >
                        <Buildings weight="duotone" className="h-11 w-11 text-[var(--accent-primary)] mb-5" />
                        <h2 className="font-heading text-2xl font-bold text-[var(--text-primary)] mb-2">I represent a school or district</h2>
                        <p className="text-sm font-medium leading-6 text-[var(--text-secondary)]">
                            For superintendents, HR teams, principals, and school leaders posting needs or comparing educators.
                        </p>
                        <span className="mt-6 inline-flex text-sm font-bold text-[var(--accent-primary)] group-hover:underline">
                            Set up district account
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
                    title="What's your district role?"
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
                            placeholder="Ann Arbor Public Schools"
                            autoFocus
                            className="field-control"
                        />
                    </Field>
                    <Field label="State">
                        <select value={props.state} onChange={(e) => props.onStateChange(e.target.value)} className="field-control">
                            <option value="">Choose a state</option>
                            {US_STATES.map((state) => (
                                <option key={state.code} value={state.code}>
                                    {state.name}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <div className="flex flex-col gap-2">
                        <Field label="Location by region">
                            <select value={props.region} onChange={(e) => props.onRegionChange(e.target.value)} className="field-control">
                                <option value="">Choose a service region</option>
                                {TAXONOMY.coverageRegions.map((region) => (
                                    <option key={region.id} value={region.id}>
                                        {region.label}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <RegionCoverageLink />
                    </div>
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
    firstName: string;
    onFirstNameChange: (value: string) => void;
    lastName: string;
    onLastNameChange: (value: string) => void;
    businessName: string;
    onBusinessNameChange: (value: string) => void;
    headline: string;
    onHeadlineChange: (value: string) => void;
    bio: string;
    onBioChange: (value: string) => void;
    engagementTypes: string[];
    onEngagementTypesChange: (value: string[]) => void;
    yearsExperience: string;
    onYearsExperienceChange: (value: string) => void;
    hourlyAmount: string; onHourlyAmountChange:(value:string)=>void;
    dailyAmount: string; onDailyAmountChange:(value:string)=>void;
    availabilityStatus: "open" | "limited" | "closed";
    onAvailabilityStatusChange: (value: "open" | "limited" | "closed") => void;
    gradeLevelBands: string[];
    onGradeLevelBandsChange: (value: string[]) => void;
    subCategories: string[];onSubCategoriesChange:(value:string[])=>void;
    areasOfNeed: string[];
    onAreasOfNeedChange: (value: string[]) => void;
    coverageRegions: string[];
    onCoverageRegionsChange: (value: string[]) => void;
    profileType: "individual" | "firm";
    onProfileTypeChange: (value: "individual" | "firm") => void;
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="First name">
                        <input
                            value={props.firstName}
                            onChange={(e) => props.onFirstNameChange(e.target.value)}
                            placeholder="Example: Jordan"
                            autoFocus
                            className="field-control"
                        />
                    </Field>
                    <Field label="Last name" hint="Optional">
                        <input
                            value={props.lastName}
                            onChange={(e) => props.onLastNameChange(e.target.value)}
                            placeholder="Example: Lee"
                            className="field-control"
                        />
                    </Field>
                    <Field label="Business / organization name" hint="Optional" className="md:col-span-2">
                        <input
                            value={props.businessName}
                            onChange={(e) => props.onBusinessNameChange(e.target.value)}
                            placeholder="Example: SparkSum Learning"
                            className="field-control"
                        />
                        <span className="text-xs font-semibold text-[var(--text-tertiary)]">
                            Shown as your public profile name — e.g. SparkSum Learning.
                        </span>
                    </Field>
                    <Field label="Profile type" className="md:col-span-2">
                        <div className="flex flex-wrap gap-3">
                            {(["individual", "firm"] as const).map((type) => (
                                <label key={type} className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-white px-4 py-2 text-sm font-semibold">
                                    <input
                                        type="radio"
                                        name="profileType"
                                        checked={props.profileType === type}
                                        onChange={() => props.onProfileTypeChange(type)}
                                    />
                                    {type === "individual" ? "Individual consultant" : "Consulting firm"}
                                </label>
                            ))}
                        </div>
                    </Field>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_180px] gap-4">
                    <Field label="Professional headline">
                        <input
                            value={props.headline}
                            onChange={(e) => props.onHeadlineChange(e.target.value)}
                            placeholder="Example: Math interventionist and instructional coach"
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
                            placeholder="Example: I help campuses strengthen Tier 2 math intervention, coach teachers through data cycles, and support implementation with practical classroom routines."
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
                    label="Support types"
                    values={TAXONOMY.areasOfNeed}
                    selected={props.areasOfNeed}
                    onChange={props.onAreasOfNeedChange}
                />
                <MultiSelectGroup label="Specializations" values={TAXONOMY.areasOfNeed.filter(a=>props.areasOfNeed.includes(a.id)).flatMap(a=>a.subCategories.map(s=>({id:s.id,label:s.label})))} selected={props.subCategories} onChange={props.onSubCategoriesChange} />
                <MultiSelectGroup
                    label="Grade bands"
                    values={TAXONOMY.gradeLevelBands.filter((grade) => grade.id !== "other")}
                    selected={props.gradeLevelBands}
                    onChange={props.onGradeLevelBandsChange}
                />
                <p className="text-sm">New profiles offer freelance consulting. Describe your services and specializations in your profile.</p>
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
                <div className="space-y-2">
                    <MultiSelectGroup
                        label="Coverage areas"
                        values={TAXONOMY.coverageRegions}
                        selected={props.coverageRegions}
                        onChange={props.onCoverageRegionsChange}
                    />
                    <RegionCoverageLink />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Availability">
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
                    <Field label="Hourly rate (USD per hour)"><input type="number" min={20} value={props.hourlyAmount} onChange={e=>props.onHourlyAmountChange(e.target.value)} placeholder="Example: 95" className="field-control" /></Field>
                    <Field label="Daily rate (USD per day)"><input type="number" min={100} value={props.dailyAmount} onChange={e=>props.onDailyAmountChange(e.target.value)} placeholder="Example: 650" className="field-control" /></Field>
                    <p className="text-sm text-[var(--text-secondary)]">Enter one or both rates. Each amount is independent; final scope and payment are agreed directly.</p>
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
                    ...(props.businessName.trim() ? [["Business", props.businessName.trim()] as [string, string]] : []),
                    ["Headline", props.headline],
                    ["Experience", `${Number(props.yearsExperience) || 0} years`],
                    ["Areas", props.areasOfNeed.length ? `${props.areasOfNeed.length} selected` : "None selected"],
                    ["Specializations", props.subCategories.map(getAreaOfNeedLabel).join(", ") || "None selected"],
                    ["Grades", props.gradeLevelBands.length ? `${props.gradeLevelBands.length} selected` : "None selected"],
                    [
                        "Engagement types",
                        props.engagementTypes
                            .map((id) => TAXONOMY.engagementTypes.find((type) => type.id === id)?.label ?? id)
                            .join(", ") || "None selected",
                    ],
                    ["Coverage", props.coverageRegions.length ? `${props.coverageRegions.length} selected` : "None selected"],
                    [
                        "Rate",
                        formatEducatorRateSummary({
                            hourlyRate: props.hourlyAmount ? Number(props.hourlyAmount) : undefined,
                            dailyRate: props.dailyAmount ? Number(props.dailyAmount) : undefined,
                        }),
                    ],
                ]}
            />
            <p className="text-sm font-medium text-[var(--text-tertiary)]">
                You can add your business logo from Educator settings after setup.
            </p>
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
    const districtDestination = DISTRICT_FIRST_ACTIONS.find((option) => option.id === districtAction)?.label ?? "Review my district dashboard";
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
                            aria-pressed={active}
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
