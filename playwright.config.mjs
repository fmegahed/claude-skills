import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests",
  testMatch: "a11y.spec.mjs",
  reporter: "list",
  use: { baseURL: "http://127.0.0.1:4173" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "node tests/serve.mjs tests/.site 4173",
    url: "http://127.0.0.1:4173/repo/index.html",
    reuseExistingServer: false,
  },
});
