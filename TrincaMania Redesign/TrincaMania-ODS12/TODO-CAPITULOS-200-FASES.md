# Pendências — 200 fases (2 capítulos × 100)

Levantamento do que falta para ter **2 capítulos completos, com arte e som
próprios**, dentro da trilha "Capítulos" (`src/data/chapters.ts`). Escopo
decidido em 2026-08-25: focar nos **2 primeiros capítulos** —
**Capítulo 1 · Aterro Adormecido** e **Capítulo 2 · Rio de Plástico** — que já
somam **200 fases**. A trilha Campanha (203 fases, 8 mundos) fica fora deste
documento; o gap de arte dela já está registrado em `CLAUDE.md`.

Cada afirmação abaixo foi conferida no código nesta data — arquivo e linha
citados para poder reconferir depois de qualquer mudança.

## O que já está pronto (não precisa refazer)

- **Conteúdo e balanceamento das 1000 fases (10 capítulos × 100)**: nomes,
  subtítulos, textos de objetivo, curva de dificuldade, marcos (descanso/loja/
  guardião) — tudo gerado por código em `src/data/chapters.ts` e travado por
  `validateChapters()` + `tests/chapters.test.cjs`. Os 200 primeiros mapas
  (capítulos 1 e 2) já existem e passam nessa validação hoje, sem precisar de
  nenhuma edição de conteúdo.
- **Arte das peças (tiles)**: `src/components/TileIcon.tsx` desenha resíduo,
  lixeira e símbolo em SVG + emoji. Não depende de PNG novo — funciona para
  qualquer capítulo, incluindo os dois alvo.
- **Ícones de interface** (voltar, cadeado, estrela etc.): `GameIcon.tsx`,
  também SVG. Nenhum ícone novo é necessário.
- **Tela de lista de capítulos** (`src/screens/ChaptersScreen.tsx`): grade de
  100 números por capítulo, cor do card e da barra de progresso vêm de
  `getChapterVisualIdentity()` (paleta gerada por código, determinística por
  id). Funciona sem nenhuma imagem — já está pronta para os capítulos 1 e 2.

## O que falta (gap real, verificado no código)

### 1. Fundo de jogo (tela onde o jogador joga a fase)

