# K12Gig staging investigation — September 8, 2026

Source baseline: `1433830fbedf223b7b0ad6f46656d9b2e81ce754`, independently matched to the live production deployment `dpl_69TFnLR1pJReXukXUa1mbPKEgS2U`. The original checkout was on `f924be9`; its tree is identical to the merged baseline. Production was inspected read-only. Findings below distinguish browser evidence, executed backend tests, and source inspection.

## A — Posting date: **not reproduced** with native input

Current production was tested with organization → School Improvement → MICIP → All Grades → date/duration → Continue → Back. Chromium Playwright `fill` retained `2026-10-15`; native keyboard adjustment retained `2026-11-15`; duration retained `8 weeks`. A React component round-trip test also passes. The in-app browser's input automation showed a valid DOM date before navigation but an empty date afterward. This discrepancy reproduces the *appearance* in that automation surface, not a demonstrated application state failure. No date fix was made based on it.

`src/app/post/page.tsx:62,96,137,182,198,529`: date is controlled state owned by the wizard; steps unmount inputs, not the wizard state. Draft hydration can replace it. No date parsing occurs in Back/Continue. `todayISO` uses UTC, so the minimum day can differ from the local day near midnight. `src/lib/need-publish-policy.ts:107` tests presence, not ISO validity or past dates. Investigate native browser/version, exact entry method, blur behavior, and draft-transfer state if the stakeholder can reproduce again. Add local-date validation separately; do not claim timezone conversion caused the observed clearing.

## B — Search/auth continuity: **confirmed**, partially

Native Chromium displays the School Improvement chip from `area=school_improvement`; the reported entirely unselected state was not reproduced in that browser. `spec=micip` is not parsed or filtered. `src/app/browse/page.tsx:27,85,173,190,250` reads area/grade/region/engagement at initialization and sends sign-in to `/login`. `src/app/login/page.tsx:29,53` role links omit `next`. `src/lib/auth-intent.ts` and sign-in/sign-up pages can preserve a supplied safe target, but cannot restore a target already dropped by browse/login. Session storage remembers role intent only. Onboarding consumes `next` when present.

Fix: make URL search state canonical, support specialization end-to-end, preserve the exact safe browse target through role selection/auth/onboarding, and test fresh versus onboarded accounts. This staging branch also rejects backslashes/control characters in internal redirect paths, closing an environment-escape edge case; the browse continuity redesign is not implemented.

## C — Prefilled onboarding: **confirmed defaults; ownership leak not established**

`src/app/onboarding/page.tsx:104–135` initializes district role to superintendent, state MI, region_6; consultant experience to 5, hourly to true, availability open, individual profile, consulting engagement. Organization/headline/bio/business name initialize empty. The apparent person/business/bio examples are placeholders. Names are populated once from the authenticated Clerk user (`:185`). No onboarding local-storage profile cache was found. `convex/users.ts` uses the verified identity subject for ownership.

The separate posting preview uses browser-wide `k12gig_post_need_draft` and automatically transfers it to the next eligible signed-in district (`post/page.tsx:118–163`). Saved directory IDs are also browser-wide. These are real shared-browser continuity risks, distinct from cross-tenant database disclosure. Recommended: explicit draft-import consent/account binding, clear example placeholders, and reset name/form state when identity changes without a remount. Native fresh-account smoke and private field-value results are part of the staging evidence; no production user records were examined or copied.

## D — Acceptance: **confirmed safeguards and UX gap; product decision needed**

`convex/proposals.ts:274` performs authorization, pending/open checks, competing proposal rejection, need placement, engagement creation, notification insertion and scheduled email in one transaction. `convex/lib/proposalAcceptance.ts` enforces one accepted proposal and one engagement per need. Executed backend tests confirm duplicate and competing acceptance fail without creating another engagement. A duplicate request returns an error rather than the original success receipt.

`src/app/dashboard/district/needs/[needId]/page.tsx:59` accepts directly; there is no explicit confirmation dialog. `convex/engagements.ts:146` permits any authorized engagement participant to set any supported engagement status. Canceling does not undo proposal acceptance, reopen the need, or restore rejected proposals; an existing canceled engagement still blocks replacement acceptance. The engagement page has no reversal/cancellation control. Decide who may cancel/reopen, which notifications/records to retain, and whether the product stays single-hire. Add a confirmation explaining the actual consequence before acceptance.

