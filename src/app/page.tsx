"use client";

import Link from "next/link";
import Image from "next/image";
import { PrimaryButton } from "@/components/shared/button";
import { ShieldCheck, Sparkle, TrendUp, Users, Star, Check } from "@phosphor-icons/react";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { HeroSearch } from "@/components/shared/hero-search";
import { CategoryTiles } from "@/components/shared/category-tiles";

export default function Home() {
  return (
    <div className="min-h-screen bg-[--bg-app] text-[--text-primary] flex flex-col font-sans">

      {/* 1. NAVIGATION BAR */}
      <SiteHeader />

      <main className="flex-1">
        {/* 2. HERO SECTION */}
        <section className="relative w-full pt-20 pb-16 md:pt-28 md:pb-24 px-6 lg:px-12 overflow-hidden flex flex-col items-center text-center bg-[--bg-surface]">
          {/* Subtle background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[--accent-primary]/5 blur-[100px] rounded-full pointer-events-none" />

          <div className="relative max-w-4xl mx-auto flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out z-10">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[--accent-secondary]/10 border border-[--accent-secondary]/20 text-[--accent-secondary] text-sm font-semibold tracking-wide">
              <Sparkle weight="fill" className="h-4 w-4" /> The New Standard in K-12 Talent
            </span>

            <h1 className="font-heading text-5xl md:text-7xl font-bold tracking-tight text-[--text-primary] leading-[1.1]">
              Find top educators <br className="hidden md:block" />
              for your district in exactly <span className="text-[--accent-primary] relative inline-block">
                zero days.
                <svg className="absolute w-full h-3 -bottom-1 left-0 opacity-100" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path 
                    d="M0 5 Q 50 10 100 5" 
                    stroke="var(--accent-secondary)" 
                    strokeWidth="4" 
                    fill="none" 
                    pathLength="100"
                    className="draw-line"
                  />
                </svg>
              </span>
            </h1>

            <p className="text-lg md:text-xl text-[--text-secondary] max-w-2xl leading-relaxed mt-4">
              Stop waiting on generic staffing agencies. EduGig connects certified educators, coaches, and specialists directly with the districts who need them most.
            </p>

            <HeroSearch />
          </div>
        </section>

        {/* 2.5 SOCIAL PROOF STRIP */}
        <section className="w-full bg-[--accent-primary] py-6 px-6 text-center shadow-inner relative z-20">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-white font-medium text-lg">
                <span className="flex items-center gap-2">
                    <ShieldCheck weight="fill" className="w-5 h-5 opacity-80" /> 500+ Verified Educators
                </span>
                <span className="hidden md:inline text-white/40">•</span>
                <span className="flex items-center gap-2">
                    <Users weight="fill" className="w-5 h-5 opacity-80" /> 75+ Partner Districts
                </span>
                <span className="hidden md:inline text-white/40">•</span>
                <span className="flex items-center gap-2">
                    <Star weight="fill" className="w-5 h-5 text-[--accent-secondary]" /> 4.9 Average Rating
                </span>
            </div>
        </section>

        {/* 2.75 CATEGORY TILES */}
        <CategoryTiles />

        {/* 3. VALUE PROPS (Split) */}
        <section id="for-districts" className="w-full py-24 bg-[--bg-surface] border-y border-[--border-subtle]">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="flex flex-col gap-6">
              <h2 className="font-heading text-4xl md:text-5xl font-bold text-[--text-primary] leading-tight">
                Staffing doesn&apos;t have to be a nightmare.
              </h2>
              <p className="text-lg text-[--text-secondary] leading-relaxed">
                Whether you need a specialized math interventionist for a 3-month contract or a reliable daily substitute, our marketplace model cuts out the middleman blockades.
              </p>

              <ul className="flex flex-col gap-5 mt-4">
                {[
                  { title: "Pre-screened & Vetted", desc: "Every educator passes strict credential verification and background checks before listing their gigs." },
                  { title: "Transparent Pricing", desc: "No opaque agency markups. You see precisely what the educator charges." },
                  { title: "Instant Sourcing", desc: "Filter by taxonomy (SpEd, STEM, Sub) to engage professionals exactly when you need them." }
                ].map((item, i) => (
                  <li key={i} className="flex gap-4 items-start">
                    <div className="h-6 w-6 rounded-full bg-[--accent-primary]/10 text-[--accent-primary] flex items-center justify-center flex-shrink-0 mt-1">
                      <Check weight="bold" className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[--text-primary] text-lg">{item.title}</h3>
                      <p className="text-[--text-secondary] text-sm mt-1">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Visual Abstract representation of the Platform */}
            <div className="relative w-full aspect-square md:aspect-video lg:aspect-square bg-[--bg-app] border border-[--border-subtle] rounded-2xl shadow-xl overflow-hidden flex items-center justify-center group">
              <div className="absolute inset-0 bg-gradient-to-tr from-[--accent-primary]/5 to-transparent z-0" />

              <div className="relative z-10 flex flex-col gap-4 w-[80%] hover:-translate-y-2 transition-transform duration-500 ease-out">
                {/* Mock Card 1 */}
                <div className="p-4 bg-[--bg-surface] rounded-xl border border-[--border-default] shadow-sm flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-[--bg-hover] border border-[--border-subtle] flex-shrink-0 flex items-center justify-center overflow-hidden">
                    <Image
                      src="https://randomuser.me/api/portraits/women/68.jpg"
                      alt=""
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <div className="h-4 w-3/4 bg-[--text-primary] rounded opacity-90" />
                    <div className="h-3 w-1/2 bg-[--text-tertiary] rounded" />
                  </div>
                  <div className="h-8 w-20 bg-[--accent-info]/10 border border-[--accent-info]/20 rounded-full flex items-center justify-center">
                    <span className="text-[10px] text-[--accent-info] font-bold uppercase tracking-wider">Verified</span>
                  </div>
                </div>
                {/* Mock Card 2 */}
                <div className="p-4 bg-[--bg-surface] rounded-xl border border-[--border-default] shadow-sm flex items-center gap-4 translate-x-4 opacity-80">
                  <div className="h-12 w-12 rounded-full bg-[--bg-hover] border border-[--border-subtle] flex-shrink-0 flex items-center justify-center overflow-hidden">
                    <Image
                      src="https://randomuser.me/api/portraits/men/32.jpg"
                      alt=""
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <div className="h-4 w-5/6 bg-[--text-primary] rounded opacity-90" />
                    <div className="h-3 w-1/3 bg-[--text-tertiary] rounded" />
                  </div>
                  <div className="h-8 w-20 bg-[--accent-success]/10 border border-[--accent-success]/20 rounded-full flex items-center justify-center">
                    <span className="text-[10px] text-[--accent-success] font-bold uppercase tracking-wider">Premier</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. STATISTICS / TRUST (Educators) */}
        <section id="for-educators" className="w-full py-24 px-6 lg:px-12 bg-[--bg-subtle]">
          <div className="max-w-7xl mx-auto flex flex-col items-center text-center gap-10">
            <h2 className="font-heading text-4xl md:text-5xl font-bold max-w-3xl leading-tight text-[--text-primary]">
              Take back control of your <span className="text-[--accent-primary]">teaching career.</span>
            </h2>
            <p className="text-lg text-[--text-secondary] max-w-2xl leading-relaxed">
              Why let an agency dictate your hourly rate? Create a profile, outline your specialties, define your calendar, and let districts come directly to you.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10 w-full">
              <div className="flex flex-col items-center gap-3 p-8 rounded-3xl bg-white border border-[--border-subtle] shadow-sm hover:shadow-md hover:border-[--accent-primary]/30 transition-all">
                <TrendUp weight="duotone" className="h-10 w-10 text-[--accent-secondary] mb-2" />
                <h3 className="font-heading text-2xl font-semibold text-[--text-primary]">Set Your Rate</h3>
                <p className="text-sm text-[--text-secondary] text-center leading-relaxed">You decide what your time and expertise is worth. No hidden agency cuts from your paycheck.</p>
              </div>
              <div className="flex flex-col items-center gap-3 p-8 rounded-3xl bg-white border border-[--border-subtle] shadow-sm hover:shadow-md hover:border-[--accent-primary]/30 transition-all">
                <Users weight="duotone" className="h-10 w-10 text-[--accent-secondary] mb-2" />
                <h3 className="font-heading text-2xl font-semibold text-[--text-primary]">Expand Reach</h3>
                <p className="text-sm text-[--text-secondary] text-center leading-relaxed">Get exposure to multiple school districts in your region, or offer remote consulting nationally.</p>
              </div>
              <div className="flex flex-col items-center gap-3 p-8 rounded-3xl bg-white border border-[--border-subtle] shadow-sm hover:shadow-md hover:border-[--accent-primary]/30 transition-all">
                <ShieldCheck weight="duotone" className="h-10 w-10 text-[--accent-secondary] mb-2" />
                <h3 className="font-heading text-2xl font-semibold text-[--text-primary]">Verified Premier</h3>
                <p className="text-sm text-[--text-secondary] text-center leading-relaxed">Climb the verification tiers based on reviews and credentials to unlock higher-paying district contracts.</p>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center">
              <Link href="/dashboard/educator">
                <PrimaryButton className="bg-[--accent-secondary] text-[#1A1A18] hover:bg-[--accent-secondary]/90 px-8 py-3.5 text-lg font-bold border-none shadow-sm">
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
