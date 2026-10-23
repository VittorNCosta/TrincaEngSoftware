import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { GameIcon, GameIconName } from './GameIcon';
import {
  MenuBadge,
  MenuProgressBar,
  MenuSectionHeader,
} from './MenuPrimitives';
import { PrimaryButton } from './PrimaryButton';
import { colors, fontSizes, spacing } from '../styles/theme';
import {
  getDailyCheckInCardState,
  getDailyCheckInStatus,
  getLocalDateKey,
} from '../dailyCheckIn/dailyCheckIn';
import {
  DailyCheckInDay,
  DailyCheckInState,
} from '../dailyCheckIn/dailyCheckInTypes';
import { resolveDailyCheckInReward } from '../dailyCheckIn/dailyCheckInRewards';
import {
  DailyChallengeSave,
  DAILY_REWARD_STREAKS,
} from '../challenges/dailyChallenge';
import { MissionState } from '../missions/routineMissions';

export type RoutineSection = 'checkin' | 'missions' | 'challenge';
type Props = {
  visible: boolean;
  section: RoutineSection;
  checkIn: DailyCheckInState;
  missions: MissionState;
  challenge: DailyChallengeSave;
  busy: boolean;
  onClose: () => void;
  onSection: (section: RoutineSection) => void;
  onClaimCheckIn: () => void;
  onClaimMission: (id: string) => void;
  onStartChallenge: () => void;
};
const sectionInfo: Record<
  RoutineSection,
  { title: string; icon: GameIconName }
> = {
  checkin: { title: 'Check-in', icon: 'calendar' },
  missions: { title: 'Missões', icon: 'target' },
  challenge: { title: 'Desafio', icon: 'star' },
};
const RewardButton = ({
  title,
  disabled,
  onPress,
}: {
  title: string;
  disabled?: boolean;
  onPress: () => void;
}) => (
  <PrimaryButton
    title={title}
    disabled={disabled}
    onPress={onPress}
    size="compact"
  />
);

