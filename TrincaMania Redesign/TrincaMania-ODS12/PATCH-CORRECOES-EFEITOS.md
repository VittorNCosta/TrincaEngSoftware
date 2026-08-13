# Correções — efeitos aplicados (5 bugs)

Todos os cinco vêm da mesma família de causa: **z-order no Android** e **animação
interrompida pelo toque seguinte**. Nenhuma correção mexe em regra de jogo, storage, tipos,
dados de fase ou som.

Regras de sempre: sem dependência nova, trecho de "procurar" exato — se não bater, **pare e
me mostre**. No fim, `npm run typecheck` e a lista do que mudou.

Diagnóstico curto de cada um:

| # | sintoma | causa |
| --- | --- | --- |
| C1 | peça invisível na bandeja (diz 3/6, mostra 2) | `onComplete` do voo não dispara quando um toque novo substitui o evento; o id fica preso em `hiddenTrayTileIds` |
| C2 | peça "vai para atrás da tela" no voo | no Android, `elevation` vence `zIndex`: as camadas de efeito têm `zIndex` mas **nenhuma** tem `elevation`, e o tabuleiro/bandeja têm |
| C3 | não dá para ver o efeito da trinca | mesma causa do C2 (o estouro acontece atrás do dock da bandeja) + duração curta demais |
| C4 | selo "TRINCA!" colado na borda esquerda, sobre "BANDEJA x/y" | o selo é posicionado no centro do grupo consumido; quando a trinca cai nos primeiros encaixes ele sai da tela |
| D5 | bandeja fica leitosa e some as peças no flash da trinca | o `flashLayer` que criamos ficou com `zIndex: 1`, acima dos encaixes |

---

## C1 — peça invisível na bandeja

Em `src/screens/GameScreen.tsx`, procure o efeito que limpa o destaque da peça (é um
`useEffect` curto, logo antes do de `highlightedTileId`):

~~~tsx
  useEffect(() => {
    if (!highlightedTrayKind) {
      return undefined;
    }

    const timeout = setTimeout(() => {
      setHighlightedTrayKind(undefined);
    }, 520);

    return () => clearTimeout(timeout);
  }, [highlightedTrayKind]);
~~~

E **acrescente logo abaixo dele**:

~~~tsx
  // Rede de segurança do voo da peça. A peça sai da bandeja enquanto voa e só
  // volta no `onComplete` do FlyingTileOverlay — que NÃO dispara quando um toque
  // novo substitui o evento no meio do voo (`animation.stop()` devolve
  // `finished: false`). Sem isso o id fica preso em hiddenTrayTileIds e a peça
  // fica invisível na bandeja para sempre, com o contador certo.
  useEffect(() => {
    if (hiddenTrayTileIds.length === 0) {
      return undefined;
    }

    const timeout = setTimeout(() => {
      setHiddenTrayTileIds([]);
    }, TILE_FLY_DURATION_MS + 240);

    return () => clearTimeout(timeout);
  }, [hiddenTrayTileIds]);
~~~

`TILE_FLY_DURATION_MS` já está importado no arquivo (vem de `../components/FlyingTileOverlay`).
Se não estiver, acrescente ao import existente desse módulo.

---

## C2 — a peça voando atrás da tela

No Android, quando dois irmãos se sobrepõem, quem manda é `elevation`, não `zIndex`. As peças
do tabuleiro usam `elevation: tile.z + 3`, o dock da bandeja e a HUD herdam `elevation` de
`shadows.card`/`shadows.button` — e **nenhuma camada de efeito tem `elevation`**. Resultado:
tudo que voa passa por baixo do cenário.

São quatro arquivos, sempre a mesma linha nova ao lado do `zIndex`.

**`src/components/FlyingTileOverlay.tsx`** — procure:

~~~ts
  flying: {
    height: TILE_SIZE,
    position: 'absolute',
    width: TILE_SIZE,
    zIndex: 40,
  },
~~~

Troque por:

~~~ts
  flying: {
    elevation: 40,
    height: TILE_SIZE,
    position: 'absolute',
    width: TILE_SIZE,
    zIndex: 40,
  },
~~~

**`src/components/TripleConsumeEffect.tsx`** — quatro estilos. Procure e troque cada um:

~~~ts
  flash: {
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    borderRadius: radii.pill,
    height: 88,
    position: 'absolute',
    width: 88,
    zIndex: 43,
  },
~~~

~~~ts
  flash: {
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    borderRadius: radii.pill,
    elevation: 43,
    height: 88,
    position: 'absolute',
    width: 88,
    zIndex: 43,
  },
~~~

~~~ts
  particle: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    zIndex: 45,
  },
~~~

~~~ts
  particle: {
    alignItems: 'center',
    elevation: 45,
    justifyContent: 'center',
    position: 'absolute',
    zIndex: 45,
  },
