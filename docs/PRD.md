# K12Gig Product Requirements (v1)

## Why

U.S. K-12 districts rely on generic staffing agencies that take 20-40% markups, obscure educator rates, and slow time-to-fill for critical roles (SpEd, math interventionists, long-term subs). Educators lose agency over rate, availability, and district fit.

K12Gig is a two-sided **connection marketplace**: districts post needs and review consultant proposals; consultants publish profiles, resumes, and rates. Accepted proposals become engagements. Payment and legally binding signatures happen off-platform; Contract Hub stores working documents.

## Readiness scorecard

| Dimension | Weight |
|---|---:|
| UI/UX polish & design system | 15 |
| Public/marketing pages | 5 |
| Routing & navigation | 5 |
| Data model / schema | 10 |
| Backend API coverage (Convex) | 20 |
| Auth & onboarding (Clerk + Convex) | 10 |
| Payments / Stripe | 10 |
| Marketplace core (post → match → book) | 10 |
| Testing coverage (unit + e2e) | 8 |
| Ops (env, monitoring, errors) | 5 |
| Docs / PRD | 2 |

## Scope — v1 marketplace spine

### Roles

- **Consultant (internal id: educator)** — publishes a profile, submits proposals, coordinates accepted work in My Gigs and Contract Hub.
- **District admin / HR / superintendent** — posts needs, accepts proposals, messages consultants, coordinates documents.
- **Superadmin** — platform operations.

### Must-have user flows

1. **Sign up → onboard → land in role-appropriate dashboard**
   Clerk handles auth; Convex `users.completeOnboarding` persists role and seeds educator or district rows.

2. **District posts a need** ([src/app/post/page.tsx](src/app/post/page.tsx))
   Three-step form → `convex/needs.ts::create` → redirects to district dashboard; need appears in pipeline.

3. **District browses educators** ([src/app/browse/page.tsx](src/app/browse/page.tsx))
   Gated behind `NEXT_PUBLIC_USE_CONVEX_BROWSE=true` + district role; uses `convex/educators.ts::listForBrowse`.

4. **District accepts a proposal** ([src/app/dashboard/district/needs/[needId]/page.tsx](src/app/dashboard/district/needs/%5BneedId%5D/page.tsx))
   `convex/proposals.ts::accept` transactionally accepts, rejects siblings, places the need, and creates an `engagements` row.

5. **Both sides see the engagement** ([src/app/dashboard/educator/my-gigs/page.tsx](src/app/dashboard/educator/my-gigs/page.tsx), [src/app/dashboard/engagements/[engagementId]/page.tsx](src/app/dashboard/engagements/%5BengagementId%5D/page.tsx))
   Dashboards derive active work from engagements, not orders.

6. **Contract Hub** ([src/app/dashboard/educator/contract-hub/page.tsx](src/app/dashboard/educator/contract-hub/page.tsx))
   Upload/download working documents and track draft/sent/signed-externally/completed. No native e-sign and no checkout.

7. **Messaging** ([src/app/dashboard/messages/page.tsx](src/app/dashboard/messages/page.tsx))
   Districts start conversations. Optional need/engagement context can be attached.

### Data model — canonical tables

See [convex/schema.ts](convex/schema.ts). Core tables: `users`, `educators`, `credentials`, `districts`, `needs`, `proposals`, `engagements`, `contracts`, `contractEvents`, `gigs` (legacy), `orders` (legacy), `reviews` (private/legacy), `messages`, `notifications`.

### Platform economics

- Consultant rate: listed starting hourly/daily rate on the profile, plus the proposed rate on a proposal.
- Payment: **off-platform**. K12Gig does not charge an 18% fee, process cards, send ACH, or issue 1099s at launch.
- Historical `orders` / Stripe records remain readable for audit; creation routes are behind `NEXT_PUBLIC_ENABLE_LEGACY_CHECKOUT` (also requires card checkout).

### Non-functional

- **Auth**: Clerk required for any Convex mutation. Convex callables use role guards.
- **TypeScript strict**: `tsc --noEmit` clean gate.
- **Lint**: ESLint flat config; `npm run lint` gate.
- **Testing**: Vitest for unit; Playwright for e2e; both green before merge.
- **Monitoring**: Sentry enabled when `NEXT_PUBLIC_SENTRY_DSN` set.
- **Graceful fallback**: every page must render without Clerk/Convex configured (demo mode) using [src/lib/mock-educators.ts](src/lib/mock-educators.ts) and hardcoded fallbacks in dashboard mappers.

## Out of scope (v1)

- Background checks (Checkr integration) — env vars scaffolded, code deferred.
- Transactional email (Resend) — installed, deferred.
- Google Maps region selector.
- Anthropic AI co-pilot.
- Educator video intros upload/playback.
- Live scheduling / calendar sync.
- Reviews collection post-completion.
- Multi-tenant district admin invites.
- Reply composer in messages UI (read-only in v1).

## Definition of done (v1 = ≥80 readiness)

- A district and consultant can complete post → propose → accept → My Gigs → Contract Hub without checkout, payout, public ratings, or synthetic resume behavior.
- Typecheck, Convex-aware lint, Vitest, and Playwright pass.
- At least one unit test per `src/lib/map-*` utility plus engagement/authorization helpers.
- At least one e2e spec covering public launch copy, checkout retirement, mobile nav, and auth-gated engagement routes.
- No hardcoded UI data in `/dashboard/*` routes (demo fallbacks confined to mapper functions).
- Public Convex functions that access user data enforce auth/role guards.

## File index

Schemas and key Convex functions:
- [convex/schema.ts](convex/schema.ts)
- [convex/users.ts](convex/users.ts), [convex/educators.ts](convex/educators.ts), [convex/needs.ts](convex/needs.ts)
- [convex/proposals.ts](convex/proposals.ts), [convex/engagements.ts](convex/engagements.ts), [convex/contracts.ts](convex/contracts.ts)
- [convex/gigs.ts](convex/gigs.ts) (legacy), [convex/orders.ts](convex/orders.ts) (legacy), [convex/districts.ts](convex/districts.ts)
- [convex/messages.ts](convex/messages.ts), [convex/notifications.ts](convex/notifications.ts), [convex/dashboards.ts](convex/dashboards.ts)

Legacy Stripe glue (creation disabled unless `NEXT_PUBLIC_ENABLE_LEGACY_CHECKOUT` and card checkout are both on):
- [src/app/api/stripe/checkout/route.ts](src/app/api/stripe/checkout/route.ts)
- [src/app/api/stripe/webhook/route.ts](src/app/api/stripe/webhook/route.ts)

Mappers:
- [src/lib/map-dashboard.ts](src/lib/map-dashboard.ts)
- [src/lib/map-convex-educator-profile.ts](src/lib/map-convex-educator-profile.ts)

Tests:
- [e2e/smoke.spec.ts](e2e/smoke.spec.ts), [e2e/post-need.spec.ts](e2e/post-need.spec.ts), [e2e/checkout.spec.ts](e2e/checkout.spec.ts), [e2e/dashboards.spec.ts](e2e/dashboards.spec.ts), [e2e/engagement-flow.spec.ts](e2e/engagement-flow.spec.ts), [e2e/launch-flow.spec.ts](e2e/launch-flow.spec.ts)
- [src/lib/map-dashboard.test.ts](src/lib/map-dashboard.test.ts), [src/lib/create-engagement.test.ts](src/lib/create-engagement.test.ts), [src/lib/map-convex-educator-profile.test.ts](src/lib/map-convex-educator-profile.test.ts)