## E — Contract Hub: **confirmed**

`src/components/shared/contract-hub.tsx:30,44,57,147` defaults title to “Consulting agreement,” uses it instead of filename, and does not render the stored original filename on cards. Every upload creates an independent `contracts` row. `convex/schema.ts` has no agreement group, version number, supersedes/current-file relationship, or signed-copy linkage. `convex/contracts.ts:53` preserves a filename but does not interpret a replacement upload as a version.

Fix: display original filename, descriptive title and engagement; provide an explicit upload/revision/signed-copy flow. Migration must be reviewed: filenames alone cannot reliably determine which historical documents belong together. The fixture cards label draft/shared/returned/superseded scenarios, but do **not** fabricate real version support. “Complete” is not “superseded.”

## F — Contract statuses: **confirmed; product decision needed**

All four actions appear together, including the current status. `contracts.updateStatus` changes only the contract's status and updatedAt, then inserts a `contractEvents` row; it does not change the engagement, capture a signature, share a private draft, or emit notification/email. Every participant authorized by `canAccessEngagement` can execute any transition, including reverting completed to draft. District membership gives the existing HR teammate the same access here.

Decide a transition/actor matrix and whether drafting is private. Add explanations and confirmation where consequences warrant. “Sent for signature” currently sends nothing, “Signed off-platform” is a user-entered assertion, and “Complete” is document coordination status only.

## G — Notifications: **confirmed**

Needs/proposals/messages create `notifications` and use Convex `scheduler.runAfter` to invoke internal email actions. Acceptance schedules one email to the consultant and an in-app notification. Agreement create/updateStatus only write contract events; neither has a save-versus-share event or recipient/delivery step. This explains the missing contract notification without assuming a Resend outage.

`convex/emails.ts` renders links from NEXT_PUBLIC_APP_URL (baseline fallback is production), calls Resend via fetch, and catches failures. There is no delivery-attempt table, provider callback, durable retry policy, or contract notification template. Non-2xx responses are logged and swallowed. A daily cron selects profile reminders. District notification-preference fields exist; dispatcher paths do not consistently enforce them.

Staging now captures rendered email payloads in its own `qaEmailCaptures` table and never calls Resend. The daily reminder cron is disabled there. Capture is *not* evidence that real email delivery works. A simulated failure fixture is explicitly marked simulated; it is not a fabricated provider delivery attempt. Implement a source-linked outbox with idempotency, retry history, and an explicit contract share event after deciding recipients/semantics.

## H — Authorization: **confirmed checks and gaps**

Executed in-memory tests cover every current contract endpoint (`generateUploadUrl`, `create`, `updateStatus`, `listForEngagement`, `listMine`, `getFileUrl`, `listEvents`), engagement get/set/list behavior, unrelated conversation reads, and district membership. Live smoke uses real Clerk identities for both roles and rejects unrelated account contract access. There are no version endpoints to test yet.

Confirmed concerns:

- `messages.send` accepts arbitrary needId/engagementId without verifying existence/access or participant correspondence. A negative backend test successfully attached District A's engagement ID to District B's own conversation. This does not by itself disclose engagement contents, but it permits unauthorized relationship metadata.
- `contracts.create` checks engagement access but accepts a raw `_storage` ID without uploader/resource ownership proof. A backend test re-linked an existing file into another district's authorized engagement. Resume, credential and proposal finalize paths have similar raw-ID patterns requiring a full upload-ownership design.
- `storage.getUrl` is gated by application queries, but the returned file URL can be fetched without a session. Live staging download returned HTTP 200 with a fresh unauthenticated fetch. Access is not rechecked on each download. Do not describe these as proven expiring signed links.
- `getFileUrl` returns null for absent/no-file documents before authorization; existence behavior is inconsistent. Message mark-read silently does nothing for unrelated threads, whereas list rejects.
- Resume/credential access is intentionally available to any district role, including unrelated districts; decide which documents are directory-visible versus engagement-private.

Recommended priority: bind uploaded objects to owner/purpose before attachment; authorize linked message context; provide authenticated download streaming/revocation if required; define draft sharing and status permissions. No production data was used for these tests. Staging reviewer allowlisting supplements, and does not replace, normal role/membership checks.

