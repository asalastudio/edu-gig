# Operations Runbook

Short reference for deploying, rotating secrets, handling incidents, and toggling features. See also [BACKUPS.md](./BACKUPS.md).

## Environment variables

See `.env.local.example` for the full list. One-liner for each:

- `NEXT_PUBLIC_APP_URL` — canonical origin used for sitemap, email links, and OG images.
- `NEXT_PUBLIC_CONVEX_URL` — Convex deployment URL. Unlocks all live data; without it pages fall back to demo mode.
- `NEXT_PUBLIC_CONVEX_SITE_URL` — Convex HTTP actions / site URL for webhook-facing routes when needed.
- `CONVEX_DEPLOY_KEY` — deploy-time credential for `npx convex deploy` (production only).
- `CONVEX_WEBHOOK_SHARED_SECRET` — secret that the Stripe webhook route presents to `api.orders.createFromWebhook` (legacy orders).
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk client-side key. Unlocks sign-in UI.
- `CLERK_SECRET_KEY` — Clerk server key. Required for authenticated API routes and middleware.
- `CLERK_JWT_ISSUER_DOMAIN` — production Clerk issuer Convex uses to verify JWTs (must match the Clerk production instance).
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL`, `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` — Clerk route and redirect settings.
- `NEXT_PUBLIC_USE_CONVEX_BROWSE` — must be `true` for the live consultant directory.
- `NEXT_PUBLIC_ENABLE_LEGACY_CHECKOUT` — keep `false` for launch. Checkout creation stays retired unless this and card checkout are both on.
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` — legacy only; not required for the off-platform payment launch.
- `NEXT_PUBLIC_SENTRY_DSN` — turns on Sentry error reporting.
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL` — transactional email credentials and sender identity. Required for proposal/engagement alerts.
- `CHECKR_API_KEY`, `CHECKR_WEBHOOK_SECRET`, `CHECKR_PACKAGE` — background-check invite and webhook configuration (deferred unless Checkr is enabled).
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` — production-grade shared rate limiting.
- `ALLOW_DEMO_SEED` — must remain unset or `false` in production; set to `true` only when intentionally running `convex/seed.ts` against a dev deployment.
- `DEMO_SEED_SECRET` — dev-only shared secret required by `convex/seed.ts` when `ALLOW_DEMO_SEED=true`; keep unset in production.

## Deploy procedure

1. Confirm all required env vars are set in Vercel and Convex dashboards.
   ```bash
   npm run check:env -- --production
   vercel env ls production
   npx convex env list --prod
   ```
2. Deploy Convex first:
   ```bash
   npx convex deploy   # prod is the default; CLI no longer accepts --prod
   ```
3. Merge to `main`. Vercel deploys the Next.js app automatically.
4. Smoke-test by hitting `/`, `/pricing`, `/browse`, `/dashboard/educator/my-gigs`, `/dashboard/educator/contract-hub`, and the district dashboard as each role. Confirm checkout pages stay retired.

## Rotating secrets

Rotate at least annually, and immediately on any suspected leak.

- **Stripe** — generate new keys in the Stripe dashboard → update `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in Vercel and Convex env → redeploy → revoke old keys.
- **Clerk** — dashboard → API Keys → rotate publishable + secret → update Vercel env → redeploy. Sessions survive rotation.
- **Convex** — `npx convex auth rotate` for the deploy key; webhook shared secret is rotated by changing both the Vercel env (`CONVEX_WEBHOOK_SHARED_SECRET`) and Convex's secret storage. Rotate the webhook secret before the deploy key so the next deploy picks up both.
- **Checkr / Resend** — rotate in their dashboards and update env; currently no live code paths, so impact is zero.

## Incident triage: "checkout failed"

Work outside-in:

1. **Stripe dashboard → Events** — confirm the session was created and whether a `checkout.session.completed` fired.
2. **Stripe dashboard → Webhooks** — check the delivery log to `/api/stripe/webhook`. Any 4xx/5xx indicates our side failed; retries continue for 3 days.
3. **Vercel → Logs** — filter by `/api/stripe/` for server errors, rate-limit 429s, or signature failures.
4. **Convex logs** — look for `orders.createFromWebhook` errors, especially `CONVEX_WEBHOOK_SHARED_SECRET` mismatches.
5. **Sentry** (if `NEXT_PUBLIC_SENTRY_DSN` is set) — grouped error reports with stack traces.

Common causes:
- Webhook secret mismatch after rotation.
- `NEXT_PUBLIC_CONVEX_URL` empty on the Vercel deployment.
- User hitting the 10/min rate limit on the checkout endpoint.

## Feature flags (cheatsheet)

Flags live in [src/lib/flags.ts](../src/lib/flags.ts). Precedence: cookie > env var > default.

- **Env override** (persistent, all users):
  ```
  FLAG_CONVEX_LIVE_BROWSE=true
  FLAG_EXPERIMENTAL_MESSAGING=true
  FLAG_PREMIUM_TIER_UI=true
  ```
- **Cookie override** (dev, per-browser). Set in devtools:
  ```
  document.cookie = "k12gig_flag_convex_live_browse=1; path=/";
  ```
  Use `0` to force-off even if env is on.

## Rate limiting

`/api/stripe/checkout` is capped at 10 requests per minute per Clerk user id (or IP when signed out). Webhooks are intentionally uncapped — Stripe retries are legitimate traffic.

When users hit the cap they receive:
- HTTP 429
- `{ "error": "Too many requests" }`
- `Retry-After` header with seconds until the next available token.

**Raising limits temporarily:** set `STRIPE_CHECKOUT_RATE_LIMIT_MAX` and/or `STRIPE_CHECKOUT_RATE_LIMIT_WINDOW_MS` in Vercel, redeploy, then restore the defaults after the incident.

**In-memory caveat:** without `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`, the limiter is per-process, so rate limits are approximate across multiple Vercel Function instances. Production should use Upstash.
