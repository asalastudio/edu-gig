# K12GIG Launch Readiness Audit

**Audit date:** July 9, 2026  
**Recommendation:** ❌ **Delay unrestricted public launch**  
**Safe near-term posture:** Invitation-only controlled beta after the Critical section is cleared

## Executive summary

K12GIG has a strong visual foundation, a clear K–12 niche, a working live domain, production-branded authentication, coherent district and educator workspaces, transparent pricing, a thoughtful procurement posture, and functioning core paths for directory browsing, messaging, service booking, posting needs, gig discovery, proposals, credentials, and earnings.

It is not ready for an unrestricted public launch today. The most important blockers are marketplace-trust and data-quality failures:

1. A district can publish a materially empty need with no expertise, grade band, date, duration, compensation, or description.
2. A profile can display **“Credentials reviewed”** while its credential tab says no credentials have been uploaded and the profile reports zero certifications.
3. The educator directory returned a profile outside the selected support-type filter.
4. The tested marketplace contained QA/test identities and low-quality listings. This was confirmed in the isolated development dataset; production authenticated data still requires a separate cleanup audit.
5. Production authentication could be inspected but not completed because no production-safe role accounts were available. Public launch should not proceed without a full production district/educator smoke test.

K12GIG can support a carefully managed beta because the main product architecture works. Public launch should wait until marketplace truth, production data, form quality gates, and accessible form semantics are corrected.

## Scores

| Dimension | Score | Rationale |
|---|---:|---|
| **Overall launch readiness** | **57/100** | Working product and polished brand, offset by trust, listing-quality, accessibility, and production-verification gaps. |
| UI quality | 78/100 | Distinctive, consistent, professional visual language; some crowded dashboard/table states and sparse dead ends. |
| UX quality | 64/100 | Core role paths are understandable; search depth, state flicker, incomplete listings, and contradictory help copy create friction. |
| Accessibility | 56/100 | Strong headings, readable color treatment, and many named controls; several critical inputs/buttons are unnamed and errors are not announced. |
| Performance | 72/100 | Fast cached response times and stable visual loading; heavy hero image, revalidation policy, and sizable initial JavaScript create avoidable cost. |
| Trust | 43/100 | Good legal/procurement surfaces, but credential truth, test data, unsupported claims, and deferred background checks undermine confidence. |
| Marketplace competitiveness | 46/100 | K–12 specialization is valuable; discovery, reputation depth, listing quality, payments, and workflow maturity trail Fiverr and Upwork. |

## Audit scope and evidence limits

### Tested directly

- Live production domain: `https://k12gig.com`
- Production homepage, sign-in shell, sign-up shell, cookie consent, TLS, response/security headers
- Isolated local development application with sanctioned demo district and educator accounts
- District login/logout, dashboard, directory, filters, sorting, profile, services, checkout validation, post-a-need flow, messaging, and settings
- Educator login, dashboard, gig board, proposals, settings, credentials, existing gigs, earnings, and messaging
- Anonymous browse gate, pricing, help, about, privacy, terms, DPA/procurement, and 404
- Desktop and narrow responsive DOM/reflow states
- Form semantics, control names, error announcement, focus styling, and representative contrast/touch-target checks
- Production response timings, HTML transfer, initial JavaScript transfer, and key image asset sizes
- Current official Fiverr and Upwork documentation for discovery, reputation, messaging, proposals, job posts, and payment protection

### Not fully verified

- No production account was created and no production credentials were available, so production role dashboards/data were not mutated or authenticated end to end.
- Fresh-account onboarding and password reset were not completed.
- No real payment, invoice, payout, email, external message, credential upload, or background check was submitted.
- Admin-only workflows were not available with the supplied demo roles.
- A screen reader was not run. Accessibility findings are semantic/interaction risks, not a WCAG conformance certification.
- Automated Core Web Vitals were unavailable in the in-app browser security sandbox; Google PageSpeed’s public endpoint returned a quota error. LCP, CLS, and INP therefore remain a verification gap.
- The in-app browser compositor tiled fixed elements in narrow screenshots. Responsive behavior was validated through the live DOM and viewport metrics; invalid narrow screenshots were rejected rather than used as evidence.

## Flow audit: numbered steps and health

