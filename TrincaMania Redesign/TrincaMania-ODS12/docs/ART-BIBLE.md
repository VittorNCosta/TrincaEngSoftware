# Art bible — TrincaMania ODS 12

Documento de referência para gerar as imagens de fundo dos 10 mundos da
campanha. Consolida em um lugar só o que estava espalhado pelo bloco A do
`ROADMAP-JOGO-COMPLETO.md`: paleta, estilo, especificação técnica, prompt de
cada mundo e critério de aceite.

**Público**: quem for gerar as imagens (A-03/A-04 em diante) e quem for revisar
o resultado antes de entrar no repositório.

**Fonte de verdade de vocabulário**: `CONTEXT.md`. Este arquivo manda em
_aparência_; o `CONTEXT.md` manda em _nome_.

---

## 1. A regra que não se negocia

O jogo é sobre coleta seletiva e consumo responsável (ODS 12). Isso não é um
tema decorativo colado por cima — é o assunto. Toda imagem tem que ser um lugar
real do ciclo dos materiais.

**Nunca aparece** — nem de canto, nem estilizado, nem "só uma referência":

| Proibido                                | Por quê                                                      |
| --------------------------------------- | ------------------------------------------------------------ |
| Castelo, reino, torre de fantasia       | Vocabulário do jogo pré-redesign. Já foi extirpado do código |
| Dragão, criatura mágica, fada           | Idem                                                         |
| Cristal mágico, brilho arcano, runa     | Idem                                                         |
| Doce, açúcar, bala, cupcake             | Idem — e conflita com "consumo responsável"                  |
| Pirata, baú de tesouro, mapa do tesouro | Idem                                                         |
| Anjo, nuvem celestial, portal divino    | Idem                                                         |
| Fruta como tema visual                  | Tema do jogo original. Resíduo orgânico é outra coisa        |
| Texto renderizado (letra, número, logo) | Não localiza, e o jogo é PT-BR                               |
| Rosto humano identificável              | Direito de imagem + estilo. Silhueta é permitida             |
| Fotorrealismo                           | Não combina com o resto da interface                         |

Fruta **existe** no jogo como resíduo orgânico (uma casca numa lixeira marrom é
correta). O que está barrado é fruta como _assunto_ da imagem — o sprite sheet
de frutas do jogo original.

Uma imagem que quebre a lista acima é bug de conteúdo, não questão de gosto.
`scripts/guarda-ods12.js` cobre o nome do arquivo automaticamente; a cena em si
depende desta revisão.

---

## 2. Paleta

### 2.1 CONAMA 275/2001 — obrigatória

Qualquer lixeira, contêiner, fardo, bag ou símbolo de reciclagem desenhado numa
cena usa exatamente estas cores. É a norma brasileira de coleta seletiva e o
jogo ensina ela; errar a cor ensina errado.

| Material      | Cor      | Hex       |
| ------------- | -------- | --------- |
| Plástico      | Vermelho | `#E30613` |
| Papel/papelão | Azul     | `#0055A4` |
| Vidro         | Verde    | `#009640` |
| Metal         | Amarelo  | `#FFD500` |
| Orgânico      | Marrom   | `#7B3F00` |

Essas cinco cores são **acento**, não fundo. Elas têm que ser as coisas mais
saturadas do quadro — é assim que o olho do jogador aprende a associação.

### 2.2 Cor de cena

O fundo de cada mundo tem uma dominante própria (seção 5), sempre
dessaturada em relação aos acentos CONAMA. Regra prática: se um fardo azul de
papel não salta na imagem, o fundo está saturado demais.

---

## 3. Especificação técnica

| Peça                    | Resolução   | Formato          | Referência atual                                   |
| ----------------------- | ----------- | ---------------- | -------------------------------------------------- |
| Fundo de jogo           | 1080 × 1920 | PNG              | `map_world3_game_bg.png`                           |
| Fundo de mapa           | 1080 × 1920 | PNG              | `map_world3_select_bg.png`                         |
| Marcador / selo de mapa | 320 × 320   | PNG transparente | `forest_rest_cart.png`                             |
| Ícone do app            | 1024 × 1024 | PNG              | `assets/icon.png` (hoje 1254 × 1254, fora da spec) |
| Adaptive icon (Android) | 1024 × 1024 | PNG              | elemento dentro do círculo central de 66%          |

