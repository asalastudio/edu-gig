#!/usr/bin/env node
/**
 * Run controlled-beta data steps against production Convex.
 *
 * Usage (from edugig/):
 *   export CONVEX_DEPLOY_KEY="prod:…"
 *   export BETA_LAUNCH_SECRET="your-secret"
 *   node scripts/beta-launch.mjs audit
 *   node scripts/beta-launch.mjs cleanup --dry-run
 *   node scripts/beta-launch.mjs cleanup --confirm
 *   node scripts/beta-launch.mjs seed
 *
 * Requires BETA_LAUNCH_ENABLED=true on the Convex deployment (unset after launch).
 */

import { spawnSync } from "node:child_process";

const action = process.argv[2];
const mode = process.argv[3];
const secret = process.env.BETA_LAUNCH_SECRET;
const cleanupConfirmation = "DELETE_FLAGGED_MARKETPLACE_DATA";
const reviewedDigest = process.env.BETA_CLEANUP_CANDIDATE_DIGEST;
const excludedPrimaryIds = (process.env.BETA_CLEANUP_EXCLUDE_IDS ?? "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const mutations = {
  seed: "beta_launch:seedFoundingProfiles",
};

if (!action || !["audit", "cleanup", "seed"].includes(action)) {
  console.error("Usage: node scripts/beta-launch.mjs <audit|cleanup --dry-run|cleanup --confirm|seed>");
  process.exit(1);
}

if (action === "cleanup" && mode && !["--dry-run", "--confirm"].includes(mode)) {
  console.error("Cleanup requires --dry-run or --confirm.");
  process.exit(1);
}

if (!process.env.CONVEX_DEPLOY_KEY) {
  console.error("Missing CONVEX_DEPLOY_KEY (use production deploy key).");
  process.exit(1);
}

if (!secret) {
  console.error("Missing BETA_LAUNCH_SECRET in environment.");
  process.exit(1);
}

const isConfirmedCleanup = action === "cleanup" && mode === "--confirm";
if (isConfirmedCleanup && !reviewedDigest) {
  console.error("Missing BETA_CLEANUP_CANDIDATE_DIGEST from the reviewed audit output.");
  process.exit(1);
}
const operation =
  action === "audit" || (action === "cleanup" && !isConfirmedCleanup)
    ? "beta_launch:auditMarketplaceData"
    : action === "cleanup"
      ? "beta_launch:cleanupPreLaunch"
      : mutations.seed;
const args = isConfirmedCleanup
  ? {
      launchSecret: secret,
      confirmation: cleanupConfirmation,
      candidateDigest: reviewedDigest,
      excludedPrimaryIds,
    }
  : action === "seed"
    ? { launchSecret: secret }
    : { launchSecret: secret, excludedPrimaryIds };

console.log(
  isConfirmedCleanup
    ? `Running CONFIRMED cleanup via ${operation} on production Convex…`
    : action === "seed"
      ? `Running founding-profile seed via ${operation} on production Convex…`
      : `Running ${operation} on production Convex (read-only; no deletion)…`,
);

const result = spawnSync(
  "npx",
  ["convex", "run", operation, JSON.stringify(args)],
  { stdio: "inherit", shell: process.platform === "win32" },
);

process.exit(result.status ?? 1);
