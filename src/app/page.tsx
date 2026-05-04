"use client";

import Link from "next/link";
import { PrimaryButton } from "@/components/shared/button";
import { ShieldCheck, Sparkle, TrendUp, Users, Star, Check } from "@phosphor-icons/react";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { HeroSearch } from "@/components/shared/hero-search";
import { CategoryTiles } from "@/components/shared/category-tiles";

type HeroSampleMatch = {
  initials: string;
  tier: "Verified" | "Premier";
  role: string;
  focus: string;
  fit: string;
  rateRange: string;
};

const heroSampleMatches: HeroSampleMatch[] = [
  { initials: "M·S", tier: "Verified", role: "Math interventionist", focus: "6-8 math", fit: "98%", rateRange: "$60-75/hr" },
  { initials: "B·E", tier: "Premier", role: "Bilingual ELA coach", focus: "K-5 ELA", fit: "96%", rateRange: "$70-85/hr" },
  { initials: "S·A", tier: "Verified", role: "STEM specialist", focus: "9-12 AP science", fit: "94%", rateRange: "$80-95/hr" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] flex flex-col font-sans">

      {/* 1. NAVIGATION BAR */}
      <SiteHeader />

      <main className="flex-1">
        {/* 2. HERO SECTION */}
        <section className="relative w-full min-h-[calc(100svh-7rem)] overflow-hidden bg-[#14231C] px-6 py-14 text-white md:py-16 lg:px-12">
          <div
            className="absolute inset-0 pointer-events-none bg-cover bg-center opacity-65"
            style={{ backgroundImage: "url('/brand/chalkboard-hero.jpg')" }}
          />
          <div className="absolute inset-0 pointer-events-none bg-[#14231C]/35" />
          <div className="absolute inset-0 pointer-events-none opacity-42 [background-image:linear-gradient(rgba(248,250,246,0.09)_1px,transparent_1px),linear-gradient(90deg,rgba(248,250,246,0.068)_1px,transparent_1px)] [background-size:34px_34px]" />
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(180deg,rgba(247,241,227,0.10)_0%,rgba(20,35,28,0.08)_42%,rgba(8,18,13,0.30)_100%)]" />

          <div className="relative z-10 mx-auto grid min-h-[calc(100svh-11rem)] max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.78fr)]">
            <div className="flex flex-col items-center gap-5 text-center lg:items-start lg:text-left">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#F7F1E3]/95 px-3 py-1 text-sm font-semibold text-[var(--accent-primary)] shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
                <Sparkle weight="fill" className="h-4 w-4" /> The New Standard in K-12 Talent
              </span>

              <h1 className="font-heading text-5xl font-bold leading-[1.08] tracking-normal text-white md:text-6xl xl:text-7xl">
                Find top educators <br className="hidden md:block" />
                for your district in exactly <span className="relative inline-block text-[#F4D46A]">
                  zero days.
                  <svg className="absolute -bottom-3 left-0 h-3 w-full overflow-visible" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true">
                    <path
                      d="M2 6 C 19 1, 37 8, 52 5 S 80 2, 98 4"
                      stroke="var(--accent-secondary)"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      fill="none"
                      pathLength="100"
                      className="draw-line"
                    />
                  </svg>
                </span>
              </h1>

              <p className="max-w-2xl text-lg leading-relaxed text-white/78 md:text-xl">
                Stop waiting on generic staffing agencies. K12Gig connects certified educators, coaches, and specialists directly with the districts who need them most.
              </p>

              <HeroSearch />
            </div>

            <HeroMatchBoard />
          </div>
        </section>

        {/* 2.5 SOCIAL PROOF STRIP */}
        <section className="w-full bg-[var(--accent-primary)] py-6 px-6 text-center shadow-inner relative z-20">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-white font-medium text-lg">
                <span className="flex items-center gap-2">
                    <ShieldCheck weight="fill" className="w-5 h-5 opacity-80" /> Credential-Verified Educators
                </span>
                <span className="hidden md:inline text-white/40">•</span>
                <span className="flex items-center gap-2">
                    <Users weight="fill" className="w-5 h-5 opacity-80" /> Direct District Connections
                </span>
                <span className="hidden md:inline text-white/40">•</span>
                <span className="flex items-center gap-2">
                    <Star weight="fill" className="w-5 h-5 text-[var(--accent-secondary)]" /> Transparent, Agency-Free Pricing
                </span>
            </div>
        </section>

        <section className="w-full bg-white border-b border-[var(--border-subtle)] px-6 py-8">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {[
              {
                title: "Credential review",
                desc: "Profiles show verification tier, license status, and background-check indicators so districts can separate reviewed educators from profiles still in progress.",
              },
              {
                title: "Clear pricing",
                desc: "Educator cards and profiles show starting rates. Booking confirms scope, platform fee, tax, and purchase-order details before payment.",
              },
              {
                title: "Procurement ready",
                desc: "Districts can request privacy, DPA, security, and subprocessor details through K12Gig support for internal review.",
              },
            ].map((item) => (
              <div key={item.title} className="border-l-4 border-[var(--accent-secondary)] pl-4">
                <h2 className="font-heading text-base font-bold text-[var(--text-primary)]">{item.title}</h2>
                <p className="text-sm text-[var(--text-secondary)] mt-1 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 2.75 CATEGORY TILES */}
        <CategoryTiles />

        {/* 3. VALUE PROPS (Split) */}
        <section id="for-districts" className="w-full py-24 bg-[var(--bg-surface)] border-y border-[var(--border-subtle)]">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="flex flex-col gap-6">
              <h2 className="font-heading text-4xl md:text-5xl font-bold text-[var(--text-primary)] leading-tight">
                Staffing doesn&apos;t have to be a nightmare.
              </h2>
              <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
                Whether you need a specialized math interventionist for a 3-month contract or a reliable daily substitute, our marketplace model cuts out the middleman blockades.
              </p>

              <ul className="flex flex-col gap-5 mt-4">
                {[
                  { title: "Credential review", desc: "Educators progress through verification tiers — Basic, Verified, Premier — with credentials reviewed by our team. Background checks via Checkr roll out summer 2026." },
                  { title: "Transparent pricing", desc: "Educator rates are shown on every profile. The 18% platform fee is added at checkout — no hidden agency markups." },
                  { title: "Direct sourcing", desc: "Filter by Area of Need, grade level, and coverage region to reach the right educators in your district." }
                ].map((item, i) => (
                  <li key={i} className="flex gap-4 items-start">
                    <div className="h-6 w-6 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] flex items-center justify-center flex-shrink-0 mt-1">
                      <Check weight="bold" className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--text-primary)] text-lg">{item.title}</h3>
                      <p className="text-[var(--text-secondary)] text-sm mt-1">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Visual Abstract representation of the Platform */}
            <div className="relative w-full aspect-square md:aspect-video lg:aspect-square bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-lg shadow-xl overflow-hidden flex items-center justify-center group">
              <div className="absolute inset-0 bg-gradient-to-tr from-[var(--accent-primary)]/5 to-transparent z-0" />

              <div className="relative z-10 flex flex-col gap-4 w-[80%] hover:-translate-y-2 transition-transform duration-500 ease-out">
                {/* Mock Card 1 */}
                <div className="p-4 bg-[var(--bg-surface)] rounded-lg border border-[var(--border-default)] shadow-sm flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-[var(--bg-hover)] border border-[var(--border-subtle)] flex-shrink-0 flex items-center justify-center overflow-hidden">
                    <span className="font-heading text-sm font-bold text-[var(--accent-primary)]">MC</span>
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <div className="h-4 w-3/4 bg-[var(--text-primary)] rounded opacity-90" />
                    <div className="h-3 w-1/2 bg-[var(--text-tertiary)] rounded" />
                  </div>
                  <div className="h-8 w-20 bg-[var(--accent-info)]/10 border border-[var(--accent-info)]/20 rounded-full flex items-center justify-center">
                    <span className="text-[10px] text-[var(--accent-info)] font-bold uppercase tracking-wider">Verified</span>
                  </div>
                </div>
                {/* Mock Card 2 */}
                <div className="p-4 bg-[var(--bg-surface)] rounded-lg border border-[var(--border-default)] shadow-sm flex items-center gap-4 translate-x-4 opacity-80">
                  <div className="h-12 w-12 rounded-full bg-[var(--bg-hover)] border border-[var(--border-subtle)] flex-shrink-0 flex items-center justify-center overflow-hidden">
                    <span className="font-heading text-sm font-bold text-[var(--accent-primary)]">JR</span>
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <div className="h-4 w-5/6 bg-[var(--text-primary)] rounded opacity-90" />
                    <div className="h-3 w-1/3 bg-[var(--text-tertiary)] rounded" />
                  </div>
                  <div className="h-8 w-20 bg-[var(--accent-success)]/10 border border-[var(--accent-success)]/20 rounded-full flex items-center justify-center">
                    <span className="text-[10px] text-[var(--accent-success)] font-bold uppercase tracking-wider">Premier</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. STATISTICS / TRUST (Educators) */}
        <section id="for-educators" className="w-full py-24 px-6 lg:px-12 bg-[var(--bg-subtle)]">
          <div className="max-w-7xl mx-auto flex flex-col items-center text-center gap-10">
            <h2 className="font-heading text-4xl md:text-5xl font-bold max-w-3xl leading-tight text-[var(--text-primary)]">
              Take back control of your <span className="text-[var(--accent-primary)]">teaching career.</span>
            </h2>
            <p className="text-lg text-[var(--text-secondary)] max-w-2xl leading-relaxed">
              Why let an agency dictate your hourly rate? Create a profile, outline your specialties, define your calendar, and let districts come directly to you.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10 w-full">
              <div className="flex flex-col items-center gap-3 p-8 rounded-lg bg-white border border-[var(--border-subtle)] shadow-sm hover:shadow-md hover:border-[var(--accent-primary)]/30 transition-all">
                <TrendUp weight="duotone" className="h-10 w-10 text-[var(--accent-secondary)] mb-2" />
                <h3 className="font-heading text-2xl font-semibold text-[var(--text-primary)]">Set Your Rate</h3>
                <p className="text-sm text-[var(--text-secondary)] text-center leading-relaxed">You decide what your time and expertise is worth. K12Gig adds an 18% platform fee at checkout, fully disclosed on the pricing page.</p>
              </div>
              <div className="flex flex-col items-center gap-3 p-8 rounded-lg bg-white border border-[var(--border-subtle)] shadow-sm hover:shadow-md hover:border-[var(--accent-primary)]/30 transition-all">
                <Users weight="duotone" className="h-10 w-10 text-[var(--accent-secondary)] mb-2" />
                <h3 className="font-heading text-2xl font-semibold text-[var(--text-primary)]">Expand Reach</h3>
                <p className="text-sm text-[var(--text-secondary)] text-center leading-relaxed">Get exposure to multiple school districts in your region, or offer remote consulting nationally.</p>
              </div>
              <div className="flex flex-col items-center gap-3 p-8 rounded-lg bg-white border border-[var(--border-subtle)] shadow-sm hover:shadow-md hover:border-[var(--accent-primary)]/30 transition-all">
                <ShieldCheck weight="duotone" className="h-10 w-10 text-[var(--accent-secondary)] mb-2" />
                <h3 className="font-heading text-2xl font-semibold text-[var(--text-primary)]">Verified Premier</h3>
                <p className="text-sm text-[var(--text-secondary)] text-center leading-relaxed">Climb the verification tiers based on reviews and credentials to unlock higher-paying district contracts.</p>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center">
              <Link href="/dashboard/educator">
                <PrimaryButton className="bg-[var(--accent-secondary)] text-[#1A1A18] hover:bg-[var(--accent-secondary)]/90 px-8 py-3.5 text-lg font-bold border-none shadow-sm">
                  Create Educator Profile
                </PrimaryButton>
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <SiteFooter />

    </div>
  );
}

