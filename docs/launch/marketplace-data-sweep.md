# Marketplace Data Sweep Runbook

This runbook inventories and removes QA/test marketplace records before launch. Development work must stop after the audit output; production deletion requires a reviewed export and an explicit operator confirmation.

## Safety model

- `npm run beta-launch:audit` and `npm run beta-launch:cleanup` are read-only.
- Incomplete legitimate open needs appear under `incompleteNeeds` for manual review. They are never automatic cleanup candidates solely because they are incomplete.
- Founding profiles with `beta:founding:` Clerk ids are not classified as test records unless their email is on the explicit cleanup list.
- Deletion requires `BETA_LAUNCH_ENABLED=true`, the production launch secret, and the exact confirmation token embedded by `beta-launch:cleanup:confirm`.
- Cleanup removes related rows and stored uploads before owners so it does not intentionally leave orphaned marketplace data.

## 1. Prepare and export

1. Confirm the target Convex deployment is production.
2. Create a current Convex backup/export and record its location in the launch ticket.
3. Set `BETA_LAUNCH_ENABLED=true` and `BETA_LAUNCH_SECRET` on the production Convex deployment for the maintenance window only.
4. In the operator shell, set `CONVEX_DEPLOY_KEY` and `BETA_LAUNCH_SECRET` without pasting their values into tickets or logs.

## 2. Run the read-only audit

```bash
npm run beta-launch:audit
```

The result contains:

- flagged users, districts, and needs with explicit reasons;
- incomplete published needs and their missing fields (review-only);
- a cascade-count preview for every table and storage objects;
- the confirmation phrase required by the destructive mutation.

Review every candidate with the product owner. Add legitimate false positives to an approved exception before cleanup; do not rely on name recognition alone.

`npm run beta-launch:cleanup` is an alias for the same non-destructive preview and can be used in operational checklists.

## 3. Confirm cleanup

Only after the export and candidate review are recorded:

```bash
npm run beta-launch:cleanup:confirm
```

Save the returned removal counts. Compare them with the approved preview. If they differ unexpectedly, stop before running any seed or follow-up mutation and inspect the deployment.

## 4. Verify and close the maintenance window

1. Re-run `npm run beta-launch:audit`; cleanup-candidate counts should be zero and incomplete legitimate needs should still be listed for manual disposition.
2. Run district and educator production-safe smoke accounts through directory, profile, Posted Needs, Gig Board, proposal, booking request, messages, settings, and invoice creation.
3. Remove `BETA_LAUNCH_ENABLED` and `BETA_LAUNCH_SECRET` from the Convex deployment.
4. Attach the before/after audit outputs, cleanup counts, smoke record, and backup reference to the launch ticket.

## Recovery

The cleanup mutation is intentionally not self-reversing. If approved records were removed, pause launch activity and restore from the pre-cleanup Convex export before accepting new production writes.
