# Patch de redesign — TrincaMania

Delta entre o build antigo e as telas aprovadas: **1b (HUD), 1c (bandeja), 2a (combinação
completa), tiles jelly, 3 (mapa), 4 (loja no mapa)** e **5 (ícones dos poderes)**.

**Estado em 31/07/2026: só a edição A2 continua pendente.** Tudo o mais já está no repo e
foi removido deste arquivo — A1 (gaveta de poderes), A3 (HUD flutuante), A4 (barra de tempo
slim), A5 (faixa "Missão"), A6 (moldura do tabuleiro), A7 (decoração falsa), A8.1–A8.4
(cenário do mapa fora do ScrollView, com parallax) e a Parte B inteira (os componentes
`PhasePlate`, `ResourcePill`, `Tray`, `BoardTile`, `MapLevelNode`, `ShopMapMarker`,
`PowerIcon`, `PowerDrawer`). O A8.5 foi descartado — o motivo está no fim.

Arquivo tocado pelo que sobrou: `src/screens/GameScreen.tsx`.

**Regras:**

- Não mude lógica de jogo, storage, tipos, dados de fase nem sons. O patch é só visual.
- Não instale dependências. Tudo usa só o que já está no `package.json`.
- Não altere `src/utils/`, `src/data/`, `src/storage/` nem `src/types/`.
- Se o trecho de "procurar" não bater exatamente com o arquivo, **pare e mostre o trecho**
  em vez de improvisar.
- Ao terminar: `npm run typecheck`, corrigindo só erro de compilação.

---

# Pendente

## A2. Washes escurecendo o cenário

O mapa e a fase usam a mesma arte (`map_world1_bg.png`), mas a fase tem duas camadas de
sombra por cima — é por isso que o fundo do jogo parece outro.

No `render`, dentro de `<View pointerEvents="none" style={styles.sceneOverlay}>`, procure:

```tsx
          <View
            style={[
              styles.sceneWash,
              level.worldId === 2 || level.worldId === 5 || level.worldId === 7
                ? styles.sceneWashMountain
                : null,
              level.worldId === 3 || level.worldId === 6 || level.worldId === 8
                ? styles.sceneWashCrystal
                : null,
            ]}
          />
          <View
            style={[
              styles.sceneWashBottom,
              level.worldId === 3 || level.worldId === 6 || level.worldId === 8
                ? styles.sceneWashBottomCrystal
                : null,
              level.worldId === 21 ? styles.sceneWashBottomBonus : null,
            ]}
          />
```

Remova esse trecho inteiro. Depois remova do `StyleSheet.create` os estilos que ficam sem
uso: `sceneWash`, `sceneWashMountain`, `sceneWashCrystal`, `sceneWashBottom`,
`sceneWashBottomCrystal`, `sceneWashBottomBonus`.

Mantenha o `sceneOverlay` e os dois `sceneGlow` — esses são luz, não sombra. O
`sceneWash` do `HomeScreen.tsx` é outro estilo, de outro arquivo: **não mexa nele.**

> Nota: as condições de mundo deste trecho cresceram depois que o patch foi escrito (hoje
> cobrem os mundos 5–8 e o 21). O bloco acima é o código real do repo em 31/07/2026.

---

# Descartado

## A8.5 — densidade das bolhas (não aplicar como estava escrito)

A edição pedia bolha de 70 → 56dp, wrapper de 98×88 → 84×76 e `MAP_NODE_STEP` de 110 → 96,
para caber 7 bolhas por tela em vez de 6.

Os alvos numéricos ainda batem, mas o `MapLevelNode` foi redesenhado depois que o patch foi
escrito e ganhou um `innerDisc` de 50×50, com o comentário: _"50 de 70 mantém a proporção do
3b — o aro colorido precisa desse peso para a bolha ler como verde/dourada de longe"_. Numa
bolha de 56dp com borda de 3dp a caixa interna tem exatamente 50dp: o disco creme preenche a
bolha toda e o aro colorido some. Os selos de check/cadeado (22–23dp) também ficam
desproporcionais.

Se a densidade voltar a ser desejada, o conjunto coerente é: bolha 56, `innerDisc` 40, aros
82 → **68** (mantém os mesmos 6dp de halo de hoje), selos 22/23 → 18/19, `MAP_NODE_STEP` 96
e `NODE_PATH_LEFTS = [128, 34, 214, 62, 200, 40, 228, 76, 206, 132]`.
