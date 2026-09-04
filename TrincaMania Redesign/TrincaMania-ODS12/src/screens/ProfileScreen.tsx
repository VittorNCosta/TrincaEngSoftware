import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { BOTTOM_NAV_HEIGHT } from '../components/BottomNavBar';
import { GameIcon, GameIconName, GameIconTone } from '../components/GameIcon';
import { ScreenShell } from '../components/ScreenShell';
import { TabScene } from '../components/TabScene';
import { LEVELS } from '../data/levels';
import { colors, fontSizes, radii, shadows, spacing } from '../styles/theme';
import { ProgressState } from '../types/game';
import { getCurrentWorldId } from '../utils/worldProgress';

type ProfileScreenProps = {
  progress: ProgressState;
};

type StatCardProps = {
  iconName: GameIconName;
  iconTone: GameIconTone;
  label: string;
  value: string;
};

function StatCard({ iconName, iconTone, label, value }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <GameIcon name={iconName} size={38} tone={iconTone} />
      <Text
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        numberOfLines={1}
        style={styles.statValue}
      >
        {value}
      </Text>
      <Text numberOfLines={1} style={styles.statLabel}>
        {label}
      </Text>
    </View>
  );
}

/**
 * Aba Perfil: a pílula de jogador que ficava no topo da antiga home, agora com
 * o resumo de progresso da campanha.
 */
export function ProfileScreen({ progress }: ProfileScreenProps) {
  const currentWorldId = getCurrentWorldId(progress);
  const totalStars = Object.values(progress.levelStars).reduce(
    (sum, stars) => sum + stars,
    0,
  );

  return (
    <ScreenShell scroll={false}>
      <TabScene worldId={currentWorldId}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.profilePill}>
            <View style={styles.avatar}>
              <GameIcon name="avatar" size={44} variant="plain" />
            </View>
            <View style={styles.profileCopy}>
              <Text numberOfLines={1} style={styles.profileName}>
                Trinca Mania
              </Text>
              <Text numberOfLines={1} style={styles.profileSubtitle}>
                Jornada casual
              </Text>
            </View>
          </View>

          <View style={styles.statGrid}>
            <StatCard
              iconName="map"
              iconTone="blue"
              label="Fases"
              value={`${progress.completedLevelIds.length}/${LEVELS.length}`}
            />
            <StatCard
              iconName="star"
              iconTone="gold"
              label="Estrelas"
              value={`${totalStars}`}
            />
            <StatCard
              iconName="coin"
              iconTone="gold"
              label="Moedas"
              value={`${progress.coins}`}
            />
            <StatCard
              iconName="key"
              iconTone="purple"
              label="Chaves"
              value={`${progress.keys}`}
            />
          </View>

          <View style={styles.notePanel}>
            <GameIcon name="info" size={32} tone="blue" />
            <View style={styles.noteCopy}>
              <Text style={styles.noteTitle}>Perfil</Text>
              <Text numberOfLines={2} style={styles.noteText}>
                Perfil completo em breve.
              </Text>
            </View>
          </View>
        </ScrollView>
      </TabScene>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    backgroundColor: '#5C2A9B',
    borderBottomColor: '#2C0E56',
    borderBottomWidth: 4,
    borderColor: '#FFD35A',
    borderRadius: 16,
    borderWidth: 3,
    height: 54,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 54,
  },
  content: {
    gap: spacing.sm,
    paddingBottom: BOTTOM_NAV_HEIGHT + spacing.lg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  noteCopy: {
    flex: 1,
    gap: 2,
  },
  notePanel: {
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.primary,
    borderRadius: 14,
    borderWidth: 2,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.sm,
    ...shadows.card,
  },
  noteText: {
    color: colors.ink,
    fontSize: fontSizes.sm,
    fontWeight: '800',
    lineHeight: 19,
  },
  noteTitle: {
    color: colors.primaryDark,
    fontSize: fontSizes.xs,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  profileCopy: {
    flex: 1,
    minWidth: 0,
  },
  profileName: {
    color: colors.inkOnDark,
    fontSize: fontSizes.lg,
    fontWeight: '900',
  },
  profilePill: {
    alignItems: 'center',
    backgroundColor: 'rgba(36, 21, 88, 0.86)',
    borderBottomColor: '#11082E',
    borderBottomWidth: 4,
    borderColor: 'rgba(255, 211, 90, 0.36)',
    borderRadius: radii.pill,
    borderWidth: 2,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 68,
    paddingHorizontal: spacing.sm,
    ...shadows.card,
  },
  profileSubtitle: {
    color: '#FFE9A8',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(57, 34, 125, 0.94)',
    borderBottomColor: colors.goldDark,
    borderBottomWidth: 4,
    borderColor: 'rgba(255, 211, 90, 0.78)',
    borderRadius: 16,
    borderWidth: 2,
    flexBasis: '48%',
    flexGrow: 1,
    gap: 3,
    justifyContent: 'center',
    minHeight: 108,
    padding: spacing.sm,
    ...shadows.card,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statLabel: {
    color: '#FFE9A8',
    fontSize: fontSizes.xs,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  statValue: {
    color: colors.inkOnDark,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 23,
  },
});
