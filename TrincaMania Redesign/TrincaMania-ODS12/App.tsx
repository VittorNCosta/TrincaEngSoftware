import { useAppSettings } from './src/hooks/useAppSettings';
import { useWorldChestController } from './src/hooks/useWorldChestController';
import { useProgressPersistence } from './src/hooks/useProgressPersistence';
import {
  checkBoardSize,
  checkCanonicalCampaign,
  checkRewardUnclaimed,
  checkTrayCapacity,
} from './src/observability/runtimeInvariants';
import { isChapterModeUnlocked } from './src/utils/chapterAvailability';
import { installNativeErrorHandlers } from './src/observability/nativeErrors';
import { setDiagnosticContext } from './src/utils/log';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { CampaignResizeNoticeModal } from './src/components/CampaignResizeNoticeModal';
import { MysteryTutorialModal } from './src/components/MysteryTutorialModal';
import { NoLivesModal } from './src/components/NoLivesModal';
import { SettingsModal } from './src/components/SettingsModal';
import { RoutineModal, RoutineSection } from './src/components/RoutineModal';
import { TutorialModal } from './src/components/TutorialModal';
import { WorldChestModal } from './src/components/WorldChestModal';
import { buildChapterLevel, isChapterMapId } from './src/data/chapters';
import { LEVELS } from './src/data/levels';
import { MainTabs } from './src/navigation/MainTabs';
import { ChaptersScreen } from './src/screens/ChaptersScreen';
import { GameScreen } from './src/screens/GameScreen';
import { ShopScreen } from './src/screens/ShopScreen';
import { SplashIntroScreen } from './src/screens/SplashIntroScreen';
import { colors } from './src/styles/theme';
import {
  CHEST_COIN_REWARD,
  applyLevelCompletion,
  buyPowerUpItem,
  collectRestCheckpoint,
  consumePowerUpItem,
  createChestProgressSummary,
  createInitialProgress,
  getCampaignResizeNoticeSeen,
  grantChestCoinReward,
  getMysteryTutorialSeen,
  getPracticalTutorialSeen,
  getTutorialSeen,
  loadProgress,
  loadStoredProgressMigrationInfo,
  markBonusWorldAchievementShown,
  normalizeProgress,
  grantRewardForOperation,
  purchasePowerUpTransaction,
  restorePurchasedPowerUpItem,
  saveCampaignResizeNoticeSeen,
  saveMysteryTutorialSeen,
  savePracticalTutorialSeen,
  saveTutorialSeen,
  spendCoins,
} from './src/storage/progressStorage';
import {
  ChapterProgressState,
  applyChapterMapCompletion,
  createInitialChapterProgress,
  getChapterMapStars,
  getNextChapterMapId,
  isChapterMapUnlocked,
  loadChapterProgress,
} from './src/storage/chapterProgressStorage';
import {
  MagicTripleRescueState,
  createInitialMagicTripleRescueState,
  loadMagicTripleRescueState,
  markMagicTripleRescueSeen,
  markMagicTripleRescueUsed,
  resetMagicTripleRescueState,
  saveMagicTripleRescueState,
} from './src/storage/magicTripleRescueStorage';
import {
  LivesState,
  addLife,
  applyLifeRewardForOperation,
  canPlayLevel,
  consumeLife,
  createInitialLivesState,
  getLivesState,
  getTimeUntilNextLife,
  refillLives,
} from './src/storage/livesStorage';
import {
  ChestRewardSummary,
  PowerUpType,
  ProgressState,
  RestCheckpointRewardResult,
  WorldId,
} from './src/types/game';
import { WindowTarget } from './src/types/ui';
import { getSettings } from './src/storage/settingsStorage';
import {
  beginDailyCheckInClaim,
  completeDailyCheckInClaim,
  createInitialDailyCheckInState,
  getDailyCheckInStatus,
  getLocalDateKey,
} from './src/dailyCheckIn/dailyCheckIn';
import { resolveDailyCheckInReward } from './src/dailyCheckIn/dailyCheckInRewards';
import { DailyCheckInState } from './src/dailyCheckIn/dailyCheckInTypes';
import {
  loadDailyCheckInState,
  resetDailyCheckInState,
  saveDailyCheckInState,
} from './src/storage/dailyCheckInStorage';
import {
  createMissionState,
  loadMissionState,
  markMissionClaimed,
  recordMissionEvent,
  resetMissionState,
  MissionState,
} from './src/missions/routineMissions';
import {
  createInitialDailyChallengeSave,
  getDailyChallengeLevel,
  loadDailyChallengeSave,
  recordDailyChallengeCompletion,
  resetDailyChallengeSave,
  DailyChallengeSave,
} from './src/challenges/dailyChallenge';
import {
  playMetaMusic,
  playWorldMusic,
  releaseMusicPlayer,
  setMusicEnabled,
} from './src/utils/music';
import {
  releaseSoundPlayers,
  playRewardCollectSound,
} from './src/utils/sounds';
import { releaseVoiceOverPlayers } from './src/utils/voiceOver';
import {
  BonusTraySlotActivationResult,
  COIN_TRAY_SLOT_COST,
  BASE_TRAY_CAPACITY,
  MAX_TRAY_CAPACITY,
  RetryLevelResult,
  TrayBoostPurchaseResult,
  TrayBoostState,
  activateBonusTraySlot,
  createInitialTrayBoostState,
  getActiveTrayCapacity,
  getBonusTraySlotRemaining,
  getCoinTraySlotRemaining,
  getTrayBoostState,
  isAdTraySlotActive,
  isCoinTraySlotActive,
  purchaseCoinTraySlot,
  resetTrayBoostState,
} from './src/storage/trayBoostStorage';
import {
  POWER_UP_COSTS,
  getIncrementalCoinRewardForLevel,
} from './src/utils/gameLogic';
import { getRestCheckpointCoinReward } from './src/utils/shop';
import { getCurrentWorldId } from './src/utils/worldProgress';

type AppScreen = 'splash' | 'levels' | 'game' | 'shop' | 'chapters';
type ShopReturnScreen = 'levels' | 'game';

