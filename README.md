# K12Gig

Proposal-centered consultant marketplace for K-12 districts. Districts post needs, consultants submit proposals, accepted work becomes an engagement, and Contract Hub coordinates documents. Payment happens off-platform.

## Getting Started

```bash
cd edugig
npm install
npm run convex:dev
npm run dev
```

App default: [http://localhost:3010](http://localhost:3010). Use `npx convex dev` for development; `npx convex deploy` is production only.

## Product spine

District posts need → consultant proposes (resume required) → district accepts → engagement on My Gigs → Contract Hub → off-platform signature and payment.

## Testing

Unit tests: `npm run test`. Typecheck: `npm run typecheck`. Lint: `npm run lint`. E2E: `npm run test:e2e`. Env audit: `npm run check:env` / `npm run check:env:beta`. See [TESTING.md](./TESTING.md) and [docs/PRD.md](./docs/PRD.md).

## Production configuration still needed

Do not treat local `.env.local` as production proof. Before launch, set these in Vercel and Convex production (values stay in those dashboards — do not paste secrets into git):

- Clerk production JWT issuer (`CLERK_JWT_ISSUER_DOMAIN`, expected `https://clerk.k12gig.com`)
- Production Convex URL (not the unique-eagle-379 dev deployment)
- Resend API key and verified `RESEND_FROM_EMAIL` for proposal/engagement alerts
- `ALLOW_DEMO_SEED` unset/false on production Convex
- `NEXT_PUBLIC_USE_CONVEX_BROWSE=true`
- `NEXT_PUBLIC_ENABLE_LEGACY_CHECKOUT` unset/false

Stripe, Checkr, Upstash, and Sentry remain optional for this off-platform payment launch. See [docs/PRODUCTION_ENV_AUDIT.md](./docs/PRODUCTION_ENV_AUDIT.md) and [docs/BETA_LAUNCH_RUNBOOK.md](./docs/BETA_LAUNCH_RUNBOOK.md).
