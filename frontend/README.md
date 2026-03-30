# フロントエンド

社内サーバー利用状況ダッシュボードのフロントエンド。React + TypeScript によるシングルページアプリケーション。

## 技術スタック

| 技術 | 用途 |
|------|------|
| React 19 | UI ライブラリ |
| TypeScript 5.9 | 型安全な開発 |
| React Router 7 | ルーティング |
| Vite | ビルドツール・開発サーバー |
| Tailwind CSS 4 | スタイリング |
| TanStack Query | データフェッチ・10秒ポーリング |
| Orval | OpenAPI → API クライアント自動生成 |
| Playwright | E2E テスト |
| pnpm | パッケージマネージャ |

## セットアップ

```bash
nvm use          # Node.js 22 に切り替え
pnpm install     # 依存関係インストール
```

## 開発サーバー起動

```bash
pnpm dev
```

http://localhost:5173 でアクセス。バックエンド（:8000）が起動している必要があります。

## ビルド

```bash
pnpm build
```

## テスト

### E2E テスト（Playwright）

```bash
pnpm test:e2e              # ヘッドレス実行
pnpm test:e2e:headed       # ブラウザ表示あり
pnpm test:e2e:ui           # Playwright UI モード
```

### 型チェック

```bash
pnpm typecheck
```

## ディレクトリ構成

```
frontend/
├── Dockerfile
├── nginx.conf               # Nginx 設定（本番用）
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── vite.config.ts
├── orval.config.cjs          # Orval（API クライアント生成）設定
├── playwright.config.ts
├── app/
│   ├── root.tsx              # ルートコンポーネント
│   ├── routes.ts             # ルート定義
│   ├── app.css               # グローバルスタイル
│   ├── routes/
│   │   ├── home.tsx          # サーバー一覧（/）
│   │   └── servers.$serverName.tsx  # サーバー詳細
│   ├── components/
│   │   ├── layout/           # レイアウト系（header, server-card）
│   │   ├── status/           # ステータス表示（CPU, GPU, ディスク等）
│   │   └── common/           # 共通（badge, progress-bar, alert）
│   └── lib/
│       ├── api/
│       │   ├── custom-fetch.ts    # カスタムフェッチ（ベース URL 設定）
│       │   └── generated/         # Orval 自動生成（編集禁止）
│       └── hooks/
│           ├── use-servers.ts     # サーバー一覧取得
│           └── use-server-status.ts  # サーバー詳細取得
└── e2e/                      # E2E テスト
    ├── server-list.spec.ts
    ├── server-detail.spec.ts
    ├── stale-data.spec.ts
    ├── responsive.spec.ts
    └── helpers/
        ├── app.ts
        └── mock-data.ts
```

## API クライアント再生成

OpenAPI スペックからの API クライアント再生成手順:

1. バックエンドで OpenAPI スペックをエクスポート:
   ```bash
   cd ../backend && uv run python -m server.export_openapi
   ```

2. API クライアントを再生成:
   ```bash
   pnpm generate_api_client
   ```

`app/lib/api/generated/` 配下のファイルが更新されます。このディレクトリは自動生成のため手動編集しないでください。