export default function App() {
  useEffect(() => installNativeErrorHandlers(), []);
  const [screen, setScreen] = useState<AppScreen>('splash');
  const [progress, setProgress] = useState<ProgressState>(
    createInitialProgress(),
  );
  const [chapterProgress, setChapterProgress] = useState<ChapterProgressState>(
    createInitialChapterProgress(),
  );
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [campaignInitialWorldId, setCampaignInitialWorldId] = useState<
    WorldId | undefined
  >();
  const [selectedLevelId, setSelectedLevelId] = useState(LEVELS[0]?.id ?? '');
  const [shopReturnScreen, setShopReturnScreen] =
    useState<ShopReturnScreen>('levels');
  const [shopWorldId, setShopWorldId] = useState<WorldId>(1);
  const [livesState, setLivesState] = useState<LivesState>(
    createInitialLivesState(),
  );
  const [livesNow, setLivesNow] = useState(Date.now());
  const [trayBoostState, setTrayBoostState] = useState<TrayBoostState>(
    createInitialTrayBoostState(),
  );
  const [isNoLivesModalVisible, setIsNoLivesModalVisible] = useState(false);
  const [isTutorialVisible, setIsTutorialVisible] = useState(false);
  const [isMysteryTutorialSeen, setIsMysteryTutorialSeen] = useState(false);
  const [isPracticalTutorialSeen, setIsPracticalTutorialSeen] = useState(false);
  const [isCampaignResizeNoticeVisible, setIsCampaignResizeNoticeVisible] =
    useState(false);
  const [magicTripleRescueState, setMagicTripleRescueState] =
    useState<MagicTripleRescueState>(createInitialMagicTripleRescueState());
  const {
    settings,
    setSettings,
    handleToggleSound,
    handleToggleMusic,
    handleToggleHaptics,
    handleEnableSilentMode,
  } = useAppSettings();
  const [devMode, setDevMode] = useState(false);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [routineSection, setRoutineSection] =
    useState<RoutineSection>('checkin');
  const [isRoutineVisible, setIsRoutineVisible] = useState(false);
  const [isRoutineBusy, setIsRoutineBusy] = useState(false);
  const [checkIn, setCheckIn] = useState<DailyCheckInState>(
    createInitialDailyCheckInState(),
  );
  const [missions, setMissions] = useState<MissionState>(createMissionState());
  const [challenge, setChallenge] = useState<DailyChallengeSave>(
    createInitialDailyChallengeSave(),
  );
  const checkInRef = useRef(checkIn);
  const routineBusyRef = useRef(false);
  const [coinCollectTarget, setCoinCollectTarget] = useState<
    WindowTarget | undefined
  >();
  const progressRef = useRef(progress);
  const progressSaveQueueRef = useRef<Promise<void>>(Promise.resolve());
  // Apagar o progresso incrementa a geração: escritas enfileiradas antes do reset
  // pertencem à geração antiga e são descartadas em vez de gravar por cima dele.
  const progressGenerationRef = useRef(0);
  const chapterProgressRef = useRef(chapterProgress);
  const chapterProgressSaveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const magicTripleRescueRef = useRef(magicTripleRescueState);
  const isProgressMutationInFlightRef = useRef(false);
  const isPurchasingPowerUpRef = useRef(false);
  const isPurchasingTraySlotRef = useRef(false);
  const isCollectingCheckpointRef = useRef(false);
  const bonusTraySlotActivationPromiseRef = useRef<
    Promise<BonusTraySlotActivationResult> | undefined
  >(undefined);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    checkInRef.current = checkIn;
  }, [checkIn]);

  useEffect(() => {
    chapterProgressRef.current = chapterProgress;
  }, [chapterProgress]);

  useEffect(() => {
    magicTripleRescueRef.current = magicTripleRescueState;
  }, [magicTripleRescueState]);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      loadProgress(),
      loadChapterProgress(),
      getTutorialSeen(),
      getPracticalTutorialSeen(),
      getMysteryTutorialSeen(),
      loadMagicTripleRescueState(),
      getLivesState(),
      getTrayBoostState(),
      getSettings(),
      loadStoredProgressMigrationInfo(),
      getCampaignResizeNoticeSeen(),
      loadDailyCheckInState(),
      loadMissionState(),
      loadDailyChallengeSave(),
    ])
      .then(
        ([
          storedProgress,
          storedChapterProgress,
          tutorialSeen,
          practicalTutorialSeen,
          mysteryTutorialSeen,
          storedMagicTripleRescueState,
          storedLives,
          storedTrayBoost,
          storedSettings,
          progressMigrationInfo,
          campaignResizeNoticeSeen,
          storedCheckIn,
          storedMissions,
          storedChallenge,
        ]) => {
          if (isMounted) {
            setProgress(storedProgress);
            setChapterProgress(storedChapterProgress);
            setLivesState(storedLives);
            setTrayBoostState(storedTrayBoost);
            setSettings(storedSettings);
            setCheckIn(storedCheckIn);
            checkInRef.current = storedCheckIn;
            setMissions(storedMissions);
            setChallenge(storedChallenge);
            setLivesNow(Date.now());
            setIsTutorialVisible(!tutorialSeen);
            setIsPracticalTutorialSeen(practicalTutorialSeen);
            setIsMysteryTutorialSeen(mysteryTutorialSeen);
            setMagicTripleRescueState(storedMagicTripleRescueState);
            setIsCampaignResizeNoticeVisible(
              progressMigrationInfo.droppedLevelCount > 0 &&
                !campaignResizeNoticeSeen,
            );
          }
        },
      )
      .finally(() => {
        if (isMounted) {
          setIsLoadingProgress(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [setSettings]);

  const refreshLivesState = useCallback(async () => {
    const nextLivesState = await getLivesState();
    setLivesState(nextLivesState);
    setLivesNow(Date.now());
    return nextLivesState;
  }, []);

  const refreshTrayBoostState = useCallback(async () => {
    const nextTrayBoostState = await getTrayBoostState();
    setTrayBoostState(nextTrayBoostState);
    setLivesNow(Date.now());
    return nextTrayBoostState;
  }, []);

  const { commitProgress, commitChapterProgress } = useProgressPersistence({
    progressRef,
    progressGenerationRef,
    progressSaveQueueRef,
    chapterProgressRef,
    chapterProgressSaveQueueRef,
    setProgress,
    setChapterProgress,
  });

  const checkInSettlingRef = useRef(false);
  const missionEventSequenceRef = useRef(0);
  const settleCheckIn = useCallback(
    async (state: DailyCheckInState) => {
      const pending = state.pendingClaim;
      if (!pending || checkInSettlingRef.current) return;
      checkInSettlingRef.current = true;
      try {
        if (pending.reward.kind === 'life') {
          const nextLives = await applyLifeRewardForOperation(
            pending.operationId,
          );
          setLivesState(nextLives);
          setLivesNow(Date.now());
        } else {
          await commitProgress(
            grantRewardForOperation(
              progressRef.current,
              pending.operationId,
              pending.reward.kind === 'coins'
                ? { coins: pending.reward.amount }
                : { powerType: pending.reward.powerType },
            ),
          );
        }
        const settled = completeDailyCheckInClaim(state, pending.operationId);
        await saveDailyCheckInState(settled);
        checkInRef.current = settled;
        setCheckIn(settled);
        playRewardCollectSound();
      } finally {
        checkInSettlingRef.current = false;
      }
    },
    [commitProgress],
  );

  useEffect(() => {
    if (!isLoadingProgress && checkIn.pendingClaim) {
      settleCheckIn(checkIn).catch(() => undefined);
    }
  }, [checkIn, isLoadingProgress, settleCheckIn]);

  const handleClaimCheckIn = async () => {
    if (routineBusyRef.current) return;
    const current = checkInRef.current;
    const status = getDailyCheckInStatus(current);
    if (!status.eligible && !current.pendingClaim) return;
    routineBusyRef.current = true;
    setIsRoutineBusy(true);
    try {
      if (current.pendingClaim) {
        await settleCheckIn(current);
        return;
      }
      const pending = beginDailyCheckInClaim(
        current,
        status.dateKey,
        resolveDailyCheckInReward(status.cycleDay),
        `checkin:${status.dateKey}`,
      );
      await saveDailyCheckInState(pending);
      checkInRef.current = pending;
      setCheckIn(pending);
      await settleCheckIn(pending);
    } catch {
      Alert.alert(
        'Resgate pendente',
        'A recompensa será concluída quando o armazenamento voltar a responder.',
      );
    } finally {
      routineBusyRef.current = false;
      setIsRoutineBusy(false);
    }
  };

  const emitMissionEvent = async (
    kind: 'levels' | 'triples' | 'stars',
    value: number,
    prefix: string,
  ) => {
    missionEventSequenceRef.current += 1;
    const next = await recordMissionEvent({
      id: `${prefix}:${kind}:${Date.now()}:${missionEventSequenceRef.current}`,
      kind,
      value,
    });
    setMissions(next);
  };

  const handleClaimMission = async (missionId: string) => {
    if (routineBusyRef.current) return;
    routineBusyRef.current = true;
    setIsRoutineBusy(true);
    try {
      const current = await loadMissionState();
      const mission = [
        ...current.daily.missions,
        ...current.weekly.missions,
      ].find((item) => item.id === missionId);
      if (!mission || mission.claimed || mission.progress < mission.target)
        return;
      await commitProgress(
        grantRewardForOperation(progressRef.current, `mission:${mission.id}`, {
          coins: mission.rewardCoins,
        }),
      );
      setMissions(await markMissionClaimed(mission.id));
      playRewardCollectSound();
    } catch {
      Alert.alert('Não foi possível resgatar', 'Tente novamente em instantes.');
    } finally {
      routineBusyRef.current = false;
      setIsRoutineBusy(false);
    }
  };

  useEffect(() => {
    if (isLoadingProgress) return;
    setMusicEnabled(settings.musicEnabled);
  }, [isLoadingProgress, settings.musicEnabled]);

  useEffect(
    () => () => {
      releaseVoiceOverPlayers();
      releaseMusicPlayer();
      releaseSoundPlayers();
    },
    [],
  );

  const livesStateRef = useRef(livesState);
  const trayBoostStateRef = useRef(trayBoostState);

  useEffect(() => {
    livesStateRef.current = livesState;
  }, [livesState]);

  useEffect(() => {
    trayBoostStateRef.current = trayBoostState;
  }, [trayBoostState]);

  useEffect(() => {
    if (isLoadingProgress || screen === 'splash') {
      return undefined;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const currentLives = livesStateRef.current;
      const currentTrayBoost = trayBoostStateRef.current;
      const isCountingLives = currentLives.currentLives < currentLives.maxLives;
      const isCountingBoost = Boolean(
        currentTrayBoost.coinSlotExpiresAt || currentTrayBoost.adSlotExpiresAt,
      );

      // Só acorda o App quando existe contador visível. Antes o tick re-renderizava
      // a tela inteira (tabuleiro incluído) a cada segundo, até com vidas cheias.
      if (isCountingLives || isCountingBoost) {
        setLivesNow(now);
      }

      if (isCountingLives && getTimeUntilNextLife(currentLives, now) <= 0) {
        refreshLivesState().catch(() => undefined);
      }

      if (
        (currentTrayBoost.coinSlotExpiresAt &&
          getCoinTraySlotRemaining(currentTrayBoost, now) <= 0) ||
        (currentTrayBoost.adSlotExpiresAt &&
          getBonusTraySlotRemaining(currentTrayBoost, now) <= 0)
      ) {
        refreshTrayBoostState().catch(() => undefined);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isLoadingProgress, refreshLivesState, refreshTrayBoostState, screen]);

  const {
    activeWorldChestId,
    worldChestResult,
    isOpeningWorldChest,
    showWorldChest,
    closeWorldChest,
    handleOpenWorldChest,
  } = useWorldChestController({
    progressRef,
    commitProgress,
    setLivesState,
    setLivesNow,
  });

  const isDailyChallengeSelected = selectedLevelId.startsWith('daily-');
  const selectedLevel = useMemo(
    () =>
      (selectedLevelId.startsWith('daily-')
        ? getDailyChallengeLevel(selectedLevelId.slice(6))
        : undefined) ??
      buildChapterLevel(selectedLevelId) ??
      LEVELS.find((level) => level.id === selectedLevelId) ??
      LEVELS[0],
    [selectedLevelId],
  );
  useEffect(() => {
    if (isLoadingProgress) return;
    if (screen === 'game' && selectedLevel)
      playWorldMusic(selectedLevel.worldId);
    else playMetaMusic();
  }, [isLoadingProgress, screen, selectedLevel]);
  // Snapshot before rendering children: a render failure must not inherit the
  // previous screen's domain context while waiting for effects to run.
  setDiagnosticContext({
    screen,
    levelId:
      screen === 'game' || (screen === 'shop' && shopReturnScreen === 'game')
        ? selectedLevel?.id
        : undefined,
    worldId:
      screen === 'game' || (screen === 'shop' && shopReturnScreen === 'game')
        ? selectedLevel?.worldId
        : undefined,
  });
  useEffect(() => {
    if (selectedLevel) checkBoardSize(selectedLevel.tiles.length);
  }, [screen, selectedLevel]);
  useEffect(() => {
    checkCanonicalCampaign(LEVELS);
  }, []);
  const isChapterLevelSelected = isChapterMapId(selectedLevelId);
  const isMysteryTutorialVisible =
    screen === 'game' &&
    !isMysteryTutorialSeen &&
    Boolean(
      selectedLevel?.mysteryTileCount && selectedLevel.mysteryTileCount > 0,
    );
  // A fase continua montada enquanto a Loja está aberta por cima dela: é o que
  // faz "Voltar à fase" devolver a partida em andamento, e não uma nova.
  const isGameMounted =
    screen === 'game' || (screen === 'shop' && shopReturnScreen === 'game');
  const timeUntilNextLifeMs = getTimeUntilNextLife(livesState, livesNow);
  const activeTrayCapacity = getActiveTrayCapacity(trayBoostState, livesNow);
  useEffect(() => {
    checkTrayCapacity(
      activeTrayCapacity,
      BASE_TRAY_CAPACITY,
      MAX_TRAY_CAPACITY,
    );
  }, [activeTrayCapacity]);
  const isCoinTraySlotActiveNow = isCoinTraySlotActive(
    trayBoostState,
    livesNow,
  );
  const isBonusTraySlotActiveNow = isAdTraySlotActive(trayBoostState, livesNow);
  const coinTraySlotRemainingMs = getCoinTraySlotRemaining(
    trayBoostState,
    livesNow,
  );
  const bonusTraySlotRemainingMs = getBonusTraySlotRemaining(
    trayBoostState,
    livesNow,
  );

  const handleSplashFinish = useCallback(() => {
    setScreen('levels');
  }, []);

  /**
   * Conclusão de mapa de capítulo. Estrela e desbloqueio vão para a chave dos
   * capítulos; a moeda entra na carteira compartilhada, pela mesma tabela de
   * recompensa da campanha. O baú comum é da campanha e não avança aqui — por
   * isso o resumo devolve a contagem atual com `isLevelCounted: false`, que é o
   * que mantém a barra parada em vez de animar sem motivo.
   */
  const handleChapterLevelComplete = async (
    mapId: string,
    starsEarned: number,
  ) => {
    const completionResult = applyChapterMapCompletion(
      chapterProgressRef.current,
      mapId,
      starsEarned,
    );
    const coinsEarned = getIncrementalCoinRewardForLevel(
      completionResult.previousStars,
      completionResult.starsEarned,
    );

    await commitChapterProgress(completionResult.progress);

    if (coinsEarned > 0) {
      await commitProgress(
        normalizeProgress({
          ...progressRef.current,
          coins: progressRef.current.coins + coinsEarned,
        }),
      );
    }

    void emitMissionEvent('levels', 1, mapId).catch(() => undefined);
    void emitMissionEvent('stars', completionResult.starsEarned, mapId).catch(
      () => undefined,
    );

    return {
      bonusWorldAchievementUnlocked: false,
      chestProgress: createChestProgressSummary(
        progressRef.current.chestProgressLevelIds.length,
        false,
      ),
      coinsEarned,
      savedStars: completionResult.savedStars,
      starsEarned: completionResult.starsEarned,
      unlockedLevelTitle: completionResult.unlockedMapTitle,
    };
  };

  const handleLevelComplete = async (levelId: string, starsEarned: number) => {
    if (levelId.startsWith('daily-')) {
      const saved = await recordDailyChallengeCompletion(
        levelId.slice(6),
        starsEarned,
      );
      setChallenge(saved);
      return {
        bonusWorldAchievementUnlocked: false,
        chestProgress: createChestProgressSummary(
          progressRef.current.chestProgressLevelIds.length,
          false,
        ),
        coinsEarned: 0,
        savedStars: saved.bestStars[levelId.slice(6)] ?? starsEarned,
        starsEarned,
      };
    }
    if (isChapterMapId(levelId)) {
      return handleChapterLevelComplete(levelId, starsEarned);
    }

    const completionResult = applyLevelCompletion(
      progressRef.current,
      levelId,
      starsEarned,
    );
    let nextProgress = completionResult.progress;
    let chestReward: ChestRewardSummary | undefined;
    let shouldGrantCommonChestLife = false;

    if (completionResult.chestProgress.opened) {
      try {
        const currentLivesState = await getLivesState();

        if (currentLivesState.currentLives < currentLivesState.maxLives) {
          shouldGrantCommonChestLife = true;
          chestReward = {
            amount: 1,
            label: '+1 vida',
            type: 'life',
          };
        } else {
          nextProgress = grantChestCoinReward(nextProgress);
          chestReward = {
            amount: CHEST_COIN_REWARD,
            label: `+${CHEST_COIN_REWARD} moedas`,
            type: 'coins',
          };
        }
      } catch {
        nextProgress = grantChestCoinReward(nextProgress);
        chestReward = {
          amount: CHEST_COIN_REWARD,
          label: `+${CHEST_COIN_REWARD} moedas`,
          type: 'coins',
        };
      }
    }

    await commitProgress(nextProgress);
    void emitMissionEvent('levels', 1, levelId).catch(() => undefined);
    void emitMissionEvent('stars', starsEarned, levelId).catch(() => undefined);

    if (shouldGrantCommonChestLife) {
      try {
        const nextLivesState = await addLife();
        setLivesState(nextLivesState);
        setLivesNow(Date.now());
      } catch {
        // Progress is already saved here; do not reopen the chest and risk a duplicate reward.
      }
    }

    return {
      bonusWorldAchievementUnlocked:
        completionResult.bonusWorldAchievementUnlocked,
      chestProgress: completionResult.chestProgress,
      chestReward,
      coinsEarned: completionResult.coinsEarned,
      savedStars: completionResult.savedStars,
      starsEarned: completionResult.starsEarned,
      worldChest: completionResult.worldChest,
      unlockedLevelTitle: completionResult.unlockedLevelTitle,
      unlockedWorldId: completionResult.unlockedWorldId,
    };
  };

  const handleBuyItem = (powerType: PowerUpType) => {
    if (isProgressMutationInFlightRef.current) {
      return false;
    }

    const cost = POWER_UP_COSTS[powerType];
    const currentProgress = progressRef.current;

    if (currentProgress.coins < cost) {
      return false;
    }

    const nextProgress = buyPowerUpItem(currentProgress, powerType, cost);
    void commitProgress(nextProgress).catch(() => undefined);

    return true;
  };

  const handleUseItem = (powerType: PowerUpType) => {
    if (isProgressMutationInFlightRef.current) {
      return false;
    }

    const currentProgress = progressRef.current;
    if (currentProgress.itemCounts[powerType] <= 0) {
      return false;
    }

    const nextProgress = consumePowerUpItem(currentProgress, powerType);
    void commitProgress(nextProgress).catch(() => undefined);

    return true;
  };

  const handlePurchasePowerUp = useCallback(
    async (
      powerType: PowerUpType,
      useImmediately: boolean,
    ): Promise<boolean> => {
      if (
        isPurchasingPowerUpRef.current ||
        isProgressMutationInFlightRef.current
      ) {
        return false;
      }

      isPurchasingPowerUpRef.current = true;
      isProgressMutationInFlightRef.current = true;
      const previousProgress = progressRef.current;

      try {
        const nextProgress = purchasePowerUpTransaction(
          previousProgress,
          powerType,
          useImmediately,
        );

        if (!nextProgress) {
          return false;
        }

        await commitProgress(nextProgress);
        return true;
      } catch {
        progressRef.current = previousProgress;
        setProgress(previousProgress);
        return false;
      } finally {
        isPurchasingPowerUpRef.current = false;
        isProgressMutationInFlightRef.current = false;
      }
    },
    [commitProgress],
  );

  const handleRestorePurchasedPowerUp = useCallback(
    async (powerType: PowerUpType): Promise<boolean> => {
      if (isProgressMutationInFlightRef.current) {
        return false;
      }

      isProgressMutationInFlightRef.current = true;
      const previousProgress = progressRef.current;
      try {
        await commitProgress(
          restorePurchasedPowerUpItem(previousProgress, powerType),
        );
        return true;
      } catch {
        progressRef.current = previousProgress;
        setProgress(previousProgress);
        return false;
      } finally {
        isProgressMutationInFlightRef.current = false;
      }
    },
    [commitProgress],
  );

  const commitMagicTripleRescueState = useCallback(
    async (nextState: MagicTripleRescueState) => {
      magicTripleRescueRef.current = nextState;
      setMagicTripleRescueState(nextState);
      await saveMagicTripleRescueState(nextState);
    },
    [],
  );

  const handleMagicTripleRescueSeen = useCallback(async () => {
    await commitMagicTripleRescueState(
      markMagicTripleRescueSeen(magicTripleRescueRef.current),
    );
  }, [commitMagicTripleRescueState]);

  const handleMagicTripleRescueUsed = useCallback(async () => {
    await commitMagicTripleRescueState(
      markMagicTripleRescueUsed(magicTripleRescueRef.current),
    );
  }, [commitMagicTripleRescueState]);

  const handleResetProgress = () => {
    const freshProgress = createInitialProgress();
    const freshMagicTripleRescueState = createInitialMagicTripleRescueState();
    progressGenerationRef.current += 1;
    void commitProgress(freshProgress).catch(() => undefined);
    void commitChapterProgress(createInitialChapterProgress()).catch(
      () => undefined,
    );
    magicTripleRescueRef.current = freshMagicTripleRescueState;
    setMagicTripleRescueState(freshMagicTripleRescueState);
    setSelectedLevelId(LEVELS[0]?.id ?? '');
    setIsRoutineVisible(false);
    resetDailyCheckInState()
      .then((state) => {
        checkInRef.current = state;
        setCheckIn(state);
      })
      .catch(() => undefined);
    resetMissionState()
      .then(setMissions)
      .catch(() => undefined);
    resetDailyChallengeSave()
      .then(setChallenge)
      .catch(() => undefined);
    setShopWorldId(1);
    refillLives()
      .then((nextLivesState) => {
        setLivesState(nextLivesState);
        setLivesNow(Date.now());
      })
      .catch(() => undefined);
    resetTrayBoostState()
      .then((nextTrayBoostState) => {
        setTrayBoostState(nextTrayBoostState);
        setLivesNow(Date.now());
      })
      .catch(() => undefined);
    resetMagicTripleRescueState().catch(() => undefined);
    setIsTutorialVisible(true);
    setIsPracticalTutorialSeen(false);
    saveTutorialSeen(false).catch(() => undefined);
    savePracticalTutorialSeen(false).catch(() => undefined);
  };

  // Só existe em build de desenvolvimento (__DEV__): libera todas as fases da
  // campanha e todos os mapas de capítulo, sem passar pelo fluxo normal de
  // conclusão — é o que deixa testar fases avançadas sem jogar as anteriores.
  const handleUnlockAllForDevMode = () => {
    if (__DEV__) {
      setDevMode((current) => !current);
      setScreen('levels');
    }
  };

  const handleFinishTutorial = () => {
    setIsTutorialVisible(false);
    saveTutorialSeen(true).catch(() => undefined);
  };

  const handleFinishMysteryTutorial = () => {
    setIsMysteryTutorialSeen(true);
    saveMysteryTutorialSeen(true).catch(() => undefined);
  };

  const handleCloseCampaignResizeNotice = () => {
    setIsCampaignResizeNoticeVisible(false);
    saveCampaignResizeNoticeSeen(true).catch(() => undefined);
  };

  const handleFinishPracticalTutorial = () => {
    setIsPracticalTutorialSeen(true);
    savePracticalTutorialSeen(true).catch(() => undefined);
  };

  const showNoLivesModal = (nextLivesState?: LivesState) => {
    if (nextLivesState) {
      setLivesState(nextLivesState);
    }

    setLivesNow(Date.now());
    setIsNoLivesModalVisible(true);
  };

  const ensureCanStartLevel = async () => {
    const nextLivesState = await refreshLivesState();
    await refreshTrayBoostState();

    if (!canPlayLevel(nextLivesState)) {
      showNoLivesModal(nextLivesState);
      return false;
    }

    return true;
  };

  const handlePurchaseCoinTraySlot =
    async (): Promise<TrayBoostPurchaseResult> => {
      if (
        isPurchasingTraySlotRef.current ||
        isProgressMutationInFlightRef.current
      ) {
        const currentTrayBoostState = await getTrayBoostState();
        setTrayBoostState(currentTrayBoostState);
        setLivesNow(Date.now());

        return {
          purchased: false,
          reason: 'active',
          state: currentTrayBoostState,
        };
      }

      isPurchasingTraySlotRef.current = true;
      isProgressMutationInFlightRef.current = true;

      try {
        const purchaseResult = await purchaseCoinTraySlot(
          progressRef.current.coins,
        );
        setTrayBoostState(purchaseResult.state);
        setLivesNow(Date.now());

        if (!purchaseResult.purchased) {
          return purchaseResult;
        }

        // Usa o snapshot mais recente após o await; a trava global impede outra
        // mutação de progresso e evita sobrescrever inventário/estrelas novos.
        const latestProgress = progressRef.current;
        const nextProgress = spendCoins(latestProgress, COIN_TRAY_SLOT_COST);
        await commitProgress(nextProgress);

        return purchaseResult;
      } finally {
        isPurchasingTraySlotRef.current = false;
        isProgressMutationInFlightRef.current = false;
      }
    };

  const handleActivateBonusTraySlot =
    (): Promise<BonusTraySlotActivationResult> => {
      const pendingActivation = bonusTraySlotActivationPromiseRef.current;

      if (pendingActivation) {
        return pendingActivation;
      }

      const activationPromise = activateBonusTraySlot()
        .then((activationResult) => {
          setTrayBoostState(activationResult.state);
          setLivesNow(Date.now());
          return activationResult;
        })
        .finally(() => {
          if (bonusTraySlotActivationPromiseRef.current === activationPromise) {
            bonusTraySlotActivationPromiseRef.current = undefined;
          }
        });

      bonusTraySlotActivationPromiseRef.current = activationPromise;
      return activationPromise;
    };

  const handleOpenRestCheckpoint = async (
    afterLevelId: string,
  ): Promise<RestCheckpointRewardResult> => {
    const checkpointLevel = LEVELS.find((level) => level.id === afterLevelId);
    const worldId = checkpointLevel?.worldId ?? getCurrentWorldId(progress);

    if (
      isCollectingCheckpointRef.current ||
      !progress.completedLevelIds.includes(afterLevelId) ||
      progress.collectedRestCheckpointIds.includes(afterLevelId)
    ) {
      return {
        granted: false,
        worldId,
      };
    }

    isCollectingCheckpointRef.current = true;

    try {
      const currentLivesState = await refreshLivesState();
      // O `progress` fechado por esta invocação é anterior aos awaits acima; a
      // guarda que vale é a do snapshot mais recente, senão dois toques seguidos
      // premiam o mesmo ponto de descanso duas vezes.
      const latestProgress = progressRef.current;

      if (
        !checkRewardUnclaimed(
          latestProgress.collectedRestCheckpointIds.includes(afterLevelId),
        )
      ) {
        return {
          granted: false,
          worldId,
        };
      }

      if (currentLivesState.currentLives < currentLivesState.maxLives) {
        const nextLivesState = await addLife();

        setLivesState(nextLivesState);
        setLivesNow(Date.now());
        void commitProgress(
          collectRestCheckpoint(latestProgress, afterLevelId),
        ).catch(() => undefined);

        return {
          granted: true,
          rewardType: 'life',
          worldId,
        };
      }

      const coinsEarned = getRestCheckpointCoinReward(afterLevelId);

      void commitProgress(
        collectRestCheckpoint(latestProgress, afterLevelId, coinsEarned),
      ).catch(() => undefined);

      return {
        coinsEarned,
        granted: true,
        rewardType: 'coins',
        worldId,
      };
    } finally {
      isCollectingCheckpointRef.current = false;
    }
  };

  const handleSelectLevel = async (levelId: string) => {
    if (!devMode && !progress.unlockedLevelIds.includes(levelId)) {
      return;
    }

    if (!(await ensureCanStartLevel())) {
      return;
    }

    setSelectedLevelId(levelId);
    setScreen('game');
  };

  const handleOpenRoutine = (section: RoutineSection) => {
    setRoutineSection(section);
    setIsRoutineVisible(true);
    loadMissionState()
      .then(setMissions)
      .catch(() => undefined);
    loadDailyCheckInState()
      .then((state) => {
        checkInRef.current = state;
        setCheckIn(state);
      })
      .catch(() => undefined);
    loadDailyChallengeSave()
      .then(setChallenge)
      .catch(() => undefined);
  };

  const handleStartDailyChallenge = async () => {
    if (routineBusyRef.current || !(await ensureCanStartLevel())) return;
    const day = getLocalDateKey();
    if (challenge.maxObservedDateKey && day < challenge.maxObservedDateKey)
      return;
    setSelectedLevelId(`daily-${day}`);
    setIsRoutineVisible(false);
    setScreen('game');
  };

  const handleSelectChapterLevel = async (mapId: string) => {
    if (
      !devMode &&
      (!isChapterModeUnlocked(progressRef.current) ||
        !isChapterMapUnlocked(mapId, chapterProgressRef.current))
    ) {
      return;
    }

    if (!(await ensureCanStartLevel())) {
      return;
    }

    setSelectedLevelId(mapId);
    setScreen('game');
  };

  const openCampaign = (worldId?: WorldId) => {
    setCampaignInitialWorldId(worldId);
    setScreen('levels');
  };

  const openShop = (worldId?: WorldId) => {
    setShopReturnScreen(screen === 'game' ? 'game' : 'levels');
    setShopWorldId(worldId ?? getCurrentWorldId(progress));
    setScreen('shop');
  };

  const openSettings = () => {
    setIsSettingsVisible(true);
  };

  const handleBonusWorldAchievementSeen = (goToBonusWorld: boolean) => {
    const nextProgress = markBonusWorldAchievementShown(progress);
    const targetWorldId = goToBonusWorld ? 21 : getCurrentWorldId(nextProgress);

    void commitProgress(nextProgress).catch(() => undefined);
    openCampaign(targetWorldId);
  };

  const handleNextLevel = async () => {
    if (isDailyChallengeSelected) {
      setScreen('levels');
      return;
    }
    if (isChapterMapId(selectedLevelId)) {
      const nextMapId = getNextChapterMapId(selectedLevelId);

      if (
        nextMapId &&
        isChapterMapUnlocked(nextMapId, chapterProgressRef.current)
      ) {
        if (!(await ensureCanStartLevel())) {
          return;
        }

        setSelectedLevelId(nextMapId);
        setScreen('game');
        return;
      }

      setScreen('chapters');
      return;
    }

    const currentIndex = LEVELS.findIndex(
      (level) => level.id === selectedLevelId,
    );
    const currentLevel = LEVELS[currentIndex];
    const nextLevel = LEVELS[currentIndex + 1];

    if (
      currentLevel &&
      nextLevel &&
      progress.unlockedLevelIds.includes(nextLevel.id) &&
      (nextLevel.worldId !== 21 || currentLevel.worldId === 21)
    ) {
      if (!(await ensureCanStartLevel())) {
        return;
      }

      setSelectedLevelId(nextLevel.id);
      setScreen('game');
      return;
    }

    openCampaign(currentLevel?.worldId);
  };

  const handleLoseLife = useCallback(async () => {
    const nextLivesState = await consumeLife();
    setLivesState(nextLivesState);
    setLivesNow(Date.now());
    return nextLivesState;
  }, []);

  const handleRetryLevel = useCallback(async (): Promise<RetryLevelResult> => {
    const nextLivesState = await refreshLivesState();
    const nextTrayBoostState = await refreshTrayBoostState();
    const retryNow = Date.now();
    const bonusSlotActive = isAdTraySlotActive(nextTrayBoostState, retryNow);
    const coinSlotActive = isCoinTraySlotActive(nextTrayBoostState, retryNow);
    const trayCapacity = getActiveTrayCapacity(nextTrayBoostState, retryNow);

    if (!canPlayLevel(nextLivesState)) {
      showNoLivesModal(nextLivesState);
      return {
        bonusSlotActive,
        canRetry: false,
        coinSlotActive,
        trayCapacity,
      };
    }

    return {
      bonusSlotActive,
      canRetry: true,
      coinSlotActive,
      trayCapacity,
    };
  }, [refreshLivesState, refreshTrayBoostState]);

  if (screen === 'splash') {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <SplashIntroScreen onFinish={handleSplashFinish} />
      </SafeAreaProvider>
    );
  }

  if (isLoadingProgress) {
    return (
      <SafeAreaProvider>
        <SafeAreaView edges={['top', 'bottom']} style={styles.loadingContainer}>
          <StatusBar style="light" />
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Carregando progresso...</Text>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {screen === 'levels' ? (
        <MainTabs
          devMode={devMode}
          activeTrayCapacity={activeTrayCapacity}
          bonusTraySlotRemainingMs={bonusTraySlotRemainingMs}
          coinTraySlotRemainingMs={coinTraySlotRemainingMs}
          initialWorldId={campaignInitialWorldId}
          livesState={livesState}
          progress={progress}
          checkInReady={getDailyCheckInStatus(checkIn).eligible}
          missionReadyCount={
            [...missions.daily.missions, ...missions.weekly.missions].filter(
              (mission) =>
                !mission.claimed && mission.progress >= mission.target,
            ).length
          }
          challengeDone={Boolean(challenge.bestStars[getLocalDateKey()])}
          trayBoostState={trayBoostState}
          timeUntilNextLifeMs={timeUntilNextLifeMs}
          onCoinCounterLayout={setCoinCollectTarget}
          onOpenRestCheckpoint={handleOpenRestCheckpoint}
          onOpenSettings={openSettings}
          onOpenRoutine={handleOpenRoutine}
          onOpenShop={openShop}
          onOpenChapters={() => {
            if (devMode || isChapterModeUnlocked(progressRef.current))
              setScreen('chapters');
          }}
          onOpenWorldChest={showWorldChest}
          onPurchaseCoinTraySlot={handlePurchaseCoinTraySlot}
          onResetProgress={handleResetProgress}
          onSelectLevel={handleSelectLevel}
          onShowTutorial={() => setIsTutorialVisible(true)}
        />
      ) : null}
      {screen === 'chapters' ? (
        <ChaptersScreen
          devMode={devMode}
          chapterProgress={chapterProgress}
          onBack={() => setScreen('levels')}
          onSelectChapterLevel={handleSelectChapterLevel}
        />
      ) : null}
      {isGameMounted && selectedLevel ? (
        <GameScreen
          bestStars={
            isDailyChallengeSelected
              ? (challenge.bestStars[selectedLevel.id.slice(6)] ?? 0)
              : isChapterLevelSelected
                ? getChapterMapStars(chapterProgress, selectedLevel.id)
                : (progress.levelStars[selectedLevel.id] ?? 0)
          }
          level={selectedLevel}
          coins={progress.coins}
          itemCounts={progress.itemCounts}
          keys={progress.keys}
          isMysteryTutorialVisible={isMysteryTutorialVisible}
          isBlockingModalVisible={
            isTutorialVisible ||
            activeWorldChestId !== undefined ||
            isNoLivesModalVisible ||
            // A Loja cobre a fase sem desmontá-la: o cronômetro e o tabuleiro
            // ficam parados enquanto o jogador compra.
            screen === 'shop'
          }
          shouldRunPracticalTutorial={
            !isPracticalTutorialSeen && selectedLevel.id === 'w1-001'
          }
          magicTripleRescueState={magicTripleRescueState}
          livesState={livesState}
          activeTrayCapacity={activeTrayCapacity}
          bonusTraySlotRemainingMs={bonusTraySlotRemainingMs}
          isBonusTraySlotActive={isBonusTraySlotActiveNow}
          isCoinTraySlotActive={isCoinTraySlotActiveNow}
          isSettingsMenuVisible={isSettingsVisible}
          timeUntilNextLifeMs={timeUntilNextLifeMs}
          onActivateBonusTraySlot={handleActivateBonusTraySlot}
          onPurchaseCoinTraySlot={handlePurchaseCoinTraySlot}
          onPurchasePowerUp={handlePurchasePowerUp}
          onRestorePurchasedPowerUp={handleRestorePurchasedPowerUp}
          onBack={() =>
            isDailyChallengeSelected
              ? setScreen('levels')
              : isChapterLevelSelected
                ? setScreen('chapters')
                : openCampaign(selectedLevel.worldId)
          }
          onBonusWorldAchievementSeen={handleBonusWorldAchievementSeen}
          onCoinCounterLayout={setCoinCollectTarget}
          onLoseLife={handleLoseLife}
          onOpenSettings={openSettings}
          onOpenWorldChest={handleOpenWorldChest}
          onRetryLevel={handleRetryLevel}
          onUseItem={handleUseItem}
          onMagicTripleRescueSeen={handleMagicTripleRescueSeen}
          onMagicTripleRescueUsed={handleMagicTripleRescueUsed}
          onLevelComplete={handleLevelComplete}
          onNaturalTriple={(eventId) => {
            if (!isDailyChallengeSelected)
              void emitMissionEvent('triples', 1, eventId).catch(
                () => undefined,
              );
          }}
          onNextLevel={handleNextLevel}
          onOpenShop={() => openShop(selectedLevel.worldId)}
          onPracticalTutorialSeen={handleFinishPracticalTutorial}
        />
      ) : null}
      {screen === 'shop' ? (
        <View style={styles.shopOverlay}>
          <ShopScreen
            backTitle={
              shopReturnScreen === 'game' ? 'Voltar à fase' : 'Voltar ao mapa'
            }
            progress={progress}
            worldId={shopWorldId}
            onBack={() => setScreen(shopReturnScreen)}
            onBuyItem={handleBuyItem}
          />
        </View>
      ) : null}
      <WorldChestModal
        coins={progress.coins}
        isOpening={isOpeningWorldChest}
        keys={progress.keys}
        result={worldChestResult}
        visible={activeWorldChestId !== undefined}
        worldChestId={activeWorldChestId}
        coinCollectTarget={coinCollectTarget}
        onBuyAndOpen={() => {
          if (activeWorldChestId) {
            handleOpenWorldChest(activeWorldChestId, 'buy-key').catch(
              () => undefined,
            );
          }
        }}
        onClose={closeWorldChest}
        onOpenWithKey={() => {
          if (activeWorldChestId) {
            handleOpenWorldChest(activeWorldChestId, 'key').catch(
              () => undefined,
            );
          }
        }}
      />
      <SettingsModal
        devMode={devMode}
        settings={settings}
        visible={isSettingsVisible}
        onClose={() => setIsSettingsVisible(false)}
        onEnableSilentMode={handleEnableSilentMode}
        onResetProgress={handleResetProgress}
        onToggleHaptics={handleToggleHaptics}
        onToggleSound={handleToggleSound}
        onToggleMusic={handleToggleMusic}
        onUnlockAllForDevMode={handleUnlockAllForDevMode}
      />
      <RoutineModal
        visible={isRoutineVisible && screen === 'levels'}
        section={routineSection}
        checkIn={checkIn}
        missions={missions}
        challenge={challenge}
        busy={isRoutineBusy}
        onClose={() => setIsRoutineVisible(false)}
        onSection={setRoutineSection}
        onClaimCheckIn={() => {
          void handleClaimCheckIn();
        }}
        onClaimMission={(id) => {
          void handleClaimMission(id);
        }}
        onStartChallenge={() => {
          void handleStartDailyChallenge();
        }}
      />
      <NoLivesModal
        timeUntilNextLifeMs={timeUntilNextLifeMs}
        visible={isNoLivesModalVisible}
        onClose={() => setIsNoLivesModalVisible(false)}
      />
      <TutorialModal
        visible={isTutorialVisible}
        onFinish={handleFinishTutorial}
      />
      <MysteryTutorialModal
        visible={isMysteryTutorialVisible}
        onClose={handleFinishMysteryTutorial}
      />
      <CampaignResizeNoticeModal
        visible={isCampaignResizeNoticeVisible}
        onClose={handleCloseCampaignResizeNotice}
      />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.background,
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.inkOnDark,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  shopOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
});
