import { Animated, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { RewardAssetIcon } from './RewardAssetIcon';
import { radii } from '../styles/theme';

export type ChestVariant = 'common' | 'world';

type ChestArtProps = {
  openProgress?: Animated.Value;
  size?: number;
  style?: StyleProp<ViewStyle>;
  variant?: ChestVariant;
};

type ChestGlowProps = {
  opacity?: Animated.AnimatedInterpolation<number>;
  scale?: Animated.AnimatedInterpolation<number>;
  variant?: ChestVariant;
};

type RewardBurstProps = {
  progress: Animated.Value;
  variant?: ChestVariant;
};

type ParticleConfig = {
  color: string;
  dx: number;
  dy: number;
  rotate: number;
  size: number;
};

const CLOSED_PROGRESS = new Animated.Value(0);

const COMMON_PARTICLES: ParticleConfig[] = [
  { color: '#FFF8D8', dx: -82, dy: -92, rotate: -28, size: 8 },
  { color: '#FFD35A', dx: -54, dy: -124, rotate: 22, size: 10 },
  { color: '#BDFBE4', dx: -18, dy: -136, rotate: -12, size: 7 },
  { color: '#FFFFFF', dx: 22, dy: -132, rotate: 16, size: 8 },
  { color: '#FFD35A', dx: 62, dy: -112, rotate: 34, size: 10 },
  { color: '#C8ECFF', dx: 86, dy: -72, rotate: 58, size: 7 },
  { color: '#FFF8D8', dx: -96, dy: -40, rotate: -60, size: 7 },
  { color: '#FFFFFF', dx: 98, dy: -30, rotate: 62, size: 7 },
  { color: '#42E5A7', dx: -66, dy: 8, rotate: 42, size: 6 },
  { color: '#FFD35A', dx: 64, dy: 10, rotate: -38, size: 6 },
  { color: '#FFFFFF', dx: -24, dy: 26, rotate: 12, size: 5 },
  { color: '#BDFBE4', dx: 24, dy: 28, rotate: -12, size: 5 },
];

const WORLD_PARTICLES: ParticleConfig[] = [
  { color: '#FFF8D8', dx: -112, dy: -124, rotate: -28, size: 9 },
  { color: '#FFD35A', dx: -76, dy: -154, rotate: 22, size: 12 },
  { color: '#E6D8FF', dx: -34, dy: -168, rotate: -12, size: 8 },
  { color: '#8FF5FF', dx: 20, dy: -164, rotate: 16, size: 8 },
  { color: '#FFFFFF', dx: 70, dy: -144, rotate: 34, size: 9 },
  { color: '#FF8BD1', dx: 112, dy: -104, rotate: 58, size: 8 },
  { color: '#FFF8D8', dx: -126, dy: -48, rotate: -60, size: 8 },
  { color: '#D8C2FF', dx: 128, dy: -42, rotate: 62, size: 8 },
  { color: '#42E5A7', dx: -92, dy: 18, rotate: 42, size: 7 },
  { color: '#FFD35A', dx: 92, dy: 20, rotate: -38, size: 7 },
  { color: '#FFFFFF', dx: -34, dy: 42, rotate: 12, size: 6 },
  { color: '#8FF5FF', dx: 34, dy: 42, rotate: -12, size: 6 },
  { color: '#FF8BD1', dx: 0, dy: -186, rotate: 0, size: 7 },
  { color: '#FFF8D8', dx: 0, dy: 56, rotate: 0, size: 6 },
];

export function ChestGlow({
  opacity,
  scale,
  variant = 'common',
}: ChestGlowProps) {
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.glow,
        variant === 'world' ? styles.glowWorld : null,
        {
          opacity,
          transform: scale ? [{ scale }] : undefined,
        },
      ]}
    />
  );
}

