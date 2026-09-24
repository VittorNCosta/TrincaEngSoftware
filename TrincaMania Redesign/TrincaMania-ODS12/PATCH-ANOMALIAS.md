# Correções — TrincaMania (2 anomalias reportadas)

Aplique as duas partes abaixo neste repositório. O formato é o mesmo do
`TrincaMania Redesign/patch/APLICAR.md`: cada edição traz o trecho exato de **procurar**
e o de **trocar**.

**Regras (iguais às do patch anterior):**

- Não instale dependências. Tudo usa só o que já está no `package.json`.
- Não mude regra de jogo, dados de fase, storage, tipos nem sons. A Parte 1 é visual; a
  Parte 2 é só render/agendamento — nenhuma delas altera o resultado de uma jogada.
- Não altere `src/data/`, `src/storage/`, `src/types/`. De `src/utils/` só `sounds.ts` não é
  tocado; `gameLogic.ts` também não muda.
- Se algum trecho de "procurar" não bater exatamente com o arquivo, **pare e me mostre o
  trecho** em vez de improvisar.
- Ao terminar: `npm run typecheck` e corrija só erro de compilação. Depois liste o que mudou.

---

# Parte 1 — Baú bloqueado com "X" branco

## O que está errado

Duas coisas, e a segunda é a causa raiz:

1. Existe um overlay de barras claras cruzadas sobre o baú (o "X" do print). Ele não está na
   versão do `BonusWorldChestMarker.tsx` que eu li — o build está à frente do repo, ou foi
   adicionado depois. A edição 1.2 substitui o arquivo inteiro, então o overlay morre junto.
2. **Não existe arte de cadeado no app.** Em `src/components/GameIcon.tsx`,
   `normalizeIconName` mapeia `'lock'` → `'key'`. Todo estado bloqueado do jogo (baú, bolha
   de fase, loja, portal de mundo, painel) desenha uma **chave** — e a chave em 17–19dp
   dentro da bolha `neutral` (`#303B60`) vira aquele borrão azul-escuro ilegível que aparece
   no print, nos nós 25.2/25.3 e no canto do baú.

## 1.1 — `src/components/GameIcon.tsx`: cadeado de verdade

### 1.1.a — parar de trocar `lock` por `key`

Procure:

```ts
    case 'lock':
      return 'key';
```

Remova essas duas linhas (o `case 'lock'` sai do `normalizeIconName`; `'lock'` já está na
união `GameIconName`, então nada mais muda de tipo).

### 1.1.b — desenhar o cadeado

Em `IconArtwork`, procure o bloco do `key` (é o único trecho com `cx={23} cy={29}`):

```tsx
{
  name === 'key' ? (
    <>
      <Circle
        cx={23}
        cy={29}
        fill={softFill}
        r={10}
        stroke={ink}
        strokeWidth={7}
      />
      <Path
        d="M32 33h20v8h-6v6h-7v-6h-7z"
        fill={softFill}
        stroke={ink}
        strokeLinejoin="round"
        strokeWidth={6}
      />
      <Circle cx={23} cy={29} fill={ink} r={3} />
    </>
  ) : null;
}
```

Troque por (mantém o `key` e acrescenta o `lock` logo abaixo):

```tsx
{
  name === 'key' ? (
    <>
      <Circle
        cx={23}
        cy={29}
        fill={softFill}
        r={10}
        stroke={ink}
        strokeWidth={7}
      />
      <Path
        d="M32 33h20v8h-6v6h-7v-6h-7z"
        fill={softFill}
        stroke={ink}
        strokeLinejoin="round"
        strokeWidth={6}
      />
      <Circle cx={23} cy={29} fill={ink} r={3} />
    </>
  ) : null;
}

{
  name === 'lock' ? (
    <>
      {/* Arco primeiro, para o corpo do cadeado cobrir a base dele. */}
      <StrokePath
        d="M22 30v-7a10 10 0 0 1 20 0v7"
        fill={softFill}
        ink={ink}
        width={7}
      />
      <Rect
        fill={ink}
        height={26}
        rx={7}
        stroke={ink}
        strokeWidth={6}
        width={40}
        x={12}
        y={28}
      />
      <Rect fill={softFill} height={26} rx={7} width={40} x={12} y={28} />
      <Circle cx={32} cy={38} fill={ink} r={4.4} />
      <Path d="M29.7 40.4h4.6l1.5 7.6h-7.6z" fill={ink} />
    </>
  ) : null;
}
```

