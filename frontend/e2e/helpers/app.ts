import type { Browser, Page } from "@playwright/test";
import {
  MOCK_SERVER_LIST_RESPONSE,
  MOCK_GPU_SERVER_STATUS,
  MOCK_NO_GPU_SERVER_STATUS,
  MOCK_OFFLINE_SERVER_STATUS,
  MOCK_STALE_SERVER_LIST,
  MOCK_HEALTH_RESPONSE,
} from "./mock-data";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:5173";

/** フロントエンド開発サーバーを開く */
export async function openApp(
  browser: Browser,
  options?: { viewport?: { width: number; height: number } },
): Promise<{ page: Page }> {
  const context = await browser.newContext({
    viewport: options?.viewport ?? { width: 1280, height: 800 },
  });
  const page = await context.newPage();
  await page.goto(BASE_URL);
  return { page };
}

/** API モックをセットアップ */
export async function mockAPIs(page: Page) {
  // サーバー一覧
  await page.route("**/api/servers", (route) => {
    if (route.request().url().includes("/status")) return route.continue();
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_SERVER_LIST_RESPONSE),
    });
  });

  // サーバー詳細（パスパラメータに応じてレスポンスを切替）
  await page.route("**/api/servers/*/status", (route) => {
    const url = route.request().url();
    const serverName = url.match(/\/api\/servers\/(.+)\/status/)?.[1];
    const mocks: Record<string, unknown> = {
      "gpu-server-1": MOCK_GPU_SERVER_STATUS,
      "monitor-server": MOCK_NO_GPU_SERVER_STATUS,
      "dev-server-2": MOCK_OFFLINE_SERVER_STATUS,
    };
    const mock = mocks[serverName ?? ""];
    if (mock) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mock),
      });
    }
    return route.fulfill({
      status: 404,
      body: JSON.stringify({
        detail: `Server '${serverName}' not found`,
      }),
    });
  });

  // ヘルスチェック
  await page.route("**/api/health", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_HEALTH_RESPONSE),
    }),
  );

  await page.reload();
  await page.waitForLoadState("networkidle");
}

/** staleデータ用APIモックをセットアップ（last_updated_at が3分前） */
export async function mockStaleAPIs(page: Page) {
  // サーバー一覧（staleデータ）
  await page.route("**/api/servers", (route) => {
    if (route.request().url().includes("/status")) return route.continue();
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_STALE_SERVER_LIST),
    });
  });

  // サーバー詳細（staleデータ — last_updated_at を3分前に上書き）
  await page.route("**/api/servers/*/status", (route) => {
    const url = route.request().url();
    const serverName = url.match(/\/api\/servers\/(.+)\/status/)?.[1];
    const mocks: Record<string, unknown> = {
      "gpu-server-1": MOCK_GPU_SERVER_STATUS,
      "monitor-server": MOCK_NO_GPU_SERVER_STATUS,
      "dev-server-2": MOCK_OFFLINE_SERVER_STATUS,
    };
    const mock = mocks[serverName ?? ""] as Record<string, unknown> | undefined;
    if (mock) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ...mock,
          last_updated_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
        }),
      });
    }
    return route.fulfill({
      status: 404,
      body: JSON.stringify({
        detail: `Server '${serverName}' not found`,
      }),
    });
  });

  // ヘルスチェック
  await page.route("**/api/health", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_HEALTH_RESPONSE),
    }),
  );

  await page.reload();
  await page.waitForLoadState("networkidle");
}
