"use client";

import Link from "next/link";
import Image from "next/image";
import { PrimaryButton } from "@/components/shared/button";
import {
  ArrowRight,
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
            className="absolute inset-0 pointer-events-none bg-cover bg-center opacity-75"
            style={{ backgroundImage: "url('/brand/chalkboard-hero.jpg')" }}
          />
          {/* Chalkboard artwork — anchored right, blended into the board on its left edge */}
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[58%] lg:block" aria-hidden="true">
            <Image
              src="/brand/chalkboard-hero-art.jpg"
              alt=""
              fill
              priority
              sizes="(min-width: 1024px) 58vw, 1px"
              className="object-cover object-[right_bottom] [mask-image:linear-gradient(to_right,transparent_0%,black_26%)]"
            />
          </div>
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_42%_12%,rgba(247,241,227,0.10),transparent_26%),linear-gradient(90deg,rgba(5,38,27,0.92)_0%,rgba(7,42,30,0.86)_42%,rgba(7,42,30,0.38)_58%,rgba(5,22,16,0.10)_78%,rgba(5,22,16,0.18)_100%)]" />

          <div className="relative z-10 mx-auto flex min-h-[710px] max-w-[1500px] items-center">
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
          </div>
        </section>

        <section className="w-full border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-6 py-14">
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
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-[var(--text-primary)] leading-tight tracking-tight">
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

              <div className="relative z-10 flex flex-col gap-4 w-[82%] hover:-translate-y-2 transition-transform duration-500 ease-out">
                {/* Mock Card 1 */}
                <div className="p-4 bg-[var(--bg-surface)] rounded-lg border border-[var(--border-default)] shadow-sm flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/15 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    <span className="font-heading text-sm font-bold text-[var(--accent-primary)]">MC</span>
                  </div>
                  <div className="flex min-w-0 flex-col gap-0.5 flex-1">
                    <p className="truncate font-heading text-base font-bold text-[var(--text-primary)]">Marcus Chen</p>
                    <p className="truncate text-sm text-[var(--text-secondary)]">Literacy Coach · K–5 · On-site</p>
                  </div>
                  <div className="h-8 px-3 bg-[var(--accent-info)]/10 border border-[var(--accent-info)]/20 rounded-full flex items-center justify-center">
                    <span className="text-[10px] text-[var(--accent-info)] font-bold uppercase tracking-wider">Verified</span>
                  </div>
                </div>
                {/* Mock Card 2 */}
                <div className="p-4 bg-[var(--bg-surface)] rounded-lg border border-[var(--border-default)] shadow-sm flex items-center gap-4 translate-x-4">
                  <div className="h-12 w-12 rounded-full bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/15 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    <span className="font-heading text-sm font-bold text-[var(--accent-primary)]">JR</span>
                  </div>
                  <div className="flex min-w-0 flex-col gap-0.5 flex-1">
                    <p className="truncate font-heading text-base font-bold text-[var(--text-primary)]">Jada Reynolds</p>
                    <p className="truncate text-sm text-[var(--text-secondary)]">Math Interventionist · 6–8 · Remote</p>
                  </div>
                  <div className="h-8 px-3 bg-[var(--accent-success)]/10 border border-[var(--accent-success)]/20 rounded-full flex items-center justify-center">
                    <span className="text-[10px] text-[var(--accent-success)] font-bold uppercase tracking-wider">Premier</span>
                  </div>
                </div>
                {/* Mock Card 3 — request strip */}
                <div className="p-4 bg-[var(--bg-surface)] rounded-lg border border-[var(--border-default)] shadow-sm flex items-center gap-4 translate-x-8 opacity-90">
                  <div className="h-12 w-12 rounded-full bg-[var(--accent-secondary)]/15 border border-[var(--accent-secondary)]/30 flex-shrink-0 flex items-center justify-center">
                    <ChatCircleText className="h-6 w-6 text-[var(--accent-primary)]" weight="duotone" />
                  </div>
                  <div className="flex min-w-0 flex-col gap-0.5 flex-1">
                    <p className="truncate font-heading text-base font-bold text-[var(--text-primary)]">Request sent</p>
                    <p className="truncate text-sm text-[var(--text-secondary)]">Lincoln USD · 12-week contract</p>
                  </div>
                  <span className="rounded-md border border-[var(--accent-secondary)]/35 bg-[var(--accent-secondary)]/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--accent-primary)]">Illustrative</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. STATISTICS / TRUST (Educators) */}
        <section id="for-educators" className="w-full py-16 px-6 lg:px-12 lg:py-20 bg-[var(--bg-subtle)]">
          <div className="max-w-7xl mx-auto flex flex-col items-center text-center gap-8">
            <h2 className="font-heading text-3xl md:text-4xl font-bold max-w-3xl leading-tight tracking-tight text-[var(--text-primary)]">
              Put your K-12 expertise in front of districts.
            </h2>
            <p className="text-base text-[var(--text-secondary)] max-w-2xl leading-7">
              Create a profile, outline your areas of expertise, set availability, and choose the listed rate districts see before they request your services.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 w-full">
              <div className="flex flex-col items-center gap-3 p-8 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-[var(--accent-primary)]/30 transition-all">
                <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--accent-secondary)]/30 bg-[var(--accent-secondary)]/10">
                  <TrendUp weight="duotone" className="h-7 w-7 text-[var(--accent-secondary)]" />
                </div>
                <h3 className="font-heading text-2xl font-semibold text-[var(--text-primary)]">Set Your Rate</h3>
                <p className="text-sm text-[var(--text-secondary)] text-center leading-relaxed">You list the rate you want to receive. Districts pay that rate plus the disclosed K12Gig platform fee at checkout or invoice approval.</p>
              </div>
              <div className="flex flex-col items-center gap-3 p-8 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-[var(--accent-primary)]/30 transition-all">
                <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--accent-secondary)]/30 bg-[var(--accent-secondary)]/10">
                  <Users weight="duotone" className="h-7 w-7 text-[var(--accent-secondary)]" />
                </div>
                <h3 className="font-heading text-2xl font-semibold text-[var(--text-primary)]">Expand Reach</h3>
                <p className="text-sm text-[var(--text-secondary)] text-center leading-relaxed">Get exposure to multiple school districts in your region, or offer remote consulting nationally.</p>
              </div>
              <div className="flex flex-col items-center gap-3 p-8 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-[var(--accent-primary)]/30 transition-all">
                <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--accent-secondary)]/30 bg-[var(--accent-secondary)]/10">
                  <ShieldCheck weight="duotone" className="h-7 w-7 text-[var(--accent-secondary)]" />
                </div>
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