| Step | Flow surface | Health | Result |
|---:|---|---|---|
| 1 | Live production homepage | **Healthy with trust risks** | Loads over HTTPS, strong first impression, clear dual audience; proof behind “trusted nationwide,” “vetted,” and “zero days” is insufficient. |
| 2 | Role-choice login hub | **Healthy** | District and educator paths are immediately understandable. |
| 3 | Production sign-in shell | **Healthy, incomplete verification** | Uses `clerk.k12gig.com` and does not show Development mode. Authentication was not completed in production. |
| 4 | Production sign-up shell | **Healthy, incomplete verification** | Clear email/password form and legal links; account creation/onboarding were not completed. |
| 5 | Anonymous directory | **Needs improvement** | Explains the district-only gate, but displays a disabled filter-heavy interface before the user can see marketplace value. |
| 6 | District authentication/logout | **Healthy** | Email verification completed in development and routed to the correct district workspace; logout returned home. |
| 7 | District dashboard | **Mostly healthy** | Useful overview and pipeline, but initial auth hydration can briefly show stale/incorrect workspace content. |
| 8 | Directory discovery | **Fail** | Filter and sort controls work mechanically, but support-type filtering returned an off-category profile. QA/test profiles were present in the dev roster. |
| 9 | Educator profile | **Fail** | Strong hierarchy and services; “Credentials reviewed” contradicts zero certifications and no uploaded credentials. |
| 10 | Service checkout | **Needs improvement** | Pricing and 18% fee are transparent; invoice terminology is confusing and required inputs lack accessible names/error relationships. |
| 11 | Post a need | **Fail** | Three-step flow is easy, but it published a need without enough information for an educator to assess it. |
| 12 | District messaging | **Healthy** | Clear empty state, profile-to-thread handoff, message templates, and disabled send until content exists. No message was transmitted. |
| 13 | District settings | **Needs improvement** | Clear account/procurement paths; notification preferences are only browser-persisted while account storage is unfinished. |
| 14 | Educator dashboard | **Needs improvement** | Pipeline is understandable, but test organizations are visible and important routes such as Earnings/My Gigs are not in primary navigation. |
| 15 | Existing gig management | **Mostly healthy** | Listings and deactivate actions are clear; the route is not discoverable from the educator sidebar. |
| 16 | Educator gig board | **Fail** | Proposal entry works, but the board exposes incomplete and QA/test listings, including the intentionally under-specified audit post. |
| 17 | Proposal flow | **Needs improvement** | Context and native required validation are clear; rate/unit/file controls need accessible labels. |
| 18 | Educator profile/credential settings | **Needs improvement** | Comprehensive editor; background checks are deferred and several controls have weak semantics. |
| 19 | Earnings | **Mostly healthy** | Clear read-only history and payout explanation; manual weekly payout and payment-protection expectations need stronger operational assurance. |
| 20 | Pricing/help/about | **Fail on copy consistency** | Pricing is transparent, but Help says card checkout and new gig creation exist while the product says both are disabled. About lacks concrete company/team proof. |
| 21 | Privacy/Terms/DPA | **Healthy with legal-review caveat** | Substantive policies and procurement intake are present. Legal sufficiency should still be confirmed by counsel. |
| 22 | 404 | **Healthy** | Clear recovery paths and support link. |
| 23 | Responsive reflow | **Mostly healthy** | At a narrow viewport, DOM width stayed within the viewport and the mobile menu exposed all major links. Full visual evidence was limited by the capture compositor. |
| 24 | Performance | **Needs improvement** | Production TTFB was good, but the likely hero/LCP image is 925 KB with revalidation and the homepage loads about 349 KiB of compressed JavaScript. |

## Screenshot evidence

### Live product and role entry

![Live production homepage](evidence/33-production-home.png)

The live domain is polished and clearly states the product promise. It also makes high-confidence trust claims without visible proof such as named district logos, case studies, counts, or testimonials.

![Role-choice login hub](evidence/03-login-role-choice.png)

Role selection is one of the strongest flows: two clear paths, plain language, and low decision load.

### Marketplace discovery and trust

![Signed-in district directory](evidence/08-directory-signed-in.png)

The directory has a strong visual system and useful filter categories. The tested dev roster included QA/test identities and inconsistent raw grade labels such as `k5` and `all`.

