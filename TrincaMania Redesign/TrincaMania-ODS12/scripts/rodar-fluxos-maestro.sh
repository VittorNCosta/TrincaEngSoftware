#!/usr/bin/env bash
set -euo pipefail

# O Maestro descobre fluxos em ordem variável. Cada jornada limpa o save e
# precisa que o processo anterior termine antes do próximo launchApp.
: "${APP_ID:?APP_ID é obrigatório}"

run_flow() {
  local flow="$1"
  local output_dir="$2"
  local report="$3"

  adb shell am force-stop "$APP_ID"
  sleep 2
  maestro test -e "APP_ID=$APP_ID" \
    --test-output-dir "$output_dir" \
    --format junit --output "$report" ".maestro/$flow.yaml"
}

case "${MAESTRO_SUITE:-full}" in
  full)
    for flow in 01-entrar-numa-fase 02-configuracao-sobrevive-ao-reinicio 03-vencer-fase 04-comprar-na-loja 05-navegar-abas; do
      run_flow "$flow" "../../maestro-artifacts/full/$flow" "../../maestro-resultado-$flow.xml"
    done
    ;;
  baseline)
    for repetition in 1 2 3 4 5; do
      for flow in 01-entrar-numa-fase 02-configuracao-sobrevive-ao-reinicio 03-vencer-fase 04-comprar-na-loja 05-navegar-abas; do
        run_flow "$flow" "../../maestro-artifacts/repeat-$repetition/$flow" "../../maestro-resultado-$repetition-$flow.xml"
      done
    done
    ;;
  accessibility)
    for font in 1.3 2.0; do
      adb shell settings put system font_scale "$font"
      for flow in 03-vencer-fase 04-comprar-na-loja 05-navegar-abas; do
        run_flow "$flow" "../../maestro-artifacts/font-$font/$flow" "../../maestro-resultado-font-$font-$flow.xml"
      done
    done
    ;;
  lives)
    run_flow manual/05-perder-vida-recarregar ../../maestro-artifacts/lives ../../maestro-resultado-lives.xml
    ;;
  *)
    printf 'Suíte Maestro desconhecida: %s\n' "$MAESTRO_SUITE" >&2
    exit 2
    ;;
esac
