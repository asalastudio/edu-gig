# Production Environment Audit

Date: 2026-05-02, refreshed August 2026 for the off-platform payment launch.

This audit supports production/env/vendor readiness. Launch no longer requires live Stripe checkout. It does require production Clerk JWT verification, a production Convex URL, live browse enabled, demo seeding disabled, and (for email alerts) a verified Resend sender.

## Launch configuration that must be proven (do not guess)

Run `npm run check:env:beta` against production env, then confirm in Vercel and Convex dashboards:

| Item | Launch expectation |
|------|--------------------|
| Clerk JWT issuer | Production issuer (not `*.clerk.accounts.dev`) in Convex `CLERK_JWT_ISSUER_DOMAIN` |
| Convex URL | Production deployment, not the known unique-eagle-379 dev deployment |
| Resend | `RESEND_API_KEY` + verified `RESEND_FROM_EMAIL` for proposal/engagement mail |
| Demo seed | `ALLOW_DEMO_SEED` unset/false on production Convex |
| Live browse | `NEXT_PUBLIC_USE_CONVEX_BROWSE=true` |
| Legacy checkout | `NEXT_PUBLIC_ENABLE_LEGACY_CHECKOUT` unset/false |

Stripe, Checkr, and Upstash remain optional for this launch model. Report remaining vendor setup as needed; do not treat local `.env.local` as production proof.

## Related runbooks

- **`BETA_LAUNCH_RUNBOOK.md`** — step-by-step for `k12gig.com` controlled beta (DNS → Clerk → deploy → data)
- **`LAUNCH_EXECUTION_RUNBOOK.md`** — client ops / HubSpot / ClickUp

## Vercel production env

Checked with:

```bash
vercel env ls production
```

Present in production:

- `CLERK_JWT_ISSUER_DOMAIN`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CONVEX_DEPLOY_KEY`
- `CONVEX_WEBHOOK_SHARED_SECRET`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- `NEXT_PUBLIC_USE_CONVEX_BROWSE`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_CONVEX_URL`

Missing or not visible in production:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `CHECKR_API_KEY`
- `CHECKR_WEBHOOK_SECRET`
- `CHECKR_PACKAGE`
- `NEXT_PUBLIC_SENTRY_DSN`
- `NEXT_PUBLIC_CONVEX_SITE_URL`

## Convex production env

Checked with:

```bash
npx convex env list --prod
```

Present:

- `CLERK_JWT_ISSUER_DOMAIN`
- `CONVEX_WEBHOOK_SHARED_SECRET`

Finding:

- `CLERK_JWT_ISSUER_DOMAIN` currently points at the dev Clerk issuer (`regular-wolf-65.clerk.accounts.dev`). Production must point at the production Clerk issuer before launch.

## Local production audit

Checked with:

```bash
npm run check:env -- --production
```

The local `.env.local` is intentionally dev/sandbox-shaped:

- `NEXT_PUBLIC_CONVEX_URL` points at the dev Convex deployment.
- Clerk keys are test/dev keys.
- Stripe key is test-mode.
- `CONVEX_DEPLOY_KEY` is not present locally.
- Upstash, Resend, Checkr, and Sentry are missing locally.

Do not use local `.env.local` as proof of production readiness.

## Linear follow-up

- `K12-15` — update Convex prod `CLERK_JWT_ISSUER_DOMAIN`.
- Stripe production (`K12-54` / `K12-67`) — superseded for launch; checkout stays retired.
- `K12-57` / `K12-61` — provision Resend and authenticate sending domain.
- `K12-63` — provision Upstash and add REST env vars.
- `K12-64` — provision Checkr.
- `K12-78` — wire/confirm Sentry and monitoring ownership.
