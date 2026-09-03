# Roadmap — TrincaMania ODS 12 até o jogo completo

**Meta**: 10 mapas (mundos) × 10 fases = **100 fases**, cada mapa com arte,
som e identidade próprios, publicável na Play Store, com pipeline de
CI/CD/DevSecOps automatizado.

**Data do levantamento**: 2026-09-03
**Branch base**: `develop` @ `678e256` (sincronizada com `origin/develop`)

---

## Decisões que originaram este plano

| Decisão | Escolha | Consequência |
|---|---|---|
| Qual trilha vira o jogo | **Campanha vira 10 mundos × 10 fases** | Reescreve `src/data/levels.ts` (hoje 203 fases em 8 mundos × 25 + bônus). Quebra de propósito o hash congelado. Capítulos (10 × 100) viram conteúdo extra/infinito. |
| Produção de arte | **IA generativa** | Cada tarefa de arte traz prompt pronto, resolução, paleta e critério de aceite. |
| Entrega do plano | Doc no repo + Artifact + GitHub Issues | Este arquivo é a fonte de verdade em prosa. |

### As três superfícies e como não desincronizam

O roadmap existe em três lugares, e três cópias contando histórias diferentes
é o modo de falha óbvio. Só um deles é editado à mão como **dados**:

| Superfície | Arquivo | Papel |
|---|---|---|
| Doc | `docs/ROADMAP-JOGO-COMPLETO.md` | Prosa, justificativa, prompts de arte na íntegra. Editado à mão. |
| Artifact | `docs/roadmap/roadmap.html` | Painel filtrável. O array `BLOCKS` é a **fonte de dados** das tarefas. |
| Backlog | `scripts/criar-issues-roadmap.sh` | **Gerado**, nunca editado à mão. |

Ao concluir ou acrescentar tarefa: mexa no `BLOCKS` do HTML (título começando
com `✅` marca concluída — a issue é criada e fechada em seguida), rode

```
node scripts/gerar-issues-roadmap.js
```

e reflita a mesma mudança na prosa deste arquivo.

### Legenda de responsável

- **[CC]** — Claude Code executa (código, teste, config, doc)
- **[VOCÊ]** — tarefa humana/externa (gerar imagem, gravar som, conta de loja)
- **[CC→VOCÊ]** — Claude Code prepara o insumo (prompt, briefing, spec), você executa
- **[VOCÊ→CC]** — você entrega o asset, Claude Code integra

### Prioridade

- **P0** — bloqueia o jogo ser jogável/publicável
- **P1** — necessário para o jogo ser *bom*
- **P2** — polimento / maturidade de engenharia

---

## Estado atual — o que já existe e não precisa refazer

Verificado no código nesta data:

- **Núcleo de domínio 100% ODS12** — `src/domain/recycling/` (material, ciclo,
  trinca, políticas). Não muda por causa de tema.
- **Arte das peças em SVG** — `src/components/TileIcon.tsx` (264 linhas) desenha
  resíduo/lixeira/símbolo por código. **Não precisa de PNG por mapa.**
- **Ícones de UI em SVG** — `src/components/GameIcon.tsx` (694 linhas).
- **8 telas prontas** — `ChaptersScreen`, `GameScreen`, `LevelSelectScreen`,
  `PowersScreen`, `ProfileScreen`, `RewardsScreen`, `ShopScreen`,
  `SplashIntroScreen`.
- **Economia e progressão** — moedas, vidas, chaves, baús, boost de bandeja,
  power-ups, resgate de trinca mágica.
- **19 arquivos de teste** — 15 em `tests/` (node:test) + 4 componentes (jest).
- **CI mínimo** — `.github/workflows/ci.yml` roda lint + typecheck + test +
  test:ui + test:playthrough em push/PR para `main` e `develop`.
- **EAS configurado** — `eas.json` com perfis `preview` (APK) e `production`
  (AAB); `projectId` já existe em `app.json`.
- **Nomes ODS12 dos 8 mundos e das 203 fases** — auditados em 2026-08-13.

---

# BLOCO F0 — Fundação (desbloqueia todo o resto)

| ID | Tarefa | Quem | Prio | Detalhe |
|---|---|---|---|---|
| F0-01 | ✅ Instalar `gh` CLI | [VOCÊ] | P0 | **Feito 03/09:** binário v2.99.0 baixado do release oficial para `~/.local/bin/gh`, sem sudo — o diretório já está no PATH via `.zshrc:105`. Falta só o `gh auth login`, que é interativo. |
| F0-02 | Expor `node` no PATH não-interativo | [VOCÊ] | P0 | `node` só existe via nvm (`~/.nvm/versions/node/v20.20.2`). Em shell não-interativo o comando não resolve — quebra hooks de git e scripts. Adicionar carga do nvm em `~/.zshenv` ou usar caminho absoluto nos hooks. |
| F0-03 | ✅ Fixar versão de Node do projeto | [CC] | P1 | **Feito 03/09:** `.nvmrc` e `engines.node` em `>=20.19.4 <21` — não é só "20": `npm ci` acusou `EBADENGINE` porque `react-native@0.81.5` exige `>=20.19.4` e a máquina local tinha `v20.19.1`. Quem rodar local precisa de `nvm install` na versão do `.nvmrc`. |
| F0-04 | ✅ Resolver o `package.json` pendente | [CC] | P0 | **Feito 03/09** (commit `c1e3b65`). Não era decisão em aberto e sim bug: o `package-lock.json` commitado já trazia ~54.0.37 / ~54.0.18 / ^29.5.14, então HEAD tinha manifest e lock discordando — `npm ci`, que é o que o CI roda, falharia. |
| F0-05 | ✅ Rodar `npx expo-doctor` e registrar o resultado | [CC] | P1 | **Feito 03/09:** 17/17 checks passaram depois de restaurar um `package-lock.json` não commitado que tinha regredido (`@types/jest` voltou a `^30.0.0`, `expo` a `~54.0.34`, `jest-expo` a `~54.0.17` — mesma classe de bug do F0-04) e rodar `npm ci` limpo. `typecheck` e os 121 testes de `tests/` continuam verdes. |
| F0-06 | Criar branch de trabalho `feat/campanha-10x10` | [CC] | P0 | A reescrita de conteúdo não vai direto em `develop`. |

---

