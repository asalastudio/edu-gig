# Phase One Launch Readiness Design

**Date:** 2026-07-09
**Status:** Approved to implement with reversible defaults
**Source:** `docs/launch-readiness-audit-2026-07-09/REPORT.md`

## Goal

Clear the five marketplace-truth blockers from the launch audit without waiting for stakeholder decisions. The implementation must preserve user progress, prevent unsupported public claims, make filtering behavior testable, and provide safe production-data controls without deleting production data as part of development.

## Product decision

Incomplete district needs will not be rejected or published. They will be saved as resumable drafts. A district can continue immediately, return later, and publish once the minimum marketplace information is present. The minimum is a reversible policy module rather than form-specific logic so stakeholder feedback can change the threshold in one place.

## Approaches considered

1. **Publish-only quality gate.** Smallest change, but it stops a district at the end of the flow and loses the “do not block anything” requirement.
2. **Draft lifecycle plus shared publish policy.** Selected. It preserves progress, protects the educator marketplace, and keeps future stakeholder changes localized.
3. **Publish incomplete listings with an “incomplete” label.** Rejected because it continues the marketplace-quality and notification problem identified by the audit.

## Scope

### 1. Need drafts and publish quality

- Add `draft` to the need lifecycle.
- Centralize draft normalization and publish-readiness checks in a pure shared module.
- A draft requires only an organization name and support type; all entered values are retained.
- Publishing requires organization, support type, a subcategory when that support type offers one, grade band, desired start date, duration, compensation, and a useful description.
- The initial description threshold is 50 trimmed characters. Duration and compensation must contain at least three trimmed characters. These are policy constants, not duplicated UI rules.
- Enforce readiness in Convex as well as in the browser.
- Allow save, resume, update, and publish from `/post?draft=<needId>`.
- Show draft needs in the district board with a clear `Continue editing` action.
- Exclude drafts from educator queries and do not send matching notifications until publication.
- Existing open needs are not silently migrated or deleted. The data-audit tooling will flag incomplete legacy listings for review.

### 2. Credential truth

- Keep the educator verification tier as a separate operational profile attribute.
- Show “Credentials reviewed” only when at least one fetched credential has `verified: true`.
- A verified or premier profile with no verified credential may retain its profile-tier label, but must not imply an artifact review.
- Certification counts and credential tables continue to reflect actual fetched rows.
- Add mapper regression coverage for empty, submitted-only, and verified credential sets.

### 3. Directory filter correctness and explainability

- Move roster filtering into a pure tested predicate instead of keeping it embedded in the page component.
- Canonical support-type matching must recognize legacy aliases and subcategories without allowing unrelated areas.
- Compose support type, grade, region, engagement, availability, verification, saved, rating, local, and instant-book conditions with AND semantics across filter groups and OR semantics within a group.
- When a support filter is active, educator cards display a matching support area first and show a `+N more` indicator so the visible card evidence agrees with why it matched.
- Add tests for the exact audit regression: an available educator whose only areas are Data & Accountability and AI & Educational Technology must not match Instruction & Curriculum.

### 4. Marketplace data hygiene

- Add a protected, non-destructive marketplace audit that identifies known seed/test identities, suspicious test naming patterns, demo districts, and materially incomplete open needs.
- Refactor cleanup classification into pure functions with fixture tests.
- Make cleanup preview-first and require an explicit confirmation token for deletion.
- Cascade cleanup through owned marketplace rows so users, districts, needs, proposals, notifications, messages, orders, credentials, reviews, gigs, and related storage references are not left orphaned.
- Update the CLI to support `audit`, `cleanup --dry-run`, and explicit confirmed cleanup.
- Do not execute production deletion in this phase. Running the production audit and reviewing its output is a launch operation requiring deployment credentials and human approval.

### 5. Active-beta copy and district navigation

- Help copy must say educators maintain profiles and respond to needs; it must not claim new gig creation.
- Billing copy must derive from the card-checkout feature flag and describe invoice/PO as the active beta path when cards are disabled.
- Checkout terminology must distinguish invoice/PO from ACH settlement.
- District navigation and the shared board use district language (`Posted Needs`) while educators retain `Gig Board`.
- District empty/loading/content states remain explicit, with a direct `Post a need` action.
- Pricing, Help, Checkout, My Gigs, and board language must agree in tests.

## Error handling and state

- Draft saves and publishes use separate explicit actions and success messages.
- A failed persistence operation keeps form state in place and exposes a `role="alert"` message.
- Attempting to publish an incomplete draft returns the same field-level policy errors from client and server.
- A missing or unauthorized draft id renders an actionable error and never creates a new need implicitly.
- Cleanup commands default to non-destructive output and fail closed without launch flags, secret, and confirmation.

## Verification strategy

- Pure Vitest coverage for publish readiness, credential badges, filter composition, and data classification.
- Component tests for filtered card evidence and active-beta copy/navigation.
- Convex-facing tests where the repository test harness supports direct handler coverage; otherwise shared policy tests plus typecheck guard the server path.
- Playwright coverage for save draft, resume draft, publish complete need, and educator exclusion of drafts.
- Final checks: targeted tests, full unit suite, typecheck, lint on changed files, production build, and focused browser smoke tests for district and educator roles.

## Deferred stakeholder decisions

- Exact minimum description length and whether compensation may use a structured “negotiable” option.
- Whether every support type requires a subcategory.
- Whether old incomplete open listings should be closed, converted to drafts, or completed manually.
- Which production records identified by the audit are approved founding/demo content.
- When card checkout and new educator-authored services should be re-enabled.
