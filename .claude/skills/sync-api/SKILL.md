---
name: sync-api
description: OpenAPI スペックをバックエンドからエクスポートし、フロントエンドの Orval API クライアントを再生成する
allowed-tools: Bash, Read, Glob
---

# OpenAPI エクスポート + Orval クライアント生成

バックエンドのモデル/ルーター変更後に、OpenAPI スペックのエクスポートとフロントエンド API クライアントの再生成を一括実行します。

## 手順

1. バックエンドから OpenAPI スペックをエクスポート:
   ```bash
   cd backend && uv run python -m server.export_openapi
   ```

2. エクスポート結果を確認:
   ```bash
   git diff docs/openapi.yaml
   ```

3. フロントエンドの API クライアントを再生成:
   ```bash
   cd frontend && pnpm generate_api_client
   ```

4. 生成されたファイルの変更を確認:
   ```bash
   git diff --name-only frontend/app/lib/api/generated/
   ```

5. 結果を報告: 変更されたファイル一覧と、型の追加・削除があれば内容を表示

## エラー時

- エクスポートスクリプトが失敗 → バックエンドのインポートエラーの可能性。エラーメッセージを表示
- Orval 生成が失敗 → `docs/openapi.yaml` のフォーマット問題の可能性。スペックの妥当性を確認