export function RewardBurst({
  progress,
  variant = 'common',
}: RewardBurstProps) {
  const particles = variant === 'world' ? WORLD_PARTICLES : COMMON_PARTICLES;

  return (
    <>
      {particles.map((particle, index) => {
        const opacity = progress.interpolate({
          inputRange: [0, 0.48, 0.64, 0.9, 1],
          outputRange: [0, 0, 1, variant === 'world' ? 0.28 : 0.18, 0],
        });
        const translateX = progress.interpolate({
          inputRange: [0, 0.48, 1],
          outputRange: [0, 0, particle.dx],
        });
        const translateY = progress.interpolate({
          inputRange: [0, 0.48, 1],
          outputRange: [0, 0, particle.dy],
        });
        const scale = progress.interpolate({
          inputRange: [0, 0.48, 0.66, 1],
          outputRange: [0.28, 0.28, variant === 'world' ? 1.16 : 1.05, 0.24],
        });

        return (
          <Animated.View
            key={`${variant}-chest-burst-${index}`}
            pointerEvents="none"
            style={[
              styles.particle,
              {
                backgroundColor: particle.color,
                height: particle.size,
                opacity,
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
      })}
    </>
  );
}

export function ChestArt({
  openProgress = CLOSED_PROGRESS,
  size = 156,
  style,
  variant = 'common',
}: ChestArtProps) {
  const frameWidth = Math.round(size * 1.52);
  const glowOpacity = openProgress.interpolate({
    inputRange: [0, 0.5, 0.72, 1],
    outputRange: [
      0.16,
      0.22,
      variant === 'world' ? 0.46 : 0.34,
      variant === 'world' ? 0.28 : 0.2,
    ],
  });
  const glowScale = openProgress.interpolate({
    inputRange: [0, 0.72, 1],
    outputRange: [0.76, variant === 'world' ? 1.12 : 1.02, 0.96],
  });
  const lidLightOpacity = openProgress.interpolate({
    inputRange: [0, 0.48, 0.62, 0.82, 1],
    outputRange: [0, 0, variant === 'world' ? 0.96 : 0.86, 0.42, 0.18],
  });
  const lidLightScale = openProgress.interpolate({
    inputRange: [0, 0.62, 1],
    outputRange: [0.62, variant === 'world' ? 1.28 : 1.16, 0.92],
  });
  const lidLightLift = openProgress.interpolate({
    inputRange: [0, 0.62, 1],
    outputRange: [size * 0.08, -size * 0.06, -size * 0.1],
  });

  return (
    <View style={[styles.artFrame, { height: size, width: frameWidth }, style]}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.assetGlow,
          variant === 'world' ? styles.assetGlowWorld : null,
          {
            opacity: glowOpacity,
            transform: [{ scale: glowScale }],
          },
        ]}
      />
      <RewardAssetIcon
        name={variant === 'world' ? 'chestWorld' : 'chestCommon'}
        size={size}
        style={{ width: frameWidth }}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.lidLight,
          variant === 'world' ? styles.lidLightWorld : null,
          {
            height: Math.max(9, size * 0.12),
            opacity: lidLightOpacity,
            top: size * 0.35,
            transform: [
              { translateY: lidLightLift },
              { scaleX: lidLightScale },
            ],
            width: frameWidth * 0.5,
          },
        ]}
      />
    </View>
  );
}

export function CommonChestArt(props: Omit<ChestArtProps, 'variant'>) {
  return <ChestArt {...props} variant="common" />;
}

export function WorldChestArt(props: Omit<ChestArtProps, 'variant'>) {
  return <ChestArt {...props} variant="world" />;
}

const styles = StyleSheet.create({
  artFrame: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    position: 'relative',
  },
  assetGlow: {
    backgroundColor: 'rgba(255, 211, 90, 0.55)',
    borderRadius: radii.pill,
    height: '72%',
    position: 'absolute',
    width: '68%',
  },
  assetGlowWorld: {
    backgroundColor: 'rgba(156, 106, 255, 0.68)',
    height: '82%',
    width: '76%',
  },
  glow: {
    backgroundColor: 'rgba(255, 211, 90, 0.66)',
    borderRadius: radii.pill,
    height: 178,
    position: 'absolute',
    width: 224,
  },
  glowWorld: {
    backgroundColor: 'rgba(156, 106, 255, 0.7)',
    height: 220,
    width: 270,
  },
  lidLight: {
    backgroundColor: 'rgba(255, 244, 184, 0.9)',
    borderRadius: radii.pill,
    elevation: 8,
    position: 'absolute',
    shadowColor: '#FFF4B8',
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.72,
    shadowRadius: 14,
    zIndex: 6,
  },
  lidLightWorld: {
    backgroundColor: 'rgba(255, 235, 140, 0.96)',
    shadowColor: '#FFE178',
  },
  particle: {
    borderRadius: radii.pill,
    left: '50%',
    marginLeft: -4,
    marginTop: -4,
    position: 'absolute',
    top: '50%',
    zIndex: 8,
  },
});
