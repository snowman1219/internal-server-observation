import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: 0,
  workers: 1,
  projects: [
    {
      name: "desktop",
      testMatch: "**/*.spec.ts",
      use: {
        headless: true,
        browserName: "chromium",
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: "mobile",
      testMatch: "**/*.spec.ts",
      use: {
        headless: true,
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
      },
    },
  ],
});
