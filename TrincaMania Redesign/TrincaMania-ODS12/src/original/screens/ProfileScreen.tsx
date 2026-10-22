import {
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { msg } from '../messages';
import { useBottomNavClearance } from '../components/BottomNavBar';
import { GameIcon, GameIconName, GameIconTone } from '../components/GameIcon';
import {
  MenuBadge,
  MenuCard,
  MenuCardVariant,
  MenuProgressBar,
  MenuSectionHeader,
} from '../components/MenuPrimitives';
import { ProfileAdventureBackdrop } from '../components/ProfileAdventureBackdrop';
import { ScreenShell } from '../components/ScreenShell';
import { RatingStar } from '../components/StarRating';
import {
  PROFILE_ACTION_ASSETS,
  PROFILE_ACTION_ICON_SCALES,
  ProfileActionAssetKey,
} from '../data/profileActionAssets';
import { colors, fontSizes, radii, shadows, spacing } from '../styles/theme';
import { ProgressState } from '../../types/game';
import { LEVELS } from '../../data/levels';
import { getWorldById } from '../../data/worlds';
import {
  getCurrentWorldId,
  getUnlockedWorlds,
} from '../../utils/worldProgress';
type ProfileScreenProps = {
  progress: ProgressState;
  onOpenPowers: () => void;
  onOpenRewards: () => void;
  onOpenSettings: () => void;
  onOpenTutorial: () => void;
  onOpenMissions: () => void;
  onOpenMap: () => void;
  onOpenShop: () => void;
};
type QuickActionProps = {
  assetKey: ProfileActionAssetKey;
  badge?: string;
  description?: string;
  label: string;
  onPress: () => void;
  testID?: string;
  variant?: MenuCardVariant;
};

function QuickAction({
  assetKey,
  badge,
  description,
  label,
  onPress,
  testID,
  variant = 'interactive',
}: QuickActionProps) {
  return (
    <MenuCard
      accessibilityHint={msg('Abre {param1}', {
        param1: String(label.toLocaleLowerCase('pt-BR')),
      })}
      accessibilityLabel={label}
      testID={testID}
      onPress={onPress}
      style={styles.quickAction}
      variant={variant}
    >
      <View style={styles.quickActionIcon}>
        <View style={styles.quickActionArtworkViewport}>
          <Image
            accessibilityIgnoresInvertColors
            resizeMode="contain"
            source={PROFILE_ACTION_ASSETS[assetKey]}
            style={[
              styles.quickActionArtwork,
              // The source PNGs have transparent canvas around the sticker;
              // the larger viewport lets the canonical art read at a glance.
              { transform: [{ scale: PROFILE_ACTION_ICON_SCALES[assetKey] }] },
            ]}
          />
        </View>
        {badge ? (
          <View style={styles.quickActionBadge}>
            <MenuBadge tone="danger">{badge}</MenuBadge>
          </View>
        ) : null}
      </View>
      <View style={styles.quickActionCopy}>
        <Text numberOfLines={2} style={styles.quickActionLabel}>
          {label}
        </Text>
        {description ? (
          <Text numberOfLines={3} style={styles.quickActionDescription}>
            {description}
          </Text>
        ) : null}
      </View>
    </MenuCard>
  );
}

function JourneyMetric({
  iconName,
  iconTone,
  label,
  ratingStar = false,
  value,
}: {
  iconName: GameIconName;
  iconTone: GameIconTone;
  label: string;
  ratingStar?: boolean;
  value: string;
}) {
  const { fontScale } = useWindowDimensions();
  const stacked = fontScale > 1.15;
  return (
    <View
      style={[styles.journeyMetric, stacked && styles.journeyMetricStacked]}
    >
      {ratingStar ? (
        <RatingStar earned size={22} />
      ) : (
        <GameIcon name={iconName} size={21} tone={iconTone} />
      )}
      <View
        style={[
          styles.journeyMetricCopy,
          stacked && styles.journeyMetricCopyStacked,
        ]}
      >
        <Text style={styles.journeyMetricValue}>{value}</Text>
        <Text
          adjustsFontSizeToFit
          minimumFontScale={0.9}
          numberOfLines={2}
          style={styles.journeyMetricLabel}
        >
          {label}
        </Text>
      </View>
    </View>
  );
}

export function ProfileScreen({
  progress,
  onOpenPowers,
  onOpenRewards,
  onOpenSettings,
  onOpenTutorial,
  onOpenMissions,
  onOpenMap,
  onOpenShop,
}: ProfileScreenProps) {
  const bottomNavClearance = useBottomNavClearance();
  const totalStars = Object.values(progress.levelStars).reduce(
    (sum, stars) => sum + stars,
    0,
  );
  const completed = LEVELS.filter((level) =>
    progress.completedLevelIds.includes(level.id),
  ).length;
  const launchProgress = {
    completed,
    total: LEVELS.length,
    percent: Math.round((completed / LEVELS.length) * 100),
  };
  const world = getWorldById(getCurrentWorldId(progress));
  const worldLevels = LEVELS.filter((level) => level.worldId === world.id);
  const completedCount = worldLevels.filter((level) =>
    progress.completedLevelIds.includes(level.id),
  ).length;
  const currentWorldProgress = {
    worldId: world.id,
    label: world.name,
    completedCount,
    totalCount: worldLevels.length,
    progressPercent: (completedCount / worldLevels.length) * 100,
  };
  const unlockedMainWorlds = getUnlockedWorlds(progress).filter(
    (world) => !world.isBonus,
  ).length;
  const mainWorldCount = 10;
  const totalPowerCount =
    progress.itemCounts.hint +
    progress.itemCounts.shuffle +
    progress.itemCounts.undo;
  return (
    <ScreenShell scroll={false}>
      <ProfileAdventureBackdrop>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: bottomNavClearance + spacing.lg },
          ]}
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
        >
          <View style={styles.heroCard}>
            <Pressable
              accessibilityLabel={msg('Abrir configurações')}
              accessibilityRole="button"
              onPress={onOpenSettings}
              style={({ pressed }) => [
                styles.avatarButton,
                pressed ? styles.cardPressed : null,
              ]}
            >
              <View style={styles.avatarMedallion}>
                <GameIcon name="avatar" size={62} tone="gold" />
              </View>
              <View style={styles.avatarEditBadge}>
                <GameIcon name="avatar" size={15} tone="gold" />
              </View>
            </Pressable>
            <View style={styles.heroCopy}>
              <Text style={styles.heroKicker}>{msg('Minha jornada')}</Text>
              <Text numberOfLines={1} style={styles.heroName}>
                TrincaMania
              </Text>
              <Text numberOfLines={2} style={styles.heroSubtitle}>
                {currentWorldProgress.label}
                {msg(' · caminho atual')}
              </Text>
              <Pressable
                accessibilityLabel={msg('Abrir configurações')}
                accessibilityRole="button"
                onPress={onOpenSettings}
                style={({ pressed }) => [
                  styles.editIdentity,
                  pressed ? styles.cardPressed : null,
                ]}
              >
                <Text
                  adjustsFontSizeToFit
                  minimumFontScale={0.84}
                  numberOfLines={1}
                  style={styles.editIdentityText}
                >
                  {msg('Configurações')}
                </Text>
              </Pressable>
            </View>
            <View style={styles.worldChip}>
              <GameIcon name="world" size={22} tone="gold" />
              <Text style={styles.worldChipText}>
                {msg('W')}
                {currentWorldProgress.worldId}
              </Text>
            </View>
          </View>

          <MenuCard
            style={[styles.journeyCard, styles.parchmentCard]}
            variant="selected"
          >
            <View style={styles.journeyHeading}>
              <View style={styles.journeyHeadingCopy}>
                <Text style={styles.cardKicker}>Jornada · ODS 12</Text>
                <Text style={styles.journeyTitle}>
                  {msg('Campanha · ')}
                  {launchProgress.total}
                  {msg(' fases')}
                </Text>
                <Text style={styles.journeySubtitle}>
                  {msg('Progresso global da campanha')}
                </Text>
              </View>
              <View style={styles.globalPercent}>
                <Text style={styles.globalPercentValue}>
                  {launchProgress.percent}%
                </Text>
                <Text style={styles.globalPercentLabel}>{msg('global')}</Text>
              </View>
            </View>
            <MenuProgressBar
              accessibilityLabel={msg(
                'Jornada global: {param1} de {param2} fases, {param3}%',
                {
                  param1: String(launchProgress.completed),
                  param2: String(launchProgress.total),
                  param3: String(launchProgress.percent),
                },
              )}
              tone="success"
              value={launchProgress.percent}
            />
            <View style={styles.progressContext}>
              <View style={styles.progressContextIcon}>
                <GameIcon name="map" size={25} tone="blue" />
              </View>
              <View style={styles.progressContextCopy}>
                <Text style={styles.progressContextKicker}>{msg('Atual')}</Text>
                <Text numberOfLines={2} style={styles.progressContextTitle}>
                  {currentWorldProgress.label}
                </Text>
                <Text style={styles.progressContextSubtitle}>
                  {currentWorldProgress.completedCount}/
                  {currentWorldProgress.totalCount} {msg(' fases neste mundo')}
                </Text>
              </View>
              <Text style={styles.progressContextPercent}>
                {Math.round(currentWorldProgress.progressPercent)}%
              </Text>
            </View>
            <MenuProgressBar
              accessibilityLabel={msg(
                'Progresso de {param1}: {param2} de {param3} fases',
                {
                  param1: String(currentWorldProgress.label),
                  param2: String(currentWorldProgress.completedCount),
                  param3: String(currentWorldProgress.totalCount),
                },
              )}
              value={currentWorldProgress.progressPercent}
            />
            <View style={styles.journeyMetrics}>
              <JourneyMetric
                iconName="map"
                iconTone="gold"
                label={msg('Fases concluídas')}
                value={`${launchProgress.completed}/${launchProgress.total}`}
              />
              <JourneyMetric
                iconName="star"
                iconTone="gold"
                label={msg('Estrelas')}
                ratingStar
                value={String(totalStars)}
              />
              <JourneyMetric
                iconName="world"
                iconTone="blue"
                label={msg('Mundos')}
                value={`${unlockedMainWorlds}/${mainWorldCount}`}
              />
            </View>
          </MenuCard>

          <View style={[styles.actionSection, styles.actionSectionAdventure]}>
            <MenuSectionHeader
              meta="Acesso rápido"
              title="Aventura"
              tone="dark"
            />
            <View style={styles.quickGrid}>
              <QuickAction
                assetKey="missions"
                label="Missões"
                description="Objetivos da coleta seletiva"
                onPress={onOpenMissions}
              />
              <QuickAction
                assetKey="worldPath"
                label="Mapa"
                onPress={onOpenMap}
              />
              <QuickAction
                assetKey="backpack"
                label="Loja"
                onPress={onOpenShop}
              />
            </View>
          </View>
          <View style={[styles.actionSection, styles.actionSectionTools]}>
            <MenuSectionHeader
              meta={msg('Preferências e apoio')}
              title={msg('Ferramentas')}
              tone="dark"
            />
            <View style={styles.quickGrid}>
              <QuickAction
                assetKey="powers"
                description={msg('{param1} em estoque', {
                  param1: String(totalPowerCount),
                })}
                label={msg('Poderes')}
                testID="profile-powers"
                onPress={onOpenPowers}
              />
              <QuickAction
                assetKey="rewards"
                label={msg('Recompensas')}
                onPress={onOpenRewards}
              />
              <QuickAction
                assetKey="settings"
                label={msg('Configurações')}
                onPress={onOpenSettings}
              />
              <QuickAction
                assetKey="howToPlay"
                label={msg('Como jogar')}
                onPress={onOpenTutorial}
              />
            </View>
          </View>
        </ScrollView>
      </ProfileAdventureBackdrop>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  avatarButton: {
    alignItems: 'center',
    height: 84,
    justifyContent: 'center',
    position: 'relative',
    width: 84,
  },
  avatarEditBadge: {
    alignItems: 'center',
    backgroundColor: colors.profileNight,
    borderColor: colors.gold,
    borderRadius: radii.pill,
    borderWidth: 2,
    bottom: 0,
    height: 27,
    justifyContent: 'center',
    position: 'absolute',
    right: 0,
    width: 27,
  },
  avatarMedallion: {
    alignItems: 'center',
    backgroundColor: colors.cream,
    borderColor: colors.gold,
    borderRadius: radii.pill,
    borderWidth: 3,
    elevation: 5,
    height: 78,
    justifyContent: 'center',
    shadowColor: colors.gold,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    width: 78,
  },
  cardKicker: {
    color: colors.actionDark,
    fontSize: fontSizes.caption,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  content: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  editIdentity: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
    borderRadius: radii.pill,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: spacing.xs,
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  editIdentityText: {
    color: colors.dangerDark,
    fontSize: fontSizes.caption,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  globalPercent: {
    alignItems: 'center',
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
    borderRadius: radii.menuControl,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 60,
    minWidth: 68,
    paddingHorizontal: spacing.sm,
  },
  globalPercentLabel: {
    color: colors.successDark,
    fontSize: fontSizes.caption,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  globalPercentValue: {
    color: colors.successDark,
    fontSize: fontSizes.xl,
    fontWeight: '900',
  },
  heroCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(11, 37, 50, 0.94)',
    borderColor: 'rgba(255, 211, 90, 0.68)',
    borderRadius: radii.menuCard,
    borderWidth: 2,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 112,
    padding: spacing.sm,
    ...shadows.card,
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
  },
  heroKicker: {
    color: colors.gold,
    fontSize: fontSizes.caption,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  heroName: {
    color: colors.inkOnDark,
    fontSize: fontSizes.xl,
    fontWeight: '900',
    marginTop: 1,
  },
  heroSubtitle: {
    color: colors.profileTextMuted,
    fontSize: fontSizes.xs,
    fontWeight: '800',
    lineHeight: 15,
    marginTop: 1,
  },
  journeyCard: {
    gap: spacing.sm,
    padding: spacing.md,
  },
  parchmentCard: {
    backgroundColor: colors.creamLight,
    borderColor: colors.goldDark,
    borderWidth: 2,
  },
  journeyHeading: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  journeyHeadingCopy: {
    flex: 1,
    minWidth: 0,
  },
  journeyMetric: {
    alignItems: 'center',
    backgroundColor: colors.shell,
    borderColor: colors.gold,
    borderRadius: radii.menuControl,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 62,
    minWidth: 0,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  journeyMetricStacked: { flexDirection: 'column', alignItems: 'flex-start' },
  journeyMetricCopyStacked: { width: '100%' },
  journeyMetricCopy: {
    flex: 1,
    minWidth: 0,
  },
  journeyMetricLabel: {
    color: colors.profileTextMuted,
    fontSize: 9,
    fontWeight: '900',
    lineHeight: 12,
  },
  journeyMetricValue: {
    color: colors.creamLight,
    fontSize: fontSizes.sm,
    fontWeight: '900',
  },
  journeyMetrics: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  journeySubtitle: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    fontWeight: '800',
    lineHeight: 16,
    marginTop: 2,
  },
  journeyTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.lg,
    fontWeight: '900',
    marginTop: 2,
  },
  progressContext: {
    alignItems: 'center',
    backgroundColor: colors.surfaceTint,
    borderColor: colors.success,
    borderRadius: radii.menuControl,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.sm,
  },
  progressContextCopy: {
    flex: 1,
    minWidth: 0,
  },
  progressContextIcon: {
    alignItems: 'center',
    backgroundColor: colors.creamLight,
    borderColor: colors.gold,
    borderRadius: radii.menuControl,
    borderWidth: 1,
    height: 43,
    justifyContent: 'center',
    width: 43,
  },
  progressContextKicker: {
    color: colors.successDark,
    fontSize: fontSizes.caption,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  progressContextPercent: {
    color: colors.successDark,
    fontSize: fontSizes.lg,
    fontWeight: '900',
  },
  progressContextSubtitle: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    fontWeight: '800',
    lineHeight: 15,
  },
  progressContextTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.md,
    fontWeight: '900',
  },
  quickAction: {
    alignItems: 'center',
    flexBasis: '47.8%',
    flexDirection: 'column',
    flexGrow: 1,
    gap: spacing.sm,
    height: 142,
    justifyContent: 'flex-start',
    minHeight: 68,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
  },
  quickActionCopy: {
    alignItems: 'center',
    alignSelf: 'stretch',
    justifyContent: 'center',
    minWidth: 0,
  },
  quickActionDescription: {
    color: colors.textSecondary,
    fontSize: fontSizes.caption,
    fontWeight: '800',
    lineHeight: 14,
    marginTop: 2,
  },
  quickActionIcon: {
    alignItems: 'center',
    backgroundColor: colors.creamLight,
    borderColor: colors.gold,
    borderRadius: radii.menuControl,
    borderWidth: 1,
    height: 76,
    justifyContent: 'center',
    overflow: 'visible',
    position: 'relative',
    width: 76,
  },
  quickActionArtworkViewport: {
    borderRadius: radii.menuControl,
    height: 76,
    overflow: 'hidden',
    width: 76,
  },
  quickActionArtwork: {
    height: 72,
    left: 2,
    position: 'absolute',
    top: 2,
    width: 72,
  },
  quickActionBadge: {
    position: 'absolute',
    right: -10,
    top: -10,
  },
  quickActionLabel: {
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    fontWeight: '900',
    textAlign: 'center',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionSection: {
    backgroundColor: 'rgba(7, 24, 32, 0.78)',
    borderRadius: radii.menuCard,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.sm,
  },
  actionSectionAdventure: {
    borderColor: 'rgba(255, 211, 90, 0.78)',
  },
  actionSectionCollection: {
    borderColor: 'rgba(36, 216, 137, 0.72)',
  },
  actionSectionProgress: {
    borderColor: 'rgba(139, 154, 255, 0.82)',
  },
  actionSectionTools: {
    borderColor: 'rgba(183, 215, 209, 0.54)',
  },
  scroll: {
    flex: 1,
  },
  worldChip: {
    alignItems: 'center',
    backgroundColor: 'rgba(7, 24, 32, 0.72)',
    borderColor: 'rgba(255, 211, 90, 0.72)',
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  worldChipText: {
    color: colors.gold,
    fontSize: fontSizes.xs,
    fontWeight: '900',
  },
});
