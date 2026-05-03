"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
    procurementMaterialLabel,
    procurementStatusLabel,
    procurementStatusTone,
} from "@/lib/procurement";
import { cn } from "@/lib/utils";

export function ProcurementRequestList() {
    const requests = useQuery(api.procurement.listMine, {});

    if (requests === undefined) {
        return (
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-5 text-sm font-semibold text-[var(--text-secondary)]">
                Loading procurement requests...
            </div>
        );
    }

    if (requests.length === 0) {
        return (
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-5">
                <p className="text-sm font-bold text-[var(--text-primary)]">No procurement requests yet</p>
                <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                    Request a DPA packet or invoice review when your district is ready for procurement.
                </p>
                <Link href="/dpa" className="mt-4 inline-flex text-sm font-bold text-[var(--accent-primary)] hover:underline">
                    Open DPA request form
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {requests.slice(0, 5).map((request) => (
                <div key={request._id} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <p className="text-sm font-bold text-[var(--text-primary)]">{request.districtName}</p>
                            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
                                {new Date(request.createdAt).toLocaleDateString()}
                                {request.deadline ? ` · deadline ${request.deadline}` : ""}
                            </p>
                        </div>
                        <StatusBadge status={request.status} />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                        {request.requestedMaterials.map(procurementMaterialLabel).join(", ")}
                    </p>
                </div>
            ))}
            {requests.length > 5 ? (
                <p className="text-xs font-semibold text-[var(--text-tertiary)]">
                    Showing the five most recent requests.
                </p>
            ) : null}
        </div>
    );
}

export function StatusBadge({ status }: { status: string }) {
    const tone = procurementStatusTone(status);
    return (
        <span
            className={cn(
                "inline-flex w-fit rounded-full border px-3 py-1 text-xs font-bold",
                tone === "emerald" && "border-emerald-200 bg-emerald-50 text-emerald-700",
                tone === "amber" && "border-amber-200 bg-amber-50 text-amber-700",
                tone === "blue" && "border-blue-200 bg-blue-50 text-blue-700",
                tone === "violet" && "border-violet-200 bg-violet-50 text-violet-700",
                tone === "neutral" && "border-[var(--border-subtle)] bg-white text-[var(--text-secondary)]"
            )}
        >
            {procurementStatusLabel(status)}
        </span>
    );
}