## I — Verification and taxonomy: **confirmed source behavior; production provenance unverified**

`admin.updateEducatorVerification` is superadmin-only and records an audit event, but does not require a verified credential or completed engagement. Badges derive from profile verificationStatus. Old seed routines and Checkr-related updates can also set that field. A badge is therefore not proof of a supporting document/review by itself; historical production provenance requires a scoped data audit before making claims.

`convex/reviews.ts` is a separate completed-*order* 1–5 rating workflow; modern engagements do not automatically meet that order gate. The staging reviewed consultant has a clearly synthetic credential and audit record; this proves the review UI path, not a real professional qualification.

`src/lib/filter-educators.ts:53` excludes limited and closed profiles from Available Now; the unfiltered directory can show them. Taxonomy has seven current support categories with legacy aliases, specialty subcategories, grade bands, and Michigan regions. Old engagement types and legacy order/gig fields remain. Do not delete legacy values merely because the launch UI fixes consulting; stored uniqueness/content was not audited in production. Decide service-area policy and review-badge evidence requirements before migration.

## J — Messaging to engagement: **confirmed gap**

Threads are keyed by sorted participant user IDs (`convex/messages.ts:23`), not engagements. Only districts can initiate; consultants can reply to an existing thread. `src/app/dashboard/messages/page.tsx:28` preserves `to`/`name`; it does not create engagements. `convex/lib/createEngagement.ts` requires an accepted proposal and need, so there is no direct conversation→engagement conversion. Engagement links reach messages with counterpart context, but the message UI does not preserve engagement/need context in outgoing messages. Contract Hub's engagement selector does not restore a selected engagement from its entry link.

Decide whether direct engagements are supported. If yes, use a permission-checked conversion preserving both participants and explicit scope; otherwise provide a clear post-need/proposal path from the conversation.

## K — UI/accessibility: **confirmed code defects; partial browser coverage**

Contract file links render an `<a>` inside a `<button>` after “Load file”; other pages nest buttons inside links. The Contract Hub input uploads immediately on file selection; there is no explicit submit step. It does not check upload HTTP status before parsing JSON, enforce a size/type limit, or associate upload errors with the file input. An executed component test supplied an HTTP 500 JSON error; the UI still called create with storageId=undefined, creating a metadata-only agreement if the backend accepts it. Status handlers discard promises without a local pending/error UI. The selector displays the empty state while engagement loading is unresolved. Filename text is not rendered, so long-name/version distinction cannot currently work.

The shared Input component has error IDs/aria-describedby; posting fields use aria-invalid but their errors are unassociated spans. Wizard navigation does not move focus to the new step heading/error. Contract title/notes rely on free text without explicit wrapping rules. See `contract-hub.tsx:44–73,92–135,166–187`, `post/page.tsx:529`, and `components/shared/input.tsx`.

Desktop signed-in pages are smoke-tested; a complete mobile, keyboard, assistive-technology and session-expiry matrix is still required. Do not infer full accessibility clearance from successful rendering. A sign-out automation timing failure was traced to calling the Clerk SDK before it had loaded after navigation; waiting for Clerk readiness resolved it. It was not established as an application sign-out defect.

## L — Operational truth: **confirmed published/code posture; policy decisions remain**

The September Terms/pricing/help say no K12Gig platform fee, payment processing, invoices/payouts/tax forms, or legally binding electronic signatures. Parties arrange these directly. Legacy Stripe/Checkr routes and data still exist, but launch flags disable their intended flows. They are unconfigured and blocked in staging; no production integration was changed.

Taxonomy/onboarding use Michigan regions, while district state is editable. This does not prove an approved geographic service policy. Resume/proposal UI caps files at 10 MB; Contract Hub has no application-enforced size limit. No concrete application quota, deletion schedule, agreement retention period, or support SLA is established by code. Privacy language refers generally to necessary retention/legal obligations. Do not invent limits or retention promises.

Support is `support@k12gig.com`; procurement/DPA requests have a stored workflow and superadmin statuses. Actual inbox ownership, response practices, approved service areas and retention policy remain owner decisions. These business facts are recorded from project sources, not offered as legal advice.
