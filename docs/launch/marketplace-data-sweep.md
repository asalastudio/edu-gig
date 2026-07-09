# Marketplace Data Sweep Runbook

This runbook inventories and removes QA/test marketplace records before launch. Development work must stop after the audit output; production deletion requires a reviewed export and an explicit operator confirmation.

## Safety model

- `npm run beta-launch:audit` and `npm run beta-launch:cleanup` are read-only.
- Incomplete legitimate open needs appear under `incompleteNeeds` for manual review. They are never automatic cleanup candidates solely because they are incomplete.
- Broad narrative signals such as the word “test” in a description appear under `reviewOnlyNeedSignals`; they never enter automatic cleanup by themselves.
- Procurement requests matched only by district-name heuristics and notifications matched only by title text appear in `reviewOnlyProcurementSignals` and `reviewOnlyNotificationSignals`. Only exact owner, district, or entity URL references enter the automatic cascade.
- Legacy credential `documentUrl` values are normalized against Convex’s `_storage` table before inclusion. Invalid or missing legacy objects appear under `reviewOnlyLegacyStorage` and are not passed to deletion.
- Founding profiles with `beta:founding:` Clerk ids are not classified as test records unless their email is on the explicit cleanup list.
- Deletion requires `BETA_LAUNCH_ENABLED=true`, the production launch secret, and the exact confirmation token embedded by `beta-launch:cleanup:confirm`.
- Cleanup removes related rows and stored uploads before owners so it does not intentionally leave orphaned marketplace data.
- Storage deletion is fail-closed: if any reviewed storage object cannot be deleted, the mutation aborts instead of reporting a partial success.
- Confirmed cleanup must include the exact candidate digest from the reviewed audit and the same exclusion list. Any data drift aborts deletion.

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
- incomplete published needs, heuristic procurement/notification matches, and unresolved legacy storage values (review-only);
- a cascade-count preview for every table and storage objects;
- a `candidateDigest`, exclusion list, and safety-check results;
- the confirmation phrase required by the destructive mutation.

Review every candidate with the product owner. To exclude a legitimate primary user, district, or need, set its exact Convex id in a comma-separated environment value and re-run the audit:

```bash
export BETA_CLEANUP_EXCLUDE_IDS="user_or_district_id,another_primary_id"
npm run beta-launch:audit
```

Record the final exclusions and audit output. Do not rely on name recognition alone.

`npm run beta-launch:cleanup` is an alias for the same non-destructive preview and can be used in operational checklists.

## 3. Confirm cleanup

Only after the export and candidate review are recorded:

```bash
export BETA_CLEANUP_CANDIDATE_DIGEST="digest-from-the-reviewed-audit"
npm run beta-launch:cleanup:confirm
```

The cleanup recomputes its complete cascade and aborts if the digest or safety assertions differ. Save the returned removal counts and compare them with the approved preview. If they differ unexpectedly, stop before running any seed or follow-up mutation and inspect the deployment.

## 4. Verify and close the maintenance window

1. Re-run `npm run beta-launch:audit`; cleanup-candidate counts should be zero and incomplete legitimate needs should still be listed for manual disposition.
2. Run district and educator production-safe smoke accounts through directory, profile, Posted Needs, Gig Board, proposal, booking request, messages, settings, and invoice creation.
3. Remove `BETA_LAUNCH_ENABLED` and `BETA_LAUNCH_SECRET` from the Convex deployment.
4. Attach the before/after audit outputs, cleanup counts, smoke record, and backup reference to the launch ticket.

## Recovery

The cleanup mutation is intentionally not self-reversing. If approved records were removed, pause launch activity and restore from the pre-cleanup Convex export before accepting new production writes.
