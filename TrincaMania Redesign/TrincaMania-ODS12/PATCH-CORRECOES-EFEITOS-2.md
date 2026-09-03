# Correções 2 — efeitos (4 bugs que sobraram)

O patch anterior errou o alvo em dois pontos. Diagnóstico honesto de cada um antes das edições:

| #   | sintoma                                                                | causa real                                                                                                                                                                                                                                                                                        |
| --- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | peça ainda "vai para trás"; trinca acontece **atrás da bandeja**       | pus `elevation` nos estilos **filhos** das camadas. No Android o `elevation` só ordena irmãos dentro do mesmo pai — e o pai de cada camada (a `View` com `absoluteFill`) continuou com elevation 0, abaixo do dock da bandeja. Elevation de filho não escapa do pai.                              |
| F2  | trinca acontece **no meio da tela**, e em lugar diferente em cada mapa | o efeito é posicionado pela média dos alvos medidos dos encaixes (`traySlotTargetsRef`). Quando um encaixe não foi medido, entra o `getFallbackTarget`, que devolve **o centro da tela** (`height * 0.72`). Com 1 medido e 2 no fallback, a média cai num ponto arbitrário — daí variar por mapa. |
| F3  | ainda parece ter delay ao tocar                                        | o voo dura 340ms com a peça fora da bandeja nesse intervalo                                                                                                                                                                                                                                       |
| F4  | a bandeja **pisca branco**                                             | o `flashLayer` vai a 100% de opacidade num tom claro (`#B0793A`) com borda quase branca (`#FFF0C4`)                                                                                                                                                                                               |

Regras de sempre: sem dependência nova, procurar/trocar exato, se não bater **pare e me
mostre**. No fim `npm run typecheck` e a lista de arquivos.

---

## F1 — `elevation` na camada raiz, não nos filhos

Quatro arquivos. Em cada um, o que ganha `elevation` é a **`View` externa** da camada.

### F1.1 — `src/components/FlyingTileOverlay.tsx`

Procure:

```tsx
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          styles.flying,
```

Troque por:

```tsx
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.layer]}>
      <Animated.View
        style={[
          styles.flying,
```

E no `StyleSheet.create` acrescente:

```ts
  layer: {
    // No Android é o elevation do pai que decide se a camada fica acima do
    // dock da bandeja e das peças do tabuleiro (que têm elevation próprio).
    elevation: 50,
    zIndex: 50,
  },
```

### F1.2 — `src/components/TripleConsumeEffect.tsx`

Procure:

```tsx
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {visibleEvent.tiles.map((item, index) => {
```

Troque por:

```tsx
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.layer]}>
      {visibleEvent.tiles.map((item, index) => {
```

E no `StyleSheet.create` acrescente:

```ts
  layer: {
    elevation: 52,
    zIndex: 52,
  },
```

### F1.3 — `src/components/TripleMatchEffect.tsx`

Esse também desenha por cima do tabuleiro. Localize a `View` raiz do `return` (a que usa
`StyleSheet.absoluteFill` ou um estilo de camada com `position: 'absolute'`) e garanta
`elevation: 48` **no estilo dela**, junto do `zIndex` que já existir. Se a raiz não tiver
estilo próprio, crie um:

```ts
  layer: {
    elevation: 48,
    zIndex: 48,
  },
```

Se a estrutura do arquivo não bater com isso, **pare e me mostre o `return`**.

### F1.4 — `src/components/RewardCollectOverlay.tsx`

Mesma coisa. Procure:

```tsx
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
```

Troque por:

```tsx
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.layer]}>
```

E acrescente ao `StyleSheet.create`:

```ts
  layer: {
    elevation: 54,
    zIndex: 54,
  },
```

> Os `elevation` que o patch anterior colocou nos estilos internos (`flying`, `flash`,
> `ring`, `particle`, `tilePosition`, `stampLayer`) podem ficar — eles ordenam as camadas
> entre si. O que faltava era o pai.

---

## F2 — a trinca sempre na bandeja

O efeito precisa de um alvo por encaixe. Em vez de depender de 7 medições que podem não ter
acontecido, passamos a medir **a bandeja inteira uma vez** e derivar a posição de cada
encaixe a partir dela. O alvo medido do encaixe continua tendo prioridade quando existe.

Todas as edições em `src/screens/GameScreen.tsx`.

### F2.1 — ref e estado da bandeja

Procure:

```tsx
const gameAreaRef = useRef<View>(null);
```

Troque por:

```tsx
const gameAreaRef = useRef<View>(null);
const trayDockRef = useRef<View>(null);
```

Procure (junto dos outros `useState` de alvo):

```tsx
const [poppingTrayTileId, setPoppingTrayTileId] = useState<
  string | undefined
>();
```

Troque por:

```tsx
const [poppingTrayTileId, setPoppingTrayTileId] = useState<
  string | undefined
>();
const [trayTarget, setTrayTarget] = useState<WindowTarget | undefined>();
```

### F2.2 — medir a bandeja

Procure:

```tsx
  const reportBoardTileTarget = useCallback((tileId: string, target: WindowTarget) => {
```

E **acrescente logo acima**:

