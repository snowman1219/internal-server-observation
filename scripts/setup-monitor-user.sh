#!/bin/bash
# setup-monitor-user.sh
#
# 各監視対象サーバーに monitor ユーザーを作成し、SSH公開鍵を配布する。
# サーバー一覧は config.yaml から読み取る。
#
# 前提:
#   - yq コマンドがインストール済み (https://github.com/mikefarah/yq)
#   - SSH_USER で各サーバーに sudo 権限付きでログインできること
#
# 使い方:
#   SSH_USER=kicodevs bash scripts/setup-monitor-user.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG_FILE="${SCRIPT_DIR}/../config.yaml"

# --- 引数・環境変数 ---
SSH_USER="${SSH_USER:?SSH_USER 環境変数を設定してください（sudo権限のあるユーザー名）}"

if [ ! -f "$CONFIG_FILE" ]; then
    echo "エラー: config.yaml が見つかりません: $CONFIG_FILE" >&2
    exit 1
fi

if ! command -v yq &>/dev/null; then
    echo "エラー: yq コマンドが必要です。https://github.com/mikefarah/yq" >&2
    exit 1
fi

# config.yaml から SSH 鍵パスを取得
KEY_PATH=$(yq -r '.ssh_key_path' "$CONFIG_FILE")
KEY_PATH="${KEY_PATH/#\~/$HOME}"

# config.yaml からサーバー一覧を取得
mapfile -t HOSTS < <(yq -r '.servers[].host' "$CONFIG_FILE")
mapfile -t NAMES < <(yq -r '.servers[].name' "$CONFIG_FILE")

# sudo パスワードを対話入力
read -rsp "[sudo] $SSH_USER のパスワード: " SUDO_PASS
echo ""

run_sudo() {
    echo "$SUDO_PASS" | sudo -S "$@" 2>/dev/null
}

echo "=== Server Monitor セットアップ ==="
echo "  対象サーバー: ${NAMES[*]}"
echo "  SSH鍵: $KEY_PATH"
echo ""

# Step 1: SSH鍵ペアを生成
if [ ! -f "$KEY_PATH" ]; then
    echo "[1/3] SSH鍵ペアを生成中..."
    ssh-keygen -t ed25519 -f "$KEY_PATH" -N "" -C "server-monitor"
    echo "  → $KEY_PATH に生成しました"
else
    echo "[1/3] SSH鍵ペアは既に存在: $KEY_PATH"
fi

PUB_KEY=$(cat "${KEY_PATH}.pub")

# Step 2: 各サーバーに monitor ユーザーを作成 + 公開鍵を配布
echo "[2/3] 各サーバーに monitor ユーザーを作成中..."

for i in "${!HOSTS[@]}"; do
    HOST="${HOSTS[$i]}"
    NAME="${NAMES[$i]}"
    echo ""
    echo "--- $NAME ($HOST) ---"

    SETUP_COMMANDS='
        set -e
        useradd -r -m -s /bin/bash monitor 2>/dev/null || echo "  → monitor ユーザーは既に存在"
        mkdir -p /home/monitor/.ssh
        echo "'"$PUB_KEY"'" > /home/monitor/.ssh/authorized_keys
        chmod 700 /home/monitor/.ssh
        chmod 600 /home/monitor/.ssh/authorized_keys
        chown -R monitor:monitor /home/monitor/.ssh
        echo "  → 完了"
    '

    if [ "$HOST" = "localhost" ] || [ "$HOST" = "127.0.0.1" ]; then
        echo "  ローカルで monitor ユーザーを作成..."
        echo "$SUDO_PASS" | sudo -S bash -c "$SETUP_COMMANDS" 2>/dev/null
    else
        echo "  $SSH_USER@$HOST に接続中..."
        ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no "$SSH_USER@$HOST" bash -s <<REMOTE_SCRIPT
            SUDO_PASS="$SUDO_PASS"
            echo "\$SUDO_PASS" | sudo -S bash -c '$SETUP_COMMANDS' 2>/dev/null
REMOTE_SCRIPT
    fi
done

# Step 3: 接続テスト
echo ""
echo "[3/3] SSH接続テスト..."
for i in "${!HOSTS[@]}"; do
    HOST="${HOSTS[$i]}"
    NAME="${NAMES[$i]}"
    TARGET="$HOST"
    [ "$HOST" = "localhost" ] && TARGET="127.0.0.1"
    echo -n "  monitor@$TARGET ($NAME) ... "
    if ssh -i "$KEY_PATH" -o ConnectTimeout=5 -o StrictHostKeyChecking=no -o BatchMode=yes "monitor@$TARGET" "echo OK" 2>/dev/null; then
        echo ""
    else
        echo "FAILED"
    fi
done

echo ""
echo "=== セットアップ完了 ==="
