import { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';
import { IS_E2E_BUILD } from '../testing/e2eProfile';
import { createSeededRandom } from '../utils/deterministicRandom';

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
  const pieces = useMemo(() => {
    const random = IS_E2E_BUILD ? createSeededRandom(0xc0ffee) : Math.random;
    return Array.from({ length: count }).map((_, index) => ({
      color: COLORS[index % COLORS.length],
      delay: Math.round(random() * 2000),
      drift: Math.round((random() - 0.5) * 90),
      duration: 2400 + Math.round(random() * 1700),
      height: 8 + Math.round(random() * 12),
      left: Math.round(random() * Math.max(1, window.width - 16)),
      spin: random() > 0.5 ? 1 : -1,
      width: 6 + Math.round(random() * 5),
    }));
  }, [count, window.width]);
  const progressValues = useMemo(
    () => pieces.map(() => new Animated.Value(0)),
    [pieces],
  );

  useEffect(() => {
    if (IS_E2E_BUILD && visible) {
      progressValues.forEach((value) => value.setValue(0.15));
      return undefined;
    }
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
