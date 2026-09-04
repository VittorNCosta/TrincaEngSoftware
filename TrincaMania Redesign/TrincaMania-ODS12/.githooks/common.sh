#!/usr/bin/env sh
# Preâmbulo comum aos hooks. Não é um hook — o git ignora nomes que não sejam
# de hook conhecido.
#
# Faz duas coisas, ambas consequência de onde os hooks rodam:
#
# 1. **Entra no diretório do projeto.** O git chama o hook a partir da raiz do
#    repositório (`TrincaEngSoftware/`), e o projeto vive dois níveis abaixo.
#    `$0` é o caminho do hook, então `dirname $0/..` é o projeto.
#
# 2. **Garante `node` no PATH.** Hook roda em shell não-interativo, que não
#    carrega o `.zshrc` onde o nvm é inicializado. Sem isto o hook morre com
#    "npx: command not found" — e o git lê saída não-zero como reprovação,
#    bloqueando o commit por um motivo que não tem nada a ver com o código.

set -e

HOOK_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_DIR=$(CDPATH= cd -- "$HOOK_DIR/.." && pwd)

if ! command -v node >/dev/null 2>&1; then
  NODE_VERSIONS="${NVM_DIR:-$HOME/.nvm}/versions/node"

  if [ -d "$NODE_VERSIONS" ]; then
    WANTED=$(cat "$PROJECT_DIR/.nvmrc" 2>/dev/null || echo '')
    CHOSEN=''

    # Prefere a versão que o .nvmrc pede; cai para a mais nova instalada.
    if [ -n "$WANTED" ]; then
      for dir in "$NODE_VERSIONS"/v"$WANTED" "$NODE_VERSIONS"/v"$WANTED".*; do
        if [ -x "$dir/bin/node" ]; then
          CHOSEN="$dir"
          break
        fi
      done
    fi

    if [ -z "$CHOSEN" ]; then
      CHOSEN=$(ls -d "$NODE_VERSIONS"/v* 2>/dev/null | sort -V | tail -1)
    fi

    if [ -n "$CHOSEN" ] && [ -x "$CHOSEN/bin/node" ]; then
      PATH="$CHOSEN/bin:$PATH"
      export PATH
    fi
  fi
fi

if ! command -v node >/dev/null 2>&1; then
  echo "hook: 'node' não está no PATH e não foi encontrado no nvm." >&2
  echo "      Instale o Node 20 ou rode com --no-verify se for urgente." >&2
  exit 1
fi

cd "$PROJECT_DIR"
