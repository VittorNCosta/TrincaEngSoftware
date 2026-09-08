#!/usr/bin/env bash
# NÃO EDITE À MÃO. Gerado por scripts/gerar-issues-roadmap.js a partir de
# docs/roadmap/roadmap.html — TrincaMania ODS 12
# Requer: gh instalado e autenticado (gh auth login)
# Idempotência: rodar duas vezes cria issues duplicadas. Rode uma vez só.
# Para reconciliar um backlog que já existe, use scripts/sincronizar-issues.js.
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
gh label create 'modelo-opus' --repo "$REPO" --color 5A32A3 --force >/dev/null
gh label create 'modelo-sonnet' --repo "$REPO" --color 1B7FBD --force >/dev/null
gh label create 'modelo-fable' --repo "$REPO" --color C2410C --force >/dev/null
gh label create 'modelo-haiku' --repo "$REPO" --color 6B7280 --force >/dev/null

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
  --body '**Feito 03/09:** binário v2.99.0 baixado do release oficial para `~/.local/bin/gh`, sem sudo — o diretório já está no PATH via `.zshrc:105`. Autenticado em 04/09 (`gh auth login` por device code, conta `VittorNCosta`) — o backlog do GitHub passou a ser sincronizável daqui.

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
mk done --title 'F0-03 · Fixar a versão de Node do projeto' \
  --body '**Feito 03/09**, em duas etapas. O commit `c8311ab` pôs `.nvmrc` em `20` e `engines: node >=20.19.0` — e foi o `engines` que revelou o CI-06: se a versão mínima é a 20, o `npm test` tinha de funcionar da 20 em diante, e não funcionava da 22. Depois o piso subiu para `>=20.19.4 <21` (e o `.nvmrc` para `20.19.4`): `npm ci` acusou `EBADENGINE` porque `react-native@0.81.5` exige `>=20.19.4` e a máquina local tinha `v20.19.1`. Quem rodar local precisa de `nvm install` na versão do `.nvmrc`.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P1
**Fluxo:** Fundação

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'fundacao,P1,claude-code,modelo-sonnet' --milestone 'Fundação'
mk done --title 'F0-04 · Resolver o `package.json` pendente' \
  --body '**Feito 03/09** (commit `c1e3b65`). Não era decisão em aberto e sim bug: o `package-lock.json` commitado já trazia ~54.0.37 / ~54.0.18 / ^29.5.14, então HEAD tinha manifest e lock discordando — `npm ci`, que é o que o CI roda, falharia.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Opus 5
**Prioridade:** P0
**Fluxo:** Fundação

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'fundacao,P0,claude-code,modelo-opus' --milestone 'Fundação'
mk done --title 'F0-05 · Rodar `npx expo-doctor` e registrar o baseline' \
  --body '**Feito 03/09:** 17/17 checks passaram depois de restaurar um `package-lock.json` não commitado que tinha regredido (`@types/jest` voltou a `^30.0.0`, `expo` a `~54.0.34`, `jest-expo` a `~54.0.17` — mesma classe de bug do F0-04) e rodar `npm ci` limpo. `typecheck` e os 121 testes de `tests/` continuam verdes.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P1
**Fluxo:** Fundação

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'fundacao,P1,claude-code,modelo-sonnet' --milestone 'Fundação'
mk done --title 'F0-06 · Criar a branch `feat/campanha-10x10`' \
  --body '**Feito 03/09.** Toda a reescrita de conteúdo saiu nela. Em 04/09 a linha paralela de CI/build foi incorporada por merge (`ed35d11`) e a branch `feat/renomeia-capitulos-9-10` foi apagada — sobrou uma linha só.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Opus 5
**Prioridade:** P0
**Fluxo:** Fundação

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'fundacao,P0,claude-code,modelo-opus' --milestone 'Fundação'

# --- Conteúdo 10×10 ---
mk done --title 'C-01 · Confirmar os nomes dos Mundos 9 e 10' \
  --body '**Decidido 03/09, revisto 04/09.** A campanha fica com **Distrito da Reindustrialização** (Mundo 9) e **Cúpula da Reciclagem Global** (Mundo 10) — os nomes que o código recebeu em `2295575`. A primeira decisão tinha sido Oficina do Reparo e Cidade Circular, e foi por ela que os capítulos 9 e 10 viraram **Ferro-Velho Renascido** e **Metrópole do Ciclo Fechado** (`9bd1059`); os capítulos ficam com os nomes novos, que já estão no jogo e não colidem com nada. Ver C-01a.

**Responsável:** Você
**Prioridade:** P0
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P0,humano' --milestone 'Conteúdo 10×10'
mk done --title 'C-01a · Reconciliar os nomes dos Mundos 9 e 10 com a decisão de C-01' \
  --body '**Resolvido 04/09: valem os nomes do código.** Achado: C-01 decidiu **Oficina do Reparo** e **Cidade Circular**, e `9bd1059` renomeou os capítulos 9 e 10 justamente para liberar esses nomes — mas `2295575` criou os mundos como **Distrito da Reindustrialização** e **Cúpula da Reciclagem Global**. Os nomes liberados nunca foram usados. Decidir entre: renomear os mundos (mexe em 5 títulos de fase e 4 objetivos que citam “Distrito”/“Cúpula”, e obriga a recalcular o hash de C-19), ou aceitar os nomes atuais. **Escolhido aceitar**: os títulos de fase do Mundo 9 já são de reindustrialização (Pátio das Prensas, Forno de Refundição, Torre de Extrusão) e casariam mal com “oficina de reparo”, e mexer nos títulos obrigaria a recalcular o hash congelado sem ganho de conteúdo. Corrigidos no lugar: C-01, A-21 a A-24, S-09, S-10, os prompts de arte dos dois mundos e o comentário de `chapters.ts`. Nenhuma linha de `src/data/worlds.ts` mudou.

**Responsável:** Claude Code + Você
**Modelo recomendado:** Claude Fable 5.1
**Prioridade:** P0
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P0,claude-code,humano,modelo-fable' --milestone 'Conteúdo 10×10'
mk done --title 'C-02 · Redesenhar a curva de dificuldade para 100 fases' \
  --body '**Feito 03/09.** `WORLD_LEVELS_PER_MAP` 25→10 e `WORLD_DIFFICULTY_BLOCK_SIZE` 5→2. A rampa de 9 a 60 peças agora cabe em 10 fases por mundo, com `tileCount` múltiplo de 3 travado em teste.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Fable 5.1
**Prioridade:** P0
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P0,claude-code,modelo-fable' --milestone 'Conteúdo 10×10'
mk done --title 'C-03 · Redefinir os marcos de descanso, loja e guardião' \
  --body '**Feito 03/09.** Descanso na fase 5 e guardião na 10 nos dez mundos; `REST_CHECKPOINT_COIN_REWARDS` reajustado para o novo ritmo.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Fable 5.1
**Prioridade:** P0
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P0,claude-code,modelo-fable' --milestone 'Conteúdo 10×10'
mk done --title 'C-04 · Escrever os 100 títulos de fase' \
  --body '**Feito 03/09.** 103 títulos únicos (100 canônicas + 3 bônus), no vocabulário de `CONTEXT.md`.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Fable 5.1
**Prioridade:** P0
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P0,claude-code,modelo-fable' --milestone 'Conteúdo 10×10'
mk done --title 'C-05 · Escrever os 100 textos de objetivo' \
  --body '**Feito 03/09.** 103/103 com `objectiveText` preenchido.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Fable 5.1
**Prioridade:** P0
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P0,claude-code,modelo-fable' --milestone 'Conteúdo 10×10'
mk done --title 'C-06 · Derivar os `starTimeLimits` das 100 fases' \
  --body '**Feito 03/09.** Derivados da curva por `WORLD_STAR_TIME_BASE_OFFSET` e `WORLD_STAR_TIME_SPAN`, não à mão.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Fable 5.1
**Prioridade:** P1
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P1,claude-code,modelo-fable' --milestone 'Conteúdo 10×10'
mk done --title 'C-07 · Definir `recommendedPower` e `mysteryTileCount` por fase' \
  --body '**Feito 03/09.** Os 103 níveis têm `recommendedPower`; o mistério respeita o teto de 1/6 do tabuleiro.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Fable 5.1
