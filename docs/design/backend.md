# バックエンド設計

## モジュール構成

```
server/
    __init__.py
    main.py                  # FastAPIアプリ、lifespan、静的ファイルマウント
    config.py                # config.yaml読み込み + pydantic-settings
    store.py                 # インメモリスナップショットストア
    scheduler.py             # バックグラウンドポーリングループ
    models/
        __init__.py
        config.py            # AppConfig, ServerConfig
        status.py            # 全ステータスデータモデル
        responses.py         # API レスポンスラッパー
    routers/
        __init__.py
        servers.py           # /api/servers, /api/servers/{server_name}/status
        health.py            # /api/health
    collectors/
        __init__.py
        ssh.py               # asyncssh接続管理
        runner.py            # コマンド一括実行 + セクション分割
        parsers/
            __init__.py
            processes.py     # ps aux パーサー
            disk.py          # df, du パーサー
            tmux.py          # tmux list-sessions パーサー
            gpu.py           # nvidia-smi パーサー
            cpu_memory.py    # free, nproc, uptime パーサー
```

---

## 処理フロー

### 起動シーケンス

```
1. main.py: lifespan開始
2. config.py: config.yaml を読み込み、AppConfig で検証
3. store.py: StatusStore を初期化（全サーバーを is_online=false で登録）
4. scheduler.py: poll_loop をバックグラウンドタスクとして起動
5. 初回ポーリングが即時実行（遅延なし）
6. APIがリクエスト受付開始
7. shutdown時: scheduler タスクをキャンセル
```

### ポーリングサイクル（30秒周期）

```
poll_loop (scheduler.py)
    │
    ├─ config.servers の全サーバーに対して asyncio.gather で並行実行
    │
    └─ collect_server (scheduler.py) ─ サーバーごとの処理
            │
            ├─ ssh.connect() ─ asyncssh で接続（タイムアウト5秒）
            │       失敗 → ServerStatus(is_online=False, error=...) をストアに保存して終了
            │
            ├─ runner.run_all_commands() ─ 1セッションで全コマンド一括実行
            │       │
            │       └─ 全コマンドをデリミタで連結した単一シェルスクリプトを実行
            │          出力をデリミタで分割し dict[str, str] で返す
            │
            ├─ 各パーサーを呼び出し
            │       parsers.cpu_memory.parse()  → CpuMemoryOverview
            │       parsers.processes.parse()   → ProcessSummary
            │       parsers.disk.parse_df()     → list[FilesystemUsage]
            │       parsers.disk.parse_du()     → list[UserHomeUsage]
            │       parsers.tmux.parse()        → list[TmuxUserSummary]
            │       parsers.gpu.parse_info()    → list[GpuInfo] | None
            │       parsers.gpu.parse_procs()   → list[GpuProcess]
            │
            └─ ServerStatus を組み立て → store.update()
```

---

## 各モジュールの詳細

### `main.py` - アプリケーションエントリポイント

- FastAPI の `lifespan` コンテキストマネージャで初期化・クリーンアップ
- `app.state.config` と `app.state.store` に状態を保持
- ルーターのマウント（`/api` プレフィックス）
- 本番時: フロントエンドビルド成果物を `StaticFiles` でマウント
- 開発時: CORSミドルウェアを追加（`ENVIRONMENT=development` の場合のみ）

```python
# CORS設定（開発時のみ）
if os.getenv("ENVIRONMENT") == "development":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173"],
        allow_methods=["GET"],
        allow_headers=["*"],
    )
```

### `config.py` - 設定読み込み

- `CONFIG_PATH` 環境変数（デフォルト: `./config.yaml`）からYAMLを読み込み
- `pydantic-settings` でトップレベルフィールドの環境変数オーバーライド
- `servers` リストは環境変数ではオーバーライド不可（YAML必須）

### `store.py` - インメモリストア

