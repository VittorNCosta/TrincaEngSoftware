import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { colors, fontSizes, radii, shadows, spacing } from '../styles/theme';

type RewardBurstEvent = {
  comboCount: number;
  id: number;
  label: string;
};

type RewardBurstProps = {
  event?: RewardBurstEvent;
};

const PARTICLES = [
  '\u2728',
  '\u2B50',
  '\u2726',
  '\u2728',
  '\u2B50',
  '\u2726',
  '\u2728',
  '\u2B50',
];

export function RewardBurst({ event }: RewardBurstProps) {
  const burst = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!event) {
      burst.setValue(0);
      return undefined;
    }

    burst.setValue(0);
    const animation = Animated.timing(burst, {
      duration: 760,
      toValue: 1,
      useNativeDriver: true,
    });

    animation.start();

    return () => animation.stop();
  }, [burst, event]);

  if (!event) {
    return null;
  }

  const popScale = burst.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0.7, 1.12, 0.98],
  });
  const popOpacity = burst.interpolate({
    inputRange: [0, 0.15, 0.85, 1],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <View pointerEvents="none" style={styles.layer}>
      {PARTICLES.map((particle, index) => {
        const direction = index - (PARTICLES.length - 1) / 2;
        const translateY = burst.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -36 - (index % 4) * 8],
        });
        const translateX = burst.interpolate({
          inputRange: [0, 1],
          outputRange: [0, direction * 20],
        });
        const opacity = burst.interpolate({
          inputRange: [0, 0.2, 1],
          outputRange: [0, 1, 0],
        });

        return (
          <Animated.Text
            key={`${event.id}-${index}`}
            style={[
              styles.particle,
              {
                opacity,
                transform: [{ translateX }, { translateY }],
              },
            ]}
          >
            {particle}
          </Animated.Text>
        );
      })}
      <Animated.View
        style={[
          styles.badge,
          {
            opacity: popOpacity,
            transform: [{ scale: popScale }],
          },
        ]}
      >
        <Text style={styles.badgeTitle}>{event.label}</Text>
        {event.comboCount > 1 ? (
          <Text style={styles.badgeCombo}>Sequencia!</Text>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    backgroundColor: '#FFF4C9',
    borderColor: '#FFD35A',
    borderRadius: radii.pill,
    borderWidth: 3,
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    ...shadows.card,
  },
  badgeCombo: {
    color: '#F05278',
    fontSize: fontSizes.md,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  badgeTitle: {
    color: colors.ink,
    fontSize: fontSizes.xl,
    fontWeight: '900',
    textShadowColor: 'rgba(255, 211, 90, 0.58)',
    textShadowOffset: { height: 2, width: 0 },
    textShadowRadius: 2,
  },
  layer: {
    alignItems: 'center',
    alignSelf: 'center',
    height: 104,
    justifyContent: 'center',
    position: 'absolute',
    top: '54%',
    width: 230,
    zIndex: 12,
  },
  particle: {
    color: colors.primary,
    fontSize: 26,
    fontWeight: '900',
    position: 'absolute',
  },
});
