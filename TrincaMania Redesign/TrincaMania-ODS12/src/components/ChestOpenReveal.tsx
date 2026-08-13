import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { colors, fontSizes, radii, shadows, spacing } from '../styles/theme';

type ChestOpenRevealProps = {
  animationKey?: string;
  opened: boolean;
  progressText?: string;
  rewardText: string;
  onAnimationEnd?: () => void;
  onOpenMoment?: () => void;
  onRewardMoment?: () => void;
};

type ParticleConfig = {
  color: string;
  dx: number;
  dy: number;
  rotate: number;
  size: number;
};

const CHEST_OPEN_DURATION_MS = 1180;

const PARTICLES: ParticleConfig[] = [
  { color: '#FFFFFF', dx: -48, dy: -42, rotate: -30, size: 7 },
  { color: '#FFD35A', dx: -28, dy: -58, rotate: 28, size: 8 },
  { color: '#BDFBE4', dx: -8, dy: -64, rotate: -10, size: 6 },
  { color: '#FFFFFF', dx: 18, dy: -62, rotate: 16, size: 7 },
  { color: '#FFD35A', dx: 42, dy: -46, rotate: 36, size: 8 },
  { color: '#C8ECFF', dx: -56, dy: -12, rotate: -60, size: 6 },
  { color: '#FFF0C4', dx: 58, dy: -8, rotate: 64, size: 6 },
  { color: '#FFFFFF', dx: -34, dy: 20, rotate: 42, size: 5 },
  { color: '#BDFBE4', dx: 34, dy: 18, rotate: -42, size: 5 },
  { color: '#FFD35A', dx: -12, dy: 30, rotate: 12, size: 5 },
  { color: '#FFFFFF', dx: 12, dy: 32, rotate: -12, size: 5 },
  { color: '#FFF0C4', dx: 0, dy: -78, rotate: 0, size: 7 },
];

