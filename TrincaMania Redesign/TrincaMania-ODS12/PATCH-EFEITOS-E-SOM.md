# Efeitos visuais — TrincaMania

Referência: o vídeo `efeitos.mp4`. Traduzi o **vocabulário** de efeito dele (banner de combo,
estouro da trinca, flash de tela, confete, raios, estouro da recompensa) para a paleta e os
componentes que o TrincaMania já tem. Nada de arte nova, nada de biblioteca nova.

**Regras:**

- Não instale dependências. Sem `reanimated`, sem `lottie`, sem `expo-linear-gradient`.
- Os três arquivos de som que acompanham este script vão em `assets/sfx/` — não renomeie.
- Todo efeito novo anima **só `opacity` e `transform`**, com `useNativeDriver: true` — nenhum
  deles pode voltar a pesar na thread JS (foi o problema que acabamos de corrigir).
- Não mude regra de jogo, storage, tipos, dados de fase nem os sons. Efeito é camada por cima.
- Não altere `src/utils/`, `src/data/`, `src/storage/`, `src/types/`.
- Se um trecho de "procurar" não bater exatamente, **pare e me mostre o trecho**.
- Ao terminar: `npm run typecheck`, corrija só erro de compilação, e liste o que mudou.

Ordem de aplicação: E1 → E2 → E3 → E4 → E5 → E6 → S1…S8 (E5 depende dos arquivos criados em
E4; S4 em diante depende de S2/S3).

O que foi aprovado nos mocks: banner de sequência (**2a**), estouro da trinca (**3a**),
vitória com raios e confete (**2c**) com **monte de moedas**, e o mapa de som completo.

---

## E1 — Banner de trinca com multiplicador

Hoje o `MoveFeedbackEffect` mostra uma pílula translúcida com o rótulo da sequência
(`NICE!`, `GREAT!`, ...). O vídeo mostra o rótulo **com o multiplicador** e um halo brilhante.
A sequência já é contada em `triggerMoveFeedback` (`moveFeedbackStreakRef`) — só não chega na tela.

**Sobrescreva `src/components/MoveFeedbackEffect.tsx`** com:

```tsx
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { radii } from '../styles/theme';
import { type MoveFeedbackLabel } from '../utils/sounds';

export type MoveFeedbackEvent = {
  id: number;
  label: MoveFeedbackLabel;
  multiplier?: number;
};

type MoveFeedbackEffectProps = {
  event?: MoveFeedbackEvent;
};

const MOVE_FEEDBACK_DURATION_MS = 900;
// Abaixo de 2 não existe sequência: o chip só aparece a partir da segunda trinca seguida.
const MIN_MULTIPLIER = 2;

export function MoveFeedbackEffect({ event }: MoveFeedbackEffectProps) {
  const anim = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const [visibleEvent, setVisibleEvent] = useState<
    MoveFeedbackEvent | undefined
  >();

  useEffect(() => {
    if (!event) {
      return undefined;
    }

    setVisibleEvent(event);
    anim.stopAnimation();
    glow.stopAnimation();
    anim.setValue(0);
    glow.setValue(0);

    const animation = Animated.timing(anim, {
      duration: MOVE_FEEDBACK_DURATION_MS,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: true,
    });
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          duration: 260,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          duration: 260,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    glowLoop.start();
    animation.start(({ finished }) => {
      glowLoop.stop();

      if (finished) {
        setVisibleEvent((currentEvent) =>
          currentEvent?.id === event.id ? undefined : currentEvent,
        );
      }
    });

    return () => {
      animation.stop();
      glowLoop.stop();
    };
  }, [anim, event, glow]);

  if (!visibleEvent) {
    return null;
  }

  const multiplier = visibleEvent.multiplier ?? 0;
  const showMultiplier = multiplier >= MIN_MULTIPLIER;
  const opacity = anim.interpolate({
    inputRange: [0, 0.1, 0.62, 1],
    outputRange: [0, 1, 1, 0],
  });
  const scale = anim.interpolate({
    inputRange: [0, 0.12, 0.24, 1],
    outputRange: [0.82, 1.16, 1, 0.98],
  });
  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, -30],
  });
  const glowOpacity = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.34, 0.86],
  });

  return (
    <View pointerEvents="none" style={styles.layer}>
      <Animated.View
        style={[
          styles.wrap,
          {
            opacity,
            transform: [{ translateY }, { scale }],
          },
        ]}
      >
        {/* Halo pulsando: é o brilho rosa do vídeo, feito com View em vez de gradiente. */}
        <Animated.View
          pointerEvents="none"
          style={[styles.halo, { opacity: glowOpacity }]}
        />
        <View style={styles.plate}>
          <Text adjustsFontSizeToFit numberOfLines={1} style={styles.label}>
            {visibleEvent.label}
          </Text>
          {showMultiplier ? (
            <View
              style={[
                styles.chip,
                multiplier >= 5
                  ? styles.chipGold
                  : multiplier >= 3
                    ? styles.chipPink
                    : styles.chipMint,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  multiplier >= 5
                    ? styles.chipTextGold
                    : multiplier >= 3
                      ? styles.chipTextPink
                      : styles.chipTextMint,
                ]}
              >
                {`\u00D7${multiplier}`}
              </Text>
            </View>
          ) : null}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: radii.pill,
    borderWidth: 2,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  chipGold: {
    backgroundColor: '#FFD35A',
    borderColor: '#FFF8D8',
  },
  chipMint: {
    backgroundColor: '#42E5A7',
    borderColor: '#DFFFEF',
  },
  chipPink: {
    backgroundColor: '#F1497F',
    borderColor: '#FFD8EE',
  },
  chipText: {
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 18,
  },
  chipTextGold: {
    color: '#7A4A0C',
  },
  chipTextMint: {
    color: '#073524',
  },
  chipTextPink: {
    color: '#FFF8E8',
  },
  halo: {
    backgroundColor: 'rgba(255, 109, 158, 0.5)',
    borderRadius: radii.pill,
    bottom: -8,
    left: -10,
    position: 'absolute',
    right: -10,
    top: -8,
  },
  label: {
    color: '#FFF8E8',
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 0.4,
    textAlign: 'center',
    textShadowColor: 'rgba(36, 13, 86, 0.96)',
    textShadowOffset: { height: 3, width: 0 },
    textShadowRadius: 5,
  },
  layer: {
    alignItems: 'center',
    bottom: 156,
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 24,
  },
  plate: {
    alignItems: 'center',
    backgroundColor: 'rgba(36, 16, 68, 0.96)',
    borderBottomColor: '#A55D00',
    borderColor: '#FFD35A',
    borderRadius: radii.pill,
    borderWidth: 3,
    flexDirection: 'row',
    gap: 8,
    minWidth: 132,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
});
```

