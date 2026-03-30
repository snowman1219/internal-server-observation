# フロントエンド設計

## テンプレート

- React 19.2 + TypeScript 5.9 + Vite 6.3
- React Router 7.9（SSR無効、CSR only）
- Tailwind CSS 4.1
- Orval（`docs/openapi.yaml` → APIクライアント自動生成）
- `customFetch`（`VITE_BASE_URL` からベースURL取得）
- biome + oxlint（フォーマット・リント）
- Vitest（unit + browser テスト）
- pnpm

---

## ルート構成

| パス | ファイル | 説明 |
|------|---------|------|
| `/` | `routes/home.tsx` | サーバー一覧（カードグリッド） |
| `/servers/:serverName` | `routes/servers.$serverName.tsx` | サーバー詳細（タブ付き） |

```typescript
// app/routes.ts
import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("servers/:serverName", "routes/servers.$serverName.tsx"),
] satisfies RouteConfig;
```

---

## コンポーネント構成

```
app/
    routes/
        home.tsx                        # サーバー一覧ページ
        servers.$serverName.tsx         # サーバー詳細ページ
    components/
        layout/
            header.tsx                  # アプリタイトル、最終更新表示
            server-card.tsx             # サーバーサマリカード
        status/
            cpu-memory-card.tsx         # F6: ロードアベレージ、メモリ、スワップ
            process-summary-card.tsx    # F2: ユーザー別CPU/MEM集計 + 上位5件
            disk-usage-card.tsx         # F3: ファイルシステム + ユーザーホーム
            tmux-card.tsx              # F4: tmuxセッションサマリ
            gpu-card.tsx               # F5: GPU使用状況
        common/
            stale-badge.tsx            # データ古い警告（2分超）
            progress-bar.tsx           # パーセンテージバー（汎用）
            error-alert.tsx            # エラー表示
    lib/
        api/
            custom-fetch.ts            # テンプレート提供のfetchラッパー
            generated/                 # Orval自動生成
        hooks/
            use-servers.ts             # サーバー一覧取得hook
            use-server-status.ts       # サーバー詳細取得hook
```

---

## 画面設計

> ワイヤーフレーム: [wireframes.pen](./wireframes.pen)（Pencilで開いて確認）

### サーバー一覧ページ（`/`）

```
┌─────────────────────────────────────────────────────────┐
│  Server Monitor                       最終更新: 5秒前   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ gpu-server-1│  │ dev-server-2│  │ monitor     │     │
│  │ ● Online    │  │ ○ Offline   │  │ ● Online    │     │
│  │ 192.168.1.10│  │ 192.168.1.12│  │ localhost   │     │
│  │             │  │ SSH timeout │  │             │     │
│  │ 更新: 5秒前 │  │ 更新: 2分前 │  │ 更新: 5秒前 │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

- カードグリッド: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- カードクリックで `/servers/{serverName}` に遷移
- オフラインサーバーはカードをグレーアウト + エラーメッセージ表示

### サーバー詳細ページ（`/servers/:serverName`）

```
┌─────────────────────────────────────────────────────────┐
│  ← 戻る    gpu-server-1    ● Online    ⚠ Data stale    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────┐  ┌──────────────────────┐  │
│  │ CPU / メモリ概況        │  │ プロセス/リソース     │  │
│  │                         │  │                      │  │
│  │ CPU: 32コア             │  │ [ユーザー別棒グラフ]  │  │
│  │ Load: 4.52 / 3.21 / 2.88│  │ alice: CPU 245% MEM 32%│
│  │                         │  │ bob:   CPU 102% MEM 18%│
│  │ Memory: 98Gi / 125Gi   │  │                      │  │
│  │ ██████████░░ 78%        │  │ 上位プロセス:        │  │
│  │                         │  │ alice python train.py│  │
│  │ Swap: 2.3Gi / 16Gi     │  │   CPU:98% MEM:12%    │  │
│  │ █░░░░░░░░░░░ 14%        │  │ ...                  │  │
│  └─────────────────────────┘  └──────────────────────┘  │
│                                                         │
│  ┌─────────────────────────┐  ┌──────────────────────┐  │
│  │ ディスク使用状況        │  │ tmux セッション      │  │
│  │                         │  │                      │  │
│  │ /dev/sda1 (/)           │  │ alice: 3 sessions    │  │
│  │ ██████░░░░░░ 67% 320G/500G│ │        12 windows    │  │
│  │                         │  │ bob:   1 session     │  │
│  │ ユーザー別:             │  │        4 windows     │  │
│  │ alice: 128G             │  │                      │  │
│  │ bob:   45G              │  │                      │  │
│  └─────────────────────────┘  └──────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │ GPU 使用状況                                      │   │
│  │                                                   │   │
│  │ GPU 0: NVIDIA A100-SXM4-80GB                      │   │
│  │ 使用率: ████████████████░░ 95%                    │   │
│  │ VRAM:   72384 / 81920 MiB (88%)   温度: 72°C     │   │
│  │                                                   │   │
│  │ GPU プロセス:                                      │   │
│  │ alice (PID 12345) - 35840 MiB on GPU 0            │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