# BLOCO C — Conteúdo: 10 mundos × 10 fases

> **Este é o bloco de maior risco.** O CLAUDE.md marca as 203 fases como
> invariante congelado (`tests/levelComposition.test.cjs` trava
> `sha256(JSON.stringify(LEVELS))`). Quebrar isso é intencional aqui, mas
> exige atualizar **6 arquivos de teste** e migrar saves de jogadores.

## C.1 — Design e nomeação

| ID | Tarefa | Quem | Prio | Detalhe |
|---|---|---|---|---|
| ~~C-01~~ | ~~Confirmar nomes dos Mundos 9 e 10~~ | [VOCÊ] | P0 | ✅ **Feito 2026-09-03.** Mundo 9 = Oficina do Reparo, Mundo 10 = Cidade Circular. Os capítulos 9 e 10 é que foram renomeados — ver tabela abaixo. |
| C-02 | Redesenhar a curva de dificuldade para 100 fases | [CC] | P0 | Hoje a rampa é de 9→60 peças em 203 fases. Comprimir para 100 sem virar salto. `WORLD_LEVELS_PER_MAP: 25 → 10`, `WORLD_DIFFICULTY_BLOCK_SIZE: 5 → 2`. Invariante: `tileCount` sempre múltiplo de 3. |
| C-03 | Redefinir marcos (descanso/loja/guardião) | [CC] | P0 | Com 10 fases por mundo, os marcos atuais (5/10/15/20/25) colapsam. Proposta: descanso na fase 5, guardião na fase 10, loja entre mundos. |
| C-04 | Escrever 100 títulos de fase ODS12 | [CC] | P0 | 10 por mundo. Vocabulário obrigatório de `CONTEXT.md`. Sem fantasia genérica. |
| C-05 | Escrever 100 textos de objetivo | [CC] | P0 | Padrão atual: `Objetivo: <verbo> <alvo>.` |
| C-06 | Definir `starTimeLimits` das 100 fases | [CC] | P1 | Derivar da curva, não à mão. Hoje `WORLD_STAR_TIME_BASE_OFFSET` / `WORLD_STAR_TIME_SPAN`. |
| C-07 | Definir `recommendedPower` e `mysteryTileCount` por fase | [CC] | P1 | Mistério com teto de 1/6 do tabuleiro (regra já usada nos capítulos). |
| ~~C-08~~ | ~~Decidir destino do mundo bônus (id 21, 3 fases)~~ | [VOCÊ] | P1 | ✅ **Feito 2026-09-03.** Fica como 11º mapa secreto, como já é hoje. Ver spec abaixo. |
| C-08a | Reposicionar o bônus de `25.1–25.3` para `10.1–10.3` | [CC] | P0 | `src/data/worlds.ts:119-120`. O `levelStart`/`levelEnd` atual aponta para o fim de um Mundo 1 de 25 fases, que passa a ter 10. |
| C-08b | Trocar o `theme: 'sweet'` do bônus | [CC] | P1 | Vocabulário de fantasia num mundo que fica. Cai junto com L-02. |

### Nomes dos Mundos 9 e 10 — decidido

O arco atual termina em "Fórum da Economia Circular" (mundo 8), que é
deliberação. Faltavam a **ação** e o **resultado**:

| Mundo | Nome | Subtítulo | Material foco | Justificativa ODS12 |
|---|---|---|---|---|
| 9 | **Oficina do Reparo** | "Consertar antes de descartar" | metal | ODS 12.5 — prevenção e reuso vêm antes da reciclagem |
| 10 | **Cidade Circular** | "O ciclo fecha aqui" | todos os 5 | Clímax: o ciclo completo em escala urbana |

**Colisão resolvida** (2026-09-03): os Capítulos 9 e 10 usavam "Oficina do
Conserto" e "Cidade Circular". A campanha ficou com os nomes acima e os
capítulos foram renomeados:

| Capítulo | Antes | Agora | Subtítulo |
|---|---|---|---|
| 9 | Oficina do Conserto | **Ferro-Velho Renascido** | "Sucata que volta a ser matéria-prima" |
| 10 | Cidade Circular | **Metrópole do Ciclo Fechado** | "Cem bairros, um ciclo só" |

O `ChapterTheme` do capítulo 9 passou de `'oficina'` para `'sucata'`, e os
`titlePrefixes` "Oficina" e "Reparo" saíram da lista dele pelo mesmo motivo que
"Peça" já estava fora: são vocabulário reservado a outra coisa.

### Mundo bônus — decidido

Fica como **11º mapa secreto**, exatamente como funciona hoje: 3 fases,
`isBonus: true`, `subtitle: 'Mundo secreto'`, desbloqueado por 3 estrelas em
todas as fases do Mundo 1. Não entra na contagem de 100 — a meta continua
10 × 10, e o bônus é o que existe além dela.

O que a reescrita precisa preservar, e o que precisa ajustar:

| Campo | Hoje | Depois |
|---|---|---|
| `levelIds` | `bonus-w1-001..003` | igual — não renomear, é id de save |
| `unlockRule` | `three-stars-world-1` | igual, mas passa a valer sobre 10 fases em vez de 25, ou seja, fica **mais fácil** de alcançar |
| `levelStart` / `levelEnd` | `25.1` / `25.3` | `10.1` / `10.3` |
| `theme` | `'sweet'` | ODS12 (L-02) |
| `lockedText` | cita "Parque da Coleta Seletiva" | igual — o Mundo 1 mantém o nome |

⚠️ O `unlockRule` ficar mais fácil é efeito colateral, não escolha. Se o bônus
deve continuar sendo uma conquista rara, a regra precisa mudar junto — decidir
em C-02, quando a curva for redesenhada.

## C.2 — Implementação

