#!/usr/bin/env bash
# NÃO EDITE À MÃO. Gerado por scripts/gerar-issues-roadmap.js a partir de
# docs/roadmap/roadmap.html — TrincaMania ODS 12
# Requer: gh instalado e autenticado (gh auth login)
# Idempotência: rodar duas vezes cria issues duplicadas. Rode uma vez só.
set -euo pipefail
REPO="VittorNCosta/TrincaEngSoftware"

echo "== labels =="
gh label create 'fundacao' --repo "$REPO" --color 5E6862 --force >/dev/null
gh label create 'conteudo' --repo "$REPO" --color 00803B --force >/dev/null
gh label create 'arte' --repo "$REPO" --color C8121B --force >/dev/null
gh label create 'som' --repo "$REPO" --color B98A00 --force >/dev/null
gh label create 'limpeza-ods12' --repo "$REPO" --color 7B3F00 --force >/dev/null
gh label create 'git' --repo "$REPO" --color 0055A4 --force >/dev/null
gh label create 'ci-cd' --repo "$REPO" --color 2F6478 --force >/dev/null
gh label create 'devsecops' --repo "$REPO" --color CC5F00 --force >/dev/null
gh label create 'qualidade' --repo "$REPO" --color 574E6B --force >/dev/null
gh label create 'release' --repo "$REPO" --color 0E6F6B --force >/dev/null
gh label create 'P0' --repo "$REPO" --color D73A4A --force >/dev/null
gh label create 'P1' --repo "$REPO" --color E5A000 --force >/dev/null
gh label create 'P2' --repo "$REPO" --color BFC7C2 --force >/dev/null
gh label create 'claude-code' --repo "$REPO" --color 0E8A6B --force >/dev/null
gh label create 'humano' --repo "$REPO" --color 8A4FBE --force >/dev/null

echo "== milestones =="
ms() { gh api -X POST "repos/$REPO/milestones" -f title="$1" -f description="$2" >/dev/null 2>&1 || true; }
ms 'Fundação' 'Desbloqueia todo o resto. Duas destas travam ferramenta: `gh` não existe no WSL e `node` só resolve em shell interativo.'
ms 'Conteúdo 10×10' 'O bloco de maior risco. Hoje são 203 fases em 8 mundos × 25 + bônus, e `tests/levelComposition.test.cjs` trava um sha256 do JSON delas. Quebrar esse hash é intencional aqui — mas exige atualizar seis arquivos de teste e migrar o save de que'
ms 'Arte' 'Vinte imagens de mapa mais oito assets globais. É o maior gargalo do projeto e tudo depende do portão A-04. Alvo de peso: **≤ 400 KB por PNG** — hoje `map_world1_scene_bg.png` sozinho tem 5,8 MB.'
ms 'Som' 'MP3 em loop sem emenda audível, 30–60 s, 128 kbps, ≤ 800 KB. Sem melodia forte — o jogo é de concentração.'
ms 'Limpeza ODS12' 'A regra permanente do `CLAUDE.md` trata sobra de vocabulário de fantasia como **bug de conteúdo**. Isto é o que ainda existe hoje, verificado no código.'
ms 'Git e versionamento' 'Os commits já seguem Conventional Commits na prática. Falta travar isso em ferramenta e ligar a versão ao histórico.'
ms 'CI/CD' 'O `ci.yml` atual roda lint, typecheck, test, test:ui e test:playthrough em **um job sequencial**. Se o lint falha, você não descobre se os testes passariam.'
ms 'DevSecOps' 'O último commit do repositório é `chore: corrige vulnerabilidades` — feito à mão. O objetivo deste fluxo é que isso não volte a ser manual.'
ms 'Qualidade' 'Já existem 19 arquivos de teste. Falta cobertura de ponta a ponta e quebrar os três arquivos que passaram do tamanho gerenciável.'
ms 'Release' 'Quase tudo aqui é conta, formulário e captura de tela — trabalho seu, não de código. Vale começar cedo: a conta do Play Console e a política de privacidade travam a submissão.'

# Cria a issue e, quando a tarefa já foi concluída, fecha em seguida.
mk() {
  local done="$1"; shift
  local url
  url="$(gh issue create --repo "$REPO" "$@")"
  echo "  $url"
  if [ "$done" = "done" ]; then
    gh issue close "$url" --repo "$REPO" --reason completed --comment "Concluída antes da criação do backlog — ver o corpo da issue." >/dev/null
  fi
}

echo "== issues =="

# --- Fundação ---
mk done --title 'F0-01 · Instalar o `gh` CLI' \
  --body '**Feito 03/09:** binário v2.99.0 baixado do release oficial para `~/.local/bin/gh`, sem sudo — o diretório já está no PATH via `.zshrc:105`. Falta só o `gh auth login`, que é interativo.

**Responsável:** Você
**Prioridade:** P0
**Fluxo:** Fundação

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'fundacao,P0,humano' --milestone 'Fundação'
mk open --title 'F0-02 · Expor `node` no PATH não-interativo' \
  --body 'Hoje só existe via nvm. Em shell não-interativo o comando não resolve — isso quebra hook de git e script de CI local.

**Responsável:** Você
**Prioridade:** P0
**Fluxo:** Fundação

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'fundacao,P0,humano' --milestone 'Fundação'
mk open --title 'F0-03 · Fixar a versão de Node do projeto' \
  --body '`.nvmrc` com 20 + campo `engines`. O CI já usa Node 20; falta alinhar o local.

**Responsável:** Claude Code
**Prioridade:** P1
**Fluxo:** Fundação

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'fundacao,P1,claude-code' --milestone 'Fundação'
mk done --title 'F0-04 · Resolver o `package.json` pendente' \
  --body '**Feito 03/09** (commit `c1e3b65`). Não era decisão em aberto e sim bug: o `package-lock.json` commitado já trazia ~54.0.37 / ~54.0.18 / ^29.5.14, então HEAD tinha manifest e lock discordando — `npm ci`, que é o que o CI roda, falharia.

**Responsável:** Claude Code
**Prioridade:** P0
**Fluxo:** Fundação

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'fundacao,P0,claude-code' --milestone 'Fundação'
mk open --title 'F0-05 · Rodar `npx expo-doctor` e registrar o baseline' \
  --body 'Saúde do projeto antes das mudanças grandes.

**Responsável:** Claude Code
**Prioridade:** P1
**Fluxo:** Fundação

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'fundacao,P1,claude-code' --milestone 'Fundação'
mk open --title 'F0-06 · Criar a branch `feat/campanha-10x10`' \
  --body 'A reescrita de conteúdo não vai direto em `develop`.

**Responsável:** Claude Code
**Prioridade:** P0
**Fluxo:** Fundação

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'fundacao,P0,claude-code' --milestone 'Fundação'

# --- Conteúdo 10×10 ---
mk done --title 'C-01 · Confirmar os nomes dos Mundos 9 e 10' \
  --body '**Decidido 03/09.** A campanha fica com **Oficina do Reparo** e **Cidade Circular**; quem foi renomeado foi o capítulo — 9 virou **Ferro-Velho Renascido** e 10 virou **Metrópole do Ciclo Fechado**. Já no código (commit `9bd1059`).

**Responsável:** Você
**Prioridade:** P0
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P0,humano' --milestone 'Conteúdo 10×10'
mk open --title 'C-02 · Redesenhar a curva de dificuldade para 100 fases' \
  --body 'Hoje a rampa vai de 9 a 60 peças em 203 fases. `WORLD_LEVELS_PER_MAP` 25→10, `WORLD_DIFFICULTY_BLOCK_SIZE` 5→2. Invariante: `tileCount` sempre múltiplo de 3.

**Responsável:** Claude Code
**Prioridade:** P0
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P0,claude-code' --milestone 'Conteúdo 10×10'
mk open --title 'C-03 · Redefinir os marcos de descanso, loja e guardião' \
  --body 'Com 10 fases por mundo os marcos atuais (5/10/15/20/25) colapsam. Proposta: descanso na 5, guardião na 10, loja entre mundos.