**Peso: ≤ 400 KB por imagem depois de comprimir.** Não é sugestão — é o limite
que `scripts/valida-assets.js` cobra (`LIMITE_BYTES`). Arquivo novo acima disso
reprova a verificação. Para comparação, o `map_world1_scene_bg.png` de hoje tem
5,8 MB: sozinho ele pesa mais que os 20 arquivos novos juntos deveriam pesar.

Ilustração vetorial achatada com poucos gradientes comprime muito bem em PNG-8
/ PNG-24 com paleta reduzida. Se não estiver cabendo em 400 KB, quase sempre a
causa é ruído/textura fotográfica na imagem gerada, não a resolução.

---

## 4. Bloco de estilo — colar em todo prompt

Este bloco vai **em todo prompt**, sem editar. É ele que mantém as 20 imagens
parecendo o mesmo jogo.

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

O `CENTER-BOTTOM AREA MUST STAY VISUALLY CALM` é a linha mais importante do
bloco: é em cima do terço central-inferior que o tabuleiro é desenhado. Cena
bonita com detalhe demais ali vira fase ilegível.

**Prompt final = bloco de estilo + a linha `SCENE:` do mundo (seção 5).**

---

## 5. Identidade visual dos mundos

Os nomes vêm de `src/data/worlds.ts` e não mudam por causa de arte — se o nome
do mundo parecer errado, o problema é o `worlds.ts`, não o prompt.

### Mundo 1 — Parque da Coleta Seletiva · `parque`

Dominante verde-claro e luz de manhã.

```
SCENE: sunny urban public park with a selective-collection ecopoint, five
color-coded bins under a wooden shelter, benches, leafy trees, morning light.
```

### Mundo 2 — Vale da Reciclagem · `vale`

Dominante verde-médio com neblina.

```
SCENE: green valley recycling facility, conveyor belts, color-sorted bales,
a winding road, mid-morning haze.
```

### Mundo 3 — Central de Materiais · `central`

Dominante neutra fria (interior industrial).

```
SCENE: interior of a material recovery facility, tall compressed bales,
overhead skylights, sorting tables, forklift silhouette, cool neutral palette.
```

### Mundo 4 — Viveiro Comunitário · `viveiro`

Dominante verde + terracota, tarde.

```
SCENE: community plant nursery built from reused materials, seedlings in cut
bottles and tin cans, shade cloth, pallet raised beds, warm afternoon light,
green and terracotta palette.
```

### Mundo 5 — Usina de Compostagem · `usina`

Dominante marrom-terra + verde-musgo, céu encoberto.

```
SCENE: industrial composting yard, compost windrows with rising steam,
biodigester tank, wood chip piles, earthy brown and moss green, overcast sky.
```

### Mundo 6 — Cooperativa dos Catadores · `cooperativa`

Dominante quente de fim de tarde. **Este é o mundo mais sensível da lista**: a
cena retrata trabalho real de catador. Tem que ler como oficina digna e
organizada, nunca como lixão. Só silhuetas humanas.

```
SCENE: waste-picker cooperative yard, hand carts lined up in rows, color-sorted
bales, corrugated metal workshop, hanging work aprons, hand-painted signage
shapes with no readable text, warm late-afternoon light, dignified
community-work mood, human silhouettes only.
```

### Mundo 7 — Rota da Logística Reversa · `rota`

Dominante azul + âmbar, entardecer.

```
SCENE: reverse-logistics route, highway curving toward a distribution hub,
trucks with returnable crates, roadside collection points, an overpass, dusk,
blue and amber palette.
```

### Mundo 8 — Fórum da Economia Circular · `forum`

Dominante azul + pedra, meio-dia.

```
SCENE: civic plaza for a circular-economy debate, circular stone amphitheater,
banner poles with blank colored flags, circular arrow motif inlaid in the
pavement, trees in reused containers, midday light, blue and stone palette.
```

