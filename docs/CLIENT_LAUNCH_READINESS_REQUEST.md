# K12Gig Launch Readiness Request

Prepared for: Chris Brown and the AiOS / client team  
Prepared by: Asala launch team  
Date: June 7, 2026  
Target launch date: June 15, 2026

## Executive Summary

The application is close enough for a controlled beta, client review, or marketing/demo launch, but it should not be treated as a fully functional paid production marketplace until the items below are resolved or explicitly deferred by the client.

Recommended path for June 15: launch an invite-only controlled beta with production authentication, production data, and guarded access. Use invoice / PO booking only by default. Defer live card payments and Checkr unless those production lanes are explicitly configured and approved.

## Decision Needed Today

Please confirm one of the following launch modes:

| Option | Recommendation | What it means |
|---|---:|---|
| Controlled beta / client review | Recommended | Share the production app link with selected users, validate onboarding, browse, dashboards, and client data. Use invoice / PO booking only. |
| Paid production marketplace | Not recommended yet | Requires all P0 launch requirements below to be completed, verified, and approved before public use. |

## Client Requests

These are the items needed from Chris Brown / the client team or an authorized vendor owner.

| Priority | Request | Needed From | Due | Why It Matters |
|---|---|---|---|---|
| P0 | Confirm launch mode: invite-only invoice / PO controlled beta | Chris Brown / client owner | June 10, 2026 | This determines what is safe to share on June 15. |
| P0 | Confirm production app URL / canonical domain | Client / domain owner | June 10, 2026 | Required for auth redirects, email links, sitemap, and production sharing. |
| P0 | Confirm production Clerk project and issuer domain | Clerk account owner | June 10, 2026 | Production authentication must use the production issuer, expected `https://clerk.k12gig.com`. |
| P0 | Confirm production Convex deployment and deploy key owner | Convex project owner / engineering | June 10, 2026 | Required for deploy confidence and production data access. |
| P0 | Approve legal launch posture: Terms, Privacy, DPA request process, invoice/refund language | Client + counsel | June 10, 2026 | K-12 procurement, student-data posture, district agreements, and invoice terms need explicit approval. |
| P0 | Confirm production support inbox and sender email | Client / ops owner | June 10, 2026 | Needed for transactional emails, support escalation, DPA requests, and launch communications. |
| P0 | Approve production seed data: districts, educators, demo/client records, and initial gigs | Client / project owner | June 10, 2026 | The production app needs real records and role coverage before client sharing. |
| P1 | Confirm Checkr is deferred for beta, or provide production Checkr env | Client / ops owner | June 12, 2026 | Checkr CTAs stay hidden unless credentials and webhook verification are ready. |
| P1 | Provide production Stripe configuration only if card payments are re-approved | Stripe account owner | June 12, 2026 | Card checkout stays hidden during invoice / PO beta unless production Stripe is verified. |
| P1 | Provide monitoring owner and Sentry DSN | Client / technical owner | June 12, 2026 | Errors need an accountable owner during launch. |
| P1 | Provide Upstash Redis credentials for shared rate limiting | Client / technical owner | June 12, 2026 | Recommended before a wider invite wave. |
| P1 | Confirm payout, refund, dispute, and invoice operations owner | Client / finance owner | June 12, 2026 | Manual invoice operations apply during beta. |

## Engineering Items Remaining

These are owned by the implementation team, but they affect launch readiness and should be visible to the client.

