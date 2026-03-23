import { defineConfig, devices } from "@playwright/test";

const e2ePort = process.env.PLAYWRIGHT_PORT ?? "3010";
const e2eOrigin = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${e2ePort}`;

export default defineConfig({
    testDir: "./e2e",
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    reporter: process.env.CI ? "github" : "list",
    use: {
        baseURL: e2eOrigin,
        trace: "on-first-retry",
        ...devices["Desktop Chrome"],
    },
    // Production server avoids `.next/dev` lock conflicts when a dev server is already running locally.
    webServer: {
        command: `npm run build && npx next start -p ${e2ePort}`,
        url: e2eOrigin,
        reuseExistingServer: true,
        timeout: 300_000,
    },
});
