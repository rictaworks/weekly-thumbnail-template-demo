import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "test",
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:8787",
  },
  webServer: {
    command: "npx wrangler dev --env production --local --port 8787",
    url: "http://localhost:8787/api/templates",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
