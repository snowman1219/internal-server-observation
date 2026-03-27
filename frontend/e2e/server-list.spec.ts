import { test, expect } from "@playwright/test";
import { openApp, mockAPIs } from "./helpers/app";

test.describe("サーバー一覧ページ", () => {
  test("全サーバーのカードが表示される", async ({ browser }) => {
    const { page } = await openApp(browser);
    await mockAPIs(page);

    const cards = page.locator('[data-testid^="server-card-"]');
    await expect(cards).toHaveCount(3);
  });

  test("オンラインサーバーにステータス情報が表示される", async ({
    browser,
  }) => {
    const { page } = await openApp(browser);
    await mockAPIs(page);

    const gpuCard = page.locator(
      '[data-testid="server-card-gpu-server-1"]',
    );
    await expect(gpuCard).toBeVisible();
    await expect(gpuCard).toContainText("gpu-server-1");
    await expect(gpuCard).toContainText("192.168.1.10");
    await expect(gpuCard).toContainText("Online");

    // CPU/メモリ/ディスクのプログレスバーが存在する
    await expect(
      gpuCard.locator('[data-testid="progress-bar"]'),
    ).toHaveCount(4); // CPU, Memory, Disk, GPU
  });

  test("オフラインサーバーがエラー表示される", async ({ browser }) => {
    const { page } = await openApp(browser);
    await mockAPIs(page);

    const offlineCard = page.locator(
      '[data-testid="server-card-dev-server-2"]',
    );
    await expect(offlineCard).toBeVisible();
    await expect(offlineCard).toContainText("Offline");
    await expect(offlineCard).toContainText("SSH connection timed out");

    // オフラインサーバーはプログレスバー非表示
    await expect(
      offlineCard.locator('[data-testid="progress-bar"]'),
    ).toHaveCount(0);
  });

  test("カードクリックで詳細ページに遷移する", async ({ browser }) => {
    const { page } = await openApp(browser);
    await mockAPIs(page);

    const gpuCard = page.locator(
      '[data-testid="server-card-gpu-server-1"]',
    );
    await gpuCard.click();

    await expect(page).toHaveURL(/\/servers\/gpu-server-1/);
  });
});