`StrokePath`, `Rect`, `Circle` e `Path` já estão importados/definidos no arquivo — nenhum
import novo.

## 1.2 — `src/components/BonusWorldChestMarker.tsx`

**Sobrescreva o arquivo inteiro** com o conteúdo abaixo. Se o seu arquivo tiver ganhado
props novas depois da versão que eu li (`completedCount`, `selected`, `state`, `totalCount`,
`onPress`), **pare e me avise** em vez de sobrescrever.

O que muda no estado bloqueado:

- Sai o overlay de barras cruzadas e sai o véu escuro (`lockShade`) que sujava a arte.
- Sai a bolha `neutral` no canto (aquele disco azul-escuro com a chave ilegível).
- Entra um **cadeado** de 40dp assentado sobre a tampa do baú, com disco de contraste atrás.
- O baú bloqueado sobe de `opacity 0.48` para `0.72` — dá para ver que é o baú roxo.
- A placa mostra o progresso em **segmentos** (0/3) em vez de só o texto, no mesmo idioma
  da barra de progresso da placa de mundo.
- O componente sai memoizado (`memo`) — é a mesma medida da Parte 2.

```tsx
import { memo, useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { GameIcon } from './GameIcon';
import { RewardAssetIcon } from './RewardAssetIcon';
import { colors, fontSizes, radii, shadows, spacing } from '../styles/theme';

type BonusWorldChestState = 'available' | 'claimed' | 'locked';

type BonusWorldChestMarkerProps = {
  completedCount: number;
  selected?: boolean;
  state: BonusWorldChestState;
  totalCount: number;
  onPress: () => void;
};

// Acima disso a placa mostra só o texto: segmento por fase deixaria de ser legível.
const MAX_PROGRESS_SEGMENTS = 6;

const getStateTitle = (state: BonusWorldChestState) => {
  switch (state) {
    case 'available':
      return 'BAÚ ESPECIAL';
    case 'claimed':
      return 'BAÚ COLETADO';
    case 'locked':
    default:
      return 'BAÚ BLOQUEADO';
  }
};

function BonusWorldChestMarkerBase({
  completedCount,
  selected = false,
  state,
  totalCount,
  onPress,
}: BonusWorldChestMarkerProps) {
  const pulse = useRef(new Animated.Value(0)).current;
  const isAvailable = state === 'available';
  const isClaimed = state === 'claimed';
  const isLocked = state === 'locked';
  const showSegments = totalCount > 0 && totalCount <= MAX_PROGRESS_SEGMENTS;

  useEffect(() => {
    if (!isAvailable) {
      pulse.stopAnimation();
      pulse.setValue(0);
      return undefined;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          duration: 820,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          duration: 820,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => animation.stop();
  }, [isAvailable, pulse]);

  const glowOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.42, 0.82],
  });
  const glowScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1.14],
  });
  const chestLift = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -5],
  });
  const chestScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.06],
  });

  return (
    <Pressable
      accessibilityLabel={`${getStateTitle(state)} ${completedCount}/${totalCount}`}
      accessibilityRole="button"
      accessibilityState={{
        disabled: isLocked,
        selected: selected || isAvailable,
      }}
      hitSlop={10}
      onPress={onPress}
      style={({ pressed }) => [
        styles.marker,
        isAvailable ? styles.markerAvailable : null,
        isClaimed ? styles.markerClaimed : null,
        selected ? styles.markerSelected : null,
        pressed ? styles.markerPressed : null,
      ]}
    >
      <View pointerEvents="none" style={styles.shadowPlate} />
      {isAvailable ? (
        <>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.readyGlow,
              {
                opacity: glowOpacity,
                transform: [{ scale: glowScale }],
              },
            ]}
          />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.readyRing,
              {
                opacity: glowOpacity,
                transform: [{ scale: glowScale }],
              },
            ]}
          />
        </>
      ) : null}

      <Animated.View
        style={[
          styles.chestWrap,
          isLocked ? styles.chestWrapLocked : null,
          isClaimed ? styles.chestWrapClaimed : null,
          {
            transform: isAvailable
              ? [{ translateY: chestLift }, { scale: chestScale }]
              : [{ translateY: 0 }, { scale: 1 }],
          },
        ]}
      >
        <RewardAssetIcon
          muted={isLocked}
          name="chestWorld"
          size={82}
          style={styles.chestAsset}
        />
      </Animated.View>

      {/* Bloqueado = cadeado sobre a tampa. Sem véu escuro e sem barras cruzadas: a arte
          do baú continua legível e o estado se lê num relance. */}
      {isLocked ? (
        <View pointerEvents="none" style={styles.lockPlate}>
          <View style={styles.lockDisc} />
          <GameIcon name="lock" size={40} tone="neutral" variant="plain" />
        </View>
      ) : isAvailable ? (
        <View style={styles.readyBadge}>
          <Text style={styles.readyText}>!</Text>
        </View>
      ) : (
        <View style={styles.claimedBadge}>
          <GameIcon name="check" size={17} tone="green" variant="plain" />
        </View>
      )}

      <View
        style={[
          styles.labelPlate,
          isClaimed ? styles.labelPlateClaimed : null,
          isLocked ? styles.labelPlateLocked : null,
        ]}
      >
        <Text numberOfLines={1} style={styles.title}>
          {getStateTitle(state)}
        </Text>
        {showSegments ? (
          <View style={styles.progressRow}>
            {Array.from({ length: totalCount }).map((_, index) => (
              <View
                key={`chest-progress-${index}`}
                style={[
                  styles.segment,
                  index < completedCount ? styles.segmentDone : null,
                ]}
              />
            ))}
            <Text
              style={[styles.progress, isLocked ? styles.progressLocked : null]}
            >
              {completedCount}/{totalCount}
            </Text>
          </View>
        ) : (
          <Text
            numberOfLines={1}
            style={[styles.progress, isLocked ? styles.progressLocked : null]}
          >
            {completedCount}/{totalCount}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

export const BonusWorldChestMarker = memo(BonusWorldChestMarkerBase);

const styles = StyleSheet.create({
  chestAsset: {
    height: 82,
    width: 124,
  },
  chestWrap: {
    alignItems: 'center',
    height: 78,
    justifyContent: 'center',
    marginTop: 2,
    width: 128,
    zIndex: 3,
  },
  chestWrapClaimed: {
    opacity: 0.84,
  },
  chestWrapLocked: {
    opacity: 0.72,
  },
  claimedBadge: {
    alignItems: 'center',
    backgroundColor: '#DDFBEA',
    borderColor: '#FFFFFF',
    borderRadius: radii.pill,
    borderWidth: 2,
    height: 27,
    justifyContent: 'center',
    position: 'absolute',
    right: 9,
    top: 13,
    width: 27,
    zIndex: 6,
    ...shadows.button,
  },
  labelPlate: {
    alignItems: 'center',
    backgroundColor: 'rgba(36, 16, 68, 0.94)',
    borderColor: 'rgba(255, 225, 120, 0.78)',
    borderRadius: 8,
    borderWidth: 2,
    gap: 2,
    minHeight: 37,
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    width: 128,
    zIndex: 4,
  },
  labelPlateClaimed: {
    backgroundColor: 'rgba(38, 68, 67, 0.94)',
    borderColor: 'rgba(220, 255, 242, 0.7)',
  },
  labelPlateLocked: {
    backgroundColor: 'rgba(30, 20, 44, 0.94)',
    borderColor: 'rgba(211, 222, 225, 0.66)',
  },
  // Disco de contraste atrás do cadeado: sem ele o cadeado claro se perde no ouro do baú.
  lockDisc: {
    backgroundColor: 'rgba(10, 18, 30, 0.42)',
    borderRadius: radii.pill,
    height: 46,
    position: 'absolute',
    width: 46,
  },
  lockPlate: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    left: 47,
    position: 'absolute',
    top: 24,
    width: 48,
    zIndex: 5,
  },
  marker: {
    alignItems: 'center',
    height: 132,
    justifyContent: 'flex-start',
    overflow: 'visible',
    paddingTop: 5,
    position: 'relative',
    width: 142,
  },
  markerAvailable: {
    shadowColor: '#FFE178',
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.62,
    shadowRadius: 18,
  },
  markerClaimed: {
    opacity: 0.96,
  },
  markerPressed: {
    opacity: 0.92,
    transform: [{ translateY: 2 }, { scale: 0.98 }],
  },
  markerSelected: {
    transform: [{ scale: 1.02 }],
  },
  progress: {
    color: '#FFF4B8',
    fontSize: 10,
    fontWeight: '900',
    lineHeight: 12,
  },
  progressLocked: {
    color: '#EEF3F1',
  },
  progressRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
  },
  readyBadge: {
    alignItems: 'center',
    backgroundColor: '#42E5A7',
    borderColor: '#DFFFEF',
    borderRadius: radii.pill,
    borderWidth: 2,
    height: 30,
    justifyContent: 'center',
    position: 'absolute',
    right: 8,
    top: 11,
    width: 30,
    zIndex: 6,
    ...shadows.button,
  },
  readyGlow: {
    backgroundColor: 'rgba(255, 225, 120, 0.38)',
    borderRadius: radii.pill,
    height: 104,
    position: 'absolute',
    top: 0,
    width: 132,
    zIndex: 1,
  },
  readyRing: {
    borderColor: 'rgba(255, 244, 184, 0.84)',
    borderRadius: radii.pill,
    borderWidth: 2,
    height: 100,
    position: 'absolute',
    top: 2,
    width: 134,
    zIndex: 2,
  },
  readyText: {
    color: '#073524',
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 20,
  },
  segment: {
    backgroundColor: 'rgba(255, 255, 255, 0.26)',
    borderRadius: radii.pill,
    height: 5,
    width: 16,
  },
  segmentDone: {
    backgroundColor: '#22C88C',
  },
  shadowPlate: {
    backgroundColor: 'rgba(59, 28, 88, 0.42)',
    borderRadius: radii.pill,
    bottom: 30,
    height: 20,
    position: 'absolute',
    width: 112,
    zIndex: 0,
  },
  title: {
    color: colors.inkOnDark,
    fontSize: fontSizes.xs,
    fontWeight: '900',
    lineHeight: 13,
    textAlign: 'center',
  },
});
```

