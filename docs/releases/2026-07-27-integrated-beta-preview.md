# K12Gig integrated beta preview

This branch combines the July 6–7 Chris-feedback and UX work with the stacked
July 9 launch-safety work. It is intended for preview and controlled-beta
review only. It does not authorize a production deployment, a data cleanup, or
an unrestricted paid-marketplace launch.

## Integration record

- Base: `origin/main` at `a596c30`
- First source: `claude/k12-main-repo-check-b5ln4f` through `3c5d313`
- Second source: `codex/phase-one-launch-readiness` through `d590b98`
- Ancestry: `a596c30` → `3c5d313` → `d590b98`
- Method: two `--ff-only` integrations in ancestry order
- Conflicts: none
- Dropped or duplicated commits: none

The July 9 branch is stacked directly on the July 6–7 branch. Reordering or
cherry-picking selected commits would create unnecessary overlap in
`convex/needs.ts`, `convex/schema.ts`, browse/profile surfaces, the Gig Board,
and shared educator-card/profile mapping.

## Chris feedback traceability

Authoritative client source: `Reply-to-Chris-2026-07-02.md`. The AIOS Hub says
there are four open questions, but the reply contains three. No later written
Chris response resolving those questions was found.

| Chris feedback | Status | Implementation | Verification / remaining decision |
|---|---|---|---|
| Ask district-vs-educator only once; retain the distinct district job-role question | Addressed | `eaa44b7`; `src/app/onboarding/page.tsx`, `src/lib/onboarding.ts` | Integrated onboarding flow keeps the workspace intent separate from district role. Requires preview sign-up smoke with real Clerk configuration. |
| Rename “Primary service region” to “Location by region” and show the coverage map in onboarding | Addressed | `1f826e6`, refined by `dc2d53f`; `src/app/onboarding/page.tsx`, `src/components/shared/region-coverage-link.tsx`, `src/lib/region-coverage.ts` | Static rendering and production build pass; preview visual check required. |
| Rename “Open my workspace” to “Review my district dashboard” | Addressed | `1f826e6` / `dc2d53f`; `src/lib/onboarding.ts`, `src/app/onboarding/page.tsx` | Exact label and `/dashboard/district` destination are present. |
| Rename “Create Request” to “Post a Need” throughout the active workflow | Addressed | `1f826e6`, `dc2d53f`, later navigation work including `fcbd4b4`; `src/lib/onboarding.ts`, `src/app/post/page.tsx`, site header/footer, district dashboard | Active CTA and page terminology are consistent. |
| Route the onboarding “Post a staffing need” choice directly to `/post` | Addressed; client confirmation still desirable | `src/lib/onboarding.ts::DISTRICT_FIRST_ACTIONS` and `destinationForFirstAction`; onboarding completion routing in `src/app/onboarding/page.tsx` | The faster direct route is implemented. This was one of the three questions in the draft reply and no later written Chris answer was found. |
| Launch UI should support only Freelance Consulting; preserve future data-model options | Addressed for the district need-posting workflow; client confirmation still desirable | `dc2d53f`; `src/app/post/page.tsx` fixes `engagementType` to `consulting` and does not expose a selector. `src/lib/taxonomy.ts` preserves permanent/substitute values for future use. `531baf0` / `3c5d313` add the educator-profile classification without cluttering directory cards. | The implementation chose “hide the field,” one of the alternatives Jordan asked Chris to confirm. Educator profile setup still permits educators to classify their broader engagement modes, so this is not a global taxonomy deletion. |
| Two short buyer/seller intro videos | Deferred by explicit proposal | The July 2 reply explicitly allowed these to slip to v0.5.0; no video implementation is included. | Chris still needs to choose screen-capture/voiceover versus on-camera before production work is scheduled. Not a controlled-beta acceptance blocker. |

## Later launch-safety traceability

The July 9 launch-readiness audit is later evidence about what can safely be
shown after the client-feedback UX work.

| July 9 finding | Status | Implementation and tests |
|---|---|---|
| Materially empty needs could publish | Addressed | `45beeb6`, `d9d1b42`; `src/lib/need-publish-policy.ts`, `convex/needs.ts`, `src/app/post/page.tsx`; unit policy tests and `e2e/post-need.spec.ts`. Incomplete work is a draft, not an open listing. |
| “Credentials reviewed” could appear without reviewed evidence | Addressed | `c46a323`; `src/lib/map-convex-educator-profile.ts`, browse/profile UI; mapper tests. |
| Support-type filter could return off-category profiles | Addressed | `6a45f2e`; `src/lib/filter-educators.ts`, `src/app/browse/page.tsx`; filter tests. |
| QA/test marketplace records could remain visible | Partially addressed until production audit | `b8cf30b`, `80f1943`, `d590b98`; preview-first, digest-bound, fail-closed cleanup tooling and safety tests. No cleanup has been run. Production export, audit review, explicit confirmation, and post-cleanup smoke remain required. |
| Checkout inputs/errors lacked accessible relationships | Addressed locally | `7ca7b77`; shared input and checkout changes with component and E2E coverage. Preview visual/assistive-tech review remains advisable. |
| Help copy contradicted controlled-beta behavior | Addressed | `7ca7b77`; `src/lib/active-beta-copy.ts`, Help/Pricing/Checkout/sidebar surfaces and tests. |
| Production role workflows were unverified | Not addressed locally | Requires production/preview Clerk and Convex configuration plus safe district and educator accounts. |

