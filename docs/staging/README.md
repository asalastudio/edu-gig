# Isolated K12Gig staging

The stable reviewer URL is **https://k12gig-staging.vercel.app**. Task 4 adds a separately pinned automation deployment so mutable journeys do not change stable reviewer data. Current candidate implementation and local checks are distinct from deployment, migration and live acceptance. Live candidate gates remain **Blocked / pending controller evidence**; historical baseline results in INVESTIGATION.md do not verify this candidate.

| Resource | Stable default | Explicit `--automation` |
|---|---|---|
| Vercel project | `prj_Vpy7lyVtwojNT1wBri26KaRni59D` | `prj_BCDKkXbjjoBhyvBOBZBn7qHpO7Wm` |
| Application | `https://k12gig-staging.vercel.app` | `https://k12gig-rc-20260908.vercel.app` |
| Convex | `reminiscent-eagle-756` | `dapper-curlew-192` |
| Cloud/HTTP | corresponding `.convex.cloud` / `.convex.site` | corresponding `.convex.cloud` / `.convex.site` |
| Private operator environment | `.env.local` | `.qa-private/automation-infra/app.env` |

Both projects belong to Asala `team_CGyACzn1BhcZitDAKUiZRzax` and use the pinned development Clerk instance `ins_3CcGU4eLSlRRv1oQgKNzr9mGlfN`, issuer `https://regular-wolf-65.clerk.accounts.dev`. Normal Clerk sessions and explicit allowlists protect the app and backend. The automation exception changes neither stable `.env.local` nor `.vercel/project.json`. Resource manifests are tracked, exact and nonsecret. Unknown, production and mixed resources fail closed. Production Convex `descriptive-bass-5`, production Clerk `https://clerk.k12gig.com` and production Vercel `prj_IP8sPfVJTKtWDaAjpX4IUUkweZrI` are excluded.

Vercel's `--prod` selects the publishing slot of the explicitly selected **staging project**. This is not authority to deploy production K12Gig. The exact staging branch has Git deployments disabled in vercel.json; automation has no Git link. `.qa-private`, env files, auth state and `.superpowers` are excluded from hosting uploads. CI has no seed, migration or remote deployment authority.

The custom `staging.k12gig.com` alias remains blocked pending Cloudflare access. Automation requested a seven-day expiry on September 8; controller must verify actual expiry before reuse. No paid service or new plan is authorized.

## Private access and fixtures

Use the private `.qa-private/accounts.json` roster and account-access instructions; never copy credentials into code, reports, screenshots or PRs. Existing baseline accounts are real Clerk development identities and normal Convex memberships. Run-specific signup actors must use the real candidate Clerk UI and be explicitly allowlisted on automation after creation; a provider API-created identity is not signup proof. Never add a role or auth bypass.

`human-review-v1` preserves the existing baseline identities and independent legacy records. Its seed is idempotent and does not rewrite an existing manifest. Existing plaintext records require the separate guarded migration. Fresh normal seed files are validated and encrypted before storage. A separate automation-only fixed synthetic legacy rehearsal is explicitly available for migration proof; see RC-MIGRATION.md. It does not change normal seed behavior.

The supplementary `release-candidate-v1` manifest can be added idempotently to either exact target after revision verification. It preserves the base manifest and creates two accepted engagements, one with no agreements and one with an explicit shared original/signed-copy/revision chain plus a separate private amendment draft. Superseded means earlier shared version, not completed work. All bytes are synthetic, and seeded states are not live UI/signing evidence. A synthetic historical verification flag or QA audit is not a credential-review record; no real review evidence is forged.

Reset is explicit, namespace-specific and refuses untracked dependent work. Accounts, profiles, memberships and unrelated records survive. Source-linked outbox attempts/captures are removed and pending source jobs are canceled. Run reset/idempotence checks on automation **before** adding journey/transport dependents; later reset should refuse those dependents. Operator CLI/harness refuse stable resets and mutable automation. Internal reset remains an exact-target, commit-checked administrative operation, never a public API.

## Controller commands

These commands are implemented but their live execution is pending. Replace `REVIEWED_FULL_SHA` with the exact clean reviewed commit. Never paste secrets into arguments or logs.

```sh
npm run staging:check
npm run staging:status
npm run staging:deploy -- --automation
npm run staging:check -- --automation
npm run staging:seed -- --automation --expected-commit=REVIEWED_FULL_SHA
node scripts/staging/cli.mjs release-seed --automation --expected-commit=REVIEWED_FULL_SHA
node scripts/staging/cli.mjs release-status --automation
node scripts/staging/cli.mjs delivery-fixtures --automation --expected-commit=REVIEWED_FULL_SHA --confirm=SIMULATE_CAPTURE_ONLY_DELIVERY
node scripts/staging/cli.mjs release-reset --automation --expected-commit=REVIEWED_FULL_SHA --confirm=RESET_IDENTIFIED_QA_FIXTURES
npm run staging:smoke -- --automation --expected-commit=REVIEWED_FULL_SHA
node scripts/staging/release-journey.mjs --automation --expected-commit=REVIEWED_FULL_SHA --cases=.qa-private/reviewed-journey-cases.mjs
```

After automation verification, the controller deploys the same reviewed code to stable with `npm run staging:deploy`, reconciles/applies the migration, optionally adds stable supplementary examples with `release-seed --expected-commit=REVIEWED_FULL_SHA`, and runs read-only stable smoke. Stable base seed re-run must be a no-op. Fault fixtures are strictly automation-only; they induce failed/queued states without contacting Resend. Recipient retry uses the real delivery path and capture mode. No provider delivery is claimed.

The deploy command requires a clean Git tree, passes its full commit as both Vercel `qaCommit` metadata and `QA_BUILD_COMMIT`, and uses explicit project/team overrides on automation. Hosting generates a source literal before compiling Convex and Next. Internal `qa.environment` reports that compiled backend commit; staging HTML exposes the same `data-qa-commit`. `unbuilt` is the safe local fallback and cannot authorize seed/reset. An environment label alone is not revision evidence. Deploy may update an older backend; only fixture mutations require the expected deployed revision.

Check frontend deployment ID/alias/metadata, backend cloud/resource/compiled commit and rendered HTML commit separately. Record tested code SHA versus any subsequent documentation-only SHA. Recheck production identity unchanged at handoff; no production action is authorized.

## Current implementation and verification limits

Private uploads use authenticated Convex HTTP, encrypted storage and per-request authorized streamed Next downloads. No plaintext bearer URL fallback exists. Agreement drafts, including unmigrated text-only drafts, hide metadata/history from the counterpart until sharing; district teammates retain owning-party access. See [API contract](RC-API.md), [tests](RC-TESTS.md), [migration](RC-MIGRATION.md), [rollback](RC-ROLLBACK.md) and [findings](RC-FINDINGS.md).

Transactional emails remain captured, profile reminders disabled in staging, and Checkr/Stripe callbacks unconfigured. There is no Clerk webhook/Organizations integration. Real email, physical iOS/Android devices and screen-reader speech remain unavailable/Blocked. Emulation, DOM semantics and keyboard checks must be labeled separately.

Local runtime is Node 22.22.3/npm 10.9.8. Vercel is configured for Node 24.x, regular GitHub CI uses Node 20, and the manual staging workflow uses Node 24. Locked dependencies were retained. Local `npm run build -- --webpack` is safe compilation; **do not run `npm run vercel:build` locally for verification** because it deploys the backend. A passing compiler alone does not verify an authenticated customer journey.
