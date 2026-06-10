# K12Gig — Chris demo walkthrough (meeting script)

Use this as a **click-by-click guide** for walking Chris through the product today. Estimated run time: **45–60 minutes** with discussion.

For account setup and seed troubleshooting, see [`DEMO_SEED_CREDENTIALS.md`](./DEMO_SEED_CREDENTIALS.md).

---

## Before the meeting (10 min)

### 1. Start the app

```bash
cd edugig
npm run dev
```

Note the port in the terminal (often `3000` or `3001`). Use that base URL below — replace `http://localhost:3000` if yours differs.

### 2. Confirm demo data is loaded

```bash
npx convex run seed:populate '{"seedSecret":"k12gig-controlled-beta-2026"}'
```

Expected: `"status": "already_populated"` or `"status": "populated"`.

### 3. Open two browser contexts (recommended)

| Window | Purpose |
|--------|---------|
| **Chrome normal** | District user (Jordan / Austin ISD) |
| **Chrome incognito** (or another browser) | Educator user (Sarah) |

This avoids signing in/out constantly.

### 4. Sign-in cheat sheet

All demo accounts use **email code only** — no passwords.

| Role | Email | Code |
|------|-------|------|
| **District (Jordan Rivera)** | `demo-district+clerk_test@example.com` | `424242` |
| **Educator (Sarah Jenkins)** | `demo-educator1+clerk_test@example.com` | `424242` |
| Educator (Miguel) | `demo-educator2+clerk_test@example.com` | `424242` |
| Educator (Alana) | `demo-educator3+clerk_test@example.com` | `424242` |

**Always use role-specific sign-in URLs** so demo users skip the “district vs educator” picker:

- District: `http://localhost:3000/sign-in?intent=district`
- Educator: `http://localhost:3000/sign-in?intent=educator`

### 5. Sign out between demos

Click the **avatar (UserButton)** at the bottom of the dark sidebar → **Sign out**.

---

## What to tell Chris upfront (30 seconds)

> “K12Gig has two workspaces: **district hiring** (browse, post needs, book services) and **educator** (profile, gigs, earnings). We’ll walk the public site first, then the district hiring path end-to-end, then the educator side. Everything today is on our dev environment with seeded demo accounts.”

---

## Part 1 — Public / marketing (no sign-in) · ~8 min

**Goal:** Show how a visitor experiences the brand before auth.

| Step | Go to | Point out |
|------|-------|-----------|
| 1.1 | `/` | Hero, value prop, “Search Educators” CTA, trust signals |
| 1.2 | Scroll homepage | “How districts hire” section, category tiles, educator CTA |
| 1.3 | `/pricing` | Plans / positioning (if relevant to conversation) |
| 1.4 | `/about` | Mission copy |
| 1.5 | `/browse` **while signed out** | Directory is **gated** — banner asks for district sign-in; live roster does not load for anonymous users |
| 1.6 | `/login` | **Two-path sign-in hub** — “I hire educators” vs “I’m an educator” |

**Talking point:** The live educator directory is intentionally district-only; educators manage profiles separately.

---

## Part 2 — District hiring path (hero workflow) · ~20 min

**Sign in:** `demo-district+clerk_test@example.com` → code `424242`  
**URL:** `/sign-in?intent=district`

After sign-in you should land on the **District dashboard** (`/dashboard/district`). If you briefly see onboarding, wait a second — seeded accounts auto-link and redirect.

### 2.1 District dashboard

| Step | Go to | Point out |
|------|-------|-----------|
| 2.1 | `/dashboard/district` | KPI cards (openings, placements, spend), talent pipeline table |
| 2.2 | Sidebar | **District** workspace badge, nav: Dashboard · Directory · Create Request · Messages · Settings |

### 2.2 Browse & discover educators

| Step | Go to | Point out |
|------|-------|-----------|
| 2.3 | `/browse` (Directory in sidebar) | Green “verified district directory” badge, **3 educators** (Sarah, Miguel, Alana) |
| 2.4 | Use filters | Support type, grade band, engagement type, quick filters |
| 2.5 | Click **Sarah Jenkins** | Full profile: headline, bio, verification badge, tabs |

### 2.3 Profile → book a service

| Step | Go to | Point out |
|------|-------|-----------|
| 2.6 | Sarah’s profile → **Services** tab | Two bookable gigs from seed data |
| 2.7 | **Curriculum Mapping Workshop** ($450 fixed) → **Book this service** | Checkout page with order summary, platform fee breakdown |
| 2.8 | Fill checkout form | Start date, optional PO number, invoice / PO payment path |
| 2.9 | Submit booking | Confirmation state; order created in Convex when signed in as district |

**Sarah’s seeded services:**

- Curriculum Mapping Workshop — **$450 fixed**
- Literacy Coaching Block — **$75/hr**

**Talking point:** This is the core “district finds educator → books service” loop.

### 2.4 Post a need (alternative district flow)

| Step | Go to | Point out |
|------|-------|-----------|
| 2.10 | `/post` (Create Request in sidebar) | Multi-step need form: org, support type, grade, engagement, compensation |
| 2.11 | Complete & submit | Need saved to district workspace (preview/submit flow) |

**Talking point:** “Post a Need” is for open reqs; “Book this service” is for educator-listed gigs.

### 2.5 Other district surfaces (optional, time permitting)

