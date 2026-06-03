# Cursor Prompt: AiOS Launch Packet Integration

Use this prompt inside the AiOS dashboard workspace.

```text
We need to connect the K12Gig / EduGig launch readiness packet into AiOS, HubSpot, and ClickUp.

Context:
- Client: Chris Brown / K12Gig / EduGig
- Launch target: May 29, 2026
- Current recommendation: controlled beta/client review unless P0 payment, auth, vendor, legal, and order lifecycle blockers are resolved.
- Source artifact files from the EduGig repo:
  - /Users/jordanrichter/Projects/Clients/EduGig/edugig/docs/CLIENT_LAUNCH_READINESS_REQUEST.md
  - /Users/jordanrichter/Projects/Clients/EduGig/edugig/docs/CLIENT_LAUNCH_READINESS_EMAIL.md
  - /Users/jordanrichter/Projects/Clients/EduGig/edugig/docs/CLICKUP_LAUNCH_TASKS.csv
  - /Users/jordanrichter/Projects/Clients/EduGig/edugig/docs/CLICKUP_LAUNCH_TASKS.md

Goal:
1. Make the launch readiness request visible in the AiOS dashboard as the source of truth for this client launch.
2. Create a shareable link to the readiness request document/page.
3. Create a HubSpot email draft to Chris Brown using the email draft file, replacing [Insert shared doc link] with the AiOS/shareable document URL.
4. Create or sync the ClickUp tasks from CLICKUP_LAUNCH_TASKS.csv into the correct ClickUp workspace/list.
5. Store the resulting AiOS document URL, HubSpot draft/email ID, and ClickUp task IDs back on the AiOS client/project record.

Implementation instructions:
- First inspect the AiOS codebase for existing integrations, env vars, services, API clients, and UI patterns for HubSpot, ClickUp, documents, client records, and launch/project dashboards.
- Use existing abstractions and naming conventions. Do not introduce a new integration style if one already exists.
- Do not commit API keys or secrets. Use existing env management. If missing, document required env vars without adding secret values.
- Do not send the HubSpot email automatically unless the app already has an explicit reviewed/send flow. Prefer creating a draft or pending outbound communication for review.
- Dedupe ClickUp tasks by task name plus launch/client tag so rerunning the sync updates existing tasks instead of creating duplicates.
- Preserve these CSV fields where ClickUp supports them: Task Name, Description, Priority, Status, Assignee, Due Date, Tags.
- If ClickUp assignee names do not map to users, leave tasks unassigned and add the intended owner in the task description.
- If HubSpot contact lookup for Chris Brown is ambiguous or missing, create the draft without sending and flag the missing contact resolution in AiOS.
- Add a dry-run mode if there is already a jobs/actions pattern, or log the planned HubSpot/ClickUp mutations before executing.

Acceptance criteria:
- AiOS has a client/project launch readiness entry for K12Gig with the full readiness request content or a linked document.
- The readiness entry has a shareable URL that can be sent to the client.
- HubSpot contains a reviewed draft email to Chris Brown with the readiness URL inserted.
- ClickUp contains the launch tasks from the CSV, with priority, due date, tags, and status mapped as closely as possible.
- AiOS shows sync status and external references for the document, HubSpot draft/email, and ClickUp tasks.
- Re-running the sync is idempotent and does not duplicate ClickUp tasks or HubSpot drafts without intent.
- Tests or a local verification script cover parsing the CSV, rendering the document/email body, and dedupe behavior.

Suggested implementation shape, if AiOS has no existing pattern:
- Add a server-side launch packet service:
  - load readiness markdown and task CSV
  - upsert AiOS launch packet record
  - create/update shareable document/page
  - create HubSpot draft
  - upsert ClickUp tasks
  - persist external IDs and sync errors
- Add an admin action/button on the AiOS client/project page:
  - "Sync Launch Packet"
  - dry-run preview first
  - final sync after confirmation
- Add env documentation for:
  - HUBSPOT_PRIVATE_APP_TOKEN or existing HubSpot connector config
  - CLICKUP_API_TOKEN or existing ClickUp connector config
  - CLICKUP_WORKSPACE_ID / CLICKUP_SPACE_ID / CLICKUP_FOLDER_ID / CLICKUP_LIST_ID as required by the existing integration

Important content rules:
- Do not include secret values in logs, UI, documents, or git.
- Do not disclose the actual Convex webhook shared secret.
- Keep the client-facing document polished and decision-oriented. Keep raw engineering detail in ClickUp/internal notes.
```

