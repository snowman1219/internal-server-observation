# Docker設計

## 構成方針

バックエンド（FastAPI）とフロントエンド（React）を**分離コンテナ**で構成し、`docker-compose` で管理する。

---

## コンテナ構成

```
┌─────────────────────────────────────────────────┐
│  docker-compose                                 │
│                                                 │
│  ┌──────────────┐      ┌──────────────────┐     │
│  │  backend     │      │  frontend        │     │
│  │  FastAPI     │◄─────│  Nginx           │     │
│  │  :8000       │ proxy│  :3000           │     │
│  └──────┬───────┘      │  (静的ファイル配信)│     │
│         │ SSH          └──────────────────┘     │
│         ▼                                       │
│  [対象サーバー群]                                 │
│                                                 │
│  volumes:                                       │
│    - ./config.yaml:/app/config.yaml             │
│    - ~/.ssh:/root/.ssh:ro                       │
└─────────────────────────────────────────────────┘
```

| コンテナ | ベースイメージ | ポート | 役割 |
|---------|--------------|--------|------|
| `backend` | `python:3.14-slim` | 8000 | FastAPI APIサーバー |
| `frontend` | `node:22-slim` (ビルド) → `nginx:alpine` (配信) | 3000 | React静的ファイル配信 + APIリバースプロキシ |

---

## docker-compose.yaml

```yaml
services:
  backend:
    build:
      context: ./server
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    volumes:
      - ./config.yaml:/app/config.yaml:ro
      - ${SSH_KEY_PATH:-~/.ssh}:/root/.ssh:ro
    environment:
      - CONFIG_PATH=/app/config.yaml
      - POLL_INTERVAL_SECONDS=${POLL_INTERVAL_SECONDS:-30}
      - SSH_TIMEOUT_SECONDS=${SSH_TIMEOUT_SECONDS:-5}
      - SSH_KEY_PATH=/root/.ssh/id_rsa
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        VITE_BASE_URL: ${VITE_BASE_URL:-http://backend:8000}
    ports:
      - "3000:80"
    depends_on:
      - backend
    restart: unless-stopped
```

---

## Dockerfile: バックエンド

```dockerfile
FROM python:3.14-slim

# SSH接続に必要なパッケージ
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssh-client \
    && rm -rf /var/lib/apt/lists/*

# uv インストール
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

# 依存関係インストール
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

# アプリケーションコード
COPY . .

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "server.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## Dockerfile: フロントエンド

マルチステージビルド: Node.jsでビルド → Nginxで配信。

```dockerfile
# --- ビルドステージ ---
FROM node:22-slim AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

ARG VITE_BASE_URL=http://localhost:8000
ENV VITE_BASE_URL=${VITE_BASE_URL}

RUN pnpm build

# --- 配信ステージ ---
FROM nginx:alpine

COPY --from=builder /app/build/client /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

---

## Nginx設定

`frontend/nginx.conf`:

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # APIリクエストをバックエンドにプロキシ
    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # SPA用フォールバック
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## SSH鍵のマウント

- ホストの SSH秘密鍵をバックエンドコンテナに**読み取り専用**でマウント
- `config.yaml` の `ssh_key_path` はコンテナ内のパス（`/root/.ssh/id_rsa`）を指定
- パーミッション: ホスト側で `chmod 600` されていることを前提

---

## 開発時の構成

開発時はコンテナを使わず、ローカルで直接起動:

```bash
# バックエンド
cd server && uv run uvicorn server.main:app --reload --port 8000

# フロントエンド（別ターミナル）
cd frontend && pnpm dev
```

- フロントエンド開発サーバー（Vite）は `http://localhost:5173` で起動
- `VITE_BASE_URL=http://localhost:8000` でバックエンドに接続
- バックエンドに CORSミドルウェアを追加（`ENVIRONMENT=development` 時のみ）

---

## 起動・停止

```bash
# 起動
docker compose up -d

# ログ確認
docker compose logs -f

# 停止
docker compose down

# リビルド
docker compose up -d --build
```
