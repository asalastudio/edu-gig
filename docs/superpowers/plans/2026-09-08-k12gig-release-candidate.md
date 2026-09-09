# K12Gig Release Candidate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Deliver a verified, isolated staging release candidate for the complete two-party K12Gig journey.
**Architecture:** Add explicit agreement versions, owned encrypted private files and durable notification delivery records to the existing Convex application. Build the corresponding engagement-oriented UI, then unify discovery/onboarding/posting continuity and verify real staged sessions.
**Tech Stack:** Existing Next 16 / React 19, Clerk, Convex, npm, Vitest, convex-test and Playwright.
**Spec:** docs/superpowers/specs/2026-09-08-k12gig-release-candidate.md

## Global Constraints

- Stable default: https://k12gig-staging.vercel.app with Convex reminiscent-eagle-756. Controller-authorized automation exception: https://k12gig-rc-20260908.vercel.app with Convex dapper-curlew-192, selected only by explicit --automation and its exact pinned resource map. Both use the existing pinned non-production Clerk instance. Mutable automated journeys/fixture reset run only on automation; stable reviewer linkage and environment stay unchanged. No production resource is authorized.
- Preserve the green/cream/gold brand system and working messaging, saved consultants, profiles, and need/proposal notifications.
- Use real Clerk authentication and normal membership/role records. Never add an authorization bypass.
- Keep all staging email captured; no production sends, purchases, production migration, or production deployment.
- Preserve originals and provenance. Never infer agreement relationships from filenames.
- Tests must exercise behavior, authorization, transitions, state restoration, and retries; never weaken assertions for a green result.
- Credentials, authentication state, and live private exports stay outside Git and screenshots.
- Report emulated devices separately from actual iOS Safari/Android Chrome and screen-reader checks.

### Task 1: Private documents, agreement lifecycle and transactional communication

**Files:** Modify convex/schema.ts, contracts.ts, engagements.ts, proposals.ts, messages.ts, emails.ts, qa.ts, lib/auth.ts, lib/validators.ts, lib/proposalAcceptance.ts and attachment/resume/credential functions as required. Create focused convex/agreementVersions.ts, privateFiles.ts, delivery.ts, http.ts and helper modules; authenticated Next API upload/download bridge and client upload helper as needed. Add src/lib/release-domain.test.ts and targeted transport tests. Keep unrelated UI untouched.

**Interfaces:** Preserve existing exports or deliberately provide safe compatibility adapters. Expose documented generated API operations to create a private agreement draft, request/finalize an owned upload, list engagement agreements including visible versions/activity/allowed actions, share a version, record waiting/signing, query authorized file metadata, and transition/archive an engagement. Concrete exported names/arguments and response shapes must be written to docs/staging/RC-API.md before reporting so Task 2 consumes exactly what is implemented. Add a guarded internal migration dryRun/apply with reported counts/provenance and a restartable checkpoint. The owner/controller alone configures keys or executes remote migration/deploy.

- [ ] Add regression tests before changing working message conversation, proposal/need notification and acceptance paths. Record RED evidence for new lifecycle/auth/retry behavior.
- [ ] Implement agreement identities/immutable versions/private drafts/explicit sharing and shared-parent signed copies according to the spec. Test `save → no recipient visibility/event`, `share twice → one recipient event`, `signed copy → preserved original + signing/work unchanged`, and stale-version failures.
- [ ] Implement owned encrypted file storage and authenticated retrieval. Test unknown/foreign/expired upload tickets, foreign raw IDs, wrong purpose, malformed/oversized/type-mismatched files, duplicate retry receipts and concurrent finalization. Never expose decrypted content to unrelated users through either application or direct HTTP routes.
- [ ] Migrate old rows without filename grouping, preserving exact bytes/hash and original status/events. Test legacy-shaped synthetic rows, ambiguous/missing content, repeated application and rollback safety. Update QA reset to account for new source-linked records/jobs and preserve unrelated work.
- [ ] Implement outbox history and bounded idempotent retries with captured staging delivery. Test failures, retry after provider uncertainty, source reset and concurrent retries without duplicate user events.
- [ ] Implement idempotent acceptance, single active hire, explicit cancellation/reopen with reason/history and contextual message authorization. Test duplicate and concurrent acceptance, withdrawal, cancellation and unrelated access.
- [ ] Run focused tests and typecheck; report full API contract and required environment configuration; commit only this task's files.

### Task 2: Engagement-oriented Contract Hub, proposal confirmation and handoff UI

**Files:** src/components/shared/contract-hub.tsx and focused child components; dashboard/engagements, district/needs/[needId], dashboard/messages, district/educator contract-hub routes; existing resume/proposal/credential upload consumers; associated component/Playwright tests. Consume docs/staging/RC-API.md and existing generated API rather than inventing backend contracts.

