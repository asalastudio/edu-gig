# Production environment audit

Date: September 3, 2026

This audit reflects live read-only checks against the linked Vercel project, its deployments, the production domain, and the production Convex environment. Secret values are intentionally omitted.

## Release state

| Item | Verified state |
|---|---|
| Production domain | `https://k12gig.com` is live with valid SSL |
| Production deployment | Ready on commit `ea2c881d60c6c6b6e80de182439d89be11e21cb8` from `main` (July 9) |
| September candidate | Ready Vercel build on `7fcaff50e830cd204839984fdbef587ef87abca2` from `recovery/august-candidate-2026-09-01` |
| Candidate runtime review | Use localhost; the branch preview is Vercel-login protected and has no functional Preview Convex deployment configuration |
| Production Clerk | Live runtime shows no development-mode banner |
| Production Convex auth issuer | `https://clerk.k12gig.com` |
| Email configuration | Resend key and sender variables are present in Vercel and Convex production environments |

Production is healthy but does not yet contain the two September release commits. The current production homepage still exposes July-era claims about vetting and platform payment that the candidate corrects.

## Required launch model

The controlled beta is a proposal-centered connection marketplace:

`post need → submit proposal → accept proposal → engagement → Contract Hub`

- Payment is arranged directly between the district and consultant.
- K12Gig does not process cards, ACH, 1099s, or payouts for this launch.
- Contract Hub coordinates documents; it does not claim to provide legally binding electronic signatures.
- Checkr and card checkout stay disabled unless Chris explicitly approves a later lane.

## Vercel production environment

Verified present by environment name:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_CONVEX_URL`
- `NEXT_PUBLIC_CONVEX_SITE_URL`
- `NEXT_PUBLIC_USE_CONVEX_BROWSE`
- `CONVEX_DEPLOY_KEY`
- `CONVEX_WEBHOOK_SHARED_SECRET`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_JWT_ISSUER_DOMAIN`
- Clerk sign-in, sign-up, and redirect path variables
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `NEXT_PUBLIC_ENABLE_CARD_CHECKOUT`
- `NEXT_PUBLIC_ENABLE_CHECKR`

The Vercel CLI lists encrypted secret names but does not return their values through an environment pull. Presence is therefore combined with runtime evidence: the live Clerk UI uses production mode, the domain resolves, and the current production deployment is Ready.

The two public feature flags must be confirmed as `false` in the deployment runtime after the September candidate ships. Their presence alone does not prove their value.

Not present in the production environment inventory:

- `NEXT_PUBLIC_SENTRY_DSN`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

These are not blockers for a very small controlled cohort, but they are real monitoring and rate-limit durability gaps. Assign an owner and due date before expanding access.

## Convex production environment

Verified present without exposing secret values:

- `CLERK_JWT_ISSUER_DOMAIN=https://clerk.k12gig.com`
- `CONVEX_WEBHOOK_SHARED_SECRET`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

The previous audit finding that production Convex still used the Clerk development issuer is resolved.

Before destructive production data work, separately verify:

- `ALLOW_DEMO_SEED` is unset or false.
- `BETA_LAUNCH_ENABLED` is enabled only for the approved launch window.
- `BETA_LAUNCH_SECRET` is temporary, is never copied into documentation, and is removed immediately after cleanup/seed.

## Release-time verification

Run this sequence from the exact reviewed release commit:

```bash
git status
npm test
npm run typecheck
npm run lint
npm run test:e2e
npm audit --omit=dev
vercel --prod
```

After deployment, verify:

- `https://k12gig.com` loads with no SSL or Clerk development warning.
- Test OTP `424242` does not work in production.
- Real-email district signup, onboarding, dashboard, browse, post, proposal acceptance, engagement, and Contract Hub work.
- Real-email consultant signup, onboarding, proposal, My Gigs, engagement, and Contract Hub work.
- Proposal and engagement emails arrive from the verified sender.
- Card checkout and Checkr remain unavailable for the controlled-beta launch.
- Production logs show no repeating auth, Convex, webhook, or mail errors.

Do not treat local `.env.local` as production proof. It intentionally points at development Clerk and Convex instances.

## Related documents

- `CHRIS_LAUNCH_MEETING_2026-09-03.md` — current decision and release brief
- `BETA_LAUNCH_RUNBOOK.md` — deployment and guarded data steps
- `CHRIS_DEMO_WALKTHROUGH.md` — role-by-role meeting walkthrough
