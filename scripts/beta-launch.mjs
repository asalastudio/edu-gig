#!/usr/bin/env node
/**
 * Run controlled-beta data steps against production Convex.
 *
 * Usage (from edugig/):
 *   export CONVEX_DEPLOY_KEY="prod:…"
 *   export BETA_LAUNCH_SECRET="your-secret"
 *   node scripts/beta-launch.mjs cleanup
 *   node scripts/beta-launch.mjs seed
 *
 * Requires BETA_LAUNCH_ENABLED=true on the Convex deployment (unset after launch).
 */

import { spawnSync } from "node:child_process";

const action = process.argv[2];
const secret = process.env.BETA_LAUNCH_SECRET;

const mutations = {
  cleanup: "beta_launch:cleanupPreLaunch",
  seed: "beta_launch:seedFoundingProfiles",
};

if (!action || !mutations[action]) {
  console.error("Usage: node scripts/beta-launch.mjs <cleanup|seed>");
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

console.log(`Running ${mutations[action]} on production Convex…`);

const result = spawnSync(
  "npx",
  ["convex", "run", mutations[action], JSON.stringify({ launchSecret: secret })],
  { stdio: "inherit", shell: process.platform === "win32" },
);

process.exit(result.status ?? 1);