Agora passe o multiplicador. Em `src/screens/GameScreen.tsx`, procure:

```tsx
setMoveFeedbackEvent({ id: now + Math.random(), label: feedbackLabel });
```

Troque por:

```tsx
setMoveFeedbackEvent({
  id: now + Math.random(),
  label: feedbackLabel,
  multiplier: nextStreak,
});
```

---

## E2 — Estouro da trinca (padrão de bandeja: convergir → onda → estrelas → selo)

O `TripleConsumeEffect` já faz a parte difícil: as 3 peças convergem para o centro do grupo,
com flash e um anel. Faltam três coisas para bater com o padrão dos jogos de bandeja
(Triple Tile, Tile Match, Zen Match): **estrela** em vez de partícula redonda, **segunda onda
de choque** defasada e um **selo curto** no impacto.

Todas as edições são em `src/components/TripleConsumeEffect.tsx`.

### E2.1 — imports

Procure:

```tsx
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { TileIcon } from './TileIcon';
```

Troque por:

```tsx
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { TileIcon } from './TileIcon';
```

### E2.2 — partícula ganha forma

Procure:

```ts
type ParticleConfig = {
  color: string;
  dx: number;
  dy: number;
  rotate: number;
  size: number;
};
```

Troque por:

```ts
type ParticleConfig = {
  color: string;
  dx: number;
  dy: number;
  rotate: number;
  shape?: 'dot' | 'star';
  size: number;
};
```

### E2.3 — a lista de partículas

Procure a lista inteira:

```ts
const PARTICLES: ParticleConfig[] = [
  { color: '#FFFFFF', dx: -82, dy: -64, rotate: -24, size: 10 },
  { color: '#FFE37A', dx: -42, dy: -96, rotate: 18, size: 8 },
  { color: '#BDFBE4', dx: 2, dy: -108, rotate: -8, size: 7 },
  { color: '#FFFFFF', dx: 50, dy: -86, rotate: 32, size: 9 },
  { color: '#FFE37A', dx: 86, dy: -48, rotate: 56, size: 8 },
  { color: '#C8ECFF', dx: -96, dy: 8, rotate: -64, size: 7 },
  { color: '#FFF0C4', dx: 94, dy: 16, rotate: 60, size: 7 },
  { color: '#FFFFFF', dx: -38, dy: 58, rotate: 42, size: 8 },
  { color: '#BDFBE4', dx: 40, dy: 62, rotate: -42, size: 8 },
];
```

Troque por:

```ts
// Estrela grande para fora, poeirinha redonda para baixo: é a leitura padrão de
// "coletou" em jogo de bandeja. A estrela é a mesma arte do GameIcon.
const PARTICLES: ParticleConfig[] = [
  { color: '#FFD35A', dx: -86, dy: -58, rotate: -24, shape: 'star', size: 18 },
  { color: '#FFF8E8', dx: -34, dy: -92, rotate: 18, shape: 'star', size: 16 },
  { color: '#FFD35A', dx: 38, dy: -86, rotate: 32, shape: 'star', size: 20 },
  { color: '#FFF8E8', dx: 88, dy: -50, rotate: 56, shape: 'star', size: 16 },
  { color: '#FFD35A', dx: -70, dy: 16, rotate: -64, shape: 'star', size: 14 },
  { color: '#FFD35A', dx: 74, dy: 20, rotate: 60, shape: 'star', size: 14 },
  { color: '#FFF8D8', dx: -24, dy: 44, rotate: 42, size: 10 },
  { color: '#BDFBE4', dx: 28, dy: 46, rotate: -42, size: 10 },
  { color: '#C8ECFF', dx: 2, dy: 56, rotate: -8, size: 8 },
];

const STAR_PATH =
  'M32 8l6.7 14.2 15.3 2.2-11.1 10.8 2.6 15.2L32 43.2 18.5 50.4l2.6-15.2L10 24.4l15.3-2.2L32 8z';
```

