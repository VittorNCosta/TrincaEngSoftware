import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GameIcon, GameIconName, GameIconTone } from './GameIcon';
import { colors, radii, shadows, spacing } from '../styles/theme';
import { Level } from '../types/game';
import { getLevelDisplayLabel } from '../utils/levelDisplay';

type LevelCardProps = {
  completed: boolean;
  level: Level;
  locked: boolean;
  onPress: (levelId: string) => void;
};

export function LevelCard({
  completed,
  level,
  locked,
  onPress,
}: LevelCardProps) {
  const displayLabel = getLevelDisplayLabel(level);
  const statusLabel = completed
    ? 'Concluida'
    : locked
      ? 'Bloqueada'
      : 'Liberada';
  const statusIconName: GameIconName = completed
    ? 'star'
    : locked
      ? 'lock'
      : 'play';
  const statusIconTone: GameIconTone = completed
    ? 'gold'
    : locked
      ? 'neutral'
      : 'green';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={locked}
      onPress={() => onPress(level.id)}
      style={({ pressed }) => [
        styles.card,
        !completed && !locked ? styles.unlockedCard : null,
        completed ? styles.completedCard : null,
        locked ? styles.locked : null,
        pressed && !locked ? styles.pressed : null,
      ]}
    >
      <View
        style={[
          styles.levelBadge,
          completed ? styles.completedBadge : null,
          locked ? styles.lockedBadge : null,
        ]}
      >
        <Text
          style={[
            styles.levelBadgeText,
            locked ? styles.lockedBadgeText : null,
          ]}
        >
          {displayLabel}
        </Text>
      </View>
      <View style={styles.copy}>
        <Text style={[styles.title, locked ? styles.lockedTitle : null]}>
          {level.title}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.details}>{level.tiles.length} peças</Text>
          <Text
            style={[
              styles.statusText,
              completed ? styles.completedText : null,
              !completed && !locked ? styles.unlockedText : null,
            ]}
          >
            {statusLabel}
          </Text>
        </View>
      </View>
      <View
        style={[styles.statusIcon, locked ? styles.lockedStatusIcon : null]}
      >
        <GameIcon
          muted={locked}
          name={statusIconName}
          size={28}
          tone={statusIconTone}
          variant="plain"
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 2,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 78,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...shadows.card,
  },
  completedBadge: {
    backgroundColor: colors.secondary,
    borderColor: '#87FFE8',
  },
  completedCard: {
    borderColor: colors.secondary,
  },
  completedText: {
    color: colors.success,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  details: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
  },
  levelBadge: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderColor: '#FFE894',
    borderRadius: radii.sm,
    borderWidth: 2,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  levelBadgeText: {
    color: colors.ink,
    fontSize: 21,
    fontWeight: '900',
  },
  locked: {
    backgroundColor: '#DDE2F7',
    borderColor: colors.locked,
    opacity: 0.82,
  },
  lockedBadge: {
    backgroundColor: colors.locked,
    borderColor: '#DDE2F7',
  },
  lockedBadgeText: {
    color: colors.surface,
  },
  lockedStatusIcon: {
    opacity: 0.82,
  },
  lockedTitle: {
    color: colors.muted,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pressed: {
    transform: [{ translateY: 2 }, { scale: 0.99 }],
  },
  statusIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
  },
  statusText: {
    color: colors.panel,
    fontSize: 13,
    fontWeight: '900',
  },
  title: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '900',
  },
  unlockedCard: {
    borderColor: colors.primary,
  },
  unlockedText: {
    color: colors.primaryDark,
  },
});