> `markerLocked` (que só tinha `opacity: 0.98`) saiu junto — se o typecheck reclamar de
> algum outro uso dele, me avise.

## 1.3 — `src/components/MapLevelNode.tsx`: bolha bloqueada

O selo da bolha bloqueada é a mesma chave em bolha escura. Procure:

```tsx
{
  locked ? (
    <View style={styles.lockBadge}>
      <GameIcon muted name="key" size={18} tone="neutral" />
    </View>
  ) : null;
}
```

Troque por:

```tsx
{
  locked ? (
    <View style={styles.lockBadge}>
      <GameIcon name="lock" size={17} tone="neutral" variant="plain" />
    </View>
  ) : null;
}
```

`variant="plain"` tira a bolha azul-escura do ícone: o selo claro que já existe
(`lockBadge`) passa a ser a única bolha, com o cadeado desenhado dentro.

## 1.4 — os outros três lugares que desenham chave para "bloqueado"

Todas as trocas são de `'key'` para `'lock'`, uma linha cada.

**`src/components/ShopMapMarker.tsx`** — procure:

```tsx
                name={locked ? 'key' : 'bonus'}
```

Troque por:

```tsx
                name={locked ? 'lock' : 'bonus'}
```

**`src/screens/LevelSelectScreen.tsx`** — procure (portal de mundo):

