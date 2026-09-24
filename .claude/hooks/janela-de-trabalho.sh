#!/usr/bin/env bash
# Faz a sessao parar de executar nos horarios em que voce sai da frente.
#
#   janela-de-trabalho.sh PreToolUse        # avisa antes do corte, bloqueia depois
#   janela-de-trabalho.sh UserPromptSubmit  # sua mensagem renova a licenca
#
# Toda a decisao mora em scripts/janela.js — aqui so resolvemos o node e
# repassamos o stdin do hook. Nunca falha o turno: erro sai como aviso e
# exit 0, porque hook quebrado bloqueando ferramenta e pior que janela que
# nao fecha.
set -uo pipefail

ROOT="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null)}"
APP="$ROOT/TrincaMania Redesign/TrincaMania-ODS12"

[ -d "$APP" ] || exit 0

# shellcheck source=./resolver-node.sh
. "$(dirname -- "$0")/resolver-node.sh"

NODE=$(resolver_node) || exit 0

# Sem `exec`: se o script quebrar, a saida vazia deixa a ferramenta passar em
# vez de estourar um erro a cada chamada.
if saida=$("$NODE" "$APP/scripts/janela.js" --hook "${1:-PreToolUse}" 2>/dev/null); then
  [ -n "$saida" ] && printf '%s\n' "$saida"
fi
exit 0
