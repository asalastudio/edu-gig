# K12Gig launch meeting — September 3, 2026

This is the current source of truth for today's review with Chris. The goal is to decide whether the September controlled-beta candidate can replace the July production build today, and to name every remaining owner before the deployment starts.

## Executive status

| Surface | Current state | Today’s action |
|---|---|---|
| Production | `k12gig.com` is healthy on commit `ea2c881` from July 9 | Keep serving until the September candidate is reviewed and merged |
| Release candidate | `recovery/august-candidate-2026-09-01` at `7fcaff5` | Review locally, open a current PR, merge, and deploy |
| Candidate scope | 100 files changed from production; two release commits | Treat as a coordinated release, not a hotfix |
| Local review | Running at `http://localhost:3010` against the development Clerk and Convex instances | Use the demo walkthrough and role-specific test accounts |
| Vercel preview | Build is Ready, but protected by Vercel login and missing Preview Convex deployment configuration | Do not use it as Chris’s functional review environment today |
| Production configuration | Domain, production Clerk, production Convex auth, Resend, and the off-platform launch model are present | Reverify flags and smoke-test after deploying the candidate |

## What the September candidate brings live

- Proposal acceptance creates one engagement transactionally and prevents duplicate acceptance/engagement creation.
- District and consultant workspaces gain My Gigs, engagement detail, and Contract Hub document coordination.
- Payment is explicitly arranged directly between the district and consultant; native checkout, ACH, 1099 handling, and legally binding e-signature are out of launch scope.
- Notifications, role-aware auth wrappers, onboarding guards, email-verification handling, legal acceptance, and launch-copy corrections are included.
- Public copy stops promising unverified vetting, reviews, checkout, or platform fees.
- Card checkout and Checkr remain feature-flagged/deferred for this controlled beta.

## Fresh verification evidence

| Check | Result |
|---|---|
| Unit/integration tests | 232 passed across 41 files |
| TypeScript | Passed |
| ESLint | Passed with 0 errors and 294 warnings |
| Dependency audit | 0 production vulnerabilities |
| Production build | Passed with `next build --webpack`; all 40 routes generated |
| Vercel candidate build | Ready on exact commit `7fcaff5` using Turbopack |
| End-to-end suite | 32 passed after correcting the Clerk-bound test origin from `127.0.0.1` to `localhost` |
| Production public smoke | `k12gig.com` loads over SSL and shows no Clerk development banner |

The lint warnings are predominantly unbounded Convex reads and explicit table IDs. They are a controlled-beta scalability concern, not a current compile or runtime failure.

## Must happen today to ship

1. Review the local district and consultant flows with Chris.
2. Confirm the controlled-beta model: direct payment, Contract Hub coordination, and no native signature claim.
3. Confirm the launch audience and whether production founding/demo data may be cleaned and seeded.
4. Confirm who owns support/escalation during the first invite wave.
5. Commit the test-harness and current launch-audit updates.
6. Push the release branch and open a current PR; the existing PR #11 is a stale July branch and is not this release.
7. Require green CI, merge to `main`, and deploy the reviewed commit to production.
8. Run production smoke tests for public pages, both real-email auth paths, onboarding, district browse/post/proposal acceptance, consultant proposal/My Gigs, engagement detail, Contract Hub, and email delivery.
9. Only after explicit approval, run the guarded production data cleanup/seed, then remove the temporary beta-launch secret.

## Chris decisions required in the meeting

| Decision | Why it matters |
|---|---|
| Approve the off-platform payment model | It determines the legal/product story and keeps Stripe outside today’s release |
| Approve controlled-beta invitees | The directory and role workspaces are intentionally gated |
| Approve production seed/cleanup | Cleanup is destructive and must not run on assumption |
| Name the support owner | The first invite wave needs a clear escalation path |
| Confirm legal review owner | Terms, Privacy, and DPA intake exist; counsel/customer approval is still an operational responsibility |
| Confirm status-control semantics | Both engagement participants can currently update engagement and Contract Hub statuses; confirm whether that is acceptable for beta |

## Remaining risks and deferred work

- Production monitoring has no visible Sentry DSN; analytics/alert ownership should be assigned before broadening beyond the controlled beta.
- Upstash is not provisioned, so rate limiting falls back to an in-memory implementation. This is acceptable only for a small controlled cohort.
- Preview deployments do not currently have a functional Convex preview deployment, so branch previews cannot prove signed-in workflows.
- Signed-in automated happy-path coverage is still thin; today’s role walkthrough is a required release gate.
- Several Convex list operations use unbounded `.collect()` calls and will need pagination/index work before meaningful scale.
- The old Linear K12Gig project referenced by repository docs is not present in the current Asala workspace. Pick a current tracking home during the meeting so post-launch work is not lost.

## Review links

- Local candidate: `http://localhost:3010`
- Local district sign-in: `http://localhost:3010/sign-in?intent=district`
- Local consultant sign-in: `http://localhost:3010/sign-in?intent=educator`
- Current production: `https://k12gig.com`
- Stale July PR (reference only): `https://github.com/asalastudio/edu-gig/pull/11`

Use `CHRIS_DEMO_WALKTHROUGH.md` for the click-by-click meeting path and `BETA_LAUNCH_RUNBOOK.md` for the release sequence.