```tsx
                              name={portalLocked ? 'key' : 'map'}
```

Troque por:

```tsx
                              name={portalLocked ? 'lock' : 'map'}
```

E no painel de fase bloqueada, procure:

```tsx
<GameIcon muted name="key" size={42} tone="neutral" />
```

Troque por:

```tsx
<GameIcon muted name="lock" size={42} tone="neutral" />
```

---

# Parte 2 — Travamento e lentidão ao tocar nas peças

## O que está errado

O vídeo é a tela de jogo (fase 25.2). Três coisas somadas:

1. **Janela morta depois de cada jogada.** Em `handleTilePress`
   (`src/screens/GameScreen.tsx`), `isVisualMoveResolvingRef.current = true` e só volta a
   `false` depois de `await wait(visualWaitMs)`. `visualWaitMs` é `TILE_FLY_DURATION_MS`
   (340ms) numa jogada normal e **`TRIPLE_CONSUME_TOTAL_MS` = 340 + 540 = 880ms** quando
   fecha trinca. Nessa janela todo toque cai no `return` do topo da função: **sem som, sem
   shake, sem nada**. Tocar rápido depois de uma trinca é exatamente o "travado" do vídeo.
2. **Todo o tabuleiro re-renderiza por qualquer motivo.** `GameBoard` chama
   `isTileBlocked(tile, tiles)` para cada peça em cada render (varredura do tabuleiro
   inteiro por peça), `BoardTile`/`TileIcon`/`GameBoard` não são memoizados e os handlers
   trocam de identidade a cada render. Some a isso `findMagicTripleMove(...)` e
   `countRemainingTiles(board)` rodando soltos no corpo do componente.