![Selected support filter still showing four results](evidence/09-filter-mismatch.png)

With **Instruction & Curriculum** and **Available now** selected, the DOM still contained “Dr. Teach,” whose visible categories were only **Data & Accountability** and **AI & Educational Technology**.

![Educator profile trust badge](evidence/10-educator-profile.png)

The profile foregrounds rate, availability, experience, and K–12 specialties well. It also presents a high-trust “Credentials reviewed” badge.

![Credential tab beneath the reviewed badge](evidence/12-credential-trust-contradiction.png)

The same profile reported zero certifications and the Credentials tab stated that no credentials had been uploaded. This is the most serious trust contradiction in the tested experience.

### District conversion

![Checkout validation](evidence/14-checkout-validation.png)

The pricing summary and 18% fee are transparent. “ACH Bank Transfer (Net-30 Invoice)” conflates district invoicing with ACH, and the visible error is not programmatically associated with the date input or announced through a live region.

![Post-a-need details can remain empty](evidence/17-post-need-review.png)

The final posting step permits blank compensation and description fields; earlier optional fields can also be blank.

![Empty-detail need successfully posted](evidence/18-post-need-empty-details-result.png)

The application confirmed publication rather than saving a draft or asking for enough information to create a credible marketplace listing.

### Educator experience

![Educator dashboard with test organization](evidence/23-educator-dashboard.png)

The educator dashboard is readable and action-oriented, but the active pipeline included a `TEST 1` organization.

![Under-specified and test gig-board listings](evidence/28-gig-board-poor-listing.png)

The newly created audit need appeared as only **Student Support Services**, with no grade, compensation, date, expertise, or description. `TEST 1` and other QA-style organizations were also visible.

![Proposal required-field validation](evidence/29-proposal-form.png)

The proposal narrative is required and native validation works. The optional rate input, rate unit, and attachment control need clearer accessible names.

### Help and recovery

![Help page feature claims](evidence/31-help.png)

Help advertises card checkout and gig creation, while Checkout says cards are hidden and My Gigs says new listings are no longer created.

![404 recovery](evidence/32-404.png)

The 404 is a strong example of the product’s visual language applied to a useful empty/error state.

## Reproducible bug list

### K12-AUD-001 — Critical — Materially empty need can be published

**Reproduction**

1. Sign in as a district user in the isolated development environment.
2. Open **Post a Need**.
3. Keep the auto-filled organization, select only a support type, and continue.
4. Leave date and duration blank.
5. Leave compensation and description blank.
6. Select **Post This Need**.

**Expected:** Require enough structured information to evaluate the opportunity, or save the item as a draft.  
**Actual:** The need publishes and appears on the educator Gig Board with only the organization and support type.  
**Evidence:** `17-post-need-review.png`, `18-post-need-empty-details-result.png`, `28-gig-board-poor-listing.png`.

### K12-AUD-002 — Critical — “Credentials reviewed” shown when no credentials exist

**Reproduction**

1. Sign in as a district user.
2. Open Sarah Jenkins from the directory.
3. Observe **Credentials reviewed** and **0 Certifications**.
4. Open the **Credentials** tab.

**Expected:** A reviewed badge should require at least one reviewed artifact, or explicitly say what was reviewed.  
**Actual:** The tab says no credentials have been uploaded.  
**Risk:** Misleading trust/compliance signal to districts.

### K12-AUD-003 — High — Support-type filter returns off-category profile

**Reproduction**

1. Sign in as a district user.
2. Open the directory.
3. Select **Available Now**.
4. Select **Instruction & Curriculum**.
5. Inspect the four returned profiles.

**Expected:** Every result includes Instruction & Curriculum.  
**Actual:** “Dr. Teach” remained despite showing only Data & Accountability and AI & Educational Technology.

### K12-AUD-004 — High — QA/test marketplace content visible

**Reproduction**

1. Open the signed-in district directory and educator Gig Board in the isolated dev dataset.
2. Inspect names and organizations.

**Expected:** Only approved demo/founding-marketplace content.  
**Actual:** Entries included `qa-educator-jul6+clerk_test Name`, `Dr. Teach`, `TEST 1`, `QA Walkthrough Public Schools`, `Test District`, and weak test descriptions.  
**Production note:** Authenticated production data was not accessible; a production data audit is mandatory before launch.