`getGameBackground()` em
[GameScreen.tsx:314-332](TrincaMania%20Redesign/TrincaMania-ODS12/src/screens/GameScreen.tsx#L314-L332)
só trata `worldId` 1–8 e 21 (mundos da Campanha). Capítulos usam `worldId`
101–110 (`ChapterWorldId`), que caem no `default` e recebem o fundo de
floresta do Mundo 1 (`map_world1_bg.png`) — hoje **todas as 1000 fases de
capítulo mostram o mesmo cenário de floresta antiga**, sem relação com o tema
do capítulo.

**Falta**: 1 imagem de fundo por capítulo-alvo —
- Capítulo 1 (Aterro Adormecido): cenário de aterro sanitário/lixão, luz
  baixa, entulho coberto — combina com os textos de objetivo já escritos
  ("abra a camada de cobertura", "libere as peças presas nas bordas").
- Capítulo 2 (Rio de Plástico): rio poluído por plástico, margem, correnteza —
  combina com "recolha o que a correnteza trouxe".

Dimensão/formato: seguir o padrão dos PNGs já usados em `getGameBackground`
(`assets/map/map_world1_bg.png` etc. — conferir resolução exportada deles
antes de encomendar a arte nova, para não distorcer).

### 2. Som ambiente por capítulo

`AMBIENT_BY_WORLD_ID` em
[sounds.ts:165-174](TrincaMania%20Redesign/TrincaMania-ODS12/src/utils/sounds.ts#L165-L174)
só mapeia `worldId` 1–8. É um `Partial<Record<...>>`, e `playAmbientForWorld`
([sounds.ts:398-407](TrincaMania%20Redesign/TrincaMania-ODS12/src/utils/sounds.ts#L398-L407))
simplesmente **para o som** quando não encontra a chave — hoje os capítulos
jogam em silêncio, sem ambiente nenhum.

**Falta**: 2 arquivos `.mp3` curtos em loop, no padrão dos já existentes em
`assets/sfx/ambient/` (ex. `ambient_forest.mp3`, `ambient_mountain.mp3`):
- `ambient_aterro.mp3` — algo como vento sobre entulho, distante, sem trilha
  melódica forte (mesmo espírito de `ambient_mountain.mp3`).
- `ambient_rio.mp3` — água corrente, tom parecido com `ambient_beach.mp3` mas
  sem sino/gaivota (evitar remeter a praia turística).

### 3. Fundo do mapa-múndi do capítulo (infraestrutura pronta, sem arte real nem uso)

Existe um caminho de código inteiro para mostrar um mapa-múndi por capítulo
(`getWorldMapConfig(101)`/`(102)` em
[worldMapConfigs.ts:235-236](TrincaMania%20Redesign/TrincaMania-ODS12/src/data/worldMapConfigs.ts#L235-L236),
resolvido via `CHAPTER_MAP_ASSETS` em
[campaignMapAssets.ts:33-44](TrincaMania%20Redesign/TrincaMania-ODS12/src/data/campaignMapAssets.ts#L33-L44)),
mas hoje ele:

- **reaproveita os PNGs antigos de fantasia** para todo capítulo (`chapter-map-1`
  → `map_world1_bg.png`, floresta; `chapter-map-2` → `map_world2_bg.png`,
  montanha — nenhum dos dez é arte nova); e
- **não é chamado por lugar nenhum no fluxo real dos capítulos.**
  `ChaptersScreen` navega direto para `GameScreen`
  (`onSelectChapterLevel` → `handleSelectChapterLevel` em `App.tsx:1040-1043`),
  sem passar pela tela que leria `CHAPTER_MAP_ASSETS`
  (`LevelSelectScreen`, que só é usada pela Campanha hoje).

**Decisão pendente** (não é bloqueio, é escolha de escopo): manter esse
mapa-múndi desconectado (o jogador só vê a grade de números do
`ChaptersScreen`, que já funciona sem arte) ou conectá-lo para dar um visual
de "mapa" aos capítulos. Se for conectar, aí sim entra a arte: 1 fundo de
mapa-múndi por capítulo-alvo (`aterro_world_bg.png`, `rio_world_bg.png`),
diferente do fundo de jogo do item 1.

### 4. Marcos (descanso / loja / guardião) — hoje só texto

`MILESTONE_LABEL` em
[ChaptersScreen.tsx:19-23](TrincaMania%20Redesign/TrincaMania-ODS12/src/screens/ChaptersScreen.tsx#L19-L23)
mostra "Descanso", "Loja" ou "Guardião" como texto simples sobre o número da
fase — sem ícone ou selo dedicado. Não é um bloqueio (o jogo funciona assim),
mas é o tipo de polimento visual que normalmente se pede depois que os itens
1–2 estiverem resolvidos.

## Lista de arte a encomendar (mínimo viável — capítulos 1 e 2)

| Arquivo sugerido | Uso | Prioridade |
|---|---|---|
| `assets/map/chapters/aterro_bg.png` | Fundo de jogo, Capítulo 1 | **Obrigatório** |
| `assets/map/chapters/rio_bg.png` | Fundo de jogo, Capítulo 2 | **Obrigatório** |
| `assets/sfx/ambient/ambient_aterro.mp3` | Som ambiente, Capítulo 1 | **Obrigatório** |
| `assets/sfx/ambient/ambient_rio.mp3` | Som ambiente, Capítulo 2 | **Obrigatório** |
| `assets/map/chapters/aterro_world_bg.png` | Fundo do mapa-múndi, Capítulo 1 | Opcional (só se o item 3 for conectado) |
| `assets/map/chapters/rio_world_bg.png` | Fundo do mapa-múndi, Capítulo 2 | Opcional (só se o item 3 for conectado) |
| Selo/ícone de marco (descanso/loja/guardião) | `ChaptersScreen` | Opcional, polimento |

A pasta `assets/map/chapters/` ainda não existe — é sugestão de organização,
para não misturar arte nova com os PNGs legados de `assets/map/`.

## Trabalho de código depois que a arte chegar (não fazer antes)

1. `GameScreen.tsx`: `require()` dos 2 novos PNGs + `case 101` / `case 102` em
   `getGameBackground` (hoje só tem `case 2/5/7`, `3/6/8`, `4`, `21`, default).
2. `sounds.ts`: entradas `aterro`/`rio` em `ambientSources` (perto da linha 73)
   + `101: 'aterro'`, `102: 'rio'` em `AMBIENT_BY_WORLD_ID`.
3. Se o item 3 acima for conectado: trocar os `require()` de `chapter-map-1` e
   `chapter-map-2` em `campaignMapAssets.ts` pelos PNGs novos, e decidir como
   `ChaptersScreen` chega até `LevelSelectScreen` (hoje não chega).
4. Nenhum teste de conteúdo quebra com isso (as 1000 fases continuam geradas
   por código) — mas vale um teste simples travando que `getGameBackground` e
   `getAmbientKeyForWorld` cobrem 101 e 102, para não repetir o silêncio/
   floresta-fantasma se um capítulo novo for adicionado no futuro.

## Fora de escopo deste documento

- **Campanha** (203 fases, 8 mundos + bônus): gap de arte já registrado em
  `CLAUDE.md` ("Gap conhecido e ainda aberto") — mundos ainda usam PNGs de
  floresta/montanha/cristal/doce do jogo original.
- **Capítulos 3–10**: conteúdo e balanceamento já prontos no código (mesma
  garantia dos capítulos 1–2), só não têm arte/som dedicados ainda. Se decidir
  expandir além das 200 fases no futuro, o mesmo receituário deste documento
  se repete por capítulo (1 fundo de jogo + 1 ambiente por tema).

## Estado do repositório (para referência)

- Branch mais atualizada identificada: `feat/ods12-workspace-reconciliation`
  (local = `origin/feat/ods12-workspace-reconciliation`, HEAD `c59b944`).
- **Achado**: este repositório tem dois históricos de commit desconectados —
  `main`/`feat/ods-12-sustentabilidade` (raiz `fe1e97e`, "baseline TrincaMania
  original") e `develop`/`feat/ods12-workspace-reconciliation` (raiz `2a46d11`,
  "first commit"). O conteúdo de domínio de `feat/ods-12-sustentabilidade`
  (regras de reciclagem, `src/domain/recycling/`) já está presente — e mais
  evoluído — na branch atual; não há trabalho órfão a resgatar de lá.
- `develop` local foi criado rastreando `origin/develop` e avançado por
  fast-forward até `c59b944` (9 commits à frente do que está publicado em
  `origin/develop`). **Push ainda não foi feito**: a config local do repositório
  (`core.sshCommand`) aponta para `~/.ssh/id_ed696969_vittor_pessoal`, arquivo
  que não existe — as chaves reais em `~/.ssh/` são
  `id_ed696969_vittor_personal` e `id_ed696969_vittor_work`. Corrigir o nome
  do arquivo (ou apontar para a chave certa) antes de publicar `develop`.
