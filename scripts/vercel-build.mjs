#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const hasConvexDeployKey = Boolean(process.env.CONVEX_DEPLOY_KEY);
const hasSelfHostedConfig = Boolean(
  process.env.CONVEX_SELF_HOSTED_URL &&
    process.env.CONVEX_SELF_HOSTED_ADMIN_KEY,
);
const hasConvexDeployConfig = hasConvexDeployKey || hasSelfHostedConfig;
const vercelEnv = process.env.VERCEL_ENV;
const isProduction = vercelEnv === "production";

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.error) {
    console.error(result.error);
    if (options.optional) return false;
    process.exit(1);
  }

  if (result.status && result.status !== 0) {
    if (options.optional) return false;
    process.exit(result.status);
  }

  return true;
};

if (isProduction && hasConvexDeployConfig) {
  run("npx", ["convex", "deploy", "--cmd", "npm run build"]);
  process.exit(0);
}

if (isProduction) {
  console.error(
    "Production Vercel build requires CONVEX_DEPLOY_KEY, or CONVEX_SELF_HOSTED_URL and CONVEX_SELF_HOSTED_ADMIN_KEY.",
  );
  process.exit(1);
}

console.log(
  "Skipping Convex deploy for this non-production Vercel build; running Convex codegen before Next.js build.",
);
run("npx", ["convex", "codegen", "--typecheck=disable"], { optional: true });
run("npm", ["run", "build"]);