| Priority | Item | Current Risk | Required Before Paid Production |
|---|---|---|---|
| P0 | Upgrade vulnerable production dependencies | Critical/high advisories have been remediated locally; moderate Next/PostCSS advisory remains with no direct npm fix. | Yes |
| P0 | Validate district eligibility before Stripe checkout | A signed-in non-district user can currently start checkout; order creation can fail after payment. | Yes |
| P0 | Wire order lifecycle UI | Backend order lifecycle exists, but UI does not expose the full accept, complete, cancel, refund, and review flow. | Yes |
| P0 | Establish real booking path from educator profile to gigs/checkout | Local demo path now reaches invoice booking confirmation; production still needs smoke testing on the real URL. | Yes |
| P0 | Fix Checkr invite auth path or defer Checkr UI | Checkr UI is deferred by default; API path still needs production verification before enabling. | Required if Checkr launches |
| P0 | Confirm refund and dispute handling | Operational and webhook handling needs final verification before real payments. | Yes |
| P1 | Fix lint and e2e launch gates | Lint, typecheck, unit tests, and build pass locally; production smoke still needed after deploy. | Recommended |
| P1 | Remove local absolute Turbopack root path | Next config now uses a portable Turbopack root. | Done |
| P1 | Replace hardcoded/demo profile and dashboard values | Some marketplace/profile/dashboard data is still placeholder or non-live. | Recommended for external launch |
| P1 | Remove production build network dependency on Google Fonts | Build currently depends on fetching Google Fonts. | Recommended |

## Environment Status

Expected for June 15 production beta:

- Production Clerk live keys and redirect URLs
- Production Convex deploy key and public Convex URL
- App URL: `https://k12gig.com`
- Convex webhook shared secret

Still missing or not verified in the local beta audit:

- `CONVEX_DEPLOY_KEY`
- Production app URL in local audit
- Production Convex URL in local audit
- Production Clerk live keys in local audit
- Upstash Redis REST URL/token
- Resend API key and sender email
- Sentry DSN
- Stripe production secret and webhook secret, only if card checkout is re-approved
- Checkr API key, webhook secret, and package, only if Checkr is re-approved

Convex production finding:

- Production Convex `CLERK_JWT_ISSUER_DOMAIN` must be verified as `https://clerk.k12gig.com` before production auth launch.

## Verification Snapshot

Completed June 7, 2026:

| Check | Result | Notes |
|---|---|---|
| TypeScript typecheck | Passed | No type errors found. |
| Unit tests | Passed | 111 tests passed across 23 files. |
| Production build | Passed | Next 16.2.7 build completed locally. |
| Lint | Passed | `npm run lint` passed. |
| Browser smoke | Passed locally | District demo account reaches dashboard; browse shows seeded educators; Sarah invoice booking confirms. |
| Production dependency audit | Residual moderate | Critical/high advisories remediated; nested Next/PostCSS moderate advisory remains. |
| Production env audit | Failed honestly | Production deploy key/domain/Convex/Clerk values need updates. |

## Go / No-Go Checklist

Before paid production launch:

- [ ] Client confirms paid production launch mode.
- [ ] Production Stripe keys are installed and webhook delivery is verified.
- [ ] Production Clerk issuer is installed in Convex and Vercel.
- [ ] Production domain and auth redirects are verified.
- [ ] Legal, DPA, payment, refund, and invoice terms are approved.
- [ ] Production support inbox and email sender are active.
- [ ] Production seed data is reviewed and approved.
- [ ] Payment, checkout, webhook, order, cancellation, and refund smoke tests pass.
- [ ] Monitoring and incident owner are active.
- [ ] Critical/high production dependency issues are patched or accepted in writing.

For controlled beta launch:

- [ ] Client confirms controlled beta scope and invited users.
- [ ] Invoice / PO checkout is the active beta payment path.
- [ ] Card checkout stays hidden unless production Stripe is fully verified.
- [ ] Checkr stays hidden/deferred unless fully configured.
- [ ] Demo/placeholder data is either replaced or approved for client review.
- [ ] Support inbox and escalation owner are confirmed.
- [ ] Post-launch blocker list is tracked in ClickUp.

## Recommended Client Response

Please reply with:

1. Launch mode: invite-only invoice / PO beta approved?
2. Production domain / app URL.
3. Production Convex deployment and deploy key owner.
4. Clerk production issuer/domain confirmation.
5. Support inbox and email sender confirmation.
6. Checkr decision: defer or enable with production env.
7. Legal/payment approval status.
8. Approval for the initial production data set.
