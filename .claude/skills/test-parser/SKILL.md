---
name: test-parser
description: バックエンドのパーサーをサンプルデータで個別テストする
argument-hint: <parser_name> [input_file]
allowed-tools: Bash, Read, Write, Glob
---

# パーサー単体テスト

指定したパーサーをサンプルコマンド出力で実行し、構造化 JSON 結果を表示します。

## 引数

- `$ARGUMENTS` の1番目: パーサー名（`processes`, `disk`, `tmux`, `gpu`, `cpu_memory` のいずれか）
- `$ARGUMENTS` の2番目（任意）: サンプル入力ファイルのパス

引数: $ARGUMENTS

## パーサーとモジュールの対応

| パーサー名 | モジュール | 関数 |
|-----------|-----------|------|
| `processes` | `server.collectors.parsers.processes` | `parse(raw)` |
| `disk` | `server.collectors.parsers.disk` | `parse_df(raw)`, `parse_du(raw)` |
| `tmux` | `server.collectors.parsers.tmux` | `parse(raw)` |
| `gpu` | `server.collectors.parsers.gpu` | `parse_info(raw)`, `parse_procs(raw, pid_map)` |
| `cpu_memory` | `server.collectors.parsers.cpu_memory` | `parse(free_raw, nproc_raw, uptime_raw)` |

## 手順

1. パーサー名を特定
2. サンプル入力ファイルが指定されていない場合、`backend/tests/fixtures/{parser_name}.txt` を使用
3. フィクスチャも存在しない場合、対象コマンドの出力例をサンプルデータとして作成
4. パーサーモジュールをインポートし、サンプルデータでパース関数を呼び出す Python スクリプトを構成
5. 実行: `cd backend && uv run python -c "<script>"`
6. 結果を `.model_dump_json(indent=2)` で整形表示
7. `None` が返った場合はエラー原因を調査
