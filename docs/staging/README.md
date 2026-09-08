# Official isolated K12Gig staging

Stable application URL: **https://k12gig-staging.vercel.app**. This is a separate Vercel project, not an alias of production. Reviewer access uses normal Clerk sign-in and an explicit Clerk-user allowlist, enforced by both Next middleware and Convex authentication entry points. Production `k12gig.com` was not changed.

`staging.k12gig.com` remains a hostname follow-up: k12gig.com uses Cloudflare nameservers (lamar/uma), and no Cloudflare DNS credentials were available in this execution. No domain was purchased or nameservers changed. If that alias is later added, update the exact resource manifest, both provider environments, Clerk redirects and evidence; do not merely add an alias and assume isolation.

## Resource map (non-secret)

| Component | Staging | Production / exclusion |
|---|---|---|
| Frontend | Vercel `k12gig-staging`, `prj_Vpy7lyVtwojNT1wBri26KaRni59D` | `edu-gig`, `prj_IP8sPfVJTKtWDaAjpX4IUUkweZrI` |
| Team | Asala `team_CGyACzn1BhcZitDAKUiZRzax` | Same owning team; separate project/envs |
| Backend/database/storage/scheduler | Convex `reminiscent-eagle-756`, reference `staging-review`, type dev, no expiration | `descriptive-bass-5` (production); existing personal dev `unique-eagle-379` untouched |
| Backend endpoint | `https://reminiscent-eagle-756.convex.cloud` | Frontend/server share this exact endpoint |
| HTTP-actions resource | `https://reminiscent-eagle-756.convex.site` | No Convex HTTP routes in current app |
| Authentication | Clerk development `ins_3CcGU4eLSlRRv1oQgKNzr9mGlfN`, `https://regular-wolf-65.clerk.accounts.dev` | Production issuer `https://clerk.k12gig.com` |
| Memberships | `users.role`, `districts.adminIds`, `educators.userId` in staging Convex | No Clerk Organizations integration |
| Email | Captured rendered payloads in staging `qaEmailCaptures`; provider test verification codes | No staging Resend key, no external delivery |
| Jobs | Staging Convex scheduler; profile reminder cron disabled | No external queue/worker resource |
| Stripe / Checkr | Flags false, keys absent; webhook routes remain unconfigured | No callbacks registered to production or staging |
| Monitoring | Separate Vercel project logs and Convex deployment logs/captures | Sentry/Upstash credentials absent; no shared telemetry destination |
| Search engines | X-Robots-Tag, metadata noindex/nofollow, robots disallow | Access protection is independent of noindex |

Clerk development already held 19 identities; they were not copied, modified or granted staging access. Ten new synthetic identities were added. Existing development identities outside the allowlist cannot access staging data. This reuses a non-production authentication instance; it is not a newly created Clerk application.

The staging project's Vercel “production” target is its stable publishing slot. It does not target the production K12Gig project. Vercel SSO is not required for reviewers; Clerk reviewer authorization protects the application and backend. No paid plan or add-on was purchased. Builds/functions/storage use the existing Vercel Pro and Convex account allowances and metered usage; no fixed incremental billing amount was established. Real QA inbox delivery, separate Sentry telemetry and Cloudflare DNS each require their own approved configuration.

## Access and accounts

Use the **private** `.qa-private/ACCOUNT-ACCESS.md` and `.qa-private/accounts.json` in the implementation worktree. The Markdown roster contains aliases, starting states and access instructions; the JSON contains generated credentials. These files are mode 0600, under a mode 0700 directory, ignored by Git and excluded from Vercel upload. Do not paste them into tickets, PRs, chat or screenshots. Transfer credentials to the approved secrets manager before distributing access beyond this workstation.

Required aliases: district-a, consultant-a, district-b, consultant-b, fresh-district, fresh-consultant. Additional existing product roles/scenarios: district-teammate (`district_hr`), review-admin (`superadmin`), consultant-unavailable, consultant-reviewed. These are actual Clerk identities with normal Convex records, not role switches or fake authentication. Fresh accounts have onboarded=false and no district/profile record. Other profiles/memberships are synthetic starting fixtures.

