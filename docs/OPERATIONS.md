# Operations Runbook

Short reference for deploying, rotating secrets, handling incidents, and toggling features. See also [BACKUPS.md](./BACKUPS.md).

## Environment variables

See `.env.local.example` for the full list. One-liner for each:

- `NEXT_PUBLIC_APP_URL` — canonical origin used for sitemap, Stripe redirect URLs, and OG images.
- `NEXT_PUBLIC_CONVEX_URL` — Convex deployment URL. Unlocks all live data; without it pages fall back to demo mode.
- `CONVEX_DEPLOY_KEY` — deploy-time credential for `npx convex deploy`.
- `CONVEX_WEBHOOK_SHARED_SECRET` — secret that the Stripe webhook route presents to `api.orders.createFromWebhook`.
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk client-side key. Unlocks sign-in UI.
- `CLERK_SECRET_KEY` — Clerk server key. Required for authenticated API routes and middleware.
- `STRIPE_SECRET_KEY` — Stripe server key. Unlocks `/api/stripe/checkout`.
- `STRIPE_WEBHOOK_SECRET` — used to verify Stripe's signature on `/api/stripe/webhook`.
- `NEXT_PUBLIC_SENTRY_DSN` — turns on Sentry error reporting.
- `NEXT_PUBLIC_USE_CONVEX_BROWSE` — legacy flag, gates the Convex-backed `/browse` page. See also the `convex_live_browse` feature flag in [flags.ts](../src/lib/flags.ts).
- `CHECKR_API_KEY`, `RESEND_API_KEY` — scaffolded for future use; no code paths depend on them yet.
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` — reserved for production-grade rate limiting (see [rate-limit.ts](../src/lib/rate-limit.ts)).

## Deploy procedure

1. Confirm all required env vars are set in Vercel and Convex dashboards.
2. Deploy Convex first:
   ```bash
   npx convex deploy --prod
   ```
3. Merge to `main`. Vercel deploys the Next.js app automatically.
4. Smoke-test by hitting `/`, `/browse`, and the dashboard routes as each role.

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
  document.cookie = "edugig_flag_convex_live_browse=1; path=/";
  ```
  Use `0` to force-off even if env is on.

## Rate limiting

`/api/stripe/checkout` is capped at 10 requests per minute per Clerk user id (or IP when signed out). Webhooks are intentionally uncapped — Stripe retries are legitimate traffic.

When users hit the cap they receive:
- HTTP 429
- `{ "error": "Too many requests" }`
- `Retry-After` header with seconds until the next available token.

**Raising limits temporarily:** not yet implemented — TODO to expose `STRIPE_CHECKOUT_RATE_LIMIT_MAX` / `STRIPE_CHECKOUT_RATE_LIMIT_WINDOW_MS` env vars and have `stripeCheckoutLimiter` read them at import time. For now, a code change + redeploy is required.

**In-memory caveat:** the current limiter is per-process, so rate limits are approximate across multiple Vercel Function instances. Swap for Upstash Redis (env vars already reserved) before a major launch.
