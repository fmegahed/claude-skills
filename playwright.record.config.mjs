// The a11y spec over the record of this repository (npm run test:a11y:record).
// The spec checks every page of the site in A11Y_SITE, at 320 and 1280 px.
import { defineConfig } from "@playwright/test";
import base from "./playwright.config.mjs";

process.env.A11Y_SITE = "tests/.record-site";

export default defineConfig({
  ...base,
  webServer: { ...base.webServer, command: `node tests/serve.mjs ${process.env.A11Y_SITE} 4173` },
});