~~~

~~~ts
  ring: {
    borderColor: 'rgba(255, 244, 184, 0.92)',
    borderRadius: radii.pill,
    borderWidth: 3,
    height: 100,
    position: 'absolute',
    width: 100,
    zIndex: 44,
  },
~~~

~~~ts
  ring: {
    borderColor: 'rgba(255, 244, 184, 0.92)',
    borderRadius: radii.pill,
    borderWidth: 3,
    elevation: 44,
    height: 100,
    position: 'absolute',
    width: 100,
    zIndex: 44,
  },
~~~

~~~ts
  tilePosition: {
    height: TILE_SIZE,
    position: 'absolute',
    width: TILE_SIZE,
    zIndex: 42,
  },
~~~

~~~ts
  tilePosition: {
    elevation: 42,
    height: TILE_SIZE,
    position: 'absolute',
    width: TILE_SIZE,
    zIndex: 42,
  },
~~~

No mesmo arquivo, o `stamp` (criado no patch anterior) também precisa — ele é tratado no C4,
já com `elevation`.

**`src/components/ScreenFlash.tsx`** — procure:

~~~ts
  flash: {
    zIndex: 60,
  },
~~~

Troque por:

~~~ts
  flash: {
    elevation: 60,
    zIndex: 60,
  },
~~~

**`src/components/MoveFeedbackEffect.tsx`** — procure:

~~~ts
  layer: {
    alignItems: 'center',
    bottom: 156,
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 24,
  },
~~~

Troque por:

~~~ts
  layer: {
    alignItems: 'center',
    bottom: 156,
    elevation: 24,
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 24,
  },
~~~

---

## C3 — o estouro da trinca é rápido demais

Duas mudanças de tempo. Em `src/components/TripleConsumeEffect.tsx`, procure:

~~~ts
export const TRIPLE_CONSUME_DELAY_MS = 340;
export const TRIPLE_CONSUME_DURATION_MS = 540;
~~~

Troque por:

~~~ts
// 340 era o tempo do voo: as peças mal assentavam antes de serem consumidas.
export const TRIPLE_CONSUME_DELAY_MS = 260;
// 540 dava ~290ms de estouro visível; 820 deixa a coreografia inteira legível.
export const TRIPLE_CONSUME_DURATION_MS = 820;
~~~

**Não** mexa na trava do toque (`visualWaitMs = TILE_FLY_DURATION_MS`): o estouro é decorativo
e continua rodando por cima do tabuleiro já jogável — é isso que mantém o jogo solto.

Mas ele não pode ser **substituído** no meio pela trinca seguinte — hoje
`setTripleConsumeEvent` troca o evento e corta a animação em andamento. Um estouro por vez,
com fila de um, igual à fila de toque.

Em `src/screens/GameScreen.tsx`, procure:

~~~tsx
  const startTripleConsume = (consumeTiles: TripleConsumeTile[], kind: TileKind) => {
    if (consumeTiles.length === 0) {
      return;
    }

    setTripleConsumeEvent({
      id: Date.now() + Math.random(),
      kind,
      tiles: consumeTiles.slice(0, 3),
    });
  };
~~~

Troque por:

~~~tsx
  const startTripleConsume = (consumeTiles: TripleConsumeTile[], kind: TileKind) => {
    if (consumeTiles.length === 0) {
      return;
    }

    const nextEvent: TripleConsumeEvent = {
      id: Date.now() + Math.random(),
      kind,
      tiles: consumeTiles.slice(0, 3),
    };

    // Um estouro por vez. Trocar o evento no meio cortava a animação da trinca
    // anterior — era por isso que não dava para ver o efeito.
    if (isTripleConsumeActiveRef.current) {
      pendingTripleConsumeRef.current = nextEvent;
      return;
    }

    isTripleConsumeActiveRef.current = true;
    setTripleConsumeEvent(nextEvent);
  };

  const finishTripleConsume = () => {
    const pendingEvent = pendingTripleConsumeRef.current;
    pendingTripleConsumeRef.current = undefined;

    if (pendingEvent) {
      setTripleConsumeEvent(pendingEvent);
      return;
    }

    isTripleConsumeActiveRef.current = false;
    setTripleConsumeEvent(undefined);
  };
~~~

Os dois refs novos vão junto dos outros. Procure:

~~~tsx
  const isVisualMoveResolvingRef = useRef(false);
~~~

Troque por:

~~~tsx
  const isVisualMoveResolvingRef = useRef(false);
  const isTripleConsumeActiveRef = useRef(false);
  const pendingTripleConsumeRef = useRef<TripleConsumeEvent | undefined>(undefined);
~~~

Ligue o fim da animação na função nova. Procure:

~~~tsx
          onComplete={() => setTripleConsumeEvent(undefined)}
~~~

Troque por:

