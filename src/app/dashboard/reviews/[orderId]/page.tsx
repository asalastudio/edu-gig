"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Sidebar } from "@/components/shared/sidebar";
import { PageHeader } from "@/components/shared/page-header";
import { PrimaryButton } from "@/components/shared/button";
import { Card } from "@/components/shared/card";
import { ArrowLeft, Star } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { formatRating } from "@/lib/map-review";
import type { Id } from "@/convex/_generated/dataModel";

type StarPickerProps = {
    value: number;
    onChange: (n: number) => void;
    label: string;
    required?: boolean;
};

function StarPicker({ value, onChange, label, required }: StarPickerProps) {
    return (
        <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[var(--text-primary)]">
                {label}
                {required ? " *" : ""}
            </label>
            <div className="flex items-center gap-1" role="radiogroup" aria-label={label}>
                {[1, 2, 3, 4, 5].map((n) => (
                    <button
                        key={n}
                        type="button"
                        role="radio"
                        aria-label={`${n} star${n === 1 ? "" : "s"}`}
                        aria-checked={value === n}
                        onClick={() => onChange(n)}
                        className={cn(
                            "p-1 rounded-md transition-colors",
                            value >= n
                                ? "text-amber-500 hover:text-amber-600"
                                : "text-[var(--border-strong)] hover:text-amber-400"
                        )}
                    >
                        <Star weight={value >= n ? "fill" : "regular"} className="w-7 h-7" />
                    </button>
                ))}
                {value > 0 && (
                    <span className="ml-2 text-sm font-semibold text-[var(--text-secondary)]">
                        {formatRating(value)}
                    </span>
                )}
            </div>
        </div>
    );
}

