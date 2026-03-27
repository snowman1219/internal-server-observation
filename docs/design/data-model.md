# データモデル設計

## バックエンド（Pydantic v2モデル）

### 設定モデル

```python
class ServerConfig(BaseModel):
    name: str                          # サーバー識別名
    host: str                          # IPアドレス or "localhost"
    ssh_user: str                      # SSH接続ユーザー
    ssh_port: int = 22                 # SSHポート（デフォルト: 22）
    ssh_key_path: str | None = None    # サーバー個別の秘密鍵パス（省略時はグローバル設定を使用）

class AppConfig(BaseModel):
    poll_interval_seconds: int = 30
    ssh_timeout_seconds: int = 5
    ssh_key_path: str = "~/.ssh/id_rsa"
    servers: list[ServerConfig]
```

### ステータスモデル

#### CPU/メモリ概況

```python
class CpuMemoryOverview(BaseModel):
    cpu_count: int                     # nproc
    load_average_1m: float             # uptime
    load_average_5m: float
    load_average_15m: float
    memory_total: str                  # free -h（例: "125Gi"）
    memory_used: str
    memory_free: str
    memory_available: str
    memory_used_percent: float         # 算出値
    swap_total: str
    swap_used: str
    swap_free: str
    swap_used_percent: float           # 算出値
```

#### プロセス/リソース使用状況

```python
class UserProcessSummary(BaseModel):
    user: str                          # ユーザー名
    cpu_percent: float                 # 全プロセスのCPU%合計
    memory_percent: float              # 全プロセスのMEM%合計

class TopProcess(BaseModel):
    user: str
    pid: int
    cpu_percent: float
    memory_percent: float
    command: str                       # コマンドライン全体

class ProcessSummary(BaseModel):
    per_user: list[UserProcessSummary] # ユーザー別集計（CPU%降順）
    top_processes: list[TopProcess]    # CPU%上位5件
```

#### ディスク使用状況

```python
class FilesystemUsage(BaseModel):
    source: str                        # /dev/sda1 等
    fstype: str                        # ext4, xfs 等
    size: str                          # "500G"
    used: str                          # "320G"
    available: str                     # "155G"
    used_percent: float                # 67.4
    mount_point: str                   # "/"

class UserHomeUsage(BaseModel):
    user: str                          # ユーザー名（/home/配下のディレクトリ名）
    size: str                          # "128G"

class DiskUsage(BaseModel):
    filesystems: list[FilesystemUsage]
    user_home: list[UserHomeUsage]
```

#### tmuxセッション

```python
class TmuxUserSummary(BaseModel):
    user: str
    session_count: int                 # セッション数
    window_count: int                  # 全セッションのウィンドウ数合計
```

#### GPU使用状況

```python
class GpuInfo(BaseModel):
    index: int                         # GPU番号（0始まり）
    name: str                          # "NVIDIA A100-SXM4-80GB"
    utilization_percent: int           # GPU使用率
    memory_used: str                   # "72384 MiB"
    memory_total: str                  # "81920 MiB"
    memory_used_percent: float         # 算出値
    temperature_celsius: int           # GPU温度

class GpuProcess(BaseModel):
    gpu_index: int
    gpu_name: str
    pid: int
    user: str                          # PIDからps経由で紐付け
    used_memory: str                   # "35840 MiB"

class GpuStatus(BaseModel):
    gpus: list[GpuInfo]
    gpu_processes: list[GpuProcess]
```

#### サーバーステータス（集約モデル）

```python
class ServerStatus(BaseModel):
    server_name: str
    host: str
    is_online: bool
    last_updated_at: datetime
    error: str | None = None
    cpu_memory_overview: CpuMemoryOverview | None = None
    process_summary: ProcessSummary | None = None
    disk_usage: DiskUsage | None = None
    tmux_sessions: list[TmuxUserSummary] | None = None
    gpu_status: GpuStatus | None = None
```

### レスポンスモデル

