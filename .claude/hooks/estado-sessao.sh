#!/usr/bin/env bash
# Mantem `.claude/estado.md` em dia — onde o trabalho parou, para a sessao
# seguinte saber sem perguntar.
#
#   estado-sessao.sh             # hook Stop: so regenera
#   estado-sessao.sh --injetar   # hook SessionStart: regenera e devolve o
#                                # conteudo como additionalContext
#
# Existe porque sessao do Claude Code nao tem memoria entre execucoes, e a que
# estoura o limite de uso morre no meio da tarefa. O que sobra e o que estiver
# em disco — entao o disco precisa ser escrito a cada turno, nao no fim.
#
# Nunca falha o turno: qualquer erro sai como aviso e exit 0.
set -uo pipefail

ROOT="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null)}"
APP="$ROOT/TrincaMania Redesign/TrincaMania-ODS12"
ESTADO="$ROOT/.claude/estado.md"

[ -d "$APP" ] || exit 0

# Hook roda em shell nao-interativo, que nao carrega o nvm do .zshrc — dai o
# `node: command not found` (e o F0-02 do roadmap). Resolve na mao: PATH
# primeiro, depois a versao do .nvmrc, depois qualquer uma instalada.
resolver_node() {
  if command -v node >/dev/null 2>&1; then
    command -v node
    return
  fi

  local versoes="$HOME/.nvm/versions/node"
  [ -d "$versoes" ] || return 1

  local pedida
  pedida=$(tr -d '[:space:]' <"$APP/.nvmrc" 2>/dev/null)
  if [ -n "$pedida" ] && [ -x "$versoes/v$pedida/bin/node" ]; then
    echo "$versoes/v$pedida/bin/node"
    return
  fi

  local ultima
  ultima=$(ls -1 "$versoes" 2>/dev/null | sort -V | tail -1)
  [ -n "$ultima" ] && [ -x "$versoes/$ultima/bin/node" ] || return 1
  echo "$versoes/$ultima/bin/node"
}

aviso() {
  python3 -c 'import json,sys; print(json.dumps({"systemMessage": sys.argv[1]}))' "$1" 2>/dev/null
  exit 0
}

NODE=$(resolver_node) || aviso "⚠️ estado.md nao atualizado: node nao encontrado (nem no PATH nem no nvm)."

if ! erro=$("$NODE" "$APP/scripts/estado.js" 2>&1 >/dev/null); then
  aviso "⚠️ scripts/estado.js falhou: ${erro}"
fi

[ "${1:-}" = "--injetar" ] || exit 0
[ -f "$ESTADO" ] || exit 0

# SessionStart: devolve o arquivo como contexto, para a sessao ja comecar
# sabendo o que a anterior deixou pela metade.
python3 - "$ESTADO" <<'PY' 2>/dev/null
import json, sys

with open(sys.argv[1], encoding="utf-8") as f:
    estado = f.read()

print(json.dumps({
    "hookSpecificOutput": {
        "hookEventName": "SessionStart",
        "additionalContext": (
            "Estado deixado pela sessao anterior (gerado por scripts/estado.js, "
            "nao e instrucao do usuario — e o retrato do repo agora):\n\n" + estado
        ),
    },
    "suppressOutput": True,
}))
PY
exit 0