export function ChestOpenReveal({
  animationKey = 'common-chest',
  opened,
  progressText,
  rewardText,
  onAnimationEnd,
  onOpenMoment,
  onRewardMoment,
}: ChestOpenRevealProps) {
  const progress = useRef(new Animated.Value(opened ? 1 : 0)).current;
  const playedKeyRef = useRef<string | undefined>(undefined);
  const onAnimationEndRef = useRef(onAnimationEnd);
  const onOpenMomentRef = useRef(onOpenMoment);
  const onRewardMomentRef = useRef(onRewardMoment);

  useEffect(() => {
    onAnimationEndRef.current = onAnimationEnd;
  }, [onAnimationEnd]);

  useEffect(() => {
    onOpenMomentRef.current = onOpenMoment;
  }, [onOpenMoment]);

  useEffect(() => {
    onRewardMomentRef.current = onRewardMoment;
  }, [onRewardMoment]);

  useEffect(() => {
    if (!opened) {
      progress.stopAnimation();
      progress.setValue(0);
      playedKeyRef.current = undefined;
      return undefined;
    }

    if (playedKeyRef.current === animationKey) {
      return undefined;
    }

    playedKeyRef.current = animationKey;
    progress.stopAnimation();
    progress.setValue(0);

    const openTimer = setTimeout(() => {
      onOpenMomentRef.current?.();
    }, 520);
    const rewardTimer = setTimeout(() => {
      onRewardMomentRef.current?.();
    }, 860);

    const animation = Animated.timing(progress, {
      duration: CHEST_OPEN_DURATION_MS,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: true,
    });

    animation.start(({ finished }) => {
      if (finished) {
        onAnimationEndRef.current?.();
      }
    });

    return () => {
      clearTimeout(openTimer);
      clearTimeout(rewardTimer);
      animation.stop();
    };
  }, [animationKey, opened, progress]);

  const chestScale = progress.interpolate({
    inputRange: [0, 0.16, 0.28, 1],
    outputRange: [0.82, 1.08, 1, 1],
  });
  const chestShake = progress.interpolate({
    inputRange: [0, 0.22, 0.3, 0.38, 0.46, 0.54, 1],
    outputRange: [0, 0, -5, 5, -3, 0, 0],
  });
  const lidRotate = progress.interpolate({
    inputRange: [0, 0.44, 0.66, 1],
    outputRange: ['0deg', '0deg', '-24deg', '-24deg'],
  });
  const lidLift = progress.interpolate({
    inputRange: [0, 0.44, 0.66, 1],
    outputRange: [0, 0, -12, -12],
  });
  const glowOpacity = progress.interpolate({
    inputRange: [0, 0.24, 0.48, 0.78, 1],
    outputRange: [0, 0.18, 0.7, 0.28, 0.16],
  });
  const glowScale = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.72, 1.18, 1.05],
  });
  const rewardOpacity = progress.interpolate({
    inputRange: [0, 0.72, 0.9, 1],
    outputRange: [0, 0, 1, 1],
  });
  const rewardLift = progress.interpolate({
    inputRange: [0, 0.72, 1],
    outputRange: [8, 8, 0],
  });

  return (
    <View style={styles.panel}>
      <View style={styles.headerRow}>
        <Text style={styles.kicker}>Bau Comum</Text>
        {progressText ? <Text style={styles.progressText}>{progressText}</Text> : null}
      </View>

      <View style={styles.stage}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.glow,
            {
              opacity: glowOpacity,
              transform: [{ scale: glowScale }],
            },
          ]}
        />

        {PARTICLES.map((particle, index) => {
          const opacity = progress.interpolate({
            inputRange: [0, 0.46, 0.62, 0.9, 1],
            outputRange: [0, 0, 1, 0.16, 0],
          });
          const translateX = progress.interpolate({
            inputRange: [0, 0.46, 1],
            outputRange: [0, 0, particle.dx],
          });
          const translateY = progress.interpolate({
            inputRange: [0, 0.46, 1],
            outputRange: [0, 0, particle.dy],
          });
          const scale = progress.interpolate({
            inputRange: [0, 0.46, 0.64, 1],
            outputRange: [0.34, 0.34, 1, 0.22],
          });

          return (
            <Animated.View
              key={`common-chest-particle-${index}`}
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

        <Animated.View
          style={[
            styles.chest,
            {
              transform: [{ translateX: chestShake }, { scale: chestScale }],
            },
          ]}
        >
          <View style={styles.innerGlow} />
          <View style={styles.chestBody}>
            <View style={styles.bodyBand} />
            <View style={styles.chestLock} />
          </View>
          <Animated.View
            style={[
              styles.chestLid,
              {
                transform: [{ translateY: lidLift }, { rotate: lidRotate }],
              },
            ]}
          >
            <View style={styles.lidBand} />
          </Animated.View>
        </Animated.View>
      </View>

      <Animated.View
        style={[
          styles.rewardPill,
          {
            opacity: rewardOpacity,
            transform: [{ translateY: rewardLift }],
          },
        ]}
      >
        <Text numberOfLines={2} style={styles.rewardText}>
          {rewardText}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  bodyBand: {
    backgroundColor: '#FFD35A',
    bottom: 0,
    left: 34,
    position: 'absolute',
    top: 0,
    width: 12,
  },
  chest: {
    height: 72,
    position: 'relative',
    width: 92,
  },
  chestBody: {
    backgroundColor: '#2ECF8B',
    borderBottomColor: '#087A54',
    borderBottomWidth: 5,
    borderColor: '#FFE9A8',
    borderRadius: 14,
    borderWidth: 3,
    bottom: 3,
    height: 46,
    left: 3,
    overflow: 'hidden',
    position: 'absolute',
    right: 3,
  },
  chestLid: {
    backgroundColor: '#F0524F',
    borderBottomColor: '#A92735',
    borderBottomWidth: 4,
    borderColor: '#FFE9A8',
    borderRadius: 13,
    borderWidth: 3,
    height: 30,
    left: 8,
    overflow: 'hidden',
    position: 'absolute',
    top: 5,
    width: 76,
    zIndex: 3,
  },
  chestLock: {
    backgroundColor: '#FFF4B8',
    borderBottomColor: '#B56E00',
    borderBottomWidth: 3,
    borderColor: '#FFFFFF',
    borderRadius: 8,
    height: 22,
    left: 34,
    position: 'absolute',
    top: 10,
    width: 20,
    zIndex: 2,
  },
  glow: {
    backgroundColor: 'rgba(255, 211, 90, 0.72)',
    borderRadius: radii.pill,
    height: 82,
    position: 'absolute',
    width: 142,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  innerGlow: {
    backgroundColor: 'rgba(255, 244, 184, 0.66)',
    borderRadius: radii.pill,
    height: 34,
    left: 14,
    position: 'absolute',
    top: 20,
    width: 64,
    zIndex: 0,
  },
  kicker: {
    color: '#4B2C08',
    fontSize: fontSizes.xs,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  lidBand: {
    backgroundColor: '#FFD35A',
    bottom: 0,
    left: 30,
    position: 'absolute',
    top: 0,
    width: 11,
  },
  panel: {
    alignItems: 'center',
    backgroundColor: '#FFF7D6',
    borderColor: '#FFD35A',
    borderRadius: radii.card,
    borderWidth: 2,
    gap: 4,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 6,
    width: '100%',
    ...shadows.card,
  },
  particle: {
    borderRadius: radii.pill,
    left: '50%',
    marginLeft: -3,
    marginTop: -3,
    position: 'absolute',
    top: '50%',
  },
  progressText: {
    color: '#7A4C00',
    fontSize: fontSizes.xs,
    fontWeight: '900',
  },
  rewardPill: {
    alignItems: 'center',
    backgroundColor: '#EFFFF8',
    borderColor: colors.success,
    borderRadius: radii.pill,
    borderWidth: 2,
    minHeight: 30,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    width: '100%',
  },
  rewardText: {
    color: colors.successDark,
    fontSize: fontSizes.xs,
    fontWeight: '900',
    textAlign: 'center',
  },
  stage: {
    alignItems: 'center',
    height: 82,
    justifyContent: 'center',
    width: '100%',
  },
});
