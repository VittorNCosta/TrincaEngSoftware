#!/usr/bin/env bash
# Descobre um `node` utilizavel dentro de um hook.
#
# Hook roda em shell nao-interativo, que nao carrega o nvm do .zshrc — dai o
# `node: command not found` (e o F0-02 do roadmap). Resolve na mao: PATH
# primeiro, depois a versao do .nvmrc, depois qualquer uma instalada.
#
# Uso: `. "$(dirname -- "$0")/resolver-node.sh"` e entao `resolver_node`,
# com $APP apontando para a raiz do app (onde vive o .nvmrc).

resolver_node() {
  if command -v node >/dev/null 2>&1; then
    command -v node
    return
  fi

  local versoes="$HOME/.nvm/versions/node"
  [ -d "$versoes" ] || return 1

  local pedida
  pedida=$(tr -d '[:space:]' <"${APP:-.}/.nvmrc" 2>/dev/null)
  if [ -n "$pedida" ] && [ -x "$versoes/v$pedida/bin/node" ]; then
    echo "$versoes/v$pedida/bin/node"
    return
  fi

  local ultima
  ultima=$(ls -1 "$versoes" 2>/dev/null | sort -V | tail -1)
  [ -n "$ultima" ] && [ -x "$versoes/$ultima/bin/node" ] || return 1
  echo "$versoes/$ultima/bin/node"
}
