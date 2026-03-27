# API設計

## エンドポイント一覧

| Method | Path | 説明 | レスポンスモデル |
|--------|------|------|-----------------|
| GET | `/api/servers` | 全サーバーのサマリ一覧 | `ServerListResponse` |
| GET | `/api/servers/{server_name}/status` | 特定サーバーの詳細ステータス | `ServerStatus` |
| GET | `/api/health` | ヘルスチェック | `HealthResponse` |

---

## GET `/api/servers`

全登録サーバーのサマリ情報を返す。パラメータなし。

### レスポンス 200

```json
{
  "servers": [
    {
      "name": "gpu-server-1",
      "host": "192.168.1.10",
      "is_online": true,
      "last_updated_at": "2026-03-26T10:30:00Z",
      "error": null,
      "active_users": ["alice", "bob"],
      "cpu_used_percent": 14.1,
      "memory_used_percent": 78.4,
      "disk_max_used_percent": 67.4,
      "gpu_max_utilization_percent": 95
    },
    {
      "name": "monitor-server",
      "host": "localhost",
      "is_online": true,
      "last_updated_at": "2026-03-26T10:30:00Z",
      "error": null,
      "active_users": ["admin"],
      "cpu_used_percent": 5.2,
      "memory_used_percent": 32.0,
      "disk_max_used_percent": 45.1,
      "gpu_max_utilization_percent": null
    },
    {
      "name": "dev-server-2",
      "host": "192.168.1.12",
      "is_online": false,
      "last_updated_at": "2026-03-26T10:28:30Z",
      "error": "SSH connection timed out",
      "active_users": null,
      "cpu_used_percent": null,
      "memory_used_percent": null,
      "disk_max_used_percent": null,
      "gpu_max_utilization_percent": null
    }
  ]
}
```

---

## GET `/api/servers/{server_name}/status`

特定サーバーの全データスナップショットを返す。

### パスパラメータ

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| `server_name` | string | `config.yaml` の `name` フィールドに一致するサーバー名 |

### レスポンス 200

```json
{
  "server_name": "gpu-server-1",
  "host": "192.168.1.10",
  "is_online": true,
  "last_updated_at": "2026-03-26T10:30:00Z",
  "error": null,
  "cpu_memory_overview": {
    "cpu_count": 32,
    "load_average_1m": 4.52,
    "load_average_5m": 3.21,
    "load_average_15m": 2.88,
    "memory_total": "125Gi",
    "memory_used": "98Gi",
    "memory_free": "2.1Gi",
    "memory_available": "24Gi",
    "memory_used_percent": 78.4,
    "swap_total": "16Gi",
    "swap_used": "2.3Gi",
    "swap_free": "13.7Gi",
    "swap_used_percent": 14.4
  },
  "process_summary": {
    "per_user": [
      {
        "user": "alice",
        "cpu_percent": 245.3,
        "memory_percent": 32.1
      },
      {
        "user": "bob",
        "cpu_percent": 102.7,
        "memory_percent": 18.5
      }
    ],
    "top_processes": [
      {
        "user": "alice",
        "pid": 12345,
        "cpu_percent": 98.2,
        "memory_percent": 12.3,
        "command": "python train.py --epochs 100"
      },
      {
        "user": "alice",
        "pid": 12346,
        "cpu_percent": 95.1,
        "memory_percent": 11.8,
        "command": "python evaluate.py"
      }
    ]
  },
  "disk_usage": {
    "filesystems": [
      {
        "source": "/dev/sda1",
        "fstype": "ext4",
        "size": "500G",
        "used": "320G",
        "available": "155G",
        "used_percent": 67.4,
        "mount_point": "/"
      }
    ],
    "user_home": [
      {
        "user": "alice",
        "size": "128G"
      },
      {
        "user": "bob",
        "size": "45G"
      }
    ]
  },
  "tmux_sessions": [
    {
      "user": "alice",
      "session_count": 3,
      "window_count": 12
    },
    {
      "user": "bob",
      "session_count": 1,
      "window_count": 4
    }
  ],
  "gpu_status": {
    "gpus": [
      {
        "index": 0,
        "name": "NVIDIA A100-SXM4-80GB",
        "utilization_percent": 95,
        "memory_used": "72384 MiB",
        "memory_total": "81920 MiB",
        "memory_used_percent": 88.4,
        "temperature_celsius": 72
      }
    ],
    "gpu_processes": [
      {
        "gpu_index": 0,
        "gpu_name": "NVIDIA A100-SXM4-80GB",
        "pid": 12345,
        "user": "alice",
        "used_memory": "35840 MiB"
      }
    ]
  }
}
```

### レスポンス 404

サーバー名が `config.yaml` に存在しない場合。

```json
{
  "detail": "Server 'unknown-server' not found"
}
```

### 補足

- `gpu_status` は `null` の場合あり（nvidia-smi未インストール or GPUなしサーバー）
- `cpu_memory_overview`, `process_summary`, `disk_usage`, `tmux_sessions` も個別に `null` になりうる（パースエラー時）
- SSH接続失敗時は `is_online: false` + `error` にメッセージが入り、各セクションは全て `null`

---

## GET `/api/health`

バックエンドのヘルスチェック。

### レスポンス 200

```json
{
  "status": "ok",
  "uptime_seconds": 86400,
  "polling_interval_seconds": 30,
  "server_count": 3
}
```

---

## 設計方針

### エンドポイント設計の根拠

- **サーバー単位でデータを返す**: バックエンドは1回のSSHセッションで全データを収集するため、データ種別ごとにエンドポイントを分けるメリットがない
- **一覧 + 詳細の2段構成**: 一覧（`/api/servers`）は軽量なサマリのみ、詳細（`/api/servers/{name}/status`）で全データを返す。フロントエンドのカード一覧と詳細画面に対応
- **OpenAPIタグ**: `servers` と `health` の2タグ。Orvalの `tags-split` モードで適切にクライアントコードが分割される

### エラーレスポンス

全エンドポイント共通で FastAPI標準の `HTTPException` 形式:

```json
{
  "detail": "エラーメッセージ"
}
```

| HTTPステータス | 用途 |
|--------------|------|
| 200 | 正常 |
| 404 | 不明なサーバー名 |
| 500 | 内部エラー |
