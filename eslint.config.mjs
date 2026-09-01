import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import convexPlugin from "@convex-dev/eslint-plugin";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...convexPlugin.configs.recommended,
  {
    files: ["convex/**/*.ts"],
    rules: {
      "@convex-dev/no-collect-in-query": "warn",
      "@convex-dev/explicit-table-ids": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "**/.next/**",
    ".claude/**",
    ".superpowers/**",
    "next-env.d.ts",
    "convex/_generated/**",
    "test-results/**",
    "playwright-report/**",
  ]),
]);

export default eslintConfig;