```python
class ServerSummary(BaseModel):
    name: str
    host: str
    is_online: bool
    last_updated_at: datetime
    error: str | None = None
    active_users: list[str] | None = None          # プロセス所有者+tmuxセッション所有者（システムユーザー除外）
    cpu_used_percent: float | None = None          # 全CPU%合計 ÷ コア数 × 100
    memory_used_percent: float | None = None       # メモリ使用率
    disk_max_used_percent: float | None = None     # 最も使用率の高いファイルシステム
    gpu_max_utilization_percent: int | None = None  # 最も使用率の高いGPU（GPUなしはnull）

class ServerListResponse(BaseModel):
    servers: list[ServerSummary]

class HealthResponse(BaseModel):
    status: str
    uptime_seconds: float
    polling_interval_seconds: int
    server_count: int
```

---

## フロントエンド（TypeScript型）

Orvalが OpenAPI スペックから自動生成するため手動定義は不要。生成される型は `app/lib/api/generated/models/` に配置される。

以下は生成される型の想定形状（参考）:

```typescript
// ServerListResponse
interface ServerListResponse {
  servers: ServerSummary[];
}

interface ServerSummary {
  name: string;
  host: string;
  is_online: boolean;
  last_updated_at: string;   // ISO 8601
  error: string | null;
  active_users: string[] | null;
  cpu_used_percent: number | null;
  memory_used_percent: number | null;
  disk_max_used_percent: number | null;
  gpu_max_utilization_percent: number | null;
}

// ServerStatus
interface ServerStatus {
  server_name: string;
  host: string;
  is_online: boolean;
  last_updated_at: string;
  error: string | null;
  cpu_memory_overview: CpuMemoryOverview | null;
  process_summary: ProcessSummary | null;
  disk_usage: DiskUsage | null;
  tmux_sessions: TmuxUserSummary[] | null;
  gpu_status: GpuStatus | null;
}

interface CpuMemoryOverview {
  cpu_count: number;
  load_average_1m: number;
  load_average_5m: number;
  load_average_15m: number;
  memory_total: string;
  memory_used: string;
  memory_free: string;
  memory_available: string;
  memory_used_percent: number;
  swap_total: string;
  swap_used: string;
  swap_free: string;
  swap_used_percent: number;
}

interface UserProcessSummary {
  user: string;
  cpu_percent: number;
  memory_percent: number;
}

interface TopProcess {
  user: string;
  pid: number;
  cpu_percent: number;
  memory_percent: number;
  command: string;
}

interface ProcessSummary {
  per_user: UserProcessSummary[];
  top_processes: TopProcess[];
}

interface FilesystemUsage {
  source: string;
  fstype: string;
  size: string;
  used: string;
  available: string;
  used_percent: number;
  mount_point: string;
}

interface UserHomeUsage {
  user: string;
  size: string;
}

interface DiskUsage {
  filesystems: FilesystemUsage[];
  user_home: UserHomeUsage[];
}

interface TmuxUserSummary {
  user: string;
  session_count: number;
  window_count: number;
}

interface GpuInfo {
  index: number;
  name: string;
  utilization_percent: number;
  memory_used: string;
  memory_total: string;
  memory_used_percent: number;
  temperature_celsius: number;
}

interface GpuProcess {
  gpu_index: number;
  gpu_name: string;
  pid: number;
  user: string;
  used_memory: string;
}

interface GpuStatus {
  gpus: GpuInfo[];
  gpu_processes: GpuProcess[];
}

interface HealthResponse {
  status: string;
  uptime_seconds: number;
  polling_interval_seconds: number;
  server_count: number;
}
```

### 注意事項

- Pydanticモデルは `snake_case` でフィールド定義 → FastAPIがそのままJSONのキー名として出力 → Orval生成の TypeScript 型も `snake_case` プロパティ名になる
- `datetime` 型は ISO 8601 文字列としてシリアライズされ、TypeScript側では `string` 型になる
- `customFetch` のレスポンスラッパー `{ status, data, headers }` により、Orval生成関数の戻り値は `data` プロパティ経由でアクセスする形になる