**Prioridade:** P1
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P1,claude-code,modelo-fable' --milestone 'Conteúdo 10×10'
mk done --title 'C-08 · Decidir o destino do mundo bônus (id 21)' \
  --body '**Decidido 03/09:** fica como 11º mapa secreto — que já é o comportamento atual (`subtitle: '\''Mundo secreto'\''`). Não muda código hoje, mas cria C-08a e C-08b na reescrita.

**Responsável:** Você
**Prioridade:** P1
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P1,humano' --milestone 'Conteúdo 10×10'
mk done --title 'C-08a · Reposicionar o bônus de `25.1–25.3` para `10.1–10.3`' \
  --body '**Feito 03/09.** `levelStart: 10.1` em `src/data/worlds.ts`, acompanhando o Mundo 1 de 10 fases.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Fable 5.1
**Prioridade:** P0
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P0,claude-code,modelo-fable' --milestone 'Conteúdo 10×10'
mk done --title 'C-08b · Trocar o `theme: '\''sweet'\''` do bônus' \
  --body '**Feito 08/09,** junto com L-02: bônus agora é `theme: '\''rosado'\''`. **Em aberto:** a reavaliação de `unlockRule: '\''three-stars-world-1'\''` (fica mais fácil com o Mundo 1 em 10 fases) é decisão de balanceamento, não renomeação — não mexida aqui.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Fable 5.1
**Prioridade:** P1
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P1,claude-code,modelo-fable' --milestone 'Conteúdo 10×10'
mk done --title 'C-09 · Estender `CampaignWorldId` para 9 e 10' \
  --body '**Feito 03/09.** `src/types/game.ts`.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Fable 5.1
**Prioridade:** P0
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P0,claude-code,modelo-fable' --milestone 'Conteúdo 10×10'
mk done --title 'C-10 · Reescrever `WORLDS` com 10 mundos' \
  --body '**Feito 03/09.** Dez mundos, `levelStart`/`levelEnd` de 1-10, 11-20 … 91-100. **Ressalva:** os nomes dos Mundos 9 e 10 saíram diferentes do que C-01 decidiu — ver C-01a.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Fable 5.1
**Prioridade:** P0
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P0,claude-code,modelo-fable' --milestone 'Conteúdo 10×10'
mk done --title 'C-11 · Reescrever `LEVEL_SEEDS`' \
  --body '**Feito 03/09.** Os 10 mundos passaram a ser gerados pelo mesmo mecanismo — manter 3 mundos autorais à mão para 10 fases cada não pagava a manutenção. É a opção “mais sustentável” do enunciado.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Fable 5.1
**Prioridade:** P0
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P0,claude-code,modelo-fable' --milestone 'Conteúdo 10×10'
mk done --title 'C-12 · Ajustar `GENERATED_WORLD_CONFIGS` de 25 para 10 títulos' \
  --body '**Feito 03/09.** Dez entradas, uma por mundo.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Fable 5.1
**Prioridade:** P0
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P0,claude-code,modelo-fable' --milestone 'Conteúdo 10×10'
mk done --title 'C-13 · Registrar os mundos 9 e 10 em `WORLD_MAP_CONFIGS`' \
  --body '**Feito 03/09.** O `Record` total voltou a fechar no `tsc`.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Fable 5.1
**Prioridade:** P0
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P0,claude-code,modelo-fable' --milestone 'Conteúdo 10×10'
mk done --title 'C-14 · Reduzir o mapa do Mundo 1 de 25 para 10 âncoras' \
  --body '**Feito 03/09.** `src/data/worldMapConfigs.ts`.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Fable 5.1
**Prioridade:** P0
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P0,claude-code,modelo-fable' --milestone 'Conteúdo 10×10'
mk done --title 'C-15 · Renomear `BOSQUE_*` para vocabulário ODS12' \
  --body '**Feito 04/09.** Eram 107 ocorrências, não 15: `BOSQUE_*` virou `PARQUE_*` e os ids de layout `bosque-*` viraram `parque-*`, seguindo o nome atual do Mundo 1 (**Parque da Coleta Seletiva**). `assetKey`/`visualKey` `forest-*` ficaram de fora de propósito — apontam para PNG real, isso é L-09.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Fable 5.1
**Prioridade:** P1
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P1,claude-code,modelo-fable' --milestone 'Conteúdo 10×10'
mk done --title 'C-16 · Atualizar o comentário das 203 em `boardPositions.ts`' \
  --body '**Feito 03/09.** Linhas 16 e 39 passaram a falar em 100 fases canônicas. As sobras em `src/types/game.ts` e `src/data/chapters.ts` caíram em 04/09.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Fable 5.1
**Prioridade:** P1
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P1,claude-code,modelo-fable' --milestone 'Conteúdo 10×10'
mk done --title 'C-17 · Mapear `AMBIENT_BY_WORLD_ID` para os 10 mundos' \
  --body '**Feito 03/09.** Mundo 9 reaproveita `volcano` e o 10, `celestial` — nenhum mundo toca em silêncio. Travado por `tests/worldAmbientAndBackgroundCoverage.test.cjs`.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Fable 5.1
**Prioridade:** P0
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P0,claude-code,modelo-fable' --milestone 'Conteúdo 10×10'
mk done --title 'C-18 · Cobrir os mundos 9 e 10 em `getGameBackground`' \
  --body '**Feito 03/09.** Mundo 9 cai no fundo do 2 e o 10 no do 3, em vez de cair no default do Mundo 1.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Fable 5.1
**Prioridade:** P0
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P0,claude-code,modelo-fable' --milestone 'Conteúdo 10×10'
mk done --title 'C-19 · Recalcular o hash sha256 das fases' \
  --body '**Feito 03/09.** Asserção mantida e literal recalculado sobre as 103 fases novas — a trava de integridade continua de pé.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Fable 5.1
**Prioridade:** P0
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P0,claude-code,modelo-fable' --milestone 'Conteúdo 10×10'
mk done --title 'C-20 · Atualizar `tests/chapterProgress.test.cjs:80`' \
  --body '**Feito 03/09.**

**Responsável:** Claude Code
**Modelo recomendado:** Claude Fable 5.1
**Prioridade:** P0
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P0,claude-code,modelo-fable' --milestone 'Conteúdo 10×10'
mk done --title 'C-21 · Atualizar `tests/worldMapConfig.test.cjs:57-73`' \
  --body '**Feito 03/09.** As três asserções sobre 203 passaram a valer sobre 103.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Fable 5.1
**Prioridade:** P0
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P0,claude-code,modelo-fable' --milestone 'Conteúdo 10×10'
mk done --title 'C-22 · Atualizar `tests/chapters.test.cjs:434-436`' \
  --body '**Feito 03/09.**

**Responsável:** Claude Code
**Modelo recomendado:** Claude Fable 5.1
**Prioridade:** P0
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P0,claude-code,modelo-fable' --milestone 'Conteúdo 10×10'
mk done --title 'C-23 · Atualizar `tests/simulateFullPlaythrough.cjs:44,210`' \
  --body '**Feito 03/09.** A simulação roda as 103 fases e sai 0 — toda fase continua vencível.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Fable 5.1
**Prioridade:** P0
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P0,claude-code,modelo-fable' --milestone 'Conteúdo 10×10'
mk done --title 'C-24 · Revisar `boardLayout` e `campaignMapLayout`' \
  --body '**Feito 03/09.**

**Responsável:** Claude Code
**Modelo recomendado:** Claude Fable 5.1
**Prioridade:** P0
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P0,claude-code,modelo-fable' --milestone 'Conteúdo 10×10'
mk done --title 'C-25 · Escrever a migração de save 203→100' \
  --body '**Feito 03/09.** Não precisou mapear nem resetar: como os ids `wN-001`…`wN-010` são idênticos nos dois esquemas, o save antigo continua valendo e só somem as posições 11–25. `detectDroppedCampaignProgress` + `CampaignResizeNoticeModal` avisam o jogador uma única vez. Moedas, chaves e itens nunca são filtrados.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Fable 5.1
**Prioridade:** P0
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P0,claude-code,modelo-fable' --milestone 'Conteúdo 10×10'
mk done --title 'C-26 · Testar a migração de save' \
  --body '**Feito 03/09.** `tests/progressMigration.test.cjs`, 6 casos — incluindo o save de quem zerou os 8 mundos antigos.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Fable 5.1
**Prioridade:** P0
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P0,claude-code,modelo-fable' --milestone 'Conteúdo 10×10'
mk done --title 'C-27 · Travar em teste a cobertura de fundo e ambiente por mundo' \
  --body '**Feito 03/09.** `tests/worldAmbientAndBackgroundCoverage.test.cjs`.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Fable 5.1
**Prioridade:** P1
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P1,claude-code,modelo-fable' --milestone 'Conteúdo 10×10'
mk done --title 'C-28 · Atualizar o texto do Modo Dev' \
  --body '**Feito 03/09.** `SettingsModal` cita 103 fases.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Fable 5.1
**Prioridade:** P2
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P2,claude-code,modelo-fable' --milestone 'Conteúdo 10×10'
mk done --title 'C-29 · Reescrever o invariante #4 do `CLAUDE.md`' \
  --body '**Feito 03/09.** O invariante passou a citar 103 e a dizer explicitamente que o número muda se a campanha for reestruturada de novo — o mecanismo de trava, não.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Fable 5.1
**Prioridade:** P0
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P0,claude-code,modelo-fable' --milestone 'Conteúdo 10×10'
mk open --title 'C-30 · Decidir e implementar o destino dos Capítulos' \
  --body 'Esconder do menu, manter como modo infinito pós-jogo, ou remover. Hoje `ChaptersScreen` é acessível.

**Responsável:** Claude Code + Você
**Modelo recomendado:** Claude Fable 5.1
**Prioridade:** P1
**Fluxo:** Conteúdo 10×10

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'conteudo,P1,claude-code,humano,modelo-fable' --milestone 'Conteúdo 10×10'

# --- Arte ---
mk open --title 'A-01 · Escrever o art bible' \
  --body 'Paleta CONAMA, estilo, do/don'\''t ODS12.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Opus 5
**Prioridade:** P0
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P0,claude-code,modelo-opus' --milestone 'Arte'
mk open --title 'A-02 · Criar `assets/map/worlds/` e a convenção de nome' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code
**Modelo recomendado:** Claude Opus 5
**Prioridade:** P0
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P0,claude-code,modelo-opus' --milestone 'Arte'
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

**Responsável:** Claude Code + Você
**Modelo recomendado:** Claude Opus 5
**Prioridade:** P0
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P0,claude-code,humano,modelo-opus' --milestone 'Arte'
mk open --title 'A-06 · Mundo 1 · Parque da Coleta Seletiva — fundo de jogo' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code + Você
**Modelo recomendado:** Claude Opus 5
**Prioridade:** P0
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P0,claude-code,humano,modelo-opus' --milestone 'Arte'
mk open --title 'A-07 · Mundo 2 · Vale da Reciclagem — fundo de mapa' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code + Você
**Modelo recomendado:** Claude Opus 5
**Prioridade:** P0
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P0,claude-code,humano,modelo-opus' --milestone 'Arte'
mk open --title 'A-08 · Mundo 2 · Vale da Reciclagem — fundo de jogo' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code + Você
**Modelo recomendado:** Claude Opus 5
**Prioridade:** P0
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P0,claude-code,humano,modelo-opus' --milestone 'Arte'
mk open --title 'A-09 · Mundo 3 · Central de Materiais — fundo de mapa' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code + Você
**Modelo recomendado:** Claude Opus 5
**Prioridade:** P0
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P0,claude-code,humano,modelo-opus' --milestone 'Arte'
mk open --title 'A-10 · Mundo 3 · Central de Materiais — fundo de jogo' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code + Você
**Modelo recomendado:** Claude Opus 5
**Prioridade:** P0
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P0,claude-code,humano,modelo-opus' --milestone 'Arte'
mk open --title 'A-11 · Mundo 4 · Viveiro Comunitário — fundo de mapa' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code + Você
**Modelo recomendado:** Claude Opus 5
**Prioridade:** P0
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P0,claude-code,humano,modelo-opus' --milestone 'Arte'
mk open --title 'A-12 · Mundo 4 · Viveiro Comunitário — fundo de jogo' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code + Você
**Modelo recomendado:** Claude Opus 5
**Prioridade:** P0
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P0,claude-code,humano,modelo-opus' --milestone 'Arte'
mk open --title 'A-13 · Mundo 5 · Usina de Compostagem — fundo de mapa' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code + Você
**Modelo recomendado:** Claude Opus 5
**Prioridade:** P0
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P0,claude-code,humano,modelo-opus' --milestone 'Arte'
mk open --title 'A-14 · Mundo 5 · Usina de Compostagem — fundo de jogo' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code + Você
**Modelo recomendado:** Claude Opus 5
**Prioridade:** P0
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P0,claude-code,humano,modelo-opus' --milestone 'Arte'
mk open --title 'A-15 · Mundo 6 · Cooperativa dos Catadores — fundo de mapa' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code + Você
**Modelo recomendado:** Claude Opus 5
**Prioridade:** P0
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P0,claude-code,humano,modelo-opus' --milestone 'Arte'
mk open --title 'A-16 · Mundo 6 · Cooperativa dos Catadores — fundo de jogo' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code + Você
**Modelo recomendado:** Claude Opus 5
**Prioridade:** P0
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P0,claude-code,humano,modelo-opus' --milestone 'Arte'
mk open --title 'A-17 · Mundo 7 · Rota da Logística Reversa — fundo de mapa' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code + Você
**Modelo recomendado:** Claude Opus 5
**Prioridade:** P0
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P0,claude-code,humano,modelo-opus' --milestone 'Arte'
mk open --title 'A-18 · Mundo 7 · Rota da Logística Reversa — fundo de jogo' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code + Você
**Modelo recomendado:** Claude Opus 5
**Prioridade:** P0
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P0,claude-code,humano,modelo-opus' --milestone 'Arte'
mk open --title 'A-19 · Mundo 8 · Fórum da Economia Circular — fundo de mapa' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code + Você
**Modelo recomendado:** Claude Opus 5
**Prioridade:** P0
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P0,claude-code,humano,modelo-opus' --milestone 'Arte'
mk open --title 'A-20 · Mundo 8 · Fórum da Economia Circular — fundo de jogo' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code + Você
**Modelo recomendado:** Claude Opus 5
**Prioridade:** P0
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P0,claude-code,humano,modelo-opus' --milestone 'Arte'
mk open --title 'A-21 · Mundo 9 · Distrito da Reindustrialização — fundo de mapa' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code + Você
**Modelo recomendado:** Claude Opus 5
**Prioridade:** P0
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P0,claude-code,humano,modelo-opus' --milestone 'Arte'
mk open --title 'A-22 · Mundo 9 · Distrito da Reindustrialização — fundo de jogo' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code + Você
**Modelo recomendado:** Claude Opus 5
**Prioridade:** P0
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P0,claude-code,humano,modelo-opus' --milestone 'Arte'
mk open --title 'A-23 · Mundo 10 · Cúpula da Reciclagem Global — fundo de mapa' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code + Você
**Modelo recomendado:** Claude Opus 5
**Prioridade:** P0
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P0,claude-code,humano,modelo-opus' --milestone 'Arte'
mk open --title 'A-24 · Mundo 10 · Cúpula da Reciclagem Global — fundo de jogo' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code + Você
**Modelo recomendado:** Claude Opus 5
**Prioridade:** P0
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P0,claude-code,humano,modelo-opus' --milestone 'Arte'
mk open --title 'A-25 · Ícone do app 1024×1024' \
  --body 'Hoje 1254×1254, fora do padrão Expo. Símbolo de reciclagem + trinca, sem texto.

**Responsável:** Claude Code + Você
**Modelo recomendado:** Claude Opus 5
**Prioridade:** P0
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P0,claude-code,humano,modelo-opus' --milestone 'Arte'
mk open --title 'A-26 · Adaptive icon Android 1024×1024' \
  --body 'Elemento dentro do círculo de 66%. O `backgroundColor` hoje é `#4B148C` — roxo, fora da paleta CONAMA.

