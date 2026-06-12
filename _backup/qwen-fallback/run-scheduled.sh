#!/bin/zsh
# AXIOM AI — launchd から定期実行されるラッパー
# ollama が落ちていれば起動を待ってから生成パイプラインを回す。
set -u

PROJECT_DIR="/Users/takimototetsuya/AIニュースサイト"
OLLAMA_BIN="/usr/local/bin/ollama"
NPM_BIN="/usr/local/bin/npm"
API="http://localhost:11434/api/tags"

cd "$PROJECT_DIR" || exit 1

echo "===== $(date '+%Y-%m-%d %H:%M:%S') 定期実行開始 ====="

# ollama 疎通確認。落ちていれば起動して最大30秒待つ。
if ! curl -s -m 3 "$API" >/dev/null 2>&1; then
  echo "ollama 未起動 → 起動を試行"
  "$OLLAMA_BIN" serve >/dev/null 2>&1 &
  for i in {1..30}; do
    curl -s -m 2 "$API" >/dev/null 2>&1 && { echo "ollama 起動確認 (${i}s)"; break; }
    sleep 1
  done
fi

if ! curl -s -m 3 "$API" >/dev/null 2>&1; then
  echo "ERROR: ollama に接続できず中止"
  exit 1
fi

"$NPM_BIN" run generate
echo "===== $(date '+%Y-%m-%d %H:%M:%S') 終了 (exit=$?) ====="