### Mundo 9 — Distrito da Reindustrialização · `distrito`

Dominante aço + âmbar (calor do forno).

```
SCENE: industrial remanufacturing district, hydraulic baling presses, conveyor
lines, orange glow of a re-melting furnace, extrusion towers, gantry cranes,
steel and amber palette.
```

### Mundo 10 — Cúpula da Reciclagem Global · `cupula`

Dominante clara, com os cinco acentos CONAMA presentes — é o mundo de
fechamento e o único onde a paleta inteira aparece de propósito.

```
SCENE: global recycling summit, domed assembly hall, tiered delegate seating,
projected world map and target dashboards, daylight through a glass dome,
circular flow motif in the floor mosaic, full CONAMA color accents.
```

### Mundo bônus 21 — Jardim Renascido

**Fora dos 20 arquivos do bloco A.** Não tem prompt definido e continua usando
`assets/map/map_bonus_bg.png` (arte antiga, 2,5 MB). Dívida conhecida — quando
entrar na fila, ganha entrada própria aqui e um `w21_jardim_*` seguindo a mesma
convenção.

---

## 6. Critério de aceite

Vale para toda imagem de fundo, sem exceção. Uma reprovação basta para
devolver.

1. **Contraste ≥ 3:1** entre o terço central-inferior e as peças do tabuleiro.
2. **Zero elemento de fantasia genérica** (a tabela da seção 1).
3. **Zero texto renderizado** — nenhuma letra, número ou logo legível.
4. **Sem rosto humano identificável.** Silhueta passa.
5. **≤ 400 KB** depois de comprimir.

Os itens 3 e 5 dá para conferir sozinho; o 1 e o 4 exigem olhar a imagem; o 2 é
o que mais escapa, porque modelo de imagem puxa fantasia por padrão quando o
prompt fala em "mundo".

---

## 7. Onde o arquivo entra no código

Os 20 arquivos vão para `assets/map/worlds/` seguindo a convenção do
`README.md` de lá. Depois de gerados, os dois pontos de ligação são:

- **Fundo de jogo** → `getGameBackground(worldId)` em
  `src/screens/GameScreen.tsx`. Hoje é um `switch` que reaproveita 4 PNGs para
  os 10 mundos (mundos 2/5/7/9 dividem um, 3/6/8/10 dividem outro).
- **Fundo de mapa** → `LEGACY_CAMPAIGN_MAP_ASSETS` em
  `src/data/campaignMapAssets.ts`, chaves `legacy-world-2` … `legacy-world-10`.
  Mesmo reaproveitamento.

Ou seja: hoje **8 dos 10 mundos não têm arte própria**. Cada par de arquivos
novo substitui uma entrada dessas duas tabelas — não precisa de refatoração,
só de trocar o `require`.

Os PNGs antigos (`map_world1_bg.png`, `map_world2_bg.png`, …) só podem ser
apagados quando **nenhuma** das duas tabelas apontar mais para eles;
`scripts/valida-assets.js` acusa se sobrar órfão.

---

## 8. O portão A-04

> **Não gere as 20 imagens antes de ver uma rodando no aparelho.**

O A-04 pede uma imagem-piloto (Mundo 1, fundo de jogo) validada in-game antes
de qualquer produção em lote. O motivo é aritmético: se o estilo estiver errado,
o custo de refazer 20 é 20×. Coisas que só aparecem no aparelho e nunca na
prévia do gerador:

- o tabuleiro em cima do terço central-inferior (o critério 1);
- como a imagem sobrevive ao corte em telas mais estreitas ou mais altas que 9:16;
- se os acentos CONAMA continuam legíveis com a interface por cima.

---

## Referências

- `docs/ROADMAP-JOGO-COMPLETO.md`, bloco A — a fila de tarefas de arte.
- `CONTEXT.md` — glossário do domínio; manda no nome das coisas.
- `CLAUDE.md` — a regra permanente ODS 12.
- `assets/map/worlds/README.md` — convenção de nome dos 20 arquivos.
- CONAMA 275/2001 — a resolução que fixa o código de cores.