- 2カラムグリッド: `grid-cols-1 lg:grid-cols-2`
- GPUカードはフル幅（GPU搭載サーバーのみ表示）
- 各セクションが `null` の場合「データなし」表示
- データが2分以上古い場合、`stale-badge` で警告

---

## コンポーネント詳細

### `server-card.tsx`

| Props | 型 | 説明 |
|-------|-----|------|
| `server` | `ServerSummary` | サーバーサマリ情報 |

- クリックで React Router の `useNavigate` で遷移
- `is_online` によるスタイル切替（オンライン: 緑ドット、オフライン: グレー）
- `error` がある場合、カード下部に赤テキストで表示
- `active_users` をカンマ区切りで表示（誰がそのサーバーを使っているか）
- `cpu_used_percent` / `memory_used_percent` / `disk_max_used_percent` を `progress-bar` で表示
- `gpu_max_utilization_percent` が `null` でない場合のみGPUバーを表示
- オフラインサーバーはバー非表示（データが `null` のため）

### `cpu-memory-card.tsx`

| Props | 型 | 説明 |
|-------|-----|------|
| `data` | `CpuMemoryOverview \| null` | CPU/メモリ概況 |

- ロードアベレージ: 数値3つ（1m/5m/15m）
- メモリ/スワップ: `progress-bar` で使用率を表示

### `process-summary-card.tsx`

| Props | 型 | 説明 |
|-------|-----|------|
| `data` | `ProcessSummary \| null` | プロセスサマリ |

- ユーザー別CPU/MEM: 水平棒グラフ（CSSで実装、ライブラリ不使用）
- 上位5プロセス: テーブル表示（user, command, CPU%, MEM%）

### `disk-usage-card.tsx`

| Props | 型 | 説明 |
|-------|-----|------|
| `data` | `DiskUsage \| null` | ディスク使用状況 |

- ファイルシステム: `progress-bar` で使用率 + サイズ表示
- ユーザーホーム: リスト表示（ユーザー名: サイズ）

### `tmux-card.tsx`

| Props | 型 | 説明 |
|-------|-----|------|
| `data` | `TmuxUserSummary[] \| null` | tmuxセッション一覧 |

- ユーザーごとに1行: セッション数 + ウィンドウ数
- セッション0件の場合は「アクティブなセッションなし」

### `gpu-card.tsx`

| Props | 型 | 説明 |
|-------|-----|------|
| `data` | `GpuStatus \| null` | GPU使用状況 |

- `null` の場合はコンポーネント自体を非表示
- GPU毎: 名前、使用率バー、VRAMバー、温度
- GPUプロセス: テーブル（ユーザー, PID, 使用VRAM, GPU番号）

### `stale-badge.tsx`

| Props | 型 | 説明 |
|-------|-----|------|
| `lastUpdatedAt` | `string` | ISO 8601日時 |

- 現在時刻との差が120秒超の場合、黄色警告バッジを表示
- 「データが古い可能性があります（X分前に更新）」

### `progress-bar.tsx`

| Props | 型 | 説明 |
|-------|-----|------|
| `percent` | `number` | 使用率（0-100） |
| `label` | `string` | 表示ラベル（任意） |
| `size` | `"sm" \| "md"` | バーの高さ |

- 使用率に応じた色: 0-60% 緑、60-80% 黄、80%+ 赤

---

## データフェッチ

### TanStack Query フック

