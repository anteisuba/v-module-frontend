import { defineConfig, devices } from "@playwright/test";

delete process.env.NO_COLOR;
delete process.env.FORCE_COLOR;

const port = 3100;
const baseURL =
  process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${port}`;
const webServerEnv: Record<string, string> = Object.fromEntries(
  Object.entries({
    ...process.env,
    BASELINE_BROWSER_MAPPING_IGNORE_OLD_DATA: "1",
    BROWSERSLIST_IGNORE_OLD_DATA: "1",
    E2E_BYPASS_AUTH: "1",
    NEXT_PUBLIC_BASE_URL: baseURL,
  }).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
);

delete webServerEnv.NO_COLOR;
delete webServerEnv.FORCE_COLOR;

export default defineConfig({
  testDir: "./tests/e2e",
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  timeout: 45_000,
  expect: {
    timeout: 5_000,
  },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
  webServer: {
    command: `pnpm exec next dev --hostname 127.0.0.1 --port ${port}`,
    url: baseURL,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    env: webServerEnv,
  },
});