**Responsável:** Claude Code
**Prioridade:** P0
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P0,claude-code' --milestone 'Conteúdo 10×10'
mk open --title 'C-04 · Escrever os 100 títulos de fase' \
  --body 'Dez por mundo, no vocabulário de `CONTEXT.md`. Zero fantasia genérica.

**Responsável:** Claude Code
**Prioridade:** P0
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P0,claude-code' --milestone 'Conteúdo 10×10'
mk open --title 'C-05 · Escrever os 100 textos de objetivo' \
  --body 'Padrão atual: “Objetivo: <verbo> <alvo>.”

**Responsável:** Claude Code
**Prioridade:** P0
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P0,claude-code' --milestone 'Conteúdo 10×10'
mk open --title 'C-06 · Derivar os `starTimeLimits` das 100 fases' \
  --body 'Da curva, não à mão — hoje via `WORLD_STAR_TIME_BASE_OFFSET` e `WORLD_STAR_TIME_SPAN`.

**Responsável:** Claude Code
**Prioridade:** P1
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P1,claude-code' --milestone 'Conteúdo 10×10'
mk open --title 'C-07 · Definir `recommendedPower` e `mysteryTileCount` por fase' \
  --body 'Mistério com teto de 1/6 do tabuleiro, regra já usada nos capítulos.

