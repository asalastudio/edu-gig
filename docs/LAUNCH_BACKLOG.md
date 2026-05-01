# K12Gig Launch v1 — Issue Backlog

Source: the launch-readiness SOW audit completed 2026-04-30. This doc is the seed for the Linear project at https://linear.app/asala-dev/project/k12gig-f6b2f55b632b/overview.

## How this maps to Linear

- **Linear project:** K12Gig Launch v1
- **Team:** K12Gig (identifier: `KGIG`)
- **Milestones:** P0 Blockers (week 1–2) · P1 Polish (week 3–4) · P2 Nice-to-have (post-launch)
- **Labels:** area/* (payments, auth, dashboards, marketplace, legal, ops, security, email) · type/* (bug, feature, cleanup, legal) · severity/* (blocker, major, minor)

## P0 — Blockers (must fix before any paying customer)

### Payments & money flow

| # | Title | Files | Labels | Estimate |
|---|---|---|---|---|
| 1 | Stripe Connect: educator payouts | new — Connect setup + payout job | area/payments, type/feature, severity/blocker | 5–7d |
| 2 | Webhook idempotency | `convex/orders.ts:291`, `src/app/api/stripe/webhook/route.ts` | area/payments, type/bug, severity/blocker | 1d |
| 3 | Refund / cancellation / dispute path | new Convex mutations + `payment_intent.refunded`, `charge.dispute.created` handlers | area/payments, type/feature, severity/blocker | 2–3d |
| 4 | Net-30 invoice collections workflow | `convex/orders.ts:148`, `convex/emails.ts` | area/payments, area/email, type/feature, severity/blocker | 1–2d |

### Onboarding correctness

| # | Title | Files | Labels | Estimate |
|---|---|---|---|---|
| 5 | District state/region hardcoded to TX | `convex/users.ts:128-129` | area/auth, type/bug, severity/blocker | 1d (form + Convex) |
| 6 | Returning-user district row not created on re-onboarding | `convex/users.ts:49-91` | area/auth, type/bug, severity/blocker | 0.5d |
| 7 | needs.create broken for multi-admin districts | `convex/needs.ts:48` | area/auth, type/bug, severity/blocker | 0.25d |
| 8 | seed.ts shipped in prod code with dummy clerk IDs | `convex/seed.ts` | area/security, type/bug, severity/blocker | 0.25d |

### Legal & compliance

| # | Title | Files | Labels | Estimate |
|---|---|---|---|---|
| 9 | Privacy policy is placeholder text | `src/app/privacy/page.tsx:23` | area/legal, type/legal, severity/blocker | 1d eng + counsel |
| 10 | Terms of service is placeholder text | `src/app/terms/page.tsx:23` | area/legal, type/legal, severity/blocker | 1d eng + counsel |
| 11 | No cookie / consent banner | new component | area/legal, type/feature, severity/blocker | 0.5d |
| 12 | Data Processing Agreement (DPA) for K-12 districts | counsel-led | area/legal, type/legal, severity/blocker | counsel |

### Security

| # | Title | Files | Labels | Estimate |
|---|---|---|---|---|
| 13 | Wire Upstash Redis for rate limiter | `src/lib/rate-limit.ts:50`, `docs/OPERATIONS.md:83` | area/security, type/feature, severity/blocker | 0.5–1d |
| 14 | Add CSP / security headers | `next.config.ts` | area/security, type/feature, severity/blocker | 0.5d |
| 15 | Verify Clerk JWT issuer domain in Convex prod | `convex/auth.config.ts` (env audit) | area/security, type/cleanup, severity/blocker | 0.25d |
| 16 | Production env audit (all required vars set) | Vercel + Convex dashboards | area/ops, type/cleanup, severity/blocker | 1d |

## P1 — Polish (must fix for credibility)

### Honest UI

| # | Title | Files | Labels | Estimate |
|---|---|---|---|---|
| 17 | Hardcoded "Action Required: District 204" banner on educator dash | `src/app/dashboard/educator/page.tsx:39-40` | area/dashboards, type/bug, severity/major | 0.5d |
| 18 | Hardcoded fake "Up Next" calendar events on educator dash | `src/app/dashboard/educator/page.tsx:168-170` | area/dashboards, type/bug, severity/major | 0.5d |
| 19 | "Inbox Zero" tile is hardcoded | `src/app/dashboard/educator/page.tsx:188-194` | area/dashboards, type/bug, severity/major | 0.25d |
| 20 | "Accepting Offers" toggle is local state only | `src/app/dashboard/educator/page.tsx:60-77` | area/dashboards, type/bug, severity/major | 0.5d |
| 21 | Hardcoded "1 pending contract for Lincoln High" banner on district dash | `src/app/dashboard/district/page.tsx:42-45` | area/dashboards, type/bug, severity/major | 0.5d |
| 22 | "Export Report" button shows alert("Report downloaded successfully!") | `src/app/dashboard/district/page.tsx:64` | area/dashboards, type/feature, severity/major | 0.5d |
| 23 | District "Recent Placements" always renders MOCK_RECENT_PLACEMENTS | `src/app/dashboard/district/page.tsx:153` | area/dashboards, type/bug, severity/major | 0.5d |
| 24 | District pipeline "Candidates" column always shows — | `src/app/dashboard/district/page.tsx:124` | area/dashboards, type/bug, severity/major | 0.5d |
| 25 | "Saved Educators" button shows alert | `src/app/browse/page.tsx:109` | area/marketplace, type/feature, severity/minor | 0.5d |
| 26 | "Save Educator" button shows alert on profile | `src/app/browse/[educatorId]/page.tsx:182` | area/marketplace, type/feature, severity/minor | (combined with #25) |
| 27 | Quick-filter chips "Local to Me" + "Instant Book" don't filter | `src/app/browse/page.tsx:65-73` | area/marketplace, type/bug, severity/minor | 0.25d |
| 28 | educators.listForBrowse returns hardcoded rating 4.5 | `convex/educators.ts:102-103` | area/marketplace, type/bug, severity/major | 0.5d |
| 29 | "Profile Conversions" KPI stub | `src/app/dashboard/educator/page.tsx:84` | area/dashboards, type/cleanup, severity/minor | 0.25d |

### Educator self-service

| # | Title | Files | Labels | Estimate |
|---|---|---|---|---|
| 30 | Educator can't edit profile fields beyond credentials | `src/app/dashboard/educator/settings/page.tsx:53`, `convex/educators.ts:154` | area/dashboards, area/marketplace, type/feature, severity/blocker | 2–3d |

### Marketplace navigation

| # | Title | Files | Labels | Estimate |
|---|---|---|---|---|
| 31 | No path from educator profile to their gigs | `src/app/browse/[educatorId]/page.tsx` | area/marketplace, type/feature, severity/major | 1d |

### Notifications & email

| # | Title | Files | Labels | Estimate |
|---|---|---|---|---|
| 32 | District settings copy says "coming soon" but email is wired | `src/app/dashboard/district/settings/page.tsx:47` | area/dashboards, type/cleanup, severity/minor | 0.5d copy fix |
| 33 | Build notification preferences UI | new component | area/dashboards, area/email, type/feature, severity/major | 1d |
| 34 | Header notification dropdown / inbox | new component | area/dashboards, type/feature, severity/major | 1d |
| 35 | Email for order accepted / completed / review request / payout | `convex/emails.ts` + scheduler hooks | area/email, type/feature, severity/major | 1–2d |

### Marketing site

| # | Title | Files | Labels | Estimate |
|---|---|---|---|---|
| 36 | Replace randomuser.me hot-link on landing | `src/app/page.tsx:114,133` | area/marketplace, type/cleanup, severity/minor | 0.25d |
| 37 | Add "How It Works" educator-side anchor | `src/components/shared/site-footer.tsx:18` | area/marketplace, type/cleanup, severity/minor | 0.25d |
| 38 | Add About / Pricing / Help pages | new pages | area/marketplace, type/feature, severity/minor | 0.5d |

## P2 — Nice-to-have (post-launch)

| # | Title | Labels | Estimate |
|---|---|---|---|
| 39 | Stripe Tax for taxable services | area/payments, type/feature | 1d |
| 40 | Customer Portal for payment-method management | area/payments, type/feature | 1d |
| 41 | Saved educators / favorites (real implementation) | area/marketplace, type/feature | 2d |
| 42 | Real Checkr UI in educator settings | area/auth, type/feature | 1d |
| 43 | Reviews aggregation + display on educator profile | area/marketplace, type/feature | 1d |
| 44 | Multi-admin district invites | area/auth, type/feature | 1–2d |
| 45 | Google Maps region selector | area/marketplace, type/feature | 1d |
| 46 | Educator video intros | area/marketplace, type/feature | 2d |
| 47 | Geographic radius search/sort | area/marketplace, type/feature | 1d |
| 48 | Vercel Analytics or PostHog wired | area/ops, type/feature | 0.25d |
| 49 | Production rate-limit-config env vars | area/ops, type/feature | 0.5d |
| 50 | Backup automation (scheduled convex export) | area/ops, type/feature | 0.5d |
| 51 | Mobile-responsive dashboard layouts | area/dashboards, type/cleanup | 1d |
| 52 | Dark mode (next-themes already installed) | area/dashboards, type/feature | 1d |
| 53 | Convex preview deployments per branch | area/ops, type/feature | 0.5d |

## Already shipped (FYI — do not re-create)

These were addressed during the audit week itself and are merged/in-flight on PR #1:

- ✅ Webhook idempotency code (#2 above) — landed in commit `0ccc020`. Linear could add a "Done" issue tagged to this commit so the audit trail is complete.
- ✅ Pricing centralization in `convex/pricing.ts` — same commit.
- ✅ Brand rename `EduGig → K12Gig` (Bucket 1, display only) — landed in commit `d11267e`.
- ⏸ Brand rename Bucket 2 (domain) and Bucket 3 (email) — deferred until `k12gig.com` is registered + Resend verified.