```typescript
// app/lib/hooks/use-servers.ts
export function useServers() {
  return useQuery({
    queryKey: ["servers"],
    queryFn: () => getApiServers(),       // Orval生成関数
    refetchInterval: 10_000,              // 10秒ポーリング
    refetchIntervalInBackground: false,   // タブ非表示時は停止
    staleTime: 5_000,
  });
}

// app/lib/hooks/use-server-status.ts
export function useServerStatus(serverName: string) {
  return useQuery({
    queryKey: ["server-status", serverName],
    queryFn: () => getApiServersServerNameStatus(serverName),
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
    staleTime: 5_000,
    enabled: !!serverName,
  });
}
```

### QueryClient設定

`root.tsx` で `QueryClientProvider` をラップ:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});
```

---

## テーマ切替（ダークモード / ライトモード）

### 方式

Tailwind CSS 4.1 の `class` ベースダークモードを使用する。

```css
/* app.css */
@custom-variant dark (&:where(.dark, .dark *));
```

`<html>` 要素の `class` 属性を `light` / `dark` で切り替える。

### テーマ切替ロジック

```typescript
// app/lib/theme.ts

type Theme = "light" | "dark" | "system";

/** localStorage からテーマ設定を取得（デフォルト: system） */
function getStoredTheme(): Theme {
  return (localStorage.getItem("theme") as Theme) ?? "system";
}

/** テーマを適用 */
function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("dark", prefersDark);
    root.classList.toggle("light", !prefersDark);
  } else {
    root.classList.toggle("dark", theme === "dark");
    root.classList.toggle("light", theme === "light");
  }
}

/** テーマを保存して適用 */
function setTheme(theme: Theme): void {
  localStorage.setItem("theme", theme);
  applyTheme(theme);
}
```

### 初期化タイミング

`root.tsx` で初回レンダリング前にテーマを適用する。FOUC（Flash of Unstyled Content）を防ぐため、`<head>` 内のインラインスクリプトで実行:

```html
<script>
  (function() {
    var theme = localStorage.getItem('theme') || 'system';
    var dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.add(dark ? 'dark' : 'light');
  })();
</script>
```

### テーマ切替ボタン

`header.tsx` に配置。3段階トグル: ライト → ダーク → システム。

| テーマ | アイコン | 表示 |
|--------|---------|------|
| `light` | ☀️ | ライトモード |
| `dark` | 🌙 | ダークモード |
| `system` | 🖥️ | システム設定に従う |

### ダークモードカラー規約

全コンポーネントで以下のパターンを適用:

| 要素 | ライト | ダーク |
|------|--------|--------|
| ページ背景 | `bg-gray-100` | `dark:bg-gray-900` |
| カード背景 | `bg-white` | `dark:bg-gray-800` |
| カードボーダー | `border-gray-200` | `dark:border-gray-700` |
| 見出しテキスト | `text-gray-900` | `dark:text-gray-100` |
| 本文テキスト | `text-gray-600` | `dark:text-gray-300` |
| 補足テキスト | `text-gray-400` / `text-gray-500` | `dark:text-gray-400` |
| プログレスバー背景 | `bg-gray-200` | `dark:bg-gray-700` |
| テーブルボーダー | `border-gray-100` / `border-gray-200` | `dark:border-gray-700` |
| オフラインカード | `bg-gray-50 opacity-70` | `dark:bg-gray-800/50` |
| stale-badge | `bg-yellow-100 text-yellow-800` | `dark:bg-yellow-900 dark:text-yellow-200` |
| エラーテキスト | `text-red-500` | `dark:text-red-400` |
| リンク | `text-blue-600` | `dark:text-blue-400` |

### コンポーネント構成への影響

```
app/
    lib/
        theme.ts                    # テーマ管理ロジック（新規）
    components/
        layout/
            header.tsx              # テーマ切替ボタンを追加
            theme-toggle.tsx        # テーマ切替ボタンコンポーネント（新規）
```

---

## 追加依存パッケージ

テンプレートに追加で必要なパッケージ:

| パッケージ | 用途 |
|-----------|------|
| `@tanstack/react-query` | データフェッチ・ポーリング |

チャートライブラリは不使用。ユーザー別CPU/MEMの棒グラフはTailwind CSSの `width` ユーティリティで実装する。