**Responsável:** Claude Code
**Prioridade:** P1
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P1,claude-code' --milestone 'Conteúdo 10×10'
mk done --title 'C-08 · Decidir o destino do mundo bônus (id 21)' \
  --body '**Decidido 03/09:** fica como 11º mapa secreto — que já é o comportamento atual (`subtitle: '\''Mundo secreto'\''`). Não muda código hoje, mas cria C-08a e C-08b na reescrita.

**Responsável:** Você
**Prioridade:** P1
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P1,humano' --milestone 'Conteúdo 10×10'
mk open --title 'C-08a · Reposicionar o bônus de `25.1–25.3` para `10.1–10.3`' \
  --body '`src/data/worlds.ts:119-120`. O `levelStart`/`levelEnd` atual aponta para o fim de um Mundo 1 de 25 fases, que passa a ter 10.

**Responsável:** Claude Code
**Prioridade:** P0
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P0,claude-code' --milestone 'Conteúdo 10×10'
mk open --title 'C-08b · Trocar o `theme: '\''sweet'\''` do bônus' \
  --body 'Vocabulário de fantasia num mundo que fica. Cai junto com L-02. Reavaliar também `unlockRule: '\''three-stars-world-1'\''`, que fica mais fácil com o Mundo 1 em 10 fases.

**Responsável:** Claude Code
**Prioridade:** P1
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P1,claude-code' --milestone 'Conteúdo 10×10'
mk open --title 'C-09 · Estender `CampaignWorldId` para 9 e 10' \
  --body '`src/types/game.ts:30`

**Responsável:** Claude Code
**Prioridade:** P0
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P0,claude-code' --milestone 'Conteúdo 10×10'
mk open --title 'C-10 · Reescrever `WORLDS` com 10 mundos' \
  --body '`src/data/worlds.ts` — ajustar `levelStart`/`levelEnd`, hoje 1-25, 26-50 … 176-200.

**Responsável:** Claude Code
**Prioridade:** P0
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P0,claude-code' --milestone 'Conteúdo 10×10'
mk open --title 'C-11 · Reescrever `LEVEL_SEEDS`' \
  --body '`src/data/levels.ts:519-1545`. Mundos 1–3 são autorais, 4–8 gerados. Decidir se as 100 viram todas geradas (mais sustentável).

**Responsável:** Claude Code
**Prioridade:** P0
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P0,claude-code' --milestone 'Conteúdo 10×10'
mk open --title 'C-12 · Ajustar `GENERATED_WORLD_CONFIGS` de 25 para 10 títulos' \
  --body '`src/data/levels.ts:198-395`

**Responsável:** Claude Code
**Prioridade:** P0
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P0,claude-code' --milestone 'Conteúdo 10×10'
mk open --title 'C-13 · Registrar os mundos 9 e 10 em `WORLD_MAP_CONFIGS`' \
  --body 'O `Record` é total — `tsc` quebra sem as entradas. É proposital.

**Responsável:** Claude Code
**Prioridade:** P0
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P0,claude-code' --milestone 'Conteúdo 10×10'
mk open --title 'C-14 · Reduzir o mapa do Mundo 1 de 25 para 10 âncoras' \
  --body '`src/data/worldMapConfigs.ts:26-195`, `designSize` 360×3160.

**Responsável:** Claude Code
**Prioridade:** P0
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P0,claude-code' --milestone 'Conteúdo 10×10'
mk open --title 'C-15 · Renomear `BOSQUE_*` para vocabulário ODS12' \
  --body '15 ocorrências. Ver o fluxo de limpeza.

**Responsável:** Claude Code
**Prioridade:** P1
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P1,claude-code' --milestone 'Conteúdo 10×10'
mk open --title 'C-16 · Atualizar o comentário das 203 em `boardPositions.ts`' \
  --body 'Linhas 16 e 39.

**Responsável:** Claude Code
**Prioridade:** P1
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P1,claude-code' --milestone 'Conteúdo 10×10'
mk open --title 'C-17 · Mapear `AMBIENT_BY_WORLD_ID` para os 10 mundos' \
  --body '`src/utils/sounds.ts:165-174` cobre só 1–8. Mundo sem entrada toca em silêncio.

**Responsável:** Claude Code
**Prioridade:** P0
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P0,claude-code' --milestone 'Conteúdo 10×10'
mk open --title 'C-18 · Cobrir os mundos 9 e 10 em `getGameBackground`' \
  --body '`src/screens/GameScreen.tsx:327` — hoje só 1–8 e 21.

**Responsável:** Claude Code
**Prioridade:** P0
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P0,claude-code' --milestone 'Conteúdo 10×10'
mk open --title 'C-19 · Recalcular o hash sha256 das fases' \
  --body '`tests/levelComposition.test.cjs:108`. Trocar 203→100, o total de peças (11415) e o literal `b1a76275…`. **Não deletar a asserção** — é trava de integridade.

**Responsável:** Claude Code
**Prioridade:** P0
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P0,claude-code' --milestone 'Conteúdo 10×10'
mk open --title 'C-20 · Atualizar `tests/chapterProgress.test.cjs:80`' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code
**Prioridade:** P0
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P0,claude-code' --milestone 'Conteúdo 10×10'
mk open --title 'C-21 · Atualizar `tests/worldMapConfig.test.cjs:57-73`' \
  --body 'Três asserções sobre 203.

**Responsável:** Claude Code
**Prioridade:** P0
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P0,claude-code' --milestone 'Conteúdo 10×10'
mk open --title 'C-22 · Atualizar `tests/chapters.test.cjs:434-436`' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code
**Prioridade:** P0
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P0,claude-code' --milestone 'Conteúdo 10×10'
mk open --title 'C-23 · Atualizar `tests/simulateFullPlaythrough.cjs:44,210`' \
  --body 'É a simulação que prova que toda fase é vencível.

**Responsável:** Claude Code
**Prioridade:** P0
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P0,claude-code' --milestone 'Conteúdo 10×10'
mk open --title 'C-24 · Revisar `boardLayout` e `campaignMapLayout`' \
  --body 'Podem depender da contagem e das âncoras do Mundo 1.

**Responsável:** Claude Code
**Prioridade:** P0
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P0,claude-code' --milestone 'Conteúdo 10×10'
mk open --title 'C-25 · Escrever a migração de save 203→100' \
  --body '**Crítico.** Ids `w1-011`…`w8-025` deixam de existir e `normalizeProgress` descarta id desconhecido em silêncio. Decidir: mapear proporcionalmente, ou versionar o save e resetar com aviso.

**Responsável:** Claude Code
**Prioridade:** P0
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P0,claude-code' --milestone 'Conteúdo 10×10'
mk open --title 'C-26 · Testar a migração de save' \
  --body 'Save antigo → save novo, sem perda silenciosa.

**Responsável:** Claude Code
**Prioridade:** P0
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P0,claude-code' --milestone 'Conteúdo 10×10'
mk open --title 'C-27 · Travar em teste a cobertura de fundo e ambiente por mundo' \
  --body 'Impede que um mundo novo caia em silêncio ou no fundo do Mundo 1 — o mesmo problema já registrado nos capítulos.

**Responsável:** Claude Code
**Prioridade:** P1
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P1,claude-code' --milestone 'Conteúdo 10×10'
mk open --title 'C-28 · Atualizar o texto do Modo Dev' \
  --body '`src/components/SettingsModal.tsx:120` cita “203 fases”.

**Responsável:** Claude Code
**Prioridade:** P2
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P2,claude-code' --milestone 'Conteúdo 10×10'
mk open --title 'C-29 · Reescrever o invariante #4 do `CLAUDE.md`' \
  --body 'O congelamento das 203 deixa de valer.

**Responsável:** Claude Code
**Prioridade:** P0
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P0,claude-code' --milestone 'Conteúdo 10×10'
mk open --title 'C-30 · Decidir e implementar o destino dos Capítulos' \
  --body 'Esconder do menu, manter como modo infinito pós-jogo, ou remover. Hoje `ChaptersScreen` é acessível.

**Responsável:** undefined
**Prioridade:** P1
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P1,' --milestone 'Conteúdo 10×10'

# --- Arte ---
mk open --title 'A-01 · Escrever o art bible' \
  --body 'Paleta CONAMA, estilo, do/don'\''t ODS12.

**Responsável:** Claude Code
**Prioridade:** P0
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P0,claude-code' --milestone 'Arte'
mk open --title 'A-02 · Criar `assets/map/worlds/` e a convenção de nome' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code
**Prioridade:** P0
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P0,claude-code' --milestone 'Arte'
mk open --title 'A-03 · Escolher a ferramenta de geração e travar seed/estilo' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Você
**Prioridade:** P0
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P0,humano' --milestone 'Arte'
mk open --title 'A-04 · Gerar e validar a imagem-piloto no aparelho' \
  --body 'Mundo 1, fundo de jogo. **Portão** — nada em lote antes disso.

**Responsável:** Você
**Prioridade:** P0
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P0,humano' --milestone 'Arte'
mk open --title 'A-05 · Mundo 1 · Parque da Coleta Seletiva — fundo de mapa' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** undefined
**Prioridade:** P0
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P0,' --milestone 'Arte'
mk open --title 'A-06 · Mundo 1 · Parque da Coleta Seletiva — fundo de jogo' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** undefined
**Prioridade:** P0
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P0,' --milestone 'Arte'
mk open --title 'A-07 · Mundo 2 · Vale da Reciclagem — fundo de mapa' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** undefined
**Prioridade:** P0
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P0,' --milestone 'Arte'
mk open --title 'A-08 · Mundo 2 · Vale da Reciclagem — fundo de jogo' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** undefined
**Prioridade:** P0
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P0,' --milestone 'Arte'
mk open --title 'A-09 · Mundo 3 · Central de Materiais — fundo de mapa' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** undefined
**Prioridade:** P0
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P0,' --milestone 'Arte'
mk open --title 'A-10 · Mundo 3 · Central de Materiais — fundo de jogo' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** undefined
**Prioridade:** P0
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P0,' --milestone 'Arte'
mk open --title 'A-11 · Mundo 4 · Viveiro Comunitário — fundo de mapa' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** undefined
**Prioridade:** P0
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P0,' --milestone 'Arte'
mk open --title 'A-12 · Mundo 4 · Viveiro Comunitário — fundo de jogo' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** undefined
**Prioridade:** P0
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P0,' --milestone 'Arte'
mk open --title 'A-13 · Mundo 5 · Usina de Compostagem — fundo de mapa' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** undefined
**Prioridade:** P0
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P0,' --milestone 'Arte'
mk open --title 'A-14 · Mundo 5 · Usina de Compostagem — fundo de jogo' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** undefined
**Prioridade:** P0
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P0,' --milestone 'Arte'
mk open --title 'A-15 · Mundo 6 · Cooperativa dos Catadores — fundo de mapa' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** undefined
**Prioridade:** P0
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P0,' --milestone 'Arte'
mk open --title 'A-16 · Mundo 6 · Cooperativa dos Catadores — fundo de jogo' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** undefined
**Prioridade:** P0
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P0,' --milestone 'Arte'
mk open --title 'A-17 · Mundo 7 · Rota da Logística Reversa — fundo de mapa' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** undefined
**Prioridade:** P0
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P0,' --milestone 'Arte'
mk open --title 'A-18 · Mundo 7 · Rota da Logística Reversa — fundo de jogo' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** undefined
**Prioridade:** P0
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P0,' --milestone 'Arte'
mk open --title 'A-19 · Mundo 8 · Fórum da Economia Circular — fundo de mapa' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** undefined
**Prioridade:** P0
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P0,' --milestone 'Arte'
mk open --title 'A-20 · Mundo 8 · Fórum da Economia Circular — fundo de jogo' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** undefined
**Prioridade:** P0
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P0,' --milestone 'Arte'
mk open --title 'A-21 · Mundo 9 · Oficina do Reparo — fundo de mapa' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** undefined
**Prioridade:** P0
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P0,' --milestone 'Arte'
mk open --title 'A-22 · Mundo 9 · Oficina do Reparo — fundo de jogo' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** undefined
**Prioridade:** P0
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P0,' --milestone 'Arte'
mk open --title 'A-23 · Mundo 10 · Cidade Circular — fundo de mapa' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** undefined
**Prioridade:** P0
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P0,' --milestone 'Arte'
mk open --title 'A-24 · Mundo 10 · Cidade Circular — fundo de jogo' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** undefined
**Prioridade:** P0
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P0,' --milestone 'Arte'
mk open --title 'A-25 · Ícone do app 1024×1024' \
  --body 'Hoje 1254×1254, fora do padrão Expo. Símbolo de reciclagem + trinca, sem texto.

**Responsável:** undefined
**Prioridade:** P0
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P0,' --milestone 'Arte'
mk open --title 'A-26 · Adaptive icon Android 1024×1024' \
  --body 'Elemento dentro do círculo de 66%. O `backgroundColor` hoje é `#4B148C` — roxo, fora da paleta CONAMA.

**Responsável:** undefined
**Prioridade:** P0
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P0,' --milestone 'Arte'
mk open --title 'A-27 · Splash screen' \
  --body '`SplashIntroScreen.tsx` tem 537 linhas — conferir o que já é desenhado em código.

**Responsável:** undefined
**Prioridade:** P1
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P1,' --milestone 'Arte'
mk open --title 'A-28 · Selo de marco “Descanso” 320×320' \
  --body 'Substitui `forest_rest_cart.png`, que é carrinho de floresta do tema antigo. Proposta: carrinho de catador.

**Responsável:** undefined
**Prioridade:** P1
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P1,' --milestone 'Arte'
mk open --title 'A-29 · Selo de marco “Loja” 320×320' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** undefined
**Prioridade:** P1
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P1,' --milestone 'Arte'
mk open --title 'A-30 · Selo de marco “Guardião” 320×320' \
  --body 'Não existe hoje.

**Responsável:** undefined
**Prioridade:** P1
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P1,' --milestone 'Arte'
mk open --title 'A-31 · Marcador de portal entre mundos 320×320' \
  --body 'Hoje é `forest-portal-rune` — runa é fantasia. Proposta: seta de ciclo.

