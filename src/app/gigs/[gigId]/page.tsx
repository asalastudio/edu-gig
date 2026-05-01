"use client";

import React, { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/shared/card";
import { PrimaryButton } from "@/components/shared/button";
import { Input } from "@/components/shared/input";
import { CheckIcon, CalendarIcon } from "lucide-react";
import { isDistrictRole } from "@/lib/roles";
import { PLATFORM_FEE_PCT, computePricing } from "@/convex/pricing";

type PaymentMethod = "card" | "invoice";

export default function GigCheckoutPage() {
    const params = useParams<{ gigId: string }>();
    const router = useRouter();
    const searchParams = useSearchParams();
    const checkoutState = searchParams.get("checkout");
    const gigId = typeof params.gigId === "string" ? params.gigId : "";

    const [startDate, setStartDate] = useState("");
    const [poNumber, setPoNumber] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("invoice");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [bookedOrderId, setBookedOrderId] = useState<string | null>(null);

    const viewer = useQuery(api.users.viewer, {});
    const canPersist = !!viewer && isDistrictRole(viewer.role);

    // Only attempt a Convex gig read for real Convex IDs (not "sample-gig-123" demo strings).
    const looksLikeConvexId = gigId.length >= 20 && !gigId.includes("-");
    const gigData = useQuery(
        api.gigs.getById,
        looksLikeConvexId ? { gigId: gigId as Id<"gigs"> } : "skip"
    );

    const createOrder = useMutation(api.orders.createFromGig);

    const title = gigData?.gig.title ?? "Curriculum Mapping Workshop";
    const educatorName = gigData?.user
        ? `${gigData.user.firstName} ${gigData.user.lastName}`.trim()
        : "Dr. Sarah Jenkins";
    const { gigPrice, platformFee, totalCharged } = computePricing(gigData?.gig.price ?? 450);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (!startDate) {
            setError("Please choose a desired start date.");
            return;
        }

        if (paymentMethod === "invoice") {
            if (!canPersist) {
                // Demo path: no real persist available; just show the success state by redirecting.
                setBookedOrderId("demo-order");
                return;
            }
            if (!looksLikeConvexId) {
                setError("This demo gig cannot be booked. Open a real gig from the dashboard.");
                return;
            }
            setSubmitting(true);
            try {
                const orderId = await createOrder({
                    gigId: gigId as Id<"gigs">,
                    startDate,
                    poNumber: poNumber || undefined,
                    paymentMethod: "invoice",
                });
                setBookedOrderId(orderId as unknown as string);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Could not book this gig.");
            } finally {
                setSubmitting(false);
            }
            return;
        }

        // paymentMethod === "card" → Stripe path
        setSubmitting(true);
        try {
            const res = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    gigId,
                    startDate,
                    poNumber: poNumber || undefined,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data?.error ?? "Checkout failed.");
                setSubmitting(false);
                return;
            }
            if (data?.url) {
                window.location.href = data.url;
            } else {
                setError("Stripe session did not return a URL.");
                setSubmitting(false);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Network error.");
            setSubmitting(false);
        }
    }

    if (bookedOrderId || checkoutState === "success") {
        return (
            <div className="min-h-screen bg-[--bg-app] py-12 px-6">
                <div className="max-w-xl mx-auto text-center py-24">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-50 flex items-center justify-center">
                        <CheckIcon className="h-10 w-10 text-emerald-500" />
                    </div>
                    <h1 className="font-heading text-3xl font-bold text-[--text-primary] mb-3">
                        Booking confirmed
                    </h1>
                    <p className="text-[--text-secondary] mb-8">
                        We&apos;ve notified the educator and your district workspace has the order on file.
                    </p>
                    <PrimaryButton onClick={() => router.push("/dashboard/district")}>
                        Back to dashboard
                    </PrimaryButton>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[--bg-app] py-12 px-6">
            <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Multistep Checkout Form */}
                <div className="lg:col-span-2 flex flex-col gap-8">
                    <PageHeader
                        title="Checkout"
                        description={gigId ? `Gig reference: ${gigId}` : undefined}
                    />

                    {checkoutState === "cancelled" && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-900 px-4 py-3 text-sm font-medium">
                            Stripe checkout was cancelled. Your booking has not been placed.
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <Card className="p-8 border-[--border-strong] shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-8 w-8 rounded-full bg-[--accent-primary]/10 text-[--accent-primary] flex items-center justify-center font-bold text-sm">
                                    1
                                </div>
                                <h2 className="text-xl font-heading font-semibold text-[--text-primary]">Scheduling & District Info</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <Input
                                    label="Desired Start Date"
                                    type="date"
                                    placeholder="MM/DD/YYYY"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                                <Input
                                    label="Purchase Order (PO) Number"
                                    placeholder="Optional"
                                    value={poNumber}
                                    onChange={(e) => setPoNumber(e.target.value)}
                                />
                            </div>

                            <div className="divider mb-8" />

                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-8 w-8 rounded-full bg-[--bg-subtle] text-[--text-secondary] flex items-center justify-center font-bold text-sm">
                                    2
                                </div>
                                <h2 className="text-xl font-heading font-semibold text-[--text-primary]">Payment Method</h2>
                            </div>

                            <div className="flex flex-col gap-3">
                                <label className={`flex items-center gap-3 p-4 border rounded-md cursor-pointer ${paymentMethod === "invoice" ? "border-[--accent-primary] bg-[--accent-primary]/5" : "border-[--border-default] hover:border-[--border-strong]"}`}>
                                    <input
                                        type="radio"
                                        name="payment"
                                        className="accent-[--accent-primary]"
                                        value="invoice"
                                        checked={paymentMethod === "invoice"}
                                        onChange={() => setPaymentMethod("invoice")}
                                    />
                                    <span className="font-medium text-[--text-primary]">ACH Bank Transfer (Net-30 Invoice)</span>
                                </label>
                                <label className={`flex items-center gap-3 p-4 border rounded-md cursor-pointer ${paymentMethod === "card" ? "border-[--accent-primary] bg-[--accent-primary]/5" : "border-[--border-default] hover:border-[--border-strong]"}`}>
                                    <input
                                        type="radio"
                                        name="payment"
                                        className="accent-[--accent-primary]"
                                        value="card"
                                        checked={paymentMethod === "card"}
                                        onChange={() => setPaymentMethod("card")}
                                    />
                                    <span className="font-medium text-[--text-primary]">Credit Card (Stripe)</span>
                                </label>
                            </div>

                            {error && (
                                <p className="mt-4 text-sm text-red-600 font-medium">{error}</p>
                            )}

                            <div className="mt-8 flex justify-end">
                                <PrimaryButton
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full md:w-auto px-8 py-3 bg-[--accent-secondary] text-[--text-primary] hover:bg-[--accent-secondary]/90"
                                >
                                    {submitting ? "Processing…" : paymentMethod === "card" ? "Pay with Stripe" : "Confirm & Invoice"}
                                </PrimaryButton>
                            </div>
                        </Card>
                    </form>
                </div>

                {/* Order Summary Sidebar */}
                <div className="lg:col-span-1">
                    <div className="sticky top-6">
                        <Card className="p-6">
                            <h3 className="text-lg font-heading font-semibold text-[--text-primary] mb-6">Order Summary</h3>

                            <div className="flex flex-col gap-4 mb-6">
                                <div>
                                    <h4 className="font-medium text-[--text-primary]">{title}</h4>
                                    <p className="text-sm text-[--text-secondary]">{educatorName}</p>
                                </div>

                                <div className="flex items-start gap-2 text-sm text-[--text-secondary]">
                                    <CalendarIcon className="h-4 w-4 mt-0.5" />
                                    <span>{startDate ? `Starts ${startDate}` : "Half-Day Session"}</span>
                                </div>
                            </div>

                            <div className="divider my-4" />

                            <div className="flex flex-col gap-3 text-sm">
                                <div className="flex justify-between text-[--text-secondary]">
                                    <span>Subtotal</span>
                                    <span className="tabular-nums">${gigPrice.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-[--text-secondary]">
                                    <span>Platform Fee ({Math.round(PLATFORM_FEE_PCT * 100)}%)</span>
                                    <span className="tabular-nums">${platformFee.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="divider my-4" />

                            <div className="flex justify-between items-center text-lg font-bold text-[--text-primary]">
                                <span>Total</span>
                                <span className="tabular-nums">${totalCharged.toFixed(2)}</span>
                            </div>

                            <p className="text-xs text-[--text-tertiary] text-center mt-6 flex items-center justify-center gap-1.5">
                                <CheckIcon className="h-3 w-3" />
                                No charge until start date is confirmed.
                            </p>
                        </Card>
                    </div>
                </div>

            </div>
        </div>
    );
}
