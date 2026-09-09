# K12Gig staging release candidate

Authority: Jordan's implementation request in this thread, September 8, 2026. This specification records routine implementation choices; it does not authorize production deployment.

## Global constraints

- Stable default: https://k12gig-staging.vercel.app with Convex reminiscent-eagle-756. Controller-authorized automation exception: https://k12gig-rc-20260908.vercel.app with Convex dapper-curlew-192, selected only by explicit --automation and its exact pinned resource map. Both use the existing pinned non-production Clerk instance. Mutable automated journeys/fixture reset run only on automation; stable reviewer linkage and environment stay unchanged. No production resource is authorized.
- Preserve the green/cream/gold brand system and working messaging, saved consultants, profiles, and need/proposal notifications.
- Use real Clerk authentication and normal membership/role records. Never add an authorization bypass.
- Keep all staging email captured; no production sends, purchases, production migration, or production deployment.
- Preserve originals and provenance. Never infer agreement relationships from filenames.
- Tests must exercise behavior, authorization, transitions, state restoration, and retries; never weaken assertions for a green result.
- Credentials, authentication state, and live private exports stay outside Git and screenshots.
- Report emulated devices separately from actual iOS Safari/Android Chrome and screen-reader checks.

## Agreement and file model

Existing contracts remain separate agreement identities. Add an explicit versions table referencing exactly one contract, immutable file identity, original filename, uploader, timestamp, version number, kind (original/revision/signed_copy), and optional explicit parent version. A current shared version and an author's pending private version are distinct: a private revision must not hide the last shared version from the recipient. A signed-copy upload retains the original and does not itself assert external signing. Amendments/new agreements require deliberate new identities.

The uploading party owns a private draft (district membership constitutes the district party). Only that party can share or revise that draft. Once shared, both parties can retrieve that version and its shared ancestors. Either party may upload a signed copy of a shared version, save it privately, and explicitly share it. Each mutation uses a request ID and expected revision/current version where concurrency matters. A stale edit fails clearly; a retry returns the original receipt.

New private files must be registered to their authenticated uploader and purpose before attachment. Public finalize mutations cannot accept arbitrary unowned storage IDs. File content is served only after per-request authorization. Because Convex object URLs are bearer-accessible, store private content encrypted (AES-GCM, a server-only key, random nonce, exact-byte SHA-256 provenance); do not expose plaintext storage URLs. HTTP uploads verify authentication, ticket ownership, expiration, purpose, size, extension and content signature. Allow up to 10 MiB with purpose-specific signature validation: agreements PDF/DOCX; resume and proposal documents PDF/DOC/DOCX; credentials PDF/PNG/JPEG. This preserves existing credential image and legacy resume DOC support. Avatars remain a separate public asset path. Direct Convex HTTP uploads carry Clerk JWTs and exact-origin CORS; authenticated Next download routes stream content with private/no-store headers. A missing key fails closed.

Migration is explicit and staging guarded: preview counts, missing files and ambiguities; retain each original contract and all events; create one legacy version per contract, never group by filename. Preserve all original bytes encrypted, verify hashes, and preserve original storage IDs as provenance before retiring old publicly readable plaintext objects. Do not delete an original unless its verified equivalent exists and the report identifies it. Legacy status "completed" is recorded as legacy document state, not invented external-signing evidence or completed work. Unknown ownership/content is blocked for manual review. Document application rollback separately from data rollback; never roll back private files to public plaintext.

## State and actor rules