**Responsável:** undefined
**Prioridade:** P1
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P1,' --milestone 'Arte'
mk open --title 'A-32 · Nós de fase: bloqueado, atual, completo' \
  --body 'Avaliar se vira SVG em código, como as peças já são.

**Responsável:** undefined
**Prioridade:** P2
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P2,' --milestone 'Arte'
mk open --title 'A-33 · Comprimir todos os PNGs para ≤ 400 KB' \
  --body '`assets/` tem ~50 MB hoje. pngquant, oxipng ou TinyPNG.

**Responsável:** Você
**Prioridade:** P1
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P1,humano' --milestone 'Arte'
mk open --title 'A-34 · Remover `Identidade visual de TrincaMania.png` da raiz' \
  --body '6 MB versionados, duplicata byte-idêntica de `map_world1_scene_bg.png`.

**Responsável:** Claude Code
**Prioridade:** P1
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P1,claude-code' --milestone 'Arte'
mk open --title 'A-35 · Remover os 6 arquivos `.png.png`' \
  --body '`map_bonus_bg.png.png`, `map_shop.png.png`, os três `map_path_pieces_*` e `map_world2_bg.png.png`.

**Responsável:** Claude Code
**Prioridade:** P1
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P1,claude-code' --milestone 'Arte'
mk open --title 'A-36 · Integrar cada asset entregue no código' \
  --body '`campaignMapAssets.ts` e `getGameBackground`.

**Responsável:** undefined
**Prioridade:** P0
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P0,' --milestone 'Arte'

# --- Som ---
mk open --title 'S-01 · `ambient_parque.mp3` — Mundo 1' \
  --body 'Pássaros distantes, folhas, passos ocasionais.

**Responsável:** undefined
**Prioridade:** P0
**Fluxo:** Som

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'som,P0,' --milestone 'Som'
mk open --title 'S-02 · `ambient_vale.mp3` — Mundo 2' \
  --body 'Esteira ao longe, vento de vale, maquinário abafado.

**Responsável:** undefined
**Prioridade:** P0
**Fluxo:** Som

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'som,P0,' --milestone 'Som'
mk open --title 'S-03 · `ambient_central.mp3` — Mundo 3' \
  --body 'Galpão amplo com eco, prensa distante, ventilação.

**Responsável:** undefined
**Prioridade:** P0
**Fluxo:** Som

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'som,P0,' --milestone 'Som'
mk open --title 'S-04 · `ambient_viveiro.mp3` — Mundo 4' \
  --body 'Regador, insetos, lona ao vento.

**Responsável:** undefined
**Prioridade:** P0
**Fluxo:** Som

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'som,P0,' --milestone 'Som'
mk open --title 'S-05 · `ambient_usina.mp3` — Mundo 5' \
  --body 'Zumbido grave de biodigestor, vapor, pá revolvendo.

**Responsável:** undefined
**Prioridade:** P0
**Fluxo:** Som

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'som,P0,' --milestone 'Som'
mk open --title 'S-06 · `ambient_cooperativa.mp3` — Mundo 6' \
  --body 'Carrinho de metal, fardos, vozes distantes indistintas.

**Responsável:** undefined
**Prioridade:** P0
**Fluxo:** Som

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'som,P0,' --milestone 'Som'
mk open --title 'S-07 · `ambient_rota.mp3` — Mundo 7' \
  --body 'Rodovia distante, caminhão manobrando, engradado.

**Responsável:** undefined
**Prioridade:** P0
**Fluxo:** Som

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'som,P0,' --milestone 'Som'
mk open --title 'S-08 · `ambient_forum.mp3` — Mundo 8' \
  --body 'Praça aberta, murmúrio cívico, bandeira ao vento.

**Responsável:** undefined
**Prioridade:** P0
**Fluxo:** Som

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'som,P0,' --milestone 'Som'
mk open --title 'S-09 · `ambient_oficina.mp3` — Mundo 9' \
  --body 'Chave de fenda, gaveta de peças, ferro de solda.

**Responsável:** undefined
**Prioridade:** P0
**Fluxo:** Som

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'som,P0,' --milestone 'Som'
mk open --title 'S-10 · `ambient_cidade.mp3` — Mundo 10' \
  --body 'Bonde, cidade calma, folhagem urbana, sem buzina.

**Responsável:** undefined
**Prioridade:** P0
**Fluxo:** Som

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'som,P0,' --milestone 'Som'
mk open --title 'S-11 · Renomear as `AmbientKey` de fantasia' \
  --body '`beach | celestial | crystal | forest | mountain | snow | stars | volcano`.

**Responsável:** Claude Code
**Prioridade:** P1
**Fluxo:** Som

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'som,P1,claude-code' --milestone 'Som'
mk open --title 'S-12 · Remover os 8 `ambient_*.mp3` antigos' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code
**Prioridade:** P1
**Fluxo:** Som

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'som,P1,claude-code' --milestone 'Som'
mk open --title 'S-13 · Integrar os 10 ambientes em `sounds.ts`' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** undefined
**Prioridade:** P0
**Fluxo:** Som

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'som,P0,' --milestone 'Som'
mk open --title 'S-14 · Revisar os SFX de voz' \
  --body '`voice_amazing`, `voice_excellent` e afins — conferir se o tom bate com o tema.

**Responsável:** Você
**Prioridade:** P2
**Fluxo:** Som

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'som,P2,humano' --milestone 'Som'
mk open --title 'S-15 · Travar em teste que todo mundo tem ambiente' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code
**Prioridade:** P1
**Fluxo:** Som

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'som,P1,claude-code' --milestone 'Som'

# --- Limpeza ODS12 ---
mk open --title 'L-01 · Renomear a union `AmbientKey`' \
  --body '`src/utils/sounds.ts:32-39`