~~~tsx
          onComplete={finishTripleConsume}
~~~

E limpe a fila ao recomeçar a fase. Em `resetRoundState`, procure:

~~~tsx
    clearMoveFeedbackStreak();
    unduckAmbient();
~~~

Troque por:

~~~tsx
    clearMoveFeedbackStreak();
    unduckAmbient();
    isTripleConsumeActiveRef.current = false;
    pendingTripleConsumeRef.current = undefined;
~~~

> `TripleConsumeEvent` já é importado no arquivo (vem de
> `../components/TripleConsumeEffect`). Se o import estiver só como tipo de `useState`,
> mantenha — é o mesmo símbolo.

---

## C4 — selo "TRINCA!" saindo pela borda

Hoje o selo é posicionado em `center.x - 66`; quando a trinca cai nos primeiros encaixes ele
sai da tela e cobre o rótulo "BANDEJA x/y". Ele passa a ser centralizado na largura toda.

Em `src/components/TripleConsumeEffect.tsx`, procure:

~~~tsx
      <Animated.View
        style={[
          styles.stamp,
          {
            left: center.x - 66,
            opacity: stampOpacity,
            top: center.y - 78,
            transform: [{ translateY: stampLift }, { scale: stampScale }],
          },
        ]}
      >
        <Text style={styles.stampText}>TRINCA!</Text>
        <View style={styles.stampChip}>
          <Text style={styles.stampChipText}>+3</Text>
        </View>
      </Animated.View>
~~~

Troque por:

~~~tsx
      <Animated.View
        pointerEvents="none"
        style={[
          styles.stampLayer,
          {
            opacity: stampOpacity,
            top: center.y - 92,
            transform: [{ translateY: stampLift }, { scale: stampScale }],
          },
        ]}
      >
        <View style={styles.stamp}>
          <Text style={styles.stampText}>TRINCA!</Text>
          <View style={styles.stampChip}>
            <Text style={styles.stampChipText}>+3</Text>
          </View>
        </View>
      </Animated.View>
~~~

E no `StyleSheet.create`, procure o `stamp`:

~~~ts
  stamp: {
    alignItems: 'center',
    backgroundColor: 'rgba(36, 16, 68, 0.96)',
    borderBottomColor: '#A55D00',
    borderColor: '#FFD35A',
    borderRadius: radii.pill,
    borderWidth: 3,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 3,
    position: 'absolute',
    width: 132,
    zIndex: 46,
  },
~~~

Troque por:

~~~ts
  stamp: {
    alignItems: 'center',
    backgroundColor: 'rgba(36, 16, 68, 0.96)',
    borderBottomColor: '#A55D00',
    borderColor: '#FFD35A',
    borderRadius: radii.pill,
    borderWidth: 3,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 3,
  },
  stampLayer: {
    alignItems: 'center',
    elevation: 46,
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 46,
  },
~~~

Aumentei o `top` de `-78` para `-92`: o selo sobe um pouco mais, para não brigar com a
primeira fileira de encaixes.

A janela visível do selo também abre. Procure:

~~~tsx
  const stampOpacity = consume.interpolate({
    inputRange: [0, 0.16, 0.24, 0.78, 1],
    outputRange: [0, 0, 1, 1, 0],
  });
~~~

Troque por:

~~~tsx
  const stampOpacity = consume.interpolate({
    inputRange: [0, 0.1, 0.18, 0.86, 1],
    outputRange: [0, 0, 1, 1, 0],
  });
~~~

---

## D5 — bandeja leitosa no flash da trinca

O `flashLayer` que criamos no patch de desempenho ficou **acima** dos encaixes. Em
`src/components/Tray.tsx`, procure:

~~~ts
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
    zIndex: 1,
  },
~~~

Troque por:

~~~ts
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
~~~

Sem o `zIndex`, ele volta a pintar na ordem natural — ele é o primeiro filho, então fica
**atrás** dos encaixes e das peças, iluminando a madeira em vez de lavar a bandeja.

---

## Checagem final

1. `npm run typecheck`.
2. Toque numa peça: ela **aparece voando** em arco por cima do tabuleiro e da bandeja, do
   começo ao fim (antes sumia atrás do cenário).
3. Toque em 3 peças bem rápido: o contador "BANDEJA x/y" e a quantidade de peças desenhadas
   têm de bater sempre — nenhuma peça invisível.
4. Feche uma trinca: dá para acompanhar as 3 peças convergindo, o estouro, as estrelas e o
   selo — tudo por cima da bandeja, e o selo centralizado, sem cobrir o rótulo.
5. Feche duas trincas em sequência rápida: a primeira animação **termina**, não é cortada.
6. No flash da trinca a madeira da bandeja clareia, mas as peças dentro dela continuam
   visíveis.

Ao terminar, liste os arquivos alterados e o resultado do typecheck.
