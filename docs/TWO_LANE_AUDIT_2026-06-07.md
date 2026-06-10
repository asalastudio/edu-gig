# K12Gig Two-Lane Audit — Chris Demo + June 15 Beta Readiness

**Audit date:** June 7, 2026  
**Assumed beta launch date:** June 15, 2026  
**Local target audited:** `http://localhost:3010`  
**Checkpoint:** `/tmp/k12gig-checkpoints/20260607-100008`  
**Implementation checkpoint:** `/tmp/k12gig-implementation-checkpoints/20260607-111623`  
**Current branch observed:** `main`

## Executive status

**Chris demo lane:** Ready locally after the auth issuer fix. The seeded district account lands on `/dashboard/district`, `/browse` shows Sarah, Miguel, and Alana, Sarah's service checkout is invoice / PO-only, and booking reaches the confirmation state.

**June 15 beta lane:** Still blocked on production environment readiness. Code, tests, and build pass, but production domain/auth/Convex env values are not installed locally and cannot yet be verified against `https://k12gig.com`.

## Verification evidence

| Check | Result |
|---|---|
| `npm run lint` | Pass |
| `npm run typecheck` | Pass |
| `npm run test` | Pass — 23 files / 111 tests |
| `npm run build` | Pass |
| `npm run check:env:beta` | Fail, expected launch-readiness failure |
| `npm audit --omit=dev` | Fail — 4 moderate advisories remain in Next's nested PostCSS dependency; npm reports no direct fix available |

Implementation verification added:

- Launch flags default to invoice / PO-only and Checkr-deferred.
- Pricing page no longer says card checkout is available today by default.
- Gig checkout hides Stripe card payment unless `NEXT_PUBLIC_ENABLE_CARD_CHECKOUT` is explicitly enabled.
- Educator credentials section hides Checkr start CTAs unless `NEXT_PUBLIC_ENABLE_CHECKR` is explicitly enabled.
- Next config sets a portable `turbopack.root` at this repo.

Dev server logs also showed repeated auth/config warnings while the browser audit ran:

```text
Clerk: Refreshing the session token resulted in an infinite redirect loop.
This usually means that your Clerk instance keys do not match.
```

and repeated Turbopack/root resolution errors:

```text
Can't resolve 'tailwindcss' in '/Users/jordanrichter/Projects/Clients/EduGig'
```

Screenshots captured in `/tmp/k12gig-audit-20260607/`:

- `home-desktop.png`
- `browse-signed-out-desktop.png`
- `signin-district-mobile.png`
- `auth-factor-mobile.png`
- `onboarding-signed-out-mobile.png`

## Lane 1 — Chris demo readiness

### P0 — Resolved locally: Convex auth issuer matched to dev Clerk

The local/dev Convex deployment used by `NEXT_PUBLIC_CONVEX_URL` was pointed at the active dev Clerk issuer. After that change, the seeded district account signs in and reaches `/dashboard/district`.

Verified local Chris path:

- District sign-in: `demo-district+clerk_test@example.com` with test code `424242`
- Landing route: `/dashboard/district`
- Browse roster: Sarah Jenkins, Miguel Rodriguez, Dr. Alana Williams
- Sarah profile: seeded services visible
- Checkout: invoice / PO active, Stripe card option hidden
- Submit: invoice booking confirmation shown

Production beta still needs a separate issuer pairing:

- Use production Clerk live keys.
- Set Convex production `CLERK_JWT_ISSUER_DOMAIN=https://clerk.k12gig.com`.
- Do not mix dev Clerk keys with Convex configured for production Clerk.

### P1 — Clerk auth branding still says EduGig

The email-code factor step says:

```text
Check your email
to continue to EduGig
```

This appears in `/tmp/k12gig-audit-20260607/auth-factor-mobile.png`.

Recommendation:

- Update Clerk application name / branding in the active Clerk instance to `K12Gig`.

### P1 — Public demo pages are usable

Unauthenticated routes loaded successfully:

- `/`
- `/browse`
- `/login`
- `/pricing`
- `/about`
- `/help`
- `/dpa`
- `/privacy`
- `/terms`
- `/post`

Signed-out browse gating is clear: the public directory does not expose live profiles and asks for district sign-in.

### P1 — Mobile auth has measurable horizontal overflow

Mobile auth routes at 390px viewport measured `scrollWidth=408`, `clientWidth=390`. It is subtle visually, but should be cleaned up before beta if mobile auth is part of the invite flow.

## Lane 2 — June 15 beta readiness

### P0 — Beta env audit still fails

Current `npm run check:env:beta` fails because:

- `CONVEX_DEPLOY_KEY` is missing locally.
- `NEXT_PUBLIC_APP_URL` points to localhost.
- `NEXT_PUBLIC_CONVEX_URL` points to the known dev Convex deployment.
- Clerk keys are test-mode/development keys.
- Convex production still needs `CLERK_JWT_ISSUER_DOMAIN` set/verified.

Recommended launch interpretation:

- This is not a TypeScript or test problem.
- This is the honest production/beta environment blocker.

### P0 — Production dependency advisories mostly remediated

