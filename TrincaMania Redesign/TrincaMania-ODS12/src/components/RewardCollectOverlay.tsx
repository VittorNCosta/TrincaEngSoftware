import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { CoinPile } from './CoinPile';
import { GameIcon } from './GameIcon';
import { colors, fontSizes, radii, shadows, spacing } from '../styles/theme';
import { WindowTarget } from '../types/ui';
import { successImpact } from '../utils/haptics';
import { playCoinCascade } from '../utils/sounds';

type RewardCollectOverlayProps = {
  animationKey?: string;
  coinAmount: number;
  coinTarget?: WindowTarget;
  visible: boolean;
  onComplete: () => void;
};

const COIN_FLIGHT_DURATION_MS = 640;
const COIN_COLLECT_TOTAL_MS = 820;
const COIN_TARGET_POP_DELAY_MS = 660;
const COIN_COUNT_DELAY_MS = 560;

const COIN_PARTICLES = [
  {
    delay: 0,
    midLift: 112,
    rotate: -28,
    scale: 0.88,
    startX: -42,
    startY: -12,
  },
  {
    delay: 20,
    midLift: 136,
    rotate: 24,
    scale: 0.96,
    startX: -26,
    startY: -34,
  },
  { delay: 40, midLift: 96, rotate: -16, scale: 0.84, startX: -10, startY: 4 },
  { delay: 60, midLift: 124, rotate: 32, scale: 1, startX: 10, startY: -28 },
  { delay: 80, midLift: 108, rotate: -36, scale: 0.9, startX: 28, startY: 8 },
  {
    delay: 100,
    midLift: 146,
    rotate: 18,
    scale: 0.86,
    startX: 46,
    startY: -16,
  },
  {
    delay: 120,
    midLift: 116,
    rotate: -22,
    scale: 0.98,
    startX: -54,
    startY: 16,
  },
  { delay: 140, midLift: 132, rotate: 34, scale: 0.9, startX: 52, startY: 18 },
  {
    delay: 160,
    midLift: 104,
    rotate: -10,
    scale: 0.82,
    startX: -18,
    startY: 28,
  },
  { delay: 180, midLift: 140, rotate: 40, scale: 0.94, startX: 18, startY: 30 },
];

const BURST_PARTICLES = [
  { dx: -104, dy: -78, rotate: -18 },
  { dx: -58, dy: -116, rotate: 24 },
  { dx: -8, dy: -132, rotate: -8 },
  { dx: 50, dy: -112, rotate: 16 },
  { dx: 100, dy: -68, rotate: 32 },
  { dx: -86, dy: 36, rotate: 40 },
  { dx: 0, dy: 58, rotate: 0 },
  { dx: 86, dy: 32, rotate: -36 },
];

