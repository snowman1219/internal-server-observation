# フロントエンド

## 概要

React ベースのサーバー監視ダッシュボード。TanStack Query による 10 秒間隔のポーリングでリアルタイム表示を実現。

## 開発環境

- Node.js 22（nvm で管理）
- パッケージマネージャ: pnpm
- ビルドツール: Vite
- フレームワーク: React Router 7

## よく使うコマンド

| コマンド | 説明 |
|---------|------|
| `nvm use` | Node.js バージョン切り替え |
| `pnpm install` | 依存関係インストール |
| `pnpm dev` | 開発サーバー起動 (http://localhost:5173) |
| `pnpm build` | プロダクションビルド |
| `pnpm typecheck` | 型チェック（react-router typegen + tsc） |
| `pnpm generate_api_client` | OpenAPI から API クライアント再生成 |
| `pnpm test:e2e` | Playwright E2E テスト実行 |
| `pnpm test:e2e:headed` | E2E テスト（ブラウザ表示あり） |
| `pnpm test:e2e:ui` | Playwright UI モード |

## コンポーネント構成

```
app/components/
├── layout/          # レイアウト系
│   ├── header.tsx       # ヘッダー（タイトル、ダークモード切替）
│   └── server-card.tsx  # サーバー一覧のカード
├── status/          # ステータス表示系
│   ├── cpu-memory-card.tsx
│   ├── process-summary-card.tsx
│   ├── disk-usage-card.tsx
│   ├── tmux-card.tsx
│   └── gpu-card.tsx
└── common/          # 共通コンポーネント
    ├── stale-badge.tsx
    ├── progress-bar.tsx
    └── error-alert.tsx
```

### ルート

| パス | ファイル | 画面 |
|------|---------|------|
| `/` | `routes/home.tsx` | サーバー一覧 |
| `/servers/:serverName` | `routes/servers.$serverName.tsx` | サーバー詳細 |

## API クライアント

- `app/lib/api/generated/` は Orval による自動生成コード。**手動編集禁止**
- API の変更は以下の手順で反映:
  1. バックエンド側で API を修正
  2. `cd ../backend && uv run python -m server.export_openapi` で OpenAPI スペック更新
  3. `pnpm generate_api_client` で API クライアント再生成
- カスタムフェッチ: `app/lib/api/custom-fetch.ts`（ベース URL 設定等）

## E2E テスト

- Playwright を使用
- テストファイル: `e2e/` ディレクトリ
- ヘルパー: `e2e/helpers/`（モックデータ、アプリケーションヘルパー）
- API モックによるテスト（バックエンド不要）

## 設計書

実装・修正時は以下の設計書を参照すること:

- [frontend.md](../docs/design/frontend.md) — フロントエンド設計
- [e2e-testing.md](../docs/design/e2e-testing.md) — E2E テスト設計
- [data-model.md](../docs/design/data-model.md) — データモデル設計
