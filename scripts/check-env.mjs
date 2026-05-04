import fs from "node:fs";
import path from "node:path";

const envPath = path.join(process.cwd(), ".env.local");
const fileEnv = fs.existsSync(envPath) ? parseEnv(fs.readFileSync(envPath, "utf8")) : {};
const env = { ...fileEnv, ...process.env };
const target = process.argv.includes("--production") ? "production" : "local";

const required = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_CONVEX_URL",
  "CONVEX_WEBHOOK_SHARED_SECRET",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
];

const productionRequired = ["CONVEX_DEPLOY_KEY"];
const recommended = [
  "NEXT_PUBLIC_CONVEX_SITE_URL",
  "NEXT_PUBLIC_CLERK_SIGN_IN_URL",
  "NEXT_PUBLIC_CLERK_SIGN_UP_URL",
  "NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL",
  "NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "CHECKR_API_KEY",
  "CHECKR_WEBHOOK_SECRET",
  "CHECKR_PACKAGE",
  "NEXT_PUBLIC_SENTRY_DSN",
];

function parseEnv(raw) {
  const out = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function present(name) {
  return typeof env[name] === "string" && env[name].trim().length > 0;
}

function masked(name) {
  const value = env[name] ?? "";
  if (!value) return "missing";
  if (name.includes("URL") || name === "NEXT_PUBLIC_APP_URL") return value;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

const missingRequired = [...required, ...(target === "production" ? productionRequired : [])].filter((name) => !present(name));
const missingRecommended = recommended.filter((name) => !present(name));
const warnings = [];

if (target === "production") {
  if (/localhost|127\.0\.0\.1/.test(env.NEXT_PUBLIC_APP_URL ?? "")) {
    warnings.push("NEXT_PUBLIC_APP_URL points at localhost.");
  }
  if (/edugig/i.test(env.NEXT_PUBLIC_APP_URL ?? "")) {
    warnings.push("NEXT_PUBLIC_APP_URL still references an EduGig domain.");
  }
  if (/unique-eagle-379/.test(env.NEXT_PUBLIC_CONVEX_URL ?? "")) {
    warnings.push("NEXT_PUBLIC_CONVEX_URL points at the known dev Convex deployment.");
  }
  if (/clerk\.accounts\.dev/.test(`${env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? ""} ${env.CLERK_SECRET_KEY ?? ""}`)) {
    warnings.push("Clerk values appear to reference a dev account.");
  }
  if (/^pk_test_|^sk_test_/.test(env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "") || /^sk_test_/.test(env.CLERK_SECRET_KEY ?? "")) {
    warnings.push("Clerk values are test-mode keys.");
  }
  if (/^sk_test_|^pk_test_/.test(env.STRIPE_SECRET_KEY ?? "")) {
    warnings.push("STRIPE_SECRET_KEY is a Stripe test-mode key.");
  }
}

console.log(`K12Gig env audit (${target})`);
console.log("");
for (const name of [...required, ...productionRequired, ...recommended]) {
  console.log(`${present(name) ? "OK" : "NO"} ${name}: ${masked(name)}`);
}

console.log("");
if (missingRequired.length) {
  console.error(`Missing required: ${missingRequired.join(", ")}`);
}
if (missingRecommended.length) {
  console.warn(`Missing recommended: ${missingRecommended.join(", ")}`);
}
if (warnings.length) {
  console.warn(`Production warnings: ${warnings.join(" ")}`);
}

if (target === "production") {
  console.log("");
  console.log("Convex production also needs CLERK_JWT_ISSUER_DOMAIN set in the Convex dashboard/env.");
}

process.exit(missingRequired.length ? 1 : 0);