3. **Dois ticks de 1s re-renderizam a tela inteira.** O cronômetro da fase
   (`setElapsedSeconds`) e o tick de vidas do `App.tsx` (`setLivesNow`). O do `App` dispara
   **mesmo com vidas cheias** (o print mostra "CHEIO"), e o `useEffect` dele tem
   `livesState` e `trayBoostState` nas dependências, então o intervalo é destruído e
   recriado a cada segundo.

As três edições abaixo atacam nessa ordem.

## 2.1 — `src/screens/GameScreen.tsx`: não perder o toque

### 2.1.a — fila de um toque

No corpo do componente, junto dos outros refs, procure:

```tsx
const isVisualMoveResolvingRef = useRef(false);
```

Troque por:

```tsx
const isVisualMoveResolvingRef = useRef(false);
// Toque que chegou enquanto a jogada anterior resolvia. Em vez de descartar
// (que é o "travamento"), guarda o último e reexecuta quando libera.
const queuedTilePressRef = useRef<string | undefined>(undefined);
const handleTilePressRef = useRef<(tileId: string) => Promise<void>>(
  async () => undefined,
);
```

### 2.1.b — enfileirar em vez de descartar

Procure o topo do `handleTilePress`:

```tsx
  const handleTilePress = async (tileId: string) => {
    if (
      status !== 'playing' ||
      isBlockingModalVisible ||
      isMagicTripleRescueVisible ||
      isVisualMoveResolvingRef.current
    ) {
      return;
    }
```

Troque por:

```tsx
  const handleTilePress = async (tileId: string) => {
    if (status !== 'playing' || isBlockingModalVisible || isMagicTripleRescueVisible) {
      return;
    }

    if (isVisualMoveResolvingRef.current) {
      queuedTilePressRef.current = tileId;
      return;
    }
```

### 2.1.c — liberar a trava e consumir a fila num lugar só

Ainda em `handleTilePress`, o `isVisualMoveResolvingRef.current = false` aparece em vários
caminhos de saída. Em **todos** eles, troque:

```tsx
isVisualMoveResolvingRef.current = false;
```

por:

```tsx
releaseVisualMoveLock();
```

E declare o `releaseVisualMoveLock` logo **antes** do `const handleTilePress = async (...)`:

```tsx
const releaseVisualMoveLock = () => {
  isVisualMoveResolvingRef.current = false;

  const queuedTileId = queuedTilePressRef.current;

  if (!queuedTileId) {
    return;
  }

  queuedTilePressRef.current = undefined;
  // Reexecuta na próxima volta do loop, já com board/tray novos em mão.
  setTimeout(() => {
    void handleTilePressRef.current(queuedTileId);
  }, 0);
};
```

E logo **depois** do fim do `handleTilePress`, mantenha a ref apontando para a versão atual
(uma linha, executada a cada render):

```tsx
handleTilePressRef.current = handleTilePress;
```

### 2.1.d — encurtar a janela da trinca

O efeito de consumo da trinca roda numa camada por cima (`TripleConsumeEffect`) e não
depende da trava. Procure:

```tsx
const visualWaitMs = result.removedKind
  ? TRIPLE_CONSUME_TOTAL_MS
  : TILE_FLY_DURATION_MS;
```

Troque por:

```tsx
// A trava só precisa cobrir o voo da peça; o consumo da trinca é decorativo e
// continua rodando por cima do tabuleiro já jogável.
const visualWaitMs = TILE_FLY_DURATION_MS;
```

Mantenha os `await wait(TRIPLE_CONSUME_TOTAL_MS)` dos caminhos de **vitória** e de
**derrota** como estão — lá a espera é para a transição de tela, não para a trava.

Se `TRIPLE_CONSUME_TOTAL_MS` ficar sem uso e o typecheck reclamar do import, **me avise
antes de remover** (ele é usado também nos caminhos de fim de rodada).

### 2.1.e — feedback imediato no toque enfileirado