**Responsável:** Claude Code + Você
**Modelo recomendado:** Claude Opus 5
**Prioridade:** P0
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P0,claude-code,humano,modelo-opus' --milestone 'Arte'
mk open --title 'A-27 · Splash screen' \
  --body '`SplashIntroScreen.tsx` tem 537 linhas — conferir o que já é desenhado em código.

**Responsável:** Claude Code + Você
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P1
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P1,claude-code,humano,modelo-sonnet' --milestone 'Arte'
mk open --title 'A-28 · Selo de marco “Descanso” 320×320' \
  --body 'Substitui `forest_rest_cart.png`, que é carrinho de floresta do tema antigo. Proposta: carrinho de catador.

**Responsável:** Claude Code + Você
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P1
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P1,claude-code,humano,modelo-sonnet' --milestone 'Arte'
mk open --title 'A-29 · Selo de marco “Loja” 320×320' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code + Você
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P1
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P1,claude-code,humano,modelo-sonnet' --milestone 'Arte'
mk open --title 'A-30 · Selo de marco “Guardião” 320×320' \
  --body 'Não existe hoje.

**Responsável:** Claude Code + Você
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P1
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P1,claude-code,humano,modelo-sonnet' --milestone 'Arte'
mk open --title 'A-31 · Marcador de portal entre mundos 320×320' \
  --body 'Hoje é `forest-portal-rune` — runa é fantasia. Proposta: seta de ciclo.

**Responsável:** Claude Code + Você
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P1
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P1,claude-code,humano,modelo-sonnet' --milestone 'Arte'
mk open --title 'A-32 · Nós de fase: bloqueado, atual, completo' \
  --body 'Avaliar se vira SVG em código, como as peças já são.

**Responsável:** Claude Code + Você
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P2
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P2,claude-code,humano,modelo-sonnet' --milestone 'Arte'
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
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P1
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P1,claude-code,modelo-sonnet' --milestone 'Arte'
mk open --title 'A-35 · Remover os 6 arquivos `.png.png`' \
  --body '`map_bonus_bg.png.png`, `map_shop.png.png`, os três `map_path_pieces_*` e `map_world2_bg.png.png`.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P1
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P1,claude-code,modelo-sonnet' --milestone 'Arte'
mk open --title 'A-36 · Integrar cada asset entregue no código' \
  --body '`campaignMapAssets.ts` e `getGameBackground`.

