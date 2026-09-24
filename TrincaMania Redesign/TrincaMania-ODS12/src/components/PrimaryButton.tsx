import { ReactNode, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSizes, radii, shadows, spacing } from '../styles/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type PrimaryButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  size?: 'regular' | 'compact' | 'small';
  /**
   * Id para teste. Opcional de propósito: só os botões que um fluxo precisa
   * alcançar ganham um, e aí o id diz o que aquele botão faz naquela tela —
   * um `testID` em todo botão viraria ruído sem virar cobertura.
   */
  testID?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'power';
  children?: ReactNode;
};

export function PrimaryButton({
  title,
  onPress,
  disabled = false,
  size = 'regular',
  testID,
  variant = 'primary',
  children,
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
      // Quando o botão traz `children` em vez do texto padrão (ícone, moeda,
      // contador), o leitor de tela não tinha nome nenhum para anunciar. O
      // `title` continua sendo a descrição correta nesses casos.
      accessibilityLabel={title}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      testID={testID}
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
    >
      <View pointerEvents="none" style={styles.topHighlight} />
      <View style={styles.content}>
        {children ?? (
          <Text
            style={[
              styles.label,
              size === 'small' ? styles.smallLabel : null,
              variant === 'secondary' ? styles.secondaryLabel : null,
              variant === 'primary' ? styles.primaryLabel : null,
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
    borderRadius: radii.pill,
    borderWidth: 2,
    justifyContent: 'center',
    overflow: 'hidden',
    ...shadows.button,
  },
  compact: {
    minHeight: 46,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  danger: {
    backgroundColor: '#F05278',
    borderBottomColor: '#A9274A',
    borderColor: '#FFB3C4',
  },
  disabled: {
    backgroundColor: '#A7B1B6',
    borderBottomColor: '#6D7A81',
    borderColor: '#D0D9DD',
    opacity: 0.72,
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
    backgroundColor: '#28C96F',
    borderBottomColor: '#087A54',
    borderColor: '#C7FFD9',
  },
  primaryLabel: {
    color: colors.inkOnDark,
  },
  power: {
    backgroundColor: '#7862F5',
    borderBottomColor: '#3C2D9D',
    borderColor: '#C8C1FF',
  },
  regular: {
    minHeight: 62,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  secondary: {
    backgroundColor: '#238DF5',
    borderBottomColor: '#0A4D95',
    borderColor: '#C8ECFF',
  },
  secondaryLabel: {
    color: colors.inkOnDark,
  },
  small: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
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
