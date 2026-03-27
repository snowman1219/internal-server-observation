import { test, expect } from "@playwright/test";
import { openApp, mockAPIs } from "./helpers/app";

test.describe("サーバー詳細ページ", () => {
  async function navigateToServer(
    browser: Parameters<Parameters<typeof test>[1]>[0]["browser"],
    serverName: string,
  ) {
    const { page } = await openApp(browser);
    await mockAPIs(page);

    const card = page.locator(`[data-testid="server-card-${serverName}"]`);
    await card.click();
    await expect(page).toHaveURL(new RegExp(`/servers/${serverName}`));

    return { page };
  }

  test("CPU/メモリカードが表示される", async ({ browser }) => {
    const { page } = await navigateToServer(browser, "gpu-server-1");

    const cpuMemCard = page.locator(
      '[data-testid="cpu-memory-card"]',
    );
    await expect(cpuMemCard).toBeVisible();

    // ロードアベレージ
    await expect(cpuMemCard).toContainText("4.52");
    await expect(cpuMemCard).toContainText("3.21");
    await expect(cpuMemCard).toContainText("2.88");

    // メモリ/スワップのプログレスバー
    await expect(
      cpuMemCard.locator('[data-testid="progress-bar"]'),
    ).toHaveCount(2); // memory + swap
  });

  test("プロセスカードが表示される", async ({ browser }) => {
    const { page } = await navigateToServer(browser, "gpu-server-1");

    const processCard = page.locator(
      '[data-testid="process-summary-card"]',
    );
    await expect(processCard).toBeVisible();

    // ユーザー別集計
    await expect(processCard).toContainText("alice");
    await expect(processCard).toContainText("bob");

    // 上位プロセス
    await expect(processCard).toContainText("python train.py");
  });

  test("ディスクカードが表示される", async ({ browser }) => {
    const { page } = await navigateToServer(browser, "gpu-server-1");

    const diskCard = page.locator(
      '[data-testid="disk-usage-card"]',
    );
    await expect(diskCard).toBeVisible();

    // ファイルシステム情報
    await expect(diskCard).toContainText("/dev/sda1");
    await expect(diskCard).toContainText("67.4");

    // ユーザーホーム使用量
    await expect(diskCard).toContainText("alice");
    await expect(diskCard).toContainText("128G");
  });

  test("tmuxカードが表示される", async ({ browser }) => {
    const { page } = await navigateToServer(browser, "gpu-server-1");

    const tmuxCard = page.locator('[data-testid="tmux-card"]');
    await expect(tmuxCard).toBeVisible();

    // ユーザーごとのセッション数・ウィンドウ数
    await expect(tmuxCard).toContainText("alice");
    await expect(tmuxCard).toContainText("3"); // session_count
    await expect(tmuxCard).toContainText("12"); // window_count
  });

  test("GPUカードが表示される（GPUありサーバー）", async ({ browser }) => {
    const { page } = await navigateToServer(browser, "gpu-server-1");

    const gpuCard = page.locator('[data-testid="gpu-card"]');
    await expect(gpuCard).toBeVisible();

    // GPU情報
    await expect(gpuCard).toContainText("NVIDIA A100-SXM4-80GB");
    await expect(gpuCard).toContainText("95"); // utilization
    await expect(gpuCard).toContainText("72"); // temperature

    // GPUプロセス
    await expect(gpuCard).toContainText("alice");
    await expect(gpuCard).toContainText("35840 MiB");
  });

  test("GPUカードが非表示（GPUなしサーバー）", async ({ browser }) => {
    const { page } = await navigateToServer(browser, "monitor-server");

    const gpuCard = page.locator('[data-testid="gpu-card"]');
    await expect(gpuCard).toHaveCount(0);
  });

  test("戻るボタンで一覧に戻る", async ({ browser }) => {
    const { page } = await navigateToServer(browser, "gpu-server-1");

    const backButton = page.locator('[data-testid="back-button"]');
    await expect(backButton).toBeVisible();
    await backButton.click();

    await expect(page).toHaveURL(/\/$/);
  });
});