| Action | Actor | Prerequisite | Effects / communication |
|---|---|---|---|
| Save/upload draft | Authenticated engagement party | Active/in-progress engagement; current revision | Private version and history only; no recipient notification |
| Share version | Uploading party | Complete valid file; current draft | Exposes that version; durable in-app/email event to other party; document deep link |
| Waiting for external signing | Uploading party | Shared version | Recorded coordination state; explained notification; no signature claim |
| Upload signed copy | Either party | Explicit shared parent | New linked private version; never overwrites parent or marks signing/work complete |
| Record external signing | Either party | Shared current version; explicit acknowledgement/note | Records actor/date/version and notifies counterpart; work state unchanged |
| Start/complete work | District managing need | Active → in_progress → completed | Engagement history and counterpart notification; no implicit document changes |
| Cancel engagement | Either party | Active/in_progress; reason | History and counterpart communication; warning that external agreements are not voided |
| Reopen need after cancellation | District managing need | Canceled engagement; explicit correction choice | Need reopens; old proposals/history preserved; only one non-canceled engagement may exist |
| Archive | Each party for its own view | Completed/canceled | Removes from that party's active view only; retrieval remains available |

Retain established single-hire behavior. A repeated acceptance of the same already-accepted proposal returns its same engagement without duplicate side effects. Concurrent competing acceptance has one winner. Canceled historic engagements do not prevent an explicitly reopened need from receiving a replacement; do not silently reopen rejected competitor proposals.

## Notifications

Use a source-linked durable outbox in the same transaction as each relevant event. Unique event+recipient keys prevent duplicate in-app notifications and email jobs. Distinguish queued, sending, captured (staging), provider_accepted, failed, and delivered only with real supporting callback evidence. Retry uses the same provider idempotency key; preserve attempts/errors and bound automatic retries. A reset invalidates pending source-linked work. Links use the exact environment origin and preserve engagement/agreement/version through login/onboarding. Preserve existing message, need and proposal alert behavior while bringing failures into the same visible delivery record where practical.

## Discovery, onboarding and posting

URL search parameters are canonical. Parse primary support area, specialization, grades, service area, availability and sorting with a shared validated model; retain them through login, onboarding, profile opening and Back. "Accepting new clients" includes open and limited, excludes closed. One control per filter and one logged-out entry panel. Preserve saved-consultant behavior but bind browser storage to the signed-in account; anonymous data never silently transfers into another account.

Onboarding stores intentional values. Names may come from the same Clerk identity; examples are labeled placeholders. Remove misleading years-experience/business/profile defaults and clear state on identity changes. Posting state uses calendar-day strings without UTC conversion. Preserve every field through steps, errors, refresh and supported save/resume. Anonymous drafts are browser-session scoped and imported only with explicit consent into the selected account. Include clear location/delivery expectations, compensation basis, review/edit before publication, and accurate sign-in-to-continue copy. Retain an intentionally selected consultant through posting/proposal handoff.

Badges derive from supporting reviewed-credential/audit evidence, not a demo flag or profile completeness. Distinguish credentials reviewed, profile completion and separately recorded checks. Preserve legacy taxonomy values, add Keynote speaking deliberately, remove confusing engagement-type controls without dropping distinct stored information. Public copy must reflect actual off-platform signing/payment and avoid unsupported nationwide, zero-days, booking or broad verification claims. No invented fees, retention schedule or service-area policy.

## Frontend and verification

Contract Hub is organized by engagement with parties, work status and a next action. Agreement cards show title, filename, current shared/private version, status, uploader/date, view/download, earlier versions and activity. Uploads require explicit action, accessible progress/status/errors, retry and preserved selection; duplicate names remain distinct. Proposal acceptance uses an accessible confirmation with consultant/need/rate/scope and a no-side-effects Back/Cancel action. Conversation links lead to the canonical engagement; otherwise explain the required posted-need/proposal path and carry the consultant.

Use links for navigation, buttons for actions, named controls, field/error associations, focus management and live announcements. Check mobile reflow, keyboard, zoom, long filenames, interrupted uploads and expired sessions. Do not claim unavailable physical-device or screen-reader testing.

Release gate: meaningful regression tests, staging-only migration dry-run/application proof, independent district/consultant sessions through the requested two-party journey, unrelated-account file/record probes, measured performance conditions, screenshots/traces without credentials, reviewable commits/draft PR, and a Pass/Fail/Blocked/Not applicable ledger. Critical authorization or journey failures prevent a ready claim. Production release remains separately authorized.