Clerk's documented `+clerk_test` development identities use test verification codes and suppress code delivery. Passwords are generated randomly, never hardcoded in the application. See [Clerk test identities](https://clerk.com/docs/guides/development/testing/test-emails-and-phones). Controlled real inboxes were not supplied; real email transport/recovery delivery is not claimed verified. Google OAuth is not the QA access path.

## Repeatable commands

Run from this branch/worktree with its private `.env.local`:

```sh
npm ci
npm run staging:check
npm run staging:status
npm run staging:seed
npm run staging:reset -- --confirm=RESET_IDENTIFIED_QA_FIXTURES
npm run staging:seed
node scripts/staging/cli.mjs capture-smoke
node scripts/staging/cli.mjs emails
npm test
npm run typecheck
npm run lint
npm run staging:smoke
```

Seed checks local identifiers, deploy-key target, live Clerk instance, actual provider identities, and an internal backend environment proof. The backend independently checks its built-in CONVEX_CLOUD_URL, issuer, origin, capture mode and exact resource IDs. Missing/mismatched/production identifiers fail before fixture writes. Old production/demo cleanup commands are not used or enabled.

Seed is idempotent. Its atomic database transaction records exact fixture IDs; duplicate concurrent seed actions clean up only their own unused uploaded PDFs. Reset deletes only the recorded 32 fixture records/files. Accounts, districts, profiles, synthetic review evidence and unrelated records survive. Reset refuses to orphan reviewer-created dependents, uses bounded safety scans, cancels matching pending scheduled jobs, and invalidates delayed capture when its source no longer exists. A repeated reset returns zero deleted. It does not reset a fresh account after a reviewer completes onboarding; that state is preserved deliberately. Request a new scoped identity for another first-run review.

Human-review fixtures occupy only `human-review-v1`. Automated mutation tests run in an isolated **in-memory convex-test database**, never this live namespace. `staging:smoke` uses real authentication and read-only live browsing plus rejected authorization probes; it does not create needs/messages/contracts. Do not repurpose this deployment for mutable automated end-to-end suites; provision and pin a second backend/auth roster first.

Documents are PDFs visibly marked “SYNTHETIC QA — NOT A REAL AGREEMENT.” Private downloadable source PDFs are in `.qa-private/documents`. No client documents or real signatures were used. Draft/shared/returned/superseded are clearly labeled scenario cards; true agreement versioning is unsupported. Simulated notification failure is not presented as a real provider failure. Upload-error cases belong in the test harness (HTTP failure/oversize), not intentionally corrupt records.

## Deploy and revision discipline

1. Work from the isolated staging branch and commit reviewed changes. Never deploy the original checkout.
2. `npm run staging:check`, tests/typecheck/lint, and `npm run build -- --webpack`.
3. `npm run staging:deploy` verifies the exact linked Vercel project and clean commit, then publishes to this staging project's stable slot with `qaCommit` metadata.
4. The remote `vercel:build` checks exact environment/resource bindings, builds Next, and deploys Convex with the staging-scoped deploy key. This intentionally differs from baseline Preview builds, which skip backend deployment.
5. Inspect Vercel build logs and run `staging:smoke` on the stable URL. Check signed-out redirects, noindex headers, backend proof and asset downloads. Record frontend deployment ID/commit separately from Convex deployment identity.

Production-style local server used for initial verification: `http://localhost:3011` (`next build --webpack` + `next start`), connected to staging resources. That agent-owned local server has been stopped; local presence is not a replacement for hosted verification.

The existing GitHub CI uses Node 20 and covers type/lint/unit/public Playwright; its TESTING.md claim that CI runs build was inaccurate. Hosted Vercel uses Node 24.x, the workstation Node 22.22.3/npm 10.9.8. The new manually invoked staging workflow uses Node 24, no external service secrets, and in-memory mutation tests. It is authored but has not been run on GitHub; this branch has not been pushed. No CI seed or production deploy selector is present.

## Investigation and remaining decisions

See [the A–L ledger](INVESTIGATION.md). Staging readiness does not imply these product gaps are fixed. Highest-priority follow-up: upload ownership, authenticated-download policy, message-context authorization, contract version/share/notification semantics, and acceptance reversal rules. A 390px mobile check and live session revocation are recorded in the ledger; real recovery-email transport and the complete accessibility/session-expiration matrix still require further evidence. No production cleanup, migration, deployment, email send or purchase occurred.
