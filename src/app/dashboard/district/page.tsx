"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Sidebar } from "@/components/shared/sidebar";
import { StatCard } from "@/components/shared/stat-card";
import { PrimaryButton } from "@/components/shared/button";
import { SquaresFour, UserCircleCheck, Briefcase, Plus } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { isDistrictRole } from "@/lib/roles";
import { getAreaOfNeedLabel } from "@/lib/taxonomy";
import { formatDistrictKpis, formatOrderStatus, formatPipelineStatus, type PipelineRow } from "@/lib/map-dashboard";

export default function DistrictDashboardPage() {
  const router = useRouter();
  const now = useMemo(() => {
    // Convex queries must stay deterministic; the client supplies the clock.
    // eslint-disable-next-line react-hooks/purity -- snapshot for KPI month window and days-open
    return Date.now();
  }, []);
  const viewer = useQuery(api.users.viewer, {});
  const live = !!viewer && isDistrictRole(viewer.role);
  const districtKpis = useQuery(api.dashboards.districtKpis, live ? { now } : "skip");
  const pipeline = useQuery(api.dashboards.districtPipeline, live ? { now } : "skip");
  const recent = useQuery(api.dashboards.districtRecentPlacements, live ? {} : "skip");

  const kpiValues = formatDistrictKpis(live && districtKpis ? districtKpis : null);
  const showRecentPlacements = !!recent && recent.length > 0;
  const pipelineRows: PipelineRow[] =
    live && pipeline
      ? pipeline.map((p) => ({
          ...p,
          role: getAreaOfNeedLabel(p.role),
          spec: p.spec ? getAreaOfNeedLabel(p.spec) : p.spec,
        }))
      : [];

  return (
    <div className="flex h-screen bg-[var(--bg-subtle)] font-sans pt-14 lg:pt-0">
      <Sidebar />
      <main className="flex-1 overflow-y-auto w-full relative">
        <div className="max-w-[1600px] w-full mx-auto px-6 lg:px-10 py-8 flex flex-col gap-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5 border-b border-[var(--border-subtle)] pb-6">
            <div>
              <div className="education-rule mb-4" />
              <h1 className="font-heading text-3xl font-bold text-[var(--text-primary)] tracking-tight mb-2 md:text-4xl">District overview</h1>
              <p className="max-w-3xl text-base leading-7 text-[var(--text-secondary)]">Monitor open gigs, consultant proposals, and accepted engagements. Contracts and payment happen off-platform.</p>
            </div>
            <div className="flex gap-4">
              <Link href="/post">
                <PrimaryButton className="gap-2 px-5 py-2.5 text-sm rounded-lg shadow-sm bg-[var(--accent-secondary)] text-[var(--text-primary)] hover:bg-[var(--accent-secondary)]/90 border-none font-bold">
                  <Plus weight="bold" className="h-5 w-5" /> Post a need
                </PrimaryButton>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <StatCard label="Open Gigs" value={kpiValues.activeOpenings} icon={SquaresFour} />
            <StatCard label="Placements This Mo" value={kpiValues.placementsThisMonth} icon={UserCircleCheck} />
            <StatCard label="Active Engagements" value={kpiValues.engagementCount} icon={Briefcase} />
          </div>

          <div className={cn("grid grid-cols-1 gap-6 pb-10", showRecentPlacements ? "xl:grid-cols-3" : "xl:grid-cols-1")}>
            <div className={cn("flex flex-col p-0 border border-[var(--border-default)] shadow-[var(--shadow-soft)] rounded-lg bg-white overflow-hidden", showRecentPlacements && "xl:col-span-2")}>
              <div className="px-6 py-6 border-b border-[var(--border-subtle)] flex flex-col justify-between gap-4 bg-white sm:flex-row sm:items-center">
                <div>
                  <h2 className="font-heading text-xl font-bold text-[var(--text-primary)]">Talent Pipeline</h2>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">Active needs and candidate statuses</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left align-middle border-collapse">
                  <thead className="bg-[var(--bg-subtle)] text-[var(--text-secondary)] font-bold uppercase tracking-wider text-xs border-b border-[var(--border-subtle)]">
                    <tr>
                      <th className="py-4 px-6">Gig</th>
                      <th className="py-4 px-5">Candidates</th>
                      <th className="py-4 px-5">Status</th>
                      <th className="py-4 px-6 text-right">Days Open</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)] bg-white">
                    {pipelineRows.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-10 px-6 text-center text-sm font-semibold text-[var(--text-tertiary)]">
                          No openings yet. <Link href="/post" className="text-[var(--accent-primary)] underline">Post your first need</Link>.
                        </td>
                      </tr>
                    ) : (
                      pipelineRows.map((row) => {
                        const label = formatPipelineStatus(row.status);
                        return (
                          <tr
                            key={row.id}
                            className="hover:bg-[var(--bg-hover)] transition-colors group cursor-pointer"
                            onClick={() => router.push(`/dashboard/district/needs/${row.id}`)}
                          >
                            <td className="py-5 px-6">
                              <Link href={`/dashboard/district/needs/${row.id}`} className="flex flex-col group/link">
                                <span className="font-bold text-base text-[var(--text-primary)] group-hover:text-[var(--accent-primary)]">{row.role}</span>
                                <span className="text-sm font-semibold text-[var(--text-tertiary)] mt-1">{row.spec}</span>
                              </Link>
                            </td>
                            <td className="py-5 px-5 font-bold text-[var(--text-secondary)]">{row.candidates ?? 0}</td>
                            <td className="py-5 px-5">
                              <span className={cn(
                                "px-3 py-1.5 font-bold rounded-lg text-xs leading-none border shadow-sm inline-block",
                                label.color === "emerald" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                  label.color === "amber" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                  "bg-blue-50 text-blue-700 border-blue-200"
                              )}>
                                {label.text}
                              </span>
                            </td>
                            <td className="py-5 px-6 tabular-nums font-bold text-lg text-right text-[var(--text-primary)]">{row.daysOpen}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {showRecentPlacements ? (
              <div className="flex flex-col gap-6">
                <div className="flex-1 p-6 border border-[var(--border-default)] shadow-[var(--shadow-soft)] rounded-lg bg-white flex flex-col">
                  <h2 className="font-heading text-xl font-bold text-[var(--text-primary)] mb-6">Recent Placements</h2>
                  <div className="flex flex-col gap-3">
                    {recent!.map((placement) => {
                      const label = formatOrderStatus(placement.status);
                      return (
                        <Link key={placement.id} href={`/dashboard/engagements/${placement.id}`} className="rounded-lg border border-[var(--border-subtle)] p-4 hover:border-[var(--accent-primary)]/40">
                          <p className="font-bold text-[var(--text-primary)]">{getAreaOfNeedLabel(placement.title)}</p>
                          <p className="text-sm text-[var(--text-secondary)] mt-1">{placement.consultantName}</p>
                          <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] mt-2">{label.text}</p>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
