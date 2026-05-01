# K12Gig Product Requirements (v1)

## Why

U.S. K-12 districts rely on generic staffing agencies that take 20-40% markups, obscure educator rates, and slow time-to-fill for critical roles (SpEd, math interventionists, long-term subs). Educators lose agency over rate, availability, and district fit.

K12Gig is a two-sided marketplace: districts post needs and book verified educators directly; educators list service gigs and manage their own pipeline.

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

- **Educator** — lists services, accepts orders, gets paid.
- **District admin / HR / superintendent** — posts needs, books educators, pays invoices or card.
- **Superadmin** — platform operations (out of scope for v1 UI; Convex-level only).

### Must-have user flows

1. **Sign up → onboard → land in role-appropriate dashboard**
   Clerk handles auth; Convex `users.completeOnboarding` persists role and seeds educator or district rows.

2. **District posts a need** ([src/app/post/page.tsx](src/app/post/page.tsx))
   Three-step form → `convex/needs.ts::create` → redirects to district dashboard; need appears in pipeline.

3. **District browses educators** ([src/app/browse/page.tsx](src/app/browse/page.tsx))
   Gated behind `NEXT_PUBLIC_USE_CONVEX_BROWSE=true` + district role; uses `convex/educators.ts::listForBrowse`.

4. **District books a gig** ([src/app/gigs/[gigId]/page.tsx](src/app/gigs/%5BgigId%5D/page.tsx))
   - ACH / Net-30: `convex/orders.ts::createFromGig` → order in `pending` state.
   - Credit card: `POST /api/stripe/checkout` → Stripe Checkout Session → webhook verifies → `convex/orders.ts::createFromWebhook` creates `accepted` order with `stripePaymentIntentId`.

5. **Educator sees active pipeline** ([src/app/dashboard/educator/page.tsx](src/app/dashboard/educator/page.tsx))
   `convex/dashboards.ts::educatorKpis` + `educatorPipeline` drive KPIs + list.

6. **District sees KPIs + talent pipeline** ([src/app/dashboard/district/page.tsx](src/app/dashboard/district/page.tsx))
   `convex/dashboards.ts::districtKpis` + `districtPipeline`.

7. **Messaging** ([src/app/dashboard/messages/page.tsx](src/app/dashboard/messages/page.tsx))
   `convex/messages.ts::send|listMyConversations|listConversation|markConversationRead`; notifications via `convex/notifications.ts`.

### Data model — canonical tables

See [convex/schema.ts](convex/schema.ts). Ten tables: `users`, `educators`, `credentials`, `districts`, `gigs`, `needs`, `orders`, `reviews`, `messages`, `notifications`.

### Platform economics

- Platform fee: **18%** of `totalAmount`, stored in `orders.platformFee`.
- Educator payout: `totalAmount − platformFee`, stored in `orders.educatorPayout`.

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

- All seven must-have flows work end-to-end with real Clerk+Convex+Stripe credentials.
- Typecheck, lint, Vitest, and Playwright pass in CI.
- At least one unit test per `src/lib/map-*` utility.
- At least one e2e spec per must-have flow (in demo mode; gated tests for live mode behind `E2E_LIVE=1`).
- No hardcoded UI data in `/dashboard/*` routes (demo fallbacks confined to mapper functions).
- Every Convex function enforces role guards (`requireDistrictViewer`, `requireEducatorViewer`, or webhook-secret check).

## File index

Schemas and key Convex functions:
- [convex/schema.ts](convex/schema.ts)
- [convex/users.ts](convex/users.ts), [convex/educators.ts](convex/educators.ts), [convex/needs.ts](convex/needs.ts)
- [convex/gigs.ts](convex/gigs.ts), [convex/orders.ts](convex/orders.ts), [convex/districts.ts](convex/districts.ts)
- [convex/messages.ts](convex/messages.ts), [convex/notifications.ts](convex/notifications.ts), [convex/dashboards.ts](convex/dashboards.ts)

Stripe glue:
- [src/app/api/stripe/checkout/route.ts](src/app/api/stripe/checkout/route.ts)
- [src/app/api/stripe/webhook/route.ts](src/app/api/stripe/webhook/route.ts)

Mappers:
- [src/lib/map-dashboard.ts](src/lib/map-dashboard.ts)
- [src/lib/map-convex-educator-profile.ts](src/lib/map-convex-educator-profile.ts)

Tests:
- [e2e/smoke.spec.ts](e2e/smoke.spec.ts), [e2e/post-need.spec.ts](e2e/post-need.spec.ts), [e2e/checkout.spec.ts](e2e/checkout.spec.ts), [e2e/dashboards.spec.ts](e2e/dashboards.spec.ts)
- [src/lib/map-dashboard.test.ts](src/lib/map-dashboard.test.ts), [src/lib/utils.test.ts](src/lib/utils.test.ts), [src/lib/mock-educators.test.ts](src/lib/mock-educators.test.ts), [src/components/shared/button.test.tsx](src/components/shared/button.test.tsx)
