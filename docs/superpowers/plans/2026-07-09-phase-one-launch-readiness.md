# Phase One Launch Readiness Implementation Plan

> **Required execution mode:** Follow the test-driven development loop for every behavior change. Do not edit production code until the named regression test fails for the expected reason.

**Goal:** Clear the five marketplace-truth blockers while preserving incomplete district work as drafts and keeping production cleanup preview-first.

**Architecture:** Pure policy modules define publish readiness, roster matching, credential evidence labels, and data classification. React and Convex both consume those modules so client and server behavior cannot drift. Convex owns the draft lifecycle and cleanup authorization; pages render role-specific actions and feature-flag-aware copy.

**Stack:** Next.js 16, React 19, TypeScript, Convex, Zod, Vitest/Testing Library, Playwright.

---

## Task 1: Shared need publish policy

**Files:**
- Create: `src/lib/need-publish-policy.test.ts`
- Create: `src/lib/need-publish-policy.ts`

1. Add failing tests for normalization, required fields, conditional subcategory, description length, and complete readiness.
2. Run `npx vitest run src/lib/need-publish-policy.test.ts` and confirm module/test failures.
3. Implement the smallest pure policy API: `normalizeNeedInput`, `getNeedPublishIssues`, and `isNeedPublishReady`.
4. Re-run the focused test and commit.

## Task 2: Convex draft lifecycle and marketplace isolation

**Files:**
- Modify: `convex/schema.ts`
- Modify: `convex/needs.ts`
- Modify: `src/app/post/page.tsx`
- Modify: `src/app/dashboard/board/page.tsx`
- Modify: `e2e/post-need.spec.ts`

1. Extend the Playwright specification with save-draft, resume-draft, incomplete-publish, and complete-publish expectations.
2. Add `draft` to the need status schema and validators.
3. Add `saveDraft` (create/update owned draft) and `publishDraft` (server-enforced readiness, transition to open, then notification fan-out).
4. Keep `create` backward-compatible but enforce the same publish policy before inserting an open need.
5. Ensure educator-facing queries never return drafts.
6. Hydrate `/post?draft=<id>`, retain entered data, expose explicit `Save draft` and `Publish need` actions, show field/policy issues, and keep failures in place with alert semantics.
7. Render district draft cards with a Draft status and `Continue editing`; retain educator-only proposal actions.
8. Run the focused policy/unit tests and `npm run typecheck`; commit once green.

## Task 3: Evidence-derived credential claims

**Files:**
- Modify: `src/lib/map-convex-educator-profile.test.ts`
- Modify: `src/lib/map-convex-educator-profile.ts`

1. Add failing tests proving empty and submitted-only credential sets never produce “Credentials reviewed,” while at least one verified row does.
2. Run `npx vitest run src/lib/map-convex-educator-profile.test.ts` and verify the submitted-only case fails.
3. Derive the reviewed badge from fetched credential evidence, independent of profile tier.
4. Re-run the focused test and commit.

## Task 4: Directory filter predicate and visible match evidence

**Files:**
- Create: `src/lib/filter-educators.test.ts`
- Create: `src/lib/filter-educators.ts`
- Modify: `src/lib/taxonomy.test.ts`
- Modify: `src/components/shared/educator-card.tsx`
- Create: `src/components/shared/educator-card.test.tsx`
- Modify: `src/app/browse/page.tsx`

1. Add failing pure tests for the exact off-category audit case plus alias/subcategory, group-AND/group-OR, availability, local, verified, rating, instant, and saved behavior.
2. Add a failing card test requiring the actively matched support area to be displayed first with remaining-area count.
3. Implement `filterEducatorRoster` and `orderAreasForDisplay` using the canonical taxonomy matcher.
4. Replace inline page filtering with the pure predicate and pass active support selections to cards.
5. Update the card to render why it matched without exposing unrelated results.
6. Run the focused filter/card/taxonomy tests and commit.

## Task 5: Preview-first marketplace data hygiene

**Files:**
- Create: `src/lib/marketplace-data-hygiene.test.ts`
- Create: `src/lib/marketplace-data-hygiene.ts`
- Modify: `convex/beta_launch.ts`
- Modify: `scripts/beta-launch.mjs`
- Modify: `package.json`
- Create: `docs/launch/marketplace-data-sweep.md`

1. Add failing classification tests for seed/test Clerk ids, `+clerk_test` and example emails, QA/test names, demo districts, and incomplete open needs; include false-positive fixtures for legitimate names.
2. Implement pure reason-returning classifiers so every flagged record is explainable.
3. Add a protected `auditMarketplaceData` operation returning categorized ids/reasons/counts without mutation.
4. Add a cleanup preview that computes cascade impact. Require the exact confirmation token `DELETE_FLAGGED_MARKETPLACE_DATA` before destructive cleanup.
5. Cascade through related marketplace rows and storage references before deleting owners; do not touch unflagged records.
6. Extend the CLI and package scripts with audit, dry-run cleanup, and explicitly confirmed cleanup commands.
7. Document the production run/review/approval procedure and explicitly state that development does not execute production deletion.
8. Run focused classifier tests, script argument smoke tests, and typecheck; commit.

## Task 6: Active-beta copy and role-specific board navigation

**Files:**
- Create: `src/lib/active-beta-copy.test.ts`
- Create: `src/lib/active-beta-copy.ts`
- Modify: `src/app/help/page.tsx`
- Modify: `src/app/pricing/page.test.tsx`
- Modify: `src/app/gigs/[gigId]/page.tsx`
- Modify: `src/components/shared/sidebar.tsx`
- Create: `src/components/shared/sidebar.test.tsx`
- Modify: `src/app/dashboard/board/page.tsx`

1. Add failing tests for cards-off/cards-on billing language, no new-gig claim, invoice/PO terminology, and District `Posted Needs` versus Educator `Gig Board` navigation.
2. Centralize feature-flag-aware public copy in a pure module.
3. Update Help, Pricing assertions, and Checkout labels to the active payment path.
4. Derive sidebar and shared-board labels from the loaded role and preserve neutral loading behavior.
5. Run the focused copy/sidebar/pricing tests and commit.

## Task 7: End-to-end verification and audit handoff

**Files:**
- Modify as needed: `e2e/post-need.spec.ts`
- Modify as needed: `e2e/credentials.spec.ts`
- Create: `e2e/directory-filters.spec.ts` if no focused directory regression exists
- Update: `docs/launch-readiness-audit-2026-07-09/REPORT.md` only after copying the report into the feature branch or merging this branch back to the source checkout

1. Run focused tests after each task.
2. Run `npm test`.
3. Run `npm run typecheck`.
4. Run `npm run lint` and resolve only issues introduced by this branch.
5. Run `npm run build` with the configured local environment.
6. Start the dev server and run the focused Playwright flows with sanctioned development accounts.
7. Inspect the final diff and confirm the original checkout still retains its pre-existing `convex/_generated/api.d.ts` edit and audit evidence untouched.
8. Record verified results, remaining stakeholder decisions, and the production data-audit command in the final handoff.
