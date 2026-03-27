---
name: dev-up
description: バックエンド・フロントエンドの開発サーバーを正しい環境変数で起動する
argument-hint: [backend|frontend|all]
allowed-tools: Bash, Read, Glob
---

# 開発サーバー起動

開発に必要な環境変数を設定して、バックエンド・フロントエンドの開発サーバーを起動します。

## 引数

- `$ARGUMENTS`（任意）: `backend`, `frontend`, `all`（デフォルト: `all`）

引数: $ARGUMENTS

## 起動コマンド

### backend

1. `config.yaml` の存在を確認（なければ `config.yaml.example` からコピーを提案）
2. 依存関係を確認: `cd backend && uv sync`
3. 起動:
   ```bash
   cd backend && ENVIRONMENT=development uv run uvicorn server.main:app --reload --port 8000
   ```
4. 確認 URL: http://localhost:8000/docs（Swagger UI）

### frontend

1. `node_modules` の存在を確認（なければ `pnpm install` を実行）
2. 起動:
   ```bash
   cd frontend && VITE_BASE_URL=http://localhost:8000 pnpm dev
   ```
3. 確認 URL: http://localhost:5173

### all

backend と frontend の両方を起動します。backend をバックグラウンドで起動してから frontend を起動してください。

## 注意事項

- バックエンドは `ENVIRONMENT=development` で CORS ミドルウェアが有効になる（`http://localhost:5173` を許可）
- フロントエンドは `VITE_BASE_URL=http://localhost:8000` でバックエンド API に接続
- これらの環境変数を省略すると正しく動作しません