```python
class StatusStore:
    _snapshots: dict[str, ServerStatus]  # key: server_name
    _lock: asyncio.Lock

    async def update(self, server_name: str, status: ServerStatus) -> None
        """スナップショットを丸ごと置換"""

    async def get(self, server_name: str) -> ServerStatus | None
        """指定サーバーのスナップショットを返す"""

    async def get_all_summaries(self) -> list[ServerSummary]
        """全サーバーのサマリ情報を返す"""
```

- `asyncio.Lock` でスレッドセーフ
- `update` は `ServerStatus` 全体を置換（差分更新なし）

### `scheduler.py` - ポーリングスケジューラ

- 無限ループで `asyncio.gather` による並行収集
- 各サーバーの収集は独立しており、1台の失敗が他に影響しない（`return_exceptions=True`）
- エラー時は `is_online=False` + `error` メッセージで記録

### `collectors/ssh.py` - SSH接続管理

- `asyncssh.connect()` のラッパー
- `host="localhost"` の場合は `127.0.0.1` に接続
- `known_hosts=None` でホスト鍵検証をスキップ（社内ネットワーク前提）
- 接続タイムアウト: `config.ssh_timeout_seconds`

### `collectors/runner.py` - コマンド一括実行

全コマンドをデリミタ `===SECTION===` で連結して1回の `conn.run()` で実行:

```bash
ps aux --no-headers
echo '===SECTION==='
df -h --output=source,fstype,size,used,avail,pcent,target
echo '===SECTION==='
timeout 10 du -sh /home/* 2>/dev/null
echo '===SECTION==='
# tmux探索スクリプト
for dir in /tmp/tmux-*/; do
    uid=$(basename "$dir" | sed 's/tmux-//')
    user=$(getent passwd "$uid" | cut -d: -f1)
    if [ -n "$user" ]; then
        for sock in "$dir"*; do
            count=$(tmux -S "$sock" list-sessions 2>/dev/null | wc -l)
            windows=$(tmux -S "$sock" list-sessions -F '#{session_windows}' 2>/dev/null | paste -sd+ | bc 2>/dev/null || echo 0)
            [ "$count" -gt 0 ] && echo "$user $count $windows"
        done
    fi
done
echo '===SECTION==='
nvidia-smi --query-gpu=index,name,utilization.gpu,utilization.memory,memory.used,memory.total,temperature.gpu --format=csv,noheader 2>/dev/null || echo 'NO_GPU'
echo '===SECTION==='
nvidia-smi --query-compute-apps=pid,used_memory,gpu_name --format=csv,noheader 2>/dev/null || echo 'NO_GPU'
echo '===SECTION==='
# GPU PID → ユーザー紐付け
nvidia-smi --query-compute-apps=pid --format=csv,noheader 2>/dev/null | tr -d ' ' | xargs -I{} ps -p {} -o pid=,user= 2>/dev/null || echo 'NO_GPU'
echo '===SECTION==='
free -h
echo '===SECTION==='
nproc
echo '===SECTION==='
uptime
```

出力をデリミタで分割し、各セクションをキー付き辞書で返す。

### `collectors/parsers/` - 各パーサー

| モジュール | 入力 | 出力 | 主要な処理 |
|-----------|------|------|-----------|
| `processes.py` | `ps aux` の出力 | `ProcessSummary` | 行分割 → ユーザー別にCPU%/MEM%を合算 → CPU%降順ソート → 上位5プロセス抽出 |
| `disk.py` | `df -h` + `du -sh` の出力 | `DiskUsage` | df: スペース区切りパース、du: タブ区切りで `/home/` からユーザー名抽出 |
| `tmux.py` | tmuxスクリプトの出力 | `list[TmuxUserSummary]` | `user session_count window_count` 形式の行をパース |
| `gpu.py` | `nvidia-smi` 2種 + PIDマップ | `GpuStatus \| None` | CSV形式パース。`NO_GPU` の場合は `None` を返す。PIDマップでユーザー名を紐付け |
| `cpu_memory.py` | `free -h` + `nproc` + `uptime` | `CpuMemoryOverview` | free: 行・列パース、uptime: load average抽出、メモリ使用率を算出 |

