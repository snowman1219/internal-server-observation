# 設定ファイル設計

## config.yaml

```yaml
# ポーリング間隔（秒）
poll_interval_seconds: 30

# SSH接続タイムアウト（秒）
ssh_timeout_seconds: 5

# デフォルトSSH秘密鍵パス
ssh_key_path: "~/.ssh/id_rsa"

# 監視対象サーバー一覧
servers:
  # 監視サーバー自身
  - name: monitor-server
    host: localhost
    ssh_user: monitor

  # GPUサーバー
  - name: gpu-server-1
    host: 192.168.1.10
    ssh_user: monitor
    ssh_port: 22                      # 省略可（デフォルト: 22）
    ssh_key_path: ~/.ssh/gpu_key      # 省略可（グローバル設定を使用）

  # 開発サーバー
  - name: dev-server-2
    host: 192.168.1.12
    ssh_user: monitor
```

---

## フィールド定義

### トップレベル

| フィールド | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| `poll_interval_seconds` | int | No | 30 | データ収集の周期（秒） |
| `ssh_timeout_seconds` | int | No | 5 | SSH接続タイムアウト（秒） |
| `ssh_key_path` | string | No | `~/.ssh/id_rsa` | デフォルトのSSH秘密鍵パス |
| `servers` | list | Yes | - | 監視対象サーバーの一覧 |

### servers[] 要素

| フィールド | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| `name` | string | Yes | - | サーバー識別名（APIのパスパラメータで使用、一意であること） |
| `host` | string | Yes | - | IPアドレス or `localhost` |
| `ssh_user` | string | Yes | - | SSH接続ユーザー名 |
| `ssh_port` | int | No | 22 | SSHポート番号 |
| `ssh_key_path` | string | No | トップレベルの値 | このサーバー専用の秘密鍵パス |

### バリデーションルール

- `servers` は1件以上必須
- `name` は一意であること（重複不可）
- `host` は有効なIPアドレス or `localhost`
- `poll_interval_seconds` は 5 以上
- `ssh_timeout_seconds` は 1 以上

---

## 環境変数オーバーライド

`pydantic-settings` により、以下の環境変数でトップレベル設定を上書き可能:

| 環境変数 | 対象フィールド | 例 |
|---------|---------------|-----|
| `CONFIG_PATH` | config.yaml のパス | `./config.yaml` |
| `POLL_INTERVAL_SECONDS` | `poll_interval_seconds` | `60` |
| `SSH_TIMEOUT_SECONDS` | `ssh_timeout_seconds` | `10` |
| `SSH_KEY_PATH` | `ssh_key_path` | `/home/monitor/.ssh/id_rsa` |
| `ENVIRONMENT` | 動作モード | `development` or `production` |

### フロントエンド環境変数

| 環境変数 | 用途 | デフォルト |
|---------|------|-----------|
| `VITE_BASE_URL` | APIサーバーのベースURL | `http://localhost:8000` |

- `.env` ファイルまたは docker-compose の `environment` で設定
- `customFetch` 内で `import.meta.env.VITE_BASE_URL` として参照

---

## 設定の読み込みフロー

```
1. CONFIG_PATH 環境変数 → config.yaml のパスを決定（デフォルト: ./config.yaml）
2. YAML ファイルを読み込み
3. pydantic-settings で環境変数オーバーライドを適用
4. AppConfig モデルでバリデーション
5. バリデーションエラー → 起動失敗（エラーメッセージ表示）
```