Em `src/components/BoardTile.tsx`, o `onPress` já dá `playTapFlash()` antes de chamar
`onPress(tile.id)`, então o toque enfileirado continua acendendo a peça. **Não mude nada
aqui.** Confira só que o flash aparece.

## 2.2 — `src/components/GameBoard.tsx`: calcular "bloqueada" uma vez

Substitua o arquivo por:

```tsx
import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { BoardTile } from './BoardTile';
import { Tile } from '../types/game';
import { WindowTarget } from '../types/ui';
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  isTileBlocked,
  isTileRemoved,
} from '../utils/gameLogic';

type GameBoardProps = {
  allowedTileId?: string;
  disabled: boolean;
  highlightedTileId?: string;
  tiles: Tile[];
  onTileLayoutInWindow?: (tileId: string, target: WindowTarget) => void;
  onBlockedTilePress?: () => void;
  onTilePress: (tileId: string) => void;
};

function GameBoardBase({
  allowedTileId,
  disabled,
  highlightedTileId,
  tiles,
  onTileLayoutInWindow,
  onBlockedTilePress,
  onTilePress,
}: GameBoardProps) {
  const orderedTiles = useMemo(
    () =>
      [...tiles].sort((firstTile, secondTile) => firstTile.z - secondTile.z),
    [tiles],
  );
  // Antes isso rodava por peça em cada render: 30 peças x varredura do tabuleiro,
  // em todo tick de 1s e em toda animação. Agora é uma vez por mudança de tabuleiro.
  const blockedTileIds = useMemo(() => {
    const blocked = new Set<string>();

    tiles.forEach((tile) => {
      if (!isTileRemoved(tile) && isTileBlocked(tile, tiles)) {
        blocked.add(tile.id);
      }
    });

    return blocked;
  }, [tiles]);

  return (
    <View style={styles.board}>
      {orderedTiles.map((tile) =>
        isTileRemoved(tile) ? null : (
          <BoardTile
            blocked={blockedTileIds.has(tile.id)}
            disabled={
              disabled ||
              (allowedTileId !== undefined && tile.id !== allowedTileId)
            }
            highlighted={tile.id === highlightedTileId}
            key={tile.id}
            onLayoutInWindow={onTileLayoutInWindow}
            onBlockedPress={onBlockedTilePress}
            onPress={onTilePress}
            tile={tile}
          />
        ),
      )}
    </View>
  );
}

export const GameBoard = memo(GameBoardBase);

const styles = StyleSheet.create({
  board: {
    alignSelf: 'center',
    height: BOARD_HEIGHT,
    position: 'relative',
    width: BOARD_WIDTH,
  },
});
```

## 2.3 — memoizar peça e ícone

**`src/components/BoardTile.tsx`** — procure:

```tsx
import { useCallback, useEffect, useRef } from 'react';
```

Troque por:

```tsx
import { memo, useCallback, useEffect, useRef } from 'react';
```

Procure:

```tsx
export function BoardTile({
```

Troque por:

```tsx
function BoardTileBase({
```

E logo **antes** do `const styles = StyleSheet.create({` do mesmo arquivo, acrescente:

```tsx
export const BoardTile = memo(BoardTileBase);
```

**`src/components/TileIcon.tsx`** — mesma cirurgia. Procure:

```tsx
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  View,
} from 'react-native';
```

Troque por:

```tsx
import { memo } from 'react';
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  View,
} from 'react-native';
```

Procure:

```tsx
export function TileIcon({
```

Troque por:

```tsx
function TileIconBase({
```

E antes do `const styles = StyleSheet.create({` do arquivo, acrescente:

```tsx
export const TileIcon = memo(TileIconBase);
```

## 2.4 — `src/screens/GameScreen.tsx`: handlers estáveis e contas memoizadas

`memo` só ajuda se as props pararem de trocar de identidade. Procure:

```tsx
const remainingTiles = countRemainingTiles(board);
```

Troque por:

```tsx
const remainingTiles = useMemo(() => countRemainingTiles(board), [board]);
```

Procure:

```tsx
const magicTripleRescueMove = findMagicTripleMove({
  activeTrayCapacity,
  board,
  tray,
});
```

Troque por:

```tsx
const magicTripleRescueMove = useMemo(
  () => findMagicTripleMove({ activeTrayCapacity, board, tray }),
  [activeTrayCapacity, board, tray],
);
```

