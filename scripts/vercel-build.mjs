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

const run = (command, args) => {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }

  process.exit(result.status ?? 1);
};

if (hasConvexDeployConfig) {
  run("npx", ["convex", "deploy", "--cmd", "npm run build"]);
}

if (isProduction) {
  console.error(
    "Production Vercel build requires CONVEX_DEPLOY_KEY, or CONVEX_SELF_HOSTED_URL and CONVEX_SELF_HOSTED_ADMIN_KEY.",
  );
  process.exit(1);
}

console.log(
  "Convex deployment credentials are not configured for this non-production build; running Next.js build without Convex deploy.",
);
run("npm", ["run", "build"]);
