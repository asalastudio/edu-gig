"use client";

import React from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/shared/card";
import { PrimaryButton } from "@/components/shared/button";
import { Input } from "@/components/shared/input";
import { CheckIcon, CalendarIcon } from "lucide-react";

export default function GigCheckoutPage() {
    const params = useParams<{ gigId: string }>();
    const gigId = typeof params.gigId === "string" ? params.gigId : "";

    return (
        <div className="min-h-screen bg-[--bg-app] py-12 px-6">
            <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Multistep Checkout Form */}
                <div className="lg:col-span-2 flex flex-col gap-8">
                    <PageHeader
                        title="Checkout"
                        description={gigId ? `Gig reference: ${gigId}` : undefined}
                    />

                    <Card className="p-8 border-[--border-strong] shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-8 w-8 rounded-full bg-[--accent-primary]/10 text-[--accent-primary] flex items-center justify-center font-bold text-sm">
                                1
                            </div>
                            <h2 className="text-xl font-heading font-semibold text-[--text-primary]">Scheduling & District Info</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <Input label="Desired Start Date" type="date" placeholder="MM/DD/YYYY" />
                            <Input label="Purchase Order (PO) Number" placeholder="Optional" />
                        </div>

                        <div className="divider mb-8" />

                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-8 w-8 rounded-full bg-[--bg-subtle] text-[--text-secondary] flex items-center justify-center font-bold text-sm">
                                2
                            </div>
                            <h2 className="text-xl font-heading font-semibold text-[--text-primary]">Payment Method</h2>
                        </div>

                        <div className="flex flex-col gap-3">
                            <label className="flex items-center gap-3 p-4 border border-[--accent-primary] bg-[--accent-primary]/5 rounded-md cursor-pointer">
                                <input type="radio" name="payment" className="accent-[--accent-primary]" defaultChecked />
                                <span className="font-medium text-[--text-primary]">ACH Bank Transfer (Net-30 Invoice)</span>
                            </label>
                            <label className="flex items-center gap-3 p-4 border border-[--border-default] rounded-md cursor-pointer hover:border-[--border-strong]">
                                <input type="radio" name="payment" className="accent-[--accent-primary]" />
                                <span className="font-medium text-[--text-primary]">Credit Card (Stripe)</span>
                            </label>
                        </div>

                        <div className="mt-8 flex justify-end">
                            <PrimaryButton className="w-full md:w-auto px-8 py-3 bg-[--accent-secondary] text-[--text-primary] hover:bg-[--accent-secondary]/90">
                                Confirm & Pay
                            </PrimaryButton>
                        </div>
                    </Card>
                </div>

                {/* Order Summary Sidebar */}
                <div className="lg:col-span-1">
                    <div className="sticky top-6">
                        <Card className="p-6">
                            <h3 className="text-lg font-heading font-semibold text-[--text-primary] mb-6">Order Summary</h3>

                            <div className="flex flex-col gap-4 mb-6">
                                <div>
                                    <h4 className="font-medium text-[--text-primary]">Curriculum Mapping Workshop</h4>
                                    <p className="text-sm text-[--text-secondary]">Dr. Sarah Jenkins</p>
                                </div>

                                <div className="flex items-start gap-2 text-sm text-[--text-secondary]">
                                    <CalendarIcon className="h-4 w-4 mt-0.5" />
                                    <span>Half-Day Session</span>
                                </div>
                            </div>

                            <div className="divider my-4" />

                            <div className="flex flex-col gap-3 text-sm">
                                <div className="flex justify-between text-[--text-secondary]">
                                    <span>Subtotal</span>
                                    <span className="tabular-nums">$450.00</span>
                                </div>
                                <div className="flex justify-between text-[--text-secondary]">
                                    <span>Platform Fee (18%)</span>
                                    <span className="tabular-nums">$81.00</span>
                                </div>
                            </div>

                            <div className="divider my-4" />

                            <div className="flex justify-between items-center text-lg font-bold text-[--text-primary]">
                                <span>Total</span>
                                <span className="tabular-nums">$531.00</span>
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
