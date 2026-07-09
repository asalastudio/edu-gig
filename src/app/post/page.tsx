"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { PrimaryButton } from "@/components/shared/button";
import { TAXONOMY } from "@/lib/taxonomy";
import { isDistrictRole } from "@/lib/roles";
import { AUTH_INTENT_PARAM } from "@/lib/auth-intent";
import {
    getNeedPublishIssues,
    normalizeNeedInput,
    type NeedInput,
    type NeedPublishField,
} from "@/lib/need-publish-policy";
import { ArrowLeft, CheckCircle, CaretRight, Briefcase, Calendar, FileText } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function PostNeedPage() {
    return (
        <Suspense fallback={null}>
            <PostNeedPageInner />
        </Suspense>
    );
}

function PostNeedPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [step, setStep] = useState(1);
    const [isSuccess, setIsSuccess] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [draftNotice, setDraftNotice] = useState<string | null>(null);
    const [previewMode, setPreviewMode] = useState(false);
    const requestedDraftId = searchParams.get("draft");
    const [draftId, setDraftId] = useState<string | null>(requestedDraftId);
    const [hydratedDraftId, setHydratedDraftId] = useState<string | null>(null);

    // Form state
    // null = untouched; the district profile name is used until the user edits.
    const [orgNameInput, setOrgNameInput] = useState<string | null>(null);
    const [areaId, setAreaId] = useState("");
    const [specId, setSpecId] = useState("");
    const [gradeLevel, setGradeLevel] = useState("");
    // Freelance consulting is the only launch-supported engagement type
    // (PRD v3 Issue #6), so it is fixed rather than chosen in the form.
    const [engagementType] = useState("consulting");
    const todayISO = new Date().toISOString().slice(0, 10);
    const [startDate, setStartDate] = useState("");
    const [duration, setDuration] = useState("");
    const [compensationRange, setCompensationRange] = useState("");
    const [description, setDescription] = useState("");

    // Errors
    const [errors, setErrors] = useState<Partial<Record<NeedPublishField, string>>>({});

    const viewer = useQuery(api.users.viewer, hasClerk ? {} : "skip");
    const canPersist = !!viewer && isDistrictRole(viewer.role);
    const district = useQuery(api.districts.getMine, canPersist ? {} : "skip");
    const saveNeedDraft = useMutation(api.needs.saveDraft);
    const publishNeedDraft = useMutation(api.needs.publishDraft);
    const existingDraft = useQuery(
        api.needs.getById,
        canPersist && requestedDraftId
            ? { needId: requestedDraftId as Id<"needs"> }
            : "skip"
    );
    const educatorName = searchParams.get("name");
    const requestedSlot = searchParams.get("slot");

    // Prefill the organization name from the district profile captured at
    // onboarding; anything the user types takes precedence.
    const orgName = orgNameInput ?? district?.name ?? "";

    useEffect(() => {
        if (!existingDraft || existingDraft._id === hydratedDraftId) return;
        if (existingDraft.status !== "draft") {
            setSubmitError("This need has already been published and can no longer be edited as a draft.");
            return;
        }
        setOrgNameInput(existingDraft.orgName);
        setAreaId(existingDraft.areaOfNeed);
        setSpecId(existingDraft.subCategory ?? "");
        setGradeLevel(existingDraft.gradeLevel ?? "");
        setStartDate(existingDraft.startDate ?? "");
        setDuration(existingDraft.duration ?? "");
        setCompensationRange(existingDraft.compensationRange ?? "");
        setDescription(existingDraft.description ?? "");
        setDraftId(existingDraft._id);
        setHydratedDraftId(existingDraft._id);
        setDraftNotice("Draft loaded. Continue where you left off.");
    }, [existingDraft, hydratedDraftId]);

    useEffect(() => {
        if (requestedDraftId && canPersist && existingDraft === null) {
            setSubmitError("Draft not found. Return to Posted Needs and choose an available draft.");
        }
    }, [requestedDraftId, canPersist, existingDraft]);

    const selectedAreaObj = TAXONOMY.areasOfNeed.find(a => a.id === areaId);
    const specs = selectedAreaObj?.subCategories || [];

    const handleNext = (e?: React.MouseEvent) => {
        e?.preventDefault();
        e?.stopPropagation();
        if (step === 1) {
            const newErrors: Partial<Record<NeedPublishField, string>> = {};
            if (!orgName.trim()) newErrors.orgName = "Organization name is required.";
            if (!areaId) newErrors.areaOfNeed = "Please select a support type.";

            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                return;
            }
        }
        setStep(prev => Math.min(prev + 1, 3));
    };

    const handleBack = (e?: React.MouseEvent) => {
        e?.preventDefault();
        setStep(prev => Math.max(prev - 1, 1));
    };

    const currentInput = (): NeedInput => ({
        orgName,
        areaOfNeed: areaId,
        subCategory: specId,
        gradeLevel,
        engagementType,
        startDate,
        duration,
        compensationRange,
        description,
    });

    const saveDraftProgress = async (input: NeedInput, notice: string) => {
        const normalized = normalizeNeedInput(input);
        const minimumErrors: Partial<Record<NeedPublishField, string>> = {};
        if (!normalized.orgName) {
            minimumErrors.orgName = "Organization name is required to save a draft.";
        }
        if (!normalized.areaOfNeed) {
            minimumErrors.areaOfNeed = "Support type is required to save a draft.";
        }
        if (Object.keys(minimumErrors).length > 0) {
            setErrors(minimumErrors);
            setStep(1);
            throw new Error("Add an organization name and support type before saving your draft.");
        }

        if (!canPersist) {
            window.localStorage.setItem("k12gig_post_need_draft", JSON.stringify(normalized));
            router.push(`/sign-up?${AUTH_INTENT_PARAM}=district&next=${encodeURIComponent("/post")}`);
            return null;
        }

        const savedId = await saveNeedDraft({
            needId: draftId ? (draftId as Id<"needs">) : undefined,
            ...normalized,
        });
        const savedIdString = savedId as unknown as string;
        setDraftId(savedIdString);
        setDraftNotice(notice);
        router.replace(`/post?draft=${encodeURIComponent(savedIdString)}`, { scroll: false });
        return savedId;
    };

    const handleSaveDraft = async () => {
        setSubmitError(null);
        setDraftNotice(null);
        setSubmitting(true);
        try {
            await saveDraftProgress(currentInput(), "Draft saved. You can keep editing or return later.");
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : "Could not save this draft.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);
        setDraftNotice(null);
        const input = currentInput();
        const publishIssues = getNeedPublishIssues(input);
        setErrors(
            Object.fromEntries(publishIssues.map((issue) => [issue.field, issue.message])) as Partial<
                Record<NeedPublishField, string>
            >
        );
        setSubmitting(true);
        try {
            const savedId = await saveDraftProgress(
                input,
                publishIssues.length > 0
                    ? "Draft saved. Complete the highlighted fields when you are ready to publish."
                    : "Draft saved. Publishing now…"
            );
            if (!savedId) return;
            if (publishIssues.length > 0) {
                setSubmitError(
                    `Draft saved instead of published. ${publishIssues.map((issue) => issue.message).join(" ")}`
                );
                return;
            }
            await publishNeedDraft({ needId: savedId });
        } catch (err) {
            console.error(err);
            setSubmitError(
                err instanceof Error
                    ? err.message
                    : "Could not save or publish this need. Please try again."
            );
            return;
        } finally {
            setSubmitting(false);
        }

        setIsSuccess(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const signedOut = !hasClerk || viewer === null;
    const wrongRole = !!viewer && !isDistrictRole(viewer.role);
    const sessionReady = !hasClerk || viewer !== undefined;

    return (
        <div className="min-h-screen bg-[var(--bg-app)] flex flex-col font-sans">
            <SiteHeader />
            
            <main className="flex-1 max-w-3xl mx-auto w-full px-6 lg:px-12 py-12">
                <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-8 w-fit">
                    <ArrowLeft className="w-4 h-4" /> Home
                </Link>

                {hasClerk && viewer === undefined && (
                    <div className="bg-white p-8 md:p-10 rounded-lg shadow-sm border border-[var(--border-subtle)] text-center">
                        <p className="text-[var(--text-secondary)] font-medium">Checking your session…</p>
                    </div>
                )}

                {signedOut && !previewMode && (
                    <div className="bg-white p-8 md:p-10 rounded-lg shadow-sm border border-[var(--border-subtle)]">
                        <h1 className="font-heading text-4xl font-bold text-[var(--text-primary)] mb-4">
                            Sign in to post a real need
                        </h1>
                        <p className="text-lg text-[var(--text-secondary)] mb-6">
                            K12Gig saves district requests to your workspace so educators can respond, message you, and move toward booking.
                            Sign in or create a district account before posting.
                        </p>
                        {(educatorName || requestedSlot) && (
                            <div className="mb-6 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4 text-sm font-medium text-[var(--text-secondary)]">
                                {educatorName && <p>Requesting: <span className="font-bold text-[var(--text-primary)]">{educatorName}</span></p>}
                                {requestedSlot && <p>Preferred window: <span className="font-bold text-[var(--text-primary)]">{requestedSlot}</span></p>}
                            </div>
                        )}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Link href={`/sign-in?${AUTH_INTENT_PARAM}=district&next=${encodeURIComponent("/post")}`}>
                                <PrimaryButton className="w-full sm:w-auto">Sign in to post</PrimaryButton>
                            </Link>
                            <Link href={`/sign-up?${AUTH_INTENT_PARAM}=district&next=${encodeURIComponent("/post")}`}>
                                <button className="w-full sm:w-auto px-6 py-3 rounded-lg border border-[var(--border-strong)] font-bold text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]">
                                    Create district account
                                </button>
                            </Link>
                            <button
                                type="button"
                                onClick={() => setPreviewMode(true)}
                                className="w-full sm:w-auto px-6 py-3 rounded-lg text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
                            >
                                Preview the form
                            </button>
                        </div>
                    </div>
                )}

                {wrongRole && (
                    <div className="bg-white p-8 md:p-10 rounded-lg shadow-sm border border-[var(--border-subtle)]">
                        <h1 className="font-heading text-3xl font-bold text-[var(--text-primary)] mb-3">Use a district account to post</h1>
                        <p className="text-[var(--text-secondary)] mb-6">
                            Educator accounts can browse open needs and manage gigs. Posting new district demand requires a district hiring workspace.
                        </p>
                        <Link href="/login">
                            <PrimaryButton>Choose another account</PrimaryButton>
                        </Link>
                    </div>
                )}

                {sessionReady && !wrongRole && (!signedOut || previewMode) && !isSuccess ? (
                    <div className="animate-in fade-in duration-500">
                        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                            <div>
                                <h1 className="font-heading text-4xl font-bold text-[var(--text-primary)] mb-2">Post a Need</h1>
                                <p className="text-lg text-[var(--text-secondary)]">
                                    {signedOut
                                        ? "Preview the request form. You’ll sign in before posting it for real."
                                        : "Tell us what your district is looking for."}
                                </p>
                            </div>
                            <span className="text-sm font-bold text-[var(--text-tertiary)] bg-[var(--bg-subtle)] px-3 py-1 rounded-full border border-[var(--border-subtle)]">Step {step} of 3</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="flex gap-2 mb-10">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-2 flex-1 rounded-full overflow-hidden bg-[var(--bg-subtle)]">
                                    <div className={cn(
                                        "h-full transition-all duration-500",
                                        step >= i ? "bg-[var(--accent-primary)]" : "bg-transparent"
                                    )} />
                                </div>
                            ))}
                        </div>

                        {draftNotice && (
                            <p role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                                {draftNotice}
                            </p>
                        )}
                        {submitError && (
                            <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                                {submitError}
                            </p>
                        )}

                        <form onSubmit={handleSubmit} className="bg-white p-8 md:p-10 rounded-lg shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-[var(--border-subtle)] flex flex-col gap-6 relative overflow-hidden">
                            
                            {step === 1 && (
                                <div className="animate-in slide-in-from-right-4 fade-in duration-300 flex flex-col gap-6">
                                    <div className="flex items-center gap-3 mb-2 text-[var(--accent-primary)]">
                                        <div className="p-2 bg-[var(--accent-primary)]/10 rounded-lg">
                                            <Briefcase className="w-5 h-5" />
                                        </div>
                                        <h2 className="text-xl font-bold">The Role</h2>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="orgName" className="text-sm font-semibold text-[var(--text-primary)]">Organization Name *</label>
                                        <input 
                                            id="orgName"
                                            type="text" 
                                            placeholder="e.g. Ann Arbor Public Schools"
                                            className={cn(
                                                "w-full h-12 px-4 rounded-lg border bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] focus:bg-white transition-all",
                                                errors.orgName ? "border-red-500" : "border-[var(--border-subtle)]"
                                            )}
                                            value={orgName}
                                            onChange={(e) => {
                                                setOrgNameInput(e.target.value);
                                                if (errors.orgName) setErrors({...errors, orgName: undefined});
                                            }}
                                            aria-invalid={!!errors.orgName}
                                        />
                                        {errors.orgName && <span className="text-sm text-red-500 font-medium">{errors.orgName}</span>}
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="areaId" className="text-sm font-semibold text-[var(--text-primary)]">Support Type *</label>
                                        <select 
                                            id="areaId"
                                            className={cn(
                                                "w-full h-12 px-4 rounded-lg border bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] focus:bg-white transition-all",
                                                errors.areaOfNeed ? "border-red-500" : "border-[var(--border-subtle)]"
                                            )}
                                            value={areaId}
                                            onChange={(e) => {
                                                setAreaId(e.target.value);
                                                setSpecId("");
                                                if (errors.areaOfNeed) setErrors({...errors, areaOfNeed: undefined});
                                            }}
                                            aria-invalid={!!errors.areaOfNeed}
                                        >
                                            <option value="">Select Support Type</option>
                                            {TAXONOMY.areasOfNeed.map(a => (
                                                <option key={a.id} value={a.id}>{a.label}</option>
                                            ))}
                                        </select>
                                        {errors.areaOfNeed && <span className="text-sm text-red-500 font-medium">{errors.areaOfNeed}</span>}
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="specId" className="text-sm font-semibold text-[var(--text-primary)]">Area of Expertise <span className="text-[var(--text-tertiary)]">(required to publish)</span></label>
                                        <select 
                                            id="specId"
                                            className="w-full h-12 px-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] focus:bg-white transition-all disabled:opacity-50"
                                            value={specId}
                                            onChange={(e) => {
                                                setSpecId(e.target.value);
                                                if (errors.subCategory) setErrors({...errors, subCategory: undefined});
                                            }}
                                            disabled={!areaId || specs.length === 0}
                                            aria-invalid={!!errors.subCategory}
                                        >
                                            <option value="">Select Area of Expertise</option>
                                            {specs.map(s => (
                                                <option key={s.id} value={s.id}>{s.label}</option>
                                            ))}
                                        </select>
                                        {errors.subCategory && <span className="text-sm text-red-500 font-medium">{errors.subCategory}</span>}
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="grade" className="text-sm font-semibold text-[var(--text-primary)]">Grade Level Band <span className="text-[var(--text-tertiary)]">(required to publish)</span></label>
                                        <select
                                            id="grade"
                                            value={gradeLevel}
                                            onChange={(e) => {
                                                setGradeLevel(e.target.value);
                                                if (errors.gradeLevel) setErrors({...errors, gradeLevel: undefined});
                                            }}
                                            aria-invalid={!!errors.gradeLevel}
                                            className="w-full h-12 px-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] focus:bg-white transition-all"
                                        >
                                            <option value="">Select Grade</option>
                                            {TAXONOMY.gradeLevelBands.filter(g => g.id !== "other").map(g => (
                                                <option key={g.id} value={g.id}>{g.label}</option>
                                            ))}
                                        </select>
                                        {errors.gradeLevel && <span className="text-sm text-red-500 font-medium">{errors.gradeLevel}</span>}
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="animate-in slide-in-from-right-4 fade-in duration-300 flex flex-col gap-6">
                                    <div className="flex items-center gap-3 mb-2 text-[var(--accent-primary)]">
                                        <div className="p-2 bg-[var(--accent-primary)]/10 rounded-lg">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <h2 className="text-xl font-bold">The Logistics</h2>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                                        <div className="flex flex-col gap-2">
                                            <label htmlFor="startDate" className="text-sm font-semibold text-[var(--text-primary)]">Desired Start Date <span className="text-[var(--text-tertiary)]">(required to publish)</span></label>
                                            <input
                                                type="date"
                                                id="startDate"
                                                min={todayISO}
                                                value={startDate}
                                                onChange={(e) => {
                                                    setStartDate(e.target.value);
                                                    if (errors.startDate) setErrors({...errors, startDate: undefined});
                                                }}
                                                aria-invalid={!!errors.startDate}
                                                className="w-full h-12 px-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] focus:bg-white transition-all"
                                            />
                                            {errors.startDate && <span className="text-sm text-red-500 font-medium">{errors.startDate}</span>}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label htmlFor="duration" className="text-sm font-semibold text-[var(--text-primary)]">Duration <span className="text-[var(--text-tertiary)]">(required to publish)</span></label>
                                            <input
                                                type="text"
                                                id="duration"
                                                value={duration}
                                                onChange={(e) => {
                                                    setDuration(e.target.value);
                                                    if (errors.duration) setErrors({...errors, duration: undefined});
                                                }}
                                                aria-invalid={!!errors.duration}
                                                placeholder="e.g. 1 semester, Ongoing"
                                                className="w-full h-12 px-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] focus:bg-white transition-all"
                                            />
                                            {errors.duration && <span className="text-sm text-red-500 font-medium">{errors.duration}</span>}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="animate-in slide-in-from-right-4 fade-in duration-300 flex flex-col gap-6">
                                    <div className="flex items-center gap-3 mb-2 text-[var(--accent-primary)]">
                                        <div className="p-2 bg-[var(--accent-primary)]/10 rounded-lg">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <h2 className="text-xl font-bold">The Details</h2>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="compRange" className="text-sm font-semibold text-[var(--text-primary)]">Compensation Range <span className="text-[var(--text-tertiary)]">(required to publish)</span></label>
                                        <input
                                            type="text"
                                            id="compRange"
                                            value={compensationRange}
                                            onChange={(e) => {
                                                setCompensationRange(e.target.value);
                                                if (errors.compensationRange) setErrors({...errors, compensationRange: undefined});
                                            }}
                                            aria-invalid={!!errors.compensationRange}
                                            placeholder="e.g. $80–$100/hr or Per salary schedule"
                                            className="w-full h-12 px-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] focus:bg-white transition-all"
                                        />
                                        {errors.compensationRange && <span className="text-sm text-red-500 font-medium">{errors.compensationRange}</span>}
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="description" className="text-sm font-semibold text-[var(--text-primary)]">Description <span className="text-[var(--text-tertiary)]">(50 characters to publish)</span></label>
                                        <textarea
                                            id="description"
                                            value={description}
                                            onChange={(e) => {
                                                setDescription(e.target.value);
                                                if (errors.description) setErrors({...errors, description: undefined});
                                            }}
                                            aria-invalid={!!errors.description}
                                            rows={5}
                                            placeholder="Describe the role, requirements, and any context that will help educators understand the opportunity."
                                            className="w-full p-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] focus:bg-white transition-all resize-y"
                                        ></textarea>
                                        {errors.description && <span className="text-sm text-red-500 font-medium">{errors.description}</span>}
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-between mt-6 pt-6 border-t border-[var(--border-subtle)]">
                                {step > 1 ? (
                                    <button 
                                        type="button" 
                                        onClick={handleBack}
                                        className="px-6 py-2.5 rounded-lg text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] transition-colors"
                                    >
                                        Back
                                    </button>
                                ) : <div />}

                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={handleSaveDraft}
                                        disabled={submitting}
                                        className="px-4 py-2.5 rounded-lg border border-[var(--border-strong)] text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] disabled:opacity-50"
                                    >
                                        Save draft
                                    </button>
                                    {step < 3 ? (
                                        <PrimaryButton type="button" onClick={handleNext} disabled={submitting} className="flex items-center gap-1 pl-6 pr-4 shadow-md bg-[var(--accent-secondary)] text-[var(--text-primary)] hover:bg-[var(--accent-secondary)]/90">
                                            Continue <CaretRight weight="bold" className="w-4 h-4" />
                                        </PrimaryButton>
                                    ) : (
                                        <PrimaryButton type="submit" disabled={submitting} className="shadow-md bg-[var(--accent-secondary)] text-[var(--text-primary)] hover:bg-[var(--accent-secondary)]/90">
                                            {submitting ? "Saving…" : "Publish need"}
                                        </PrimaryButton>
                                    )}
                                </div>
                            </div>
                        </form>
                    </div>
                ) : viewer !== undefined && !wrongRole && (!signedOut || previewMode) && (
                    <div className="flex flex-col items-center justify-center text-center py-24 animate-in zoom-in-95 duration-500">
                        <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6 ring-8 ring-emerald-50/50">
                            <CheckCircle weight="fill" className="w-12 h-12 text-emerald-500" />
                        </div>
                        <h2 className="font-heading text-4xl font-bold text-[var(--text-primary)] mb-4">Your need has been posted!</h2>
                        <p className="text-lg text-[var(--text-secondary)] max-w-lg mb-10">
                            Matched educators can now review the opportunity and respond from the Gig Board.
                        </p>
                        <div className="flex flex-wrap gap-4 justify-center">
                            <Link href="/">
                                <button className="px-6 py-3 rounded-lg border border-[var(--border-strong)] font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors shadow-sm">
                                    Return Home
                                </button>
                            </Link>
                            <Link href="/dashboard/district">
                                <PrimaryButton className="px-6 py-3">
                                    View Dashboard
                                </PrimaryButton>
                            </Link>
                        </div>
                    </div>
                )}
            </main>

            <SiteFooter />
        </div>
    );
}
