"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { z } from "zod";
import { api } from "@/convex/_generated/api";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { PrimaryButton } from "@/components/shared/button";
import { TAXONOMY } from "@/lib/taxonomy";
import { isDistrictRole } from "@/lib/roles";
import { AUTH_INTENT_PARAM } from "@/lib/auth-intent";
import { ArrowLeft, CheckCircle, CaretRight, Briefcase, Calendar, FileText } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const needSchema = z.object({
    orgName: z.string().trim().min(1, "Organization name is required."),
    areaOfNeed: z.string().min(1, "Please select an area of need."),
    subCategory: z.string().optional(),
    gradeLevel: z.string().optional(),
    engagementType: z.string().optional(),
    startDate: z.string().optional(),
    duration: z.string().optional(),
    compensationRange: z.string().optional(),
    description: z.string().optional(),
});

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
    const [previewMode, setPreviewMode] = useState(false);

    // Form state
    const [orgName, setOrgName] = useState("");
    const [areaId, setAreaId] = useState("");
    const [specId, setSpecId] = useState("");
    const [gradeLevel, setGradeLevel] = useState("");
    const [engagementType, setEngagementType] = useState("");
    const [startDate, setStartDate] = useState("");
    const [duration, setDuration] = useState("");
    const [compensationRange, setCompensationRange] = useState("");
    const [description, setDescription] = useState("");

    // Errors
    const [errors, setErrors] = useState<{org?: string; area?: string}>({});

    const viewer = useQuery(api.users.viewer, hasClerk ? {} : "skip");
    const canPersist = !!viewer && isDistrictRole(viewer.role);
    const createNeed = useMutation(api.needs.create);
    const educatorName = searchParams.get("name");
    const requestedSlot = searchParams.get("slot");

    const selectedAreaObj = TAXONOMY.areasOfNeed.find(a => a.id === areaId);
    const specs = selectedAreaObj?.subCategories || [];

    const handleNext = (e?: React.MouseEvent) => {
        e?.preventDefault();
        e?.stopPropagation();
        if (step === 1) {
            const newErrors: {org?: string; area?: string} = {};
            if (!orgName.trim()) newErrors.org = "Organization name is required.";
            if (!areaId) newErrors.area = "Please select an area of need.";

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);

        const parsed = needSchema.safeParse({
            orgName,
            areaOfNeed: areaId,
            subCategory: specId || undefined,
            gradeLevel: gradeLevel || undefined,
            engagementType: engagementType || undefined,
            startDate: startDate || undefined,
            duration: duration || undefined,
            compensationRange: compensationRange || undefined,
            description: description || undefined,
        });
        if (!parsed.success) {
            const first = parsed.error.issues[0];
            setSubmitError(first?.message ?? "Please review the form and try again.");
            return;
        }

        if (!canPersist) {
            window.localStorage.setItem("k12gig_post_need_draft", JSON.stringify(parsed.data));
            router.push(`/sign-up?${AUTH_INTENT_PARAM}=district&next=${encodeURIComponent("/post")}`);
            return;
        }

        setSubmitting(true);
        try {
            await createNeed(parsed.data);
        } catch (err) {
            console.error(err);
            setSubmitError(
                err instanceof Error
                    ? err.message
                    : "Could not post this need. Please try again."
            );
            setSubmitting(false);
            return;
        }
        setSubmitting(false);

        setIsSuccess(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const signedOut = !hasClerk || viewer === null;
    const wrongRole = !!viewer && !isDistrictRole(viewer.role);

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

                {viewer !== undefined && !wrongRole && (!signedOut || previewMode) && !isSuccess ? (
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
                                            placeholder="e.g. Austin ISD"
                                            className={cn(
                                                "w-full h-12 px-4 rounded-lg border bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] focus:bg-white transition-all",
                                                errors.org ? "border-red-500" : "border-[var(--border-subtle)]"
                                            )}
                                            value={orgName}
                                            onChange={(e) => {
                                                setOrgName(e.target.value);
                                                if (errors.org) setErrors({...errors, org: undefined});
                                            }}
                                        />
                                        {errors.org && <span className="text-sm text-red-500 font-medium">{errors.org}</span>}
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="areaId" className="text-sm font-semibold text-[var(--text-primary)]">Area of Need *</label>
                                        <select 
                                            id="areaId"
                                            className={cn(
                                                "w-full h-12 px-4 rounded-lg border bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] focus:bg-white transition-all",
                                                errors.area ? "border-red-500" : "border-[var(--border-subtle)]"
                                            )}
                                            value={areaId}
                                            onChange={(e) => {
                                                setAreaId(e.target.value);
                                                setSpecId("");
                                                if (errors.area) setErrors({...errors, area: undefined});
                                            }}
                                        >
                                            <option value="">Select Area</option>
                                            {TAXONOMY.areasOfNeed.map(a => (
                                                <option key={a.id} value={a.id}>{a.label}</option>
                                            ))}
                                        </select>
                                        {errors.area && <span className="text-sm text-red-500 font-medium">{errors.area}</span>}
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="specId" className="text-sm font-semibold text-[var(--text-primary)]">Specialization</label>
                                        <select 
                                            id="specId"
                                            className="w-full h-12 px-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] focus:bg-white transition-all disabled:opacity-50"
                                            value={specId}
                                            onChange={(e) => setSpecId(e.target.value)}
                                            disabled={!areaId || specs.length === 0}
                                        >
                                            <option value="">Select Specialization</option>
                                            {specs.map(s => (
                                                <option key={s.id} value={s.id}>{s.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="grade" className="text-sm font-semibold text-[var(--text-primary)]">Grade Level Band</label>
                                        <select
                                            id="grade"
                                            value={gradeLevel}
                                            onChange={(e) => setGradeLevel(e.target.value)}
                                            className="w-full h-12 px-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] focus:bg-white transition-all"
                                        >
                                            <option value="">Select Grade</option>
                                            {TAXONOMY.gradeLevelBands.filter(g => g.id !== "other").map(g => (
                                                <option key={g.id} value={g.id}>{g.label}</option>
                                            ))}
                                        </select>
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

                                    <div className="flex flex-col gap-3">
                                        <label className="text-sm font-semibold text-[var(--text-primary)]">Engagement Type</label>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            {TAXONOMY.engagementTypes.map(eng => (
                                                <label key={eng.id} className="flex flex-col items-start gap-2 p-4 border border-[var(--border-subtle)] bg-[var(--bg-app)] rounded-lg cursor-pointer hover:border-[var(--accent-primary)]/50 focus-within:ring-2 focus-within:ring-[var(--accent-primary)] transition-all has-[:checked]:bg-[var(--accent-primary)]/5 has-[:checked]:border-[var(--accent-primary)]">
                                                    <input
                                                        type="radio"
                                                        name="engagementType"
                                                        value={eng.id}
                                                        checked={engagementType === eng.id}
                                                        onChange={() => setEngagementType(eng.id)}
                                                        className="w-4 h-4 text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] border-[var(--border-strong)]"
                                                    />
                                                    <span className="text-[var(--text-primary)] font-semibold text-sm">{eng.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                                        <div className="flex flex-col gap-2">
                                            <label htmlFor="startDate" className="text-sm font-semibold text-[var(--text-primary)]">Desired Start Date</label>
                                            <input
                                                type="date"
                                                id="startDate"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="w-full h-12 px-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] focus:bg-white transition-all"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label htmlFor="duration" className="text-sm font-semibold text-[var(--text-primary)]">Duration</label>
                                            <input
                                                type="text"
                                                id="duration"
                                                value={duration}
                                                onChange={(e) => setDuration(e.target.value)}
                                                placeholder="e.g. 1 semester, Ongoing"
                                                className="w-full h-12 px-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] focus:bg-white transition-all"
                                            />
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
                                        <label htmlFor="compRange" className="text-sm font-semibold text-[var(--text-primary)]">Compensation Range</label>
                                        <input
                                            type="text"
                                            id="compRange"
                                            value={compensationRange}
                                            onChange={(e) => setCompensationRange(e.target.value)}
                                            placeholder="e.g. $80–$100/hr or Per salary schedule"
                                            className="w-full h-12 px-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] focus:bg-white transition-all"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="description" className="text-sm font-semibold text-[var(--text-primary)]">Description</label>
                                        <textarea
                                            id="description"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            rows={5}
                                            placeholder="Describe the role, requirements, and any context that will help educators understand the opportunity."
                                            className="w-full p-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] focus:bg-white transition-all resize-y"
                                        ></textarea>
                                    </div>

                                    {submitError && (
                                        <p className="text-sm text-red-600 font-medium">{submitError}</p>
                                    )}
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

                                {step < 3 ? (
                                    <PrimaryButton type="button" onClick={handleNext} className="flex items-center gap-1 pl-6 pr-4 shadow-md bg-[var(--accent-secondary)] text-[var(--text-primary)] hover:bg-[var(--accent-secondary)]/90">
                                        Continue <CaretRight weight="bold" className="w-4 h-4" />
                                    </PrimaryButton>
                                ) : (
                                    <PrimaryButton type="submit" disabled={submitting} className="shadow-md bg-[var(--accent-secondary)] text-[var(--text-primary)] hover:bg-[var(--accent-secondary)]/90">
                                        {submitting ? "Posting…" : canPersist ? "Post This Need" : "Sign in to post"}
                                    </PrimaryButton>
                                )}
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
                            We&apos;ll surface matched educators shortly. Expect responses within 24 hours.
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
