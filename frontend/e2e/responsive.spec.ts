import { test, expect } from "@playwright/test";
import { openApp, mockAPIs } from "./helpers/app";

test.describe("レスポンシブレイアウト", () => {
  test("PC幅でカードが複数列", async ({ browser }) => {
    const { page } = await openApp(browser, {
      viewport: { width: 1280, height: 800 },
    });
    await mockAPIs(page);

    const cards = page.locator('[data-testid^="server-card-"]');
    await expect(cards).toHaveCount(3);

    // 最初と2番目のカードのY座標が同じ（同じ行に並んでいる）
    const firstBox = await cards.nth(0).boundingBox();
    const secondBox = await cards.nth(1).boundingBox();
    expect(firstBox).not.toBeNull();
    expect(secondBox).not.toBeNull();
    expect(firstBox!.y).toBe(secondBox!.y);
  });

  test("モバイル幅でカードが1列", async ({ browser }) => {
    const { page } = await openApp(browser, {
      viewport: { width: 390, height: 844 },
    });
    await mockAPIs(page);

    const cards = page.locator('[data-testid^="server-card-"]');
    await expect(cards).toHaveCount(3);

    // 最初と2番目のカードのY座標が異なる（縦に並んでいる）
    const firstBox = await cards.nth(0).boundingBox();
    const secondBox = await cards.nth(1).boundingBox();
    expect(firstBox).not.toBeNull();
    expect(secondBox).not.toBeNull();
    expect(firstBox!.y).not.toBe(secondBox!.y);
  });
});