## Schema, data, and environment review

The combined schema changes are additive:

- optional user avatar storage and reminder fields;
- optional educator business/presenter/team fields;
- optional credential storage IDs while retaining legacy `documentUrl`;
- a new `draft` need status plus optional `updatedAt`;
- optional proposal attachment fields.

No table or index is removed. Existing rows remain valid because new fields are
optional and existing status variants remain accepted. The new `draft` status
must be deployed to the matching Convex preview backend before exercising draft
creation.

The UX branch also adds a reminder cron and storage-backed uploads. A preview
must therefore use a compatible Convex deployment; a frontend-only preview
pointed at an older backend is insufficient for authenticated workflow sign-off.

Marketplace cleanup is not a migration and must not run automatically. The
`beta-launch:cleanup` script is deliberately a dry-run alias. Any eventual
confirmed cleanup requires a production export, exact candidate review,
candidate digest, explicit confirmation, and a separate authorization.

Required preview environment:

- preview Clerk publishable/secret keys and matching Convex JWT issuer;
- preview Convex URL/site URL and a deployment containing this schema/functions;
- application URL/redirects for the Vercel preview;
- card checkout and Checkr flags unset or false.

Resend, Sentry, and shared rate limiting are recommended before a wider invite
wave. Stripe and Checkr credentials are not required for this invoice/PO-only,
Checkr-deferred preview.

## Auth branding follow-up

The visible authentication vendor is **Clerk**, not Convex. Convex accepts the
Clerk JWT and stores application profile/role data; it does not render the
login UI.

Current state: **partially complete, and sufficient to evaluate in preview**.

- `/sign-in` and `/sign-up` embed Clerk's React components inside K12Gig pages;
  they do not redirect users to a standalone Convex or Clerk-hosted login page.
- The pages retain the K12Gig header/footer, apply K12Gig form styling through
  `src/lib/clerk-appearance.ts`, and override the primary Clerk copy to say
  K12Gig in `src/components/providers.tsx`.
- Clerk still owns the inner authentication, recovery, verification, OAuth,
  session, and MFA UI. `UserButton` also opens Clerk's account-management
  surface. Depending on Clerk instance configuration and subscription, that
  surface can retain Clerk branding.
- The code cannot prove which Clerk plan is paid for. Clerk's current published
  pricing associates removal of Clerk branding with its Business plan, while a
  production/custom domain is configured separately at the instance/domain
  level. The actual account, plan entitlement, production domain, and branding
  dashboard settings must be checked rather than inferred from “paid plan.”
- Educator name editing is presented in the K12Gig settings UI and writes to
  Convex through `users.updateMyName`. It does **not** update Clerk's first/last
  name, so the two identity stores can diverge. District settings still rely on
  Clerk's `UserButton` account UI. This is a bounded follow-up, not complete
  identity synchronization.

Auth-branding follow-up acceptance criteria:

1. K12Gig visual identity and naming remain present through sign-in, sign-up,
   email verification, password recovery, OAuth callback/error, and any enabled
   MFA/passkey path.
2. No redirect or modal presents a confusing differently branded vendor
   experience; any provider/security disclosure that remains is intentional.
3. Name/profile edits occur in K12Gig UI for both roles and update Clerk plus
   Convex through a single authenticated server-owned flow, with retry or
   reconciliation behavior for partial failure.
4. Email/identifier, password, MFA, session revocation, and recovery stay owned
   by Clerk or an equivalently secure server flow; branding work must not
   weaken verification, redirect allowlists, CSRF/session protections, or
   account-recovery safeguards.
5. Recovery and error states are keyboard/screen-reader usable, focus-managed,
   and tested at mobile and desktop sizes.
6. Preview uses a dedicated non-production Clerk application/domain or other
   explicitly approved safe configuration paired to preview Convex.

This does not block the public, signed-out preview. It is a controlled-beta
gate if the preview still displays unapproved Clerk branding or if profile-name
consistency is part of beta acceptance. No Clerk settings or secrets were
changed in this integration.

### ANSAR Family reference comparison

