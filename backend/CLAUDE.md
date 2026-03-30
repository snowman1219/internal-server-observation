# バックエンド

FastAPI バックエンド。SSH 経由で対象サーバーのリソース情報を収集し、REST API で提供する。

## 開発環境

- Python 3.14
- パッケージマネージャ: uv
- 依存関係インストール: `uv sync`
- 開発用依存関係: `uv sync --group dev --group lint`

## よく使うコマンド

| コマンド | 説明 |
|---------|------|
| `uv run uvicorn server.main:app --reload --host 0.0.0.0 --port 8000` | 開発サーバー起動 |
| `uv run ruff check .` | リント |
| `uv run ruff format .` | フォーマット |
| `uv run pyright` | 型チェック |
| `uv run pytest` | テスト実行 |
| `uv run python -m server.export_openapi` | OpenAPI スペックエクスポート |

## モジュール構成

| モジュール | 役割 |
|-----------|------|
| `server/main.py` | FastAPI アプリ、lifespan でストア初期化・スケジューラ起動 |
| `server/config.py` | `config.yaml` + 環境変数からの設定読み込み |
| `server/store.py` | インメモリストア（最新スナップショットのみ保持） |
| `server/scheduler.py` | 30秒周期のポーリングスケジューラ |
| `server/models/` | Pydantic データモデル（config, status, responses） |
| `server/routers/` | API エンドポイント（servers, health） |
| `server/collectors/ssh.py` | asyncssh による SSH 接続管理 |
| `server/collectors/runner.py` | コマンド一括実行・セクション分割 |
| `server/collectors/parsers/` | 各コマンド出力のパーサー群 |

## コーディング規約

- 型定義には Pydantic モデルを使用する
- `dict`, `list`, `tuple` などの組み込み型を型アノテーションに使わない
  - NG: `def get_data() -> dict[str, Any]:`
  - OK: Pydantic モデルを定義して使う
- ruff によるリント・フォーマットに従う
- pyright (basic mode) による型チェックを通すこと
- テスト: pytest + pytest-asyncio（asyncio_mode = "auto"）

## パーサー追加手順

新しいメトリクスを追加する場合:

1. `server/collectors/parsers/` に新しいパーサーモジュールを作成
2. `server/models/status.py` にデータモデルを追加
3. `server/collectors/runner.py` にコマンドとパーサー呼び出しを追加
4. 設計書 `docs/design/backend.md` と `docs/design/data-model.md` を更新

## 設計書

実装・修正時は以下の設計書を参照すること:

- [backend.md](../docs/design/backend.md) — バックエンド設計
- [data-model.md](../docs/design/data-model.md) — データモデル設計
- [api.md](../docs/design/api.md) — API エンドポイント定義
- [config.md](../docs/design/config.md) — 設定ファイル設計
