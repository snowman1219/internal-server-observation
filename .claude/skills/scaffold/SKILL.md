---
name: scaffold
description: プロジェクト規約に従ったボイラープレートファイルを生成する
argument-hint: <type> <name>
allowed-tools: Read, Write, Edit, Glob
---

# モジュールスキャフォールディング

プロジェクトの設計書に従ったボイラープレートを生成します。

## 引数

- `$ARGUMENTS` の1番目: タイプ（`parser`, `component`, `router`, `hook`）
- `$ARGUMENTS` の2番目: モジュール/コンポーネント名

引数: $ARGUMENTS

## タイプ別の生成ルール

### `parser` — バックエンドパーサー

生成先: `backend/server/collectors/parsers/{name}.py`

```python
"""Parse {name} command output."""

import logging

from server.models.status import ...  # 対応するモデルをインポート

logger = logging.getLogger(__name__)


def parse(raw: str) -> ... | None:
    """Parse raw command output.

    Returns None if input is empty or parsing fails.
    """
    if not raw or not raw.strip():
        return None

    try:
        # TODO: implement parsing logic
        pass
    except Exception:
        logger.exception("Failed to parse {name} output")
        return None
```

- `backend/server/collectors/parsers/__init__.py` にインポートを追加
- 対応する Pydantic モデルは `backend/server/models/` から適切なものをインポート

### `component` — フロントエンドコンポーネント

生成先: `frontend/app/components/{category}/{name}.tsx`

```tsx
interface Props {
  data: ... | null;  // 対応する型を Orval 生成から使用
}

export function ComponentName({ data }: Props) {
  if (data === null) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-semibold mb-4">タイトル</h3>
        <p className="text-gray-500">データなし</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="text-lg font-semibold mb-4">タイトル</h3>
      {/* TODO: implement */}
    </div>
  );
}
```

- category は `status`, `layout`, `common` のいずれか（設計書で確認）
- 型は `frontend/app/lib/api/generated/models/` からインポート

### `router` — バックエンドルーター

生成先: `backend/server/routers/{name}.py`

```python
from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["{name}"])


@router.get(
    "/{path}",
    response_model=...,
    summary="...",
    tags=["{name}"],
)
async def endpoint_name():
    pass
```

- `response_model`, `summary`, `tags` は必須（OpenAPI 品質のため）
- `backend/server/routers/__init__.py` にインポートを追加

### `hook` — フロントエンドフック

生成先: `frontend/app/lib/hooks/use-{name}.ts`

```typescript
import { useQuery } from "@tanstack/react-query";

export function use{PascalName}() {
  return useQuery({
    queryKey: ["{name}"],
    queryFn: () => ...,  // Orval 生成関数を使用
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
    staleTime: 5_000,
  });
}
```

- queryFn は Orval 生成の API 関数を使用