function HeroMatchBoard() {
  return (
    <div className="hidden lg:block" aria-hidden="true">
      <div className="relative rounded-lg border border-white/15 bg-[#20362C]/92 p-4 text-left shadow-[0_28px_90px_rgba(0,0,0,0.28)] backdrop-blur-md">
        <div className="absolute inset-0 rounded-lg border border-[#F7F1E3]/10" />
        <div className="relative">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <p className="eyebrow text-white/55">Sample district request</p>
            <span className="rounded-md border border-[#F4D46A]/25 bg-[#F4D46A]/12 px-2 py-1 text-xs font-bold text-[#F4D46A]">
              Illustration
            </span>
          </div>

          <div className="py-4">
            <h2 className="font-heading text-2xl font-bold leading-tight text-white">
              Math intervention coverage
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/68">
              Grades 6-8 · 12-week contract · On-site three days weekly
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 border-y border-white/10 py-3">
            {[
              ["18%", "platform fee"],
              ["3 tiers", "verification"],
              ["Net-30", "or card"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-lg border border-white/10 bg-white/[0.045] px-3 py-2">
                <p className="font-heading text-xl font-bold text-white">{value}</p>
                <p className="mt-0.5 text-[11px] font-semibold uppercase text-white/46">{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm font-bold text-white">Sample educator matches</p>
            <p className="text-xs font-semibold text-white/52">Illustrative only</p>
          </div>

          <div className="mt-3 flex flex-col gap-3">
            {heroSampleMatches.map((match) => (
              <SampleMatchRow key={match.role} {...match} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SampleMatchRow({ initials, tier, role, focus, fit, rateRange }: HeroSampleMatch) {
  return (
    <div className="rounded-lg border border-white/12 bg-[#F7F1E3] p-3 text-[var(--text-primary)] shadow-[0_14px_34px_rgba(0,0,0,0.16)]">
      <div className="flex items-center gap-3">
        <div className="flex h-[52px] w-[52px] items-center justify-center rounded-lg bg-[var(--bg-hover)] font-heading text-sm font-bold text-[var(--accent-primary)]">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate font-heading text-sm font-bold">{role}</p>
            <span className="rounded-md bg-[var(--accent-primary)] px-2 py-1 text-xs font-bold text-white">
              {fit}
            </span>
          </div>
          <p className="mt-1 truncate text-xs font-medium text-[var(--text-secondary)]">Coverage example for procurement teams</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
        <span className="inline-flex items-center gap-1 rounded-md border border-[var(--accent-success)]/20 bg-[var(--accent-success)]/10 px-1.5 py-0.5 text-[var(--accent-success)]">
          <ShieldCheck weight="fill" className="h-3.5 w-3.5" />
          {tier}
        </span>
        <span className="rounded-md border border-[var(--border-subtle)] bg-white px-1.5 py-0.5">
          {rateRange}
        </span>
        <span className="rounded-md border border-[var(--accent-tertiary)]/20 bg-[var(--accent-tertiary)]/10 px-1.5 py-0.5 text-[var(--accent-tertiary)]">
          {focus}
        </span>
      </div>
    </div>
  );
}
