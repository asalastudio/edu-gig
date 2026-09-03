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

For the September 3 review, the candidate is running at `http://localhost:3010`. If restarted on a different port, replace that base URL below.

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

- District: `http://localhost:3010/sign-in?intent=district`
- Educator: `http://localhost:3010/sign-in?intent=educator`

### 5. Sign out between demos

Click the **avatar (UserButton)** at the bottom of the dark sidebar → **Sign out**.

---

## What to tell Chris upfront (30 seconds)

> “K12Gig has two workspaces: **district hiring** (post needs, review proposals, Contract Hub) and **consultant** (profile, proposals, My Gigs, Contract Hub). We’ll walk the public site first, then the district path end-to-end, then the consultant side. Payment stays off-platform. Everything today is on our dev environment with seeded demo accounts.”

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
| 2.1 | `/dashboard/district` | KPI cards (openings, placements, engagements), pipeline of posted needs |
| 2.2 | Sidebar | **District** workspace badge, nav: Dashboard · Directory · Posted Needs · Contract Hub · Messages · Settings |

### 2.2 Browse & discover educators

| Step | Go to | Point out |
|------|-------|-----------|
| 2.3 | `/browse` (Directory in sidebar) | Green “verified district directory” badge, **3 educators** (Sarah, Miguel, Alana) |
| 2.4 | Use filters | Support type, grade band, engagement type, quick filters |
| 2.5 | Click **Sarah Jenkins** | Full profile: headline, bio, verification badge, tabs |

### 2.3 Profile → post a need

| Step | Go to | Point out |
|------|-------|-----------|
| 2.6 | Sarah’s profile → **Areas of Support** | Support details, not a checkout cart |
| 2.7 | **Post a need** | Need form targeted at that consultant |
| 2.8 | Submit | Need appears on Posted Needs |

**Talking point:** Districts hire by posting a need and accepting a proposal. There is no K12Gig checkout or 18% fee.

### 2.4 Post a need (alternative district flow)

| Step | Go to | Point out |
|------|-------|-----------|
| 2.10 | `/post` (Create Request in sidebar) | Multi-step need form: org, support type, grade, engagement, compensation |
| 2.11 | Complete & submit | Need saved to district workspace (preview/submit flow) |

**Talking point:** “Post a Need” is the hiring path. Consultants respond with proposals; acceptance creates an engagement.

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
| 3.2 | Sidebar | **Consultant** workspace badge; nav: Dashboard · Gig Board · My Gigs · Contract Hub · Messages · Settings |
| 3.3 | Toggle availability | “Accepting district requests” vs closed |

### 3.2 Manage gigs

| Step | Go to | Point out |
|------|-------|-----------|
| 3.4 | `/dashboard/educator/my-gigs` | Accepted engagements, not consultant-created listings |
| 3.5 | `/dashboard/educator/contract-hub` | Document coordination; payment stays off-platform |

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
| 3.9 | `/dashboard/educator/contract-hub` | Working documents; payment stays off-platform |
| 3.10 | `/dashboard/educator/needs` | District needs visible to consultants |

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

| | District (Jordan) | Consultant (Sarah) |
|--|-------------------|------------------|
| **Primary job** | Post needs and accept proposals | Propose and manage accepted work |
| **Directory** | Full live roster | Blocked (by design) |
| **Create** | Post a Need | Proposal on an open need |
| **After accept** | Engagement + Contract Hub | My Gigs + Contract Hub |
| **Dashboard** | Openings, placements, pipeline | Active/completed engagements |

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
| Empty pipeline on dashboards | No accepted engagements yet in this session | “Pipeline fills once a proposal is accepted — we can do that live in the district flow.” |
| No messages | No threads started | “Messaging UI is in place; districts start conversations.” |
| No checkout | Payment is off-platform | “K12Gig does not process cards, ACH, or 1099s. Contract Hub holds the working documents.” |
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

- [ ] Accept a proposal and open Contract Hub on both dashboards
- [ ] Sign in as Miguel or Alana to show roster variety
- [ ] Run Playwright: `npm run test:e2e`
- [ ] Capture screenshots / Loom for async review

---

## One-line story for Chris

**District:** Sign in → browse consultants → post a need → accept a proposal → engagement + Contract Hub.  
**Consultant:** Sign in → publish profile and resume → propose → see the engagement on My Gigs → coordinate documents in Contract Hub. Payment and legally binding signatures stay off-platform.