### E2.4 — a estrela

Procure:

```tsx
function ConsumeTileBody({ emoji, kind }: { emoji: string; kind: TileKind }) {
```

E **acrescente logo acima**:

```tsx
function StarSpark({ color, size }: { color: string; size: number }) {
  return (
    <Svg height={size} viewBox="0 0 64 64" width={size}>
      <Path
        d={STAR_PATH}
        fill="#7A4A0C"
        stroke="#7A4A0C"
        strokeLinejoin="round"
        strokeWidth={6}
      />
      <Path d={STAR_PATH} fill={color} />
    </Svg>
  );
}
```

### E2.5 — desenhar a estrela e a segunda onda

Procure o bloco das partículas no `return` (a `Animated.View` com `styles.particle`):

```tsx
return (
  <Animated.View
    key={`${visibleEvent.id}-consume-particle-${index}`}
    style={[
      styles.particle,
      {
        backgroundColor: particle.color,
        height: particle.size,
        left: center.x - particle.size / 2,
        opacity,
        top: center.y - particle.size / 2,
        transform: [
          { translateX },
          { translateY },
          { rotate: `${particle.rotate}deg` },
          { scale },
        ],
        width: particle.size,
      },
    ]}
  />
);
```

Troque por:

```tsx
const isStar = particle.shape === 'star';

return (
  <Animated.View
    key={`${visibleEvent.id}-consume-particle-${index}`}
    style={[
      styles.particle,
      isStar
        ? null
        : { backgroundColor: particle.color, borderRadius: radii.pill },
      {
        height: particle.size,
        left: center.x - particle.size / 2,
        opacity,
        top: center.y - particle.size / 2,
        transform: [
          { translateX },
          { translateY },
          { rotate: `${particle.rotate}deg` },
          { scale },
        ],
        width: particle.size,
      },
    ]}
  >
    {isStar ? <StarSpark color={particle.color} size={particle.size} /> : null}
  </Animated.View>
);
```

No `StyleSheet.create`, o `particle` tem `borderRadius: radii.pill` — tire de lá (agora ele
vem no estilo inline só para a poeirinha, para a estrela não sair recortada). Procure:

```ts
  particle: {
    borderRadius: radii.pill,
    position: 'absolute',
    zIndex: 45,
  },
```

Troque por:

```ts
  particle: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    zIndex: 45,
  },
```

Agora a segunda onda. Procure o anel que já existe:

```tsx
<Animated.View
  style={[
    styles.ring,
    {
      left: center.x - 50,
      opacity: ringOpacity,
      top: center.y - 50,
      transform: [{ scale: ringScale }],
    },
  ]}
/>
```

Troque por:

```tsx
<Animated.View
  style={[
    styles.ring,
    {
      left: center.x - 50,
      opacity: ringOpacity,
      top: center.y - 50,
      transform: [{ scale: ringScale }],
    },
  ]}
/>;
{
  /* Segunda onda, defasada e rosa: o "duplo estouro" do padrão de mercado. */
}
<Animated.View
  style={[
    styles.ring,
    styles.ringEcho,
    {
      left: center.x - 50,
      opacity: ringEchoOpacity,
      top: center.y - 50,
      transform: [{ scale: ringEchoScale }],
    },
  ]}
/>;
```

As duas interpolações novas vão junto das outras. Procure:

```tsx
  const flashOpacity = consume.interpolate({
```

E **acrescente logo acima**:

```tsx
const ringEchoOpacity = consume.interpolate({
  inputRange: [0, 0.2, 0.8, 1],
  outputRange: [0, 0.7, 0.12, 0],
});
const ringEchoScale = consume.interpolate({
  inputRange: [0, 0.26, 1],
  outputRange: [0.44, 1, 1.9],
});
```

E no `StyleSheet.create` acrescente:

```ts
  ringEcho: {
    borderColor: 'rgba(255, 109, 158, 0.8)',
    zIndex: 44,
  },
```

### E2.6 — selo "TRINCA!" no impacto

Ainda no `return`, procure o flash central:

```tsx
<Animated.View
  style={[
    styles.flash,
    {
      left: center.x - 44,
      opacity: flashOpacity,
      top: center.y - 44,
    },
  ]}
/>
```

Troque por:

```tsx
      <Animated.View
        style={[
          styles.flash,
          {
            left: center.x - 44,
            opacity: flashOpacity,
            top: center.y - 44,
          },
        ]}
      />
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
```

As interpolações do selo, junto das outras (logo depois de `ringEchoScale`):

```tsx
const stampOpacity = consume.interpolate({
  inputRange: [0, 0.16, 0.24, 0.78, 1],
  outputRange: [0, 0, 1, 1, 0],
});
const stampScale = consume.interpolate({
  inputRange: [0, 0.2, 0.3, 1],
  outputRange: [0.7, 1.16, 1, 1],
});
const stampLift = consume.interpolate({
  inputRange: [0, 1],
  outputRange: [8, -34],
});
```