**Responsável:** Claude Code + Você
**Modelo recomendado:** Claude Opus 5
**Prioridade:** P0
**Fluxo:** Arte

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'arte,P0,claude-code,humano,modelo-opus' --milestone 'Arte'

# --- Som ---
mk open --title 'S-01 · `ambient_parque.mp3` — Mundo 1' \
  --body 'Pássaros distantes, folhas, passos ocasionais.

**Responsável:** Claude Code + Você
**Modelo recomendado:** Claude Opus 5
**Prioridade:** P0
**Fluxo:** Som

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'som,P0,claude-code,humano,modelo-opus' --milestone 'Som'
mk open --title 'S-02 · `ambient_vale.mp3` — Mundo 2' \
  --body 'Esteira ao longe, vento de vale, maquinário abafado.

**Responsável:** Claude Code + Você
**Modelo recomendado:** Claude Opus 5
**Prioridade:** P0
**Fluxo:** Som

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'som,P0,claude-code,humano,modelo-opus' --milestone 'Som'
mk open --title 'S-03 · `ambient_central.mp3` — Mundo 3' \
  --body 'Galpão amplo com eco, prensa distante, ventilação.

**Responsável:** Claude Code + Você
**Modelo recomendado:** Claude Opus 5
**Prioridade:** P0
**Fluxo:** Som

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'som,P0,claude-code,humano,modelo-opus' --milestone 'Som'
mk open --title 'S-04 · `ambient_viveiro.mp3` — Mundo 4' \
  --body 'Regador, insetos, lona ao vento.

**Responsável:** Claude Code + Você
**Modelo recomendado:** Claude Opus 5
**Prioridade:** P0
**Fluxo:** Som

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'som,P0,claude-code,humano,modelo-opus' --milestone 'Som'
mk open --title 'S-05 · `ambient_usina.mp3` — Mundo 5' \
  --body 'Zumbido grave de biodigestor, vapor, pá revolvendo.

**Responsável:** Claude Code + Você
**Modelo recomendado:** Claude Opus 5
**Prioridade:** P0
**Fluxo:** Som

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'som,P0,claude-code,humano,modelo-opus' --milestone 'Som'
mk open --title 'S-06 · `ambient_cooperativa.mp3` — Mundo 6' \
  --body 'Carrinho de metal, fardos, vozes distantes indistintas.

**Responsável:** Claude Code + Você
**Modelo recomendado:** Claude Opus 5
**Prioridade:** P0
**Fluxo:** Som

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'som,P0,claude-code,humano,modelo-opus' --milestone 'Som'
mk open --title 'S-07 · `ambient_rota.mp3` — Mundo 7' \
  --body 'Rodovia distante, caminhão manobrando, engradado.

**Responsável:** Claude Code + Você
**Modelo recomendado:** Claude Opus 5
**Prioridade:** P0
**Fluxo:** Som

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'som,P0,claude-code,humano,modelo-opus' --milestone 'Som'
mk open --title 'S-08 · `ambient_forum.mp3` — Mundo 8' \
  --body 'Praça aberta, murmúrio cívico, bandeira ao vento.

**Responsável:** Claude Code + Você
**Modelo recomendado:** Claude Opus 5
**Prioridade:** P0
**Fluxo:** Som

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'som,P0,claude-code,humano,modelo-opus' --milestone 'Som'
mk open --title 'S-09 · `ambient_distrito.mp3` — Mundo 9' \
  --body 'Prensa hidráulica ao longe, esteira rolante, zumbido grave de forno.

**Responsável:** Claude Code + Você
**Modelo recomendado:** Claude Opus 5
**Prioridade:** P0
**Fluxo:** Som

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'som,P0,claude-code,humano,modelo-opus' --milestone 'Som'
mk open --title 'S-10 · `ambient_cupula.mp3` — Mundo 10' \
  --body 'Murmúrio de plenário, papel manuseado, passos em saguão amplo.

**Responsável:** Claude Code + Você
**Modelo recomendado:** Claude Opus 5
**Prioridade:** P0
**Fluxo:** Som

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'som,P0,claude-code,humano,modelo-opus' --milestone 'Som'
mk open --title 'S-11 · Renomear as `AmbientKey` de fantasia' \
  --body '`beach | celestial | crystal | forest | mountain | snow | stars | volcano`.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P1
**Fluxo:** Som

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'som,P1,claude-code,modelo-sonnet' --milestone 'Som'
mk open --title 'S-12 · Remover os 8 `ambient_*.mp3` antigos' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P1
**Fluxo:** Som

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'som,P1,claude-code,modelo-sonnet' --milestone 'Som'
mk open --title 'S-13 · Integrar os 10 ambientes em `sounds.ts`' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code + Você
**Modelo recomendado:** Claude Opus 5
**Prioridade:** P0
**Fluxo:** Som

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'som,P0,claude-code,humano,modelo-opus' --milestone 'Som'
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
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P1
**Fluxo:** Som

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'som,P1,claude-code,modelo-sonnet' --milestone 'Som'

# --- Limpeza ODS12 ---
mk open --title 'L-01 · Renomear a union `AmbientKey`' \
  --body '`src/utils/sounds.ts:32-39`