| ID | Tarefa | Quem | Prio | Arquivo |
|---|---|---|---|---|
| C-09 | Estender `CampaignWorldId` para incluir 9 e 10 | [CC] | P0 | `src/types/game.ts:30` — hoje `1\|2\|3\|4\|5\|6\|7\|8\|21` |
| C-10 | Reescrever `WORLDS` com 10 mundos × 10 fases | [CC] | P0 | `src/data/worlds.ts` — ajustar `levelStart`/`levelEnd` (hoje 1-25, 26-50, …, 176-200) |
| C-11 | Reescrever `LEVEL_SEEDS` | [CC] | P0 | `src/data/levels.ts:519-1545`. Mundos 1–3 são autorais; 4–8 são gerados por `GENERATED_WORLD_CONFIGS`. Decidir se as 100 viram todas geradas (mais sustentável) ou autorais. |
| C-12 | Ajustar `GENERATED_WORLD_CONFIGS` (25 → 10 títulos) | [CC] | P0 | `src/data/levels.ts:198-395` — cada config tem hoje 25 títulos |
| C-13 | Registrar mundos 9 e 10 em `WORLD_MAP_CONFIGS` | [CC] | P0 | `src/data/worldMapConfigs.ts:225` — o `Record` é obrigatório, `tsc` quebra sem as entradas |
| C-14 | Reajustar `BOSQUE_MAP_CONFIG` de 25 para 10 âncoras | [CC] | P0 | `src/data/worldMapConfigs.ts:26-195` — 25 pontos de âncora hoje, `designSize` 360×3160 |
| C-15 | Renomear `BOSQUE_*` → vocabulário ODS12 | [CC] | P1 | 15 ocorrências em `worldMapConfigs.ts`. Ver bloco L. |
| C-16 | Atualizar comentário das 203 em `boardPositions.ts` | [CC] | P1 | Linhas 16 e 39 citam "203 fases canônicas" |
| C-17 | Mapear `AMBIENT_BY_WORLD_ID` para 10 mundos | [CC] | P0 | `src/utils/sounds.ts:165-174` — hoje só 1–8 |
| C-18 | Cobrir mundos 9/10 em `getGameBackground` | [CC] | P0 | `src/screens/GameScreen.tsx:327` — `case` por mundo, hoje 1/2/3/4/5/6/7/8/21 |

## C.3 — Testes e migração