Read-only reference: the current `origin/main` of
`/Users/jordanrichter/Projects/Clients/Ansar Family/ansar-platform`.

K12Gig already shares the architectural baseline:

- embedded Clerk components inside app-owned sign-in/sign-up routes;
- `ConvexProviderWithClerk` supplies the verified Clerk session token to
  Convex;
- app-owned role/profile records live in Convex;
- redirects are constrained to internal destinations.

ANSAR's newer hardening adds three reusable patterns K12Gig does not yet have:

1. A stronger, app-native branded auth shell (`AnsarSignInShell`) that contains
   Clerk through sign-in/sign-up and recovery states. K12Gig has its normal
   header/footer and styled form card, but not the same purpose-built,
   end-to-end auth shell treatment. This is code plus Clerk dashboard
   configuration, not configuration-only.
2. A server-owned `requireVerifiedClerkIdentity` boundary. ANSAR derives
   subject/email/name from the Convex-verified JWT, requires
   `identity.emailVerified === true`, and accepts no browser-supplied Clerk
   identity fields. K12Gig checks for an authenticated identity, but
   `completeOnboarding` does not fail closed on a missing/unverified email and
   can store a placeholder email. Matching ANSAR requires code, tests, and Clerk
   session-token claims (`email`, `email_verified`, audience `convex`) plus a
   matching issuer.
3. App-owned name preservation. ANSAR's current upsert refreshes verified email
   and activity but does not overwrite an existing application name from the
   Clerk name on every login. K12Gig similarly keeps its app name after
   onboarding, but its K12Gig name editor updates only Convex. The narrow delta
   is an explicit ownership contract: Convex/app profile names are canonical;
   Clerk may be updated intentionally for account display, but login upserts
   must never overwrite the app-owned name. This requires a small code/test
   follow-up, not merely plan configuration.

Plan/config prerequisites remain separate: verify Clerk branding-removal
entitlement, production/custom domain, app name/logo/email templates, enabled
methods, OAuth redirect allowlists, and preview-versus-production instance
separation. A paid subscription alone does not prove any of these settings.

Decision: this comparison does not block the signed-out PR preview. The verified
identity boundary and an explicit name-ownership/synchronization contract should
block inviting controlled-beta users who will create or edit real profiles.
The deeper visual-shell polish can remain a bounded follow-up if the preview
shows no confusing vendor-branded transition and Chris accepts the current
embedded treatment.

## Verification evidence

Disposable integrated-clone and dedicated integration-worktree verification on
2026-07-27:

- `npm ci` — completed from the lockfile; npm reported 20 total dependency
  advisories (2 low, 8 moderate, 10 high).
- `npx convex codegen` — generated the missing `crons` API declaration and
  passed Convex's generated-code TypeScript check using the configured
  development deployment. No production deployment or data was targeted.
- `npm run typecheck` — passed.
- `npm run test` — 37 files, 200 tests passed.
- `npm run lint` — passed.
- `npm run build` — passed with Next.js 16.2.7.
- `npm run test:e2e` — 13 passed, 12 skipped. Public smoke, invoice-only
  checkout behavior, incomplete-need draft preservation, SEO, webhook rejection,
  and signed-out error routes passed. Authenticated role flows remain skipped
  without configured safe accounts.
- `npm audit --omit=dev` — reported 14 runtime-tree advisories (1 low, 6
  moderate, 7 high), including advisories affecting Next.js 16.2.7, PostCSS,
  Sharp, Convex/WebSocket dependencies, Sentry/OpenTelemetry, and transitive
  URI/glob packages. Dependency remediation is intentionally not mixed into
  this integration PR; the high-severity runtime findings are a public
  production no-go gate.
- `git diff --check origin/main...HEAD` — passed.

Before controlled-beta approval, the PR preview must additionally pass:

1. Preview deployment health and public-route smoke.
2. District sign-up/onboarding, direct Post a Need route, draft/publish rules,
   directory filtering, profile credential truth, invoice/PO request, messages,
   and district need detail.
3. Educator sign-up/onboarding, Gig Board, proposal with optional attachment,
   profile/settings, credentials, and messages.
4. Read-only marketplace-data audit against the intended dataset; no confirmed
   cleanup.
5. Confirmation that preview Vercel and preview Convex/Clerk are paired and are
   not using production data.

## Release decision

- Preview release: **go**, after the branch is pushed and Vercel builds it.
- Controlled beta: **conditional go** after the authenticated preview checks
  above pass and Chris confirms the two implemented choices (direct `/post` and
  hidden consulting-only field).
- Unrestricted public paid production: **no-go**. Live card/refund/payout
  operations, Checkr, reviewed production data cleanup, authenticated production
  smoke, legal/finance approval, monitoring/rate limiting, dependency-advisory
  disposition, and explicit production-deploy authorization remain open.
