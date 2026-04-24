import { defineConfig, devices } from "@playwright/test"

/**
 * Playwright config for cross-role smoke tests.
 *
 * Unauthenticated runs work out of the box — they assert every role's
 * landing routes redirect to /sign-in cleanly (no 500, no white-screen).
 *
 * Authenticated runs require PLAYWRIGHT_CLIENT_TOKEN / RESELLER_TOKEN /
 * INTERN_TOKEN / ADMIN_TOKEN — pre-issued Clerk session tokens. When
 * those env vars are unset, the auth'd specs skip themselves instead
 * of failing, so local runs don't require any setup.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
})
