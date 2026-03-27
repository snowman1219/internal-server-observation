# E2E テスト設計

## 方針

Playwright Test でブラウザ E2E テストを実行する。バックエンド API は `page.route()` でモックし、フロントエンド単体でテスト可能にする。

参考実装: `../ticketpilot/e2e`

---

## ディレクトリ構成

```
frontend/
├── playwright.config.ts
├── e2e/
│   ├── server-list.spec.ts        # サーバー一覧ページ
│   ├── server-detail.spec.ts      # サーバー詳細ページ
│   ├── stale-data.spec.ts         # stale-badge 表示
│   ├── responsive.spec.ts         # レスポンシブレイアウト
│   └── helpers/
│       ├── app.ts                 # ページ操作ユーティリティ
│       └── mock-data.ts           # API モックレスポンス
```

---

## Playwright Test 設定

```typescript
// frontend/playwright.config.ts
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
```

---

## API モック戦略

`page.route()` で `/api/*` へのリクエストをインターセプトし、モックデータを返す。バックエンドの起動は不要。

### ヘルパー: `helpers/app.ts`

```typescript
import type { Browser, Page } from "@playwright/test";

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
  await page.route("**/api/servers", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_SERVER_LIST_RESPONSE),
    }),
  );

  // サーバー詳細（パスパラメータに応じてレスポンスを切替）
  await page.route("**/api/servers/*/status", (route) => {
    const url = route.request().url();
    const serverName = url.match(/\/api\/servers\/(.+)\/status/)?.[1];
    const mock = MOCK_SERVER_STATUSES[serverName ?? ""];
    if (mock) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mock),
      });
    }
    return route.fulfill({ status: 404, body: JSON.stringify({ detail: `Server '${serverName}' not found` }) });
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
```

### ヘルパー: `helpers/mock-data.ts`

`docs/design/api.md` のレスポンス例に準拠したモックデータ:

- `MOCK_SERVER_LIST_RESPONSE` — オンラインサーバー2台 + オフラインサーバー1台
- `MOCK_SERVER_STATUSES` — サーバー名をキーにした詳細ステータス辞書
  - GPU ありサーバー（全セクション有効）
  - GPU なしサーバー（`gpu_status: null`）
  - オフラインサーバー（`is_online: false`、全セクション `null`）
- `MOCK_HEALTH_RESPONSE` — ヘルスチェックレスポンス
- `MOCK_STALE_SERVER_LIST` — `last_updated_at` が3分前のサーバー（stale テスト用）

---

## テストシナリオ

### `server-list.spec.ts` — サーバー一覧ページ

| テスト | 検証内容 |
|--------|---------|
| 全サーバーのカードが表示される | カード数 = モックサーバー数 |
| オンラインサーバーのカードに情報が表示される | サーバー名、ホスト、Online 表示、CPU/メモリ/ディスクのプログレスバー |
| オフラインサーバーのカードがグレーアウト | Offline 表示、エラーメッセージ表示、プログレスバー非表示 |
| カードクリックで詳細ページに遷移 | URL が `/servers/{serverName}` に変わる |
| アクティブユーザーが表示される | `active_users` がカンマ区切りで表示 |

### `server-detail.spec.ts` — サーバー詳細ページ

| テスト | 検証内容 |
|--------|---------|
| CPU/メモリカードが表示される | ロードアベレージ、メモリ/スワップのプログレスバー |
| プロセスカードが表示される | ユーザー別集計、上位5プロセステーブル |
| ディスクカードが表示される | ファイルシステム一覧、ユーザーホーム使用量 |
| tmux カードが表示される | ユーザーごとのセッション数・ウィンドウ数 |
| GPU カードが表示される（GPU あり） | GPU 使用率バー、VRAM バー、温度、GPU プロセス |
| GPU カードが非表示（GPU なし） | `gpu_status: null` のサーバーで GPU セクションが存在しない |
| データが null のカードは「データなし」表示 | 各セクションが null の場合のフォールバック |
| 戻るボタンで一覧に戻る | URL が `/` に戻る |

### `stale-data.spec.ts` — stale-badge 表示

| テスト | 検証内容 |
|--------|---------|
| 2分超のデータで stale-badge が表示される | `last_updated_at` が3分前のモックで黄色バッジが出る |
| 新しいデータでは stale-badge が非表示 | 通常のモックデータでバッジが出ない |

### `responsive.spec.ts` — レスポンシブレイアウト

| テスト | 検証内容 |
|--------|---------|
| PC 幅でカードが3列グリッド | `lg:grid-cols-3` が適用されている |
| モバイル幅でカードが1列 | `grid-cols-1` が適用されている |
| 詳細ページの PC 幅で2列グリッド | `lg:grid-cols-2` が適用されている |
| GPU カードがフル幅 | GPU カードが `col-span-2` で表示 |

---

## 依存パッケージ

`frontend/package.json` の devDependencies に追加:

```json
{
  "devDependencies": {
    "@playwright/test": "^1.58.2"
  },
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

インストール後:

```bash
cd frontend && pnpm exec playwright install chromium
```

---

## 実行コマンド

```bash
# 全テスト実行
cd frontend && pnpm test:e2e

# headed モード（ブラウザ表示）
cd frontend && pnpm test:e2e:headed

# UI モード（インタラクティブ）
cd frontend && pnpm test:e2e:ui

# 特定の spec のみ
cd frontend && pnpm exec playwright test e2e/server-list.spec.ts

# 特定のプロジェクト（viewport）のみ
cd frontend && pnpm exec playwright test --project=desktop
cd frontend && pnpm exec playwright test --project=mobile
```

---

## Playwright MCP（手動デバッグ用）

E2E テストの実行は Playwright Test で行うが、手動でのブラウザ確認・デバッグには Playwright MCP を使用する。

- `mcp__playwright__browser_navigate` — URL にアクセス
- `mcp__playwright__browser_snapshot` — ページの状態を取得
- `mcp__playwright__browser_click` — 要素をクリック
- `mcp__playwright__browser_screenshot` — スクリーンショット取得

主な用途:
- テスト失敗時のデバッグ（ブラウザ状態の確認）
- 新しいテストシナリオの検討（画面構造の確認）
- ビジュアルリグレッションの確認