export default function LeaveReviewPage() {
    const params = useParams<{ orderId: string }>();
    const rawOrderId = params?.orderId ?? "";
    const orderId = rawOrderId as Id<"orders">;
    const router = useRouter();

    const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    const viewer = useQuery(api.users.viewer, hasClerk ? {} : "skip");
    const signedOut = !hasClerk || viewer === null;

    const order = useQuery(api.orders.getById, signedOut ? "skip" : { orderId });
    const myEducator = useQuery(api.educators.getMine, signedOut ? "skip" : {});

    const reviewerRole: "buyer" | "seller" | null = useMemo(() => {
        if (!viewer || !order) return null;
        if (order.buyerUserId === viewer._id) return "buyer";
        if (myEducator && order.educatorId === myEducator._id) return "seller";
        return null;
    }, [viewer, order, myEducator]);

    const existingReview = useQuery(
        api.reviews.getForOrder,
        reviewerRole && order ? { orderId, reviewerRole } : "skip"
    );

    const submit = useMutation(api.reviews.submit);

    const [overall, setOverall] = useState(0);
    const [subjectExpertise, setSubjectExpertise] = useState(0);
    const [classroomMgmt, setClassroomMgmt] = useState(0);
    const [communication, setCommunication] = useState(0);
    const [reliability, setReliability] = useState(0);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const isBuyerReviewing = reviewerRole === "buyer";
    const backHref = viewer?.role === "educator" ? "/dashboard/educator" : "/dashboard/district";
    const backLabel = viewer?.role === "educator" ? "Back to educator dashboard" : "Back to district dashboard";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);

        if (overall < 1) {
            setSubmitError("Please choose an overall rating.");
            return;
        }

        setSubmitting(true);
        try {
            await submit({
                orderId,
                overallRating: overall,
                subjectExpertise: isBuyerReviewing && subjectExpertise > 0 ? subjectExpertise : undefined,
                classroomMgmt: isBuyerReviewing && classroomMgmt > 0 ? classroomMgmt : undefined,
                communication: isBuyerReviewing && communication > 0 ? communication : undefined,
                reliability: isBuyerReviewing && reliability > 0 ? reliability : undefined,
                comment: comment.trim() ? comment.trim() : undefined,
            });

            const target = viewer?.role === "educator" ? "/dashboard/educator" : "/dashboard/district";
            router.push(`${target}?reviewSubmitted=1`);
        } catch (err) {
            console.error(err);
            setSubmitError(
                err instanceof Error ? err.message : "Could not submit review. Please try again."
            );
            setSubmitting(false);
        }
    };

    return (
        <div className="flex h-screen bg-[var(--bg-subtle)] font-sans">
            <Sidebar />
            <main className="flex-1 overflow-y-auto w-full relative">
                <div className="max-w-3xl mx-auto px-8 lg:px-12 py-10">
                    <Link
                        href={backHref}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--accent-primary)] mb-8"
                    >
                        <ArrowLeft className="w-4 h-4" /> {backLabel}
                    </Link>

                    <PageHeader
                        title="Leave a review"
                        description="Share what it was like to work on this engagement."
                    />

                    {signedOut ? (
                        <Card className="mt-10 p-10 text-center">
                            <h3 className="font-heading text-xl font-bold text-[var(--text-primary)] mb-2">
                                Sign in to leave a review
                            </h3>
                            <p className="text-sm text-[var(--text-secondary)] max-w-sm mx-auto mb-6">
                                You need a K12Gig account to review an engagement you completed.
                            </p>
                            <Link href="/login">
                                <PrimaryButton>Sign in</PrimaryButton>
                            </Link>
                        </Card>
                    ) : order === undefined || myEducator === undefined ? (
                        <div className="mt-10 text-[var(--text-secondary)]">Loading engagement…</div>
                    ) : order === null ? (
                        <Card className="mt-10 p-10 text-center">
                            <h3 className="font-heading text-xl font-bold text-[var(--text-primary)] mb-2">
                                Engagement not found
                            </h3>
                            <p className="text-sm text-[var(--text-secondary)]">
                                This order doesn&apos;t exist or you don&apos;t have access to it.
                            </p>
                        </Card>
                    ) : !reviewerRole ? (
                        <Card className="mt-10 p-10 text-center">
                            <h3 className="font-heading text-xl font-bold text-[var(--text-primary)] mb-2">
                                You can&apos;t review this engagement
                            </h3>
                            <p className="text-sm text-[var(--text-secondary)]">
                                Only the buyer or educator on an order can leave a review.
                            </p>
                        </Card>
                    ) : existingReview ? (
                        <Card className="mt-10 p-10">
                            <h3 className="font-heading text-xl font-bold text-[var(--text-primary)] mb-2">
                                You&apos;ve already reviewed this engagement
                            </h3>
                            <p className="text-sm text-[var(--text-secondary)] mb-6">
                                Thanks for the feedback — here&apos;s what you submitted.
                            </p>
                            <div className="p-6 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex flex-col gap-3">
                                <div className="flex items-center gap-2">
                                    <Star weight="fill" className="w-5 h-5 text-amber-500" />
                                    <span className="font-bold text-[var(--text-primary)]">
                                        {formatRating(existingReview.overallRating)}
                                    </span>
                                </div>
                                {existingReview.comment ? (
                                    <p className="text-sm text-[var(--text-primary)] italic">
                                        &ldquo;{existingReview.comment}&rdquo;
                                    </p>
                                ) : (
                                    <p className="text-sm text-[var(--text-tertiary)]">No comment left.</p>
                                )}
                            </div>
                        </Card>
                    ) : order.status !== "completed" ? (
                        <Card className="mt-10 p-10 text-center">
                            <h3 className="font-heading text-xl font-bold text-[var(--text-primary)] mb-2">
                                Engagement not yet complete
                            </h3>
                            <p className="text-sm text-[var(--text-secondary)]">
                                You can review this engagement once it is marked completed.
                            </p>
                        </Card>
                    ) : (
                        <form
                            onSubmit={handleSubmit}
                            className="mt-10 bg-white p-8 md:p-10 rounded-lg shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-[var(--border-subtle)] flex flex-col gap-6"
                        >
                            <StarPicker
                                value={overall}
                                onChange={setOverall}
                                label="Overall rating"
                                required
                            />

                            {isBuyerReviewing && (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <StarPicker
                                            value={subjectExpertise}
                                            onChange={setSubjectExpertise}
                                            label="Subject expertise"
                                        />
                                        <StarPicker
                                            value={classroomMgmt}
                                            onChange={setClassroomMgmt}
                                            label="Classroom management"
                                        />
                                        <StarPicker
                                            value={communication}
                                            onChange={setCommunication}
                                            label="Communication"
                                        />
                                        <StarPicker
                                            value={reliability}
                                            onChange={setReliability}
                                            label="Reliability"
                                        />
                                    </div>
                                </>
                            )}

                            <div className="flex flex-col gap-2">
                                <label htmlFor="comment" className="text-sm font-semibold text-[var(--text-primary)]">
                                    Comments
                                </label>
                                <textarea
                                    id="comment"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    rows={5}
                                    placeholder="What stood out? What could be improved?"
                                    className="w-full p-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] focus:bg-white transition-all resize-y"
                                />
                            </div>

                            {submitError && (
                                <p role="alert" className="text-sm text-red-600 font-medium">
                                    {submitError}
                                </p>
                            )}

                            <div className="flex items-center justify-between mt-4 pt-6 border-t border-[var(--border-subtle)]">
                                <Link
                                    href="/dashboard/educator"
                                    className="px-6 py-2.5 rounded-lg text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] transition-colors"
                                >
                                    Cancel
                                </Link>
                                <PrimaryButton type="submit" disabled={submitting}>
                                    {submitting ? "Submitting…" : "Submit review"}
                                </PrimaryButton>
                            </div>
                        </form>
                    )}
                </div>
            </main>
        </div>
    );
}
