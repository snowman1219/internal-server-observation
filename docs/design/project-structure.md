# 社内サーバー利用状況ダッシュボード - 設計書

> 要件定義書: [requirements.md](../requirements.md)

---

## 概要

社内ネットワーク上の Ubuntu/Debian サーバー群の利用状況をリアルタイムに可視化するWebダッシュボード。監視サーバー1台からSSHで各サーバーのデータを収集し、ブラウザで閲覧できる。

---

## アーキテクチャ

```
                        ┌──────────────────┐
                   SSH  │  対象サーバー 1   │
              ┌───────> └──────────────────┘
              │    SSH  ┌──────────────────┐
              ├───────> │  対象サーバー 2   │
              │         └──────────────────┘
              │    SSH  ┌──────────────────┐
              ├───────> │  対象サーバー 3   │
              │         └──────────────────┘
┌─────────────┴─────────────┐
│  監視サーバー (Docker)     │
│                           │
│  ┌────────┐  ┌─────────┐  │
│  │backend │  │frontend │  │
│  │FastAPI │◄─│ Nginx   │  │
│  │ :8000  │  │  :3000  │  │
│  └────────┘  └─────────┘  │
│                           │
│  [インメモリストア]        │
│  [config.yaml]            │
└───────────────────────────┘
```

### データフロー

1. `config.yaml` からサーバー一覧を読み込み
2. バックグラウンドタスク（30秒周期）が `asyncssh` で各サーバーに並行SSH接続
3. 1セッションで全収集コマンドを一括実行しパース
4. 結果をインメモリの dict に格納
5. フロントエンドが `/api/status` を10秒間隔でポーリングして表示更新

---

## 技術スタック

### バックエンド

| 技術 | バージョン / 用途 |
|------|-----------------|
| Python | 3.14 |
| uv | パッケージマネージャ |
| FastAPI | APIサーバー |
| asyncssh | 非同期SSH接続 |
| Pydantic v2 | データモデル |
| pydantic-settings | 設定管理 |
| uvicorn | ASGIサーバー |

### フロントエンド

| 技術 | バージョン / 用途 |
|------|-----------------|
| React | 19.2 |
| TypeScript | 5.9 |
| React Router | 7.9 |
| Vite | 6.3 |
| Tailwind CSS | 4.1 |
| TanStack Query | データフェッチ・ポーリング |
| Orval | OpenAPIからAPIクライアント自動生成 |
| pnpm | パッケージマネージャ |

### インフラ

| 技術 | 用途 |
|------|------|
| Docker + docker-compose | コンテナ化・デプロイ |
| Nginx | フロントエンド静的配信 + APIリバースプロキシ |

---

## プロジェクトディレクトリ構成