### K12-AUD-005 — High — Checkout inputs and error lack accessible relationships

**Reproduction**

1. Open a bookable service as a district user.
2. Inspect the date and PO inputs with accessibility APIs.
3. Submit without a date.

**Expected:** Labels are associated by `for`/`id` or ARIA; the invalid field receives `aria-invalid`; the error is associated and announced.  
**Actual:** Both inputs had no `id`, name, `aria-label`, or `aria-labelledby`; the error had no live-region/alert semantics.

### K12-AUD-006 — High — Help copy contradicts active product behavior

**Reproduction**

1. Open Help.
2. Read the Educator and Billing cards.
3. Compare with My Gigs and Checkout.

**Expected:** Help reflects the current controlled-beta feature flags.  
**Actual:** Help says educators can create gigs and billing includes card checkout; active product copy says new gigs are no longer created and cards are hidden.

### K12-AUD-007 — High — Production role workflows remain unverified

**Reproduction**

1. Open `https://k12gig.com/sign-in?intent=district` and educator sign-in.
2. Note that production-safe test accounts were not supplied.

**Expected:** Prelaunch runbook includes production-safe district and educator accounts and a successful smoke record.  
**Actual:** Only the public/auth shell could be verified without risking real accounts/data.

### K12-AUD-008 — Medium — Auth hydration flashes incorrect account state

**Reproduction**

1. Navigate between authenticated public and workspace pages on a cold load.
2. Observe the first 0.5–1.7 seconds before user/role data resolves.

**Expected:** Neutral loading shell or correct cached role.  
**Actual:** “Finish setup,” a district workspace, or stale listing content can briefly appear for an onboarded educator before settling.

### K12-AUD-009 — Medium — District Gig Board is a visible dead end

**Reproduction**

1. Sign in as a district.
2. Select **Gig Board** in the sidebar.

**Expected:** District-appropriate posted-need management, or no navigation item.  
**Actual:** Only a heading and description are shown in a large empty page.

### K12-AUD-010 — Medium — Several educator controls are unnamed or semantically weak

**Affected controls**

- Dashboard availability toggle: unnamed button
- Public-profile starting-rate input: unnamed spinbutton
- Hourly/Daily selection: checkboxes used for a mutually exclusive choice
- Proposal rate and unit: unnamed spinbutton and combobox
- Proposal attachment: generic clickable text rather than a clearly exposed upload control

### K12-AUD-011 — Medium — Notification preferences are browser-only

**Expected:** Account-level preferences follow the user across browsers/devices.  
**Actual:** District Settings explicitly says notification preferences are saved only in the current browser while account persistence is being connected.

### K12-AUD-012 — Medium — Homepage trust claims lack visible substantiation

**Claims:** “in zero days,” “Trusted by school districts nationwide,” “Vetted for quality.”  
**Gap:** No named customer proof, case studies, quantified outcomes, verification definition, or launch-status explanation appears near the claims.

### K12-AUD-013 — Medium — Heavy hero asset and initial JavaScript

**Measured production indicators**

- Hero art: **924,597 bytes** (`chalkboard-hero-art.jpg`)
- Hero image response: `Cache-Control: public, max-age=0, must-revalidate`
- Homepage initial JavaScript: **356,815 compressed bytes** across 21 script requests, excluding later third-party work

**Expected:** Responsive AVIF/WebP hero variants, long immutable asset caching, and less client JavaScript on a marketing page.

### K12-AUD-014 — Low — Nested interactive elements on homepage

Four homepage actions use a `<button>` inside an `<a>`: Get started, Search Educators, How districts hire, and Create Educator Profile. This creates invalid nested interaction semantics and can produce duplicate/ambiguous focus or announcement behavior.

### K12-AUD-015 — Low — Taxonomy labels leak raw formatting

Directory cards show values such as `k5` and `all`, while the rest of the product uses **K–5** and **All Grades**.

## Page-by-page UI scores

