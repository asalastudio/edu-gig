# ClickUp Launch Task List

Use this as the ClickUp source list if CSV import is not available. Import-ready CSV is available at `docs/CLICKUP_LAUNCH_TASKS.csv`.

## P0 Client Decisions / Credentials

- Confirm launch mode: controlled beta or paid production marketplace.
- Provide production Stripe configuration and approve `/api/stripe/webhook`.
- Confirm production Clerk issuer/domain and production auth settings.
- Confirm canonical production app URL/domain.
- Approve legal and payment posture.
- Confirm support inbox and sender email.
- Decide whether Checkr launches now or is deferred.
- Approve production seed data.

## P0 Engineering Blockers

- Patch vulnerable production dependencies.
- Validate district eligibility before checkout.
- Wire or explicitly defer order lifecycle UI.
- Establish real booking path from educator profile/browse to gigs or checkout.
- Fix or defer Checkr invite flow.
- Run final production smoke test.
- Send final go/no-go summary.

## P1 Launch Hardening

- Configure monitoring owner and Sentry DSN.
- Configure Upstash shared rate limiting.
- Fix lint and e2e launch gates.
- Remove hardcoded Turbopack root path.
- Replace or approve placeholder profile/dashboard data.

