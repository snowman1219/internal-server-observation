import { test, expect } from "@playwright/test";
import { openApp, mockAPIs, mockStaleAPIs } from "./helpers/app";

test.describe("stale-badge 表示", () => {
  test("2分超のデータでstale-badgeが表示される", async ({ browser }) => {
    const { page } = await openApp(browser);
    await mockStaleAPIs(page);

    const staleBadge = page.locator('[data-testid="stale-badge"]');
    await expect(staleBadge.first()).toBeVisible();
  });

  test("新しいデータではstale-badgeが非表示", async ({ browser }) => {
    const { page } = await openApp(browser);
    await mockAPIs(page);

    const staleBadge = page.locator('[data-testid="stale-badge"]');
    await expect(staleBadge).toHaveCount(0);
  });
});
