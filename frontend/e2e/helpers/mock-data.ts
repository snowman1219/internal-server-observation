/** サーバー一覧レスポンス（オンライン2台 + オフライン1台） */
export const MOCK_SERVER_LIST_RESPONSE = {
  servers: [
    {
      name: "gpu-server-1",
      host: "192.168.1.10",
      is_online: true,
      last_updated_at: "2026-03-26T10:30:00Z",
      error: null,
      active_users: ["alice", "bob"],
      cpu_used_percent: 14.1,
      memory_used_percent: 78.4,
      disk_max_used_percent: 67.4,
      gpu_max_utilization_percent: 95,
    },
    {
      name: "monitor-server",
      host: "localhost",
      is_online: true,
      last_updated_at: "2026-03-26T10:30:00Z",
      error: null,
      active_users: ["admin"],
      cpu_used_percent: 5.2,
      memory_used_percent: 32.0,
      disk_max_used_percent: 45.1,
      gpu_max_utilization_percent: null,
    },
    {
      name: "dev-server-2",
      host: "192.168.1.12",
      is_online: false,
      last_updated_at: "2026-03-26T10:28:30Z",
      error: "SSH connection timed out",
      active_users: null,
      cpu_used_percent: null,
      memory_used_percent: null,
      disk_max_used_percent: null,
      gpu_max_utilization_percent: null,
    },
  ],
};

/** GPU搭載サーバーの詳細ステータス（全セクション有効） */
export const MOCK_GPU_SERVER_STATUS = {
  server_name: "gpu-server-1",
  host: "192.168.1.10",
  is_online: true,
  last_updated_at: "2026-03-26T10:30:00Z",
  error: null,
  cpu_memory_overview: {
    cpu_count: 32,
    load_average_1m: 4.52,
    load_average_5m: 3.21,
    load_average_15m: 2.88,
    memory_total: "125Gi",
    memory_used: "98Gi",
    memory_free: "2.1Gi",
    memory_available: "24Gi",
    memory_used_percent: 78.4,
    swap_total: "16Gi",
    swap_used: "2.3Gi",
    swap_free: "13.7Gi",
    swap_used_percent: 14.4,
  },
  process_summary: {
    per_user: [
      { user: "alice", cpu_percent: 245.3, memory_percent: 32.1 },
      { user: "bob", cpu_percent: 102.7, memory_percent: 18.5 },
    ],
    top_processes: [
      {
        user: "alice",
        pid: 12345,
        cpu_percent: 98.2,
        memory_percent: 12.3,
        command: "python train.py --epochs 100",
      },
      {
        user: "alice",
        pid: 12346,
        cpu_percent: 95.1,
        memory_percent: 11.8,
        command: "python evaluate.py",
      },
    ],
    total_cpu_percent: 451.2,
  },
  disk_usage: {
    filesystems: [
      {
        source: "/dev/sda1",
        fstype: "ext4",
        size: "500G",
        used: "320G",
        available: "155G",
        used_percent: 67.4,
        mount_point: "/",
      },
    ],
    user_home: [
      { user: "alice", size: "128G" },
      { user: "bob", size: "45G" },
    ],
  },
  tmux_sessions: [
    { user: "alice", session_count: 3, window_count: 12 },
    { user: "bob", session_count: 1, window_count: 4 },
  ],
  gpu_status: {
    gpus: [
      {
        index: 0,
        name: "NVIDIA A100-SXM4-80GB",
        utilization_percent: 95,
        memory_used: "72384 MiB",
        memory_total: "81920 MiB",
        memory_used_percent: 88.4,
        temperature_celsius: 72,
      },
    ],
    gpu_processes: [
      {
        gpu_index: 0,
        gpu_name: "NVIDIA A100-SXM4-80GB",
        pid: 12345,
        user: "alice",
        used_memory: "35840 MiB",
      },
    ],
  },
};

/** GPU非搭載サーバーの詳細ステータス（gpu_status: null） */
export const MOCK_NO_GPU_SERVER_STATUS = {
  server_name: "monitor-server",
  host: "localhost",
  is_online: true,
  last_updated_at: "2026-03-26T10:30:00Z",
  error: null,
  cpu_memory_overview: {
    cpu_count: 8,
    load_average_1m: 0.42,
    load_average_5m: 0.35,
    load_average_15m: 0.28,
    memory_total: "16Gi",
    memory_used: "5.1Gi",
    memory_free: "8.2Gi",
    memory_available: "10.5Gi",
    memory_used_percent: 32.0,
    swap_total: "4Gi",
    swap_used: "0.1Gi",
    swap_free: "3.9Gi",
    swap_used_percent: 2.5,
  },
  process_summary: {
    per_user: [{ user: "admin", cpu_percent: 5.2, memory_percent: 8.1 }],
    top_processes: [
      {
        user: "admin",
        pid: 5001,
        cpu_percent: 3.1,
        memory_percent: 4.2,
        command: "node server.js",
      },
    ],
    total_cpu_percent: 41.6,
  },
  disk_usage: {
    filesystems: [
      {
        source: "/dev/sda1",
        fstype: "ext4",
        size: "200G",
        used: "90G",
        available: "100G",
        used_percent: 45.1,
        mount_point: "/",
      },
    ],
    user_home: [{ user: "admin", size: "12G" }],
  },
  tmux_sessions: [{ user: "admin", session_count: 1, window_count: 2 }],
  gpu_status: null,
};

/** オフラインサーバーの詳細ステータス（全セクション null） */
export const MOCK_OFFLINE_SERVER_STATUS = {
  server_name: "dev-server-2",
  host: "192.168.1.12",
  is_online: false,
  last_updated_at: "2026-03-26T10:28:30Z",
  error: "SSH connection timed out",
  cpu_memory_overview: null,
  process_summary: null,
  disk_usage: null,
  tmux_sessions: null,
  gpu_status: null,
};

/** staleテスト用：last_updated_at が3分前のサーバー一覧 */
export const MOCK_STALE_SERVER_LIST = {
  servers: MOCK_SERVER_LIST_RESPONSE.servers.map((server) => ({
    ...server,
    last_updated_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
  })),
};

/** ヘルスチェックレスポンス */
export const MOCK_HEALTH_RESPONSE = {
  status: "ok",
  uptime_seconds: 86400,
  polling_interval_seconds: 30,
  server_count: 3,
};
