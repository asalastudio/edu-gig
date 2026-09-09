"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { PrimaryButton, primaryButtonClassName } from "@/components/shared/button";
import { TAXONOMY, getAreaOfNeedLabel } from "@/lib/taxonomy";
import { isDistrictRole } from "@/lib/roles";
import { authPagePath } from "@/lib/auth-intent";
import { localCalendarDay, readPostingSession, writePostingSession, promotePostingSession, clearPublishedPostingSessions, type PostingSession } from "@/lib/discovery-state";
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
    const viewer = useQuery(api.users.viewer, hasClerk ? {} : "skip");
    const params = useSearchParams();
    if(hasClerk && viewer === undefined) return <div role="status">Checking your session…</div>;
    return <PostNeedEditor key={`${viewer?._id ?? "anonymous"}:${params.get("draft") ?? "new"}`} viewer={viewer ?? null} />;
}
function PostNeedEditor({viewer}:{viewer:Pick<Doc<"users">,"_id"|"role">|null}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const requestedDraftId = searchParams.get("draft");
    const context = requestedDraftId ?? 'new';
    const accountId = viewer?._id ?? null;
    const persistenceContext=useRef(context);
    const [restored] = useState(()=>readPostingSession(accountId,context));
    const [step, setStep] = useState(restored?.step ?? 1);
    const [isSuccess, setIsSuccess] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(restored?.submitError ?? null);
    const [draftNotice, setDraftNotice] = useState<string | null>(null);
    const [previewMode, setPreviewMode] = useState(!!restored);
    const [draftId, setDraftId] = useState<string | null>(requestedDraftId ?? restored?.draftId ?? null);
    const [hydratedDraftId, setHydratedDraftId] = useState<string | null>(restored && requestedDraftId ? requestedDraftId : null);
    const [anonymousAvailable,setAnonymousAvailable]=useState(()=>!!accountId && !!readPostingSession(null,'new'));
    const active=useRef(true);
    useEffect(()=>{active.current=true;return ()=>{active.current=false;};},[]);
    const educatorParam=searchParams.get('educator');
    const previousEducatorParam=useRef(educatorParam);
    const consultantUrlChanged=useRef(false);
    const [selectedEducatorId,setSelectedEducatorId]=useState(educatorParam ?? restored?.educatorId ?? '');
    useEffect(()=>{
        if(previousEducatorParam.current===educatorParam) return;
        previousEducatorParam.current=educatorParam;
        consultantUrlChanged.current=true;
        setSelectedEducatorId(educatorParam ?? '');
    },[educatorParam]);
    const postPath=(savedId?:string,educatorId=selectedEducatorId)=>{
        const params=new URLSearchParams(searchParams.toString());
        params.delete('name');
        params.delete('educator');
        if(educatorId) params.set('educator',educatorId);
        if(savedId) params.set('draft',savedId);
        return `/post${params.toString()?`?${params}`:''}`;
    };

    // Form state
    // null = untouched; the district profile name is used until the user edits.
    const [orgNameInput, setOrgNameInput] = useState<string | null>(restored?.input.orgName ?? null);
    const [areaId, setAreaId] = useState(restored?.input.areaOfNeed ?? "");
    const [specId, setSpecId] = useState(restored?.input.subCategory ?? "");
    const [gradeLevel, setGradeLevel] = useState(restored?.input.gradeLevel ?? "");
    // New drafts use consulting; resumed legacy drafts retain their recorded type.
    const [engagementType,setEngagementType] = useState(restored?.input.engagementType ?? "consulting");
    const todayISO = localCalendarDay();
    const [startDate, setStartDate] = useState(restored?.input.startDate ?? "");
    const [duration, setDuration] = useState(restored?.input.duration ?? "");
    const [compensationRange, setCompensationRange] = useState(restored?.input.compensationRange ?? "");
    const [description, setDescription] = useState(restored?.input.description ?? "");

    const [compensationBasis,setCompensationBasis]=useState(restored?.input.compensationBasis ?? '');
    const [location,setLocation]=useState(restored?.input.location ?? '');
    const [deliveryMode,setDeliveryMode]=useState(restored?.input.deliveryMode ?? '');
    // Errors
    const [errors, setErrors] = useState<Partial<Record<NeedPublishField, string>>>({});

    const stepHeading=useRef<HTMLHeadingElement>(null);
    const errorSummary=useRef<HTMLDivElement>(null);
    const focusErrors=useRef(false);
    const previousStep=useRef(step);
    useEffect(()=>{
        if(previousStep.current!==step) stepHeading.current?.focus();
        previousStep.current=step;
    },[step]);
    useEffect(()=>{
        if(focusErrors.current) {
            errorSummary.current?.focus();
            focusErrors.current=false;
        }
    },[errors]);

    const canPersist = !!viewer && isDistrictRole(viewer.role);
    const district = useQuery(api.districts.getMine, canPersist ? {} : "skip");
    const saveNeedDraft = useMutation(api.needs.saveDraft);
    const publishNeedDraft = useMutation(api.needs.publishDraft);
    const existingDraftResult = useQuery(
        api.needs.getDraftForEditing,
        canPersist && requestedDraftId
            ? { needId: requestedDraftId }
            : "skip"
    );
    const existingDraft =
        existingDraftResult?.status === "ready" ? existingDraftResult.need : null;
    const selectedConsultant = useQuery(api.educators.getSelectedForPosting, canPersist && selectedEducatorId ? { educatorId: selectedEducatorId } : "skip");
    const educatorName = selectedConsultant?.name;
    const requestedSlot = searchParams.get("slot");

    // Prefill the organization name from the district profile captured at
    // onboarding; anything the user types takes precedence.
    const orgName = orgNameInput ?? district?.name ?? "";

    useEffect(() => {
        if (!existingDraft || existingDraft._id === hydratedDraftId) return;
        setOrgNameInput(existingDraft.orgName);
        setAreaId(existingDraft.areaOfNeed);
        setSpecId(existingDraft.subCategory ?? "");
        setGradeLevel(existingDraft.gradeLevel ?? "");
        setEngagementType(existingDraft.engagementType ?? "consulting");
        setStartDate(existingDraft.startDate ?? "");
        setDuration(existingDraft.duration ?? "");
        setCompensationRange(existingDraft.compensationRange ?? "");
        setDescription(existingDraft.description ?? "");
        setCompensationBasis(existingDraft.compensationBasis ?? "");setLocation(existingDraft.location ?? "");setDeliveryMode(existingDraft.deliveryMode ?? "");
        if(educatorParam===null && !consultantUrlChanged.current) setSelectedEducatorId(existingDraft.selectedEducatorId ?? '');
        setDraftId(existingDraft._id);
        setHydratedDraftId(existingDraft._id);
        setDraftNotice("Draft loaded. Continue where you left off.");
    }, [existingDraft, hydratedDraftId, educatorParam]);

    useEffect(() => {
        if (!requestedDraftId || !canPersist || !existingDraftResult) return;
        if (existingDraftResult.status === "unavailable") {
            setSubmitError("Draft unavailable. Return to Posted Needs and choose a draft you can edit.");
        } else if (existingDraftResult.status === "not_draft") {
            setSubmitError("This need has already been published and can no longer be edited as a draft.");
        }
    }, [requestedDraftId, canPersist, existingDraftResult]);

    const importAnonymous = () => {
        const draft=readPostingSession(null,'new');
        if(!draft) return;
        setOrgNameInput(draft.input.orgName ?? '');setAreaId(draft.input.areaOfNeed ?? '');setSpecId(draft.input.subCategory ?? '');
        setEngagementType(draft.input.engagementType ?? 'consulting');setGradeLevel(draft.input.gradeLevel ?? '');setStartDate(draft.input.startDate ?? '');setDuration(draft.input.duration ?? '');
        setCompensationRange(draft.input.compensationRange ?? '');setDescription(draft.input.description ?? '');
        setCompensationBasis(draft.input.compensationBasis ?? '');setLocation(draft.input.location ?? '');setDeliveryMode(draft.input.deliveryMode ?? '');
        setSelectedEducatorId(draft.educatorId ?? '');setStep(draft.step);setAnonymousAvailable(false);
        setDraftNotice('Preview imported into this form. Review it before saving to your account.');
    };

    const requestedDraftLoading =
        !!requestedDraftId && canPersist && existingDraftResult === undefined;
    const requestedDraftUnavailable =
        !!requestedDraftId &&
        canPersist &&
        !!existingDraftResult &&
        existingDraftResult.status !== "ready";
    const editorLoading =
        requestedDraftLoading;

    const selectedAreaObj = TAXONOMY.areasOfNeed.find(a => a.id === areaId);
    const specs = selectedAreaObj?.subCategories || [];

    const handleNext = (e?: React.MouseEvent) => {
        e?.preventDefault();
        e?.stopPropagation();
        if (step === 1) {
            const newErrors: Partial<Record<NeedPublishField, string>> = {};
            if (!orgName.trim()) newErrors.orgName = "Organization name is required.";
            if (!areaId) newErrors.areaOfNeed = "Please select a primary support area.";

            if (Object.keys(newErrors).length > 0) {
                focusErrors.current=true;
                setErrors(newErrors);
                return;
            }
        }
        setErrors({});
        setStep(prev => Math.min(prev + 1, 4));
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
        description, compensationBasis, location, deliveryMode, selectedEducatorId: selectedEducatorId || undefined,
    });

    const snapshot = JSON.stringify({input:currentInput(),step,educatorId:selectedEducatorId,draftId:draftId ?? undefined,submitError:submitError ?? undefined});
    const latestSnapshot=useRef(snapshot);
    useEffect(()=>{
        latestSnapshot.current=snapshot;
        if(isSuccess || (!accountId && !previewMode) || (requestedDraftId && !hydratedDraftId)) return;
        // A new empty account never reads or copies the anonymous browser draft.
        writePostingSession(accountId,persistenceContext.current,JSON.parse(snapshot));
    },[snapshot,accountId,context,isSuccess,requestedDraftId,hydratedDraftId,previewMode]);

    const saveDraftProgress = async (input: NeedInput, notice: string) => {
        const normalized = normalizeNeedInput(input);
        const minimumErrors: Partial<Record<NeedPublishField, string>> = {};
        if (!normalized.orgName) {
            minimumErrors.orgName = "Organization name is required to save a draft.";
        }
        if (!normalized.areaOfNeed) {
            minimumErrors.areaOfNeed = "Primary support area is required to save a draft.";
        }
        if (Object.keys(minimumErrors).length > 0) {
            focusErrors.current=true;
            setErrors(minimumErrors);
            setStep(1);
            throw new Error("Add an organization name and primary support area before saving your draft.");
        }

        if (!canPersist) {
            writePostingSession(null,context,{input:normalized,step,educatorId:selectedEducatorId});
            router.push(authPagePath("/sign-in","district",postPath()));
            return null;
        }

        const savedId = await saveNeedDraft({
            needId: draftId ? (draftId as Id<"needs">) : undefined,
            ...normalized,
        });
        if(!active.current) return null;
        const savedIdString = savedId as unknown as string;
        promotePostingSession(accountId!,persistenceContext.current,savedIdString,{input:normalized,step,educatorId:selectedEducatorId,draftId:savedIdString});
        persistenceContext.current=savedIdString;
        setDraftId(savedIdString);
        setDraftNotice(notice);
        return savedId;
    };

    const handleSaveDraft = async () => {
        setSubmitError(null);
        setDraftNotice(null);
        setSubmitting(true);
        try {
            const savedId=await saveDraftProgress(currentInput(), "Draft saved. You can keep editing or return later.");
            if(savedId && active.current) router.replace(postPath(savedId), {scroll:false});
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : "Could not save this draft.");
        } finally {
            setSubmitting(false);
        }
    };

    const recoverSavedDraft = (savedId: Id<"needs"> | null, message: string) => {
        if(!active.current) return;
        setSubmitError(message);
        setDraftNotice(null);
        if(!savedId) return;
        // The attempt has settled. Keep edits and feedback available after the
        // saved-ID route remounts, without resurrecting a stale `new` alias.
        const latest: PostingSession=JSON.parse(latestSnapshot.current);
        writePostingSession(accountId,savedId,{...latest,draftId:savedId,submitError:message});
        if(requestedDraftId!==savedId) router.replace(postPath(savedId,latest.educatorId ?? ''),{scroll:false});
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);
        setDraftNotice(null);
        const input = currentInput();
        const publishIssues = getNeedPublishIssues(input);
        focusErrors.current=publishIssues.length>0;
        setErrors(
            Object.fromEntries(publishIssues.map((issue) => [issue.field, issue.message])) as Partial<
                Record<NeedPublishField, string>
            >
        );
        setSubmitting(true);
        let savedId: Id<"needs"> | null=null;
        try {
            savedId = await saveDraftProgress(
                input,
                publishIssues.length > 0
                    ? "Draft saved. Complete the highlighted fields when you are ready to publish."
                    : "Draft saved. Publishing now…"
            );
            if (!savedId) return;
            if (publishIssues.length > 0) {
                recoverSavedDraft(savedId,
                    `Draft saved instead of published. ${publishIssues.map((issue) => issue.message).join(" ")}`
                );
                return;
            }
            if(!active.current) return;
            await publishNeedDraft({ needId: savedId });
            if(!active.current) return;
            clearPublishedPostingSessions(accountId!,savedId);
        } catch (err) {
            recoverSavedDraft(savedId,
                err instanceof Error
                    ? err.message
                    : "Could not save or publish this need. Please try again."
            );
            return;
        } finally {
            setSubmitting(false);
        }

        if(!active.current) return;
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

                {canPersist && anonymousAvailable && !requestedDraftId && <div className="mb-6 rounded-lg border p-4 bg-white">
                    <p>A preview draft is available in this browser session. Import it only if it belongs in this account.</p>
                    <button type="button" onClick={importAnonymous} className="font-bold underline mt-3">Import preview draft</button>
                    <button type="button" onClick={()=>setAnonymousAvailable(false)} className="ml-6 underline">Keep this account&apos;s form</button>
                </div>}
                {canPersist && selectedEducatorId && <p role="status" className="mb-4">{selectedConsultant === undefined ? 'Loading selected consultant…' : selectedConsultant ? `Selected consultant: ${selectedConsultant.name}. Posting a need does not hire or notify this consultant directly.` : 'Selected consultant unavailable. Choose a current profile before making a request.'}</p>}
                {canPersist && selectedEducatorId && <button type="button" className="underline mb-4" onClick={()=>{
                    setSelectedEducatorId('');const params=new URLSearchParams(searchParams.toString());params.delete('educator');params.delete('name');
                    router.replace(`/post${params.toString()?`?${params}`:''}`,{scroll:false});
                }}>Remove selected consultant</button>}
                {signedOut && !previewMode && (
                    <div className="bg-white p-8 md:p-10 rounded-lg shadow-sm border border-[var(--border-subtle)]">
                        <h1 className="font-heading text-4xl font-bold text-[var(--text-primary)] mb-4">
                            Sign in to post a need
                        </h1>
                        <p className="text-lg text-[var(--text-secondary)] mb-6">
                            K12Gig saves district requests to your account so consultants can respond, message you, and coordinate an engagement.
                            Sign in or create a district account before posting.
                        </p>
                        {(educatorName || requestedSlot) && (
                            <div className="mb-6 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4 text-sm font-medium text-[var(--text-secondary)]">
                                {educatorName && <p>Requesting: <span className="font-bold text-[var(--text-primary)]">{educatorName}</span></p>}
                                {requestedSlot && <p>Preferred window: <span className="font-bold text-[var(--text-primary)]">{requestedSlot}</span></p>}
                            </div>
                        )}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Link href={authPagePath("/sign-in","district",postPath())} className={primaryButtonClassName("w-full sm:w-auto")}>Sign in to post</Link>
                            <Link href={authPagePath("/sign-up","district",postPath())} className="w-full sm:w-auto px-6 py-3 rounded-lg border border-[var(--border-strong)] font-bold text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2">
                                    Create district account
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
                            Consultant accounts can browse open needs and manage gigs. Posting new district demand requires a district hiring account.
                        </p>
                        <Link href="/login" className={primaryButtonClassName()}>Choose another account</Link>
                    </div>
                )}

                {sessionReady && !wrongRole && (!signedOut || previewMode) && !isSuccess && (
                    editorLoading ? (
                        <div className="bg-white p-10 rounded-lg border border-[var(--border-subtle)] text-center text-[var(--text-secondary)]">
                            {requestedDraftLoading ? "Loading your draft…" : "Moving your saved draft into your district account…"}
                        </div>
                    ) : requestedDraftUnavailable ? (
                        <div className="bg-white p-10 rounded-lg border border-[var(--border-subtle)] text-center">
                            <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)] mb-3">Draft unavailable</h1>
                            <p className="text-[var(--text-secondary)] mb-6">
                                This link is invalid, the draft was already published, or it belongs to another district account.
                            </p>
                            <Link href="/dashboard/board" className={primaryButtonClassName()}>Return to Posted Needs</Link>
                        </div>
                    ) : (
                    <div className="animate-in fade-in duration-500">
                        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                            <div>
                            <h1 className="font-heading text-4xl font-bold text-[var(--text-primary)] mb-2">Post a need</h1>
                                <p className="text-lg text-[var(--text-secondary)]">
                                    {signedOut
                                        ? "Preview the request form. You’ll sign in before posting it for real."
                                        : "Tell us what your district is looking for."}
                                </p>
                            </div>
                            <span className="text-sm font-bold text-[var(--text-secondary)] bg-[var(--bg-subtle)] px-3 py-1 rounded-full border border-[var(--border-subtle)]">Step {step} of 4</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="flex gap-2 mb-10">
                            {[1, 2, 3, 4].map(i => (
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

                        {Object.values(errors).some(Boolean) && <div ref={errorSummary} tabIndex={-1} role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
                            <p className="font-bold">Check these fields before continuing:</p>
                            <ul className="list-disc pl-5">{Object.entries(errors).filter(([,message])=>message).map(([field,message])=><li key={field}>{message}</li>)}</ul>
                        </div>}
                        <form onSubmit={handleSubmit} className="bg-white p-8 md:p-10 rounded-lg shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-[var(--border-subtle)] flex flex-col gap-6 relative overflow-hidden">

                            {step === 1 && (
                                <div className="animate-in slide-in-from-right-4 fade-in duration-300 flex flex-col gap-6">
                                    <div className="flex items-center gap-3 mb-2 text-[var(--accent-primary)]">
                                        <div className="p-2 bg-[var(--accent-primary)]/10 rounded-lg">
                                            <Briefcase className="w-5 h-5" />
                                        </div>
                                        <h2 ref={stepHeading} tabIndex={-1} className="text-xl font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">The Role</h2>
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
                                                aria-describedby={errors.orgName ? "orgName-error" : undefined}
                                        />
                                        {errors.orgName && <span id="orgName-error" className="text-sm text-red-700 font-medium">{errors.orgName}</span>}
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="areaId" className="text-sm font-semibold text-[var(--text-primary)]">Primary support area *</label>
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
                                                aria-describedby={errors.areaOfNeed ? "areaOfNeed-error" : undefined}
                                        >
                                            <option value="">Select primary support area</option>
                                            {TAXONOMY.areasOfNeed.map(a => (
                                                <option key={a.id} value={a.id}>{a.label}</option>
                                            ))}
                                        </select>
                                        {errors.areaOfNeed && <span id="areaOfNeed-error" className="text-sm text-red-700 font-medium">{errors.areaOfNeed}</span>}
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="specId" className="text-sm font-semibold text-[var(--text-primary)]">Specific expertise needed <span className="text-[var(--text-secondary)]">(required to publish)</span></label>
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
                                                aria-describedby={errors.subCategory ? "subCategory-error" : undefined}
                                        >
                                            <option value="">Select specific expertise</option>
                                            {specs.map(s => (
                                                <option key={s.id} value={s.id}>{s.label}</option>
                                            ))}
                                        </select>
                                        {errors.subCategory && <span id="subCategory-error" className="text-sm text-red-700 font-medium">{errors.subCategory}</span>}
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="grade" className="text-sm font-semibold text-[var(--text-primary)]">Grade levels <span className="text-[var(--text-secondary)]">(required to publish)</span></label>
                                        <select
                                            id="grade"
                                            value={gradeLevel}
                                            onChange={(e) => {
                                                setGradeLevel(e.target.value);
                                                if (errors.gradeLevel) setErrors({...errors, gradeLevel: undefined});
                                            }}
                                            aria-invalid={!!errors.gradeLevel}
                                                aria-describedby={errors.gradeLevel ? "gradeLevel-error" : undefined}
                                            className="w-full h-12 px-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] focus:bg-white transition-all"
                                        >
                                            <option value="">Select Grade</option>
                                            {TAXONOMY.gradeLevelBands.filter(g => g.id !== "other").map(g => (
                                                <option key={g.id} value={g.id}>{g.label}</option>
                                            ))}
                                        </select>
                                        {errors.gradeLevel && <span id="gradeLevel-error" className="text-sm text-red-700 font-medium">{errors.gradeLevel}</span>}
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="animate-in slide-in-from-right-4 fade-in duration-300 flex flex-col gap-6">
                                    <div className="flex items-center gap-3 mb-2 text-[var(--accent-primary)]">
                                        <div className="p-2 bg-[var(--accent-primary)]/10 rounded-lg">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <h2 ref={stepHeading} tabIndex={-1} className="text-xl font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">The Logistics</h2>
                                    </div>

                                    <label className="flex flex-col gap-2 font-semibold">Delivery expectations<select value={deliveryMode} onChange={e=>setDeliveryMode(e.target.value)} className="field-control"><option value="">Choose delivery expectations</option><option value="onsite">On site</option><option value="remote">Remote</option><option value="hybrid">Hybrid</option><option value="discuss">Discuss with consultant</option></select></label>
                                    <label className="flex flex-col gap-2 font-semibold">Location or remote expectations<input value={location} onChange={e=>setLocation(e.target.value)} placeholder="Example: Lansing, MI; remote meetings in Eastern time" className="field-control" /></label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                                        <div className="flex flex-col gap-2">
                                            <label htmlFor="startDate" className="text-sm font-semibold text-[var(--text-primary)]">Desired Start Date <span className="text-[var(--text-secondary)]">(required to publish)</span></label>
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
                                                aria-describedby={errors.startDate ? "startDate-error" : undefined}
                                                className="w-full h-12 px-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] focus:bg-white transition-all"
                                            />
                                            {errors.startDate && <span id="startDate-error" className="text-sm text-red-700 font-medium">{errors.startDate}</span>}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label htmlFor="duration" className="text-sm font-semibold text-[var(--text-primary)]">Duration <span className="text-[var(--text-secondary)]">(required to publish)</span></label>
                                            <input
                                                type="text"
                                                id="duration"
                                                value={duration}
                                                onChange={(e) => {
                                                    setDuration(e.target.value);
                                                    if (errors.duration) setErrors({...errors, duration: undefined});
                                                }}
                                                aria-invalid={!!errors.duration}
                                                aria-describedby={errors.duration ? "duration-error" : undefined}
                                                placeholder="e.g. 1 semester, Ongoing"
                                                className="w-full h-12 px-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] focus:bg-white transition-all"
                                            />
                                            {errors.duration && <span id="duration-error" className="text-sm text-red-700 font-medium">{errors.duration}</span>}
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
                                        <h2 ref={stepHeading} tabIndex={-1} className="text-xl font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">The Details</h2>
                                    </div>

                                    <label className="flex flex-col gap-2 font-semibold">Compensation basis<select value={compensationBasis} onChange={e=>setCompensationBasis(e.target.value)} className="field-control"><option value="">Choose a basis</option><option value="hour">Per hour</option><option value="day">Per day</option><option value="project">Project total</option><option value="discuss">To be discussed</option></select></label>
                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="compRange" className="text-sm font-semibold text-[var(--text-primary)]">Compensation Range <span className="text-[var(--text-secondary)]">(required to publish)</span></label>
                                        <input
                                            type="text"
                                            id="compRange"
                                            value={compensationRange}
                                            onChange={(e) => {
                                                setCompensationRange(e.target.value);
                                                if (errors.compensationRange) setErrors({...errors, compensationRange: undefined});
                                            }}
                                            aria-invalid={!!errors.compensationRange}
                                                aria-describedby={errors.compensationRange ? "compensationRange-error" : undefined}
                                            placeholder="e.g. $80–$100/hr or Per salary schedule"
                                            className="w-full h-12 px-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] focus:bg-white transition-all"
                                        />
                                        {errors.compensationRange && <span id="compensationRange-error" className="text-sm text-red-700 font-medium">{errors.compensationRange}</span>}
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="description" className="text-sm font-semibold text-[var(--text-primary)]">Description <span className="text-[var(--text-secondary)]">(50 characters to publish)</span></label>
                                        <textarea
                                            id="description"
                                            value={description}
                                            onChange={(e) => {
                                                setDescription(e.target.value);
                                                if (errors.description) setErrors({...errors, description: undefined});
                                            }}
                                            aria-invalid={!!errors.description}
                                                aria-describedby={errors.description ? "description-error" : undefined}
                                            rows={5}
                                            placeholder="Describe the role, requirements, and any context that will help consultants understand the opportunity."
                                            className="w-full p-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] focus:bg-white transition-all resize-y"
                                        ></textarea>
                                        {errors.description && <span id="description-error" className="text-sm text-red-700 font-medium">{errors.description}</span>}
                                    </div>
                                </div>
                            )}

                            {step === 4 && <section aria-label="Review need" className="space-y-4">
                                <h2 ref={stepHeading} tabIndex={-1} className="text-xl font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">Review your need</h2>
                                <p>{canPersist ? 'Check the scope before publishing. Use Back to edit details.' : 'Sign in to a district account to import this preview and publish after review.'}</p>
                                <dl className="space-y-3">{Object.entries({Organization:orgName,'Primary support area':TAXONOMY.areasOfNeed.find(a=>a.id===areaId)?.label ?? areaId,'Specific expertise needed':getAreaOfNeedLabel(specId),'Grade levels':TAXONOMY.gradeLevelBands.find(g=>g.id===gradeLevel)?.label ?? gradeLevel,'Start date':startDate,Duration:duration,Delivery:deliveryMode,Location:location,Compensation:`${compensationRange} ${compensationBasis}`,Description:description}).map(([label,value])=><div key={label}><dt className="font-bold">{label}</dt><dd className="whitespace-pre-wrap break-words">{value || 'Not specified'}</dd></div>)}</dl>
                                <p>Payment and signing are arranged outside K12Gig. Publication invites proposals; it does not create an agreement.</p>
                                <button type="button" className="underline" onClick={()=>setStep(1)}>Edit organization and support</button>
                                <button type="button" className="underline ml-4" onClick={()=>setStep(2)}>Edit logistics</button>
                            </section>}
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
                                    {step < 4 ? (
                                        <PrimaryButton type="button" onClick={handleNext} disabled={submitting} className="flex items-center gap-1 pl-6 pr-4 shadow-md bg-[var(--accent-secondary)] text-[var(--text-primary)] hover:bg-[var(--accent-secondary)]/90">
                                            {step === 3 ? "Review need" : "Continue"} <CaretRight weight="bold" className="w-4 h-4" />
                                        </PrimaryButton>
                                    ) : (
                                        <PrimaryButton type="submit" disabled={submitting} className="shadow-md bg-[var(--accent-secondary)] text-[var(--text-primary)] hover:bg-[var(--accent-secondary)]/90">
                                            {submitting ? "Saving…" : canPersist ? "Publish need" : "Sign in to continue"}
                                        </PrimaryButton>
                                    )}
                                </div>
                            </div>
                        </form>
                    </div>
                    )
                )}
                {isSuccess && viewer !== undefined && !wrongRole && (!signedOut || previewMode) && (
                    <div className="flex flex-col items-center justify-center text-center py-24 animate-in zoom-in-95 duration-500">
                        <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6 ring-8 ring-emerald-50/50">
                            <CheckCircle weight="fill" className="w-12 h-12 text-emerald-500" />
                        </div>
                        <h2 className="font-heading text-4xl font-bold text-[var(--text-primary)] mb-4">Your need has been posted!</h2>
                        <p className="text-lg text-[var(--text-secondary)] max-w-lg mb-10">
                            Matched consultants can now review the opportunity and respond from the Gig Board.
                        </p>
                        <div className="flex flex-wrap gap-4 justify-center">
                            <Link href="/" className="px-6 py-3 rounded-lg border border-[var(--border-strong)] font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2">
                                    Return Home
                                </Link>
                            <Link href="/dashboard/district" className={primaryButtonClassName("px-6 py-3")}>
                                    View Dashboard
                                </Link>
                        </div>
                    </div>
                )}
            </main>

            <SiteFooter />
        </div>
    );
}
