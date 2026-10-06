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

| Peça                    | Resolução   | Formato          | Referência atual                                    |
| ----------------------- | ----------- | ---------------- | --------------------------------------------------- |
| Fundo de jogo           | 1080 × 1920 | PNG              | `assets/map/worlds/w03_central_game.png`            |
| Fundo de mapa           | 1080 × 1920 | PNG              | `assets/map/worlds/w03_central_map.png`             |
| Marcador / selo de mapa | 320 × 320   | PNG transparente | `assets/ui/visuais/rest.png`                        |
| Ícone do app            | 1024 × 1024 | PNG              | `assets/icon.png` (1024 × 1024 no inventário atual) |
| Adaptive icon (Android) | 1024 × 1024 | PNG              | elemento dentro do círculo central de 66%           |

**Peso: ≤ 400 KB por imagem depois de comprimir.** Não é sugestão — é o limite
que `scripts/valida-assets.js` cobra (`LIMITE_BYTES`). Arquivo novo acima disso
reprova a verificação. Em 06/10/2026, o inventário local registra todos os 149
assets dentro desse teto após compressão. Isso não comprova resolução ou
aceite visual: os 20 fundos permanecem menores que 1080 × 1920, e
`assets/ui/visuais/shop_locked.png` mede 300 × 300 em vez de 320 × 320.

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

### Mundo bônus 21 — Jardim Renascido · `jardim`

Dominante rosa-dourada de amanhecer — é o único mundo com `theme: 'rosado'` em
`worlds.ts`, e a arte acompanha. Conteúdo opcional (destrava com 3 estrelas no
Mundo 1), então este par fica **fora do lote crítico** A-05…A-24: são as tarefas
A-24a e A-24b, em P1.

O assunto é terreno degradado que virou jardim — o fecho otimista do ciclo, e o
único mundo onde flor é o elemento principal. Cuidado com o nome: "renascido" é
recuperação de área, não fantasia. Nada de brilho mágico, portal ou fada.

```
SCENE: a former degraded lot reclaimed as a community garden, flowering beds
laid out over recovered ground, raised planters built from reused pallets and
crates, a rainwater cistern, compost bins, butterflies and pollinators, soft
pink and gold dawn light.
```

Em 06/10/2026, o mundo 21 reutiliza os fundos do Viveiro (`w04_viveiro_*`).
O capítulo 10 usa a família da Cúpula (`w10_cupula_*`); `map_bonus_bg.png` já
foi removido. O par do Jardim continua pendente e não substitui o Viveiro.

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

Os arquivos vão para `assets/map/worlds/`, seguindo o `README.md` da pasta.
Estado técnico confirmado em 06/10/2026:

- `WORLD_VISUAL_ASSETS`, em `src/data/worldVisualAssets.ts`, registra os 20
  fundos próprios dos mundos 1–10, com caminhos literais de mapa e jogo.
- `GameScreen.tsx` resolve `getGameBackground(worldId)` pelo registro único.
- `campaignMapAssets.ts` usa o mesmo registro para a campanha e capítulos.
  As famílias 101–110 correspondem a 1–10; o bônus 21 reutiliza o Viveiro.
- Os dois fundos próprios do Jardim (A-24a/A-24b) ainda não existem.

Os 20 PNGs foram decodificados com verificação de CRC e têm referências
válidas. Todos cabem no teto, mas **nenhum atende à resolução 1080×1920**:
as dimensões encontradas incluem 512×910, 576×1024 e 640×1138. Não mudar a
especificação para fazer a auditoria passar. Corrigir resolução e aprovar
contraste/recorte no Android antes de considerar os aceites de arte concluídos.

O teste de `getGameBackground` agora executa a função da tela e exige arquivo
próprio por mundo; não depende mais de um `switch` que já foi removido.
Inventário reproduzível: `node scripts/inventariar-arte.cjs`. Evidências:
`docs/arte/inventario-20261006.json` e `docs/arte/galeria-20261006.html`.

Remover um fundo antigo apenas depois de confirmar ausência de referências
na campanha, nos capítulos e na partida; manter backup antes da remoção.

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

Prompts completos para o ChatGPT Imagens (produção, ajustes e revisão opcional):
`docs/arte/PROMPTS-IMAGENS-20261006.txt`. Começar pelo piloto A-04.