E os estilos:

```ts
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
  stampChip: {
    backgroundColor: '#42E5A7',
    borderColor: '#DFFFEF',
    borderRadius: radii.pill,
    borderWidth: 2,
    paddingHorizontal: 7,
  },
  stampChipText: {
    color: '#073524',
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 16,
  },
  stampText: {
    color: '#FFF8E8',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.6,
    lineHeight: 21,
    textShadowColor: 'rgba(36, 13, 86, 0.96)',
    textShadowOffset: { height: 2, width: 0 },
    textShadowRadius: 4,
  },
```

> O `+3` é a contagem de peças da trinca (sempre 3), não moeda — o jogo não paga moeda por
> trinca e eu não inventei economia nova. Se quiser o selo sem o chip, é só remover o
> `<View style={styles.stampChip}>`.

## E3 — Flash de tela na trinca

**Crie `src/components/ScreenFlash.tsx`:**

```tsx
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';

type ScreenFlashProps = {
  color?: string;
  peak?: number;
  triggerKey: number;
};

const FLASH_IN_MS = 70;
const FLASH_OUT_MS = 280;

/**
 * Clarão de tela inteira, disparado por mudança de `triggerKey`. Só `opacity`,
 * driver nativo — não custa nada na thread JS.
 */
export function ScreenFlash({
  color = '#FFFFFF',
  peak = 0.24,
  triggerKey,
}: ScreenFlashProps) {
  const flash = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!triggerKey) {
      return undefined;
    }

    flash.setValue(0);

    const animation = Animated.sequence([
      Animated.timing(flash, {
        duration: FLASH_IN_MS,
        easing: Easing.out(Easing.quad),
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(flash, {
        duration: FLASH_OUT_MS,
        easing: Easing.in(Easing.quad),
        toValue: 0,
        useNativeDriver: true,
      }),
    ]);

    animation.start();

    return () => animation.stop();
  }, [flash, triggerKey]);

  const opacity = flash.interpolate({
    inputRange: [0, 1],
    outputRange: [0, peak],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        styles.flash,
        { backgroundColor: color, opacity },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  flash: {
    zIndex: 60,
  },
});
```

Ligue no `src/screens/GameScreen.tsx`.

**1)** no import dos componentes, junto dos outros, acrescente:

```tsx
import { ScreenFlash } from '../components/ScreenFlash';
```

**2)** junto dos outros `useState` do componente, acrescente:

```tsx
const [screenFlashKey, setScreenFlashKey] = useState(0);
```

**3)** dispare na trinca. Procure:

```tsx
    if (result.removedKind) {
      mediumImpact();
      startTripleConsume(consumeTiles, result.removedKind);
```

Troque por:

```tsx
    if (result.removedKind) {
      mediumImpact();
      setScreenFlashKey((currentKey) => currentKey + 1);
      startTripleConsume(consumeTiles, result.removedKind);
```

**4)** monte a camada. Procure:

```tsx
<MoveFeedbackEffect event={moveFeedbackEvent} />
```

Troque por:

```tsx
        <ScreenFlash peak={0.22} triggerKey={screenFlashKey} />

        <MoveFeedbackEffect event={moveFeedbackEvent} />
```

---

## E4 — Confete geométrico e raios de luz

**Crie `src/components/ConfettiRain.tsx`:**

