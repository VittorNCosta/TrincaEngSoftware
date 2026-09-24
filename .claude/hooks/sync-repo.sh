#!/usr/bin/env bash
# UserPromptSubmit hook: mantem o repo local sincronizado com o remoto (origin)
# antes de comecar a trabalhar. So faz pull automatico quando for fast-forward
# seguro (working tree limpo, sem divergencia); caso contrario apenas avisa.
set -uo pipefail

ROOT="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null)}"
cd "$ROOT" 2>/dev/null || exit 0

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0

emit() {
  # $1 = mensagem em texto puro -> imprime {"systemMessage": "..."}
  python3 -c 'import json,sys; print(json.dumps({"systemMessage": sys.argv[1]}))' "$1"
}

fetch_err=$(git fetch --all --prune --quiet 2>&1)
if [ $? -ne 0 ]; then
  emit "⚠️ git fetch falhou em $(basename "$ROOT"): ${fetch_err}"
  exit 0
fi

branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
upstream=$(git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null)

# Sem tracking branch (branch local sem remoto) -> nada a sincronizar.
[ -z "$upstream" ] && exit 0

behind=$(git rev-list --count HEAD.."@{u}" 2>/dev/null || echo 0)
ahead=$(git rev-list --count "@{u}"..HEAD 2>/dev/null || echo 0)

[ "$behind" -eq 0 ] && exit 0

if [ "$ahead" -gt 0 ]; then
  emit "⚠️ '$branch' divergiu de '$upstream' ($ahead a frente / $behind atras). Sincronize manualmente (merge/rebase)."
  exit 0
fi

if [ -n "$(git status --porcelain)" ]; then
  emit "⚠️ '$branch' esta $behind commit(s) atras de '$upstream', mas ha mudancas locais nao commitadas. Pull manual necessario."
  exit 0
fi

if pull_out=$(git pull --ff-only --quiet 2>&1); then
  emit "✅ '$branch' atualizada automaticamente ($behind commit(s) novo(s) de '$upstream')."
else
  emit "⚠️ Nao foi possivel dar fast-forward em '$branch' a partir de '$upstream': ${pull_out}"
fi
exit 0
