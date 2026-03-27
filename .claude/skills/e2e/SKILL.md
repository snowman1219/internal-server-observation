---
name: e2e
description: Playwright E2E テストを実行する、または Playwright MCP でブラウザデバッグする
argument-hint: [run|debug|spec名]
allowed-tools: Bash, Read, Glob, mcp__playwright__browser_navigate, mcp__playwright__browser_snapshot, mcp__playwright__browser_click, mcp__playwright__browser_screenshot
---

# E2E テスト実行

Playwright Test による E2E テスト実行、または Playwright MCP によるブラウザデバッグを行います。

## 引数

- `$ARGUMENTS`（任意）: `run`, `debug`, または spec ファイル名（デフォルト: `run`）

引数: $ARGUMENTS

## モード

### `run`（デフォルト）

全 E2E テストを実行します。

1. フロントエンド開発サーバーが起動しているか確認
2. テスト実行:
   ```bash
   cd frontend && pnpm exec playwright test
   ```
3. 結果サマリを報告

### `debug`

Playwright MCP でブラウザを開き、フロントエンドの画面を手動確認します。

1. `mcp__playwright__browser_navigate` で `http://localhost:5173` にアクセス
2. `mcp__playwright__browser_snapshot` でページ状態を取得
3. `mcp__playwright__browser_screenshot` でスクリーンショットを取得
4. 画面の状態を報告

### spec 名指定

指定した spec ファイルのみ実行します。

```bash
cd frontend && pnpm exec playwright test e2e/{spec名}.spec.ts
```

利用可能な spec:
- `server-list` — サーバー一覧ページ
- `server-detail` — サーバー詳細ページ
- `stale-data` — stale-badge 表示
- `responsive` — レスポンシブレイアウト

## 前提条件

- `run` / spec 名指定: フロントエンド開発サーバーが起動していること（`cd frontend && VITE_BASE_URL=http://localhost:8000 pnpm dev`）
- `debug`: フロントエンド開発サーバーが起動していること
- Playwright がインストール済みであること（`cd frontend && pnpm exec playwright install chromium`）
