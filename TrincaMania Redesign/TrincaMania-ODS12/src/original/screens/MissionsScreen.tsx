import { useState } from 'react';
import {
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  View,
  StyleSheet,
} from 'react-native';
import { ScreenShell } from '../components/ScreenShell';
import { ForestFrame } from '../components/ForestFrame';
import { GameIcon } from '../components/GameIcon';
import { MenuCard, MenuProgressBar } from '../components/MenuPrimitives';
import { useBottomNavClearance } from '../components/BottomNavBar';
import {
  colors,
  fontSizes,
  forestPolish,
  radii,
  shadows,
  spacing,
  touchTargets,
} from '../styles/theme';
import { ProgressState } from '../../types/game';
import { LEVELS } from '../../data/levels';
import { WORLDS } from '../../data/worlds';
const missionLayout = {
  headerHeight: 56,
  boardBorder: 2,
  listPadding: 6,
  summaryHeight: 52,
  summaryGap: 1,
  summaryTitleLineHeight: 19,
  summaryRenewalLineHeight: 15,
  summaryVerticalPadding: 5,
  tabHeight: 48,
  tabsPadding: 3,
  portraitSize: 28,
  objectiveIconSize: 42,
  titleLineHeight: 21,
  descriptionLineHeight: 17,
  statusLineHeight: 16,
  progressLabelHeight: 17,
  progressBarHeight: 6,
  rewardHeight: 48,
  cardPadding: 8,
  cardGap: 4,
  listGap: 6,
  listPaddingTop: 4,
};
type Props = { progress: ProgressState; onClose: () => void };
export function MissionsScreen({ progress, onClose }: Props) {
  const [section, setSection] = useState<'campaign' | 'worlds'>('campaign');
  const clearance = useBottomNavClearance();
  const completed = LEVELS.filter((level) =>
    progress.completedLevelIds.includes(level.id),
  ).length;
  const stars = Object.values(progress.levelStars).reduce(
    (sum, count) => sum + count,
    0,
  );
  const goals =
    section === 'campaign'
      ? [
          {
            id: 'first-steps',
            title: 'Primeiros ciclos',
            description: 'Conclua as primeiras 3 fases da coleta seletiva.',
            amount: completed,
            target: 3,
          },
          {
            id: 'first-world',
            title: 'Parque da Coleta Seletiva',
            description: 'Conclua as 10 fases do primeiro mundo.',
            amount: LEVELS.filter(
              (level) =>
                level.worldId === 1 &&
                progress.completedLevelIds.includes(level.id),
            ).length,
            target: 10,
          },
          {
            id: 'stars',
            title: 'Coleta com excelência',
            description: 'Conquiste estrelas nas fases da campanha.',
            amount: stars,
            target: LEVELS.length * 3,
          },
        ]
      : WORLDS.map((world) => ({
          id: String(world.id),
          title: world.name,
          description: world.subtitle,
          amount: world.levelIds.filter((id) =>
            progress.completedLevelIds.includes(id),
          ).length,
          target: world.levelIds.length,
        }));
  return (
    <ScreenShell scroll={false}>
      <ImageBackground
        source={require('../../../assets/original/map/map_world1_bg.png')}
        style={{ flex: 1, margin: -spacing.md }}
      >
        <View
          style={{
            flex: 1,
            padding: spacing.md,
            paddingBottom: clearance + spacing.sm,
          }}
        >
          <View style={styles.header}>
            <ForestFrame />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Voltar ao mapa"
              onPress={onClose}
              style={styles.backButton}
            >
              <GameIcon name="back" size={24} tone="gold" />
            </Pressable>
            <Text accessibilityRole="header" style={styles.headerTitle}>
              Missões
            </Text>
            <View style={styles.walletPill}>
              <GameIcon name="coin" size={22} tone="gold" />
              <Text style={styles.walletText}>{progress.coins}</Text>
            </View>
          </View>
          <View style={styles.board}>
            <View style={styles.summary}>
              <Text style={styles.summaryTitle}>Jornada de reciclagem</Text>
              <Text style={styles.renewalText}>
                {completed}/{LEVELS.length} fases concluídas
              </Text>
            </View>
            <View style={styles.sectionTabs}>
              {(['campaign', 'worlds'] as const).map((key) => (
                <Pressable
                  key={key}
                  accessibilityRole="tab"
                  aria-selected={section === key}
                  accessibilityState={{ selected: section === key }}
                  onPress={() => setSection(key)}
                  style={[
                    styles.sectionTab,
                    section === key && styles.sectionTabActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.sectionTabText,
                      section === key && styles.sectionTabTextActive,
                    ]}
                  >
                    {key === 'campaign' ? 'Campanha' : 'Mundos'}
                  </Text>
                </Pressable>
              ))}
            </View>
            <ScrollView
              contentContainerStyle={{ padding: spacing.sm, gap: spacing.sm }}
              showsVerticalScrollIndicator={false}
            >
              {goals.map((goal) => {
                const amount = Math.min(goal.amount, goal.target);
                const done = amount === goal.target;
                return (
                  <MenuCard
                    key={goal.id}
                    variant={done ? 'selected' : 'standard'}
                    style={styles.card}
                  >
                    <View style={styles.cardTop}>
                      <GameIcon
                        name={done ? 'check' : 'map'}
                        size={32}
                        tone={done ? 'green' : 'gold'}
                      />
                      <View style={styles.cardCopy}>
                        <Text
                          accessibilityRole="header"
                          style={styles.cardTitle}
                        >
                          {goal.title}
                        </Text>
                        <Text style={styles.description}>
                          {goal.description}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.objectiveMeta}>
                      <Text style={styles.objectiveLabel}>
                        {done ? 'CONCLUÍDA' : 'EM ANDAMENTO'}
                      </Text>
                      <Text style={styles.progressValue}>
                        {amount}/{goal.target}
                      </Text>
                    </View>
                    <MenuProgressBar
                      accessibilityLabel={`${goal.title}: ${amount} de ${goal.target}`}
                      value={goal.target > 0 ? (amount / goal.target) * 100 : 0}
                      tone={done ? 'success' : undefined}
                    />
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Continuar ${goal.title} no mapa`}
                      onPress={onClose}
                      style={styles.claimButton}
                    >
                      <Text style={styles.claimText}>VOLTAR AO MAPA</Text>
                    </Pressable>
                  </MenuCard>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </ImageBackground>
    </ScreenShell>
  );
}
const styles = StyleSheet.create({
  forestShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(24, 45, 12, 0.22)',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: missionLayout.headerHeight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    ...shadows.menuCard,
  },
  headerTitle: {
    flex: 1,
    color: forestPolish.cream,
    fontSize: fontSizes.xl,
    lineHeight: 27,
    fontWeight: '900',
    paddingLeft: spacing.xs,
    textAlign: 'left',
    textShadowColor: forestPolish.woodDark,
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 2,
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: forestPolish.cream,
    borderColor: forestPolish.bark,
    borderWidth: 2,
    borderBottomWidth: 3,
    borderRadius: radii.button,
    minHeight: touchTargets.minimum,
    width: touchTargets.minimum,
  },
  board: {
    flex: 1,
    minHeight: 0,
    backgroundColor: forestPolish.cream,
    borderColor: forestPolish.wood,
    borderWidth: missionLayout.boardBorder,
    borderBottomWidth: missionLayout.boardBorder,
    borderRadius: radii.menuCard,
    overflow: 'hidden',
    ...shadows.card,
  },
  summary: {
    alignItems: 'center',
    backgroundColor: colors.surfaceWarm,
    flexDirection: 'row',
    gap: 6,
    minHeight: missionLayout.summaryHeight,
    paddingHorizontal: spacing.sm,
    paddingVertical: missionLayout.summaryVerticalPadding,
  },
  summaryCopy: { flex: 1, minWidth: 0, gap: missionLayout.summaryGap },
  summaryTitle: {
    color: forestPolish.woodDark,
    fontSize: fontSizes.md,
    fontWeight: '900',
    lineHeight: missionLayout.summaryTitleLineHeight,
  },
  renewalText: {
    color: forestPolish.wood,
    fontSize: fontSizes.xs,
    fontWeight: '700',
    lineHeight: missionLayout.summaryRenewalLineHeight,
  },
  card: {
    backgroundColor: colors.creamLight,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: missionLayout.cardGap,
    overflow: 'hidden',
    padding: missionLayout.cardPadding,
  },
  cardClaimed: {
    backgroundColor: '#F7F1DF',
    borderColor: '#D9D0B8',
    elevation: 0,
    shadowOpacity: 0,
  },
  cardAccent: {
    backgroundColor: forestPolish.moss,
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 4,
  },
  cardAccentClaimed: { backgroundColor: '#91A084' },
  cardAccentReady: { backgroundColor: forestPolish.leaf },
  cardCopy: { flex: 1, minWidth: 0, gap: 2 },
  cardFooter: {
    alignItems: 'center',
    borderTopColor: '#EAD9B6',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
    paddingTop: 6,
  },
  cardFooterStacked: { alignItems: 'stretch', flexDirection: 'column' },
  cardReady: {
    backgroundColor: '#FFF8E7',
    borderColor: '#C69A46',
    borderWidth: 1,
  },
  cardTitle: {
    flex: 1,
    color: forestPolish.woodDark,
    fontSize: fontSizes.lg,
    fontWeight: '900',
    lineHeight: missionLayout.titleLineHeight,
  },
  cardTop: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.sm },
  claimButton: {
    backgroundColor: colors.successDark,
    borderBottomColor: '#245A35',
    borderBottomWidth: 3,
    borderColor: '#6EB96A',
    borderRadius: radii.button,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: touchTargets.minimum,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    overflow: 'hidden',
    ...shadows.menuCard,
  },
  claimButtonStacked: { alignSelf: 'stretch' },
  claimButtonWaiting: {
    backgroundColor: '#F4E3BC',
    borderColor: '#D5B37C',
    borderBottomColor: '#A87943',
    elevation: 0,
    shadowOpacity: 0,
  },
  claimText: {
    color: forestPolish.cream,
    fontSize: fontSizes.sm,
    fontWeight: '900',
    textAlign: 'center',
  },
  claimTextWaiting: { color: forestPolish.woodDark },
  claimStatus: {
    backgroundColor: '#FFF1CC',
    borderColor: colors.gold,
    borderRadius: radii.sm,
    borderWidth: 1,
    color: forestPolish.woodDark,
    fontSize: fontSizes.sm,
    fontWeight: '800',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    textAlign: 'center',
  },
  container: { flex: 1, gap: spacing.sm },
  description: {
    color: forestPolish.wood,
    fontSize: fontSizes.sm,
    fontWeight: '600',
    lineHeight: missionLayout.descriptionLineHeight,
  },
  errorText: {
    backgroundColor: '#FFE2E8',
    borderRadius: radii.sm,
    color: colors.dangerDark,
    fontSize: fontSizes.xs,
    fontWeight: '800',
    padding: spacing.sm,
    textAlign: 'center',
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  mainIcon: {
    alignItems: 'center',
    backgroundColor: '#F7E8C6',
    borderColor: '#E4C78F',
    borderRadius: radii.md,
    borderWidth: 1,
    height: missionLayout.objectiveIconSize,
    justifyContent: 'center',
    width: missionLayout.objectiveIconSize,
  },
  multiTile: { position: 'absolute' },
  multiTileIcon: { position: 'relative' },
  missionList: {
    gap: missionLayout.listGap,
    paddingBottom: spacing.lg,
    paddingTop: missionLayout.listPaddingTop,
    paddingHorizontal: missionLayout.listPadding,
  },
  missionScroll: { flex: 1, minHeight: 0 },
  objectiveLabel: {
    color: '#765135',
    flexShrink: 1,
    fontSize: fontSizes.xs,
    fontWeight: '800',
    lineHeight: missionLayout.progressLabelHeight,
  },
  objectiveLabelWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    gap: 4,
  },
  objectiveMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  objectiveRow: { gap: 4 },
  portraitWrap: {
    alignItems: 'center',
    backgroundColor: '#EFFFF8',
    borderColor: colors.gold,
    borderRadius: radii.pill,
    borderWidth: 1,
    height: missionLayout.portraitSize + 4,
    justifyContent: 'center',
    overflow: 'hidden',
    width: missionLayout.portraitSize + 4,
  },
  pressed: { opacity: 0.86 },
  progressFill: {
    backgroundColor: forestPolish.leaf,
    borderRadius: radii.pill,
    height: '100%',
  },
  progressFillClaimed: { backgroundColor: '#98AF8C' },
  progressGroup: { gap: spacing.xs },
  progressTip: {
    backgroundColor: '#EAC25F',
    height: '100%',
    position: 'absolute',
    right: 0,
    width: 8,
  },
  progressTrack: {
    backgroundColor: '#EBD9B4',
    borderColor: '#D2B681',
    borderRadius: radii.pill,
    borderWidth: 1,
    height: missionLayout.progressBarHeight,
    overflow: 'hidden',
  },
  progressValue: {
    color: forestPolish.woodDark,
    fontSize: fontSizes.xs,
    fontWeight: '900',
  },
  rewardAmount: {
    color: forestPolish.woodDark,
    fontSize: fontSizes.md,
    fontWeight: '900',
  },
  rewardInline: {
    flex: 1,
    minHeight: missionLayout.rewardHeight,
    minWidth: 0,
    justifyContent: 'center',
  },
  rewardLabel: {
    color: forestPolish.wood,
    fontSize: fontSizes.xs,
    fontWeight: '900',
    letterSpacing: 0.5,
    lineHeight: 13,
  },
  rewardItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 34,
    backgroundColor: '#F9E9C5',
    borderColor: '#E7D19F',
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 8,
  },
  rewardItems: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  screen: { flex: 1 },
  sectionTab: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    borderRadius: radii.sm,
    borderWidth: 0,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    minHeight: missionLayout.tabHeight,
    paddingHorizontal: spacing.sm,
  },
  sectionTabActive: {
    backgroundColor: forestPolish.cream,
    borderBottomColor: forestPolish.leaf,
    borderBottomWidth: 3,
  },
  sectionTabActiveWeekly: { borderBottomColor: '#C3903B' },
  sectionTabText: {
    color: forestPolish.wood,
    fontSize: fontSizes.sm,
    fontWeight: '900',
  },
  sectionTabTextActive: { color: forestPolish.woodDark },
  sectionTabs: {
    backgroundColor: colors.surfaceWarm,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    padding: missionLayout.tabsPadding,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  stackedTile: { position: 'absolute' },
  stateBadge: {
    alignItems: 'center',
    backgroundColor: '#F2E5CB',
    borderColor: 'transparent',
    borderRadius: radii.pill,
    borderWidth: 0,
    flexDirection: 'row',
    gap: 2,
    alignSelf: 'flex-start',
    flexShrink: 0,
    paddingHorizontal: 6,
  },
  stateBadgeClaimed: { backgroundColor: '#E5ECDD' },
  stateBadgeReady: { backgroundColor: '#F8E7B8' },
  stateText: {
    color: forestPolish.woodDark,
    fontSize: 12,
    fontWeight: '900',
    lineHeight: missionLayout.statusLineHeight,
  },
  stateTextClaimed: { color: colors.successDark },
  stateTextReady: { color: colors.goldDark },
  tabBadge: {
    alignItems: 'center',
    backgroundColor: colors.successDark,
    borderRadius: radii.pill,
    minHeight: 20,
    justifyContent: 'center',
    minWidth: 20,
    paddingHorizontal: 4,
  },
  tabBadgeWeekly: { backgroundColor: '#A66B24' },
  tabBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  tabOrnament: {
    backgroundColor: forestPolish.leaf,
    borderRadius: radii.pill,
    height: 6,
    width: 6,
  },
  tabOrnamentWeekly: { backgroundColor: '#C3903B' },
  walletPill: {
    alignItems: 'center',
    backgroundColor: '#FFF4C9',
    borderColor: colors.gold,
    borderRadius: radii.pill,
    borderWidth: 2,
    flexDirection: 'row',
    gap: 3,
    minHeight: 36,
    minWidth: 62,
    maxWidth: 92,
    paddingHorizontal: spacing.sm,
  },
  walletText: {
    color: colors.goldDark,
    flexShrink: 1,
    fontSize: fontSizes.sm,
    fontWeight: '900',
  },
  noPowerIcon: { alignItems: 'center', justifyContent: 'center' },
  powerSlash: {
    backgroundColor: '#F05278',
    borderColor: '#FFF8E8',
    borderRadius: 2,
    borderWidth: 1,
    height: 5,
    position: 'absolute',
    transform: [{ rotate: '-45deg' }],
    width: '96%',
  },
  titleRow: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.xs },
});