export function RoutineModal({
  visible,
  section,
  checkIn,
  missions,
  challenge,
  busy,
  onClose,
  onSection,
  onClaimCheckIn,
  onClaimMission,
  onStartChallenge,
}: Props) {
  const [now, setNow] = useState(new Date());
  const day = getLocalDateKey(now);
  const status = getDailyCheckInStatus(checkIn, now);
  const bestStars = challenge.bestStars[day] ?? 0;
  const challengeLocked =
    !!challenge.maxObservedDateKey && day < challenge.maxObservedDateKey;
  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onShow={() => setNow(new Date())}
      onRequestClose={onClose}
    >
      <SafeAreaView edges={['top', 'bottom']} style={styles.overlay}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <View>
              <Text style={styles.kicker}>Sua rotina</Text>
              <Text style={styles.title}>{sectionInfo[section].title}</Text>
            </View>
            <Pressable
              accessibilityLabel="Fechar rotina"
              accessibilityRole="button"
              onPress={onClose}
              style={styles.close}
            >
              <GameIcon name="close" size={28} tone="danger" />
            </Pressable>
          </View>
          <View style={styles.tabs}>
            {(['checkin', 'missions', 'challenge'] as const).map((key) => (
              <Pressable
                key={key}
                accessibilityRole="tab"
                accessibilityState={{ selected: section === key }}
                onPress={() => onSection(key)}
                style={[styles.tab, section === key && styles.tabActive]}
              >
                <GameIcon
                  name={sectionInfo[key].icon}
                  size={24}
                  tone={section === key ? 'gold' : 'neutral'}
                />
                <Text
                  style={[
                    styles.tabText,
                    section === key && styles.tabTextActive,
                  ]}
                >
                  {sectionInfo[key].title}
                </Text>
              </Pressable>
            ))}
          </View>
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {section === 'checkin' ? (
              <>
                <Text style={styles.subtitle}>
                  Entre todos os dias para avançar no ciclo de 7 recompensas.
                </Text>
                <View style={styles.dayGrid}>
                  {([1, 2, 3, 4, 5, 6, 7] as DailyCheckInDay[]).map(
                    (number) => {
                      const reward = resolveDailyCheckInReward(number);
                      const cardState = getDailyCheckInCardState(
                        checkIn,
                        number,
                        now,
                      );
                      return (
                        <View
                          key={number}
                          style={[
                            styles.dayCard,
                            cardState === 'today' && styles.dayToday,
                          ]}
                        >
                          <Text style={styles.dayTitle}>Dia {number}</Text>
                          <GameIcon
                            name={
                              reward.kind === 'life'
                                ? 'heart'
                                : reward.kind === 'power'
                                  ? 'powers'
                                  : 'coin'
                            }
                            size={34}
                            tone={cardState === 'today' ? 'gold' : 'green'}
                          />
                          <Text style={styles.dayReward}>{reward.label}</Text>
                          <Text style={styles.dayState}>
                            {cardState === 'claimed'
                              ? 'Resgatado'
                              : cardState === 'today'
                                ? 'Hoje'
                                : 'Em breve'}
                          </Text>
                        </View>
                      );
                    },
                  )}
                </View>
                <RewardButton
                  title={
                    status.eligible
                      ? 'Resgatar recompensa'
                      : status.reason === 'claimed-today'
                        ? 'Volte amanhã'
                        : status.reason === 'settling'
                          ? 'Finalizar resgate'
                          : 'Aguarde a data correta'
                  }
                  disabled={
                    (!status.eligible && status.reason !== 'settling') || busy
                  }
                  onPress={onClaimCheckIn}
                />
              </>
            ) : null}
            {section === 'missions' ? (
              <>
                <Text style={styles.subtitle}>
                  Jogue fases da campanha ou mapas dos capítulos. Cada objetivo
                  pode ser resgatado uma vez por ciclo.
                </Text>
                {([missions.daily, missions.weekly] as const).map(
                  (cycle, index) => (
                    <View key={cycle.id} style={styles.group}>
                      <MenuSectionHeader
                        tone="dark"
                        title={
                          index === 0 ? 'Missões diárias' : 'Missões semanais'
                        }
                        meta={index === 0 ? '5 moedas cada' : '15 moedas cada'}
                      />
                      {cycle.missions.map((mission) => (
                        <View key={mission.id} style={styles.missionCard}>
                          <View style={styles.missionRow}>
                            <GameIcon
                              name={
                                mission.kind === 'levels'
                                  ? 'map'
                                  : mission.kind === 'stars'
                                    ? 'star'
                                    : 'target'
                              }
                              size={34}
                              tone="green"
                            />
                            <View style={styles.missionCopy}>
                              <Text style={styles.missionTitle}>
                                {mission.title}
                              </Text>
                              <Text style={styles.missionProgress}>
                                {mission.progress}/{mission.target}
                              </Text>
                            </View>
                          </View>
                          <MenuProgressBar
                            value={(mission.progress / mission.target) * 100}
                            tone="success"
                            accessibilityLabel={`${mission.progress} de ${mission.target}`}
                          />
                          <RewardButton
                            title={
                              mission.claimed
                                ? 'Resgatada'
                                : `Resgatar +${mission.rewardCoins}`
                            }
                            disabled={
                              busy ||
                              mission.claimed ||
                              mission.progress < mission.target
                            }
                            onPress={() => onClaimMission(mission.id)}
                          />
                        </View>
                      ))}
                    </View>
                  ),
                )}
              </>
            ) : null}
            {section === 'challenge' ? (
              <>
                <View style={styles.challengeHero}>
                  <GameIcon name="star" size={60} tone="gold" />
                  <Text style={styles.heroTitle}>Tabuleiro do dia</Text>
                  <Text style={styles.subtitle}>
                    Uma fase gerada para {day}. Suas estrelas ficam separadas da
                    campanha. Perder consome vida como em qualquer fase.
                  </Text>
                </View>
                <View style={styles.challengeStats}>
                  <Text style={styles.stat}>
                    Melhor: {'★'.repeat(bestStars)}
                    {'☆'.repeat(3 - bestStars)}
                  </Text>
                  <Text style={styles.stat}>
                    Sequência: {challenge.streak} dia(s)
                  </Text>
                </View>
                <View style={styles.badges}>
                  {DAILY_REWARD_STREAKS.map((days) => (
                    <MenuBadge
                      key={days}
                      tone={challenge.streak >= days ? 'success' : 'locked'}
                    >
                      {days} dias {challenge.streak >= days ? '✓' : '·'}
                    </MenuBadge>
                  ))}
                </View>
                <RewardButton
                  title={
                    challengeLocked
                      ? 'Aguarde a data correta'
                      : bestStars
                        ? 'Jogar novamente'
                        : 'Jogar desafio de hoje'
                  }
                  disabled={busy || challengeLocked}
                  onPress={onStartChallenge}
                />
              </>
            ) : null}
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(5, 10, 28, 0.75)',
  },
  panel: {
    maxHeight: '95%',
    minHeight: '74%',
    backgroundColor: '#173B43',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderColor: '#FFE6A0',
    borderWidth: 2,
    paddingTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  kicker: {
    color: '#FFE6A0',
    fontSize: fontSizes.xs,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: { color: '#FFFFFF', fontSize: fontSizes.xl, fontWeight: '900' },
  close: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: { flexDirection: 'row', gap: 4, paddingHorizontal: spacing.sm },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: 7,
    borderRadius: 13,
    backgroundColor: '#23515A',
  },
  tabActive: {
    backgroundColor: '#3C6A6A',
    borderColor: '#F9D263',
    borderWidth: 2,
  },
  tabText: { color: '#E0F4EA', fontSize: fontSizes.xs, fontWeight: '900' },
  tabTextActive: { color: '#FFFFFF' },
  content: { gap: spacing.md, padding: spacing.md, paddingBottom: spacing.xl },
  subtitle: {
    color: '#E4F4EC',
    fontSize: fontSizes.sm,
    fontWeight: '700',
    lineHeight: 20,
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  dayCard: {
    width: '30%',
    minHeight: 130,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    backgroundColor: colors.surfaceWarm,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#A3D3BD',
    padding: 5,
  },
  dayToday: { borderColor: '#F5B92F', backgroundColor: '#FFF0B6' },
  dayTitle: { color: colors.ink, fontWeight: '900', fontSize: fontSizes.sm },
  dayReward: {
    color: colors.ink,
    textAlign: 'center',
    fontWeight: '800',
    fontSize: fontSizes.xs,
  },
  dayState: { color: '#376A54', fontWeight: '900', fontSize: 10 },
  button: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#32C875',
    borderBottomColor: '#087A54',
    borderBottomWidth: 4,
    paddingHorizontal: spacing.md,
  },
  buttonDisabled: { backgroundColor: '#6E8490', borderBottomColor: '#405764' },
  buttonText: {
    color: '#FFFFFF',
    fontSize: fontSizes.sm,
    fontWeight: '900',
    textAlign: 'center',
  },
  pressed: { opacity: 0.8 },
  group: { gap: spacing.sm },
  groupTitle: { color: '#FFE6A0', fontSize: fontSizes.md, fontWeight: '900' },
  missionCard: {
    backgroundColor: colors.surfaceWarm,
    borderRadius: 16,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  missionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  missionCopy: { flex: 1 },
  missionTitle: {
    color: colors.ink,
    fontSize: fontSizes.sm,
    fontWeight: '900',
  },
  missionProgress: { color: '#39705A', fontWeight: '900' },
  track: {
    height: 8,
    backgroundColor: '#C5D9CF',
    borderRadius: 8,
    overflow: 'hidden',
  },
  fill: { height: 8, backgroundColor: '#32C875' },
  challengeHero: {
    backgroundColor: '#285961',
    padding: spacing.lg,
    borderRadius: 20,
    alignItems: 'center',
    gap: spacing.sm,
  },
  heroTitle: { color: '#FFFFFF', fontSize: fontSizes.lg, fontWeight: '900' },
  challengeStats: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { color: '#FFFFFF', fontSize: fontSizes.sm, fontWeight: '900' },
  badges: { flexDirection: 'row', justifyContent: 'space-around', gap: 5 },
  badge: {
    color: '#E1E9E8',
    backgroundColor: '#506A6B',
    overflow: 'hidden',
    borderRadius: 16,
    padding: spacing.sm,
    fontWeight: '900',
    fontSize: fontSizes.xs,
  },
  badgeEarned: { color: '#193C2B', backgroundColor: '#FFE6A0' },
});
