#!/bin/zsh
# AXIOM AI — launchd から定期実行されるヘッドレス Claude Code 執筆ジョブ。
# Claude 自身が WebFetch / WebSearch で取材し、忠実な記事を書いてサイトに反映する。
# （翡翠眼方式: API キー不要・Anthropic サブスク内で完結）
set -u

PROJECT_DIR="/Users/takimototetsuya/AIニュースサイト"
CLAUDE_BIN="/Users/takimototetsuya/.local/bin/claude"
PROMPT_FILE="$PROJECT_DIR/prompts/generate-articles.md"

cd "$PROJECT_DIR" || exit 1

echo "===== $(date '+%Y-%m-%d %H:%M:%S') Claude執筆ジョブ開始 ====="

if [[ ! -x "$CLAUDE_BIN" ]]; then
  echo "ERROR: claude CLI が見つかりません ($CLAUDE_BIN)"
  exit 1
fi

# ヘッドレス実行。プロンプトに従い fetchCandidates → 取材執筆 → ingestDrafts まで自走する。
# 注: zsh では $status は読み取り専用（$? の別名）。別名 rc を使う。
"$CLAUDE_BIN" --dangerously-skip-permissions -p "$(cat "$PROMPT_FILE")"
rc=$?

# claude の -p 出力は要約として不確実なため、結果を決定的にログへ残す。
/usr/local/bin/node -e 'const a=require("./data/articles.json");console.log("現在の総記事数: "+a.length);console.log("最新の見出し:");a.slice(0,3).forEach(x=>console.log("  - "+x.slug+" | "+x.headline))' 2>/dev/null

# 本番(Vercel)へ自動反映: 変更があれば commit & push。push すると Vercel が自動デプロイ。
if [[ -n "$(git status --porcelain 2>/dev/null)" ]]; then
  echo "変更を検出 → git push（Vercel 自動デプロイ）"
  git add -A
  git commit -q -m "auto: $(date '+%Y-%m-%d %H:%M') 記事を更新

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
  git push -q origin main && echo "push 完了" || echo "WARN: push 失敗（認証/ネットワークを確認）"
else
  echo "変更なし（push スキップ）"
fi

echo "===== $(date '+%Y-%m-%d %H:%M:%S') 終了 (exit=$rc) ====="
exit $rc
