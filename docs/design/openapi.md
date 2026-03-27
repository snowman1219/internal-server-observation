# OpenAPI定義方針

## 方針

**FastAPIの自動生成OpenAPIスペックをエクスポートし、Orvalで連携する。**

手書きのOpenAPIスペックは作成しない。理由:

- FastAPIがPydanticモデルとルートデコレータから自動でOpenAPIスペックを生成する
- 手書きスペックとの二重管理を避け、バックエンドの実装を唯一の情報源（Single Source of Truth）とする
- Pydanticモデルの変更が自動的にOpenAPIに反映される

---

## エクスポート方法

### エクスポートスクリプト

```python
# server/export_openapi.py
import json
import yaml
from server.main import app

def export():
    openapi_schema = app.openapi()
    with open("docs/openapi.yaml", "w") as f:
        yaml.dump(openapi_schema, f, default_flow_style=False, allow_unicode=True)

if __name__ == "__main__":
    export()
```

実行:

```bash
uv run python -m server.export_openapi
```

### 出力先

`docs/openapi.yaml` — Orvalの `orval.config.cjs` が参照するパス。

---

## FastAPIルートデコレータの規約

OpenAPIスペックの品質を保つため、全ルートに以下を付与:

```python
@router.get(
    "/servers",
    response_model=ServerListResponse,
    summary="List all servers",
    tags=["servers"],
)

@router.get(
    "/servers/{server_name}/status",
    response_model=ServerStatus,
    summary="Get server status",
    tags=["servers"],
    responses={404: {"description": "Server not found"}},
)

@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check",
    tags=["health"],
)
```

| 項目 | 必須 | 説明 |
|------|------|------|
| `response_model` | Yes | レスポンスのPydanticモデル |
| `summary` | Yes | エンドポイントの短い説明 |
| `tags` | Yes | Orvalの `tags-split` で使われるタグ |
| `responses` | エラーがある場合 | 非200レスポンスの定義 |

---

## Orval連携

### Orval設定（テンプレート提供）

```javascript
// orval.config.cjs
module.exports = {
  "openapi-file": {
    input: "./docs/openapi.yaml",
    output: {
      mode: "tags-split",                         // タグ別にファイル分割
      target: "app/lib/api/generated/client.ts",
      schemas: "app/lib/api/generated/models",
      client: "fetch",
      override: {
        mutator: {
          path: "app/lib/api/custom-fetch.ts",
          name: "customFetch",
        },
      },
    },
  },
};
```

### 生成されるファイル

```
app/lib/api/generated/
    client.ts           # タグ別のAPI関数（servers, health）
    models/
        index.ts        # 全型のre-export
        serverStatus.ts
        serverListResponse.ts
        ...
```

### タグ → 生成関数の対応

| タグ | 生成される関数名（想定） |
|------|------------------------|
| `servers` | `getApiServers()`, `getApiServersServerNameStatus(serverName)` |
| `health` | `getApiHealth()` |

---

## 開発ワークフロー

```
1. バックエンドのPydanticモデル or ルートを変更
2. OpenAPIスペックをエクスポート
   $ uv run python -m server.export_openapi
3. フロントエンドのAPIクライアントを再生成
   $ cd frontend && pnpm generate_api_client
4. 生成された型・関数を使ってフロントエンドを実装
5. docs/openapi.yaml をコミットに含める
```

### 注意事項

- `docs/openapi.yaml` はGit管理する（フロントエンド単体でも型生成できるようにするため）
- バックエンドのモデル変更後にエクスポートを忘れるとフロントエンドとの型不一致が発生する
- CI/CDでエクスポートスクリプトを実行し、差分があればエラーにするチェックを推奨
