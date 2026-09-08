# Actual project inventory

Inspected September 8, 2026; package-lock is authoritative for installed dependency versions.

| Area | Observed implementation |
|---|---|
| Framework/runtime | Next.js App Router 16.3.4; React/React DOM 19.2.3; TypeScript 5.9.3; Tailwind CSS 4; Node workstation 22.22.3, Vercel 24.x, existing CI 20 |
| Package manager | npm 10.9.8 locally, committed package-lock.json; npm ci |
| Hosting/deploy | Vercel GitHub integration from asalastudio/edu-gig, main is production; vercel.json invokes scripts/vercel-build.mjs. Baseline production deploys Convex; Preview only runs codegen/build. Official staging uses its own project and exact-key guarded build |
| Auth | @clerk/nextjs 7.4.3, ConvexProviderWithClerk and JWT template named convex. No Clerk user webhook synchronization; app resolves subject and syncs/creates rows through normal users functions/onboarding. No Clerk Organizations/membership API in current product |
| Roles/tenancy | educator, district_admin, district_hr, superintendent, superadmin; districts.adminIds establishes membership; per-resource helper checks owner/member/admin. Some methods scan districts and choose first membership, rather than an active-organization model |
| Database/migrations | Convex 1.44.0, schema.ts, generated API/types, indexes deployed with functions. No SQL/ORM migration system. One-off backfillFromPlacedNeeds and older seed/cleanup functions exist; no reviewed contract version migration exists |
| File storage | Convex _storage; upload URLs then storage IDs attached to resume/credentials/proposals/contracts/avatar rows; query-gated file URL issuance. Bare returned URLs work without session cookies; ownership binding and reauthorization gaps are in the ledger |
| Messaging | Convex messages, pair-keyed conversations; district initiated, consultant replies; realtime useQuery; no standalone chat service |
| Notifications/email | Convex notifications + scheduler.runAfter + internal email actions calling Resend HTTPS API. Resend dependency 6.x is installed but these dispatchers use fetch. Profile reminders use Convex cron; no external queue |
| Integrations/webhooks | Next Stripe checkout/webhook, Checkr invite/webhook and invoice PDF routes; shared secret into backend mutations; launch flags retire/disable payment/background-check flows. No Convex http.ts router. No staged external callbacks registered |
| Observability | Optional browser Sentry (@sentry/nextjs) with 5% tracing; NODE_ENV as environment baseline; no server Sentry initialization observed. Vercel/Convex console logs. Optional Upstash rate-limit path; memory fallback. No durable provider delivery-attempt/retry observability baseline |
| Automated tests | Vitest 4.1.1 + Testing Library; Playwright 1.58.2 public/auth-gate smoke. Baseline 232 tests / 41 files; typecheck passes; lint 294 warnings, 0 errors. Staging adds in-memory convex-test execution, controlled upload failure, posting round-trip and read-only real-auth smoke |

Baseline production commit: `1433830fbedf223b7b0ad6f46656d9b2e81ce754`.
Production deployment: `dpl_69TFnLR1pJReXukXUa1mbPKEgS2U`, Ready, September 3.
Original checkout: recovery/august-candidate-2026-09-01 at `f924be909f05bcfbf40e7eb5fda716ee67299386`; same tree as production baseline. Untracked docs/launch-readiness-audit-2026-07-09/evidence preserved.
Implementation worktree: `/Users/jordanrichter/.codex/worktrees/k12gig-staging-20260908/edugig`.
Branch: `codex/isolated-staging-2026-09-08`.

A baseline lint run while the staging copy was nested inside the original repository accidentally scanned both trees. It was not an application regression: excluding the nested worktree restored 0 errors / 294 warnings. The worktree was then moved outside the original repository to prevent recurrence. Final staging lint has 0 errors / 300 warnings (the added six are explicit-table-ID style warnings in QA fixture code).
