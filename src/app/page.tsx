"use client";

import Link from "next/link";
import { PrimaryButton } from "@/components/shared/button";
import {
  ArrowRight,
  Buildings,
  ChatCircleText,
  Check,
  Clock,
  CurrencyCircleDollar,
  MagnifyingGlass,
  ShieldCheck,
  Sparkle,
  TrendUp,
  Users,
} from "@phosphor-icons/react";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { HeroSearch } from "@/components/shared/hero-search";
import { CategoryTiles } from "@/components/shared/category-tiles";
import { AUTH_INTENT_PARAM } from "@/lib/auth-intent";

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] flex flex-col font-sans">

      {/* 1. NAVIGATION BAR */}
      <SiteHeader />

      <main className="flex-1">
        {/* 2. HERO SECTION */}
        <section className="relative w-full overflow-hidden bg-[#092B20] px-6 py-10 text-white md:py-12 lg:px-12">
          <div
            className="absolute inset-0 pointer-events-none bg-cover bg-center opacity-65"
            style={{ backgroundImage: "url('/brand/chalkboard-hero.jpg')" }}
          />
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_42%_12%,rgba(247,241,227,0.11),transparent_26%),linear-gradient(90deg,rgba(5,38,27,0.94)_0%,rgba(7,42,30,0.91)_47%,rgba(7,42,30,0.64)_67%,rgba(5,22,16,0.88)_100%)]" />
          <div className="absolute inset-0 pointer-events-none opacity-35 [background-image:linear-gradient(rgba(248,250,246,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(248,250,246,0.055)_1px,transparent_1px)] [background-size:34px_34px]" />
          <div className="absolute left-[45%] top-[-18%] hidden h-[138%] w-[38rem] rounded-[50%] border border-white/10 bg-white/[0.035] lg:block" />

          <div className="relative z-10 mx-auto grid min-h-[710px] max-w-[1500px] grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,0.94fr)_minmax(560px,0.88fr)] xl:gap-14">
            <div className="flex max-w-[820px] flex-col items-center gap-5 text-center lg:items-start lg:text-left">
              <span className="inline-flex items-center gap-2 rounded-lg border border-[#F4D46A]/70 bg-[#0D3A2D]/80 px-4 py-2 text-sm font-bold text-[#F4D46A] shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
                <Sparkle weight="fill" className="h-4 w-4" /> The New Standard in K–12 Talent
              </span>

              <h1 className="font-heading text-4xl font-bold leading-[1.04] tracking-normal text-white md:text-[2.8rem] 2xl:text-[4rem]">
                Find qualified K–12 consultants <br className="hidden md:block" />
                in <span className="relative inline-block text-[#F4D46A]">
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

              <p className="max-w-2xl text-base leading-7 text-white/84">
                Stop waiting on generic staffing agencies. K12Gig helps districts find reviewed educators, coaches, and specialists for contract and consulting needs.
              </p>
              <p className="max-w-2xl text-sm leading-6 text-white/70">
                The live educator directory is available to district hiring teams — sign in to browse, message, and book.
              </p>

              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <Link href="/browse">
                  <PrimaryButton className="w-full min-h-12 bg-[var(--accent-secondary)] px-6 text-base text-[#17261F] hover:bg-[var(--accent-secondary)]/90 sm:w-auto">
                    Search Educators
                    <MagnifyingGlass className="h-5 w-5" weight="bold" />
                  </PrimaryButton>
                </Link>
                <Link href="/#for-districts">
                  <button className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-lg border border-white/55 bg-white/5 px-6 text-base font-bold text-white transition hover:bg-white/10 sm:w-auto">
                    How districts hire
                    <ArrowRight className="h-5 w-5" weight="bold" />
                  </button>
                </Link>
              </div>

              <HeroSearch />

              <HeroTrustRail />
            </div>

            <HeroVisual />
          </div>
        </section>

        <section className="w-full border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-6 py-10">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex items-center justify-center gap-5 text-center">
              <div className="hidden h-px w-16 bg-[var(--border-strong)] md:block" />
              <p className="font-heading text-base font-bold text-[var(--text-primary)]">
                Trusted by school districts nationwide
              </p>
              <div className="hidden h-px w-16 bg-[var(--border-strong)] md:block" />
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                {
                  icon: ShieldCheck,
                  title: "Vetted for quality",
                  desc: "Credential and reference checks so districts can hire with confidence.",
                },
                {
                  icon: Users,
                  title: "Built for district needs",
                  desc: "Flexible engagements, clear scopes, and procurement-friendly terms.",
                },
                {
                  icon: Clock,
                  title: "Save time, improve outcomes",
                  desc: "Get the right expert in place faster so your team can focus on students.",
                },
              ].map((item) => (
                <div key={item.title} className="flex items-center gap-5 rounded-lg border border-[var(--border-default)] bg-[#FFFCF5] dark:bg-[var(--bg-subtle)] p-6 shadow-[var(--shadow-subtle)]">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[var(--accent-primary)]/20 bg-white dark:bg-[#1C2C24] text-[var(--accent-primary)]">
                    <item.icon className="h-8 w-8" weight="duotone" />
                  </div>
                  <div>
                    <h2 className="font-heading text-lg font-bold text-[var(--text-primary)]">{item.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 2.75 CATEGORY TILES */}
        <CategoryTiles />

        {/* 3. VALUE PROPS (Split) */}
        <section id="for-districts" className="w-full py-16 bg-[var(--bg-surface)] border-y border-[var(--border-subtle)] lg:py-20">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col gap-6">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-[var(--text-primary)] leading-tight">
                Staffing doesn&apos;t have to be a nightmare.
              </h2>
              <p className="text-base text-[var(--text-secondary)] leading-7">
                Whether you need a specialized math interventionist for a 3-month contract or a reliable daily substitute, our marketplace model cuts out the middleman blockades.
              </p>

              <ul className="flex flex-col gap-5 mt-4">
                {[
                  { title: "Credential review", desc: "Educators can upload licenses, certifications, degrees, and endorsements. K12Gig marks review status clearly; background checks via Checkr roll out summer 2026." },
                  { title: "Clear pricing", desc: "Consultant rates are shown on profiles. Districts see the platform fee and final booking total before payment or invoice approval." },
                  { title: "Direct sourcing", desc: "Filter by support type, grade level, and coverage region, then message consultants without going through a staffing agency." }
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
        <section id="for-educators" className="w-full py-16 px-6 lg:px-12 lg:py-20 bg-[var(--bg-subtle)]">
          <div className="max-w-7xl mx-auto flex flex-col items-center text-center gap-8">
            <h2 className="font-heading text-3xl md:text-4xl font-bold max-w-3xl leading-tight text-[var(--text-primary)]">
              Put your K-12 expertise in front of districts.
            </h2>
            <p className="text-base text-[var(--text-secondary)] max-w-2xl leading-7">
              Create a profile, outline your areas of expertise, set availability, and choose the listed rate districts see before they request your services.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 w-full">
              <div className="flex flex-col items-center gap-3 p-6 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-sm hover:shadow-md hover:border-[var(--accent-primary)]/30 transition-all">
                <TrendUp weight="duotone" className="h-10 w-10 text-[var(--accent-secondary)] mb-2" />
                <h3 className="font-heading text-2xl font-semibold text-[var(--text-primary)]">Set Your Rate</h3>
                <p className="text-sm text-[var(--text-secondary)] text-center leading-relaxed">You list the rate you want to receive. Districts pay that rate plus the disclosed K12Gig platform fee at checkout or invoice approval.</p>
              </div>
              <div className="flex flex-col items-center gap-3 p-6 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-sm hover:shadow-md hover:border-[var(--accent-primary)]/30 transition-all">
                <Users weight="duotone" className="h-10 w-10 text-[var(--accent-secondary)] mb-2" />
                <h3 className="font-heading text-2xl font-semibold text-[var(--text-primary)]">Expand Reach</h3>
                <p className="text-sm text-[var(--text-secondary)] text-center leading-relaxed">Get exposure to multiple school districts in your region, or offer remote consulting nationally.</p>
              </div>
              <div className="flex flex-col items-center gap-3 p-6 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-sm hover:shadow-md hover:border-[var(--accent-primary)]/30 transition-all">
                <ShieldCheck weight="duotone" className="h-10 w-10 text-[var(--accent-secondary)] mb-2" />
                <h3 className="font-heading text-2xl font-semibold text-[var(--text-primary)]">Build Trust</h3>
                <p className="text-sm text-[var(--text-secondary)] text-center leading-relaxed">Add credentials, references, and reviews so districts can evaluate fit with more confidence.</p>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center">
              <Link href={`/sign-up?${AUTH_INTENT_PARAM}=educator`}>
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

function HeroVisual() {
  return (
    <div className="relative hidden min-h-[590px] lg:block" aria-hidden="true">
      <div className="absolute inset-x-0 top-0 h-[360px] overflow-hidden rounded-bl-[7rem] border border-white/10 bg-[#F7F1E3] shadow-[0_28px_90px_rgba(0,0,0,0.30)]">
        <div
          className="absolute inset-0 bg-cover bg-[center_34%]"
          style={{ backgroundImage: "url('/brand/hero-district-meeting.png')" }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0)_44%,rgba(11,31,23,0.55)_100%)]" />
      </div>

      <div className="hero-float-card hero-float-card-profile absolute right-9 top-[250px] w-[370px] rounded-lg border border-[var(--border-default)] bg-[#FFFCF5]/96 dark:bg-[#1A1A18]/96 p-4 text-[var(--text-primary)] shadow-[0_22px_70px_rgba(0,0,0,0.24)] backdrop-blur-md">
        <div className="flex items-start justify-between gap-2">
          <span className="rounded-md bg-[var(--accent-primary)] px-2 py-1 text-xs font-bold text-white">98% Match</span>
          <span className="rounded-md border border-[var(--accent-secondary)]/35 bg-[var(--accent-secondary)]/10 px-2 py-1 text-xs font-bold text-[var(--accent-primary)]">Illustrative</span>
        </div>

        <div className="mt-3 flex gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-hover)] font-heading text-base font-bold text-[var(--accent-primary)]">
            EM
          </div>
          <div className="min-w-0">
            <h2 className="font-heading text-base font-bold">Dr. Elena Martinez</h2>
            <p className="text-sm font-medium text-[var(--text-secondary)]">Math Intervention Specialist</p>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-bold">
              <span className="rounded-md border border-[var(--accent-success)]/20 bg-[var(--accent-success)]/10 px-2 py-1 text-[var(--accent-success)]">Verified</span>
              <span className="rounded-md border border-[var(--border-subtle)] bg-white dark:bg-[#282824] px-2 py-1">K-8 Math</span>
              <span className="rounded-md border border-[var(--border-subtle)] bg-white dark:bg-[#282824] px-2 py-1">12+ yrs</span>
            </div>
          </div>
        </div>

      </div>

      <div className="hero-float-card hero-float-card-request absolute right-0 top-[426px] w-[410px] rounded-lg border border-[var(--border-default)] bg-[#FFFCF5]/96 dark:bg-[#1A1A18]/96 p-4 text-[var(--text-primary)] shadow-[0_18px_58px_rgba(0,0,0,0.22)] backdrop-blur-md">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-bold">
            <Buildings className="h-5 w-5 text-[var(--accent-primary)]" />
            Sample District Request
          </p>
          <span className="rounded-md border border-[var(--accent-secondary)]/35 bg-[var(--accent-secondary)]/10 px-2 py-1 text-xs font-bold text-[var(--accent-primary)]">Illustrative</span>
        </div>
        <h3 className="mt-3 font-heading text-base font-bold">Math intervention coverage</h3>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">Grades 6-8 · 12-week contract · On-site 3 days/week</p>
        <div className="mt-3 grid grid-cols-[1fr_1fr_1fr_auto] gap-3 border-t border-[var(--border-subtle)] pt-3">
          <Metric value="18%" label="Platform fee" />
          <Metric value="3 tiers" label="Verification" />
          <Metric value="Net-30" label="or card" />
          <span className="flex min-h-10 items-center rounded-lg bg-[var(--accent-primary)]/80 px-4 text-sm font-bold text-white">Preview</span>
        </div>
      </div>
    </div>
  );
}

function HeroTrustRail() {
  return (
    <div className="grid w-full grid-cols-1 gap-3 pt-1 text-left sm:grid-cols-3">
      {[
        { icon: ShieldCheck, title: "Vetted" },
        { icon: ChatCircleText, title: "Message" },
        { icon: CurrencyCircleDollar, title: "Clear rates" },
      ].map((item) => (
        <div key={item.title} className="flex items-center gap-2 rounded-lg border border-white/12 bg-white/[0.035] px-3 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#F4D46A]/60 bg-[#F4D46A]/10 text-[#F4D46A]">
            <item.icon className="h-4 w-4" weight="duotone" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">{item.title}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-0">
      <p className="truncate font-heading text-base font-bold text-[var(--text-primary)]">{value}</p>
      <p className="mt-0.5 text-[11px] font-medium text-[var(--text-secondary)]">{label}</p>
    </div>
  );
}
