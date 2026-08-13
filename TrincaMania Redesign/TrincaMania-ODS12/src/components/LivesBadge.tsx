import { StyleSheet, Text, View } from 'react-native';

import { colors, fontSizes, radii, shadows, spacing } from '../styles/theme';
import { LivesState, formatLifeTimer } from '../storage/livesStorage';

type LivesBadgeProps = {
  livesState: LivesState;
  timeUntilNextLifeMs: number;
  compact?: boolean;
  dark?: boolean;
};

export function LivesBadge({
  livesState,
  timeUntilNextLifeMs,
  compact = false,
  dark = false,
}: LivesBadgeProps) {
  const isFull = livesState.currentLives >= livesState.maxLives;
  const isEmpty = livesState.currentLives <= 0;

  return (
    <View
      style={[
        styles.container,
        compact ? styles.containerCompact : null,
        dark ? styles.containerDark : null,
        isEmpty ? styles.containerEmpty : null,
      ]}
    >
      <Text style={[styles.value, dark ? styles.valueDark : null, isEmpty ? styles.valueEmpty : null]}>
        {'♥'} {livesState.currentLives}/{livesState.maxLives}
      </Text>
      {!compact && !isFull ? (
        <Text style={[styles.timer, dark ? styles.timerDark : null]}>
          Próxima vida em {formatLifeTimer(timeUntilNextLifeMs)}
        </Text>
      ) : null}
      {compact && !isFull ? (
        <Text style={[styles.compactTimer, dark ? styles.timerDark : null]}>
          {formatLifeTimer(timeUntilNextLifeMs)}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  compactTimer: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '900',
    lineHeight: 10,
  },
  container: {
    alignItems: 'center',
    backgroundColor: '#FFF0F4',
    borderBottomColor: '#A9274A',
    borderBottomWidth: 3,
    borderColor: '#FFB3C4',
    borderRadius: radii.card,
    borderWidth: 2,
    gap: 2,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    ...shadows.card,
  },
  containerCompact: {
    borderRadius: radii.pill,
    minHeight: 30,
    minWidth: 62,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  containerDark: {
    backgroundColor: '#5F2230',
    borderBottomColor: '#2F0D18',
    borderColor: '#FFB3C4',
  },
  containerEmpty: {
    backgroundColor: '#FFE1E7',
    borderColor: '#F05278',
  },
  timer: {
    color: colors.muted,
    fontSize: fontSizes.xs,
    fontWeight: '900',
    textAlign: 'center',
  },
  timerDark: {
    color: '#FFE2E8',
  },
  value: {
    color: '#A9274A',
    fontSize: fontSizes.md,
    fontWeight: '900',
    lineHeight: 18,
  },
  valueDark: {
    color: colors.inkOnDark,
  },
  valueEmpty: {
    color: colors.dangerDark,
  },
});
