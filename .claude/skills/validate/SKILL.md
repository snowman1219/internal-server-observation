---
name: validate
description: 実装が設計書と一致しているか検証する（フィールド名、エンドポイントパス、コンポーネント構成など）
argument-hint: [backend|frontend|api|all]
allowed-tools: Bash, Read, Glob, Grep
---

# 設計書との整合性検証

実装コードが設計書の仕様と一致しているかを検証します。

## 引数

- `$ARGUMENTS`（任意）: `backend`, `frontend`, `api`, `all`（デフォルト: `all`）

引数: $ARGUMENTS

## 検証項目

### backend

設計書: `docs/design/data-model.md`, `docs/design/backend.md`

1. **Pydantic モデル存在確認**: 以下のモデルが `backend/server/models/` に定義されているか
   - `ServerConfig`, `AppConfig`
   - `CpuMemoryOverview`, `UserProcessSummary`, `TopProcess`, `ProcessSummary`
   - `FilesystemUsage`, `UserHomeUsage`, `DiskUsage`
   - `TmuxUserSummary`
   - `GpuInfo`, `GpuProcess`, `GpuStatus`
   - `ServerStatus`, `ServerSummary`, `ServerListResponse`, `HealthResponse`

2. **フィールド一致確認**: 各モデルのフィールド名・型が設計書と一致するか

3. **パーサー戻り値型**: 各パーサーの関数シグネチャが設計書の入出力と一致するか

4. **ストア API**: `StatusStore` に `update`, `get`, `get_all_summaries` の 3 メソッドが存在するか

### frontend

設計書: `docs/design/frontend.md`

1. **コンポーネント存在確認**: 以下のファイルが存在するか
   - `app/routes/home.tsx`
   - `app/routes/servers.$serverName.tsx`
   - `app/components/layout/header.tsx`
   - `app/components/layout/server-card.tsx`
   - `app/components/status/cpu-memory-card.tsx`
   - `app/components/status/process-summary-card.tsx`
   - `app/components/status/disk-usage-card.tsx`
   - `app/components/status/tmux-card.tsx`
   - `app/components/status/gpu-card.tsx`
   - `app/components/common/stale-badge.tsx`
   - `app/components/common/progress-bar.tsx`
   - `app/components/common/error-alert.tsx`

2. **フック設定確認**: `use-servers.ts`, `use-server-status.ts` の `refetchInterval` が `10_000`、`staleTime` が `5_000` か

3. **ルート定義**: `app/routes.ts` が設計書通りか

### api

設計書: `docs/design/api.md`, `docs/design/openapi.md`

1. **エンドポイント確認**: 3 つのエンドポイントが正しいパス・メソッドで実装されているか
   - `GET /api/servers` → `ServerListResponse`
   - `GET /api/servers/{server_name}/status` → `ServerStatus`
   - `GET /api/health` → `HealthResponse`

2. **ルーターデコレータ**: `response_model`, `summary`, `tags` が全ルートに付与されているか

3. **OpenAPI ドリフト検出**: エクスポートして `docs/openapi.yaml` に差分がないか確認
   ```bash
   cd backend && uv run python -m server.export_openapi && git diff --exit-code docs/openapi.yaml
   ```

## 出力フォーマット

```
## 検証結果: {scope}

### OK
- [項目]: 説明

### NG
- [項目]: 説明
  - 期待値: ...
  - 実際: ...
  - 修正方法: ...
```
