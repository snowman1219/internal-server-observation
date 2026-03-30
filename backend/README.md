# バックエンド

社内サーバー利用状況ダッシュボードのバックエンド。FastAPI ベースの REST API サーバーで、SSH 経由で対象サーバーのリソース情報を収集する。

## 技術スタック

| 技術 | 用途 |
|------|------|
| Python 3.14 | ランタイム |
| FastAPI | Web フレームワーク |
| asyncssh | 非同期 SSH 接続 |
| Pydantic v2 | データモデル・バリデーション |
| pydantic-settings | 環境変数による設定管理 |
| uvicorn | ASGI サーバー |
| uv | パッケージマネージャ |

## セットアップ

```bash
uv sync                          # 本番用依存関係
uv sync --group dev --group lint # 開発用依存関係含む
```

## 開発サーバー起動

```bash
uv run uvicorn server.main:app --reload --host 0.0.0.0 --port 8000
```

開発時はフロントエンドからの CORS を許可するため、環境変数 `ENVIRONMENT=development` が自動設定される（`--reload` 時）。

## テスト

```bash
uv run pytest              # テスト実行
uv run ruff check .        # リント
uv run ruff format .       # フォーマット
uv run pyright             # 型チェック
```

## ディレクトリ構成

```
backend/
├── Dockerfile
├── pyproject.toml
├── uv.lock
├── server/
│   ├── main.py              # FastAPI アプリ、lifespan
│   ├── config.py            # 設定読み込み
│   ├── store.py             # インメモリストア
│   ├── scheduler.py         # ポーリングスケジューラ
│   ├── export_openapi.py    # OpenAPI スペックエクスポート
│   ├── models/
│   │   ├── config.py        # AppConfig, ServerConfig
│   │   ├── status.py        # ステータスデータモデル
│   │   └── responses.py     # API レスポンスモデル
│   ├── routers/
│   │   ├── servers.py       # /api/servers エンドポイント
│   │   └── health.py        # /api/health エンドポイント
│   └── collectors/
│       ├── ssh.py           # SSH 接続管理
│       ├── runner.py        # コマンド一括実行
│       └── parsers/
│           ├── processes.py # ps aux パーサー
│           ├── disk.py      # df, du パーサー
│           ├── tmux.py      # tmux パーサー
│           ├── gpu.py       # nvidia-smi パーサー
│           └── cpu_memory.py # free, nproc, uptime パーサー
└── tests/
```

## API エンドポイント

| メソッド | パス | 説明 |
|---------|------|------|
| GET | `/api/servers` | 全サーバーのステータス一覧 |
| GET | `/api/servers/{server_name}` | 特定サーバーのステータス詳細 |
| GET | `/api/health` | ヘルスチェック |

API ドキュメント（起動後）:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 設定

### config.yaml

プロジェクトルートの `config.yaml` でサーバー情報を管理:

```yaml
poll_interval_seconds: 30
ssh_timeout_seconds: 5
ssh_key_path: "~/.ssh/server_monitor_key"
servers:
  - name: "server-1"
    host: "192.168.1.10"
    ssh_user: "monitor"
```

### 環境変数オーバーライド

| 環境変数 | 説明 | デフォルト |
|---------|------|----------|
| `CONFIG_PATH` | config.yaml のパス | `./config.yaml` |
| `POLL_INTERVAL_SECONDS` | ポーリング間隔（秒） | `30` |
| `SSH_TIMEOUT_SECONDS` | SSH タイムアウト（秒） | `5` |
| `SSH_KEY_PATH` | SSH 秘密鍵のパス | `/root/.ssh/id_rsa` |
