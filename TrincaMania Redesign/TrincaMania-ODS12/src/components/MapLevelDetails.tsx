import { memo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useBottomNavClearance } from './BottomNavBar';
import { TileIcon } from './TileIcon';
import {
  MATERIAL_TYPES,
  getMaterial,
} from '../domain/recycling/value-objects/MaterialType';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { PrimaryButton } from '../original/components/PrimaryButton';
import { StarRating } from '../original/components/StarRating';
import { colors, forestPolish, radii, spacing } from '../original/styles/theme';
import { getDifficultyLabel } from '../screens/levelSelect/mapPresentation';
import type { Level } from '../types/game';
import { getLevelDisplayLabel } from '../utils/levelDisplay';

// Apresentação adaptada do original e32e5bd; seleção e desbloqueios ficam no mapa.
export const MapLevelDetails = memo(function MapLevelDetails({
  level,
  stars,
  locked,
  onPlay,
}: {
  level: Level;
  stars: number;
  locked: boolean;
  onPlay: () => void;
}) {
  const { width, height, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const bottomNavClearance = useBottomNavClearance();
  const reduceMotion = useReducedMotion();
  const wide = width / fontScale >= 600;

  return (
    <View
      testID="map-level-details"
      style={[
        styles.card,
        {
          maxHeight: Math.min(
            height * 0.72,
            height - insets.top - bottomNavClearance - 32,
          ),
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.phase}>FASE {getLevelDisplayLabel(level)}</Text>
        <Text style={styles.title}>{level.title}</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={[styles.body, wide && styles.wide]}>
          <View style={[styles.copy, wide && styles.wideIdentity]}>
            <Text style={styles.difficulty}>
              {getDifficultyLabel(level.difficulty)}
            </Text>
            <Text style={styles.description}>{level.objectiveText}</Text>
            <StarRating earnedStars={stars} inactiveSize={18} size={20} />
            {locked ? (
              <Text style={styles.description}>
                Complete a fase anterior para desbloquear.
              </Text>
            ) : null}
          </View>
          <View style={[styles.actions, wide && styles.wideActions]}>
            <Text style={styles.piecesLabel}>Possíveis materiais</Text>
            <View style={styles.pieces}>
              {MATERIAL_TYPES.map((kind) => (
                <View
                  key={kind}
                  accessible
                  accessibilityLabel={getMaterial(kind).label}
                  style={styles.tile}
                >
                  <TileIcon
                    kind={kind}
                    role="lixeira"
                    fallbackEmoji=""
                    size={24}
                  />
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
      <PrimaryButton
        testID="jogar-fase"
        title={locked ? 'Bloqueada' : 'Jogar'}
        disabled={locked}
        onPress={onPlay}
        appearance="forest"
        reduceMotion={reduceMotion}
      >
        {!locked ? (
          <LinearGradient
            pointerEvents="none"
            colors={['#43A519', '#20830A', '#075F30']}
            style={[styles.playGradient, { width }]}
          />
        ) : null}
        <View style={styles.playContent}>
          {!locked ? <View style={styles.playIcon} /> : null}
          <Text style={[styles.playLabel, locked && styles.lockedLabel]}>
            {locked ? 'Bloqueada' : 'Jogar'}
          </Text>
        </View>
      </PrimaryButton>
    </View>
  );
});

const styles = StyleSheet.create({
  card: { flexShrink: 1, gap: spacing.sm },
  header: { paddingRight: 36, gap: 6 },
  scroll: { flexShrink: 1 },
  content: { gap: spacing.sm, paddingBottom: spacing.xs },
  phase: {
    color: forestPolish.wood,
    fontSize: 15,
    fontWeight: '900',
    backgroundColor: colors.gold,
    borderColor: forestPolish.cream,
    borderWidth: 2,
    borderRadius: radii.pill,
    paddingHorizontal: 16,
    paddingVertical: 5,
    alignSelf: 'center',
  },
  body: { gap: spacing.sm },
  wide: { flexDirection: 'row', alignItems: 'center' },
  wideIdentity: { flex: 1 },
  copy: { minWidth: 0, gap: 5, justifyContent: 'center' },
  title: { color: forestPolish.woodDark, fontSize: 22, fontWeight: '900' },
  difficulty: {
    color: forestPolish.wood,
    backgroundColor: colors.surfaceWarm,
    borderColor: forestPolish.bark,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    fontSize: 13,
    fontWeight: '900',
  },
  description: { color: forestPolish.woodDark, fontSize: 13 },
  actions: { gap: 5 },
  wideActions: { width: '34%' },
  piecesLabel: {
    color: forestPolish.wood,
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },
  pieces: { flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  tile: {
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 2,
  },
  playContent: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '100%',
    gap: spacing.md,
  },
  playGradient: { position: 'absolute', height: 70 },
  playLabel: {
    color: '#FFFFFF',
    flexShrink: 1,
    fontSize: 26,
    fontWeight: '900',
  },
  lockedLabel: { color: forestPolish.woodDark },
  playIcon: {
    width: 0,
    height: 0,
    borderTopWidth: 12,
    borderBottomWidth: 12,
    borderLeftWidth: 19,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#FFFFFF',
  },
});
