import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { GameIcon } from './GameIcon';
import { colors, fontSizes, radii, shadows, spacing } from '../styles/theme';

type ChestProgressCardProps = {
  animationKey?: string;
  fromProgress: number;
  isLevelCounted: boolean;
  opened: boolean;
  requiredCount: number;
  toProgress: number;
  onCompletedAnimationEnd?: () => void;
};

const clampProgress = (value: number, requiredCount: number) =>
  Math.max(0, Math.min(requiredCount, Math.floor(value)));

export function ChestProgressCard({
  animationKey = 'common-chest-progress',
  fromProgress,
  isLevelCounted,
  opened,
  requiredCount,
  toProgress,
  onCompletedAnimationEnd,
}: ChestProgressCardProps) {
  const fillProgress = useRef(new Animated.Value(0)).current;
  const counterScale = useRef(new Animated.Value(1)).current;
  const sweepProgress = useRef(new Animated.Value(0)).current;
  const unlockPulse = useRef(new Animated.Value(0)).current;
  const completedKeyRef = useRef<string | undefined>(undefined);
  const onCompletedAnimationEndRef = useRef(onCompletedAnimationEnd);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isSettled, setIsSettled] = useState(true);

  const safeRequiredCount = Math.max(1, requiredCount);
  const safeFromProgress = clampProgress(fromProgress, safeRequiredCount);
  const safeToProgress = clampProgress(toProgress, safeRequiredCount);
  const shouldAnimate = isLevelCounted && safeFromProgress !== safeToProgress;
  const progressLabel =
    shouldAnimate && !isSettled
      ? `${safeFromProgress}/${safeRequiredCount} -> ${safeToProgress}/${safeRequiredCount}`
      : `${safeToProgress}/${safeRequiredCount}`;
  const message = opened
    ? isUnlocked
      ? 'Baú desbloqueado!'
      : 'Carregando recompensa...'
    : !isLevelCounted
      ? 'Complete fases novas para abrir.'
      : safeToProgress + 1 >= safeRequiredCount
        ? 'Falta apenas 1 fase para abrir.'
        : `Faltam ${safeRequiredCount - safeToProgress} fases para abrir.`;

  useEffect(() => {
    onCompletedAnimationEndRef.current = onCompletedAnimationEnd;
  }, [onCompletedAnimationEnd]);

  useEffect(() => {
    const startValue = safeFromProgress / safeRequiredCount;
    const endValue = safeToProgress / safeRequiredCount;

    fillProgress.stopAnimation();
    sweepProgress.stopAnimation();
    unlockPulse.stopAnimation();
    fillProgress.setValue(startValue);
    sweepProgress.setValue(0);
    unlockPulse.setValue(0);
    setIsUnlocked(opened && startValue >= 1);
    setIsSettled(!shouldAnimate);

    const fillAnimation = Animated.timing(fillProgress, {
      duration: shouldAnimate ? 900 : 240,
      easing: Easing.out(Easing.cubic),
      toValue: endValue,
      useNativeDriver: false,
    });
    const sweepAnimation = Animated.timing(sweepProgress, {
      duration: shouldAnimate ? 900 : 240,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: true,
    });
    const animation = Animated.parallel([fillAnimation, sweepAnimation]);

    animation.start(({ finished }) => {
      if (!finished) {
        return;
      }

      setIsSettled(true);
      Animated.sequence([
        Animated.spring(counterScale, {
          friction: 5,
          tension: 180,
          toValue: opened ? 1.18 : 1.1,
          useNativeDriver: true,
        }),
        Animated.spring(counterScale, {
          friction: 7,
          tension: 140,
          toValue: 1,
          useNativeDriver: true,
        }),
      ]).start();

      if (!opened || safeToProgress < safeRequiredCount) {
        return;
      }

      setIsUnlocked(true);
      Animated.sequence([
        Animated.timing(unlockPulse, {
          duration: 140,
          easing: Easing.out(Easing.quad),
          toValue: 0.42,
          useNativeDriver: true,
        }),
        Animated.timing(unlockPulse, {
          duration: 660,
          easing: Easing.out(Easing.cubic),
          toValue: 1,
          useNativeDriver: true,
        }),
      ]).start();

      if (completedKeyRef.current === animationKey) {
        return;
      }

      completedKeyRef.current = animationKey;
      onCompletedAnimationEndRef.current?.();
    });

    return () => {
      animation.stop();
      unlockPulse.stopAnimation();
    };
  }, [
    animationKey,
    counterScale,
    fillProgress,
    opened,
    safeFromProgress,
    safeRequiredCount,
    safeToProgress,
    shouldAnimate,
    sweepProgress,
    unlockPulse,
  ]);

  const fillWidth = fillProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });
  const sweepTranslate = sweepProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 260],
  });
  const sweepOpacity = sweepProgress.interpolate({
    inputRange: [0, 0.12, 0.86, 1],
    outputRange: [0, 0.95, 0.65, 0],
  });
  const unlockGlowOpacity = unlockPulse.interpolate({
    inputRange: [0, 0.16, 0.72, 1],
    outputRange: [0, 0.88, 0.32, 0],
  });
  const unlockGlowScale = unlockPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.72, 1.36],
  });
  const unlockTrackOpacity = unlockPulse.interpolate({
    inputRange: [0, 0.12, 0.68, 1],
    outputRange: [0, 1, 0.58, 0],
  });

  return (
    <View style={[styles.card, opened ? styles.cardUnlocked : null]}>
      <View
        pointerEvents="none"
        style={[styles.cardGlow, opened ? styles.cardGlowUnlocked : null]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.unlockHalo,
          {
            opacity: unlockGlowOpacity,
            transform: [{ scale: unlockGlowScale }],
          },
        ]}
      />
      <View style={styles.header}>
        <GameIcon name="chest" size={34} tone={opened ? 'green' : 'gold'} />
        <View style={styles.copy}>
          <Text numberOfLines={1} style={styles.title}>
            Baú Comum
          </Text>
          <Text
            numberOfLines={1}
            style={[styles.message, isUnlocked ? styles.unlockedText : null]}
          >
            {message}
          </Text>
        </View>
        <Animated.Text
          style={[styles.counter, { transform: [{ scale: counterScale }] }]}
        >
          {progressLabel}
        </Animated.Text>
      </View>

      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            opened ? styles.fillUnlocked : null,
            { width: fillWidth },
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[styles.unlockTrackGlow, { opacity: unlockTrackOpacity }]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.progressSweep,
            {
              opacity: sweepOpacity,
              transform: [{ translateX: sweepTranslate }, { rotate: '-18deg' }],
            },
          ]}
        />
        <View pointerEvents="none" style={styles.trackShine} />
      </View>

      <View style={styles.steps}>
        {Array.from({ length: safeRequiredCount }).map((_, index) => (
          <View
            key={`common-chest-step-${index}`}
            style={[
              styles.step,
              index < safeToProgress ? styles.stepActive : null,
              opened && index < safeToProgress ? styles.stepUnlocked : null,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF8E6',
    borderColor: '#F4C84F',
    borderRadius: radii.card,
    borderWidth: 2,
    gap: 5,
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    position: 'relative',
    width: '100%',
    ...shadows.card,
  },
  cardGlow: {
    backgroundColor: 'rgba(255, 211, 90, 0.22)',
    borderRadius: radii.pill,
    height: 54,
    position: 'absolute',
    right: -30,
    top: -22,
    width: 140,
  },
  cardGlowUnlocked: {
    backgroundColor: 'rgba(66, 229, 167, 0.25)',
  },
  cardUnlocked: {
    backgroundColor: '#F2FFF8',
    borderColor: colors.success,
  },
  copy: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  counter: {
    backgroundColor: 'rgba(255, 211, 90, 0.22)',
    borderColor: 'rgba(122, 76, 0, 0.22)',
    borderRadius: radii.pill,
    borderWidth: 1,
    color: '#6D3F00',
    fontSize: fontSizes.xs,
    fontWeight: '900',
    minWidth: 58,
    overflow: 'hidden',
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    textAlign: 'center',
  },
  fill: {
    backgroundColor: '#FFD35A',
    borderRadius: radii.pill,
    height: '100%',
  },
  fillUnlocked: {
    backgroundColor: colors.success,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    width: '100%',
  },
  message: {
    color: colors.muted,
    fontSize: fontSizes.xs,
    fontWeight: '800',
  },
  step: {
    backgroundColor: 'rgba(7, 24, 32, 0.18)',
    borderRadius: radii.pill,
    flex: 1,
    height: 4,
  },
  stepActive: {
    backgroundColor: '#FFCF4D',
  },
  stepUnlocked: {
    backgroundColor: '#42E5A7',
  },
  progressSweep: {
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    height: 34,
    left: 0,
    position: 'absolute',
    top: -11,
    width: 28,
  },
  steps: {
    flexDirection: 'row',
    gap: 4,
    width: '100%',
  },
  title: {
    color: colors.ink,
    fontSize: fontSizes.sm,
    fontWeight: '900',
  },
  track: {
    backgroundColor: 'rgba(7, 24, 32, 0.18)',
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 12,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  trackShine: {
    backgroundColor: 'rgba(255, 255, 255, 0.32)',
    borderRadius: radii.pill,
    height: 4,
    left: 3,
    position: 'absolute',
    right: 3,
    top: 2,
  },
  unlockHalo: {
    backgroundColor: 'rgba(255, 244, 184, 0.48)',
    borderRadius: radii.pill,
    height: 78,
    position: 'absolute',
    right: -18,
    top: -18,
    width: 150,
  },
  unlockTrackGlow: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: radii.pill,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  unlockedText: {
    color: colors.successDark,
  },
});
