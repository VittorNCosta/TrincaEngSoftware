import { ReactNode, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSizes, radii, shadows, spacing } from '../styles/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type PrimaryButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  size?: 'regular' | 'compact' | 'small';
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'power';
  accessibilityLabel?: string;
  accessibilityHint?: string;
  children?: ReactNode;
  testID?: string;
};

export function PrimaryButton({
  title,
  onPress,
  disabled = false,
  size = 'regular',
  variant = 'primary',
  accessibilityLabel,
  accessibilityHint,
  children,
  testID,
}: PrimaryButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (value: number) => {
    Animated.spring(scale, {
      friction: 8,
      tension: 180,
      toValue: value,
      useNativeDriver: true,
    }).start();
  };

  return (
    <AnimatedPressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => animateTo(0.96)}
      onPressOut={() => animateTo(1)}
      style={[
        styles.button,
        styles[size],
        styles[variant],
        disabled ? styles.disabled : null,
        { transform: [{ scale }] },
      ]}
      testID={testID}
    >
      {variant !== 'ghost' ? (
        <View pointerEvents="none" style={styles.topHighlight} />
      ) : null}
      <View style={styles.content}>
        {children ?? (
          <Text
            style={[
              styles.label,
              size === 'small' ? styles.smallLabel : null,
              variant === 'secondary' ? styles.secondaryLabel : null,
              variant === 'primary' ? styles.primaryLabel : null,
              disabled ? styles.disabledLabel : null,
            ]}
          >
            {title}
          </Text>
        )}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderBottomWidth: 6,
    borderRadius: radii.button,
    borderWidth: 2,
    justifyContent: 'center',
    overflow: 'hidden',
    ...shadows.button,
  },
  compact: {
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  danger: {
    backgroundColor: colors.danger,
    borderBottomColor: colors.dangerDark,
    borderColor: colors.accentSoft,
  },
  disabled: {
    backgroundColor: colors.locked,
    borderBottomColor: colors.lockedText,
    borderColor: colors.lockedSurface,
  },
  disabledLabel: {
    color: '#07583E',
    textShadowColor: 'transparent',
  },
  label: {
    color: colors.inkOnDark,
    fontSize: fontSizes.lg,
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.28)',
    textShadowOffset: { height: 2, width: 0 },
    textShadowRadius: 2,
  },
  primary: {
    backgroundColor: colors.success,
    borderBottomColor: colors.successDark,
    borderColor: colors.successSoft,
  },
  primaryLabel: {
    color: '#07583E',
  },
  power: {
    backgroundColor: colors.action,
    borderBottomColor: colors.actionDark,
    borderColor: colors.surfaceSoft,
  },
  regular: {
    minHeight: 56,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  secondary: {
    backgroundColor: colors.action,
    borderBottomColor: colors.actionDark,
    borderColor: colors.surfaceSoft,
  },
  secondaryLabel: {
    color: colors.inkOnDark,
  },
  small: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderBottomColor: 'transparent',
    borderColor: colors.borderSoft,
    shadowOpacity: 0,
  },
  smallLabel: {
    fontSize: fontSizes.sm,
  },
  topHighlight: {
    backgroundColor: 'rgba(255, 255, 255, 0.34)',
    borderRadius: radii.pill,
    height: '38%',
    left: 8,
    position: 'absolute',
    right: 8,
    top: 4,
  },
});
