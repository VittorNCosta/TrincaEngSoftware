import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { ChestOpeningModal, ChestRewardItem } from './ChestOpeningModal';
import { ChestProgressCard } from './ChestProgressCard';
import { ConfettiRain } from './ConfettiRain';
import { GameIcon } from './GameIcon';
import { PrimaryButton } from './PrimaryButton';
import {
  CHAPTER_COUNT,
  CHAPTER_MAPS_PER_CHAPTER,
  getChapter,
  getChapterLevelSummary,
} from '../data/chapters';
import { LEVELS } from '../data/levels';
import { getWorldById } from '../data/worlds';
import { LivesState, formatLifeTimer } from '../storage/livesStorage';
import { KEY_COST, getWorldChestLabel } from '../storage/progressStorage';
import { MAX_TRAY_CAPACITY } from '../storage/trayBoostStorage';
import { colors, fontSizes, radii, shadows, spacing } from '../styles/theme';
import {
  ChestProgressSummary,
  ChestRewardSummary,
  GameStatus,
  Level,
  WorldChestOpenMode,
  WorldChestOpenResult,
  WorldChestSummary,
} from '../types/game';
import { WindowTarget } from '../types/ui';
import {
  formatQuantity,
  formatSeconds,
  getVictoryTitleByStars,
  isBonusLevel,
} from '../utils/gameLogic';
import { getLevelDisplayLabel } from '../utils/levelDisplay';
import { playChestOpenSound, playRewardSparkleSound } from '../utils/sounds';

type ResultModalProps = {
  activeTrayCapacity: number;
  availableCoins: number;
  chestProgress?: ChestProgressSummary;
  chestReward?: ChestRewardSummary;
  coinCollectTarget?: WindowTarget;
  coinsEarned?: number;
  elapsedSeconds?: number;
  isNewRecord?: boolean;
  keys: number;
  level: Level;
  livesState: LivesState;
  starsEarned?: number;
  status: GameStatus;
  timeUntilNextLifeMs: number;
  unlockedLevelTitle?: string;
  worldChest?: WorldChestSummary;
  onBackToLevels: () => void;
  onNextLevel: () => void;
  onOpenWorldChest: (
    worldChestId: string,
    mode: WorldChestOpenMode,
  ) => Promise<WorldChestOpenResult>;
  onRetry: () => void;
};

const RESULT_STAR_PATH =
  'M32 8l6.7 14.2 15.3 2.2-11.1 10.8 2.6 15.2L32 43.2 18.5 50.4l2.6-15.2L10 24.4l15.3-2.2L32 8z';

function UnearnedStarOutline() {
  return (
    <Svg height={30} viewBox="0 0 64 64" width={30}>
      <Path
        d={RESULT_STAR_PATH}
        fill="none"
        stroke="#9AA8C8"
        strokeLinejoin="round"
        strokeWidth={4}
      />
    </Svg>
  );
}

const getWorldChestRewardItems = (
  result?: WorldChestOpenResult,
): ChestRewardItem[] => {
  if (!result?.reward) {
    return [];
  }

  return [
    ...(result.reward.lifeGranted
      ? [
          {
            iconName: 'heart' as const,
            label: '+1 vida',
            tone: 'pink' as const,
          },
        ]
      : []),
    {
      iconName: 'coin' as const,
      label: `+${formatQuantity(result.reward.coins, 'moeda', 'moedas')}`,
      tone: 'gold' as const,
    },
    {
      iconName: 'powers' as const,
      label: '+1 Trinca Mágica',
      tone: 'blue' as const,
    },
    {
      iconName: 'shuffle' as const,
      label: '+1 Misturar',
      tone: 'purple' as const,
    },
    { iconName: 'undo' as const, label: '+1 Voltar', tone: 'green' as const },
  ];
};