```tsx
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';

type ConfettiRainProps = {
  count?: number;
  visible?: boolean;
};

const COLORS = [
  '#FFD35A',
  '#FF6D9E',
  '#42E5A7',
  '#FFF8E8',
  '#8FD8FF',
  '#B58BFF',
];
const DEFAULT_COUNT = 22;

/**
 * Chuva de confete do vídeo: retângulos girando enquanto caem. Um Animated.Value
 * por peça, todos no driver nativo. Substitui as partículas de emoji.
 */
export function ConfettiRain({
  count = DEFAULT_COUNT,
  visible = true,
}: ConfettiRainProps) {
  const window = useRef(Dimensions.get('window')).current;
  const pieces = useMemo(
    () =>
      Array.from({ length: count }).map((_, index) => ({
        color: COLORS[index % COLORS.length],
        delay: Math.round(Math.random() * 2000),
        drift: Math.round((Math.random() - 0.5) * 90),
        duration: 2400 + Math.round(Math.random() * 1700),
        height: 8 + Math.round(Math.random() * 12),
        left: Math.round(Math.random() * Math.max(1, window.width - 16)),
        spin: Math.random() > 0.5 ? 1 : -1,
        width: 6 + Math.round(Math.random() * 5),
      })),
    [count, window.width],
  );
  const progressValues = useMemo(
    () => pieces.map(() => new Animated.Value(0)),
    [pieces],
  );

  useEffect(() => {
    if (!visible) {
      progressValues.forEach((value) => {
        value.stopAnimation();
        value.setValue(0);
      });

      return undefined;
    }

    const animations = progressValues.map((value, index) =>
      Animated.sequence([
        Animated.delay(pieces[index].delay),
        Animated.loop(
          Animated.timing(value, {
            duration: pieces[index].duration,
            easing: Easing.linear,
            toValue: 1,
            useNativeDriver: true,
          }),
        ),
      ]),
    );

    animations.forEach((animation) => animation.start());

    return () => animations.forEach((animation) => animation.stop());
  }, [pieces, progressValues, visible]);

  if (!visible) {
    return null;
  }

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.layer]}>
      {pieces.map((piece, index) => {
        const progress = progressValues[index];
        const translateY = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [-40, window.height + 40],
        });
        const translateX = progress.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, piece.drift, 0],
        });
        const rotate = progress.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${piece.spin * 620}deg`],
        });
        const opacity = progress.interpolate({
          inputRange: [0, 0.06, 0.88, 1],
          outputRange: [0, 1, 1, 0],
        });

        return (
          <Animated.View
            key={`confetti-${index}`}
            style={[
              styles.piece,
              {
                backgroundColor: piece.color,
                height: piece.height,
                left: piece.left,
                opacity,
                transform: [{ translateY }, { translateX }, { rotate }],
                width: piece.width,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    overflow: 'hidden',
    zIndex: 2,
  },
  piece: {
    borderRadius: 2,
    position: 'absolute',
    top: 0,
  },
});
```

**Crie `src/components/LightRays.tsx`:**

```tsx
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

type LightRaysProps = {
  size?: number;
  visible?: boolean;
};

const RAYS = [
  { angle: 0, width: 44 },
  { angle: 40, width: 26 },
  { angle: 84, width: 52 },
  { angle: 128, width: 30 },
  { angle: 172, width: 46 },
  { angle: 216, width: 28 },
  { angle: 262, width: 50 },
  { angle: 308, width: 24 },
];
const ROTATION_MS = 14000;

/** Leque de raios girando devagar atrás do conteúdo — o fundo da tela de vitória do vídeo. */
export function LightRays({ size = 520, visible = true }: LightRaysProps) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      spin.stopAnimation();
      spin.setValue(0);
      return undefined;
    }

    spin.setValue(0);
    const animation = Animated.loop(
      Animated.timing(spin, {
        duration: ROTATION_MS,
        easing: Easing.linear,
        toValue: 1,
        useNativeDriver: true,
      }),
    );

    animation.start();

    return () => animation.stop();
  }, [spin, visible]);

  if (!visible) {
    return null;
  }

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const half = size / 2;

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.layer]}>
      <Animated.View
        style={[
          styles.wheel,
          {
            height: size,
            marginLeft: -half,
            marginTop: -half,
            transform: [{ rotate }],
            width: size,
          },
        ]}
      >
        {RAYS.map((ray) => (
          <View
            key={`ray-${ray.angle}`}
            style={[
              styles.ray,
              {
                height: half,
                marginLeft: -ray.width / 2,
                transform: [{ rotate: `${ray.angle}deg` }],
                width: ray.width,
              },
            ]}
          />
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    zIndex: 1,
  },
  ray: {
    backgroundColor: 'rgba(255, 244, 184, 0.12)',
    left: '50%',
    position: 'absolute',
    top: 0,
    transformOrigin: '50% 100%',
  },
  wheel: {
    left: '50%',
    position: 'absolute',
    top: '50%',
  },
});
```

> Se a sua versão do React Native não aceitar `transformOrigin` no `StyleSheet` (entrou no
> 0.76; este projeto está no 0.81, então deve aceitar), **pare e me avise** — a alternativa
> é envolver cada raio numa `View` de altura dupla, e eu mando o trecho.

---

## E5 — Ligar confete e raios na tela de vitória

Em `src/components/ResultModal.tsx`, no import dos componentes acrescente:

```tsx
import { ConfettiRain } from './ConfettiRain';
import { LightRays } from './LightRays';
```

Procure o bloco das partículas de emoji (começa logo depois do `<SafeAreaView ...>`):

```tsx
        {isWon ? (
          <View pointerEvents="none" style={styles.sparkleLayer}>
            {RESULT_PARTICLES.map((particle, index) => {
```

…e **substitua o bloco `{isWon ? ( ... ) : null}` inteiro** (até o `) : null}` que fecha essa
camada, imediatamente antes do `<Animated.View style={[styles.card, ...` do card) por:

```tsx
{
  isWon ? <LightRays /> : null;
}
{
  isWon ? <ConfettiRain /> : null;
}
```

O card continua montado depois, então ele fica **por cima** das duas camadas — confira que o
card não ficou atrás do confete; se ficar, acrescente `zIndex: 3` ao estilo `card`.

Se o typecheck acusar `RESULT_PARTICLES`, `sparkle` ou `styles.sparkleLayer` sem uso, remova
**só** o que ficou órfão. Se `sparkle` for usado em outro efeito do arquivo, deixe como está.

---

---

## E6 — Monte de moedas na recompensa

Hoje a recompensa mostra **uma** moeda. O padrão é um montinho: 5 moedas em duas fileiras,
cada uma entrando com um atraso curto — a leitura de "muitas moedas" acontece no primeiro
quadro, antes do número aparecer.

**Crie `src/components/CoinPile.tsx`:**

```tsx
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { RewardAssetIcon } from './RewardAssetIcon';

type CoinPileProps = {
  animationKey?: number;
  size?: number;
  visible?: boolean;
};

// Duas fileiras: a de trás maior e mais alta, a da frente menor e girada. Os
// atrasos fazem o montinho "montar" em vez de aparecer inteiro.
const COINS = [
  { delay: 20, left: 38, rotate: '0deg', scale: 0.78, top: 8 },
  { delay: 60, left: 4, rotate: '-14deg', scale: 0.62, top: 24 },
  { delay: 100, left: 82, rotate: '13deg', scale: 0.62, top: 28 },
  { delay: 140, left: 16, rotate: '9deg', scale: 0.56, top: 54 },
  { delay: 170, left: 72, rotate: '-9deg', scale: 0.56, top: 56 },
];
const PILE_HEIGHT = 100;
const PILE_WIDTH = 132;
const POP_MS = 420;

export function CoinPile({
  animationKey = 0,
  size = 74,
  visible = true,
}: CoinPileProps) {
  const pops = useMemo(() => COINS.map(() => new Animated.Value(0)), []);
  const popsRef = useRef(pops);

  useEffect(() => {
    popsRef.current = pops;
  }, [pops]);

  useEffect(() => {
    if (!visible) {
      pops.forEach((pop) => {
        pop.stopAnimation();
        pop.setValue(0);
      });

      return undefined;
    }

    pops.forEach((pop) => pop.setValue(0));

    const animations = pops.map((pop, index) =>
      Animated.sequence([
        Animated.delay(COINS[index].delay),
        Animated.timing(pop, {
          duration: POP_MS,
          easing: Easing.out(Easing.back(2.2)),
          toValue: 1,
          useNativeDriver: true,
        }),
      ]),
    );

    animations.forEach((animation) => animation.start());

    return () => animations.forEach((animation) => animation.stop());
  }, [animationKey, pops, visible]);

  if (!visible) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.pile}>
      {COINS.map((coin, index) => {
        const pop = pops[index];
        const opacity = pop.interpolate({
          inputRange: [0, 0.2, 1],
          outputRange: [0, 1, 1],
        });
        const scale = pop.interpolate({
          inputRange: [0, 1],
          outputRange: [0.2, 1],
        });

        return (
          <Animated.View
            key={`coin-pile-${index}`}
            style={[
              styles.coin,
              {
                left: coin.left,
                opacity,
                top: coin.top,
                transform: [{ scale }, { rotate: coin.rotate }],
              },
            ]}
          >
            <RewardAssetIcon name="coin" size={Math.round(size * coin.scale)} />
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  coin: {
    position: 'absolute',
  },
  pile: {
    height: PILE_HEIGHT,
    position: 'relative',
    width: PILE_WIDTH,
  },
});
```

Ligue em `src/components/RewardCollectOverlay.tsx`. No import dos componentes acrescente:

```tsx
import { CoinPile } from './CoinPile';
```

Procure o anel do estouro (é a primeira coisa dentro do `return`):

```tsx
<Animated.View
  style={[
    styles.burstRing,
    {
      left: originX - 44,
      opacity: ringOpacity,
      top: originY - 44,
      transform: [{ scale: ringScale }],
    },
  ]}
/>
```

Troque por:

```tsx
      <Animated.View
        style={[
          styles.burstRing,
          {
            left: originX - 44,
            opacity: ringOpacity,
            top: originY - 44,
            transform: [{ scale: ringScale }],
          },
        ]}
      />
      <View pointerEvents="none" style={[styles.pile, { left: originX - 66, top: originY - 50 }]}>
        <CoinPile animationKey={animationKey} />
      </View>
```

E no `StyleSheet.create` do mesmo arquivo acrescente:

```ts
  pile: {
    position: 'absolute',
    zIndex: 5,
  },
```

As moedas que **voam** para o contador (`COIN_PARTICLES`) continuam como estão: o montinho é
a origem, elas são o trajeto.

---

# Parte S — Som

**Antes de começar:** copie para `assets/sfx/` os três arquivos que vieram junto com este
script — `whoosh.wav`, `shockwave.wav` e `confetti.wav` (WAV mono 44.1kHz, −3dB). Sem eles o
`require` da edição S2 falha no bundler.

Auditoria do `src/utils/sounds.ts`.

Duas coisas para ter em mente antes de editar:

- `soundSources.tap` e `soundSources.button` estão `undefined` hoje, **embora os arquivos
  existam** em `assets/sfx/`. Encaixar peça na bandeja — o gesto mais repetido do jogo — não
  produz som nenhum. Isso é S1.
- O maior ganho de percepção não é arquivo novo: é a trinca **subir de tom** conforme a
  sequência, reaproveitando o `match.mp3`. Isso é S4.

## S1 — reativar os dois sons mudos

Em `soundSources`, procure:

```ts
  button: undefined,
```

Troque por:

```ts
  button: require('../../assets/sfx/button.mp3') as AudioSource,
```

Procure:

```ts
  tap: undefined,
```

Troque por:

```ts
  tap: require('../../assets/sfx/tap.mp3') as AudioSource,
```

Apague também o comentário que dizia que eles estavam desativados de propósito, logo acima do
`SOUND_CONFIGS`:

```ts
// Generic button/tap sounds are intentionally disabled for now to reduce audio fatigue.
// Undefined sources are runtime no-ops.
```

Troque por:

```ts
// Fontes `undefined` continuam sendo no-op em tempo de execução — é a rede de
// segurança caso algum arquivo seja removido da pasta no futuro.
```

## S2 — as três chaves novas

Procure o tipo:

```ts
type SoundKey =
  | 'blocked'
  | 'button'
  | 'chestOpen'
  | 'coin'
  | 'lose'
  | 'match'
  | 'rewardSparkle'
  | 'shopBuy'
  | 'tap'
  | 'win'
  | 'worldUnlock';
```

Troque por:

```ts
type SoundKey =
  | 'blocked'
  | 'button'
  | 'chestOpen'
  | 'coin'
  | 'confetti'
  | 'lose'
  | 'match'
  | 'rewardSparkle'
  | 'shockwave'
  | 'shopBuy'
  | 'tap'
  | 'whoosh'
  | 'win'
  | 'worldUnlock';
```

Em `soundSources`, procure:

```ts
  coin: require('../../assets/sfx/coin.mp3') as AudioSource,
```

Troque por:

```ts
  coin: require('../../assets/sfx/coin.mp3') as AudioSource,
  confetti: require('../../assets/sfx/confetti.wav') as AudioSource,
  shockwave: require('../../assets/sfx/shockwave.wav') as AudioSource,
  whoosh: require('../../assets/sfx/whoosh.wav') as AudioSource,
```

## S3 — volumes e cooldowns

Substitua o `SOUND_CONFIGS` inteiro por:

```ts
const SOUND_CONFIGS: Record<SoundKey, SoundConfig> = {
  // 750ms engolia a segunda tentativa na mesma peça: 300 responde a cada toque.
  blocked: { cooldownMs: 300, source: soundSources.blocked, volume: 0.32 },
  button: { cooldownMs: 80, source: soundSources.button, volume: 0.34 },
  chestOpen: { cooldownMs: 900, source: soundSources.chestOpen, volume: 0.42 },
  // 90ms permite a cascata de 3 moedas de S5.
  coin: { cooldownMs: 90, source: soundSources.coin, volume: 0.4 },
  confetti: { cooldownMs: 900, source: soundSources.confetti, volume: 0.34 },
  lose: { cooldownMs: 700, source: soundSources.lose, volume: 0.46 },
  match: { cooldownMs: 180, source: soundSources.match, volume: 0.44 },
  // Vira camada em cima da trinca, então baixa de 0.34 para 0.22.
  rewardSparkle: {
    cooldownMs: 700,
    source: soundSources.rewardSparkle,
    volume: 0.22,
  },
  shockwave: { cooldownMs: 200, source: soundSources.shockwave, volume: 0.3 },
  shopBuy: { cooldownMs: 450, source: soundSources.shopBuy, volume: 0.46 },
  tap: { cooldownMs: 55, source: soundSources.tap, volume: 0.3 },
  whoosh: { cooldownMs: 60, source: soundSources.whoosh, volume: 0.26 },
  win: { cooldownMs: 700, source: soundSources.win, volume: 0.52 },
  worldUnlock: {
    cooldownMs: 900,
    source: soundSources.worldUnlock,
    volume: 0.54,
  },
};
```

## S4 — trinca sobe de tom com a sequência

Procure a constante do ambiente:

```ts
export const AMBIENT_VOLUME = 0.12;
```

Troque por:

```ts
export const AMBIENT_VOLUME = 0.12;
// Volume do ambiente durante vitória/baú: o efeito grande precisa de espaço.
export const AMBIENT_DUCK_VOLUME = 0.04;
// Altura da trinca por sequência. A 5ª trinca seguida já soa quase uma quinta acima.
const MATCH_RATE_BY_STREAK = [1, 1.06, 1.12, 1.19, 1.26];
```

Agora as funções. Procure:

```ts
export const playMatchSound = () => playSound('match');
```

Troque por:

```ts
export const playMatchSound = () => playSound('match');

const setPlayerRate = (player: AudioPlayer, rate: number) => {
  try {
    const target = player as unknown as {
      playbackRate?: number;
      setPlaybackRate?: (value: number, pitchCorrection?: boolean) => void;
    };

    if (typeof target.setPlaybackRate === 'function') {
      target.setPlaybackRate(rate, false);
      return;
    }

    target.playbackRate = rate;
  } catch {
    // no-op: alterar a altura é enfeite, nunca pode interromper o som
  }
};

/**
 * Som completo da trinca: match com a altura da sequência + onda de choque no
 * mesmo instante + brilho 90ms depois. Chamada única, para o GameScreen não
 * precisar orquestrar três sons.
 */
export const playTripleSounds = (streak = 1) => {
  if (soundEnabledCache === false) {
    return;
  }

  const rateIndex = Math.min(
    MATCH_RATE_BY_STREAK.length - 1,
    Math.max(0, streak - 1),
  );
  const player = getPlayer('match');

  if (player) {
    setPlayerRate(player, MATCH_RATE_BY_STREAK[rateIndex]);
  }

  playSound('match');
  playSound('shockwave');
  setTimeout(() => playSound('rewardSparkle'), 90);
};

export const playWhooshSound = () => playSound('whoosh');
export const playConfettiSound = () => playSound('confetti');
export const playShockwaveSound = () => playSound('shockwave');

/** Uma moeda por vez, escalonadas: soa como moeda caindo, não como um clique só. */
export const playCoinCascade = (count = 3) => {
  if (soundEnabledCache === false) {
    return;
  }

  const total = Math.max(1, Math.min(4, count));

  for (let index = 0; index < total; index += 1) {
    setTimeout(() => playSound('coin'), index * 90);
  }
};

export const duckAmbient = (fadeMs = 300) => {
  if (!currentAmbientPlayer) {
    return;
  }

  fadeAmbientTo(currentAmbientPlayer, AMBIENT_DUCK_VOLUME, fadeMs);
};

export const unduckAmbient = (fadeMs = 400) => {
  if (!currentAmbientPlayer || !currentAmbientKey) {
    return;
  }

  fadeAmbientTo(
    currentAmbientPlayer,
    AMBIENT_CONFIGS[currentAmbientKey].volume,
    fadeMs,
  );
};
```

> `setPlaybackRate` é do `AudioPlayer` do `expo-audio`. Se a assinatura da sua versão for
> outra, o `try/catch` já garante que a trinca continua tocando na altura normal — **não é
> preciso parar**. Se o typecheck reclamar do `as unknown as`, me avise.

## S5 — cascata de moedas na recompensa

Em `src/components/RewardCollectOverlay.tsx`, procure:

```tsx
import { playCoinSound } from '../utils/sounds';
```

Troque por:

```tsx
import { playCoinCascade } from '../utils/sounds';
```

Procure:

```tsx
playCoinSound();
```

Troque por:

```tsx
playCoinCascade(3);
```

## S6 — trinca, whoosh e confete no GameScreen

Em `src/screens/GameScreen.tsx`, no import de `../utils/sounds` acrescente
`duckAmbient`, `playConfettiSound`, `playTripleSounds`, `playWhooshSound` e `unduckAmbient`
à lista (mantendo a ordem alfabética que o arquivo já usa). Se `playMatchSound` ficar sem uso
depois de S6.1 e o typecheck reclamar, remova-o do import.

### S6.1 — a trinca

Procure:

```tsx
      if (result.status !== 'won') {
        playMatchSound();
        triggerMoveFeedback();
```

Troque por (a ordem inverte de propósito: `triggerMoveFeedback` é quem atualiza a sequência,
e o som precisa dela já atualizada):

```tsx
      if (result.status !== 'won') {
        triggerMoveFeedback();
        playTripleSounds(moveFeedbackStreakRef.current);
```

### S6.2 — o voo da peça

Procure:

```tsx
setFlyingTileEvent({
  from: fromTarget,
  id: Date.now() + Math.random(),
  tile: trayTile,
  to: toTarget,
});
```

Troque por:

```tsx
playWhooshSound();
setFlyingTileEvent({
  from: fromTarget,
  id: Date.now() + Math.random(),
  tile: trayTile,
  to: toTarget,
});
```

O `tap.mp3` (S1) já toca no fim do voo, em `handleFlyingTileComplete` — junto com o whoosh
fica sopro na saída e encaixe na chegada, que é o par padrão.

### S6.3 — vitória

Procure:

```tsx
    if (result.status === 'won') {
```

Troque por:

```tsx
    if (result.status === 'won') {
      duckAmbient();
      playConfettiSound();
```

E em `resetRoundState`, procure:

```tsx
clearMoveFeedbackStreak();
```

Troque por:

```tsx
clearMoveFeedbackStreak();
unduckAmbient();
```

## S7 — som nos botões da HUD do mapa

O `button.mp3` só vale se alguém o tocar. Em `src/components/MapHud.tsx`, no topo,
acrescente:

```tsx
import { playButtonSound } from '../utils/sounds';
```

E nos `onPress` de **home**, **configurações**, **mundo anterior** e **próximo mundo**, envolva
a chamada existente. Exemplo do home — procure:

```tsx
onPress = { onHome };
```

Troque por:

```tsx
          onPress={() => {
            playButtonSound();
            onHome();
          }}
```

Faça o mesmo com `onPress={onOpenSettings}`, `onPress={onPreviousWorld}` e
`onPress={onNextWorld}`. **Não** coloque nos botões `+` de moeda/vida: eles abrem a loja, que
já tem som próprio.

## S8 — os três arquivos novos

Já vêm com este script, em `sfx/`. Copie para `assets/sfx/` **antes** de aplicar S2:

| arquivo         | duração | caráter                                               |
| --------------- | ------- | ----------------------------------------------------- |
| `whoosh.wav`    | 190ms   | sopro seco sem cauda — a chegada fica com o `tap.mp3` |
| `shockwave.wav` | 300ms   | corpo grave 96→48Hz com brilho no ataque              |
| `confetti.wav`  | 760ms   | estouro de papel + cauda de purpurina                 |

São sintetizados (mono, 44.1kHz, −3dB), feitos para casar com a duração de cada efeito
visual. Se um dia trocar por gravação profissional, **mantenha o mesmo nome de arquivo** e
nenhuma linha de código muda. WAV curto é normal em jogo: os três somam ~110KB.