**Responsável:** Claude Code
**Prioridade:** P1
**Fluxo:** Limpeza ODS12

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'limpeza-ods12,P1,claude-code' --milestone 'Limpeza ODS12'
mk open --title 'L-02 · Renomear `WorldTheme`' \
  --body '`'\''forest'\'' | '\''mountain'\'' | '\''crystal'\'' | '\''sweet'\''` em `src/types/game.ts:42`.

**Responsável:** Claude Code
**Prioridade:** P1
**Fluxo:** Limpeza ODS12

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'limpeza-ods12,P1,claude-code' --milestone 'Limpeza ODS12'
mk open --title 'L-03 · Trocar os `identityKey` dos mundos 2–8 e bônus' \
  --body '`vales-montanhosos`, `ruinas-de-cristal`, `praia-dos-tesouros`, `vulcao-doce`, `cidade-das-estrelas`, `neve-cristalina`, `reino-celestial`, `reino-acucarado`.

**Responsável:** Claude Code
**Prioridade:** P1
**Fluxo:** Limpeza ODS12

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'limpeza-ods12,P1,claude-code' --milestone 'Limpeza ODS12'
mk open --title 'L-04 · Renomear os 15 `BOSQUE_*`' \
  --body '`worldMapConfigs.ts`

**Responsável:** Claude Code
**Prioridade:** P1
**Fluxo:** Limpeza ODS12

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'limpeza-ods12,P1,claude-code' --milestone 'Limpeza ODS12'
mk open --title 'L-05 · Renomear as chaves `forest-*` de asset' \
  --body '`campaignMapAssets.ts:3-11`

**Responsável:** Claude Code
**Prioridade:** P1
**Fluxo:** Limpeza ODS12

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'limpeza-ods12,P1,claude-code' --milestone 'Limpeza ODS12'
mk open --title 'L-06 · Renomear `ForestRestMapMarker.tsx`' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code
**Prioridade:** P1
**Fluxo:** Limpeza ODS12

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'limpeza-ods12,P1,claude-code' --milestone 'Limpeza ODS12'
mk open --title 'L-07 · Renomear os 8 `assets/map/world1/forest_*.png`' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code
**Prioridade:** P2
**Fluxo:** Limpeza ODS12

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'limpeza-ods12,P2,claude-code' --milestone 'Limpeza ODS12'
mk open --title 'L-08 · Renomear `map_path_pieces_bonus_reino_acucarado.png`' \
  --body 'Nome de arquivo com “reino açucarado”.

**Responsável:** Claude Code
**Prioridade:** P1
**Fluxo:** Limpeza ODS12

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'limpeza-ods12,P1,claude-code' --milestone 'Limpeza ODS12'
mk open --title 'L-09 · Renomear os path pieces de bosque e vales montanhosos' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code
**Prioridade:** P2
**Fluxo:** Limpeza ODS12

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'limpeza-ods12,P2,claude-code' --milestone 'Limpeza ODS12'
mk open --title 'L-10 · Revisar `assets/map/README_MUNDO_3.txt`' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code
**Prioridade:** P2
**Fluxo:** Limpeza ODS12

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'limpeza-ods12,P2,claude-code' --milestone 'Limpeza ODS12'
mk open --title 'L-11 · Remover os 4 `PATCH-*.md` da raiz' \
  --body '96 KB de docs de patch antigos.

**Responsável:** Você
**Prioridade:** P2
**Fluxo:** Limpeza ODS12

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'limpeza-ods12,P2,humano' --milestone 'Limpeza ODS12'
mk open --title 'L-12 · Remover `TrincaMania Redesign/patch/` aninhado' \
  --body 'Diretório com o mesmo nome do pai, dentro do projeto.

**Responsável:** Você
**Prioridade:** P2
**Fluxo:** Limpeza ODS12

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'limpeza-ods12,P2,humano' --milestone 'Limpeza ODS12'
mk open --title 'L-13 · Escrever o `README.md` de verdade' \
  --body 'Hoje tem 13 bytes.

**Responsável:** Claude Code
**Prioridade:** P1
**Fluxo:** Limpeza ODS12

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'limpeza-ods12,P1,claude-code' --milestone 'Limpeza ODS12'
mk open --title 'L-14 · Decidir o nome do app' \
  --body '`app.json` diz `TileAdventure-ODS`, o slug é `trinca-mania` e o pacote Android é `br.com.mhvtech.trincamania`. Três nomes diferentes.

**Responsável:** Você
**Prioridade:** P0
**Fluxo:** Limpeza ODS12

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'limpeza-ods12,P0,humano' --milestone 'Limpeza ODS12'
mk open --title 'L-15 · Consolidar os dois manuais de APK' \
  --body '`COMO_GERAR_APK.md` e `ManualParaGerarApk.txt`.

**Responsável:** Claude Code
**Prioridade:** P2
**Fluxo:** Limpeza ODS12

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'limpeza-ods12,P2,claude-code' --milestone 'Limpeza ODS12'
mk open --title 'L-16 · Rodar `/code-review` na limpeza' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code
**Prioridade:** P1
**Fluxo:** Limpeza ODS12

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'limpeza-ods12,P1,claude-code' --milestone 'Limpeza ODS12'

# --- Git e versionamento ---
mk open --title 'G-01 · Adotar Conventional Commits formalmente' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code
**Prioridade:** P1
**Fluxo:** Git e versionamento

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'git,P1,claude-code' --milestone 'Git e versionamento'
mk open --title 'G-02 · `commitlint` + config convencional' \
  --body 'Rejeita mensagem fora do padrão.

**Responsável:** Claude Code
**Prioridade:** P1
**Fluxo:** Git e versionamento

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'git,P1,claude-code' --milestone 'Git e versionamento'
mk open --title 'G-03 · `husky` com hook `commit-msg`' \
  --body 'Depende de F0-02 — sem node no PATH o hook não roda.

**Responsável:** Claude Code
**Prioridade:** P1
**Fluxo:** Git e versionamento

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'git,P1,claude-code' --milestone 'Git e versionamento'
mk open --title 'G-04 · `lint-staged` no `pre-commit`' \
  --body 'eslint + prettier só nos arquivos staged.

**Responsável:** Claude Code
**Prioridade:** P1
**Fluxo:** Git e versionamento

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'git,P1,claude-code' --milestone 'Git e versionamento'
mk open --title 'G-05 · Hook `pre-push` com typecheck' \
  --body 'Barato e evita CI vermelho.

**Responsável:** Claude Code
**Prioridade:** P2
**Fluxo:** Git e versionamento

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'git,P2,claude-code' --milestone 'Git e versionamento'
mk open --title 'G-06 · `release-please` para versão e CHANGELOG' \
  --body 'Lê o log e abre PR de release. Casa com o `autoIncrement` do EAS.

**Responsável:** Claude Code
**Prioridade:** P1
**Fluxo:** Git e versionamento

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'git,P1,claude-code' --milestone 'Git e versionamento'
mk open --title 'G-07 · Criar o `CHANGELOG.md`' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code
**Prioridade:** P1
**Fluxo:** Git e versionamento

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'git,P1,claude-code' --milestone 'Git e versionamento'
mk open --title 'G-08 · Alinhar `package.json:version` com `app.json:version`' \
  --body 'Hoje ambos 1.0.0, mas sem sincronia automática.

**Responsável:** Claude Code
**Prioridade:** P1
**Fluxo:** Git e versionamento

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'git,P1,claude-code' --milestone 'Git e versionamento'
mk open --title 'G-09 · Definir a estratégia de branch' \
  --body 'Hoje só existe `develop`. O CI já espera `main` também.

**Responsável:** Você
**Prioridade:** P1
**Fluxo:** Git e versionamento

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'git,P1,humano' --milestone 'Git e versionamento'
mk open --title 'G-10 · Branch protection em `main` e `develop`' \
  --body 'Exigir PR, checks verdes, sem force-push.

**Responsável:** Você
**Prioridade:** P0
**Fluxo:** Git e versionamento

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'git,P0,humano' --milestone 'Git e versionamento'
mk open --title 'G-11 · Template de PR' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code
**Prioridade:** P2
**Fluxo:** Git e versionamento

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'git,P2,claude-code' --milestone 'Git e versionamento'
mk open --title 'G-12 · Templates de issue: bug, arte, conteúdo' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code
**Prioridade:** P2
**Fluxo:** Git e versionamento

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'git,P2,claude-code' --milestone 'Git e versionamento'
mk open --title 'G-13 · `CODEOWNERS`' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code
**Prioridade:** P2
**Fluxo:** Git e versionamento

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'git,P2,claude-code' --milestone 'Git e versionamento'
mk open --title 'G-14 · Padronizar as labels' \
  --body '`arte`, `som`, `conteudo`, `automacao`, `devsecops`, `p0/p1/p2`.

**Responsável:** Claude Code
**Prioridade:** P2
**Fluxo:** Git e versionamento

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'git,P2,claude-code' --milestone 'Git e versionamento'
mk open --title 'G-15 · Revisar o `.gitattributes`' \
  --body 'Faltam `*.ttf`, `*.otf`, `*.aab`, `*.keystore`.

**Responsável:** Claude Code
**Prioridade:** P2
**Fluxo:** Git e versionamento

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'git,P2,claude-code' --milestone 'Git e versionamento'
mk open --title 'G-16 · Decidir sobre Git LFS para os PNGs' \
  --body 'Reavaliar depois de A-33 — com tudo ≤ 400 KB pode não valer.

**Responsável:** Você
**Prioridade:** P2
**Fluxo:** Git e versionamento

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'git,P2,humano' --milestone 'Git e versionamento'
mk open --title 'G-17 · `.gitignore`: `.eas/`, `*.aab`, `coverage/`' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code
**Prioridade:** P2
**Fluxo:** Git e versionamento

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'git,P2,claude-code' --milestone 'Git e versionamento'

# --- CI/CD ---
mk done --title 'CI-01 · Quebrar o CI em jobs paralelos' \
  --body '**Feito 03/09.** Sete jobs no lugar de um sequencial: `lint`, `typecheck`, `guardas`, `test`, `test-ui`, `playthrough` e `expo-doctor`. Antes, lint quebrado escondia se os testes passariam e cada ida ao CI devolvia um problema de cada vez; agora o PR volta com a lista inteira. O preço é um `npm ci` por job, barato porque o cache do `setup-node` e compartilhado e o gargalo real (playthrough, ~1 min) passa a rodar ao lado do resto.

**Responsável:** Claude Code
**Prioridade:** P1
**Fluxo:** CI/CD

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'ci-cd,P1,claude-code' --milestone 'CI/CD'
mk done --title 'CI-02 · `concurrency` com cancelamento de runs antigos' \
  --body '**Feito 03/09.** Push novo no mesmo PR cancela o run anterior. Em push para `main`/`develop` nao cancela — `cancel-in-progress` so liga quando `github.event_name == '\''pull_request'\''`, porque ali cada commit e um estado que vale ter verificado por si.

**Responsável:** Claude Code
**Prioridade:** P1
**Fluxo:** CI/CD

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'ci-cd,P1,claude-code' --milestone 'CI/CD'
mk done --title 'CI-03 · `timeout-minutes` em todo job' \
  --body '**Feito 03/09.** 10 min nos jobs curtos, 15 nos de teste, 20 no playthrough. Sem isso um job travado queima as 6 h de teto padrao do runner.

**Responsável:** Claude Code
**Prioridade:** P1
**Fluxo:** CI/CD

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'ci-cd,P1,claude-code' --milestone 'CI/CD'
mk done --title 'CI-04 · `permissions: contents: read` no topo' \
  --body '**Feito 03/09.** Declarado no nivel do workflow. Sem a chave o `GITHUB_TOKEN` herda o escopo padrao do repositorio, que inclui escrita — e nenhum dos sete jobs precisa de mais que leitura.

**Responsável:** Claude Code
**Prioridade:** P0
**Fluxo:** CI/CD

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'ci-cd,P0,claude-code' --milestone 'CI/CD'
mk done --title 'CI-05 · Fixar as actions por SHA, não por tag' \
  --body '**Feito 03/09.** `actions/checkout` em `11d5960` e `actions/setup-node` em `49933ea`, ambos a v4.4.0, com a versao no comentario ao lado para o bump continuar legivel. Tag e ponteiro mutavel: quem controla o repositorio da action pode reapontar `v4` para outro commit sem que nada aqui mude.

**Responsável:** Claude Code
**Prioridade:** P1
**Fluxo:** CI/CD

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'ci-cd,P1,claude-code' --milestone 'CI/CD'
mk done --title 'CI-06 · Matrix de Node 20 e 22' \
  --body '**Feito 03/09**, com `fail-fast: false` — se o 20 quebra e o 22 e cancelado, a matrix perde a graca, porque a pergunta e em qual das duas falha. **Achou um bug de verdade:** `npm test` era `node --test tests`, e passar diretorio so funciona ate o Node 21 — do 22 em diante o runner trata o argumento como arquivo e morre com `MODULE_NOT_FOUND`. Como `engines` declara `>=20.19.0`, o comando estava quebrado em metade das versoes suportadas. Ver CI-06a.

**Responsável:** Claude Code
**Prioridade:** P2
**Fluxo:** CI/CD

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'ci-cd,P2,claude-code' --milestone 'CI/CD'
mk done --title 'CI-06a · Corrigir `npm test` para qualquer Node >= 20' \
  --body '**Feito 03/09.** Saiu de CI-06. Agora `npm test` chama `scripts/rodar-testes.js`, que le `tests/` e passa a lista de `*.test.cjs` explicita ao `--test`. A alternativa obvia, `node --test tests/*.test.cjs`, trocaria um problema por outro: depende do shell expandir o glob, o que o cmd e o PowerShell nao fazem — armadilha que o `CLAUDE.md` ja avisava. Assim quem lista os arquivos e o Node. 128/128 no Node 20 e no 24.

**Responsável:** Claude Code
**Prioridade:** P1
**Fluxo:** CI/CD

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'ci-cd,P1,claude-code' --milestone 'CI/CD'
mk done --title 'CI-07 · Rodar `npm run format:check` no CI' \
  --body '**Feito 03/09.** Segundo passo do job `lint`, junto da checagem que ja existia — as duas sao analise estatica barata e falham pelo mesmo motivo: alguem commitou sem passar o prettier.

**Responsável:** Claude Code
**Prioridade:** P1
**Fluxo:** CI/CD

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'ci-cd,P1,claude-code' --milestone 'CI/CD'
mk done --title 'CI-08 · Rodar `npx expo-doctor` no CI' \
  --body '**Feito 03/09.** Job proprio. Verificado antes de ligar: 18/18 checks passam hoje, entao entra verde em vez de repetir a armadilha de deixar o CI vermelho de saida.

**Responsável:** Claude Code
**Prioridade:** P1
**Fluxo:** CI/CD

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'ci-cd,P1,claude-code' --milestone 'CI/CD'
mk open --title 'CI-09 · Cobertura de teste com threshold' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code
**Prioridade:** P1
**Fluxo:** CI/CD

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'ci-cd,P1,claude-code' --milestone 'CI/CD'
mk open --title 'CI-10 · Publicar o relatório de cobertura no PR' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code
**Prioridade:** P2
**Fluxo:** CI/CD

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'ci-cd,P2,claude-code' --milestone 'CI/CD'
mk open --title 'CI-11 · Path filters' \
  --body 'Não rodar a suíte de código quando só mudou `.md`.

**Responsável:** Claude Code
**Prioridade:** P2
**Fluxo:** CI/CD

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'ci-cd,P2,claude-code' --milestone 'CI/CD'
mk done --title 'CI-12 · Job de validação de peso de asset' \
  --body '**Feito 03/09.** `scripts/valida-assets.js` roda no CI e cobre três coisas: teto de 400 KB por arquivo, asset órfão que nada em `src/` referencia, e extensão duplicada (`.png.png`, sempre erro de exportação). Reprovar no saldo atual era inviável — 42 arquivos já estouram o teto e 51 são órfãos —, então compara com o livro-razão `scripts/assets-baseline.json`: falha em arquivo novo acima do limite, em arquivo conhecido que engordou e em entrada que saiu da lista sem o saldo ser atualizado. Assim a dívida só pode encolher. Hoje: 100 arquivos, 84,9 MB.

**Responsável:** Claude Code
**Prioridade:** P2
**Fluxo:** CI/CD

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'ci-cd,P2,claude-code' --milestone 'CI/CD'
mk done --title 'CI-13 · Job de guarda ODS12' \
  --body '**Feito 03/09.** `scripts/guarda-ods12.js` roda no CI varrendo `src/` e também o **nome** dos assets — `ambient_celestial.mp3` é conteúdo tanto quanto uma string. Grep puro reprovaria o repositório hoje (`theme: '\''sweet'\''`, `identityKey` legado, trilha do Mundo 8) e reprovaria ocorrência legítima ("restos de fruta" é o que é resíduo orgânico), então compara com o livro-razão `scripts/ods12-baseline.json`: falha em ocorrência nova e em entrada morta, com a chave em `arquivo::termo` e não na linha. Restam 19 pendências classificadas, todas com tarefa nos blocos L, S e C-08b.

**Responsável:** Claude Code
**Prioridade:** P1
**Fluxo:** CI/CD

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'ci-cd,P1,claude-code' --milestone 'CI/CD'
mk open --title 'CI-14 · Criar o secret `EXPO_TOKEN`' \
  --body 'expo.dev → Access Tokens.

**Responsável:** Você
**Prioridade:** P0
**Fluxo:** CI/CD

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'ci-cd,P0,humano' --milestone 'CI/CD'
mk open --title 'CI-15 · Migrar `eas.json` para `appVersionSource: "remote"`' \
  --body 'Hoje é `local`. Remote é o recomendado e habilita o auto-incremento.

**Responsável:** Claude Code
**Prioridade:** P1
**Fluxo:** CI/CD

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'ci-cd,P1,claude-code' --milestone 'CI/CD'
mk open --title 'CI-16 · `autoIncrement: true` no perfil de produção' \
  --body 'Incrementa `versionCode` sozinho.

**Responsável:** Claude Code
**Prioridade:** P1
**Fluxo:** CI/CD

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'ci-cd,P1,claude-code' --milestone 'CI/CD'
mk open --title 'CI-17 · Adicionar o perfil `development` no `eas.json`' \
  --body 'Hoje só existem `preview` e `production`.

**Responsável:** Claude Code
**Prioridade:** P1
**Fluxo:** CI/CD

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'ci-cd,P1,claude-code' --milestone 'CI/CD'
mk open --title 'CI-18 · Workflow de build de preview em PR' \
  --body 'APK por PR para testar no aparelho.

**Responsável:** Claude Code
**Prioridade:** P1
**Fluxo:** CI/CD

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'ci-cd,P1,claude-code' --milestone 'CI/CD'
mk open --title 'CI-19 · Workflow de build de produção em tag' \
  --body 'Dispara na tag do release-please.

**Responsável:** Claude Code
**Prioridade:** P1
**Fluxo:** CI/CD

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'ci-cd,P1,claude-code' --milestone 'CI/CD'
mk open --title 'CI-20 · Configurar EAS Submit para a Play Store' \
  --body 'Exige o service account JSON do Google Play.

**Responsável:** Você
**Prioridade:** P1
**Fluxo:** CI/CD

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'ci-cd,P1,humano' --milestone 'CI/CD'
mk open --title 'CI-21 · `--auto-submit` no build de produção' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code
**Prioridade:** P2
**Fluxo:** CI/CD

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'ci-cd,P2,claude-code' --milestone 'CI/CD'
mk open --title 'CI-22 · Configurar EAS Update (OTA)' \
  --body 'Correção de JS sem passar pela revisão da loja.

**Responsável:** Claude Code
**Prioridade:** P1
**Fluxo:** CI/CD

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'ci-cd,P1,claude-code' --milestone 'CI/CD'
mk open --title 'CI-23 · Avaliar EAS Workflows em `.eas/workflows/`' \
  --body 'Alternativa nativa ao GitHub Actions no lado mobile.

**Responsável:** Claude Code
**Prioridade:** P2
**Fluxo:** CI/CD

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'ci-cd,P2,claude-code' --milestone 'CI/CD'
mk open --title 'CI-24 · Canal de update por branch' \
  --body '`preview` e `production`.

**Responsável:** Claude Code
**Prioridade:** P2
**Fluxo:** CI/CD

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'ci-cd,P2,claude-code' --milestone 'CI/CD'

# --- DevSecOps ---
mk open --title 'SEC-01 · Habilitar CodeQL para JS/TS' \
  --body 'SAST nativo do GitHub.

**Responsável:** Claude Code
**Prioridade:** P0
**Fluxo:** DevSecOps

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'devsecops,P0,claude-code' --milestone 'DevSecOps'
mk open --title 'SEC-02 · Habilitar Secret Scanning e Push Protection' \
  --body 'Bloqueia o commit de segredo antes de sair da máquina.

**Responsável:** Você
**Prioridade:** P0
**Fluxo:** DevSecOps

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'devsecops,P0,humano' --milestone 'DevSecOps'
mk open --title 'SEC-03 · Habilitar Dependabot alerts e security updates' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Você
**Prioridade:** P0
**Fluxo:** DevSecOps

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'devsecops,P0,humano' --milestone 'DevSecOps'
mk open --title 'SEC-04 · `dependabot.yml` para npm e github-actions' \
  --body 'Atualiza dependência e versão de action.

**Responsável:** Claude Code
**Prioridade:** P1
**Fluxo:** DevSecOps

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'devsecops,P1,claude-code' --milestone 'DevSecOps'
mk open --title 'SEC-05 · Avaliar Renovate no lugar do Dependabot' \
  --body 'Agrupa PRs e respeita melhor os ranges do Expo.

**Responsável:** Você
**Prioridade:** P2
**Fluxo:** DevSecOps

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'devsecops,P2,humano' --milestone 'DevSecOps'
mk open --title 'SEC-06 · `npm audit --audit-level=high` no CI' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code
**Prioridade:** P1
**Fluxo:** DevSecOps

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'devsecops,P1,claude-code' --milestone 'DevSecOps'
mk open --title 'SEC-07 · `gitleaks` no CI' \
  --body 'Varre o histórico, não só o diff.

**Responsável:** Claude Code
**Prioridade:** P1
**Fluxo:** DevSecOps

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'devsecops,P1,claude-code' --milestone 'DevSecOps'
mk open --title 'SEC-08 · `dependency-review` em PR' \
  --body 'Action oficial — barra dependência com CVE conhecida.

**Responsável:** Claude Code
**Prioridade:** P1
**Fluxo:** DevSecOps

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'devsecops,P1,claude-code' --milestone 'DevSecOps'
mk open --title 'SEC-09 · Gerar SBOM CycloneDX por release' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code
**Prioridade:** P2
**Fluxo:** DevSecOps

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'devsecops,P2,claude-code' --milestone 'DevSecOps'
mk open --title 'SEC-10 · OpenSSF Scorecard' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code
**Prioridade:** P2
**Fluxo:** DevSecOps

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'devsecops,P2,claude-code' --milestone 'DevSecOps'
mk open --title 'SEC-11 · Auditar `android.permissions`' \
  --body 'Hoje é `[]` — confirmar que continua assim depois de cada lib nova.

**Responsável:** Claude Code
**Prioridade:** P1
**Fluxo:** DevSecOps

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'devsecops,P1,claude-code' --milestone 'DevSecOps'
mk open --title 'SEC-12 · Travar a config do `expo-audio` em teste' \
  --body '`microphonePermission: false`, `recordAudioAndroid: false` — está certo hoje.

**Responsável:** Claude Code
**Prioridade:** P1
**Fluxo:** DevSecOps

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'devsecops,P1,claude-code' --milestone 'DevSecOps'
mk open --title 'SEC-13 · Confirmar que não há segredo em `app.json`/`eas.json`' \
  --body 'O `projectId` é público; conferir o resto.

**Responsável:** Claude Code
**Prioridade:** P0
**Fluxo:** DevSecOps

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'devsecops,P0,claude-code' --milestone 'DevSecOps'
mk open --title 'SEC-14 · Escrever o `SECURITY.md`' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code
**Prioridade:** P2
**Fluxo:** DevSecOps

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'devsecops,P2,claude-code' --milestone 'DevSecOps'
mk open --title 'SEC-15 · Rodar `/security-review` antes do release' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code
**Prioridade:** P0
**Fluxo:** DevSecOps

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'devsecops,P0,claude-code' --milestone 'DevSecOps'
mk open --title 'SEC-16 · Proteger o keystore Android' \
  --body 'O `.gitignore` já barra `*.jks`/`*.p12`/`*.key`. Guardar no EAS credentials, nunca no repo.

**Responsável:** Você
**Prioridade:** P0
**Fluxo:** DevSecOps

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'devsecops,P0,humano' --milestone 'DevSecOps'
mk open --title 'SEC-17 · Revisar os dados coletados (LGPD)' \
  --body 'Hoje é tudo AsyncStorage local. Se entrar analytics, a política muda.

**Responsável:** Você
**Prioridade:** P1
**Fluxo:** DevSecOps

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'devsecops,P1,humano' --milestone 'DevSecOps'

# --- Qualidade ---
mk open --title 'Q-01 · Montar E2E com Maestro' \
  --body 'YAML, fora do build, roda em CI. Melhor custo/benefício que Detox aqui.

**Responsável:** Claude Code
**Prioridade:** P1
**Fluxo:** Qualidade

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'qualidade,P1,claude-code' --milestone 'Qualidade'
mk open --title 'Q-02 · Fluxo E2E: abrir, escolher fase, jogar e vencer' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code
**Prioridade:** P1
**Fluxo:** Qualidade

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'qualidade,P1,claude-code' --milestone 'Qualidade'
mk open --title 'Q-03 · Fluxo E2E: comprar na loja' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code
**Prioridade:** P2
**Fluxo:** Qualidade

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'qualidade,P2,claude-code' --milestone 'Qualidade'
mk open --title 'Q-04 · Fluxo E2E: perder vida e esperar a recarga' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code
**Prioridade:** P2
**Fluxo:** Qualidade

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'qualidade,P2,claude-code' --milestone 'Qualidade'
mk open --title 'Q-05 · Rodar o Maestro no CI' \
  --body 'Emulador Android em GitHub Actions.

**Responsável:** Claude Code
**Prioridade:** P2
**Fluxo:** Qualidade

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'qualidade,P2,claude-code' --milestone 'Qualidade'
mk open --title 'Q-06 · Teste de acessibilidade' \
  --body 'Labels e alvo de toque ≥ 44 px. O `minimumTouchSize: 44` já existe no config de mapa, mas ninguém testa.

**Responsável:** Claude Code
**Prioridade:** P1
**Fluxo:** Qualidade

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'qualidade,P1,claude-code' --milestone 'Qualidade'
mk open --title 'Q-07 · Quebrar `GameScreen.tsx`' \
  --body '3166 linhas. O `CLAUDE.md` já avisa para não deixar crescer.

**Responsável:** Claude Code
**Prioridade:** P1
**Fluxo:** Qualidade

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'qualidade,P1,claude-code' --milestone 'Qualidade'
mk open --title 'Q-08 · Quebrar `LevelSelectScreen.tsx`' \
  --body '1879 linhas.

**Responsável:** Claude Code
**Prioridade:** P2
**Fluxo:** Qualidade

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'qualidade,P2,claude-code' --milestone 'Qualidade'
mk open --title 'Q-09 · Quebrar `App.tsx`' \
  --body '1169 linhas.

**Responsável:** Claude Code
**Prioridade:** P2
**Fluxo:** Qualidade

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'qualidade,P2,claude-code' --milestone 'Qualidade'
mk open --title 'Q-10 · Orçamento de tamanho de bundle no CI' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code
**Prioridade:** P2
**Fluxo:** Qualidade

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'qualidade,P2,claude-code' --milestone 'Qualidade'
mk open --title 'Q-11 · Perfilar performance em aparelho de entrada' \
  --body 'Depois da arte nova — 20 PNGs mudam o consumo de memória.

**Responsável:** Você
**Prioridade:** P1
**Fluxo:** Qualidade

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'qualidade,P1,humano' --milestone 'Qualidade'
mk open --title 'Q-12 · Escrever o ADR da mudança 203 → 100' \
  --body '`docs/adr/0004-*.md`. Os três ADRs existentes documentam decisões desse porte.

**Responsável:** Claude Code
**Prioridade:** P1
**Fluxo:** Qualidade

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'qualidade,P1,claude-code' --milestone 'Qualidade'
mk open --title 'Q-13 · Resolver o gap do Modo Dev' \
  --body 'Hoje escreve direto no save real e não é reversível — só “Resetar progresso” limpa.

**Responsável:** Claude Code
**Prioridade:** P2
**Fluxo:** Qualidade

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'qualidade,P2,claude-code' --milestone 'Qualidade'
mk open --title 'Q-14 · Atualizar o `CONTEXT.md` com o vocabulário dos 10 mundos' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code
**Prioridade:** P1
**Fluxo:** Qualidade

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'qualidade,P1,claude-code' --milestone 'Qualidade'

# --- Release ---
mk open --title 'R-01 · Criar ou confirmar a conta Google Play Console' \
  --body 'US$ 25, uma vez.

**Responsável:** Você
**Prioridade:** P0
**Fluxo:** Release

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'release,P0,humano' --milestone 'Release'
mk open --title 'R-02 · Definir o nome final do app' \
  --body 'Ver L-14 — hoje há três nomes divergentes.

**Responsável:** Você
**Prioridade:** P0
**Fluxo:** Release

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'release,P0,humano' --milestone 'Release'
mk open --title 'R-03 · Gerar e guardar o keystore de produção' \
  --body 'Via EAS credentials.

**Responsável:** Você
**Prioridade:** P0
**Fluxo:** Release

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'release,P0,humano' --milestone 'Release'
mk open --title 'R-04 · Escrever a ficha da loja' \
  --body 'Título, descrição curta e longa, com o enquadramento ODS 12.

**Responsável:** undefined
**Prioridade:** P0
**Fluxo:** Release

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'release,P0,' --milestone 'Release'
mk open --title 'R-05 · Capturar 8 screenshots de telefone' \
  --body 'Mínimo 2, ideal 8.

**Responsável:** Você
**Prioridade:** P0
**Fluxo:** Release

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'release,P0,humano' --milestone 'Release'
mk open --title 'R-06 · Feature graphic 1024×500' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** undefined
**Prioridade:** P0
**Fluxo:** Release

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'release,P0,' --milestone 'Release'
mk open --title 'R-07 · Ícone da loja 512×512' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** undefined
**Prioridade:** P0
**Fluxo:** Release

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'release,P0,' --milestone 'Release'
mk open --title 'R-08 · Vídeo de preview' \
  --body 'Opcional.

**Responsável:** Você
**Prioridade:** P2
**Fluxo:** Release

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'release,P2,humano' --milestone 'Release'
mk open --title 'R-09 · Hospedar a política de privacidade' \
  --body 'Obrigatória. Como o jogo é offline, é curta.

**Responsável:** undefined
**Prioridade:** P0
**Fluxo:** Release

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'release,P0,' --milestone 'Release'
mk open --title 'R-10 · Responder o questionário de classificação etária' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Você
**Prioridade:** P0
**Fluxo:** Release

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'release,P0,humano' --milestone 'Release'
mk open --title 'R-11 · Preencher o Data safety form' \
  --body 'Declarar que não coleta dados.

**Responsável:** Você
**Prioridade:** P0
**Fluxo:** Release

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'release,P0,humano' --milestone 'Release'
mk open --title 'R-12 · Declarar o público-alvo' \
  --body 'Jogo educativo atrai criança — abaixo de 13 anos entram as regras de Famílias.

**Responsável:** Você
**Prioridade:** P0
**Fluxo:** Release

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'release,P0,humano' --milestone 'Release'
mk open --title 'R-13 · Rodar teste interno' \
  --body 'Até 100 testadores.

**Responsável:** Você
**Prioridade:** P1
**Fluxo:** Release

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'release,P1,humano' --milestone 'Release'
mk open --title 'R-14 · Rodar teste fechado e coletar feedback' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Você
**Prioridade:** P1
**Fluxo:** Release

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'release,P1,humano' --milestone 'Release'
mk open --title 'R-15 · Jogar as 100 fases manualmente' \
  --body 'O `test:playthrough` simula, mas não substitui jogar.

**Responsável:** Você
**Prioridade:** P0
**Fluxo:** Release

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'release,P0,humano' --milestone 'Release'
mk open --title 'R-16 · Rodar `/security-review`' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code
**Prioridade:** P0
**Fluxo:** Release

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'release,P0,claude-code' --milestone 'Release'
mk open --title 'R-17 · Marcar a tag `v1.0.0` e publicar o release' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code
**Prioridade:** P0
**Fluxo:** Release

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'release,P0,claude-code' --milestone 'Release'
mk open --title 'R-18 · Publicar em produção' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Você
**Prioridade:** P0
**Fluxo:** Release

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'release,P0,humano' --milestone 'Release'

echo "== pronto: 196 issues (15 já criadas fechadas) =="