各パーサー共通:
- `try/except` で囲み、パースエラー時は `None` を返す（ログ出力あり）
- 空文字列入力 → `None` を返す

---

## Lint・型チェック・テスト設定

### ツール構成

| ツール | 用途 |
|--------|------|
| ruff | リント + フォーマット（`select = ["ALL"]` で全ルール有効化、不要ルールを `ignore` で除外） |
| pyright | 型チェック（`basic` モード、Python 3.14） |
| pytest | テストランナー（`asyncio_mode = "auto"`） |

### pyproject.toml 設定

```toml
[dependency-groups]
lint = [
    "pyright>=1.1.408",
    "ruff>=0.15.1",
]


[tool.pytest.ini_options]
addopts = ["--import-mode=importlib"]
testpaths = ["tests"]
asyncio_mode = "auto"
markers = [
    "integration: marks tests as integration tests (deselect with '-m \"not integration\"')",
]


[tool.pyright]
exclude = [
    "**/.venv",
    "tmp/",
    "**/__pycache__",
    "**/*.pyc",
]
typeCheckingMode = "basic"
pythonVersion = "3.14"

[tool.ruff]
line-length = 120
indent-width = 4
target-version = "py314"
exclude = [
    ".venv",
    "tmp/",
]


[tool.ruff.lint]
select = ["ALL"]
extend-per-file-ignores = { "**/__init__.py" = [
    "I",
    "F403",
], "**/test_*.py" = [
    "I",
    "F403",
    "PLR2004",
    "SLF001",
] }
ignore = [
    "TD003",
    "FIX002",
    "ARG002",
    "A005",
    "D100",
    "D101",
    "D102",
    "D103",
    "D104",
    "D105",
    "D107",
    "D205",
    "D400",
    "D415",
    "D203",
    "D213",
    "PLR0913",
    "W191",
    "E111",
    "E114",
    "E117",
    "EM101",
    "EM102",
    "D206",
    "D300",
    "G004",
    "Q000",
    "Q001",
    "Q002",
    "Q003",
    "COM812",
    "COM819",
    "ISC001",
    "ISC002",
    "TC001",
    "TC002",
    "S101",
    "ANN201",
    "INP001",
    "ERA001",
    "TRY003",
    "DTZ005",
    "PT011",
    "ARG003",
    "FBT",
    "RUF",
]
fixable = ["ALL"]
unfixable = []
dummy-variable-rgx = "^(_+|(_+[a-zA-Z0-9_]*[a-zA-Z0-9]+?))$"

[tool.ruff.lint.flake8-type-checking]
runtime-evaluated-base-classes = ["pydantic.BaseModel", "pydantic_settings.BaseSettings"]

[tool.ruff.format]
quote-style = "double"
indent-style = "space"
skip-magic-trailing-comma = false
line-ending = "auto"
```

### 実行コマンド

```bash
# リント（チェックのみ）
uv run ruff check .

# リント（自動修正）
uv run ruff check --fix .

# フォーマット
uv run ruff format .

# 型チェック
uv run pyright

# テスト
uv run pytest

# 全チェック一括
uv run ruff check . && uv run ruff format --check . && uv run pyright && uv run pytest
```

---

## エラーハンドリング戦略

| レイヤー | エラー種別 | ハンドリング |
|---------|-----------|-------------|
| SSH接続 | `asyncssh.Error`, `TimeoutError`, `OSError` | `collect_server` でキャッチ → `is_online=False`, `error` にメッセージ |
| コマンド実行 | 非ゼロ終了コード | 各コマンドに `2>/dev/null` + `\|\| echo 'ERROR'` 付与。パーサー側で対応 |
| パーサー | 想定外のフォーマット | 各パーサーが `try/except` → そのセクションのみ `None`、他セクションに影響なし |
| APIレイヤー | 不明なサーバー名 | `HTTPException(404)` |
| APIレイヤー | 初回ポーリング未完了 | `is_online=False`, 各セクション `null` で返却（エラーではない） |