| ID | Tarefa | Quem | Prio | Detalhe |
|---|---|---|---|---|
| C-19 | Recalcular o hash sha256 das fases | [CC] | P0 | `tests/levelComposition.test.cjs:108-115`. Trocar `LEVELS.length` 203→100, o total de peças (hoje 11415) e o literal `b1a76275…`. **Não deletar a asserção** — é trava de integridade. |
| C-20 | Atualizar `tests/chapterProgress.test.cjs:80` | [CC] | P0 | `assert.equal(LEVELS.length, 203)` |
| C-21 | Atualizar `tests/worldMapConfig.test.cjs:57-73` | [CC] | P0 | 3 asserções sobre 203 |
| C-22 | Atualizar `tests/chapters.test.cjs:434-436` | [CC] | P0 | "as 203 fases canônicas continuam intactas" |
| C-23 | Atualizar `tests/simulateFullPlaythrough.cjs:44,210` | [CC] | P0 | Simulação de playthrough completo — a que prova que toda fase é vencível |
| C-24 | Atualizar `tests/boardLayout.test.cjs` e `campaignMapLayout.test.cjs` | [CC] | P0 | Podem depender de contagem/âncoras do Mundo 1 |
| C-25 | Escrever migração de save 203→100 | [CC] | P0 | **Crítico.** Saves existentes têm ids `w1-011`…`w1-025`, `w2-*`…`w8-*` que deixam de existir. `normalizeProgress` descarta id desconhecido *em silêncio* (invariante #3) — jogador perderia progresso sem aviso. Decidir: mapear proporcionalmente, ou versionar o save e resetar com aviso. |
| C-26 | Teste da migração de save | [CC] | P0 | Save antigo → save novo, sem perda silenciosa |
| C-27 | Teste travando cobertura de fundo e ambiente por mundo | [CC] | P1 | Impede que um mundo novo caia em silêncio/floresta-fantasma (mesmo problema já registrado nos capítulos) |
| C-28 | Atualizar texto do Modo Dev | [CC] | P2 | `src/components/SettingsModal.tsx:120` cita "203 fases" |
| C-29 | Atualizar `CLAUDE.md` (invariante #4) | [CC] | P0 | O invariante das 203 congeladas deixa de valer — reescrever para 100 |
| C-30 | Decidir e implementar destino dos Capítulos | [VOCÊ] + [CC] | P1 | Opções: (a) esconder do menu, (b) manter como "modo infinito" pós-jogo, (c) remover o código. Hoje `ChaptersScreen` é acessível por `onOpenChapters`. |

---

# BLOCO A — Arte dos 10 mapas (IA generativa)

## A.0 — Especificação técnica compartilhada

**Resoluções** (conferidas nos PNGs atuais):

| Uso | Resolução | Referência atual |
|---|---|---|
| Fundo de jogo (`GameScreen`) | **1080 × 1920** | `map_world3_game_bg.png` = 1080×1920 |
| Fundo de mapa (`LevelSelectScreen`) | **1080 × 1920** | `map_world3_select_bg.png` = 1080×1920 |
| Marcador/selo de mapa | **320 × 320** (PNG transparente) | `forest_rest_cart.png` = 320×320 |
| Ícone do app | **1024 × 1024** | `assets/icon.png` = 1254×1254 (fora do padrão Expo) |
| Adaptive icon (Android) | **1024 × 1024**, elemento dentro do círculo central de 66% | `assets/adaptive-icon.png` |

⚠️ Os assets legados estão pesados: `map_world1_scene_bg.png` tem **5,8 MB**.
Alvo por imagem: **≤ 400 KB** após compressão (tarefa A-33).

**Paleta CONAMA 275/2001** — obrigatória para qualquer lixeira/símbolo na arte:

| Material | Cor | Hex de referência |
|---|---|---|
| Plástico | Vermelho | `#E30613` |
| Papel/papelão | Azul | `#0055A4` |
| Vidro | Verde | `#009640` |
| Metal | Amarelo | `#FFD500` |
| Orgânico | Marrom | `#7B3F00` |

**Bloco de estilo compartilhado** (colar em *todo* prompt, garante os 10 mapas
parecerem o mesmo jogo):

```
STYLE: 2D vector game illustration, flat shapes with soft gradient shading,
clean readable silhouettes, mobile game background, warm ambient occlusion,
no outlines heavier than 3px, cohesive with a casual puzzle game aesthetic.
COMPOSITION: vertical 9:16, main visual interest in the upper and lower thirds,
CENTER-BOTTOM AREA MUST STAY VISUALLY CALM (a game board is drawn on top of it).
NEGATIVE: no text, no letters, no numbers, no logos, no watermark, no UI,
no human faces, no fantasy elements (no castles, no dragons, no crystals,
no magic, no candy, no treasure chests, no angels), no fruit, no photorealism.
```

**Critério de aceite comum a toda imagem de fundo:**
1. Contraste ≥ 3:1 entre o terço central-inferior e as peças do tabuleiro
2. Zero elemento de fantasia genérica (regra permanente do `CLAUDE.md`)
3. Zero texto renderizado
4. Sem rosto humano identificável (silhuetas são aceitas)
5. ≤ 400 KB depois de comprimir

## A.1 — Preparação

| ID | Tarefa | Quem | Prio |
|---|---|---|---|
| A-01 | Escrever o art bible (paleta, estilo, do/don't ODS12) | [CC] | P0 |
| A-02 | Criar `assets/map/worlds/` e definir convenção de nome | [CC] | P0 |
| A-03 | Escolher a ferramenta de geração e travar a seed/estilo | [VOCÊ] | P0 |
| A-04 | Gerar **1 imagem-piloto** (Mundo 1, fundo de jogo) e validar in-game antes de gerar as outras 19 | [VOCÊ] | P0 |

> **A-04 é um portão.** Não gere as 20 imagens antes de ver uma rodando no
> aparelho — o custo de refazer 20 é 20×.

## A.2 — Prompts por mundo

Cada mundo precisa de **2 imagens**: fundo de mapa (tela de seleção) e fundo de
jogo (tela onde se joga). Prompt = `bloco de estilo` + `bloco de cena` abaixo.

### Mundo 1 — Parque da Coleta Seletiva
```
SCENE: a sunny urban public park with a selective-collection ecopoint;
five color-coded recycling bins (red, blue, green, yellow, brown) under a
wooden shelter, trimmed grass, paved walking path, park benches, leafy trees,
morning light, hopeful and inviting mood.
```
| ID | Arquivo | Tipo | Quem |
|---|---|---|---|
| A-05 | `assets/map/worlds/w01_parque_map.png` | Fundo de mapa | [CC→VOCÊ] |
| A-06 | `assets/map/worlds/w01_parque_game.png` | Fundo de jogo | [CC→VOCÊ] |

### Mundo 2 — Vale da Reciclagem
```
SCENE: a green valley with a recycling facility nested in the hillside;
conveyor belts running between low industrial sheds, stacked color-sorted bales,
winding road, distant hills, mid-morning haze, industrious but clean mood.
```
| ID | Arquivo | Tipo | Quem |
|---|---|---|---|
| A-07 | `assets/map/worlds/w02_vale_map.png` | Fundo de mapa | [CC→VOCÊ] |
| A-08 | `assets/map/worlds/w02_vale_game.png` | Fundo de jogo | [CC→VOCÊ] |

### Mundo 3 — Central de Materiais
```
SCENE: interior of a material recovery facility; tall stacks of compressed
bales sorted by color, overhead skylights casting light shafts, sorting tables,
forklift silhouette, industrial but orderly, cool neutral palette with
color-coded accents.
```
| ID | Arquivo | Tipo | Quem |
|---|---|---|---|
| A-09 | `assets/map/worlds/w03_central_map.png` | Fundo de mapa | [CC→VOCÊ] |
| A-10 | `assets/map/worlds/w03_central_game.png` | Fundo de jogo | [CC→VOCÊ] |

### Mundo 4 — Viveiro Comunitário
```
SCENE: a community plant nursery built from reused materials; seedlings growing
in cut plastic bottles and tin cans on wooden shelves, a shade cloth overhead,
raised beds made from pallets, watering cans, warm afternoon light, green and
terracotta palette, nurturing mood.
```
| ID | Arquivo | Tipo | Quem |
|---|---|---|---|
| A-11 | `assets/map/worlds/w04_viveiro_map.png` | Fundo de mapa | [CC→VOCÊ] |
| A-12 | `assets/map/worlds/w04_viveiro_game.png` | Fundo de jogo | [CC→VOCÊ] |

### Mundo 5 — Usina de Compostagem
```
SCENE: an industrial composting yard; long dark compost windrows with gentle
steam rising, a biodigester tank, turning machinery, wood chip piles, earthy
brown and moss green palette, soft overcast light, warm organic mood.
```
| ID | Arquivo | Tipo | Quem |
|---|---|---|---|
| A-13 | `assets/map/worlds/w05_usina_map.png` | Fundo de mapa | [CC→VOCÊ] |
| A-14 | `assets/map/worlds/w05_usina_game.png` | Fundo de jogo | [CC→VOCÊ] |

### Mundo 6 — Cooperativa dos Catadores
```
SCENE: a waste-picker cooperative yard; hand carts and pushcarts parked in rows,
color-sorted material bales, a corrugated metal workshop with open doors,
hanging work aprons, hand-painted signage shapes (no readable text), warm
late-afternoon light, dignified community-work mood, human silhouettes only.
```
| ID | Arquivo | Tipo | Quem |
|---|---|---|---|
| A-15 | `assets/map/worlds/w06_cooperativa_map.png` | Fundo de mapa | [CC→VOCÊ] |
| A-16 | `assets/map/worlds/w06_cooperativa_game.png` | Fundo de jogo | [CC→VOCÊ] |

### Mundo 7 — Rota da Logística Reversa
```
SCENE: a reverse-logistics route; a highway curving toward a distribution hub,
delivery trucks carrying stacked returnable crates, roadside collection points
with color-coded containers, overpass, dusk sky with long shadows, blue and
amber palette, motion and flow mood.
```
| ID | Arquivo | Tipo | Quem |
|---|---|---|---|
| A-17 | `assets/map/worlds/w07_rota_map.png` | Fundo de mapa | [CC→VOCÊ] |
| A-18 | `assets/map/worlds/w07_rota_game.png` | Fundo de jogo | [CC→VOCÊ] |

### Mundo 8 — Fórum da Economia Circular
```
SCENE: a civic plaza built for public debate about circular economy; a circular
amphitheater of stone steps, tall banner poles with blank colored flags,
a large circular arrow motif inlaid in the pavement, planted trees in reused
containers, clear midday light, blue and stone palette, deliberative civic mood.
```
| ID | Arquivo | Tipo | Quem |
|---|---|---|---|
| A-19 | `assets/map/worlds/w08_forum_map.png` | Fundo de mapa | [CC→VOCÊ] |
| A-20 | `assets/map/worlds/w08_forum_game.png` | Fundo de jogo | [CC→VOCÊ] |

### Mundo 9 — Oficina do Reparo
```
SCENE: a community repair workshop; workbenches with half-disassembled
appliances, toasters and radios opened up, pegboard walls of hand tools,
labeled parts drawers, a desk lamp pool of warm light, sawdust motes in the air,
amber and steel palette, careful hands-on mood.
```
| ID | Arquivo | Tipo | Quem |
|---|---|---|---|
| A-21 | `assets/map/worlds/w09_oficina_map.png` | Fundo de mapa | [CC→VOCÊ] |
| A-22 | `assets/map/worlds/w09_oficina_game.png` | Fundo de jogo | [CC→VOCÊ] |

### Mundo 10 — Cidade Circular
```
SCENE: a sustainable city skyline at golden hour; green rooftops and rooftop
gardens, solar panels, wind turbines on the horizon, a tram line, tree-lined
streets with color-coded collection points, a large circular flow motif formed
by the street layout, optimistic and complete mood, full CONAMA color accents.
```
| ID | Arquivo | Tipo | Quem |
|---|---|---|---|
| A-23 | `assets/map/worlds/w10_cidade_map.png` | Fundo de mapa | [CC→VOCÊ] |
| A-24 | `assets/map/worlds/w10_cidade_game.png` | Fundo de jogo | [CC→VOCÊ] |

## A.3 — Arte global (fora dos 10 mapas)

| ID | Tarefa | Quem | Prio | Detalhe |
|---|---|---|---|---|
| A-25 | Ícone do app 1024×1024 | [CC→VOCÊ] | P0 | Hoje 1254×1254, fora do padrão. Símbolo de reciclagem + trinca, sem texto. |
| A-26 | Adaptive icon Android 1024×1024 | [CC→VOCÊ] | P0 | Elemento dentro do círculo de 66%. `backgroundColor` hoje é `#4B148C` (roxo — reavaliar, não é cor CONAMA). |
| A-27 | Splash screen | [CC→VOCÊ] | P1 | `SplashIntroScreen.tsx` tem 537 linhas — conferir o que já é desenhado em código. |
| A-28 | Selo de marco "Descanso" 320×320 | [CC→VOCÊ] | P1 | Substitui `forest_rest_cart.png` (carrinho de floresta, tema antigo). Proposta: carrinho de catador. |
| A-29 | Selo de marco "Loja" 320×320 | [CC→VOCÊ] | P1 | Hoje `map_shop.png` |
| A-30 | Selo de marco "Guardião" 320×320 | [CC→VOCÊ] | P1 | Não existe hoje |
| A-31 | Marcador de portal entre mundos 320×320 | [CC→VOCÊ] | P1 | Hoje `forest-portal-rune` (runa — fantasia). Proposta: seta de ciclo. |
| A-32 | Nós de fase (bloqueado/atual/completo) | [CC→VOCÊ] | P2 | `map_level_locked/current/complete.png`. Avaliar se vira SVG em código. |
| A-33 | Comprimir todos os PNGs para ≤ 400 KB | [VOCÊ] | P1 | Total atual em `assets/`: ~50 MB. `map_world1_scene_bg.png` sozinho tem 5,8 MB. Usar `pngquant`/`oxipng`/TinyPNG. |
| A-34 | Remover `Identidade visual de TrincaMania.png` da raiz | [CC] | P1 | 6 MB versionados na raiz do projeto, duplicata byte-idêntica de `map_world1_scene_bg.png`. |
| A-35 | Remover os 6 arquivos `.png.png` duplicados | [CC] | P1 | `map_bonus_bg.png.png`, `map_shop.png.png`, `map_path_pieces_*.png.png` etc. |
| A-36 | Integrar cada asset entregue no código | [VOCÊ→CC] | P0 | `campaignMapAssets.ts` + `getGameBackground` em `GameScreen.tsx` |

---

# BLOCO S — Som dos 10 mapas

**Spec**: MP3, loop contínuo sem emenda audível, 30–60 s, mono ou estéreo,
128 kbps, ≤ 800 KB. Sem trilha melódica forte (o jogo é de concentração).
Referência de volume: os `ambient_*.mp3` existentes.

| ID | Arquivo | Mundo | Descrição | Quem |
|---|---|---|---|---|
| S-01 | `ambient_parque.mp3` | 1 · Parque | Pássaros distantes, folhas, passos ocasionais | [CC→VOCÊ] |
| S-02 | `ambient_vale.mp3` | 2 · Vale | Esteira ao longe, vento de vale, maquinário abafado | [CC→VOCÊ] |
| S-03 | `ambient_central.mp3` | 3 · Central | Galpão amplo, eco, prensa distante, ventilação | [CC→VOCÊ] |
| S-04 | `ambient_viveiro.mp3` | 4 · Viveiro | Regador, insetos, lona ao vento | [CC→VOCÊ] |
| S-05 | `ambient_usina.mp3` | 5 · Usina | Zumbido grave de biodigestor, vapor, pá revolvendo | [CC→VOCÊ] |
| S-06 | `ambient_cooperativa.mp3` | 6 · Cooperativa | Carrinho de metal, fardos, vozes distantes indistintas | [CC→VOCÊ] |
| S-07 | `ambient_rota.mp3` | 7 · Rota | Rodovia distante, caminhão manobrando, engradado | [CC→VOCÊ] |
| S-08 | `ambient_forum.mp3` | 8 · Fórum | Praça aberta, murmúrio cívico, bandeira ao vento | [CC→VOCÊ] |
| S-09 | `ambient_oficina.mp3` | 9 · Oficina | Chave de fenda, gaveta de peças, ferro de solda | [CC→VOCÊ] |
| S-10 | `ambient_cidade.mp3` | 10 · Cidade | Bonde, cidade calma, folhagem urbana, sem buzina | [CC→VOCÊ] |

| ID | Tarefa | Quem | Prio |
|---|---|---|---|
| S-11 | Renomear as `AmbientKey` de fantasia | [CC] | P1 |
| S-12 | Remover os 8 `ambient_*.mp3` antigos após substituição | [CC] | P1 |
| S-13 | Integrar os 10 ambientes em `sounds.ts` | [VOCÊ→CC] | P0 |
| S-14 | Revisar SFX de voz (`voice_amazing`, `voice_excellent`…) | [VOCÊ] | P2 |
| S-15 | Teste travando que todo mundo tem ambiente | [CC] | P1 |

---

# BLOCO L — Limpeza de drift ODS12

> Regra permanente do `CLAUDE.md`: sobra de vocabulário de fantasia é **bug de
> conteúdo**. O levantamento abaixo é o que ainda existe hoje.

| ID | Tarefa | Quem | Prio | Onde |
|---|---|---|---|---|
| L-01 | `AmbientKey`: `beach\|celestial\|crystal\|forest\|mountain\|snow\|stars\|volcano` → nomes ODS12 | [CC] | P1 | `src/utils/sounds.ts:32-39` |
| L-02 | `WorldTheme`: `'forest' \| 'mountain' \| 'crystal' \| 'sweet'` → temas ODS12 | [CC] | P1 | `src/types/game.ts:42` |
| L-03 | `identityKey` dos mundos 2–8 e bônus | [CC] | P1 | `worldMapConfigs.ts:227-234` — `vales-montanhosos`, `ruinas-de-cristal`, `praia-dos-tesouros`, `vulcao-doce`, `cidade-das-estrelas`, `neve-cristalina`, `reino-celestial`, `reino-acucarado` |
| L-04 | `BOSQUE_*` (15 ocorrências) | [CC] | P1 | `worldMapConfigs.ts` |
| L-05 | Chaves `forest-*` de asset de mapa | [CC] | P1 | `campaignMapAssets.ts:3-11` |
| L-06 | `ForestRestMapMarker.tsx` → nome ODS12 | [CC] | P1 | 228 linhas |
| L-07 | Nomes de arquivo `assets/map/world1/forest_*.png` | [CC] | P2 | 8 arquivos |
| L-08 | `map_path_pieces_bonus_reino_acucarado.png` | [CC] | P1 | Nome de arquivo com "reino açucarado" |
| L-09 | `map_path_pieces_world1_bosque.png`, `..._world2_vales_montanhosos.png` | [CC] | P2 | |
| L-10 | `assets/map/README_MUNDO_3.txt` | [CC] | P2 | Conferir conteúdo |
| L-11 | Remover os 4 `PATCH-*.md` da raiz | [VOCÊ] | P2 | 96 KB de docs de patch antigos (`PATCH-ANOMALIAS.md` 32 KB, `PATCH-EFEITOS-E-SOM.md` 41 KB, `PATCH-CORRECOES-EFEITOS.md` 13 KB, `PATCH-CORRECOES-EFEITOS-2.md` 9,8 KB) |
| L-12 | Remover `TrincaMania Redesign/patch/APLICAR.md` aninhado | [VOCÊ] | P2 | Diretório aninhado com o mesmo nome do pai |
| L-13 | Escrever o `README.md` de verdade | [CC] | P1 | Hoje tem 13 bytes: `# TrincaMania` |
| L-14 | Decidir `app.json → name` | [VOCÊ] | P0 | Hoje `"TileAdventure-ODS"`; `slug` é `trinca-mania`; o pacote Android é `br.com.mhvtech.trincamania`. Três nomes diferentes. |
| L-15 | Consolidar `COMO_GERAR_APK.md` + `ManualParaGerarApk.txt` | [CC] | P2 | Dois docs sobre a mesma coisa |
| L-16 | Rodar `/code-review` na limpeza | [CC] | P1 | |

---

# BLOCO G — Git, versionamento e convenções

| ID | Tarefa | Quem | Prio | Detalhe |
|---|---|---|---|---|
| G-01 | Adotar Conventional Commits formalmente | [CC] | P1 | Os commits já seguem (`feat:`, `chore:`, `docs:`) — falta travar. |
| G-02 | `commitlint` + `@commitlint/config-conventional` | [CC] | P1 | Rejeita mensagem fora do padrão |
| G-03 | `husky` + hook `commit-msg` | [CC] | P1 | ⚠️ depende de F0-02 (node no PATH) |
| G-04 | `lint-staged` no hook `pre-commit` | [CC] | P1 | Roda eslint + prettier só nos arquivos staged |
| G-05 | Hook `pre-push` com typecheck | [CC] | P2 | Barato e evita CI vermelho |
| G-06 | `release-please` para versionar e gerar CHANGELOG | [CC] | P1 | Lê o log de commits, abre PR de release. Melhor casamento com Expo (integra com `autoIncrement` do EAS). |
| G-07 | Criar `CHANGELOG.md` | [CC] | P1 | Gerado pelo release-please |
| G-08 | Alinhar `package.json:version` ↔ `app.json:version` | [CC] | P1 | Hoje ambos `1.0.0` mas sem sincronia automática |
| G-09 | Definir estratégia de branch | [VOCÊ] | P1 | Hoje só existe `develop`. Propor: `develop` (integração) + `main` (release) + `feat/*`. O CI já espera as duas. |
| G-10 | Branch protection / ruleset em `main` e `develop` | [VOCÊ] | P0 | Exigir PR, checks verdes, sem force-push. |
| G-11 | Template de PR | [CC] | P2 | `.github/PULL_REQUEST_TEMPLATE.md` |
| G-12 | Templates de issue (bug / arte / conteúdo) | [CC] | P2 | `.github/ISSUE_TEMPLATE/` |
| G-13 | `CODEOWNERS` | [CC] | P2 | |
| G-14 | Labels padronizadas | [CC] | P2 | `arte`, `som`, `conteudo`, `automacao`, `devsecops`, `p0/p1/p2` |
| G-15 | Revisar `.gitattributes` | [CC] | P2 | Hoje trata png/jpg/mp3/wav como binário — falta `*.ttf`, `*.otf`, `*.aab`, `*.keystore` |
| G-16 | Git LFS para os PNGs pesados | [VOCÊ] | P2 | Decidir depois de A-33. Com tudo ≤ 400 KB pode não valer. |
| G-17 | `.gitignore`: adicionar `.eas/`, `*.aab`, `coverage/` | [CC] | P2 | |

---

# BLOCO CI — Integração e entrega contínua

## CI.1 — Reforçar o workflow existente

O `ci.yml` atual roda tudo em **um job sequencial**. Se o lint falha, você não
descobre se os testes passariam.

| ID | Tarefa | Quem | Prio | Detalhe |
|---|---|---|---|---|
| CI-01 | Quebrar em jobs paralelos | [CC] | P1 | `lint`, `typecheck`, `test`, `test:ui`, `test:playthrough` |
| CI-02 | Adicionar `concurrency` com cancelamento | [CC] | P1 | Cancela runs antigos do mesmo PR — economiza minutos |
| CI-03 | `timeout-minutes` em todo job | [CC] | P1 | Sem isso um job travado queima 6 h |
| CI-04 | `permissions: contents: read` no topo | [CC] | P0 | Princípio do menor privilégio — hoje o workflow herda tudo |
| CI-05 | Fixar actions por SHA, não por tag | [CC] | P1 | `actions/checkout@v4` → `@<sha>`. Tag é mutável = risco de supply chain. |
| CI-06 | Matrix de Node (20 + 22) | [CC] | P2 | |
| CI-07 | Rodar `npm run format:check` no CI | [CC] | P1 | O script existe e não é usado no CI |
| CI-08 | Rodar `npx expo-doctor` no CI | [CC] | P1 | |
| CI-09 | Cobertura de teste + threshold | [CC] | P1 | `jest --coverage`, falha abaixo do mínimo |
| CI-10 | Publicar relatório de cobertura no PR | [CC] | P2 | |
| CI-11 | Path filters (não rodar teste de código se só mudou `.md`) | [CC] | P2 | |
| CI-12 | Job de validação de assets | [CC] | P2 | Falha se algum PNG > 400 KB entrar no repo |
| CI-13 | Job de guarda ODS12 | [CC] | P1 | Grep barrando `reino\|castelo\|dragão\|cristal mágico\|doce\|pirata\|tesouro\|anjo` em `src/`. Automatiza a regra permanente do `CLAUDE.md`. |

## CI.2 — Build e publicação (EAS)

| ID | Tarefa | Quem | Prio | Detalhe |
|---|---|---|---|---|
| CI-14 | Criar `EXPO_TOKEN` como secret do repo | [VOCÊ] | P0 | `expo.dev` → Access Tokens |
| CI-15 | Migrar `eas.json` para `appVersionSource: "remote"` | [CC] | P1 | Hoje é `"local"`. Remote é o recomendado e habilita auto-incremento. |
| CI-16 | `autoIncrement: true` no perfil `production` | [CC] | P1 | Incrementa `versionCode`/`buildNumber` sozinho |
| CI-17 | Adicionar perfil `development` no `eas.json` | [CC] | P1 | Hoje só existem `preview` e `production` |
| CI-18 | Workflow de build de preview em PR | [CC] | P1 | APK por PR para testar no aparelho |
| CI-19 | Workflow de build de produção em tag | [CC] | P1 | Dispara no tag de release do release-please |
| CI-20 | Configurar EAS Submit para a Play Store | [VOCÊ] | P1 | Exige service account JSON do Google Play |
| CI-21 | `--auto-submit` no build de produção | [CC] | P2 | |
| CI-22 | Configurar EAS Update (OTA) para correção de JS | [CC] | P1 | Correção de bug sem passar pela revisão da loja |
| CI-23 | Avaliar EAS Workflows (`.eas/workflows/`) | [CC] | P2 | Alternativa nativa ao GitHub Actions para o lado mobile |
| CI-24 | Canal de update por branch (`preview`/`production`) | [CC] | P2 | |

---

# BLOCO SEC — DevSecOps

| ID | Tarefa | Quem | Prio | Detalhe |
|---|---|---|---|---|
| SEC-01 | Habilitar CodeQL (JS/TS) | [CC] | P0 | SAST nativo do GitHub, grátis em repo público |
| SEC-02 | Habilitar Secret Scanning + Push Protection | [VOCÊ] | P0 | Settings → Code security. Bloqueia commit de segredo. |
| SEC-03 | Habilitar Dependabot alerts + security updates | [VOCÊ] | P0 | |
| SEC-04 | `dependabot.yml` para npm + github-actions | [CC] | P1 | Atualiza dependência *e* versão de action |
| SEC-05 | Avaliar Renovate no lugar do Dependabot | [VOCÊ] | P2 | Agrupa PRs, respeita ranges do Expo melhor |
| SEC-06 | `npm audit --audit-level=high` no CI | [CC] | P1 | Último commit foi `chore: corrige vulnerabilidades` — automatizar para não repetir manual |
| SEC-07 | `gitleaks` no CI | [CC] | P1 | Varre o histórico, não só o diff |
| SEC-08 | Job de `dependency-review` em PR | [CC] | P1 | Action oficial do GitHub, barra dependência com CVE |
| SEC-09 | Gerar SBOM (CycloneDX) por release | [CC] | P2 | |
| SEC-10 | OpenSSF Scorecard | [CC] | P2 | Nota de maturidade de segurança do repo |
| SEC-11 | Auditar `android.permissions` | [CC] | P1 | Hoje `[]` — confirmar que continua vazio depois de qualquer lib nova |
| SEC-12 | Revisar o plugin `expo-audio` | [CC] | P1 | `microphonePermission: false`, `recordAudioAndroid: false` — está certo, travar em teste |
| SEC-13 | Verificar que nenhum segredo está em `app.json`/`eas.json` | [CC] | P0 | `projectId` é público, tudo bem; conferir o resto |
| SEC-14 | Política de segurança (`SECURITY.md`) | [CC] | P2 | |
| SEC-15 | Rodar `/security-review` antes do release | [CC] | P0 | Skill já disponível |
| SEC-16 | Proteger o keystore Android | [VOCÊ] | P0 | `.gitignore` já barra `*.jks`/`*.p12`/`*.key`. Guardar no EAS credentials, nunca no repo. |
| SEC-17 | Revisar dados coletados (LGPD) | [VOCÊ] | P1 | O jogo usa AsyncStorage local. Se entrar analytics, muda a política. |

---

# BLOCO Q — Qualidade e DX

| ID | Tarefa | Quem | Prio | Detalhe |
|---|---|---|---|---|
| Q-01 | Setup de E2E com **Maestro** | [CC] | P1 | YAML, fora do build, roda em CI. Melhor custo/benefício que Detox aqui. |
| Q-02 | Fluxo E2E: abrir app → mapa → jogar fase 1 → vencer | [CC] | P1 | |
| Q-03 | Fluxo E2E: comprar na loja | [CC] | P2 | |
| Q-04 | Fluxo E2E: perder vida e esperar recarga | [CC] | P2 | |
| Q-05 | Maestro no CI | [CC] | P2 | Emulador Android em GitHub Actions |
| Q-06 | Teste de acessibilidade (labels, touch target ≥ 44px) | [CC] | P1 | `minimumTouchSize: 44` já existe no config de mapa — falta teste |
| Q-07 | Quebrar `GameScreen.tsx` (3166 linhas) | [CC] | P1 | O `CLAUDE.md` já avisa para não deixar crescer |
| Q-08 | Quebrar `LevelSelectScreen.tsx` (1879 linhas) | [CC] | P2 | |
| Q-09 | Quebrar `App.tsx` (1169 linhas) | [CC] | P2 | |
| Q-10 | Orçamento de tamanho de bundle no CI | [CC] | P2 | |
| Q-11 | Perfilar performance em aparelho de entrada | [VOCÊ] | P1 | Depois da arte nova — 20 PNGs novos mudam o consumo de memória |
| Q-12 | ADR sobre a mudança 203 → 100 fases | [CC] | P1 | `docs/adr/0004-*.md`. Os 3 ADRs existentes documentam decisões desse porte. |
| Q-13 | Resolver o gap do Modo Dev | [CC] | P2 | `CLAUDE.md` registra: escreve direto no save real, não é reversível |
| Q-14 | Atualizar `CONTEXT.md` com o vocabulário dos 10 mundos | [CC] | P1 | |

---

# BLOCO R — Release e publicação

| ID | Tarefa | Quem | Prio | Detalhe |
|---|---|---|---|---|
| R-01 | Criar/confirmar a conta Google Play Console | [VOCÊ] | P0 | US$ 25, uma vez |
| R-02 | Definir o nome final do app | [VOCÊ] | P0 | Ver L-14 — hoje há 3 nomes divergentes |
| R-03 | Gerar e guardar o keystore de produção | [VOCÊ] | P0 | Via EAS credentials |
| R-04 | Ficha da loja: título + descrição curta + longa | [CC→VOCÊ] | P0 | Com o enquadramento ODS 12 |
| R-05 | 8 screenshots de telefone | [VOCÊ] | P0 | Mínimo 2, ideal 8. Rodar o app e capturar. |
| R-06 | Feature graphic 1024×500 | [CC→VOCÊ] | P0 | |
| R-07 | Ícone da loja 512×512 | [CC→VOCÊ] | P0 | |
| R-08 | Vídeo de preview (opcional) | [VOCÊ] | P2 | |
| R-09 | Política de privacidade hospedada | [CC→VOCÊ] | P0 | Obrigatória. Como o jogo é offline, é curta. |
| R-10 | Questionário de classificação etária | [VOCÊ] | P0 | |
| R-11 | Data safety form | [VOCÊ] | P0 | Declarar que não coleta dados |
| R-12 | Declarar público-alvo (se < 13 anos, regras extras) | [VOCÊ] | P0 | Jogo educativo tende a atrair criança — atenção às regras de Famílias |
| R-13 | Teste interno (até 100 testadores) | [VOCÊ] | P1 | |
| R-14 | Teste fechado + coletar feedback | [VOCÊ] | P1 | |
| R-15 | Playthrough completo manual das 100 fases | [VOCÊ] | P0 | O `test:playthrough` simula, mas não substitui jogar |
| R-16 | Rodar `/security-review` | [CC] | P0 | |
| R-17 | Tag `v1.0.0` e release | [CC] | P0 | |
| R-18 | Publicar em produção | [VOCÊ] | P0 | |

---

## Ordem de execução recomendada

```
F0 (fundação)
 └─► C.1–C.2 (conteúdo 10×10)  ──┐
 └─► G + CI.1 + SEC (automação)  │  ← paralelos, escopos disjuntos
 └─► A-01..A-04 (art bible +     │
      imagem-piloto)             │
                                 ▼
                          C.3 (testes + migração)
                                 │
                                 ▼
                   A-05..A-24 (as 20 imagens)  ──► A-36 (integrar)
                   S-01..S-10 (os 10 ambientes) ──► S-13 (integrar)
                                 │
                                 ▼
                          L (limpeza ODS12)
                                 │
                                 ▼
                          Q (E2E + refactor)
                                 │
                                 ▼
                          CI.2 (EAS build/submit)
                                 │
                                 ▼
                          R (loja e release)
```

**Caminho crítico**: `F0-01/02 → C-02 → C-11 → C-19..C-26 → A-04 → A-05..A-24 → R-15 → R-18`

**Contagem**: 6 (F0) + 32 (C) + 36 (A) + 15 (S) + 16 (L) + 17 (G) + 24 (CI) +
17 (SEC) + 14 (Q) + 18 (R) = **195 tarefas**.

> C subiu de 30 para 32 quando a decisão de C-08 (mundo bônus fica como 11º
> mapa secreto) desdobrou em C-08a e C-08b.

De longe o maior gargalo é o **Bloco A** — 20 imagens de mapa mais 8 assets
globais, todos dependentes de A-04 (a imagem-piloto validada in-game).

---

## Riscos registrados

| Risco | Impacto | Mitigação |
|---|---|---|
| Perda silenciosa de progresso na migração 203→100 | Alto | C-25 + C-26 antes de qualquer build público. `normalizeProgress` descarta id desconhecido sem avisar. |
| As 20 imagens saírem inconsistentes entre si | Alto | Bloco de estilo compartilhado + portão A-04 antes de gerar em lote |
| Hash congelado ser "consertado" por engano | Médio | C-19 diz explicitamente para recalcular, não deletar a asserção |
| Colisão de nome Mundo 9/10 ↔ Capítulo 9/10 | Médio | C-01 resolve antes de escrever conteúdo |
| Peso do app (assets hoje ~50 MB) | Médio | A-33 (compressão) + CI-12 (guarda automatizada) |
| Hooks de git quebrarem por `node` fora do PATH | Baixo | F0-02 antes de G-03 |