| Step | Go to | Point out |
|------|-------|-----------|
| 2.12 | `/dashboard/messages` | Messaging shell (threads appear when conversations exist) |
| 2.13 | `/dashboard/district/settings` | District account settings |

---

## Part 3 — Educator workspace · ~15 min

**Sign out** district user.  
**Sign in:** `demo-educator1+clerk_test@example.com` → code `424242`  
**URL:** `/sign-in?intent=educator`

### 3.1 Educator dashboard

| Step | Go to | Point out |
|------|-------|-----------|
| 3.1 | `/dashboard/educator` | **“Welcome back, Sarah”** as primary heading; pipeline stats, availability toggle |
| 3.2 | Sidebar | **Educator** workspace badge; nav: Dashboard · Directory · My Gigs · Messages · Settings |
| 3.3 | Toggle availability | “Accepting district requests” vs closed |

### 3.2 Manage gigs

| Step | Go to | Point out |
|------|-------|-----------|
| 3.4 | `/dashboard/educator/my-gigs` | Sarah’s two live gigs (Curriculum Mapping, Literacy Coaching) |
| 3.5 | `/dashboard/educator/gigs/new` | Create new gig flow (show form; submitting creates real gig if signed in) |

### 3.3 Profile & credentials

| Step | Go to | Point out |
|------|-------|-----------|
| 3.6 | `/dashboard/educator/settings` | Profile editing, headline, bio, rates, taxonomy tags |
| 3.7 | Credentials section | Verification / credential upload UI |

### 3.4 Educator on browse (intentional restriction)

| Step | Go to | Point out |
|------|-------|-----------|
| 3.8 | `/browse` while signed in as Sarah | Empty state: **“Use a district account”** — educators don’t browse the hiring directory |

**Talking point:** Role separation keeps each workspace focused.

### 3.5 Other educator surfaces (optional)

| Step | Go to | Point out |
|------|-------|-----------|
| 3.9 | `/dashboard/educator/earnings` | Earnings view |
| 3.10 | `/dashboard/educator/needs` | District needs visible to educators |

---

## Part 4 — New user / onboarding (optional) · ~5 min

Only show if Chris asks about first-time signup.

| Step | Action | Point out |
|------|--------|-----------|
| 4.1 | Sign out, go to `/sign-up?intent=district` or `?intent=educator` | Clerk sign-up |
| 4.2 | After auth | Onboarding wizard: role-specific steps (district org info vs educator profile) |
| 4.3 | `/onboarding` with no intent | “Choose your workspace” — district vs educator cards |

**Note:** Demo seeded accounts skip onboarding because they’re pre-populated with `onboarded: true`.

---

## Part 5 — Quick comparison slide (verbal, 1 min)

| | District (Jordan) | Educator (Sarah) |
|--|-------------------|------------------|
| **Primary job** | Hire & book | Get hired & manage gigs |
| **Directory** | Full live roster | Blocked (by design) |
| **Create** | Post a Need | My Gigs / new gig |
| **Book** | Book from profile Services tab | N/A |
| **Dashboard** | HR overview & pipeline | Welcome + earnings pipeline |

---

## Suggested meeting agenda (45 min)

| Time | Section |
|------|---------|
| 0:00–0:05 | Intro + confirm dev app is running |
| 0:05–0:13 | Part 1 — Public site |
| 0:13–0:33 | Part 2 — District path (browse → Sarah → book → post need) |
| 0:33–0:48 | Part 3 — Educator path (Sarah dashboard → my gigs → settings) |
| 0:48–0:55 | Questions, roadmap, next steps |
| Buffer | Part 4 onboarding only if asked |

---

## Known demo limitations (say these if something looks empty)

| What you might see | Why | What to say |
|--------------------|-----|-------------|
| Empty pipeline on dashboards | No orders booked yet in this session | “Pipeline fills once bookings exist — we can create one live in the district flow.” |
| No messages | No threads started | “Messaging UI is in place; threads appear after district–educator contact.” |
| Card payment hidden | Controlled beta is invoice / PO-first | “Card checkout is intentionally deferred until production Stripe is verified.” |
| Brief “Choose your workspace” after sign-in | Seed link takes a moment, or sign-in without `?intent=` | “Seeded accounts auto-redirect; use intent URLs to skip.” |
| Admin dashboard | Requires superadmin account | “Admin is internal-only — not part of today’s district/educator demo.” |

---

## Troubleshooting during the meeting

| Problem | Fix |
|---------|-----|
| Browse shows 0 educators | Sign in as **district** account; confirm green directory badge |
| “Incorrect code” | Email must include `+clerk_test`; code is always `424242` |
| Wrong dashboard after sign-in | Sign out → use `/sign-in?intent=district` or `?intent=educator` |
| Educator name wrong on dashboard | Sign out/in once to refresh seed link |
| App won’t start | `cd edugig && npm run dev`; check `.env.local` has Clerk + Convex keys |

---

## After the meeting — optional follow-ups

- [ ] Book a second service (Literacy Coaching) to show hourly pricing
- [ ] Sign in as Miguel or Alana to show roster variety
- [ ] Run Playwright smoke tests: `npx playwright test e2e/smoke.spec.ts e2e/checkout.spec.ts`
- [ ] Capture screenshots / Loom for async review

---

## One-line story for Chris

**District:** Sign in → browse 3 educators → open Sarah → Services → book workshop → optionally post a need.  
**Educator:** Sign in → see personalized dashboard → manage gigs & profile → districts book you from the directory.
