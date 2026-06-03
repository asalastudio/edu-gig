# K12Gig Launch Packet — Internal Execution Runbook

**Audience:** Asala ops / launch team  
**Client:** Chris Brown · K12Gig · cjb2145@gmail.com  
**Chris does not use ClickUp** — client touchpoints are **HubSpot email + Google links only**.

---

## Chris-facing path (simplest)

| Step | Channel | Artifact |
|------|---------|----------|
| 1 | Email (HubSpot draft) | `CLIENT_LAUNCH_READINESS_EMAIL.md` |
| 2 | Read-only doc link | `CLIENT_LAUNCH_READINESS_CHRIS.md` (Google Doc or PDF in Drive) |
| 3 | Optional responses | `CLIENT_RESPONSE_TRACKER.csv` → Google Sheet (Chris edits **Client response** column only) |

**Do not** invite Chris to ClickUp, Linear, or AiOS/Obsidian.

---

## Execution checklist

### 1. Publish client doc (AiOS + Drive)

- [x] Source: `edugig/docs/CLIENT_LAUNCH_READINESS_CHRIS.md`
- [x] AiOS vault: `Desktop/AI-OS/02 Businesses/Asala/Clients/K-12 Gig/Deliverables/`
- [x] **Google Drive (canonical):**  
  `My Drive/Clients/K12Gig/_Client-HQ/deliverables/client-facing/2026-05-28-launch-readiness/`  
  *(This is the **Asala agency clients** area — top-level folder is `Clients/` on jordan@asala.ai Drive.)*
- [x] **Google Drive (internal):**  
  `My Drive/Clients/K12Gig/_Client-HQ/deliverables/internal/2026-05-28-launch-readiness/`
- [ ] Convert Chris doc to **Google Doc** in the client-facing folder → share viewer link
- [ ] Import tracker CSV as **Google Sheet** in the same folder → share editor link with Chris

### 2. Create Google Sheet (client tracker)

- [ ] Import `CLIENT_RESPONSE_TRACKER.csv` → new Sheet titled **K12Gig Launch — Chris Response Tracker**
- [ ] Share: Chris = **Editor** on sheet only; team = Editor
- [ ] Pin row 1; freeze header; optional data validation on Status: Pending / In progress / Done / N/A
- [ ] Copy share URL for email

### 3. HubSpot draft to Chris

- [ ] Open HubSpot → Contacts → Chris Brown (cjb2145@gmail.com)
- [ ] Create email draft from `CLIENT_LAUNCH_READINESS_EMAIL.md`
- [ ] Insert: **Readiness doc URL** and **Response tracker URL**
- [ ] Review internally; **do not send** until Jordan approves
- [ ] Log draft ID in AiOS hub or this runbook

### 4. ClickUp (internal only)

- [ ] Import `CLICKUP_LAUNCH_TASKS.csv` into Asala K12Gig launch list
- [ ] Dedupe by task name + tags `launch,p0,client`
- [ ] Assign engineering tasks to Asala; client rows reference Chris but stay in ClickUp for **your** tracking only

### 5. Schedule fallback call

- [ ] If no Chris response by **EOD May 28**, send one follow-up email
- [ ] Book **30-min launch decision call** (Calendly or HubSpot meetings)
- [ ] Agenda: launch mode, Stripe/Clerk owners, Checkr defer?, legal status, seed data sign-off

### 6. After Chris replies

- [ ] Follow **`BETA_LAUNCH_RUNBOOK.md`** (DNS → Clerk prod → env → deploy → beta data)
- [ ] Engineering: apply Vercel/Convex env updates (never commit secrets)
- [ ] Run production smoke test checklist from `CLIENT_LAUNCH_READINESS_REQUEST.md`
- [ ] Send **go/no-go summary** email to Chris
- [ ] Update ClickUp + sheet Status columns

---

## Credential handoff (never in email/Sheet/ClickUp)

| Secret | Handoff method |
|--------|----------------|
| Stripe keys | Vercel env or 1Password share to engineering |
| Clerk prod keys | Vercel + Convex env |
| Resend, Checkr, Sentry, Upstash | Vercel env |
| Sheet / email | Owner name + “provided via secure channel” only |

---

## File map

| File | Purpose |
|------|---------|
| `CLIENT_LAUNCH_READINESS_CHRIS.md` | Chris-facing doc |
| `CLIENT_LAUNCH_READINESS_REQUEST.md` | Full internal + client audit (engineering detail) |
| `CLIENT_LAUNCH_READINESS_EMAIL.md` | HubSpot draft body |
| `CLIENT_RESPONSE_TRACKER.csv` | Google Sheet import |
| `CLICKUP_LAUNCH_TASKS.csv` | Internal ClickUp import |
| `PRODUCTION_ENV_AUDIT.md` | Env reference for engineering |

---

## AiOS hub update

After URLs exist, add to `K-12 Gig/index.html` and `Hub.md`:

- Launch Readiness Request (Chris)
- Response Tracker (Google Sheet)
- HubSpot draft status
