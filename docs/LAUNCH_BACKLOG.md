# K12Gig Launch v1 — Issue Backlog

Source: the launch-readiness SOW audit completed 2026-04-30. This doc is the seed for the Linear project at https://linear.app/asala-dev/project/k12gig-f6b2f55b632b/overview.

> **Audit refresh — July 2026.** Every row below was re-verified against the current `claude/k12-main-repo-check-b5ln4f` branch (recent feature push + merged PR #10 "Phase 1 launch readiness"). Each row now carries a **Status** column with a file/function evidence note. Legend: ✅ Done · 🟡 Partial · ⬜ Open · ♻️ Superseded/N-A. Two new sections at the end track what got resolved and what fresh issues surfaced during the July push. Original rows and numbering are preserved — nothing was deleted.
>
> **Tally across the 53 items:** ✅ 31 Done · 🟡 10 Partial · ⬜ 11 Open · ♻️ 1 Superseded.

## How this maps to Linear

- **Linear project:** K12Gig Launch v1
- **Team:** K12Gig (identifier: `KGIG`)
- **Milestones:** P0 Blockers (week 1–2) · P1 Polish (week 3–4) · P2 Nice-to-have (post-launch)
- **Labels:** `area/*` (payments, auth, dashboards, marketplace, legal, ops, security, email) · `type/*` (bug, feature, cleanup, legal) · `severity/*` (blocker, major, minor)

## P0 — Blockers (must fix before any paying customer)

### Payments & money flow

| # | Title | Files | Labels | Estimate | Status — Jul 2026 |
|---|---|---|---|---|---|
| 1 | Stripe Connect: educator payouts | new — Connect setup + payout job | area/payments, type/feature, severity/blocker | 5–7d | ⬜ **Open** — no Connect/payout/transfer code anywhere in `convex/` or `src/app/api`. Orders carry an `educatorPayout` amount but there is no payout mechanism. |
| 2 | Webhook idempotency | `convex/orders.ts:291`, `src/app/api/stripe/webhook/route.ts` | area/payments, type/bug, severity/blocker | 1d | ✅ **Done** — `convex/orders.ts` guards every handler on the `by_stripe_event_id` index and stamps `stripeEventId`/`processedAt`; webhook route passes `event.id`. |
| 3 | Refund / cancellation / dispute path | new Convex mutations + `payment_intent.refunded`, `charge.dispute.created` handlers | area/payments, type/feature, severity/blocker | 2–3d | ✅ **Done** — webhook route handles `payment_intent.refunded`/`charge.refunded`/`charge.dispute.created`; `convex/orders.ts` applies refund/dispute idempotently; `emails.sendRefundIssued` + `sendDisputeCreatedAlert`. |
| 4 | Net-30 invoice collections workflow | `convex/orders.ts:148`, `convex/emails.ts` | area/payments, area/email, type/feature, severity/blocker | 1–2d | 🟡 **Partial** — `invoice` payment method + Net-30 invoice PDF (`src/lib/invoice-pdf`) generated and attached via `emails.sendBookingConfirmation`. No automated overdue/dunning collections loop yet. |

### Onboarding correctness

| # | Title | Files | Labels | Estimate | Status — Jul 2026 |
|---|---|---|---|---|---|
| 5 | District state/region hardcoded to TX | `convex/users.ts:128-129` | area/auth, type/bug, severity/blocker | 1d (form + Convex) | ✅ **Done** — `completeOnboarding` reads `districtState`/`state` (uppercased) and throws "State is required when creating a district" if missing (`convex/users.ts:381-387`). |
| 6 | Returning-user district row not created on re-onboarding | `convex/users.ts:49-91` | area/auth, type/bug, severity/blocker | 0.5d | ✅ **Done** — `upsertDistrictForAdmin` runs even for an already-onboarded district user (`convex/users.ts:420-427`), creating or patching the district row. |
| 7 | needs.create broken for multi-admin districts | `convex/needs.ts:48` | area/auth, type/bug, severity/blocker | 0.25d | ✅ **Done** — `findDistrictForUser` scans `adminIds.includes(user._id)` instead of array-equality (`convex/needs.ts:35-38`, used by `create`:198). |
| 8 | seed.ts shipped in prod code with dummy clerk IDs | `convex/seed.ts` | area/security, type/bug, severity/blocker | 0.25d | ✅ **Done** — `assertSeedAllowed` gates on `ALLOW_DEMO_SEED=true` + `DEMO_SEED_SECRET`; uses `seed:<email>` markers claimable via `claimSeededDemoAccount`. |

### Legal & compliance

| # | Title | Files | Labels | Estimate | Status — Jul 2026 |
|---|---|---|---|---|---|
| 9 | Privacy policy is placeholder text | `src/app/privacy/page.tsx:23` | area/legal, type/legal, severity/blocker | 1d eng + counsel | ✅ **Done** — real policy copy (data collected/used, K-12 audience statement, contact). Versioned via `src/lib/legal`. Counsel sign-off still advisable. |
| 10 | Terms of service is placeholder text | `src/app/terms/page.tsx:23` | area/legal, type/legal, severity/blocker | 1d eng + counsel | ✅ **Done** — real ToS copy + `TERMS_VERSION` stamp. Counsel sign-off still advisable. |
| 11 | No cookie / consent banner | new component | area/legal, type/feature, severity/blocker | 0.5d | ✅ **Done** — `src/components/shared/cookie-consent.tsx` mounted in `src/app/layout.tsx`. |
| 12 | Data Processing Agreement (DPA) for K-12 districts | counsel-led | area/legal, type/legal, severity/blocker | counsel | 🟡 **Partial** — self-serve `/dpa` intake + procurement/DPA request tracking (`ProcurementRequestList`, district settings) shipped. The DPA document itself remains counsel-led. |

### Security

| # | Title | Files | Labels | Estimate | Status — Jul 2026 |
|---|---|---|---|---|---|
| 13 | Wire Upstash Redis for rate limiter | `src/lib/rate-limit.ts:50`, `docs/OPERATIONS.md:83` | area/security, type/feature, severity/blocker | 0.5–1d | ✅ **Done (code)** — `createUpstashRateLimiter` used when `UPSTASH_REDIS_REST_URL`+`_TOKEN` present, memory fallback otherwise. Provisioning the prod Upstash creds is the remaining ops step (see #49). |
| 14 | Add CSP / security headers | `next.config.ts` | area/security, type/feature, severity/blocker | 0.5d | ✅ **Done** — full CSP + Referrer-Policy, X-Content-Type-Options, X-Frame-Options (prod), Permissions-Policy in `next.config.ts`. |
| 15 | Verify Clerk JWT issuer domain in Convex prod | `convex/auth.config.ts` (env audit) | area/security, type/cleanup, severity/blocker | 0.25d | 🟡 **Partial** — `auth.config.ts` reads `CLERK_JWT_ISSUER_DOMAIN` and degrades gracefully when unset. Actually confirming the prod value is set correctly is an env-audit task (ops). |
| 16 | Production env audit (all required vars set) | Vercel + Convex dashboards | area/ops, type/cleanup, severity/blocker | 1d | ⬜ **Open (ops)** — dashboard/config task; not verifiable from code. `scripts/beta-launch.mjs` + `marketplace-data-hygiene.ts` audit data, not env vars. |

## P1 — Polish (must fix for credibility)

### Honest UI

| # | Title | Files | Labels | Estimate | Status — Jul 2026 |
|---|---|---|---|---|---|
| 17 | Hardcoded "Action Required: District 204" banner on educator dash | `src/app/dashboard/educator/page.tsx:39-40` | area/dashboards, type/bug, severity/major | 0.5d | ✅ **Done** — banner removed; educator dashboard renders only live KPIs/pipeline from `dashboards.educatorKpis`/`educatorPipeline`. |
| 18 | Hardcoded fake "Up Next" calendar events on educator dash | `src/app/dashboard/educator/page.tsx:168-170` | area/dashboards, type/bug, severity/major | 0.5d | ✅ **Done** — "Up Next" now shows a truthful "No upcoming bookings" empty state (`educator/page.tsx:171-176`). |
| 19 | "Inbox Zero" tile is hardcoded | `src/app/dashboard/educator/page.tsx:188-194` | area/dashboards, type/bug, severity/major | 0.25d | ✅ **Done** — replaced by a real Messages link tile routing to `/dashboard/messages`. |
| 20 | "Accepting Offers" toggle is local state only | `src/app/dashboard/educator/page.tsx:60-77` | area/dashboards, type/bug, severity/major | 0.5d | ✅ **Done** — toggle persists via `educators.updateMyProfile({ availabilityStatus })` and seeds from `getMine` (`educator/page.tsx:27-43`). |
| 21 | Hardcoded "1 pending contract for Lincoln High" banner on district dash | `src/app/dashboard/district/page.tsx:42-45` | area/dashboards, type/bug, severity/major | 0.5d | ✅ **Done** — banner removed; district dashboard is fully driven by `dashboards.districtKpis`/`districtPipeline`. |
| 22 | "Export Report" button shows alert("Report downloaded successfully!") | `src/app/dashboard/district/page.tsx:64` | area/dashboards, type/feature, severity/major | 0.5d | ✅ **Done** — button/alert removed from the district dashboard. |
| 23 | District "Recent Placements" always renders MOCK_RECENT_PLACEMENTS | `src/app/dashboard/district/page.tsx:153` | area/dashboards, type/bug, severity/major | 0.5d | ✅ **Done** — mock array gone; "Recent Placements" shows a "No placements yet" empty state (`district/page.tsx:144-149`). |
| 24 | District pipeline "Candidates" column always shows — | `src/app/dashboard/district/page.tsx:124` | area/dashboards, type/bug, severity/major | 0.5d | ✅ **Done** — `dashboards.districtPipeline` returns a real `candidates` count (non-withdrawn proposals per need); UI renders `row.candidates ?? 0`. |
| 25 | "Saved Educators" button shows alert | `src/app/browse/page.tsx:109` | area/marketplace, type/feature, severity/minor | 0.5d | ✅ **Done** — no alert; `Saved Educators (N)` toggles a real `showSavedOnly` filter backed by `localStorage` (`k12gig_saved_educators`). See #41 for the per-account upgrade. |
| 26 | "Save Educator" button shows alert on profile | `src/app/browse/[educatorId]/page.tsx:182` | area/marketplace, type/feature, severity/minor | (combined with #25) | ✅ **Done** — `saveEducator()` writes to `localStorage`, no alert. Same per-account caveat as #25/#41. |
| 27 | Quick-filter chips "Local to Me" + "Instant Book" don't filter | `src/app/browse/page.tsx:65-73` | area/marketplace, type/bug, severity/minor | 0.25d | 🟡 **Partial** — both now filter via `filterEducatorRoster` (`quick_local` = district region match, `quick_instant` = open + has rate). The chip label is still literally "Instant Book" in `QUICK_FILTERS` while the active-chip reads "Ready to request"; the rename to "Ready to Request" is pending a product decision. |
| 28 | educators.listForBrowse returns hardcoded rating 4.5 | `convex/educators.ts:102-103` | area/marketplace, type/bug, severity/major | 0.5d | ✅ **Done** — `listForBrowse` computes `overallRating`/`reviewCount` from the real `reviewSummary(...)` over the `reviews` table (`convex/educators.ts:116`). |
| 29 | "Profile Conversions" KPI stub | `src/app/dashboard/educator/page.tsx:84` | area/dashboards, type/cleanup, severity/minor | 0.25d | ✅ **Done** — stub removed; the KPI banner shows only real Pipeline + Total Earnings tiles. |

### Educator self-service

| # | Title | Files | Labels | Estimate | Status — Jul 2026 |
|---|---|---|---|---|---|
| 30 | Educator can't edit profile fields beyond credentials | `src/app/dashboard/educator/settings/page.tsx:53`, `convex/educators.ts:154` | area/dashboards, area/marketplace, type/feature, severity/blocker | 2–3d | ✅ **Done** — settings page now edits business name, headline, bio, presenter bio, years, rates, availability, grades, support areas, engagement types, coverage regions, team, display name, and email prefs, via `educators.updateMyProfile` + `users.updateMyName`/`setEmailReminderPreference`. |

### Marketplace navigation

| # | Title | Files | Labels | Estimate | Status — Jul 2026 |
|---|---|---|---|---|---|
| 31 | No path from educator profile to their gigs | `src/app/browse/[educatorId]/page.tsx` | area/marketplace, type/feature, severity/major | 1d | ♻️ **Superseded** — educator self-listed gigs were retired from the UI in favor of the district-driven RFP/needs model. The profile still has a Services tab (`gigs.listActiveByEducatorForDistrict`) that degrades to a "Request availability" CTA. The original "link to my gigs" concern is moot. |

### Notifications & email

| # | Title | Files | Labels | Estimate | Status — Jul 2026 |
|---|---|---|---|---|---|
| 32 | District settings copy says "coming soon" but email is wired | `src/app/dashboard/district/settings/page.tsx:47` | area/dashboards, type/cleanup, severity/minor | 0.5d copy fix | ✅ **Done** — copy replaced with "saved for this browser while account-level preferences are being connected." (Prefs are still browser-local — see #33.) |
| 33 | Build notification preferences UI | new component | area/dashboards, area/email, type/feature, severity/major | 1d | 🟡 **Partial** — educator email opt-out **persists** to Convex (`users.setEmailReminderPreference`, wired in educator settings). District settings notification toggles are still `useState`-only (browser-local), not saved per account. |
| 34 | Header notification dropdown / inbox | new component | area/dashboards, type/feature, severity/major | 1d | ⬜ **Open** — `convex/notifications.ts` (`listUnread`/`unreadCount`/`markRead`) exists and is populated by messages/proposals/needs, but **no UI consumes `api.notifications`**. Only the Messages nav badge (messages-only) surfaces activity. No header bell/dropdown. |
| 35 | Email for order accepted / completed / review request / payout | `convex/emails.ts` + scheduler hooks | area/email, type/feature, severity/major | 1–2d | 🟡 **Partial** — shipped: booking confirmation, new message, new proposal, **proposal accepted**, refund issued, dispute created, new-need alert, profile-completion reminders. Missing: order-completed / review-request emails and payout emails (payouts don't exist — see #1). |

### Marketing site

| # | Title | Files | Labels | Estimate | Status — Jul 2026 |
|---|---|---|---|---|---|
| 36 | Replace randomuser.me hot-link on landing | `src/app/page.tsx:114,133` | area/marketplace, type/cleanup, severity/minor | 0.25d | ✅ **Done** — no `randomuser.me` reference remains in `src/app/page.tsx`. (Minor leftover: `next.config.ts` still allow-lists `randomuser.me` in `images.remotePatterns`/CSP — harmless, worth pruning.) |
| 37 | Add "How It Works" educator-side anchor | `src/components/shared/site-footer.tsx:18` | area/marketplace, type/cleanup, severity/minor | 0.25d | ✅ **Done** — footer links `/#for-educators` and `/#for-districts`; both sections exist on the landing page (`page.tsx:149,226`). |
| 38 | Add About / Pricing / Help pages | new pages | area/marketplace, type/feature, severity/minor | 0.5d | ✅ **Done** — `src/app/about/page.tsx`, `src/app/pricing/page.tsx` (+ test), `src/app/help/page.tsx` all exist and are linked from the footer. |

## P2 — Nice-to-have (post-launch)

| # | Title | Labels | Estimate | Status — Jul 2026 |
|---|---|---|---|---|
| 39 | Stripe Tax for taxable services | area/payments, type/feature | 1d | ⬜ **Open** — no `automatic_tax`/`tax_behavior` usage. |
| 40 | Customer Portal for payment-method management | area/payments, type/feature | 1d | ⬜ **Open** — no `billing_portal`/customer-portal code. |
| 41 | Saved educators / favorites (real implementation) | area/marketplace, type/feature | 2d | 🟡 **Partial** — favorites work via `localStorage` (`k12gig_saved_educators`) but are **not per-account** (not persisted to Convex, don't sync across devices). See new-issues section. |
| 42 | Real Checkr UI in educator settings | area/auth, type/feature | 1d | ✅ **Done** — `credentials-section.tsx` drives `/api/checkr/invite`, gated by `isCheckrEnabled()` launch flag; verification state flows back via `educators.updateVerificationFromWebhook`. |
| 43 | Reviews aggregation + display on educator profile | area/marketplace, type/feature | 1d | ✅ **Done** — profile Reviews tab renders `reviews.listForEducator` with average + per-review cards; directory ratings come from `reviewSummary` (ties in with #28). |
| 44 | Multi-admin district invites | area/auth, type/feature | 1–2d | ⬜ **Open** — schema supports `adminIds[]` and multi-admin need linkage, but there is no invite/join flow. |
| 45 | Google Maps region selector | area/marketplace, type/feature | 1d | ⬜ **Open** — coverage is taxonomy chips + `RegionCoverageLink`, no map selector. |
| 46 | Educator video intros | area/marketplace, type/feature | 2d | 🟡 **Partial** — `videoIntroUrl`/`hasVideoIntro` plumbed through schema, directory card, and profile, but there is no upload UI; the profile shows a non-functional "Play Video" placeholder. |
| 47 | Geographic radius search/sort | area/marketplace, type/feature | 1d | ⬜ **Open** — region filtering is discrete taxonomy match; no radius/distance search. |
| 48 | Vercel Analytics or PostHog wired | area/ops, type/feature | 0.25d | ⬜ **Open** — no `@vercel/analytics` or `posthog` integration. |
| 49 | Production rate-limit-config env vars | area/ops, type/feature | 0.5d | ✅ **Done (code)** — `STRIPE_CHECKOUT_RATE_LIMIT_MAX`/`_WINDOW_MS` read via `readPositiveNumber` in `src/lib/rate-limit.ts`. Setting the values in prod is the ops half. |
| 50 | Backup automation (scheduled convex export) | area/ops, type/feature | 0.5d | 🟡 **Partial** — `docs/BACKUPS.md` documents the manual export/restore procedure; no scheduled/automated export cron exists yet. |
| 51 | Mobile-responsive dashboard layouts | area/dashboards, type/cleanup | 1d | 🟡 **Partial** — dashboards/browse/profile carry responsive breakpoints and mobile CTAs, but a full mobile QA pass across every dashboard is not confirmed. |
| 52 | Dark mode (next-themes already installed) | area/dashboards, type/feature | 1d | ⬜ **Open** — `theme-provider.tsx` is hard-pinned to `forcedTheme="light"`, `enableSystem={false}`. Infra present, feature deliberately off. |
| 53 | Convex preview deployments per branch | area/ops, type/feature | 0.5d | ⬜ **Open (ops)** — CI/deploy config task, not present in repo. |

## Resolved in the July 2026 launch push

Numbered items now **Done** or **Superseded**, grouped by the area that closed them. This is the audit trail for the recent feature push + merged PR #10.

**Payments (`convex/orders.ts`, `src/app/api/stripe/webhook/route.ts`, `src/lib/invoice-pdf.ts`)**
- ✅ #2 Webhook idempotency · ✅ #3 Refund/cancellation/dispute path · 🟡 #4 Net-30 invoicing (PDF + email done; dunning pending).

**Onboarding correctness (`convex/users.ts`, `convex/needs.ts`)**
- ✅ #5 District state no longer hardcoded · ✅ #6 Returning-user district row upsert · ✅ #7 Multi-admin `needs.create` · ✅ #8 seed.ts gated.

**Legal (`src/app/privacy`, `src/app/terms`, `cookie-consent.tsx`, `/dpa`)**
- ✅ #9 Privacy · ✅ #10 Terms · ✅ #11 Cookie banner · 🟡 #12 DPA intake (doc still counsel-led).

**Security / ops (`next.config.ts`, `src/lib/rate-limit.ts`)**
- ✅ #13 Upstash limiter (code) · ✅ #14 CSP/security headers · 🟡 #15 Clerk issuer (code ready, env audit pending) · ✅ #49 rate-limit env vars.

**Honest dashboards (`src/app/dashboard/educator/page.tsx`, `src/app/dashboard/district/page.tsx`, `convex/dashboards.ts`)**
- ✅ #17 · #18 · #19 · #20 (educator) · ✅ #21 · #22 · #23 · #24 (district) · ✅ #29 KPI stub. All hardcoded banners/tiles/mock arrays replaced with live Convex data or truthful empty states.

**Marketplace (`convex/educators.ts`, `src/app/browse/*`, `src/lib/filter-educators.ts`)**
- ✅ #25 / #26 Save-educator alerts → localStorage favorites · 🟡 #27 quick filters now filter (naming pending) · ✅ #28 real ratings in `listForBrowse` · ✅ #43 reviews display · ✅ #42 Checkr UI · ♻️ #31 educator gigs retired (RFP model).

**Educator self-service (`src/app/dashboard/educator/settings/page.tsx`, `convex/educators.ts`)**
- ✅ #30 Full profile editing.

**Email / notifications (`convex/emails.ts`, `convex/crons.ts`, `users.setEmailReminderPreference`)**
- ✅ #32 copy fix · 🟡 #33 prefs UI (educator persists; district local) · 🟡 #35 transactional emails (most done) · daily profile-completion reminder cron shipped.

**Marketing site (`src/app/page.tsx`, `site-footer.tsx`, `src/app/{about,pricing,help}`)**
- ✅ #36 randomuser hot-link removed · ✅ #37 educator anchor · ✅ #38 About/Pricing/Help pages.

## Newly discovered (not in original audit)

Issues surfaced while auditing the July push. Each is real in the current branch.

| Title | Files | Labels | Description |
|---|---|---|---|
| One-way messaging not enforced server-side | `convex/messages.ts:27` (`send`) | area/security, area/marketplace, type/bug, severity/major | `messages.send` has no role/relationship guard — any authenticated user can DM any other `users` row. Educators could initiate/cold-DM districts, contradicting the "districts message educators first" one-way model the UI implies. Needs a server-side relationship/role check (e.g. only district→educator initiation, or an existing conversation). |
| RFP→payment bridge missing | `convex/proposals.ts:221` (`accept`) | area/payments, type/feature, severity/blocker | Accepting a proposal sets the need to `placed` and notifies the educator but creates **no order/invoice**. Orders are only created from gig checkout (`orders.createFromGig`) or Stripe webhook (`createFromWebhook`), both gig-keyed (`order.gigId`). With educator self-listed gigs retired (#31), the RFP flow has no path to payment at all. |
| Super-admin silent auto-promote | `src/components/admin/admin-shell.tsx:45-52` | area/security, type/cleanup, severity/minor | `AdminShell` auto-calls `claimManualSuperadmin` on mount for any non-superadmin viewing `/dashboard/admin`. It is allowlist-gated server-side (`MANUAL_SUPERADMIN_EMAILS`, throws `Forbidden` otherwise), but the silent auto-escalation on page view is a footgun — prefer an explicit "Claim admin access" action. |
| Educators can't preview their own public profile | `convex/educators.ts:147` (`getProfileForDistrict`), `src/app/browse/[educatorId]/page.tsx:70-74` | area/marketplace, type/bug, severity/minor | The only profile read is district-only; the browse profile page redirects any `educator` viewer to `/dashboard/board`. So the "View public profile" link in educator settings (`settings/page.tsx:317`, href `/browse/<id>`) bounces the educator away — they can never see their own live profile. Needs an educator self-view query/route. |
| Favorites are localStorage-only, not per-account | `src/app/browse/page.tsx:34-42`, `src/app/browse/[educatorId]/page.tsx:176-183` | area/marketplace, type/feature, severity/minor | Saved educators live in `localStorage` (`k12gig_saved_educators`) — not persisted to Convex, not synced across devices or teammates. Overlaps P2 #41; real implementation needs a `favorites` table keyed by user. |
| Stale "Instant Book" naming | `src/app/browse/page.tsx:48` (`QUICK_FILTERS`) | area/marketplace, type/cleanup, severity/minor | The quick-filter chip still reads "Instant Book" (semantics: available + has rate) while its active-chip label reads "Ready to request." Inconsistent copy; rename to "Ready to Request" is pending a product decision (ties to #27). |
| `next.config.ts` still allow-lists randomuser.me | `next.config.ts:39,17` | area/ops, type/cleanup, severity/minor | The landing hot-link was removed (#36) but `images.remotePatterns` and the CSP `img-src` still permit `https://randomuser.me`. Harmless but should be pruned. |

## Already shipped (FYI — do not re-create)

These were addressed during the audit week itself and are merged/in-flight on PR #1 (and re-verified as still present on the current branch):

- ✅ Webhook idempotency code (#2 above) — landed in commit `0ccc020`; confirmed live in `convex/orders.ts` (`by_stripe_event_id`). Linear could add a "Done" issue tagged to this commit so the audit trail is complete.
- ✅ Pricing centralization in `convex/pricing.ts` — same commit.
- ✅ Brand rename `EduGig → K12Gig` (Bucket 1, display only) — landed in commit `d11267e`.
- ⏸ Brand rename Bucket 2 (domain) and Bucket 3 (email) — deferred until `k12gig.com` is registered + Resend verified. (Note: CSP/auth already reference `clerk.k12gig.com`.)

### Also shipped since the original "Already shipped" list (July 2026 push + PR #10)

- ✅ Refund/dispute handling (#3), CSP + security headers (#14), cookie consent (#11), real Privacy/Terms (#9/#10).
- ✅ Honest dashboards — all hardcoded banners/tiles/mock data removed (#17–24, #29).
- ✅ Full educator profile self-editing (#30) + Clerk-native avatar/logo upload.
- ✅ Real directory ratings + reviews display (#28, #43); Checkr background-check UI (#42).
- ✅ Shared Gig Board + full educator lockout from `/browse`; full-page proposal flow with resume upload.
- ✅ RFP alerts to matching educators (in-app + email) + daily profile-completion reminder cron; email opt-out.
- ✅ PR #10 launch-readiness libs: `need-publish-policy.ts`, `need-status.ts`, `filter-educators.ts`, `match-need.ts`, `active-beta-copy.ts`, `marketplace-cleanup-safety.ts`, `marketplace-data-hygiene.ts`, `scripts/beta-launch.mjs`.