Completed in the working tree:

- `npm audit fix` upgraded vulnerable Clerk/transitive packages.
- Next and `eslint-config-next` upgraded from `16.1.6` to `16.2.7`.
- Critical and high advisories are no longer reported by `npm audit --omit=dev`.

Residual risk:

- `npm audit --omit=dev` still reports 4 moderate advisories from `next -> postcss@8.4.31`.
- npm reports no direct fix available for that nested dependency at this time.

Recommendation:

- Track the residual moderate advisory in the launch go/no-go.
- Re-run audit before production deploy in case Next publishes a newer patched release.

### P0 — Production auth/domain path is not ready to verify locally

The runbook expects:

- `https://k12gig.com`
- production Clerk live keys
- Convex production issuer `https://clerk.k12gig.com`
- production Convex deployment URL
- `CONVEX_DEPLOY_KEY`

The currently running local app is still using localhost, dev Convex, and Clerk development keys.

### P1 — Resolved in working tree: invoice-only beta copy and checkout

Pricing and checkout now default to invoice / PO-only for the controlled beta. Stripe card checkout remains in the code path, but is hidden unless `NEXT_PUBLIC_ENABLE_CARD_CHECKOUT` is explicitly enabled.

### P1 — Resolved in working tree: Checkr deferred by default

Educator credential settings now show a deferred Checkr message by default and do not show the "Start background check" button unless `NEXT_PUBLIC_ENABLE_CHECKR` is explicitly enabled.

### P1 — Resolved in working tree: portable Next/Turbopack root

`next.config.ts` now sets `turbopack.root = process.cwd()`. The local dev server starts without the prior parent-root warning.

### P1 — Resolved in Chris-facing docs: June 15 launch posture

Updated:

- `docs/CLIENT_LAUNCH_READINESS_CHRIS.md`
- `docs/CLIENT_LAUNCH_READINESS_EMAIL.md`
- `docs/CLIENT_LAUNCH_READINESS_REQUEST.md`
- `docs/CLIENT_RESPONSE_TRACKER.csv`
- `docs/CHRIS_DEMO_WALKTHROUGH.md`
- `docs/BETA_LAUNCH_RUNBOOK.md`

Internal ClickUp/AiOS files may still need a separate ops refresh if they will be used after this code cleanup.

## Change classification

| Bucket | Files / changes |
|---|---|
| A. Demo-critical code | `src/app/gigs/[gigId]/page.tsx`, `src/app/pricing/page.tsx`, `src/components/educator/credentials-section.tsx`, `src/lib/launch-flags.ts` |
| B. Demo data / seed reliability | External Convex dev env issuer alignment; no seed files changed in this pass |
| C. Production-readiness / env docs | `scripts/check-env.mjs`, `docs/BETA_LAUNCH_RUNBOOK.md`, `docs/CLIENT_LAUNCH_READINESS_CHRIS.md`, `docs/CLIENT_LAUNCH_READINESS_EMAIL.md`, `docs/CLIENT_LAUNCH_READINESS_REQUEST.md`, `docs/CLIENT_RESPONSE_TRACKER.csv`, `docs/CHRIS_DEMO_WALKTHROUGH.md` |
| D. Safe config / hygiene | `next.config.ts`, `package.json`, `package-lock.json` |
| E. Local agent/tooling artifacts probably not for commit | None added beyond this audit report; existing checkpoint files are outside the repo |

## Recommended next actions

### Before the Chris demo

1. Update Clerk application branding from EduGig to K12Gig in the active Clerk dashboard.
2. Keep the demo Convex issuer paired with the dev Clerk instance for the local Chris demo.
3. Re-run the Chris walkthrough from `docs/CHRIS_DEMO_WALKTHROUGH.md` shortly before the meeting.
4. Use invoice / PO booking as the primary checkout path.

### Before June 15 beta

1. Confirm launch mode in writing: invite-only invoice / PO controlled beta.
2. Install/verify production domain, production Clerk keys, production Convex URL, and Convex issuer.
3. Add/verify `CONVEX_DEPLOY_KEY` for deployment.
4. Record the residual moderate Next/PostCSS audit advisory as accepted or wait for a patched Next release.
5. Keep card checkout disabled unless production Stripe keys/webhooks are verified.
6. Keep Checkr disabled unless Checkr API key, webhook secret, and package are configured.
7. Configure monitoring owner and `NEXT_PUBLIC_SENTRY_DSN`.
8. Run final smoke test against the deployed production URL, not localhost.

## Suggested commit groups

1. `feat: polish K12Gig marketplace demo journey`
   - invoice-only checkout default, Checkr defer UI, launch flag tests
2. `docs: add Chris launch readiness packet`
   - June 15 readiness packet, email draft, response tracker, demo walkthrough
3. `chore: tighten env audit and app config for beta readiness`
   - beta-aware env checker, portable Turbopack root
4. `chore: upgrade beta-critical dependencies`
   - Clerk/transitive audit fix, Next/ESLint config upgrade
5. `docs: record two-lane demo and beta audit`
   - this audit report and residual blocker classification
