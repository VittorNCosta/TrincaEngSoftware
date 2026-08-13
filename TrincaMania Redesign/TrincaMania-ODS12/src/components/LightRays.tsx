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