export function ResultModal({
  activeTrayCapacity,
  availableCoins,
  chestProgress,
  chestReward,
  coinCollectTarget,
  coinsEarned = 0,
  elapsedSeconds = 0,
  isNewRecord = false,
  keys,
  level,
  livesState,
  starsEarned = 0,
  status,
  timeUntilNextLifeMs,
  unlockedLevelTitle,
  worldChest,
  onBackToLevels,
  onNextLevel,
  onOpenWorldChest,
  onRetry,
}: ResultModalProps) {
  const isWon = status === 'won';
  const earnedStarCount = Number.isFinite(starsEarned)
    ? Math.max(0, Math.min(3, Math.floor(starsEarned)))
    : 0;
  const isPerfect = isWon && earnedStarCount === 3;
  const isBonusReward = isBonusLevel(level);
  const hasCoinReward = coinsEarned > 0;
  const hasNoLives = livesState.currentLives <= 0;
  const victoryTitle = getVictoryTitleByStars(earnedStarCount);
  const world = getWorldById(level.worldId);
  // Mapa de capítulo não está em LEVELS nem em WORLDS — `getWorldById` cai em
  // WORLDS[0]. Sem este desvio a vitória anunciaria o Bosque e ofereceria
  // "Novo mundo em breve" no lugar de um avanço que existe de verdade.
  const chapterSummary = getChapterLevelSummary(level.id);
  const chapterName = chapterSummary
    ? getChapter(chapterSummary.chapterId)?.name
    : undefined;
  const currentLevelIndex = LEVELS.findIndex(
    (knownLevel) => knownLevel.id === level.id,
  );
  const nextLevel =
    currentLevelIndex >= 0 ? LEVELS[currentLevelIndex + 1] : undefined;
  const canAdvanceDirectly = chapterSummary
    ? chapterSummary.campaignPosition < CHAPTER_COUNT * CHAPTER_MAPS_PER_CHAPTER
    : Boolean(nextLevel && (nextLevel.worldId !== 21 || level.worldId === 21));
  const nextActionTitle = canAdvanceDirectly
    ? 'Próxima fase'
    : world.isBonus || chapterSummary
      ? 'Voltar ao mapa'
      : 'Novo mundo em breve';
  const unlockText = unlockedLevelTitle?.includes('desbloqueado')
    ? unlockedLevelTitle
    : unlockedLevelTitle
      ? `Nova fase desbloqueada! ${unlockedLevelTitle}`
      : undefined;
  const commonChestAnimationKey = chestProgress
    ? `${level.id}-${chestProgress.completedCount}-${chestProgress.progressCount}-${
        chestProgress.opened ? 'opened' : 'progress'
      }-${chestReward?.type ?? 'none'}-${chestReward?.amount ?? 0}`
    : undefined;
  const commonChestFromProgress = chestProgress
    ? chestProgress.isLevelCounted
      ? chestProgress.opened
        ? Math.max(0, chestProgress.requiredCount - 1)
        : Math.max(0, chestProgress.progressCount - 1)
      : chestProgress.progressCount
    : 0;
  const commonChestRewardText = chestReward?.label;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.9)).current;
  const coinScale = useRef(new Animated.Value(0.88)).current;
  const loseShake = useRef(new Animated.Value(0)).current;
  const sparkle = useRef(new Animated.Value(0)).current;
  const [worldChestResult, setWorldChestResult] = useState<
    WorldChestOpenResult | undefined
  >();
  const [worldChestMessage, setWorldChestMessage] = useState<
    string | undefined
  >();
  const [isOpeningWorldChest, setIsOpeningWorldChest] = useState(false);
  const [isCommonChestOpeningVisible, setIsCommonChestOpeningVisible] =
    useState(false);
  const [isWorldChestOpeningVisible, setIsWorldChestOpeningVisible] =
    useState(false);
  const commonChestModalTimerRef = useRef<
    ReturnType<typeof setTimeout> | undefined
  >(undefined);
  const shownCommonChestKeyRef = useRef<string | undefined>(undefined);
  const shownWorldChestKeyRef = useRef<string | undefined>(undefined);
  const starAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    setWorldChestResult(undefined);
    setWorldChestMessage(undefined);
    setIsOpeningWorldChest(false);
    setIsCommonChestOpeningVisible(false);
    setIsWorldChestOpeningVisible(false);
    shownCommonChestKeyRef.current = undefined;
    shownWorldChestKeyRef.current = undefined;

    if (commonChestModalTimerRef.current) {
      clearTimeout(commonChestModalTimerRef.current);
      commonChestModalTimerRef.current = undefined;
    }
  }, [level.id, status, worldChest?.id]);

  useEffect(
    () => () => {
      if (commonChestModalTimerRef.current) {
        clearTimeout(commonChestModalTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (status === 'playing') {
      cardOpacity.setValue(0);
      cardScale.setValue(0.9);
      coinScale.setValue(0.88);
      loseShake.setValue(0);
      sparkle.setValue(0);
      starAnims.forEach((starAnim) => starAnim.setValue(0));
      return;
    }

    sparkle.setValue(0);
    Animated.parallel([
      Animated.timing(cardOpacity, {
        duration: 180,
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        friction: 7,
        tension: 130,
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(sparkle, {
        duration: isWon ? 1100 : 520,
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();

    if (isWon) {
      coinScale.setValue(0.88);
      starAnims.forEach((starAnim) => starAnim.setValue(0));

      Animated.sequence([
        Animated.delay(180),
        Animated.stagger(
          150,
          starAnims.slice(0, earnedStarCount).map((starAnim) =>
            Animated.spring(starAnim, {
              friction: 5,
              tension: 150,
              toValue: 1,
              useNativeDriver: true,
            }),
          ),
        ),
        Animated.spring(coinScale, {
          friction: 6,
          tension: 130,
          toValue: 1.08,
          useNativeDriver: true,
        }),
        Animated.spring(coinScale, {
          friction: 7,
          tension: 120,
          toValue: 1,
          useNativeDriver: true,
        }),
      ]).start();

      return undefined;
    }

    Animated.sequence([
      Animated.timing(loseShake, {
        duration: 55,
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(loseShake, {
        duration: 55,
        toValue: -1,
        useNativeDriver: true,
      }),
      Animated.timing(loseShake, {
        duration: 55,
        toValue: 0.5,
        useNativeDriver: true,
      }),
      Animated.timing(loseShake, {
        duration: 70,
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();

    return undefined;
  }, [
    cardOpacity,
    cardScale,
    coinScale,
    earnedStarCount,
    isWon,
    loseShake,
    sparkle,
    starAnims,
    status,
  ]);

  const loseTranslateX = loseShake.interpolate({
    inputRange: [-1, 1],
    outputRange: [-7, 7],
  });
  const worldChestOpened = worldChestResult?.status === 'opened';
  const worldChestRewardItems = getWorldChestRewardItems(worldChestResult);
  const worldChestAnimationKey =
    worldChestOpened && worldChestResult?.reward
      ? `${worldChestResult.worldChestId}-${worldChestResult.reward.coins}-${
          worldChestResult.reward.lifeGranted ? 'life' : 'coins'
        }`
      : undefined;
  const worldChestStatusText =
    worldChestMessage ??
    (worldChestResult?.status === 'insufficient-coins'
      ? 'Moedas insuficientes.'
      : worldChestResult?.status === 'no-key'
        ? 'Você precisa de uma chave.'
        : worldChestResult?.status === 'already-opened'
          ? 'Este baú já foi aberto.'
          : worldChestResult?.status === 'unavailable'
            ? 'Baú indisponível agora.'
            : undefined);

  useEffect(() => {
    if (!worldChestAnimationKey || worldChestRewardItems.length === 0) {
      return;
    }

    if (shownWorldChestKeyRef.current === worldChestAnimationKey) {
      return;
    }

    shownWorldChestKeyRef.current = worldChestAnimationKey;
    setIsWorldChestOpeningVisible(true);
  }, [worldChestAnimationKey, worldChestRewardItems.length]);

  const handleCommonChestProgressEnd = () => {
    if (!chestProgress?.opened || !chestReward || !commonChestAnimationKey) {
      return;
    }

    if (shownCommonChestKeyRef.current === commonChestAnimationKey) {
      return;
    }

    shownCommonChestKeyRef.current = commonChestAnimationKey;

    if (commonChestModalTimerRef.current) {
      clearTimeout(commonChestModalTimerRef.current);
    }

    commonChestModalTimerRef.current = setTimeout(() => {
      commonChestModalTimerRef.current = undefined;
      setIsCommonChestOpeningVisible(true);
    }, 620);
  };

  const openSpecialChest = (mode: WorldChestOpenMode) => {
    if (!worldChest || isOpeningWorldChest || worldChestOpened) {
      return;
    }

    setIsOpeningWorldChest(true);
    setWorldChestMessage(undefined);
    onOpenWorldChest(worldChest.id, mode)
      .then((result) => {
        setWorldChestResult(result);
      })
      .catch(() => {
        setWorldChestMessage('Não foi possível abrir agora.');
      })
      .finally(() => {
        setIsOpeningWorldChest(false);
      });
  };

  return (
    <>
      <Modal animationType="none" transparent visible={status !== 'playing'}>
        <SafeAreaView
          edges={['top', 'bottom', 'left', 'right']}
          style={styles.overlay}
        >
          {isWon ? <ConfettiRain /> : null}

          <Animated.View
            style={[
              styles.card,
              isWon ? styles.winCard : styles.loseCard,
              isPerfect ? styles.perfectCard : null,
              {
                opacity: cardOpacity,
                transform: [
                  { translateX: isWon ? 0 : loseTranslateX },
                  { scale: cardScale },
                ],
              },
            ]}
          >
            <View pointerEvents="none" style={styles.cardGlow} />
            <View
              style={[
                styles.banner,
                isWon ? styles.winBanner : styles.loseBanner,
              ]}
            >
              <Text style={styles.bannerText}>
                {isWon ? 'Vitória' : 'Bandeja cheia!'}
              </Text>
            </View>

            <GameIcon
              name={isWon ? 'win' : 'lose'}
              size={52}
              tone={isWon ? 'gold' : 'danger'}
            />

            <Text style={[styles.title, isWon ? styles.winTitle : null]}>
              {isWon ? victoryTitle : 'Tente de novo'}
            </Text>
            <Text style={[styles.subtitle, isWon ? styles.winSubtitle : null]}>
              {isWon
                ? `Fase ${getLevelDisplayLabel(level)} em ${chapterName ?? world.name}`
                : `Bandeja cheia: ${activeTrayCapacity}/${activeTrayCapacity}`}
            </Text>

            <ScrollView
              bounces={false}
              contentContainerStyle={styles.resultBodyContent}
              showsVerticalScrollIndicator={false}
              style={styles.resultBody}
            >
              {isWon ? (
                <View
                  style={[
                    styles.rewardPanel,
                    isPerfect ? styles.perfectRewardPanel : null,
                  ]}
                >
                  {isPerfect ? (
                    <View pointerEvents="none" style={styles.perfectGlow} />
                  ) : null}
                  <View style={styles.starsRow}>
                    {starAnims.map((starAnim, index) => {
                      if (index >= earnedStarCount) {
                        return (
                          <View
                            key={`result-star-${index}`}
                            style={styles.resultStar}
                          >
                            <UnearnedStarOutline />
                          </View>
                        );
                      }

                      const starOpacity = starAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 1],
                      });
                      const starScale = starAnim.interpolate({
                        inputRange: [0, 0.78, 1],
                        outputRange: [0.35, 1.18, 1],
                      });
                      const starTranslateY = starAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [12, 0],
                      });

                      return (
                        <Animated.View
                          key={`result-star-${index}`}
                          style={[
                            styles.resultStar,
                            {
                              opacity: starOpacity,
                              transform: [
                                { translateY: starTranslateY },
                                { scale: starScale },
                              ],
                            },
                          ]}
                        >
                          <GameIcon
                            name="star"
                            size={34}
                            tone="gold"
                            variant="plain"
                          />
                        </Animated.View>
                      );
                    })}
                  </View>
                  <View style={styles.winStatsRow}>
                    <View style={styles.statPill}>
                      <Text style={styles.statLabel}>Tempo</Text>
                      <Text style={styles.statValue}>
                        {formatSeconds(elapsedSeconds)}
                      </Text>
                    </View>
                    {isNewRecord ? (
                      <View style={[styles.statPill, styles.recordPill]}>
                        <Text style={styles.statLabel}>Recorde</Text>
                        <Text style={styles.statValue}>Novo!</Text>
                      </View>
                    ) : null}
                  </View>
                  {isBonusReward && hasCoinReward ? (
                    <Text style={styles.bonusRewardText}>
                      Recompensa bônus!
                    </Text>
                  ) : null}
                  {hasCoinReward ? (
                    <Animated.View
                      style={[
                        styles.rewardRow,
                        { transform: [{ scale: coinScale }] },
                      ]}
                    >
                      <GameIcon name="coin" size={24} tone="gold" />
                      <Text style={styles.rewardText}>
                        +{formatQuantity(coinsEarned, 'moeda', 'moedas')}
                      </Text>
                    </Animated.View>
                  ) : (
                    <Text style={styles.noRewardText}>
                      Melhor resultado mantido
                    </Text>
                  )}
                  {chestProgress ? (
                    <ChestProgressCard
                      animationKey={commonChestAnimationKey}
                      fromProgress={commonChestFromProgress}
                      isLevelCounted={chestProgress.isLevelCounted}
                      opened={chestProgress.opened}
                      requiredCount={chestProgress.requiredCount}
                      toProgress={chestProgress.progressCount}
                      onCompletedAnimationEnd={handleCommonChestProgressEnd}
                    />
                  ) : null}
                  {worldChest ? (
                    <View
                      style={[
                        styles.worldChestPanel,
                        worldChestOpened ? styles.worldChestPanelOpen : null,
                      ]}
                    >
                      <View style={styles.worldChestHeader}>
                        {worldChestOpened ? (
                          <GameIcon name="win" size={32} tone="green" />
                        ) : (
                          <GameIcon
                            name="specialChest"
                            size={32}
                            tone="purple"
                          />
                        )}
                        <View style={styles.worldChestCopy}>
                          <Text style={styles.worldChestTitle}>
                            {worldChestOpened
                              ? 'Baú Especial aberto!'
                              : 'Baú Especial'}
                          </Text>
                          <Text style={styles.worldChestMessage}>
                            {worldChestOpened
                              ? 'Você abriu um Baú Especial!'
                              : getWorldChestLabel(worldChest.id)}
                          </Text>
                        </View>
                      </View>

                      {worldChestOpened && worldChestResult?.reward ? (
                        <View style={styles.worldChestRewardGrid}>
                          {worldChestResult.reward.lifeGranted ? (
                            <Text style={styles.worldChestRewardText}>
                              +1 vida
                            </Text>
                          ) : null}
                          <Text style={styles.worldChestRewardText}>
                            +
                            {formatQuantity(
                              worldChestResult.reward.coins,
                              'moeda',
                              'moedas',
                            )}
                          </Text>
                          <Text style={styles.worldChestRewardText}>
                            +1 Trinca Mágica
                          </Text>
                          <Text style={styles.worldChestRewardText}>
                            +1 Misturar
                          </Text>
                          <Text style={styles.worldChestRewardText}>
                            +1 Voltar
                          </Text>
                        </View>
                      ) : (
                        <>
                          <View style={styles.worldChestKeyRow}>
                            <View style={styles.worldChestKeyPill}>
                              <GameIcon name="key" size={20} tone="purple" />
                              <Text style={styles.worldChestKeyText}>
                                {formatQuantity(keys, 'chave', 'chaves')}
                              </Text>
                            </View>
                            <View style={styles.worldChestKeyPill}>
                              <GameIcon name="coin" size={20} tone="gold" />
                              <Text style={styles.worldChestKeyText}>
                                Comprar:{' '}
                                {formatQuantity(KEY_COST, 'moeda', 'moedas')}
                              </Text>
                            </View>
                          </View>
                          {worldChestStatusText ? (
                            <Text style={styles.worldChestStatusText}>
                              {worldChestStatusText}
                            </Text>
                          ) : (
                            <Text style={styles.worldChestHintText}>
                              {keys > 0
                                ? 'Use 1 chave para abrir agora.'
                                : availableCoins >= KEY_COST
                                  ? 'Sem chaves. Compre uma chave e abra agora.'
                                  : 'Sem chaves. Ele fica disponível na Home e no mapa.'}
                            </Text>
                          )}
                          {keys > 0 ? (
                            <PrimaryButton
                              disabled={isOpeningWorldChest}
                              size="small"
                              title={
                                isOpeningWorldChest
                                  ? 'Abrindo...'
                                  : 'Abrir com 1 chave'
                              }
                              onPress={() => openSpecialChest('key')}
                            />
                          ) : (
                            <PrimaryButton
                              disabled={isOpeningWorldChest}
                              size="small"
                              title={
                                isOpeningWorldChest
                                  ? 'Abrindo...'
                                  : `Comprar chave por ${KEY_COST}`
                              }
                              onPress={() => openSpecialChest('buy-key')}
                            />
                          )}
                        </>
                      )}
                    </View>
                  ) : null}
                  {unlockText ? (
                    <Text style={styles.unlockText}>{unlockText}</Text>
                  ) : null}
                </View>
              ) : (
                <View style={styles.losePanel}>
                  <View style={styles.loseTray}>
                    {Array.from({ length: MAX_TRAY_CAPACITY }).map(
                      (_, index) => {
                        const activeSlot = index < activeTrayCapacity;

                        return (
                          <View
                            key={`lose-slot-${index}`}
                            style={[
                              styles.loseSlot,
                              !activeSlot ? styles.loseSlotLocked : null,
                            ]}
                          >
                            {activeSlot ? (
                              <Text style={styles.loseSlotText}>
                                {index % 2 === 0 ? '\u25CF' : '\u25C6'}
                              </Text>
                            ) : (
                              <GameIcon
                                muted
                                name="key"
                                size={18}
                                tone="neutral"
                              />
                            )}
                          </View>
                        );
                      },
                    )}
                  </View>
                  <Text style={styles.loseHint}>DICA RÁPIDA</Text>
                  <Text style={styles.loseText}>
                    Forme trincas antes de preencher todos os espaços ativos.
                  </Text>
                  <View
                    style={[
                      styles.livesPanel,
                      hasNoLives ? styles.livesPanelEmpty : null,
                    ]}
                  >
                    <View style={styles.livesTitleRow}>
                      <GameIcon name="heart" size={22} tone="pink" />
                      <Text
                        style={[
                          styles.livesTitle,
                          hasNoLives ? styles.livesTitleEmpty : null,
                        ]}
                      >
                        {livesState.currentLives}/{livesState.maxLives} vidas
                      </Text>
                    </View>
                    <Text style={styles.livesText}>
                      {hasNoLives
                        ? `A próxima vida chega em ${formatLifeTimer(timeUntilNextLifeMs)}`
                        : 'Você ainda pode tentar novamente.'}
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.actions}>
              {isWon ? (
                <PrimaryButton title={nextActionTitle} onPress={onNextLevel} />
              ) : (
                <PrimaryButton title="Tentar novamente" onPress={onRetry} />
              )}
              <PrimaryButton
                size="compact"
                title="Mapa"
                variant="secondary"
                onPress={onBackToLevels}
              />
            </View>
          </Animated.View>
        </SafeAreaView>
      </Modal>
      <ChestOpeningModal
        animationKey={commonChestAnimationKey}
        rewardText={commonChestRewardText ?? ''}
        rewardType={chestReward?.type ?? 'coins'}
        visible={
          isCommonChestOpeningVisible && commonChestRewardText !== undefined
        }
        coinCollectTarget={coinCollectTarget}
        onClose={() => setIsCommonChestOpeningVisible(false)}
        onOpenMoment={playChestOpenSound}
        onRewardMoment={playRewardSparkleSound}
      />
      <ChestOpeningModal
        animationKey={worldChestAnimationKey}
        kicker="Baú de Mundo"
        rewardItems={worldChestRewardItems}
        title="Recompensa Especial"
        variant="world"
        visible={isWorldChestOpeningVisible && worldChestRewardItems.length > 0}
        coinCollectTarget={coinCollectTarget}
        onClose={() => setIsWorldChestOpeningVisible(false)}
        onOpenMoment={playChestOpenSound}
        onRewardMoment={playRewardSparkleSound}
      />
    </>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 5,
    width: '100%',
  },
  card: {
    alignItems: 'center',
    backgroundColor: '#FFF3C9',
    borderRadius: 18,
    borderWidth: 3,
    gap: 4,
    maxHeight: '88%',
    maxWidth: 376,
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
    paddingTop: spacing.sm,
    width: '92%',
    // Acima do ConfettiRain (2): o card não pode ficar atrás da chuva.
    zIndex: 3,
    shadowColor: colors.backgroundDeep,
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 0.42,
    shadowRadius: 18,
    elevation: 18,
  },
  cardGlow: {
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    borderRadius: radii.pill,
    height: 90,
    left: -36,
    position: 'absolute',
    right: -36,
    top: -48,
  },
  banner: {
    alignItems: 'center',
    alignSelf: 'stretch',
    borderRadius: radii.pill,
    borderWidth: 2,
    elevation: 3,
    minHeight: 30,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    zIndex: 4,
    shadowColor: colors.backgroundDeep,
    shadowOffset: { height: 5, width: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
  },
  bannerText: {
    color: colors.inkOnDark,
    fontSize: fontSizes.sm,
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.28)',
    textShadowOffset: { height: 2, width: 0 },
    textShadowRadius: 2,
  },
  bonusRewardText: {
    backgroundColor: '#FFE3F0',
    borderColor: '#F58EC2',
    borderRadius: radii.pill,
    borderWidth: 2,
    color: '#8A1F57',
    fontSize: fontSizes.xs,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    textTransform: 'uppercase',
  },
  chestCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  chestCounter: {
    color: '#4B2C08',
    fontSize: fontSizes.sm,
    fontWeight: '900',
    minWidth: 32,
    textAlign: 'right',
  },
  chestFill: {
    backgroundColor: '#24D889',
    borderRadius: radii.pill,
    height: '100%',
  },
  chestHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    width: '100%',
  },
  chestMessage: {
    color: '#4B5560',
    fontSize: fontSizes.xs,
    fontWeight: '800',
  },
  chestPanel: {
    backgroundColor: '#F4FFF8',
    borderColor: '#7AE7B9',
    borderRadius: radii.card,
    borderWidth: 2,
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 4,
    width: '100%',
  },
  chestPanelOpen: {
    backgroundColor: '#FFF7D6',
    borderColor: '#FFD35A',
  },
  chestRewardText: {
    color: colors.successDark,
    fontSize: fontSizes.xs,
    fontWeight: '900',
    textAlign: 'center',
  },
  chestTitle: {
    color: colors.ink,
    fontSize: fontSizes.sm,
    fontWeight: '900',
  },
  chestTrack: {
    backgroundColor: 'rgba(7, 24, 32, 0.16)',
    borderRadius: radii.pill,
    height: 8,
    overflow: 'hidden',
    width: '100%',
  },
  worldChestCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  worldChestHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    width: '100%',
  },
  worldChestHintText: {
    color: '#FFF4B8',
    fontSize: fontSizes.xs,
    fontWeight: '800',
    textAlign: 'center',
  },
  worldChestKeyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'center',
    width: '100%',
  },
  worldChestKeyPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderColor: 'rgba(255, 225, 120, 0.34)',
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  worldChestKeyText: {
    color: colors.inkOnDark,
    fontSize: fontSizes.xs,
    fontWeight: '900',
  },
  worldChestMessage: {
    color: '#FFF4B8',
    fontSize: fontSizes.xs,
    fontWeight: '800',
  },
  worldChestPanel: {
    backgroundColor: '#241044',
    borderColor: '#FFE178',
    borderRadius: radii.card,
    borderWidth: 2,
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 4,
    width: '100%',
  },
  worldChestPanelOpen: {
    backgroundColor: '#180A3D',
    borderColor: '#42E5A7',
  },
  worldChestRewardGrid: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 248, 232, 0.12)',
    borderColor: 'rgba(255, 225, 120, 0.42)',
    borderRadius: radii.card,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'center',
    padding: spacing.xs,
  },
  worldChestRewardText: {
    color: colors.inkOnDark,
    fontSize: fontSizes.xs,
    fontWeight: '900',
  },
  worldChestStatusText: {
    color: '#FFD9E4',
    fontSize: fontSizes.xs,
    fontWeight: '900',
    textAlign: 'center',
  },
  worldChestTitle: {
    color: colors.inkOnDark,
    fontSize: fontSizes.sm,
    fontWeight: '900',
  },
  loseCard: {
    borderColor: '#F05278',
  },
  loseHint: {
    color: colors.dangerDark,
    fontSize: fontSizes.xs,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  losePanel: {
    backgroundColor: '#FFF0F4',
    borderColor: '#FF9AAE',
    borderRadius: radii.card,
    borderWidth: 3,
    gap: spacing.xs,
    padding: spacing.sm,
    width: '100%',
    zIndex: 1,
  },
  loseSlot: {
    alignItems: 'center',
    backgroundColor: '#FFF8E8',
    borderColor: '#F37A91',
    borderRadius: radii.sm,
    borderWidth: 2,
    flex: 1,
    height: 28,
    justifyContent: 'center',
  },
  loseSlotLocked: {
    backgroundColor: '#3F2932',
    borderColor: '#8F6B77',
  },
  loseSlotText: {
    color: '#F05278',
    fontSize: 12,
    fontWeight: '900',
  },
  loseTray: {
    backgroundColor: '#5F2230',
    borderColor: '#FFB3C4',
    borderRadius: radii.card,
    borderWidth: 2,
    flexDirection: 'row',
    gap: 4,
    padding: 5,
  },
  loseText: {
    color: colors.ink,
    fontSize: fontSizes.sm,
    fontWeight: '800',
    textAlign: 'center',
  },
  livesPanel: {
    alignItems: 'center',
    backgroundColor: '#FFF8E8',
    borderColor: '#E8B64B',
    borderRadius: radii.card,
    borderWidth: 2,
    gap: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  livesPanelEmpty: {
    backgroundColor: '#FFE1E7',
    borderColor: '#F05278',
  },
  livesText: {
    color: colors.muted,
    fontSize: fontSizes.xs,
    fontWeight: '900',
    textAlign: 'center',
  },
  livesTitle: {
    color: colors.primaryDark,
    fontSize: fontSizes.sm,
    fontWeight: '900',
  },
  livesTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  livesTitleEmpty: {
    color: colors.dangerDark,
  },
  noRewardText: {
    backgroundColor: '#EEF4F2',
    borderColor: '#C6D6D0',
    borderRadius: radii.pill,
    borderWidth: 2,
    color: colors.muted,
    fontSize: fontSizes.xs,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    textTransform: 'uppercase',
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(4, 10, 22, 0.86)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  rewardPanel: {
    alignItems: 'center',
    backgroundColor: '#FFF9E8',
    borderColor: '#E8B64B',
    borderRadius: 14,
    borderWidth: 2,
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    position: 'relative',
    width: '100%',
    zIndex: 1,
    ...shadows.card,
  },
  rewardRow: {
    alignItems: 'center',
    backgroundColor: '#FFE09A',
    borderBottomColor: '#A55D00',
    borderBottomWidth: 3,
    borderColor: colors.primary,
    borderRadius: radii.pill,
    borderWidth: 2,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  rewardText: {
    color: colors.primaryDark,
    fontSize: fontSizes.md,
    fontWeight: '900',
  },
  perfectCard: {
    borderColor: '#FFF0A5',
  },
  perfectGlow: {
    backgroundColor: 'rgba(255, 211, 90, 0.24)',
    borderRadius: radii.pill,
    height: 86,
    position: 'absolute',
    top: -12,
    width: 240,
  },
  perfectRewardPanel: {
    backgroundColor: '#FFF7CF',
    borderColor: '#FFD35A',
  },
  recordText: {
    backgroundColor: '#EFFFF8',
    borderColor: colors.success,
    borderRadius: radii.pill,
    borderWidth: 2,
    color: colors.successDark,
    fontSize: fontSizes.xs,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    textTransform: 'uppercase',
  },
  resultStar: {
    alignItems: 'center',
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  starsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  subtitle: {
    color: colors.muted,
    fontSize: fontSizes.xs,
    fontWeight: '800',
    lineHeight: 15,
    marginBottom: 0,
    textAlign: 'center',
    zIndex: 1,
  },
  title: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    zIndex: 1,
  },
  resultBody: {
    alignSelf: 'stretch',
    flexShrink: 1,
    width: '100%',
  },
  resultBodyContent: {
    paddingBottom: 2,
  },
  winStatsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'center',
    width: '100%',
  },
  statLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  statPill: {
    alignItems: 'center',
    backgroundColor: '#FFF4C9',
    borderColor: '#E8B64B',
    borderRadius: radii.pill,
    borderWidth: 2,
    minWidth: 82,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  recordPill: {
    backgroundColor: '#EFFFF8',
    borderColor: colors.success,
  },
  statValue: {
    color: colors.ink,
    fontSize: fontSizes.sm,
    fontWeight: '900',
  },
  timeGoalText: {
    color: colors.muted,
    fontSize: fontSizes.xs,
    fontWeight: '900',
    textAlign: 'center',
  },
  timeText: {
    color: colors.ink,
    fontSize: fontSizes.sm,
    fontWeight: '900',
    textAlign: 'center',
  },
  unlockText: {
    color: colors.successDark,
    fontSize: fontSizes.sm,
    fontWeight: '900',
    textAlign: 'center',
  },
  winBanner: {
    backgroundColor: '#42E5A7',
    borderBottomColor: '#087A54',
    borderColor: '#D8FFE9',
  },
  winCard: {
    backgroundColor: '#5A35C8',
    borderColor: '#FFD35A',
  },
  winSubtitle: {
    color: '#FFE9A8',
  },
  winTitle: {
    color: colors.inkOnDark,
    fontSize: 25,
    textShadowColor: 'rgba(0, 0, 0, 0.32)',
    textShadowOffset: { height: 3, width: 0 },
    textShadowRadius: 3,
  },
  loseBanner: {
    backgroundColor: '#F05278',
    borderColor: '#FFC0CE',
  },
});
