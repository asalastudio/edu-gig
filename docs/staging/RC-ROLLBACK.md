# Private-data rollback gate

Status: **Blocked / not rehearsed live.** Controller owns any rollback. No production rollback, migration or cleanup is authorized.

Application rollback must retain private-aware authorization, version readers and streaming routes. Do not deploy the pre-private-file application against migrated data. A previous frontend/backend commit is eligible only after confirming it can read the current schema, encrypted objects and version identities without exposing private drafts or files. An alias change alone does not roll back Convex.

Before deployment, preserve frontend deployment ID/commit, compiled backend commit, exact resource map, private data export/hash, original-source manifest, encrypted copies/checkpoints and backed-up key ID/key. Record changes made after the snapshot, including reviewer work, separately.

Data recovery must restore metadata to verified encrypted copies with the correct key and retain source/version/event provenance. Never recreate public plaintext objects, restore old bearer URLs, merge independent contracts by filename, delete unrelated reviewer work or invent signing evidence. Restoring an old database export blindly can orphan new files or discard reviewer changes; reconcile source IDs and live dependencies first.

If the candidate fails authorization or cannot retrieve verified private bytes, stop mutable reviewer testing and deploy a compatible repair or verified private-aware rollback. Keep evidence private. A missing encryption key is a recovery blocker, not permission to decrypt into public storage. Key rotation and production migration require a separate design and authorization.