**Responsável:** Claude Code
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P1
**Fluxo:** Limpeza ODS12

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'limpeza-ods12,P1,claude-code,modelo-sonnet' --milestone 'Limpeza ODS12'
mk done --title 'L-02 · Renomear `WorldTheme`' \
  --body '**Feito 08/09.** `'\''forest'\''|'\''mountain'\''|'\''crystal'\''|'\''sweet'\''` → `'\''padrao'\''|'\''azulado'\''|'\''violeta'\''|'\''rosado'\''`: nome pelo acento de cor do quadro do mapa, sem ligação com material/CONAMA nem vocabulário de fantasia. Só decorativo (não persiste em save), 3 arquivos (`types/game.ts`, `data/worlds.ts`, `screens/LevelSelectScreen.tsx`).

**Responsável:** Claude Code
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P1
**Fluxo:** Limpeza ODS12

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'limpeza-ods12,P1,claude-code,modelo-sonnet' --milestone 'Limpeza ODS12'
mk open --title 'L-03 · Trocar os `identityKey` dos mundos 2–8 e bônus' \
  --body '`vales-montanhosos`, `ruinas-de-cristal`, `praia-dos-tesouros`, `vulcao-doce`, `cidade-das-estrelas`, `neve-cristalina`, `reino-celestial`, `reino-acucarado`.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P1
**Fluxo:** Limpeza ODS12

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'limpeza-ods12,P1,claude-code,modelo-sonnet' --milestone 'Limpeza ODS12'
mk done --title 'L-04 · Renomear os `BOSQUE_*` e os `identityKey` legados' \
  --body '**Feito 04/09.** Mesmo escopo do C-15, mais os oito `identityKey` que ainda carregavam o nome de fantasia (`vulcao-doce`, `reino-celestial`, `praia-dos-tesouros`, `reino-acucarado`…): agora derivam do nome ODS12 do mundo. Nenhum é persistido em save — só identificam o mapa. O livro-razão da guarda caiu de 19 para 14 pendências.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P1
**Fluxo:** Limpeza ODS12

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'limpeza-ods12,P1,claude-code,modelo-sonnet' --milestone 'Limpeza ODS12'
mk open --title 'L-05 · Renomear as chaves `forest-*` de asset' \
  --body '`campaignMapAssets.ts:3-11`

**Responsável:** Claude Code
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P1
**Fluxo:** Limpeza ODS12

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'limpeza-ods12,P1,claude-code,modelo-sonnet' --milestone 'Limpeza ODS12'
mk open --title 'L-06 · Renomear `ForestRestMapMarker.tsx`' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P1
**Fluxo:** Limpeza ODS12

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'limpeza-ods12,P1,claude-code,modelo-sonnet' --milestone 'Limpeza ODS12'
mk open --title 'L-07 · Renomear os 8 `assets/map/world1/forest_*.png`' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code
**Modelo recomendado:** Claude Haiku 4.5
**Prioridade:** P2
**Fluxo:** Limpeza ODS12

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'limpeza-ods12,P2,claude-code,modelo-haiku' --milestone 'Limpeza ODS12'
mk open --title 'L-08 · Renomear `map_path_pieces_bonus_reino_acucarado.png`' \
  --body 'Nome de arquivo com “reino açucarado”.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P1
**Fluxo:** Limpeza ODS12

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'limpeza-ods12,P1,claude-code,modelo-sonnet' --milestone 'Limpeza ODS12'
mk open --title 'L-09 · Renomear os path pieces de bosque e vales montanhosos' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code
**Modelo recomendado:** Claude Haiku 4.5
**Prioridade:** P2
**Fluxo:** Limpeza ODS12

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'limpeza-ods12,P2,claude-code,modelo-haiku' --milestone 'Limpeza ODS12'
mk open --title 'L-10 · Revisar `assets/map/README_MUNDO_3.txt`' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code
**Modelo recomendado:** Claude Haiku 4.5
**Prioridade:** P2
**Fluxo:** Limpeza ODS12

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'limpeza-ods12,P2,claude-code,modelo-haiku' --milestone 'Limpeza ODS12'
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
mk done --title 'L-13 · Escrever o `README.md` de verdade' \
  --body '**Feito 08/09.** Pitch do jogo, as duas trilhas de conteudo, setup local, checklist de antes do PR e uma tabela de ponteiros pros outros docs (CONTEXT/CLAUDE/CONTRIBUTING/ADRs/roadmap) em vez de duplicar o conteudo deles.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P1
**Fluxo:** Limpeza ODS12

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'limpeza-ods12,P1,claude-code,modelo-sonnet' --milestone 'Limpeza ODS12'
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
**Modelo recomendado:** Claude Haiku 4.5
**Prioridade:** P2
**Fluxo:** Limpeza ODS12

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'limpeza-ods12,P2,claude-code,modelo-haiku' --milestone 'Limpeza ODS12'
mk open --title 'L-16 · Rodar `/code-review` na limpeza' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P1
**Fluxo:** Limpeza ODS12

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'limpeza-ods12,P1,claude-code,modelo-sonnet' --milestone 'Limpeza ODS12'

# --- Git e versionamento ---
mk done --title 'G-01 · Adotar Conventional Commits formalmente' \
  --body '**Feito 03/09** (commit `c8311ab`). O historico ja seguia a convencao na pratica; isto trava o habito, porque o `release-please` versiona lendo o log — sem tipo confiavel na mensagem nao da para decidir entre major, minor e patch.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P1
**Fluxo:** Git e versionamento

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'git,P1,claude-code,modelo-sonnet' --milestone 'Git e versionamento'
mk done --title 'G-02 · `commitlint` + config convencional' \
  --body '**Feito 03/09** (commit `c8311ab`). `commitlint.config.js` estendendo `config-conventional`, com `scope-enum` nas fatias reais do projeto (campanha, capitulos, dominio, ui, storage, audio, mapa, ci, deps, roadmap, testes) em vez de uma lista generica. Escopo segue **opcional**: obrigar em todo commit gera escopo inventado, que e pior que nenhum.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P1
**Fluxo:** Git e versionamento

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'git,P1,claude-code,modelo-sonnet' --milestone 'Git e versionamento'
mk done --title 'G-03 · Hook `commit-msg` rodando o commitlint' \
  --body '**Feito 03/09** (commit `c8311ab`). **Sem husky, de proposito:** o husky espera o `.git` no diretorio de onde roda, e aqui nao esta — o repositorio e `TrincaEngSoftware/` e o projeto vive dois niveis abaixo. O que o husky faria de util e um `git config core.hooksPath`, entao `scripts/instalar-hooks.js` faz essa linha com o calculo de caminho certo, no `prepare`. Hooks versionados em `.githooks/`. O que travava era F0-02: hook roda em shell nao-interativo, que nao le o `.zshrc` onde o nvm vive — o `common.sh` procura no nvm a versao do `.nvmrc` antes de desistir. Testado com `env -i PATH=/usr/bin:/bin`.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P1
**Fluxo:** Git e versionamento

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'git,P1,claude-code,modelo-sonnet' --milestone 'Git e versionamento'
mk done --title 'G-04 · `lint-staged` no `pre-commit`' \
  --body '**Feito 03/09** (commit `c8311ab`). `eslint --fix` e `prettier --write` so nos arquivos staged.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P1
**Fluxo:** Git e versionamento

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'git,P1,claude-code,modelo-sonnet' --milestone 'Git e versionamento'
mk done --title 'G-05 · Hook `pre-push` com typecheck' \
  --body '**Feito 03/09** (commit `c8311ab`). Barato e evita CI vermelho por erro de tipo.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Haiku 4.5
**Prioridade:** P2
**Fluxo:** Git e versionamento

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'git,P2,claude-code,modelo-haiku' --milestone 'Git e versionamento'
mk done --title 'G-06 · `release-please` para versão e CHANGELOG' \
  --body '**Feito 04/09.** Config em `release-please-config.json` + `.release-please-manifest.json`, workflow em `.github/workflows/release.yml`. Le os Conventional Commits, mantem um PR de release com o CHANGELOG acumulado e, no merge, cria a tag — que e o gatilho que o `build.yml` ja esperava. `include-component-in-tag: false` e obrigatorio: o padrao taggearia `trincamania-v1.0.0` e o `on: push: tags: ["v*"]` do build nao casaria. `target-branch: develop` porque `main` nao existe (ver G-09).

**Responsável:** Claude Code
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P1
**Fluxo:** Git e versionamento

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'git,P1,claude-code,modelo-sonnet' --milestone 'Git e versionamento'
mk open --title 'G-07 · Criar o `CHANGELOG.md`' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P1
**Fluxo:** Git e versionamento

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'git,P1,claude-code,modelo-sonnet' --milestone 'Git e versionamento'
mk done --title 'G-08 · Versão num lugar só' \
  --body '**Feito 03/09** (commit `c8311ab`). `app.config.js` deriva `version` do `package.json`, e o campo saiu do `app.json`. Sem isso o release-please bumparia o `package.json` e o APK sairia com a versao anterior — **sem quebrar nada**, que e o pior tipo de erro. `versionCode`/`buildNumber` ficam com o EAS. De tabela, o `app.json` ainda publicava `TileAdventure-ODS`, sobra do jogo pre-redesign.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P1
**Fluxo:** Git e versionamento

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'git,P1,claude-code,modelo-sonnet' --milestone 'Git e versionamento'
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
mk done --title 'G-11 · Template de PR' \
  --body '**Feito 08/09.** `.github/PULL_REQUEST_TEMPLATE.md`: o que muda, como testar, checklist (typecheck/test, hash de levels.ts, vocabulario ODS12, Conventional Commits).

**Responsável:** Claude Code
**Modelo recomendado:** Claude Haiku 4.5
**Prioridade:** P2
**Fluxo:** Git e versionamento

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'git,P2,claude-code,modelo-haiku' --milestone 'Git e versionamento'
mk done --title 'G-12 · Templates de issue: bug, arte, conteúdo' \
  --body '**Feito 08/09.** `.github/ISSUE_TEMPLATE/{bug,arte,conteudo}.yml`, formulario estruturado, cada um com a label correspondente ja aplicada.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Haiku 4.5
**Prioridade:** P2
**Fluxo:** Git e versionamento

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'git,P2,claude-code,modelo-haiku' --milestone 'Git e versionamento'
mk done --title 'G-13 · `CODEOWNERS`' \
  --body '**Feito 08/09.** `.github/CODEOWNERS`: `* @VittorNCosta` — projeto de uma pessoa so por enquanto (ver SECURITY.md).

**Responsável:** Claude Code
**Modelo recomendado:** Claude Haiku 4.5
**Prioridade:** P2
**Fluxo:** Git e versionamento

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'git,P2,claude-code,modelo-haiku' --milestone 'Git e versionamento'
mk open --title 'G-14 · Padronizar as labels' \
  --body '`arte`, `som`, `conteudo`, `automacao`, `devsecops`, `p0/p1/p2`.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Haiku 4.5
**Prioridade:** P2
**Fluxo:** Git e versionamento

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'git,P2,claude-code,modelo-haiku' --milestone 'Git e versionamento'
mk done --title 'G-15 · Revisar o `.gitattributes`' \
  --body '**Feito 03/09** (commit `c8311ab`). `*.ttf`, `*.otf`, `*.aab` e `*.keystore` marcados como binario.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Haiku 4.5
**Prioridade:** P2
**Fluxo:** Git e versionamento

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'git,P2,claude-code,modelo-haiku' --milestone 'Git e versionamento'
mk open --title 'G-16 · Decidir sobre Git LFS para os PNGs' \
  --body 'Reavaliar depois de A-33 — com tudo ≤ 400 KB pode não valer.

**Responsável:** Você
**Prioridade:** P2
**Fluxo:** Git e versionamento

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'git,P2,humano' --milestone 'Git e versionamento'
mk done --title 'G-17 · `.gitignore`: build do EAS, `*.aab`, `coverage/`' \
  --body '**Feito 03/09** (commit `c8311ab`). **Divergencia do texto original:** pedia ignorar `.eas/` inteiro, mas CI-23 quer `.eas/workflows/` versionado — ignora `.eas/build-cache/` no lugar.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Haiku 4.5
**Prioridade:** P2
**Fluxo:** Git e versionamento

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'git,P2,claude-code,modelo-haiku' --milestone 'Git e versionamento'

# --- CI/CD ---
mk done --title 'CI-01 · Quebrar o CI em jobs paralelos' \
  --body '**Feito 03/09.** Sete jobs no lugar de um sequencial: `lint`, `typecheck`, `guardas`, `test`, `test-ui`, `playthrough` e `expo-doctor`. Antes, lint quebrado escondia se os testes passariam e cada ida ao CI devolvia um problema de cada vez; agora o PR volta com a lista inteira. O preço é um `npm ci` por job, barato porque o cache do `setup-node` e compartilhado e o gargalo real (playthrough, ~1 min) passa a rodar ao lado do resto.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P1
**Fluxo:** CI/CD

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'ci-cd,P1,claude-code,modelo-sonnet' --milestone 'CI/CD'
mk done --title 'CI-02 · `concurrency` com cancelamento de runs antigos' \
  --body '**Feito 03/09.** Push novo no mesmo PR cancela o run anterior. Em push para `main`/`develop` nao cancela — `cancel-in-progress` so liga quando `github.event_name == '\''pull_request'\''`, porque ali cada commit e um estado que vale ter verificado por si.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P1
**Fluxo:** CI/CD

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'ci-cd,P1,claude-code,modelo-sonnet' --milestone 'CI/CD'
mk done --title 'CI-03 · `timeout-minutes` em todo job' \
  --body '**Feito 03/09.** 10 min nos jobs curtos, 15 nos de teste, 20 no playthrough. Sem isso um job travado queima as 6 h de teto padrao do runner.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P1
**Fluxo:** CI/CD

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'ci-cd,P1,claude-code,modelo-sonnet' --milestone 'CI/CD'
mk done --title 'CI-04 · `permissions: contents: read` no topo' \
  --body '**Feito 03/09.** Declarado no nivel do workflow. Sem a chave o `GITHUB_TOKEN` herda o escopo padrao do repositorio, que inclui escrita — e nenhum dos sete jobs precisa de mais que leitura.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Opus 5
**Prioridade:** P0
**Fluxo:** CI/CD

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'ci-cd,P0,claude-code,modelo-opus' --milestone 'CI/CD'
mk done --title 'CI-05 · Fixar as actions por SHA, não por tag' \
  --body '**Feito 03/09, pins atualizados 04/09.** `actions/checkout` em `3d3c42e` (v7.0.1) e `actions/setup-node` em `8207627` (v7.0.0), com a versao no comentario ao lado — e o comentario nao e decoracao: e por ele que o Dependabot (SEC-04) sabe qual versao esta fixada e consegue abrir o bump. Tag e ponteiro mutavel: quem controla o repositorio da action pode reapontar `v4` para outro commit sem que nada aqui mude.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P1
**Fluxo:** CI/CD

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'ci-cd,P1,claude-code,modelo-sonnet' --milestone 'CI/CD'
mk done --title 'CI-06 · Matrix de Node 20 e 22' \
  --body '**Feito 03/09**, com `fail-fast: false` — se o 20 quebra e o 22 e cancelado, a matrix perde a graca, porque a pergunta e em qual das duas falha. **Achou um bug de verdade:** `npm test` era `node --test tests`, e passar diretorio so funciona ate o Node 21 — do 22 em diante o runner trata o argumento como arquivo e morre com `MODULE_NOT_FOUND`. Como `engines` declara `>=20.19.0`, o comando estava quebrado em metade das versoes suportadas. Ver CI-06a.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P2
**Fluxo:** CI/CD

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'ci-cd,P2,claude-code,modelo-sonnet' --milestone 'CI/CD'
mk done --title 'CI-06a · Corrigir `npm test` para qualquer Node >= 20' \
  --body '**Feito 03/09.** Saiu de CI-06. Agora `npm test` chama `scripts/rodar-testes.js`, que le `tests/` e passa a lista de `*.test.cjs` explicita ao `--test`. A alternativa obvia, `node --test tests/*.test.cjs`, trocaria um problema por outro: depende do shell expandir o glob, o que o cmd e o PowerShell nao fazem — armadilha que o `CLAUDE.md` ja avisava. Assim quem lista os arquivos e o Node. 128/128 no Node 20 e no 24.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P1
**Fluxo:** CI/CD

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'ci-cd,P1,claude-code,modelo-sonnet' --milestone 'CI/CD'
mk done --title 'CI-07 · Rodar `npm run format:check` no CI' \
  --body '**Feito 03/09.** Segundo passo do job `lint`, junto da checagem que ja existia — as duas sao analise estatica barata e falham pelo mesmo motivo: alguem commitou sem passar o prettier.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P1
**Fluxo:** CI/CD

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'ci-cd,P1,claude-code,modelo-sonnet' --milestone 'CI/CD'
mk done --title 'CI-08 · Rodar `npx expo-doctor` no CI' \
  --body '**Feito 03/09.** Job proprio. Verificado antes de ligar: 18/18 checks passam hoje, entao entra verde em vez de repetir a armadilha de deixar o CI vermelho de saida.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P1
**Fluxo:** CI/CD

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'ci-cd,P1,claude-code,modelo-sonnet' --milestone 'CI/CD'
mk done --title 'CI-09 · Cobertura de teste com threshold' \
  --body '**Feito 03/09.** `npm run cobertura` (`scripts/cobertura.js`), job proprio no CI. **Nao e `jest --coverage`, de proposito:** o Jest aqui roda 4 smoke tests de componente, e as 128 assercoes de regra de jogo, storage e dominio sao `node:test` em `tests/*.test.cjs`, que ele nao coleta — um threshold sobre o Jest mediria 4 arquivos de UI e chamaria isso de cobertura do projeto. O piso usa a cobertura nativa do `node:test` e segue o idioma dos outros guardas: e o que a suite cobre hoje (85,70% linha / 87,42% ramo / 87,03% funcao), gravado em `scripts/cobertura-minima.json`, e cair reprova. Baixar exige `--atualizar --permitir-queda`, para afrouxar a regua aparecer no diff. A conta e nossa porque o Node 20 nao tem `--test-coverage-lines` — so o 22+ tem — e a matrix roda os dois.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P1
**Fluxo:** CI/CD

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'ci-cd,P1,claude-code,modelo-sonnet' --milestone 'CI/CD'
mk done --title 'CI-09a · Fixar o job de cobertura numa versao de Node' \
  --body '**Feito 03/09.** Saiu de CI-09. O mesmo codigo e os mesmos 128 testes medem 85,70% de linha no Node 20 e 79,57% no Node 24: seis pontos que nao tem nada a ver com teste, e sim com o que cada V8 instrumenta. Entao o job de cobertura fica fora da matrix, no Node 20 do `engines`, e o piso grava o `nodeMajor` em que foi medido — rodar noutra versao devolve a explicacao em vez de um vermelho falso.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P1
**Fluxo:** CI/CD

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'ci-cd,P1,claude-code,modelo-sonnet' --milestone 'CI/CD'
mk done --title 'CI-10 · Publicar o relatório de cobertura' \
  --body '**Feito 03/09.** Vai para o **resumo do job** (`$GITHUB_STEP_SUMMARY`), que o GitHub renderiza na pagina do run, e nao para um comentario no PR. Comentar exigiria `pull-requests: write`, reabrindo justamente o privilegio que CI-04 acabou de fechar, e por um relatorio que ninguem le duas vezes. O resumo nao pede permissao nenhuma. Traz as tres metricas contra o piso e, num `<details>`, os 10 arquivos de `src/` menos cobertos — que e a parte acionavel: hoje aponta `MatchRule.ts` e `ShuffleService.ts` em 24,56%. Sem a variavel de ambiente o script nao escreve nada, entao rodar local continua limpo.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P2
**Fluxo:** CI/CD

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'ci-cd,P2,claude-code,modelo-sonnet' --milestone 'CI/CD'
mk done --title 'CI-11 · Path filters' \
  --body '**Feito 03/09.** Job `mudancas` compara com a base e exporta `codigo=true|false`; os sete jobs de codigo ganham `if: needs.mudancas.outputs.codigo == '\''true'\''`. **Nao** foi usado `paths:` no nivel do workflow, que e a forma obvia e a errada: com ela o workflow nao roda, o check obrigatorio nunca reporta e o PR de documentacao trava sem poder mergear. Job pulado por `if:`, ao contrario, conta como sucesso. `lint` fica de fora do gate porque o `format:check` tambem cobre `.md`. Na duvida — branch nova, force-push, base fora de alcance — roda tudo. O checkout usa `filter: blob:none` para pegar o historico sem os 85 MB de PNG.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P2
**Fluxo:** CI/CD

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'ci-cd,P2,claude-code,modelo-sonnet' --milestone 'CI/CD'
mk done --title 'CI-12 · Job de validação de peso de asset' \
  --body '**Feito 03/09.** `scripts/valida-assets.js` roda no CI e cobre três coisas: teto de 400 KB por arquivo, asset órfão que nada em `src/` referencia, e extensão duplicada (`.png.png`, sempre erro de exportação). Reprovar no saldo atual era inviável — 42 arquivos já estouram o teto e 51 são órfãos —, então compara com o livro-razão `scripts/assets-baseline.json`: falha em arquivo novo acima do limite, em arquivo conhecido que engordou e em entrada que saiu da lista sem o saldo ser atualizado. Assim a dívida só pode encolher. Hoje: 100 arquivos, 84,9 MB.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P2
**Fluxo:** CI/CD

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'ci-cd,P2,claude-code,modelo-sonnet' --milestone 'CI/CD'
mk done --title 'CI-13 · Job de guarda ODS12' \
  --body '**Feito 03/09.** `scripts/guarda-ods12.js` roda no CI varrendo `src/` e também o **nome** dos assets — `ambient_celestial.mp3` é conteúdo tanto quanto uma string. Grep puro reprovaria o repositório hoje (`theme: '\''sweet'\''`, `identityKey` legado, trilha do Mundo 8) e reprovaria ocorrência legítima ("restos de fruta" é o que é resíduo orgânico), então compara com o livro-razão `scripts/ods12-baseline.json`: falha em ocorrência nova e em entrada morta, com a chave em `arquivo::termo` e não na linha. Restam 19 pendências classificadas, todas com tarefa nos blocos L, S e C-08b.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P1
**Fluxo:** CI/CD

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'ci-cd,P1,claude-code,modelo-sonnet' --milestone 'CI/CD'
mk open --title 'CI-14 · Criar o secret `EXPO_TOKEN`' \
  --body 'expo.dev → Access Tokens.

**Responsável:** Você
**Prioridade:** P0
**Fluxo:** CI/CD

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'ci-cd,P0,humano' --milestone 'CI/CD'
mk done --title 'CI-15 · Migrar `eas.json` para `appVersionSource: "remote"`' \
  --body '**Feito 03/09** (commit `c8311ab`). Sai de tabela com G-08: com a versao derivada do `package.json`, `versionCode` e `buildNumber` precisam de dono, e o dono e o EAS.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P1
**Fluxo:** CI/CD

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'ci-cd,P1,claude-code,modelo-sonnet' --milestone 'CI/CD'
mk done --title 'CI-16 · `autoIncrement: true` no perfil de produção' \
  --body '**Feito 03/09** (commit `c8311ab`).

**Responsável:** Claude Code
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P1
**Fluxo:** CI/CD

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'ci-cd,P1,claude-code,modelo-sonnet' --milestone 'CI/CD'
mk done --title 'CI-17 · Adicionar o perfil `development` no `eas.json`' \
  --body '**Feito 03/09** (commit `c8311ab`). Com `developmentClient: true` e APK de distribuicao interna. O `preview` tambem ganhou `distribution: internal`.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P1
**Fluxo:** CI/CD

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'ci-cd,P1,claude-code,modelo-sonnet' --milestone 'CI/CD'
mk done --title 'CI-18 · Workflow de build de preview em PR' \
  --body '**Feito 03/09.** `.github/workflows/build.yml`, separado do `ci.yml`: o CI verifica todo push e tem de ser rapido e gratuito, isto gasta minuto de build de terceiro. **Divergencia:** o texto pedia APK por PR, e saiu APK por PR **rotulado** com `build:preview` — buildar todo push de todo PR queimaria a cota do EAS em troca de APKs que ninguem instala. Com o rotulo o build sai quando alguem de fato quer testar no aparelho, e `synchronize` faz o PR rotulado rebuildar a cada push. Enquanto CI-14 nao existir, o job `checagem` devolve um aviso e os builds sao pulados: o workflow fica **verde e inerte** em vez de vermelho.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P1
**Fluxo:** CI/CD

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'ci-cd,P1,claude-code,modelo-sonnet' --milestone 'CI/CD'
mk done --title 'CI-19 · Workflow de build de produção em tag' \
  --body '**Feito 03/09.** Dispara em `push` de tag `v*` — a que o release-please cria — e tambem por `workflow_dispatch` com escolha de perfil. Usa `--no-wait`: esperar o build custa 15 a 30 min de runner do GitHub olhando uma fila que nao e nossa, e o link no resumo do job resolve. Nao usa `expo/expo-github-action` — o que ela faz de essencial e exportar o `EXPO_TOKEN`, que o `env:` ja faz, e uma action a menos e um terceiro a menos com acesso ao token (CI-05).

**Responsável:** Claude Code
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P1
**Fluxo:** CI/CD

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'ci-cd,P1,claude-code,modelo-sonnet' --milestone 'CI/CD'
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
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P2
**Fluxo:** CI/CD

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'ci-cd,P2,claude-code,modelo-sonnet' --milestone 'CI/CD'
mk open --title 'CI-22 · Configurar EAS Update (OTA)' \
  --body 'Correção de JS sem passar pela revisão da loja.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P1
**Fluxo:** CI/CD

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'ci-cd,P1,claude-code,modelo-sonnet' --milestone 'CI/CD'
mk open --title 'CI-23 · Avaliar EAS Workflows em `.eas/workflows/`' \
  --body 'Alternativa nativa ao GitHub Actions no lado mobile.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P2
**Fluxo:** CI/CD

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'ci-cd,P2,claude-code,modelo-sonnet' --milestone 'CI/CD'
mk open --title 'CI-24 · Canal de update por branch' \
  --body '`preview` e `production`.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P2
**Fluxo:** CI/CD

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'ci-cd,P2,claude-code,modelo-sonnet' --milestone 'CI/CD'

# --- DevSecOps ---
mk done --title 'SEC-01 · Habilitar CodeQL para JS/TS' \
  --body '**Feito 04/09.** Job `codeql` em `.github/workflows/seguranca.yml`, linguagem `javascript-typescript` com o pacote `security-and-quality`. O `security-events: write` fica escopado so nesse job; o topo do workflow e `contents: read`.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Opus 5
**Prioridade:** P0
**Fluxo:** DevSecOps

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'devsecops,P0,claude-code,modelo-opus' --milestone 'DevSecOps'
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
mk done --title 'SEC-04 · `dependabot.yml` para npm e github-actions' \
  --body '**Feito 04/09.** `.github/dependabot.yml` para npm (no subdiretorio do projeto) e github-actions (na raiz), semanal. Agrupa minor e patch; **ignora major** de expo, react, react-native, jest e typescript — porque foi exatamente um major solto (`@types/jest` ^30 contra o jest ~29 que o `jest-expo ~54` fixa) que deixou o develop vermelho. Esses sobem junto com o SDK, por decisao. Prefixo `chore(deps)`/`chore(ci)` para passar no commitlint.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Opus 5
**Prioridade:** P1
**Fluxo:** DevSecOps

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'devsecops,P1,claude-code,modelo-opus' --milestone 'DevSecOps'
mk open --title 'SEC-05 · Avaliar Renovate no lugar do Dependabot' \
  --body 'Agrupa PRs e respeita melhor os ranges do Expo.

**Responsável:** Você
**Prioridade:** P2
**Fluxo:** DevSecOps

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'devsecops,P2,humano' --milestone 'DevSecOps'
mk done --title 'SEC-06 · `npm audit --audit-level=high` no CI' \
  --body '**Feito 04/09.** Nao entrou como `--audit-level=high` puro porque nasceria vermelho: 11 advisories abertos (6 high) que chegam pela cadeia do Expo e cuja correcao passa por subir o major. Gate que nasce vermelho alguem desliga. Entao `scripts/auditoria.js` usa o livro-razao das outras guardas: reprova em advisory novo acima do piso e em entrada morta, chaveado por `pacote::id-do-advisory` (nao pela versao, que muda a cada install). Registry fora do ar nao reprova — 3 tentativas, teto de 90s, e sai verde avisando.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Opus 5
**Prioridade:** P1
**Fluxo:** DevSecOps

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'devsecops,P1,claude-code,modelo-opus' --milestone 'DevSecOps'
mk done --title 'SEC-07 · `gitleaks` no CI' \
  --body '**Feito 04/09.** Job `segredos`, com `fetch-depth: 0` para varrer o historico e nao so o diff. Baixa o binario do gitleaks 8.30.1 da release em vez de usar a action de terceiro — mesma razao ja registrada no CI-05: nao dar acesso a token para action de terceiro.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Opus 5
**Prioridade:** P1
**Fluxo:** DevSecOps

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'devsecops,P1,claude-code,modelo-opus' --milestone 'DevSecOps'
mk done --title 'SEC-08 · `dependency-review` em PR' \
  --body '**Feito 04/09.** Job `dependencias`, so em PR (a action exige o par base/head). Barra severidade >= high e licenca GPL-2.0/GPL-3.0/AGPL-3.0.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Opus 5
**Prioridade:** P1
**Fluxo:** DevSecOps

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'devsecops,P1,claude-code,modelo-opus' --milestone 'DevSecOps'
mk open --title 'SEC-09 · Gerar SBOM CycloneDX por release' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code
**Modelo recomendado:** Claude Opus 5
**Prioridade:** P2
**Fluxo:** DevSecOps

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'devsecops,P2,claude-code,modelo-opus' --milestone 'DevSecOps'
mk open --title 'SEC-10 · OpenSSF Scorecard' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code
**Modelo recomendado:** Claude Opus 5
**Prioridade:** P2
**Fluxo:** DevSecOps

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'devsecops,P2,claude-code,modelo-opus' --milestone 'DevSecOps'
mk done --title 'SEC-11 · Auditar `android.permissions`' \
  --body '**Feito 03/09** (commit `c8311ab`). Continua `[]`, e agora `tests/appConfig.test.cjs` reprova se deixar de ser — que era a parte que faltava, porque o risco nao e o valor de hoje, e a lib nova de amanha.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Opus 5
**Prioridade:** P1
**Fluxo:** DevSecOps

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'devsecops,P1,claude-code,modelo-opus' --milestone 'DevSecOps'
mk done --title 'SEC-12 · Travar a config do `expo-audio` em teste' \
  --body '**Feito 03/09** (commit `c8311ab`). `microphonePermission: false` e `recordAudioAndroid: false` travados em teste.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Opus 5
**Prioridade:** P1
**Fluxo:** DevSecOps

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'devsecops,P1,claude-code,modelo-opus' --milestone 'DevSecOps'
mk done --title 'SEC-13 · Confirmar que não há segredo em `app.json`/`eas.json`' \
  --body '**Feito 03/09** (commit `c8311ab`). Conferido e travado em teste. O `projectId` e publico por definicao; o resto esta limpo.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Opus 5
**Prioridade:** P0
**Fluxo:** DevSecOps

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'devsecops,P0,claude-code,modelo-opus' --milestone 'DevSecOps'
mk done --title 'SEC-14 · Escrever o `SECURITY.md`' \
  --body '**Feito 04/09.** `.github/SECURITY.md`. Aponta para o **private vulnerability reporting** do GitHub em vez de um e-mail — o repositorio e publico e o endereco seria pessoal. Traz a tabela das verificacoes automaticas e o que cada uma cobre.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Opus 5
**Prioridade:** P2
**Fluxo:** DevSecOps

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'devsecops,P2,claude-code,modelo-opus' --milestone 'DevSecOps'
mk open --title 'SEC-15 · Rodar `/security-review` antes do release' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code
**Modelo recomendado:** Claude Opus 5
**Prioridade:** P0
**Fluxo:** DevSecOps

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'devsecops,P0,claude-code,modelo-opus' --milestone 'DevSecOps'
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
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P1
**Fluxo:** Qualidade

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'qualidade,P1,claude-code,modelo-sonnet' --milestone 'Qualidade'
mk open --title 'Q-02 · Fluxo E2E: abrir, escolher fase, jogar e vencer' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P1
**Fluxo:** Qualidade

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'qualidade,P1,claude-code,modelo-sonnet' --milestone 'Qualidade'
mk open --title 'Q-03 · Fluxo E2E: comprar na loja' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P2
**Fluxo:** Qualidade

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'qualidade,P2,claude-code,modelo-sonnet' --milestone 'Qualidade'
mk open --title 'Q-04 · Fluxo E2E: perder vida e esperar a recarga' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P2
**Fluxo:** Qualidade

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'qualidade,P2,claude-code,modelo-sonnet' --milestone 'Qualidade'
mk open --title 'Q-05 · Rodar o Maestro no CI' \
  --body 'Emulador Android em GitHub Actions.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P2
**Fluxo:** Qualidade

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'qualidade,P2,claude-code,modelo-sonnet' --milestone 'Qualidade'
mk open --title 'Q-06 · Teste de acessibilidade' \
  --body 'Labels e alvo de toque ≥ 44 px. O `minimumTouchSize: 44` já existe no config de mapa, mas ninguém testa.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P1
**Fluxo:** Qualidade

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'qualidade,P1,claude-code,modelo-sonnet' --milestone 'Qualidade'
mk open --title 'Q-07 · Quebrar `GameScreen.tsx`' \
  --body '3166 linhas. O `CLAUDE.md` já avisa para não deixar crescer.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P1
**Fluxo:** Qualidade

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'qualidade,P1,claude-code,modelo-sonnet' --milestone 'Qualidade'
mk open --title 'Q-08 · Quebrar `LevelSelectScreen.tsx`' \
  --body '1879 linhas.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P2
**Fluxo:** Qualidade

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'qualidade,P2,claude-code,modelo-sonnet' --milestone 'Qualidade'
mk open --title 'Q-09 · Quebrar `App.tsx`' \
  --body '1169 linhas.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P2
**Fluxo:** Qualidade

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'qualidade,P2,claude-code,modelo-sonnet' --milestone 'Qualidade'
mk open --title 'Q-10 · Orçamento de tamanho de bundle no CI' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P2
**Fluxo:** Qualidade

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'qualidade,P2,claude-code,modelo-sonnet' --milestone 'Qualidade'
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
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P1
**Fluxo:** Qualidade

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'qualidade,P1,claude-code,modelo-sonnet' --milestone 'Qualidade'
mk open --title 'Q-13 · Resolver o gap do Modo Dev' \
  --body 'Hoje escreve direto no save real e não é reversível — só “Resetar progresso” limpa.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P2
**Fluxo:** Qualidade

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'qualidade,P2,claude-code,modelo-sonnet' --milestone 'Qualidade'
mk open --title 'Q-14 · Atualizar o `CONTEXT.md` com o vocabulário dos 10 mundos' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P1
**Fluxo:** Qualidade

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'qualidade,P1,claude-code,modelo-sonnet' --milestone 'Qualidade'
mk done --title 'Q-15 · Corrigir a faixa de dificuldade do primeiro mapa dos capítulos 4 e 7' \
  --body '**Feito 03/09.** Defeito real em produção, achado ao prototipar a curva do bloco C. `Math.floor(score * 5)` em `src/data/chapters.ts` rotulava `ch04-001` como easy (devia ser normal) e `ch07-001` como normal (devia ser hard). Não era regra de negócio: `(n-1)/9*0,6` cai abaixo da fronteira em binário — 0.9999999999999999 e 1.9999999999999998 — e o `floor` derruba uma faixa inteira. 2 mapas em 1000. A carga de peças sempre esteve correta; errado era só o rótulo que o jogador lê. Corrigido com uma `BORDA_DE_FAIXA = 1e-9` documentada e teste de regressão fixando as 10 faixas de abertura.

**Responsável:** Claude Code
**Modelo recomendado:** Claude Sonnet 5
**Prioridade:** P1
**Fluxo:** Qualidade

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'qualidade,P1,claude-code,modelo-sonnet' --milestone 'Qualidade'

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

**Responsável:** Claude Code + Você
**Modelo recomendado:** Claude Opus 5
**Prioridade:** P0
**Fluxo:** Release

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'release,P0,claude-code,humano,modelo-opus' --milestone 'Release'
mk open --title 'R-05 · Capturar 8 screenshots de telefone' \
  --body 'Mínimo 2, ideal 8.

**Responsável:** Você
**Prioridade:** P0
**Fluxo:** Release

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'release,P0,humano' --milestone 'Release'
mk open --title 'R-06 · Feature graphic 1024×500' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code + Você
**Modelo recomendado:** Claude Opus 5
**Prioridade:** P0
**Fluxo:** Release

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'release,P0,claude-code,humano,modelo-opus' --milestone 'Release'
mk open --title 'R-07 · Ícone da loja 512×512' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code + Você
**Modelo recomendado:** Claude Opus 5
**Prioridade:** P0
**Fluxo:** Release

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'release,P0,claude-code,humano,modelo-opus' --milestone 'Release'
mk open --title 'R-08 · Vídeo de preview' \
  --body 'Opcional.

**Responsável:** Você
**Prioridade:** P2
**Fluxo:** Release

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'release,P2,humano' --milestone 'Release'
mk open --title 'R-09 · Hospedar a política de privacidade' \
  --body 'Obrigatória. Como o jogo é offline, é curta.

**Responsável:** Claude Code + Você
**Modelo recomendado:** Claude Opus 5
**Prioridade:** P0
**Fluxo:** Release

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'release,P0,claude-code,humano,modelo-opus' --milestone 'Release'
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
**Modelo recomendado:** Claude Opus 5
**Prioridade:** P0
**Fluxo:** Release

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'release,P0,claude-code,modelo-opus' --milestone 'Release'
mk open --title 'R-17 · Marcar a tag `v1.0.0` e publicar o release' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Claude Code
**Modelo recomendado:** Claude Opus 5
**Prioridade:** P0
**Fluxo:** Release

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'release,P0,claude-code,modelo-opus' --milestone 'Release'
mk open --title 'R-18 · Publicar em produção' \
  --body '_Sem detalhe adicional no roadmap._

**Responsável:** Você
**Prioridade:** P0
**Fluxo:** Release

Contexto completo em `docs/ROADMAP-JOGO-COMPLETO.md`.' \
  --label 'release,P0,humano' --milestone 'Release'

echo "== pronto: 199 issues (82 já criadas fechadas) =="