```
internal-server-observation/
├── docs/
│   ├── requirements.md                    # 要件定義書
│   ├── design/
│   │   ├── project-structure.md           # 本ファイル（設計書エントリポイント）
│   │   ├── api.md                         # API設計
│   │   ├── data-model.md                  # データモデル設計
│   │   ├── backend.md                     # バックエンド設計
│   │   ├── frontend.md                    # フロントエンド設計
│   │   ├── config.md                      # 設定ファイル設計
│   │   ├── openapi.md                     # OpenAPI定義方針
│   │   └── docker.md                      # Docker設計
│   └── openapi.yaml                       # OpenAPIスペック（FastAPIから自動生成）
├── backend/                              # バックエンド
│   ├── Dockerfile
│   ├── pyproject.toml
│   ├── uv.lock
│   ├── server/
│   │   ├── __init__.py
│   │   ├── main.py                       # FastAPIアプリ、lifespan
│   │   ├── config.py                     # 設定読み込み
│   │   ├── store.py                      # インメモリストア
│   │   ├── scheduler.py                  # ポーリングスケジューラ
│   │   ├── export_openapi.py             # OpenAPIスペックエクスポート
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── config.py                 # AppConfig, ServerConfig
│   │   │   ├── status.py                 # ステータスデータモデル
│   │   │   └── responses.py              # APIレスポンスモデル
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── servers.py                # /api/servers エンドポイント
│   │   │   └── health.py                 # /api/health エンドポイント
│   │   └── collectors/
│   │       ├── __init__.py
│   │       ├── ssh.py                    # SSH接続管理
│   │       ├── runner.py                 # コマンド一括実行
│   │       └── parsers/
│   │           ├── __init__.py
│   │           ├── processes.py          # ps aux パーサー
│   │           ├── disk.py               # df, du パーサー
│   │           ├── tmux.py               # tmux パーサー
│   │           ├── gpu.py                # nvidia-smi パーサー
│   │           └── cpu_memory.py         # free, nproc, uptime パーサー
│   └── tests/
│       └── ...
├── frontend/                             # フロントエンド（cookiecutter-frontendから生成）
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   ├── pnpm-lock.yaml
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── orval.config.cjs
│   ├── app/
│   │   ├── root.tsx
│   │   ├── routes.ts
│   │   ├── app.css
│   │   ├── routes/
│   │   │   ├── home.tsx                  # サーバー一覧
│   │   │   └── servers.$serverName.tsx   # サーバー詳細
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── header.tsx
│   │   │   │   └── server-card.tsx
│   │   │   ├── status/
│   │   │   │   ├── cpu-memory-card.tsx
│   │   │   │   ├── process-summary-card.tsx
│   │   │   │   ├── disk-usage-card.tsx
│   │   │   │   ├── tmux-card.tsx
│   │   │   │   └── gpu-card.tsx
│   │   │   └── common/
│   │   │       ├── stale-badge.tsx
│   │   │       ├── progress-bar.tsx
│   │   │       └── error-alert.tsx
│   │   └── lib/
│   │       ├── api/
│   │       │   ├── custom-fetch.ts       # テンプレート提供
│   │       │   └── generated/            # Orval自動生成
│   │       └── hooks/
│   │           ├── use-servers.ts
│   │           └── use-server-status.ts
│   ├── e2e/                                # E2Eテスト（Playwright）
│   │   ├── server-list.spec.ts
│   │   ├── server-detail.spec.ts
│   │   ├── stale-data.spec.ts
│   │   ├── responsive.spec.ts
│   │   └── helpers/
│   │       ├── app.ts
│   │       └── mock-data.ts
│   ├── playwright.config.ts
│   └── tests/
│       └── ...
├── config.yaml                           # サーバー設定（Gitで管理しない）
├── config.yaml.example                   # 設定ファイルのサンプル
├── docker-compose.yaml
├── .gitignore
└── README.md
```

---

## 設計書一覧

| ファイル | 内容 |
|---------|------|
| [api.md](./api.md) | APIエンドポイント定義、リクエスト/レスポンス仕様、エラーレスポンス |
| [data-model.md](./data-model.md) | バックエンドPydanticモデル、フロントエンドTypeScript型（Orval自動生成） |
| [backend.md](./backend.md) | バックエンドモジュール構成、処理フロー、データ収集コマンド、エラーハンドリング |
| [frontend.md](./frontend.md) | 画面構成、コンポーネント設計、TanStack Queryポーリング戦略 |
| [config.md](./config.md) | config.yaml構造、環境変数オーバーライド |
| [openapi.md](./openapi.md) | FastAPI自動生成 → エクスポート → Orval連携のワークフロー |
| [docker.md](./docker.md) | docker-compose構成、Dockerfile、Nginx設定、SSH鍵マウント |
| [e2e-testing.md](./e2e-testing.md) | E2Eテスト設計、Playwright Test設定、テストシナリオ、APIモック戦略 |

## 画面設計図（ワイヤーフレーム）

[wireframes.pen](./wireframes.pen) — Pencilで作成した画面設計図

| フレーム名 | 画面 |
|-----------|------|
| `Server List - サーバー一覧` | サーバー一覧画面（`/`） |
| `Server Detail - サーバー詳細` | サーバー詳細画面（`/servers/:serverName`） |