**Interfaces:** Contract Hub accepts engagement/agreement/version URL context and renders allowed actions returned by Task 1. Shared authenticated upload helper sends the actual Clerk JWT to the pinned backend; download links use authenticated application routes. Conversation context includes counterpart, need and engagement where authorized.

- [ ] Add failing component regressions for failed uploads never creating a document, explicit save/share, stale errors, confirmation cancellation without mutation, and link/button nesting.
- [ ] Build engagement grouping, parties/status/next action, independent agreement identity, title/filename/uploader/date, shared/private/current/earlier versions and history. Preserve originals and clearly label draft privacy and external signing/work separation.
- [ ] Implement explicit upload/return-signed-copy interactions, type/size guidance, progress, recoverable errors, retries and accessible status announcements. Integrate all changed private-file upload consumers so existing resume/CV and proposal behavior still works.
- [ ] Implement acceptance confirmation (consultant, need, scope/rate, consequences), correction/cancellation/reopen, work completion/archive and retrieval. Do not imply cancellation voids an external agreement.
- [ ] Provide conversation → canonical engagement/Contract Hub links; otherwise provide contextual post-need/proposal guidance.
- [ ] Test keyboard focus/dialog closure, mobile intrinsic widths, long filenames and expiry/error states. Run focused component tests/typecheck and commit this task's files.

### Task 3: Discovery, onboarding, posting, verification and public task guidance

**Files:** src/app/browse, educators/[id] or actual profile route, onboarding, post, login/sign-in/sign-up; src/lib/auth-intent.ts, taxonomy/filter/map helpers and saved state; cards, needs empty-state, help/public copy; convex/needs.ts, educators.ts, admin.ts and validators/schema only when required. Add targeted state, filtering, evidence and regression tests.

**Interfaces:** Preserve Task 1 API and Task 2 engagement context. URL query state is canonical and safe internal return targets survive role selection/auth/onboarding. Existing role value educator remains internal compatibility; user-facing consultant terminology is deliberate. Keep unique legacy taxonomy values and independently meaningful hourly/daily rates.

- [ ] Add regression coverage for profile opening, saved consultants, messaging navigation, existing needs/proposal alerts before changing related paths.
- [ ] Fix posting persistence across forward/back/errors/refresh/account boundaries; use local calendar strings and test multiple timezone/locale conditions. Add explicit anonymous-draft import, final review/edit, compensation basis and location/remote expectations.
- [ ] Unify category/specialization/grades/service-area/availability URL parsing; include limited in Accepting new clients; eliminate redundant controls and logged-out entry panels. Preserve selected filters/sort/reset/Back and consultant context through sign-in/onboarding.
- [ ] Remove misleading onboarding defaults, label examples, scope browser caches by actual identity and verify fresh users cannot inherit another account's state.
- [ ] Require supporting review records for credentials-reviewed badges; distinguish completion and checks. Surface service area, delivery, availability and independently labeled rates on profiles without dropping About/Credentials/Resume/messages/saving.
- [ ] Add Keynote speaking safely; preserve legacy values; improve terminology and task help; remove unsupported public claims and duplicate primary actions without inventing policies.
- [ ] Run focused tests/typecheck and commit changes. Document any product facts that cannot be established rather than fabricating them.

### Task 4: Migration, whole-journey verification and staging handoff

**Files:** scripts/staging/release-journey.mjs, enhanced private fixture/run support, docs/staging/RC-TESTS.md, RC-MIGRATION.md, RC-ROLLBACK.md, RC-FINDINGS.md and private evidence receipts. Integrate existing staging guards/deploy process.

- [ ] Review Task 1 dry-run counts/ambiguities against private baseline exports. Provision only required staging secrets, preserve encrypted backup/provenance, apply guarded synthetic migration and record exact results.
- [ ] Create isolated run-specific real Clerk test identities/fixtures without mutating stable human-review accounts. Keep all credentials private and all delivery captured. Actual signup is tested with provider-supported identities, never a fake role switch.
- [ ] Run the fourteen-step two-party journey plus required negative/edge cases using independent browser sessions; screenshots/traces must exclude login/password/token/file-key material. Record measured conditions for performance.
- [ ] Run appropriate automated checks and independent whole-branch code review. Fix critical findings before a ready claim. Mark actual device/screen-reader checks Blocked if unavailable.
- [ ] Commit, deploy through the pinned staging process, verify exact alias/commit/backend bindings and unchanged production. Create a reviewable draft PR only after confirming it cannot mutate production; remote CI and any preview effects must be documented.
- [ ] Deliver URL/revision/deployment, private account instructions, migration and rollback notes, Pass/Fail/Blocked/Not applicable evidence and remaining owner decisions.