```tsx
// Uma medição só, da bandeja inteira. É o que garante que o estouro da trinca
// aconteça sempre sobre a bandeja, mesmo que nenhum encaixe tenha se medido.
const reportTrayTarget = useCallback(() => {
  requestAnimationFrame(() => {
    trayDockRef.current?.measureInWindow((x, y, width, height) => {
      if (width <= 0 || height <= 0) {
        return;
      }

      setTrayTarget((currentTarget) =>
        currentTarget &&
        currentTarget.x === x &&
        currentTarget.y === y &&
        currentTarget.width === width &&
        currentTarget.height === height
          ? currentTarget
          : { height, width, x, y },
      );
    });
  });
}, []);
```

### F2.3 — derivar o encaixe a partir da bandeja

Procure:

```tsx
const getTraySlotTarget = (tileIndex: number, fallbackTarget?: WindowTarget) =>
  getFallbackTarget(
    traySlotTargetsRef.current[
      Math.max(0, Math.min(activeTrayCapacity - 1, tileIndex))
    ] ?? fallbackTarget,
  );
```

Troque por:

```tsx
const deriveTraySlotTarget = (tileIndex: number): WindowTarget | undefined => {
  if (!trayTarget) {
    return undefined;
  }

  const capacity = Math.max(1, activeTrayCapacity);
  const slotWidth = trayTarget.width / capacity;
  const index = Math.max(0, Math.min(capacity - 1, tileIndex));
  const size = Math.max(24, Math.min(52, slotWidth - 6));

  return {
    height: size,
    width: size,
    x: trayTarget.x + slotWidth * index + slotWidth / 2 - size / 2,
    y: trayTarget.y + trayTarget.height / 2 - size / 2,
  };
};

const getTraySlotTarget = (
  tileIndex: number,
  fallbackTarget?: WindowTarget,
) => {
  const index = Math.max(0, Math.min(activeTrayCapacity - 1, tileIndex));

  // Ordem: encaixe medido → posição derivada da bandeja → fallback antigo.
  // O fallback antigo é o centro da tela, e era ele que jogava a trinca para
  // o meio quando um encaixe não tinha sido medido.
  return getFallbackTarget(
    traySlotTargetsRef.current[index] ??
      deriveTraySlotTarget(tileIndex) ??
      fallbackTarget,
  );
};
```

### F2.4 — ligar a medição no dock

Procure:

```tsx
        <Animated.View style={styles.trayDock}>
```

Troque por:

```tsx
        <Animated.View ref={trayDockRef} onLayout={reportTrayTarget} style={styles.trayDock}>
```

### F2.5 — remedir quando a capacidade muda

A bandeja muda de tamanho ao liberar o encaixe de moeda/bônus. Procure:

```tsx
const gameBackground = useMemo(
  () => getGameBackground(level.worldId),
  [level.worldId],
);
```

E **acrescente logo acima**:

```tsx
useEffect(() => {
  reportTrayTarget();
}, [activeTrayCapacity, reportTrayTarget]);
```

---

## F3 — voo mais curto

Em `src/components/FlyingTileOverlay.tsx`, procure:

```ts
export const TILE_FLY_DURATION_MS = 340;
```

Troque por:

```ts
// 340 deixava a peça fora do tabuleiro e fora da bandeja por tempo demais: lia
// como travamento. 240 continua legível como voo e devolve o toque mais rápido.
export const TILE_FLY_DURATION_MS = 240;
```

A trava do toque usa essa mesma constante, então ela encurta junto — sem outra edição.

---

## F4 — a bandeja não pisca mais branco

Em `src/components/Tray.tsx`, procure:

```tsx
<Animated.View
  pointerEvents="none"
  style={[styles.flashLayer, { opacity: flash }]}
/>
```

Troque por:

```tsx
<Animated.View
  pointerEvents="none"
  style={[styles.flashLayer, { opacity: flashOpacity }]}
/>
```

Procure:

```tsx
const scale = flash.interpolate({
  inputRange: [0, 1],
  outputRange: [1, 1.025],
});
```

Troque por:

```tsx
const scale = flash.interpolate({
  inputRange: [0, 1],
  outputRange: [1, 1.025],
});
// Antes ia a 100%: um tampo claro cobrindo a madeira, que lia como flash branco.
const flashOpacity = flash.interpolate({
  inputRange: [0, 1],
  outputRange: [0, 0.42],
});
```

E o estilo. Procure:

```ts
  flashLayer: {
    backgroundColor: '#B0793A',
    borderColor: '#FFF0C4',
    borderRadius: 14,
    borderWidth: 2,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
```

Troque por:

```ts
  flashLayer: {
    // Brilho quente sobre a madeira, sem borda clara: a bandeja acende, não pisca.
    backgroundColor: 'rgba(255, 206, 122, 0.9)',
    borderRadius: 14,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
```

---

## Checagem final

1. `npm run typecheck`.
2. Fase do **mundo 1** e fase do **mundo 2**: em ambas, o estouro da trinca acontece **sobre os
   encaixes da bandeja** — mesma posição nas duas, nunca no meio da tela.
3. O estouro fica **por cima** do dock da bandeja e das peças; nada some atrás do cenário.
4. A peça voando é visível do começo ao fim do arco, por cima de tudo.
5. Ao fechar trinca a madeira da bandeja **acende** em tom quente — sem estouro branco.
6. Toque rápido em várias peças: sem peça invisível na bandeja e sem sensação de travamento.

Ao terminar, liste os arquivos alterados e o resultado do typecheck.