| Page/surface | Score /10 | Notes |
|---|---:|---|
| Production homepage | 8.0 | Strong identity, hero, category structure; trust claims need evidence. |
| Login role hub | 8.5 | Best-in-product clarity and decision design. |
| Sign-in / sign-up | 7.0 | Clean Clerk shell and legal links; generic styling, transient auth state, reset/onboarding unverified. |
| Anonymous browse | 6.0 | Gate is understandable; disabled marketplace chrome creates cognitive noise. |
| District directory | 7.0 visual / 5.0 functional | Strong card/filter system; content and filtering failures dominate. |
| Educator profile | 7.5 visual / 4.5 trust | Excellent hierarchy, serious verification contradiction. |
| Service checkout | 6.5 | Clear fee breakdown; terminology and accessibility need work. |
| Post a Need | 6.5 visual / 4.0 workflow | Calm three-step flow, insufficient quality controls. |
| District dashboard | 7.5 | Useful at-a-glance data; hydration flicker and sparse placement state. |
| District settings | 6.5 | Good structure; unfinished persistence. |
| Messages | 7.5 | Clear empty/composer states and helpful prompts. |
| Educator dashboard | 7.0 | Good pipeline hierarchy; hidden routes and test content. |
| My Gigs | 7.0 | Clear maintenance state; not discoverable from sidebar. |
| Gig Board | 5.0 | Attractive cards, poor data quality and listing completeness. |
| Proposal form | 7.0 | Strong context, simple completion; semantic gaps. |
| Educator settings | 7.0 | Comprehensive but dense; verification and input semantics need work. |
| Earnings | 7.0 | Clear read-only payout story; manual process needs operational trust. |
| Pricing | 7.5 | Transparent fee model; duplicate/awkward beta copy. |
| Help | 5.5 | Attractive but factually out of sync with product flags. |
| About | 6.0 | Clear positioning, insufficient company/team proof. |
| Privacy / Terms / DPA | 7.5 | Substantive, readable, procurement-aware. |
| 404 | 8.5 | Excellent recovery state. |

## UX review

### What a first-time user understands quickly

- K12GIG connects districts with K–12 educators/consultants.
- Districts browse, message, post needs, and request/book services.
- Educators build profiles and respond to district opportunities.
- The product is currently invoice/PO-first and charges districts an 18% platform fee.

### Highest-friction moments

- Anonymous visitors cannot inspect real marketplace supply before creating/signing into a district account.
- Signed-in search has no keyword search, only categorical filters and sorting.
- The most important trust claim—credential review—is not reliably tied to evidence.
- A district can create a low-information listing in three clicks, pushing clarification cost onto educators.
- Key educator destinations (My Gigs, Earnings) are not in the workspace navigation.
- The district sees a Gig Board navigation item that has no useful district state.
- “Request Availability,” direct service booking, posting a need, and messaging overlap without a clear hierarchy of when to use which path.

### Conversion friction

- The homepage asks districts to sign in before proving inventory quality.
- “Zero days” feels promotional without proof and can reduce credibility with procurement-minded users.
- No customer logos, named testimonials, district count, response-time evidence, insurance/security summary, or verification legend appears at the main conversion point.
- “Premier educator” is not defined.
- Background checks are explicitly deferred, which is honest, but weakens the “vetted” promise unless the badge taxonomy is precise.

## Accessibility audit

### Confirmed strengths

- Clear heading structure across primary pages.
- Strong hero contrast: white text on `rgb(9, 43, 32)`.
- Representative header navigation uses readable dark gray on white.
- The sampled focused header link had a visible solid green outline.
- Major desktop actions are generally at least 44 px high; responsive primary actions stack.
- Tabs expose tab roles and selected state; checkboxes and many primary inputs have accessible names.
- Responsive DOM metrics showed no horizontal document overflow at the tested narrow width.

### Confirmed/likely issues

| Risk | WCAG relevance | Priority |
|---|---|---:|
| Checkout date/PO inputs have no associated accessible name | 1.3.1, 3.3.2, 4.1.2 | High |
| Checkout error is not associated, marked invalid, or announced | 3.3.1, 3.3.3, 4.1.3 | High |
| Unnamed dashboard/profile/proposal controls | 4.1.2 | High |
| Nested links and buttons on homepage | 4.1.2; keyboard predictability | Medium |
| Mutually exclusive rate units exposed as checkboxes | 1.3.1, 4.1.2 | Medium |
| File attachment affordance is not clearly exposed as a control | 2.1.1, 3.3.2, 4.1.2 | Medium |
| Small/raw taxonomy labels reduce comprehension | 3.1.5 / usability | Low |

