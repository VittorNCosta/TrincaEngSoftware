# `assets/map/worlds/` — arte nova dos 10 mundos

Pasta de destino das imagens de fundo geradas no bloco A do roadmap. Está vazia
de propósito: nada aqui foi gerado ainda.

**Antes de gerar qualquer coisa, leia `docs/ART-BIBLE.md`** — paleta, bloco de
estilo, prompt de cada mundo e critério de aceite. Este arquivo trata só do
nome e do lugar.

## Convenção de nome

```
wNN_<slug>_<map|game>.png
```

| Parte    | Regra                                                                  |
| -------- | ---------------------------------------------------------------------- |
| `wNN`    | id do mundo em `src/data/worlds.ts`, com zero à esquerda (`w01`…`w10`) |
| `<slug>` | identidade do mundo, minúscula e sem acento — a tabela abaixo          |
| `map`    | fundo da tela de seleção de fase (`LevelSelectScreen`)                 |
| `game`   | fundo da tela de jogo (`GameScreen`)                                   |
| extensão | `.png`, uma vez só                                                     |

Sem maiúscula, sem espaço, sem hífen no lugar do `_`, sem `.png.png`. Extensão
duplicada é erro de exportação e `scripts/valida-assets.js` reprova.

O zero à esquerda existe para o `w10` não vir antes do `w02` na ordenação
alfabética da pasta.

## Os 22 arquivos esperados

| Mundo | Nome em `worlds.ts`            | Slug          | Mapa                      | Jogo                       |
| ----- | ------------------------------ | ------------- | ------------------------- | -------------------------- |
| 1     | Parque da Coleta Seletiva      | `parque`      | `w01_parque_map.png`      | `w01_parque_game.png`      |
| 2     | Vale da Reciclagem             | `vale`        | `w02_vale_map.png`        | `w02_vale_game.png`        |
| 3     | Central de Materiais           | `central`     | `w03_central_map.png`     | `w03_central_game.png`     |
| 4     | Viveiro Comunitário            | `viveiro`     | `w04_viveiro_map.png`     | `w04_viveiro_game.png`     |
| 5     | Usina de Compostagem           | `usina`       | `w05_usina_map.png`       | `w05_usina_game.png`       |
| 6     | Cooperativa dos Catadores      | `cooperativa` | `w06_cooperativa_map.png` | `w06_cooperativa_game.png` |
| 7     | Rota da Logística Reversa      | `rota`        | `w07_rota_map.png`        | `w07_rota_game.png`        |
| 8     | Fórum da Economia Circular     | `forum`       | `w08_forum_map.png`       | `w08_forum_game.png`       |
| 9     | Distrito da Reindustrialização | `distrito`    | `w09_distrito_map.png`    | `w09_distrito_game.png`    |
| 10    | Cúpula da Reciclagem Global    | `cupula`      | `w10_cupula_map.png`      | `w10_cupula_game.png`      |
| 21    | Jardim Renascido (bônus)       | `jardim`      | `w21_jardim_map.png`      | `w21_jardim_game.png`      |

Os slugs são os mesmos das `AmbientKey` de `src/utils/sounds.ts` (renomeadas no
L-01/S-11), de propósito: um mundo tem um nome só no código inteiro.

O mundo 21 é bônus e fica **fora do lote crítico** A-05…A-24 — o par dele é
A-24a/A-24b, em P1. Até chegar a vez, ele segue com `map_bonus_bg.png`.

## Ao adicionar um arquivo

1. **≤ 400 KB.** `scripts/valida-assets.js` reprova arquivo novo acima disso.
2. **Ligue no código na mesma leva.** Enquanto nada em `src/` fizer `require`
   do arquivo, ele é órfão — peso puro no APK, e a validação de assets acusa.
   Os dois pontos de ligação estão na seção 7 do `docs/ART-BIBLE.md`.
3. **Apague o PNG antigo** que ele substitui, quando nenhuma tabela apontar
   mais para ele.
4. Rode a verificação: `npm run typecheck && npm test && npm run valida:assets && npm run guarda:ods12`.