export function RewardCollectOverlay({
  animationKey = 'reward-collect',
  coinAmount,
  coinTarget,
  visible,
  onComplete,
}: RewardCollectOverlayProps) {
  const { height, width } = useWindowDimensions();
  const coinAnims = useRef(
    COIN_PARTICLES.map(() => new Animated.Value(0)),
  ).current;
  const burst = useRef(new Animated.Value(0)).current;
  const targetPop = useRef(new Animated.Value(0)).current;
  const countAnim = useRef(new Animated.Value(0)).current;
  const onCompleteRef = useRef(onComplete);
  const [displayAmount, setDisplayAmount] = useState(0);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!visible || coinAmount <= 0) {
      coinAnims.forEach((coinAnim) => coinAnim.setValue(0));
      burst.setValue(0);
      targetPop.setValue(0);
      countAnim.setValue(0);
      setDisplayAmount(0);
      return undefined;
    }

    coinAnims.forEach((coinAnim) => coinAnim.setValue(0));
    burst.setValue(0);
    targetPop.setValue(0);
    countAnim.setValue(0);
    setDisplayAmount(0);

    const countListener = countAnim.addListener(({ value }) => {
      setDisplayAmount(Math.min(coinAmount, Math.max(0, Math.round(value))));
    });
    const arrivalTimer = setTimeout(() => {
      playCoinCascade(3);
      successImpact();
    }, COIN_TARGET_POP_DELAY_MS + 40);

    const animation = Animated.parallel([
      Animated.timing(burst, {
        duration: 520,
        easing: Easing.out(Easing.cubic),
        toValue: 1,
        useNativeDriver: true,
      }),
      ...coinAnims.map((coinAnim, index) =>
        Animated.sequence([
          Animated.delay(COIN_PARTICLES[index].delay),
          Animated.timing(coinAnim, {
            duration: COIN_FLIGHT_DURATION_MS,
            easing: Easing.bezier(0.18, 0.84, 0.24, 1),
            toValue: 1,
            useNativeDriver: true,
          }),
        ]),
      ),
      Animated.sequence([
        Animated.delay(COIN_TARGET_POP_DELAY_MS),
        Animated.timing(targetPop, {
          duration: COIN_COLLECT_TOTAL_MS - COIN_TARGET_POP_DELAY_MS,
          easing: Easing.out(Easing.back(1.4)),
          toValue: 1,
          useNativeDriver: true,
        }),
      ]),
    ]);
    const countAnimation = Animated.sequence([
      Animated.delay(COIN_COUNT_DELAY_MS),
      Animated.timing(countAnim, {
        duration: COIN_COLLECT_TOTAL_MS - COIN_COUNT_DELAY_MS,
        easing: Easing.out(Easing.cubic),
        toValue: coinAmount,
        useNativeDriver: false,
      }),
    ]);

    animation.start(({ finished }) => {
      if (finished) {
        setDisplayAmount(coinAmount);
        onCompleteRef.current();
      }
    });
    countAnimation.start();

    return () => {
      clearTimeout(arrivalTimer);
      countAnim.removeListener(countListener);
      animation.stop();
      countAnimation.stop();
    };
  }, [
    animationKey,
    burst,
    coinAmount,
    coinAnims,
    countAnim,
    targetPop,
    visible,
  ]);

  if (!visible || coinAmount <= 0) {
    return null;
  }

  const targetCenterX = coinTarget
    ? coinTarget.x + coinTarget.width / 2
    : width - 54;
  const targetCenterY = coinTarget ? coinTarget.y + coinTarget.height / 2 : 60;
  const originX = width / 2;
  const originY = Math.min(height - 128, Math.max(220, height * 0.6));
  const targetLeft = Math.min(width - 112, Math.max(8, targetCenterX - 52));
  const targetTop = Math.min(height - 48, Math.max(8, targetCenterY - 20));
  const targetDx = targetCenterX - originX;
  const targetDy = targetCenterY - originY;
  const ringOpacity = burst.interpolate({
    inputRange: [0, 0.18, 0.86, 1],
    outputRange: [0, 0.86, 0.18, 0],
  });
  const ringScale = burst.interpolate({
    inputRange: [0, 1],
    outputRange: [0.42, 1.9],
  });
  const targetOpacity = targetPop.interpolate({
    inputRange: [0, 0.24, 1],
    outputRange: [0, 1, 1],
  });
  const targetScale = targetPop.interpolate({
    inputRange: [0, 0.72, 1],
    outputRange: [0.62, 1.18, 1],
  });

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.layer]}>
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
      <View
        pointerEvents="none"
        style={[styles.pile, { left: originX - 66, top: originY - 50 }]}
      >
        <CoinPile animationKey={animationKey} />
      </View>

      {BURST_PARTICLES.map((particle, index) => {
        const opacity = burst.interpolate({
          inputRange: [0, 0.16, 0.74, 1],
          outputRange: [0, 1, 0.62, 0],
        });
        const scale = burst.interpolate({
          inputRange: [0, 0.32, 1],
          outputRange: [0.32, 1.12, 0.42],
        });
        const translateX = burst.interpolate({
          inputRange: [0, 1],
          outputRange: [0, particle.dx],
        });
        const translateY = burst.interpolate({
          inputRange: [0, 1],
          outputRange: [0, particle.dy],
        });

        return (
          <Animated.View
            key={`reward-burst-${index}`}
            style={[
              styles.spark,
              {
                left: originX - 5,
                opacity,
                top: originY - 5,
                transform: [
                  { translateX },
                  { translateY },
                  { rotate: `${particle.rotate}deg` },
                  { scale },
                ],
              },
            ]}
          />
        );
      })}

      {COIN_PARTICLES.map((particle, index) => {
        const coinAnim = coinAnims[index];
        const midY = targetDy * 0.48 - particle.midLift;
        const opacity = coinAnim.interpolate({
          inputRange: [0, 0.08, 0.88, 1],
          outputRange: [0, 1, 1, 0.18],
        });
        const scale = coinAnim.interpolate({
          inputRange: [0, 0.18, 0.84, 1],
          outputRange: [0.42, particle.scale, particle.scale * 0.94, 0.38],
        });
        const translateX = coinAnim.interpolate({
          inputRange: [0, 0.58, 1],
          outputRange: [particle.startX, targetDx * 0.54, targetDx],
        });
        const translateY = coinAnim.interpolate({
          inputRange: [0, 0.58, 1],
          outputRange: [particle.startY, midY, targetDy],
        });
        const rotate = coinAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [`${particle.rotate}deg`, `${particle.rotate + 360}deg`],
        });

        return (
          <Animated.View
            key={`collect-coin-${index}`}
            style={[
              styles.coinParticle,
              {
                left: originX - 13,
                opacity,
                top: originY - 13,
                transform: [
                  { translateX },
                  { translateY },
                  { rotate },
                  { scale },
                ],
              },
            ]}
          >
            <GameIcon name="coin" size={26} tone="gold" variant="plain" />
          </Animated.View>
        );
      })}

      <Animated.View
        style={[
          styles.targetPop,
          {
            left: targetLeft,
            opacity: targetOpacity,
            top: targetTop,
            transform: [{ scale: targetScale }],
          },
        ]}
      >
        <GameIcon name="coin" size={24} tone="gold" />
        <Text numberOfLines={1} style={styles.targetText}>
          +{displayAmount}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  burstRing: {
    borderColor: 'rgba(255, 244, 184, 0.92)',
    borderRadius: radii.pill,
    borderWidth: 3,
    height: 88,
    position: 'absolute',
    width: 88,
  },
  coinParticle: {
    position: 'absolute',
    zIndex: 4,
  },
  layer: {
    elevation: 54,
    zIndex: 54,
  },
  pile: {
    position: 'absolute',
    zIndex: 5,
  },
  spark: {
    backgroundColor: '#FFF4B8',
    borderColor: '#FFD35A',
    borderRadius: 3,
    borderWidth: 1,
    height: 10,
    position: 'absolute',
    width: 10,
    zIndex: 3,
  },
  targetPop: {
    alignItems: 'center',
    backgroundColor: 'rgba(7, 24, 32, 0.94)',
    borderColor: '#FFE178',
    borderRadius: radii.pill,
    borderWidth: 2,
    flexDirection: 'row',
    gap: spacing.xs,
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    position: 'absolute',
    width: 104,
    zIndex: 5,
    ...shadows.glow,
  },
  targetText: {
    color: colors.inkOnDark,
    fontSize: fontSizes.md,
    fontWeight: '900',
    lineHeight: 18,
  },
});