### Verification gaps

- Complete keyboard traversal could not be reliably automated by the in-app browser even though individual focus styling was confirmed.
- Screen reader announcements, modal focus trapping, 200% zoom, and forced-colors/high-contrast mode still require manual assistive-technology testing.
- No full contrast inventory was run; no obvious failure appeared in sampled primary text.

## Performance review

### Measured production indicators

| Metric | Result |
|---|---:|
| HTTPS status | 200 |
| Warm/cached TTFB samples | 132–292 ms |
| Total HTML response samples | 154–324 ms |
| Compressed homepage HTML | 13,895 bytes |
| Initial compressed JS | 356,815 bytes / 21 requests |
| Primary hero art | 924,597 bytes |
| Production caching | Vercel cache HIT for HTML; hero image revalidates (`max-age=0`) |
| Security transport | HTTP/2, HSTS, `X-Content-Type-Options`, `X-Frame-Options: DENY`, restrictive Permissions Policy |

### Opportunities

1. Convert hero art to responsive AVIF/WebP and target a substantially smaller mobile source.
2. Give fingerprinted/static brand images a long immutable cache policy.
3. Reduce marketing-page client JavaScript; defer account/auth code until interaction where possible.
4. Replace incorrect authenticated-state flashes with neutral skeletons.
5. Add purposeful skeleton states to profile, earnings, and role-shell hydration instead of temporarily rendering the wrong role/content.
6. Measure production LCP, CLS, and INP with Web Vitals/RUM and establish launch budgets.

## Marketplace benchmark

Benchmark scores are heuristic product-maturity comparisons based on K12GIG’s tested flows and current official comparator documentation, not accessibility-conformance claims about Fiverr or Upwork.

| Capability | K12GIG | Fiverr | Upwork | Gap and priority |
|---|---:|---:|---:|---|
| Homepage clarity | 8 | 9 | 8 | K12GIG is clear and differentiated; add proof. Medium. |
| Search/discovery | 5 | 9 | 9 | No keyword search; one confirmed filter failure. Critical/High. |
| Marketplace browsing | 5 | 9 | 9 | District-only gate and small/unclean supply reduce confidence. High. |
| Profile depth | 6 | 9 | 9 | Good K–12 fields; weak credential/reputation truth. Critical. |
| Listing/job quality | 4 | 9 | 9 | Under-specified needs can publish. Critical. |
| Reviews/reputation | 4 | 9 | 9 | Little visible completed-work proof or badge definition. High. |
| Messaging | 7 | 8 | 9 | Clear direct thread; limited history/context/notification depth. Medium. |
| Proposals/hiring | 6 | 7 | 9 | Solid basic response; no shortlist, comparison, screening, or proposal pipeline depth. Medium. |
| Payments/procurement | 6 | 8 | 9 | Strong PO awareness; manual operations and unclear protection/dispute state. High. |
| Dashboards/navigation | 7 | 8 | 9 | Clear shells; hidden educator routes and district dead end. Medium. |
| Accessibility semantics | 6 | 7 | 7 | K12GIG has confirmed labeling/nesting issues. High. |
| Loading/perceived performance | 7 | 9 | 9 | Fast response, but heavy hero/JS and auth flicker. Medium. |
| **Overall** | **5.8** | **8.7** | **9.0** | K12 niche is strong; marketplace trust and operating maturity are the main gap. |

### Comparator evidence

