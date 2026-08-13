import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { TileIcon } from './TileIcon';
import { shadows } from '../styles/theme';
import { Tile, TileKind } from '../types/game';
import { WindowTarget } from '../types/ui';

export const TRIPLE_CONSUME_DELAY_MS = 70;
export const TRIPLE_CONSUME_DURATION_MS = 190;

export type TripleConsumeTile = {
  target: WindowTarget;
  tile: Pick<Tile, 'emoji' | 'id' | 'kind' | 'role'>;
};

export type TripleConsumeEvent = {
  id: string;
  kind: TileKind;
  tiles: TripleConsumeTile[];
};

type TripleConsumeEffectProps = {
  containerTarget?: WindowTarget;
  event?: TripleConsumeEvent;
  onSettled?: (event: TripleConsumeEvent, visualFinished: boolean) => void;
};

const TILE_SIZE = 52;

const getCenter = (target: WindowTarget, containerTarget?: WindowTarget) => ({
  x: target.x + target.width / 2 - (containerTarget?.x ?? 0),
  y: target.y + target.height / 2 - (containerTarget?.y ?? 0),
});

function TripleConsumeAnimation({
  containerTarget,
  event,
  onSettled,
}: Required<Pick<TripleConsumeEffectProps, 'event'>> &
  Pick<TripleConsumeEffectProps, 'containerTarget' | 'onSettled'>) {
  const consume = useRef(new Animated.Value(0)).current;
  const onSettledRef = useRef(onSettled);

  useEffect(() => {
    onSettledRef.current = onSettled;
  }, [onSettled]);

  useEffect(() => {
    let disposed = false;
    consume.setValue(0);

    const startTimer = setTimeout(() => {
      const animation = Animated.timing(consume, {
        duration: TRIPLE_CONSUME_DURATION_MS,
        easing: Easing.inOut(Easing.quad),
        toValue: 1,
        useNativeDriver: true,
      });

      animation.start(({ finished }) => {
        if (!disposed) {
          onSettledRef.current?.(event, finished);
        }
      });
    }, TRIPLE_CONSUME_DELAY_MS);

    return () => {
      disposed = true;
      clearTimeout(startTimer);
      consume.stopAnimation();
    };
  }, [consume, event]);

  const tileCenters = useMemo(
    () =>
      event.tiles.map((item) => ({
        item,
        ...getCenter(item.target, containerTarget),
      })),
    [containerTarget, event],
  );

  if (tileCenters.length === 0) {
    return null;
  }

  const opacity = consume.interpolate({
    inputRange: [0, 0.38, 1],
    outputRange: [1, 1, 0],
  });
  const scale = consume.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [1, 1.04, 0.72],
  });
  const translateY = consume.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -5],
  });

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.layer]}>
      {tileCenters.map(({ item, x, y }) => (
        <Animated.View
          key={`${event.id}-consume-${item.tile.id}`}
          style={[
            styles.tile,
            {
              left: x - TILE_SIZE / 2,
              opacity,
              top: y - TILE_SIZE / 2,
              transform: [{ translateY }, { scale }],
            },
          ]}
        >
          <TileIcon
            fallbackEmoji={item.tile.emoji}
            highlighted={false}
            kind={item.tile.kind}
            role={item.tile.role}
            size={38}
          />
        </Animated.View>
      ))}
    </View>
  );
}

export function TripleConsumeEffect({
  containerTarget,
  event,
  onSettled,
}: TripleConsumeEffectProps) {
  if (!event || event.tiles.length === 0) {
    return null;
  }

  return (
    <TripleConsumeAnimation
      key={event.id}
      containerTarget={containerTarget}
      event={event}
      onSettled={onSettled}
    />
  );
}

const styles = StyleSheet.create({
  layer: {
    elevation: 42,
    zIndex: 42,
  },
  tile: {
    alignItems: 'center',
    backgroundColor: '#FFE7A6',
    borderBottomColor: '#C9922F',
    borderBottomWidth: 5,
    borderColor: '#E0B26A',
    borderRadius: 19,
    borderWidth: 2,
    height: TILE_SIZE,
    justifyContent: 'center',
    position: 'absolute',
    width: TILE_SIZE,
    ...shadows.tile,
  },
});
