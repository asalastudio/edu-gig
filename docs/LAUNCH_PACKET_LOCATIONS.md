# K12Gig Launch Packet — Where Everything Lives

**Updated:** May 28, 2026

## Google Drive (canonical — share with Chris)

Google Drive Desktop syncs **jordan@asala.ai → My Drive** (not Shared drives).

```text
My Drive/
└── Clients/                          ← agency clients root (NOT Shared drives)
    └── K12Gig/                       ← NOT Excellence-K12
        └── _Client-HQ/
            └── deliverables/
                ├── client-facing/    ← files live HERE (top level of this folder)
                │   ├── START_HERE.md
                │   ├── CLIENT_LAUNCH_READINESS_CHRIS.md
                │   ├── CLIENT_RESPONSE_TRACKER.csv
                │   └── CLIENT_LAUNCH_READINESS_EMAIL.md
                └── internal/         ← Asala-only
                    ├── CLIENT_LAUNCH_READINESS_REQUEST.md
                    ├── LAUNCH_EXECUTION_RUNBOOK.md
                    └── ...
```

**Local sync path (Finder):**  
`/Users/jordanrichter/Library/CloudStorage/GoogleDrive-jordan@asala.ai/My Drive/Clients/K12Gig/_Client-HQ/deliverables/client-facing/`

### If deliverables looks empty in drive.google.com

1. Confirm you are in **My Drive → Clients → K12Gig → _Client-HQ → deliverables → client-facing** (not Excellence-K12).
2. On Mac, open the Finder path above — files should be visible locally.
3. Check the **Google Drive menu bar icon** — wait until sync completes (checkmarks on files).
4. If web stays empty after sync, drag the files from Finder into **drive.google.com** in that folder (manual upload).

**Do not look in:** Shared drives, `Clients/Excellence-K12/deliverables`, or `K12Gig/deliverables` without `_Client-HQ`.

### Client-facing folder (send Chris links from here)

| File | Purpose |
|------|---------|
| `CLIENT_LAUNCH_READINESS_CHRIS.md` | → convert to Google Doc |
| `CLIENT_RESPONSE_TRACKER.csv` | → Open with Google Sheets |
| `CLIENT_LAUNCH_READINESS_EMAIL.md` | HubSpot draft source (do not share) |

### Internal folder (Asala team only)

| File | Purpose |
|------|---------|
| `CLIENT_LAUNCH_READINESS_REQUEST.md` | Full audit |
| `LAUNCH_EXECUTION_RUNBOOK.md` | Ops checklist |
| `CLICKUP_LAUNCH_TASKS.csv` | ClickUp import |
| `PRODUCTION_ENV_AUDIT.md` | Env reference |

---

## Source repo (engineering git)

`edugig/docs/` — same filenames; edit here first, then copy to Drive when updated.

---

## AiOS vault (local client hub — not shared with Chris)

`~/Desktop/AI-OS/02 Businesses/Asala/Clients/K-12 Gig/`

- `Hub.md` / `index.html` — client hub entry
- `Deliverables/` — mirror of key launch files

---

## What is *not* auto-wired yet

| Integration | Status |
|-------------|--------|
| **Google Drive Desktop** | ✅ Connected — files in sync path upload to cloud |
| **AiOS dashboard → Drive auto-publish** | ⏳ Planned ("deeper indexing" / AIOS bridge) — manual copy to Drive for now |
| **Composio (HubSpot/Sheets API)** | ❌ Separate OAuth — not required if you use Drive Desktop + HubSpot UI |
| **HubSpot** | Use HubSpot UI for draft; not blocked on Composio |

---

## Quick open (Terminal)

```bash
open "/Users/jordanrichter/Library/CloudStorage/GoogleDrive-jordan@asala.ai/My Drive/Clients/K12Gig/_Client-HQ/deliverables/client-facing/2026-05-28-launch-readiness"
```