Agora o handler estável. Depois da linha
`handleTilePressRef.current = handleTilePress;` (criada em 2.1.c), acrescente:

```tsx
// Identidade fixa para o GameBoard memoizado, sempre chamando a versão mais nova.
const handleTilePressStable = useCallback((tileId: string) => {
  void handleTilePressRef.current(tileId);
}, []);
```

E no `render`, procure:

```tsx
onTilePress = { handleTilePress };
```

Troque por:

```tsx
onTilePress = { handleTilePressStable };
```

Confira que `useCallback` e `useMemo` estão no import do `react` no topo do arquivo; se
faltar algum, acrescente.

> Se a prop `onBlockedTilePress` do `GameBoard` também estiver recebendo uma arrow inline
> (`onBlockedTilePress={() => ...}`), aplique o mesmo tratamento: `useCallback` com deps
> vazias chamando uma ref. Me mostre o trecho se não estiver óbvio.

## 2.5 — `App.tsx`: o tick de 1s só quando existe contagem

Procure:

```tsx
useEffect(() => {
  if (isLoadingProgress || screen === 'splash') {
    return undefined;
  }

  const interval = setInterval(() => {
    const now = Date.now();
    setLivesNow(now);

    if (
      livesState.currentLives < livesState.maxLives &&
      getTimeUntilNextLife(livesState, now) <= 0
    ) {
      refreshLivesState().catch(() => undefined);
    }

    if (
      (trayBoostState.coinSlotExpiresAt &&
        getCoinTraySlotRemaining(trayBoostState, now) <= 0) ||
      (trayBoostState.adSlotExpiresAt &&
        getBonusTraySlotRemaining(trayBoostState, now) <= 0)
    ) {
      refreshTrayBoostState().catch(() => undefined);
    }
  }, 1000);

  return () => clearInterval(interval);
}, [
  isLoadingProgress,
  livesState,
  refreshLivesState,
  refreshTrayBoostState,
  screen,
  trayBoostState,
]);
```

Troque por:

```tsx
const livesStateRef = useRef(livesState);
const trayBoostStateRef = useRef(trayBoostState);

useEffect(() => {
  livesStateRef.current = livesState;
}, [livesState]);

useEffect(() => {
  trayBoostStateRef.current = trayBoostState;
}, [trayBoostState]);

useEffect(() => {
  if (isLoadingProgress || screen === 'splash') {
    return undefined;
  }

  const interval = setInterval(() => {
    const now = Date.now();
    const currentLives = livesStateRef.current;
    const currentTrayBoost = trayBoostStateRef.current;
    const isCountingLives = currentLives.currentLives < currentLives.maxLives;
    const isCountingBoost = Boolean(
      currentTrayBoost.coinSlotExpiresAt || currentTrayBoost.adSlotExpiresAt,
    );

    // Só acorda o App quando existe contador visível. Antes o tick re-renderizava
    // a tela inteira (tabuleiro incluído) a cada segundo, até com vidas cheias.
    if (isCountingLives || isCountingBoost) {
      setLivesNow(now);
    }

    if (isCountingLives && getTimeUntilNextLife(currentLives, now) <= 0) {
      refreshLivesState().catch(() => undefined);
    }

    if (
      (currentTrayBoost.coinSlotExpiresAt &&
        getCoinTraySlotRemaining(currentTrayBoost, now) <= 0) ||
      (currentTrayBoost.adSlotExpiresAt &&
        getBonusTraySlotRemaining(currentTrayBoost, now) <= 0)
    ) {
      refreshTrayBoostState().catch(() => undefined);
    }
  }, 1000);

  return () => clearInterval(interval);
}, [isLoadingProgress, refreshLivesState, refreshTrayBoostState, screen]);
```

As refs mantêm o intervalo com valores frescos sem recriá-lo a cada segundo. `useRef` já
está importado no arquivo.

## 2.6 — `src/components/Tray.tsx`: flash da trinca fora da thread JS

O flash da bandeja interpola `backgroundColor`/`borderColor`, o que força
`useNativeDriver: false` — ou seja, roda na thread JS **exatamente** enquanto a jogada
resolve. Trocar por uma camada de `opacity` mantém o visual e sai da thread JS.

Procure:

