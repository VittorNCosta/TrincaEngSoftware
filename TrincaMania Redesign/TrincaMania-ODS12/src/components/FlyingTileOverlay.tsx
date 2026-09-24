import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { TileIcon } from './TileIcon';
import { CardRole } from '../domain/recycling/value-objects/CardRole';
import { radii, shadows } from '../styles/theme';
import { Tile, TileKind } from '../types/game';
import { WindowTarget } from '../types/ui';

// 340 deixava a peça fora do tabuleiro e fora da bandeja por tempo demais: lia
// como travamento. 240 continua legível como voo e devolve o toque mais rápido.
export const TILE_FLY_DURATION_MS = 240;

export type FlyingTileEvent = {
  from: WindowTarget;
  id: string;
  tile: Pick<Tile, 'emoji' | 'id' | 'kind' | 'role'>;
  to: WindowTarget;
};

type FlyingTileOverlayProps = {
  containerTarget?: WindowTarget;
  event?: FlyingTileEvent;
  onSettled?: (event: FlyingTileEvent, visualFinished: boolean) => void;
};

const TILE_SIZE = 52;

const getCenter = (target: WindowTarget, containerTarget?: WindowTarget) => ({
  x: target.x + target.width / 2 - (containerTarget?.x ?? 0),
  y: target.y + target.height / 2 - (containerTarget?.y ?? 0),
});

function FlyingTileBody({
  emoji,
  kind,
  role,
  scale,
}: {
  emoji: string;
  kind: TileKind;
  role: CardRole;
  scale?: Animated.AnimatedInterpolation<number>;
}) {
  return (
    <Animated.View
      style={[styles.tile, { transform: scale ? [{ scale }] : undefined }]}
    >
      <View pointerEvents="none" style={styles.innerBottomShade} />
      <View pointerEvents="none" style={styles.specular} />
      <TileIcon
        fallbackEmoji={emoji}
        highlighted
        kind={kind}
        role={role}
        size={38}
      />
    </Animated.View>
  );
}

function FlyingTileFlight({
  containerTarget,
  event,
  onSettled,
}: Required<Pick<FlyingTileOverlayProps, 'event'>> &
  Pick<FlyingTileOverlayProps, 'containerTarget' | 'onSettled'>) {
  const flight = useRef(new Animated.Value(0)).current;
  const onSettledRef = useRef(onSettled);

  useEffect(() => {
    onSettledRef.current = onSettled;
  }, [onSettled]);

  useEffect(() => {
    let disposed = false;
    flight.setValue(0);

    const animation = Animated.timing(flight, {
      duration: TILE_FLY_DURATION_MS,
      easing: Easing.bezier(0.17, 0.82, 0.22, 1),
      toValue: 1,
      useNativeDriver: true,
    });

    animation.start(({ finished }) => {
      // `finished: false` tambem encerra este voo visual. O controlador decide,
      // pelo token da rodada, se deve concluir a chegada ou ignorar um cancelamento.
      if (!disposed) {
        onSettledRef.current?.(event, finished);
      }
    });

    return () => {
      // Desmontagem e troca de rodada ja sao canceladas pelo controlador. Isso
      // tambem evita que o cleanup de Strict Mode conclua um voo prematuramente.
      disposed = true;
      animation.stop();
    };
  }, [event, flight]);

  const from = getCenter(event.from, containerTarget);
  const to = getCenter(event.to, containerTarget);
  const arcLift = Math.min(
    112,
    Math.max(56, Math.abs(to.y - from.y) * 0.24 + 40),
  );
  const translateX = flight.interpolate({
    inputRange: [0, 0.52, 1],
    outputRange: [0, (to.x - from.x) * 0.5, to.x - from.x],
  });
  const translateY = flight.interpolate({
    inputRange: [0, 0.52, 1],
    outputRange: [0, (to.y - from.y) * 0.46 - arcLift, to.y - from.y],
  });
  const scale = flight.interpolate({
    inputRange: [0, 0.18, 0.76, 1],
    outputRange: [1, 1.1, 1.04, 0.94],
  });
  const glowOpacity = flight.interpolate({
    inputRange: [0, 0.18, 0.78, 1],
    outputRange: [0.12, 0.58, 0.36, 0],
  });
  const trailOpacity = flight.interpolate({
    inputRange: [0, 0.12, 0.78, 1],
    outputRange: [0, 0.34, 0.2, 0],
  });
  const trailScale = flight.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.55, 1.08, 0.74],
  });
  const rotate = flight.interpolate({
    inputRange: [0, 1],
    outputRange: ['-2deg', '5deg'],
  });

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.layer]}>
      <Animated.View
        style={[
          styles.flying,
          {
            left: from.x - TILE_SIZE / 2,
            top: from.y - TILE_SIZE / 2,
            transform: [{ translateX }, { translateY }, { rotate }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.trail,
            {
              opacity: trailOpacity,
              transform: [{ scaleX: trailScale }, { scaleY: 0.72 }],
            },
          ]}
        />
        <Animated.View style={[styles.glow, { opacity: glowOpacity }]} />
        <FlyingTileBody
          emoji={event.tile.emoji}
          kind={event.tile.kind}
          role={event.tile.role}
          scale={scale}
        />
      </Animated.View>
    </View>
  );
}

export function FlyingTileOverlay({
  containerTarget,
  event,
  onSettled,
}: FlyingTileOverlayProps) {
  if (!event) {
    return null;
  }

  // Um voo por instancia impede que o cleanup do item anterior interrompa o
  // Animated.Value do item seguinte quando callbacks chegam no mesmo frame.
  return (
    <FlyingTileFlight
      key={event.id}
      containerTarget={containerTarget}
      event={event}
      onSettled={onSettled}
    />
  );
}

const styles = StyleSheet.create({
  flying: {
    elevation: 40,
    height: TILE_SIZE,
    position: 'absolute',
    width: TILE_SIZE,
    zIndex: 40,
  },
  glow: {
    backgroundColor: 'rgba(255, 226, 122, 0.62)',
    borderRadius: radii.pill,
    bottom: -10,
    left: -10,
    position: 'absolute',
    right: -10,
    top: -10,
  },
  layer: {
    // No Android é o elevation do pai que decide se a camada fica acima do
    // dock da bandeja e das peças do tabuleiro (que têm elevation próprio).
    elevation: 50,
    zIndex: 50,
  },
  innerBottomShade: {
    backgroundColor: 'rgba(161, 99, 20, 0.24)',
    borderBottomLeftRadius: 19,
    borderBottomRightRadius: 19,
    bottom: 0,
    height: 10,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  specular: {
    backgroundColor: 'rgba(255, 255, 255, 0.74)',
    borderRadius: radii.pill,
    height: 11,
    left: 7,
    position: 'absolute',
    top: 4,
    width: 21,
  },
  tile: {
    alignItems: 'center',
    backgroundColor: '#FFE7A6',
    borderBottomColor: '#C9922F',
    borderBottomWidth: 5,
    borderColor: '#FFF5D3',
    borderRadius: 19,
    borderWidth: 2,
    height: TILE_SIZE,
    justifyContent: 'center',
    overflow: 'hidden',
    width: TILE_SIZE,
    ...shadows.tile,
  },
  trail: {
    backgroundColor: 'rgba(255, 244, 184, 0.58)',
    borderRadius: radii.pill,
    height: 18,
    left: -18,
    position: 'absolute',
    top: 17,
    width: 72,
  },
});
