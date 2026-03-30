# 社内サーバー利用状況ダッシュボード

## プロジェクト概要

社内ネットワーク上の Ubuntu/Debian サーバー群（3〜5台）の利用状況（CPU、メモリ、ディスク、GPU、tmuxセッション）をリアルタイムに可視化する Web ダッシュボード。

## 技術スタック

| カテゴリ | 技術 |
|--------|------|
| **バックエンド** | Python 3.14, FastAPI, asyncssh, Pydantic v2, uvicorn, uv |
| **フロントエンド** | React 19, TypeScript 5.9, React Router 7, Vite, Tailwind CSS 4, TanStack Query, Orval, pnpm |
| **インフラ** | Docker, docker-compose, Nginx |

## 設計書

実装・修正時は必ず `docs/design/` 配下の設計書を参照すること。

エントリポイント: [docs/design/project-structure.md](docs/design/project-structure.md)

| ファイル | 内容 |
|--------|------|
| [api.md](docs/design/api.md) | API エンドポイント定義 |
| [data-model.md](docs/design/data-model.md) | データモデル設計 |
| [backend.md](docs/design/backend.md) | バックエンド設計 |
| [frontend.md](docs/design/frontend.md) | フロントエンド設計 |
| [config.md](docs/design/config.md) | 設定ファイル設計 |
| [openapi.md](docs/design/openapi.md) | OpenAPI 定義方針 |
| [docker.md](docs/design/docker.md) | Docker 設計 |
| [e2e-testing.md](docs/design/e2e-testing.md) | E2E テスト設計 |

## 開発サーバー起動

バックエンド:

```bash
cd backend
uv run uvicorn server.main:app --reload --host 0.0.0.0 --port 8000
```

フロントエンド:

```bash
cd frontend
nvm use
pnpm dev
```

## よく使うコマンド

| カテゴリ | コマンド | 説明 |
|--------|--------|------|
| **Backend** | `cd backend && uv run ruff check .` | lint |
| **Backend** | `cd backend && uv run ruff format .` | format |
| **Backend** | `cd backend && uv run pyright` | typecheck |
| **Backend** | `cd backend && uv run pytest` | test |
| **Backend** | `cd backend && uv run python -m server.export_openapi` | OpenAPI export |
| **Frontend** | `cd frontend && pnpm typecheck` | typecheck |
| **Frontend** | `cd frontend && pnpm generate_api_client` | API client regen |
| **Frontend** | `cd frontend && pnpm test:e2e` | E2E test |
| **Frontend** | `cd frontend && pnpm test:e2e:headed` | E2E test (headed) |
| **Frontend** | `cd frontend && pnpm build` | build |

## コーディング規約

### Python（バックエンド）

- 型定義には Pydantic モデルを使用する
- ruff によるリント・フォーマットに従う
- pyright (basic mode) による型チェックを通すこと

### TypeScript（フロントエンド）

- strict モードを有効化
- `app/lib/api/generated/` 配下は Orval による自動生成コード。手動編集禁止
- API クライアントの変更は OpenAPI スペックを更新し `pnpm generate_api_client` で再生成する

## ブランチ戦略

| プレフィックス | 用途 |
|-------------|------|
| `feature/` | 新機能追加 |
| `fix/` | バグ修正 |
| `hotfix/` | 緊急修正 |
| `refactor/` | リファクタリング |
| `docs/` | ドキュメント更新 |
| `chore/` | 設定・依存関係等の雑務 |

ベースブランチ: `main`

## テスト方針

- PR 作成前に全テストを通すこと
- バックエンド: `cd backend && uv run pytest`
- フロントエンド E2E: `cd frontend && pnpm test:e2e`

## ディレクトリ構成

```
internal-server-observation/
├── docs/                    # 要件定義・設計書
│   ├── requirements.md
│   ├── design/              # 設計書群
│   └── openapi.yaml         # OpenAPI スペック
├── backend/                 # Python (FastAPI)
│   ├── server/
│   │   ├── main.py          # エントリポイント
│   │   ├── config.py        # 設定読み込み
│   │   ├── store.py         # インメモリストア
│   │   ├── scheduler.py     # ポーリングスケジューラ
│   │   ├── models/          # Pydantic モデル
│   │   ├── routers/         # API エンドポイント
│   │   └── collectors/      # SSH データ収集・パーサー
│   └── tests/
├── frontend/                # React (TypeScript)
│   ├── app/
│   │   ├── routes/          # ページコンポーネント
│   │   ├── components/      # UI コンポーネント
│   │   └── lib/             # API クライアント・フック
│   └── e2e/                 # Playwright E2E テスト
├── config.yaml.example      # 設定ファイルテンプレート
└── docker-compose.yaml      # コンテナ構成
```
