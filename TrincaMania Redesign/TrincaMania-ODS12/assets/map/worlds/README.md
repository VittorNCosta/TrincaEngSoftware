# `assets/map/worlds/` — arte nova dos 10 mundos

A consolidação de 06/10/2026 recuperou e integrou os 20 fundos dos mundos 1–10.
O registro `src/data/worldVisualAssets.ts` fornece o mapa e o jogo de cada mundo;
os capítulos 101–110 reutilizam essas famílias. O bônus 21 ainda usa o Viveiro
como placeholder: os dois arquivos `w21_jardim_*` não existem.

Todos os fundos existentes estão abaixo do teto de 400 KiB, mas também abaixo
da resolução 1080×1920 exigida pela art bible. Presença e integração não
comprovam contraste, recorte nem aceite no Android. A-04 permanece pendente.
Veja `docs/arte/inventario-20261006.json` e `docs/arte/galeria-20261006.html`.

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

Os mundos 1–8 compartilham os slugs das `AmbientKey`. Os mundos 9 e 10
ainda reutilizam os ambientes `usina` e `forum`; não têm trilhas próprias.

O mundo 21 é bônus e fica **fora do lote crítico** A-05…A-24 — o par dele é
A-24a/A-24b, em P1. Até chegar a vez, ele reutiliza `w04_viveiro_map.png` e `w04_viveiro_game.png`.

## Ao adicionar um arquivo

1. **≤ 400 KB.** `scripts/valida-assets.js` reprova arquivo novo acima disso.
2. **Ligue no código na mesma leva.** Enquanto nada em `src/` fizer `require`
   do arquivo, ele é órfão — peso puro no APK, e a validação de assets acusa.
   Os dois pontos de ligação estão na seção 7 do `docs/ART-BIBLE.md`.
3. **Apague o PNG antigo** que ele substitui, quando nenhuma tabela apontar
   mais para ele.
4. Rode a verificação: `npm run typecheck && npm test && npm run valida:assets && npm run guarda:ods12`.