- [Fiverr search guide](https://help.fiverr.com/hc/en-us/articles/360049955673-Searching-freelancers-and-services-on-Fiverr-A-Guide) documents category/subcategory browsing plus filters for budget, delivery time, freelancer level, availability, language, and service options.
- [Fiverr’s search and recommendation system](https://help.fiverr.com/hc/en-us/articles/37332082211217-Fiverr-s-search-and-recommendation-system) considers reviews, pricing, availability, responsiveness, and service requirements.
- [Fiverr freelancer levels](https://help.fiverr.com/hc/en-us/articles/360010560118-Understanding-Fiverr-s-freelancer-levels) are tied to defined performance criteria and shown on cards, gig pages, and profiles.
- [Fiverr packages](https://help.fiverr.com/hc/en-us/articles/360010559138-What-are-packages) set clear scope, revisions, pricing, and extras before checkout.
- [Upwork talent search](https://support.upwork.com/hc/en-us/articles/17935950691347--Search-for-talent) includes keyword search, skills, rate, location, feedback, availability, saved lists, past hires, and verified-talent filters.
- [Upwork job-post guidance](https://support.upwork.com/hc/en-us/articles/211063408-How-to-post-a-job) emphasizes title, skills, scope, expertise, location, budget, description, billing verification, and payment protection.
- [Upwork proposal review](https://support.upwork.com/hc/en-us/articles/18010402882195--Review-job-proposals) supports bids, cover letters, samples/certifications, shortlists, messages, hiring, decline, and archive states.
- [Upwork payment protection](https://support.upwork.com/hc/en-us/articles/211062568-How-Upwork-protects-your-payments) makes hourly and fixed-price protections and dispute paths explicit.

## Persona conversion audit

| Persona | Would trust today? | Would create an account? | Likely blocker |
|---|---|---|---|
| Superintendent | No for public procurement | Maybe for a private pilot | Unsupported trust claims, deferred background checks, credential contradiction, limited company proof. |
| District administrator / HR | Conditional | Yes for beta | Directory is gated; listing quality and verification accuracy need repair. |
| Instructional coach | Conditional | Likely | Marketplace supply/reputation depth and unclear availability/request/booking hierarchy. |
| Independent consultant | Conditional | Likely | Manual payout operations, weak buyer-quality signals, test/incomplete jobs, hidden earnings/gig routes. |
| Educator | Conditional | Maybe | Opportunity quality, credential value, and absence of clear payment protection. |
| Vendor / small firm | No for broad rollout | Maybe for pilot | Team/company capability is present but contract, insurance, verification, and dispute expectations need stronger proof. |

## Copy review and recommended replacements

| Current copy | Problem | Recommended copy |
|---|---|---|
| “Find qualified K–12 consultants in zero days.” | Absolute/unproven claim. | “Find qualified K–12 specialists faster.” |
| “Trusted by school districts nationwide” | No visible proof. | “Built for district hiring and procurement” until named proof is available. |
| “Vetted for quality” | Overstates current credential/background-check state. | “Credential status shown clearly” or define exactly what “vetted” means. |
| “Credentials reviewed” | Contradicts no uploaded credentials. | “Identity verified,” “Profile reviewed,” or “1 credential reviewed,” based on the actual event. |
| “Premier educator” | Undefined badge. | Add a tooltip/legend with eligibility or remove until it has a rule. |
| “ACH Bank Transfer (Net-30 Invoice)” | Conflates payout rail and district invoice terms. | “Purchase order / Net-30 invoice.” |
| “Confirm & Invoice” | Sounds like immediate financial action while copy says no charge yet. | “Submit booking request” or “Create invoice request,” matching the actual state change. |
| “Invoice / PO only. Invoice / PO-first controlled beta.” | Repetitive and awkward. | “During beta, districts pay by approved purchase order or Net-30 invoice. Card payments are not yet available.” |
| Help: “create gigs” | Feature is disabled for new listings. | “Publish your profile and respond to district needs.” |
| Help: “Card checkout…” | Card checkout is hidden. | “Net-30 invoices, PO numbers, and payment notices are handled in the booking flow.” |
| “Expect responses within 24 hours.” | Unsubstantiated promise. | “Matched educators can review and respond from the Gig Board.” |

## Production-readiness checklist

| Area | Status | Notes |
|---|---|---|
| Live HTTPS/domain | ✅ | `k12gig.com` loads over HTTP/2 with HSTS. |
| Production auth branding | ✅ | Clerk loads from `clerk.k12gig.com`; no Development mode label. |
| Production role auth | ⚠️ | Not completed without safe production accounts. |
| Sign-up | ⚠️ | Shell and legal consent visible; account creation/onboarding not completed. |
| Password reset | ⚠️ | Not completed. |
| District login/logout | ✅ dev | Completed in isolated development. |
| Educator login | ✅ dev | Completed in isolated development. |
| Directory/filtering | ❌ | Confirmed filtering mismatch. |
| Profile trust truth | ❌ | Reviewed badge contradicts empty credentials. |
| Need-post quality | ❌ | Materially empty listing published. |
| Messaging | ✅ dev | Thread creation and composition work; no message sent. |
| Checkout | ⚠️ | Invoice flow and validation visible; no final invoice/payment submitted. |
| Payouts | ⚠️ | Manual weekly process; no payout tested. |
| Uploads | ⚠️ | Credential/upload interfaces inspected; no file transmitted. |
| Notifications | ⚠️ | No notification center; preferences partly browser-only. |
| Legal/privacy/DPA | ✅ surface | Pages and intake exist; counsel/ops readiness not independently certified. |
| Security headers | ✅ / ⚠️ | Strong baseline; production CSP still permits `unsafe-inline` and `unsafe-eval`. |
| 404/recovery | ✅ | Clear and useful. |
| Test/placeholder data | ❌ dev | Data cleanup required; production authenticated data unverified. |
| Console/runtime | ⚠️ | No tested workflow was stopped by a JS error; local environment emitted expected Clerk development-key warnings. |
| Responsive layout | ✅ / ⚠️ | DOM reflow passed tested width; full visual capture/zoom audit remains. |
| Core Web Vitals | ⚠️ | No trustworthy LCP/CLS/INP measurement available in this run. |

## Prioritized launch plan

### Critical — must fix before public launch

1. **Enforce minimum need quality.** Require expertise/title, grade or audience, work description, timing, and compensation/budget or explicitly save as draft.
2. **Make verification truthful.** Define each badge, tie it to auditable events, remove “Credentials reviewed” where no credential exists, and backfill existing profiles.
3. **Fix and regression-test directory filters.** Cover every support type, multi-category profile, quick filter, clearing, and sort combination.
4. **Run a production data-quality sweep.** Remove test/QA identities and listings, approve founding supply, and verify every public badge/rate/category.
5. **Complete production role smoke tests.** Use dedicated production-safe district and educator accounts to validate sign-up, onboarding, login, logout, browse, profile, message, posting, proposal, booking request, settings, and invoice creation.

### High priority — fix this week

1. Associate all labels and errors in checkout, proposals, profile rate, uploads, and dashboard toggles.
2. Remove nested link/button controls and perform a complete keyboard/screen-reader pass.
3. Correct Help, Pricing, Checkout, and My Gigs copy to match active feature flags.
4. Replace auth-role flashes with neutral loading/skeleton states.
5. Remove or build the district Gig Board destination.
6. Define “Premier,” “Verified,” “Cleared,” and credential/background-check states in a visible trust legend.
7. Add named proof: pilot districts, testimonials, case studies, or remove unsupported claims until approved.
8. Establish launch monitoring for auth failures, listing publication, filter zero/mismatch states, message failures, and invoice creation.

### Medium priority

1. Add keyword search and richer district filters (rate, verified artifact, experience, languages, delivery mode, saved lists).
2. Add My Gigs and Earnings to educator navigation.
3. Persist notification settings at account level and add an in-product notification surface.
4. Optimize and cache hero imagery; reduce marketing-page JavaScript.
5. Add job/listing quality guidance, preview, and edit-before-publish states.
6. Add district/client trust details for educators: verified organization, response history, payment status, and clear scope.
7. Add comparison/shortlist tools and a proposal pipeline for districts.
8. Normalize taxonomy labels and date/rate formatting.

### Nice to have after launch

- Saved searches and alerts
- Guided matching recommendations
- Profile work samples/case studies
- Structured interview/screening questions
- Contract milestones and richer dispute/protection flows
- Team/shared district shortlists
- Response-time and availability signals grounded in real behavior

## Final recommendation

### ❌ Delay unrestricted public launch

The product is visually credible and functionally substantial, but the current marketplace can communicate false trust, accept poor-quality demand, and return incorrect discovery results. Those problems are more damaging at launch than a missing convenience feature because they affect whether districts and educators can believe what the marketplace tells them.

Proceed with an invitation-only beta only after the five Critical items are complete and a fresh production-role smoke test is documented. Re-audit the trust badges, directory filters, listing publication, authenticated production data, and accessible checkout/proposal forms before changing the verdict.