```tsx
Animated.sequence([
  Animated.timing(flash, {
    duration: 120,
    toValue: 1,
    useNativeDriver: false,
  }),
  Animated.timing(flash, {
    duration: 420,
    toValue: 0,
    useNativeDriver: false,
  }),
]).start();
```

Troque por:

```tsx
Animated.sequence([
  Animated.timing(flash, {
    duration: 120,
    toValue: 1,
    useNativeDriver: true,
  }),
  Animated.timing(flash, {
    duration: 420,
    toValue: 0,
    useNativeDriver: true,
  }),
]).start();
```

Procure:

```tsx
const borderColor = flash.interpolate({
  inputRange: [0, 1],
  outputRange: [nearlyFull ? '#FF8BA9' : '#E0B26A', '#FFF0C4'],
});
const backgroundColor = flash.interpolate({
  inputRange: [0, 1],
  outputRange: [nearlyFull ? '#6E2A22' : '#8A5527', '#B0793A'],
});
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
```

Procure:

```tsx
    <Animated.View
      style={[
        styles.wrapper,
        nearlyFull ? styles.wrapperDanger : null,
        { backgroundColor, borderColor, transform: [{ scale }] },
      ]}
    >
      <View pointerEvents="none" style={styles.topGloss} />
```

Troque por:

```tsx
    <Animated.View
      style={[
        styles.wrapper,
        nearlyFull ? styles.wrapperDanger : null,
        { transform: [{ scale }] },
      ]}
    >
      <Animated.View pointerEvents="none" style={[styles.flashLayer, { opacity: flash }]} />
      <View pointerEvents="none" style={styles.topGloss} />
```

E no `StyleSheet.create` do arquivo acrescente:

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
    zIndex: 1,
  },
```

Se o `borderRadius` do `wrapper` for diferente de 14, use o mesmo valor dele no
`flashLayer`. Confira também que o `wrapper` tem `backgroundColor` e `borderColor`
estáticos — se ele dependia só das interpolações, copie para o estilo os valores
`#8A5527` / `#E0B26A`, e para o `wrapperDanger` os `#6E2A22` / `#FF8BA9`.

## 2.7 — mapa (o mesmo problema, outra tela)

Vale aplicar de uma vez, com a mesma técnica do 2.3:

- `src/components/GameIcon.tsx`: `import { memo } from 'react';`,
  `function GameIconBase({` + `export const GameIcon = memo(GameIconBase);` antes do
  `StyleSheet.create`. O mapa monta 100+ SVGs desses.
- `src/components/MapLevelNode.tsx` e `src/components/MapStoneTrail.tsx`: mesma coisa
  (`MapLevelNodeBase` / `MapStoneTrailBase` + `memo`).
- `src/screens/LevelSelectScreen.tsx`:
  - `import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';`
  - `getWorldProgress(selectedWorldId, progress)` dentro de
    `useMemo(..., [progress, selectedWorldId])`.
  - `trailPoints` dentro de `useMemo(..., [selectedMapHeight, worldLevels])`.
  - `selectLevel` dentro de `useCallback(..., [])`.
  - `progress.completedLevelIds.includes(level.id)` e
    `!progress.unlockedLevelIds.includes(level.id)`, que rodam por fase dentro do `map`,
    passam a consultar dois `Set` criados com `useMemo`.
- A edição **A8** do `APLICAR.md` (tirar o `ImageBackground` de dentro do `ScrollView` e
  ancorá-lo na tela com parallax) continua pendente neste repo: hoje o cenário é ampliado
  1,75x para cobrir a lona inteira do mundo. É custo de GPU e memória em cada troca de
  mundo. Aplique depois desta parte, sem misturar as duas.

---

# Checagem final

1. `npm run typecheck` — corrija só erro de compilação.
2. Mapa do Reino Açucarado: o baú bloqueado mostra **cadeado** sobre a tampa, sem barras
   brancas, sem véu cinza, e a placa mostra 0/3 em segmentos.
3. Bolhas 25.2 / 25.3: selo claro com cadeado legível, sem disco azul-escuro.
4. Fase 25.2: tocar três peças em sequência rápida **não perde toque nenhum** — a terceira
   entra sozinha logo depois da trinca resolver.
5. Com vidas cheias, parado no mapa: nada re-renderiza de 1 em 1 segundo.
6. Loja no mapa, portal de mundo e painel de fase bloqueada mostram cadeado, não chave.

Ao terminar, liste os arquivos alterados e o resultado do typecheck.
