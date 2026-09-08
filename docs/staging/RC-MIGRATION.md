# Candidate migration gate

Status: **Blocked / pending controller live dry-run, apply, retirement and retrieval evidence.** This migration is staging-only. Exact dual staging maps do not grant production migration authority.

Controller baseline census from the original stable export reports 10 content-bearing sources (4 independent contracts, 6 proposal attachments) referencing 6 unique plaintext objects. This is an offline census, not a live dry-run. No educator resume/credential content pointers were found in that snapshot. Reconcile source IDs, snapshots, byte hashes and counts against a fresh live scan before applying anything. Preserve private exports and encryption-key recovery material; never rotate an existing key as part of deployment.

1. Verify exact stable resource identity and compiled reviewed backend commit via `qa.environment`. Confirm frontend uses the same commit. Preserve the prior export/hash, key backup and source manifest privately.
2. Invoke internal `privateMigration.migrateLegacy({dryRun:true})` with the exact staging admin client. Store the full result privately. Any blocked ownership/content, changed snapshot or safety bound requires reconciliation; do not guess from filenames.
3. After controller review, invoke `{dryRun:false,confirmation:"ENCRYPT_VERIFIED_STAGING_ORIGINALS",retireOriginals:false}`. Every source remains an independent identity. The action encrypts, reads/decrypts the stored copy, checks exact size/hash, then attaches only against the unchanged snapshot. Original records/events/status provenance are preserved.
4. Reconcile every checkpoint and authorized two-party retrieval against the private byte manifest. Verify unrelated user/admin/anonymous denial. Only then explicitly run the same action with `retireOriginals:true`. Retirement re-verifies ciphertext and refuses still-referenced originals. Shared source bytes require all references to be resolved. Do not treat migrated row count as unique object retirement count.
5. Verify pending sources/checkpoints, old plaintext URL denial and private downloads. Record each source outcome and unresolved row. Repeat apply/reset idempotence experiments on automation, never reset stable reviewer records.

Missing or invalid content, ambiguous credential strings, missing owners/relationships, changed source snapshots and the 500-row safety boundary fail closed. Resolve any pagination need explicitly. Text-only legacy contracts are not migrated; their drafts use the same private metadata/history policy. Old completed status is not external-signing evidence, and four old cards are never merged into a version chain.

Current implementation uses no public storage fallback. During the interval before migration, legacy content may be unavailable through the candidate application. Schedule reviewer access accordingly. Live concurrent same-ticket upload, >4.5 MiB streaming and old-URL denial remain explicit controller gates.

## Automation-only legacy rehearsal fixture

Normal base/supplementary seed remains encryption-first and cannot demonstrate migration by returning a zero-row dry run. Before stable migration, use the separate, temporary `legacy-migration-rehearsal-v1` fixture on exact automation only:

```sh
node scripts/staging/cli.mjs legacy-seed --automation --expected-commit=REVIEWED_FULL_SHA --confirm=CREATE_SYNTHETIC_LEGACY_REHEARSAL
node scripts/staging/cli.mjs legacy-status --automation
node scripts/staging/cli.mjs legacy-reset --automation --expected-commit=REVIEWED_FULL_SHA --confirm=RESET_IDENTIFIED_QA_FIXTURES
```

Between seed and reset, the controller runs the existing internal migration dry-run/apply, authorized byte/hash readback, retirement and no-op repeat. Expected newly seeded content: **three independent source rows sharing one fixed synthetic plaintext PDF** (two distinct agreements with the same filename/source ID, one proposal attachment), plus a separate text-only draft. One agreement is historically shared, one is private. Migration must preserve agreement identities/history, create two independent original versions and three source checkpoints, and retire one original object only after all references have migrated. Text-only draft remains unmigrated and private.

The command takes no imported bytes, identity replacements or source IDs. It resolves actual allowlisted base QA identities/memberships, verifies exact automation and compiled expected commit, and requires the explicit creation confirmation before storing its fixed, visibly marked PDF. Internal row finalization verifies exact digest/size and refuses storage already owned by a manifest. Repeating seed returns a no-op even after migration; it never recreates retired plaintext. Reset uses the namespace's exact manifest, including migration-derived encrypted files/checkpoints/versions, and preserves base/supplementary records. Reviewer-created dependents still block reset. Finish the rehearsal and reset **before** mutable journey dependencies. No real documents, auth bypass, production permission or change to normal encrypted seed behavior is introduced. Live rehearsal results remain controller-owned and pending for this amendment.
