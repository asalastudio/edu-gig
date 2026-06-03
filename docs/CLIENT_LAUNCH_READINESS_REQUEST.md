# K12Gig Launch Readiness Request

Prepared for: Chris Brown and the AiOS / client team  
Prepared by: Asala launch team  
Date: May 28, 2026  
Target launch date: May 29, 2026

## Executive Summary

The application is close enough for a controlled beta, client review, or marketing/demo launch, but it should not be treated as a fully functional paid production marketplace until the items below are resolved or explicitly deferred by the client.

Recommended path for May 29: launch a controlled beta with production authentication, production data, and guarded access, while disabling or tightly controlling paid checkout until payment, order lifecycle, and compliance items are complete.

## Decision Needed Today

Please confirm one of the following launch modes:

| Option | Recommendation | What it means |
|---|---:|---|
| Controlled beta / client review | Recommended | Share the production app link with selected users, validate onboarding, browse, dashboards, and client data. Keep payment workflows limited or manual. |
| Paid production marketplace | Not recommended yet | Requires all P0 launch requirements below to be completed, verified, and approved before public use. |

## Client Requests

These are the items needed from Chris Brown / the client team or an authorized vendor owner.

| Priority | Request | Needed From | Due | Why It Matters |
|---|---|---|---|---|
| P0 | Confirm launch mode: controlled beta or paid production marketplace | Chris Brown / client owner | May 28, 2026 | This determines whether checkout, bookings, and public access can go live tomorrow. |
| P0 | Provide production Stripe configuration: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, webhook endpoint approval for `/api/stripe/webhook` | Stripe account owner | May 28, 2026 | Checkout cannot safely process real payments without production Stripe keys and webhook verification. |
| P0 | Confirm production Clerk project and issuer domain | Clerk account owner | May 28, 2026 | Convex production currently points at a development Clerk issuer. Production authentication must use the production issuer. |
| P0 | Confirm production app URL / canonical domain | Client / domain owner | May 28, 2026 | Required for auth redirects, Stripe return URLs, email links, sitemap, and production sharing. |
| P0 | Approve legal launch posture: Terms, Privacy, DPA request process, payment/refund language | Client + counsel | May 28, 2026 | K-12 procurement, student-data posture, district agreements, and payment terms need explicit approval. |
| P0 | Confirm production support inbox and sender email | Client / ops owner | May 28, 2026 | Needed for transactional emails, support escalation, DPA requests, and launch communications. |
| P0 | Confirm whether Checkr background checks launch now or are deferred | Client / ops owner | May 28, 2026 | If Checkr is active, credentials and webhook verification are required. If deferred, related CTAs should be hidden or marked unavailable. |
| P0 | Approve production seed data: districts, educators, demo/client records, and initial gigs | Client / project owner | May 28, 2026 | The production app needs real records and role coverage before client sharing. |
| P1 | Provide monitoring owner and Sentry DSN | Client / technical owner | May 29, 2026 | Errors need an accountable owner during launch. |
| P1 | Provide Upstash Redis credentials for shared rate limiting | Client / technical owner | May 29, 2026 | Checkout rate limiting is approximate without shared Redis in production. |
| P1 | Confirm payout, refund, dispute, and invoice operations owner | Client / finance owner | May 29, 2026 | Stripe Connect payouts are not fully implemented, so finance operations need a manual process if payments are accepted. |

## Engineering Items Remaining

These are owned by the implementation team, but they affect launch readiness and should be visible to the client.

| Priority | Item | Current Risk | Required Before Paid Production |
|---|---|---|---|
| P0 | Upgrade vulnerable production dependencies | Current audit reports production vulnerabilities, including critical/high advisories in key packages. | Yes |
| P0 | Validate district eligibility before Stripe checkout | A signed-in non-district user can currently start checkout; order creation can fail after payment. | Yes |
| P0 | Wire order lifecycle UI | Backend order lifecycle exists, but UI does not expose the full accept, complete, cancel, refund, and review flow. | Yes |
| P0 | Establish real booking path from educator profile to gigs/checkout | Browse/profile pages do not yet create a clean path into real gig checkout. | Yes |
| P0 | Fix Checkr invite auth path or defer Checkr UI | Checkr invite route is not currently using the authenticated Convex client pattern. | Required if Checkr launches |
| P0 | Confirm refund and dispute handling | Operational and webhook handling needs final verification before real payments. | Yes |
| P1 | Fix lint and e2e launch gates | Typecheck, unit tests, and build pass, but lint/e2e need cleanup before they can be relied on as release gates. | Recommended |
| P1 | Remove local absolute Turbopack root path | Local machine path is present in Next config and should be made portable. | Recommended |
| P1 | Replace hardcoded/demo profile and dashboard values | Some marketplace/profile/dashboard data is still placeholder or non-live. | Recommended for external launch |
| P1 | Remove production build network dependency on Google Fonts | Build currently depends on fetching Google Fonts. | Recommended |

## Environment Status

Verified present in Vercel production:

- Clerk public/secret keys and redirect URLs
- Convex deploy key and public Convex URL
- App URL
- Convex webhook shared secret

Missing or not yet visible in Vercel production:

- Stripe production secret and webhook secret
- Upstash Redis REST URL/token
- Resend API key and sender email
- Checkr API key, webhook secret, and package
- Sentry DSN
- Convex site URL, if required for HTTP/webhook-facing actions

Convex production finding:

- The production Convex `CLERK_JWT_ISSUER_DOMAIN` currently points to the development Clerk issuer. This must be updated before a real production auth launch.

## Verification Snapshot

Completed May 28, 2026:

| Check | Result | Notes |
|---|---|---|
| TypeScript typecheck | Passed | No type errors found. |
| Unit tests | Passed | 102 tests passed across 16 files. |
| Production build | Passed with network access | Build fails without network because Google Fonts are fetched during build. |
| Targeted app lint | Failed | One real app lint error plus one warning. Full lint also scans generated/worktree folders. |
| E2E smoke tests | Mostly passed | 12 passed, 11 skipped, 1 outdated homepage smoke expectation failed. |
| Production dependency audit | Failed | 16 production vulnerabilities reported. |
| Production env audit | Incomplete | Vendor credentials and production auth issuer need updates. |

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
- [ ] Checkout is disabled, hidden, or manually controlled unless production Stripe is fully verified.
- [ ] Checkr is disabled or clearly deferred unless fully configured.
- [ ] Demo/placeholder data is either replaced or approved for client review.
- [ ] Support inbox and escalation owner are confirmed.
- [ ] Post-launch blocker list is tracked in ClickUp.

## Recommended Client Response

Please reply with:

1. Launch mode: controlled beta or paid production marketplace.
2. Production domain / app URL.
3. Stripe production credentials owner and webhook approval.
4. Clerk production issuer/domain confirmation.
5. Support inbox and email sender confirmation.
6. Checkr decision: enable now or defer.
7. Legal/payment approval status.
8. Approval for the initial production data set.

