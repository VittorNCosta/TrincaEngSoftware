import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { CampaignResizeNoticeModal } from './src/components/CampaignResizeNoticeModal';
import { MysteryTutorialModal } from './src/components/MysteryTutorialModal';
import { NoLivesModal } from './src/components/NoLivesModal';
import { SettingsModal } from './src/components/SettingsModal';
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
  openWorldChest,
  purchasePowerUpTransaction,
  restorePurchasedPowerUpItem,
  saveCampaignResizeNoticeSeen,
  saveMysteryTutorialSeen,
  savePracticalTutorialSeen,
  saveProgress,
  saveTutorialSeen,
  spendCoins,
  unlockAllLevelsForDevMode,
} from './src/storage/progressStorage';
import {
  ChapterProgressState,
  applyChapterMapCompletion,
  createInitialChapterProgress,
  getChapterMapStars,
  getNextChapterMapId,
  isChapterMapUnlocked,
  loadChapterProgress,
  saveChapterProgress,
  unlockAllChapterMapsForDevMode,
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
  WorldChestOpenMode,
  WorldChestOpenResult,
  WorldId,
} from './src/types/game';
import { WindowTarget } from './src/types/ui';
import {
  AppSettings,
  createDefaultSettings,
  getSettings,
  setHapticsEnabledPreference,
} from './src/storage/settingsStorage';
import {
  BonusTraySlotActivationResult,
  COIN_TRAY_SLOT_COST,
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
import { POWER_UP_COSTS, getIncrementalCoinRewardForLevel } from './src/utils/gameLogic';
import { getRestCheckpointCoinReward } from './src/utils/shop';
import { setSoundEnabled } from './src/utils/sounds';
import { getCurrentWorldId } from './src/utils/worldProgress';

type AppScreen = 'splash' | 'levels' | 'game' | 'shop' | 'chapters';
type ShopReturnScreen = 'levels' | 'game';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('splash');
  const [progress, setProgress] = useState<ProgressState>(createInitialProgress());
  const [chapterProgress, setChapterProgress] = useState<ChapterProgressState>(
    createInitialChapterProgress(),
  );
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [campaignInitialWorldId, setCampaignInitialWorldId] = useState<WorldId | undefined>();
  const [selectedLevelId, setSelectedLevelId] = useState(LEVELS[0]?.id ?? '');
  const [shopReturnScreen, setShopReturnScreen] = useState<ShopReturnScreen>('levels');
  const [shopWorldId, setShopWorldId] = useState<WorldId>(1);
  const [livesState, setLivesState] = useState<LivesState>(createInitialLivesState());
  const [livesNow, setLivesNow] = useState(Date.now());
  const [trayBoostState, setTrayBoostState] = useState<TrayBoostState>(createInitialTrayBoostState());
  const [isNoLivesModalVisible, setIsNoLivesModalVisible] = useState(false);
  const [isTutorialVisible, setIsTutorialVisible] = useState(false);
  const [isMysteryTutorialSeen, setIsMysteryTutorialSeen] = useState(false);
  const [isPracticalTutorialSeen, setIsPracticalTutorialSeen] = useState(false);
  const [isCampaignResizeNoticeVisible, setIsCampaignResizeNoticeVisible] = useState(false);
  const [magicTripleRescueState, setMagicTripleRescueState] =
    useState<MagicTripleRescueState>(createInitialMagicTripleRescueState());
  const [settings, setSettings] = useState<AppSettings>(createDefaultSettings());
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [activeWorldChestId, setActiveWorldChestId] = useState<string | undefined>();
  const [worldChestResult, setWorldChestResult] = useState<WorldChestOpenResult | undefined>();
  const [isOpeningWorldChest, setIsOpeningWorldChest] = useState(false);
  const [coinCollectTarget, setCoinCollectTarget] = useState<WindowTarget | undefined>();
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
  const isOpeningWorldChestRef = useRef(false);
  const isCollectingCheckpointRef = useRef(false);
  const bonusTraySlotActivationPromiseRef =
    useRef<Promise<BonusTraySlotActivationResult> | undefined>(undefined);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

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
        ]) => {
          if (isMounted) {
            setProgress(storedProgress);
            setChapterProgress(storedChapterProgress);
            setLivesState(storedLives);
            setTrayBoostState(storedTrayBoost);
            setSettings(storedSettings);
            setLivesNow(Date.now());
            setIsTutorialVisible(!tutorialSeen);
            setIsPracticalTutorialSeen(practicalTutorialSeen);
            setIsMysteryTutorialSeen(mysteryTutorialSeen);
            setMagicTripleRescueState(storedMagicTripleRescueState);
            setIsCampaignResizeNoticeVisible(
              progressMigrationInfo.droppedLevelCount > 0 && !campaignResizeNoticeSeen,
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
  }, []);

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

  const commitProgress = useCallback((nextProgress: ProgressState) => {
    const generation = progressGenerationRef.current;
    progressRef.current = nextProgress;
    setProgress(nextProgress);
    const saveOperation = progressSaveQueueRef.current
      .catch(() => undefined)
      .then(() =>
        progressGenerationRef.current === generation ? saveProgress(nextProgress) : undefined,
      );
    progressSaveQueueRef.current = saveOperation.catch(() => undefined);
    return saveOperation;
  }, []);

  // Mesma fila de serialização do `commitProgress`, na chave dos capítulos: duas
  // conclusões seguidas não podem gravar fora de ordem.
  const commitChapterProgress = useCallback((nextProgress: ChapterProgressState) => {
    chapterProgressRef.current = nextProgress;
    setChapterProgress(nextProgress);
    const saveOperation = chapterProgressSaveQueueRef.current
      .catch(() => undefined)
      .then(() => saveChapterProgress(nextProgress));
    chapterProgressSaveQueueRef.current = saveOperation.catch(() => undefined);
    return saveOperation;
  }, []);

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

  const selectedLevel = useMemo(
    () =>
      buildChapterLevel(selectedLevelId) ??
      LEVELS.find((level) => level.id === selectedLevelId) ??
      LEVELS[0],
    [selectedLevelId],
  );
  const isChapterLevelSelected = isChapterMapId(selectedLevelId);
  const isMysteryTutorialVisible =
    screen === 'game' &&
    !isMysteryTutorialSeen &&
    Boolean(selectedLevel?.mysteryTileCount && selectedLevel.mysteryTileCount > 0);
  // A fase continua montada enquanto a Loja está aberta por cima dela: é o que
  // faz "Voltar à fase" devolver a partida em andamento, e não uma nova.
  const isGameMounted = screen === 'game' || (screen === 'shop' && shopReturnScreen === 'game');
  const timeUntilNextLifeMs = getTimeUntilNextLife(livesState, livesNow);
  const activeTrayCapacity = getActiveTrayCapacity(trayBoostState, livesNow);
  const isCoinTraySlotActiveNow = isCoinTraySlotActive(trayBoostState, livesNow);
  const isBonusTraySlotActiveNow = isAdTraySlotActive(trayBoostState, livesNow);
  const coinTraySlotRemainingMs = getCoinTraySlotRemaining(trayBoostState, livesNow);
  const bonusTraySlotRemainingMs = getBonusTraySlotRemaining(trayBoostState, livesNow);

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
  const handleChapterLevelComplete = async (mapId: string, starsEarned: number) => {
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
    if (isChapterMapId(levelId)) {
      return handleChapterLevelComplete(levelId, starsEarned);
    }

    const completionResult = applyLevelCompletion(progressRef.current, levelId, starsEarned);
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
      bonusWorldAchievementUnlocked: completionResult.bonusWorldAchievementUnlocked,
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
    async (powerType: PowerUpType, useImmediately: boolean): Promise<boolean> => {
      if (isPurchasingPowerUpRef.current || isProgressMutationInFlightRef.current) {
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
        await commitProgress(restorePurchasedPowerUpItem(previousProgress, powerType));
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
    void commitChapterProgress(createInitialChapterProgress()).catch(() => undefined);
    magicTripleRescueRef.current = freshMagicTripleRescueState;
    setMagicTripleRescueState(freshMagicTripleRescueState);
    setSelectedLevelId(LEVELS[0]?.id ?? '');
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
    void commitProgress(unlockAllLevelsForDevMode(progressRef.current)).catch(() => undefined);
    void commitChapterProgress(unlockAllChapterMapsForDevMode(chapterProgressRef.current)).catch(
      () => undefined,
    );
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

  const handlePurchaseCoinTraySlot = async (): Promise<TrayBoostPurchaseResult> => {
    if (isPurchasingTraySlotRef.current || isProgressMutationInFlightRef.current) {
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
      const purchaseResult = await purchaseCoinTraySlot(progressRef.current.coins);
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

  const handleActivateBonusTraySlot = (): Promise<BonusTraySlotActivationResult> => {
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

      if (latestProgress.collectedRestCheckpointIds.includes(afterLevelId)) {
        return {
          granted: false,
          worldId,
        };
      }

      if (currentLivesState.currentLives < currentLivesState.maxLives) {
        const nextLivesState = await addLife();

        setLivesState(nextLivesState);
        setLivesNow(Date.now());
        void commitProgress(collectRestCheckpoint(latestProgress, afterLevelId)).catch(
          () => undefined,
        );

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

  const showWorldChest = useCallback((worldChestId?: string) => {
    const targetWorldChestId = worldChestId ?? progressRef.current.pendingWorldChestIds[0];

    if (!targetWorldChestId) {
      return;
    }

    setWorldChestResult(undefined);
    setActiveWorldChestId(targetWorldChestId);
  }, []);

  const closeWorldChest = useCallback(() => {
    setActiveWorldChestId(undefined);
    setWorldChestResult(undefined);
  }, []);

  const handleOpenWorldChest = useCallback(
    async (worldChestId: string, mode: WorldChestOpenMode): Promise<WorldChestOpenResult> => {
      if (isOpeningWorldChestRef.current) {
        return (
          worldChestResult ?? {
            keyPurchased: false,
            progress: progressRef.current,
            status: 'unavailable',
            worldChestId,
          }
        );
      }

      isOpeningWorldChestRef.current = true;
      setIsOpeningWorldChest(true);

      try {
        const currentLivesState = await getLivesState();
        setLivesState(currentLivesState);
        setLivesNow(Date.now());

        const openResult = openWorldChest(
          progressRef.current,
          worldChestId,
          mode,
          currentLivesState.currentLives >= currentLivesState.maxLives,
        );

        if (openResult.status !== 'opened') {
          setWorldChestResult(openResult);
          return openResult;
        }

        await commitProgress(openResult.progress);

        if (openResult.reward?.lifeGranted) {
          try {
            const nextLivesState = await addLife();
            setLivesState(nextLivesState);
            setLivesNow(Date.now());
          } catch {
            // Progress is already saved here; do not reopen the chest and risk a duplicate reward.
          }
        }

        setWorldChestResult(openResult);
        return openResult;
      } catch {
        const failedResult: WorldChestOpenResult = {
          keyPurchased: false,
          progress: progressRef.current,
          status: 'unavailable',
          worldChestId,
        };
        setWorldChestResult(failedResult);
        return failedResult;
      } finally {
        isOpeningWorldChestRef.current = false;
        setIsOpeningWorldChest(false);
      }
    },
    [commitProgress, worldChestResult],
  );

  const handleSelectLevel = async (levelId: string) => {
    if (!progress.unlockedLevelIds.includes(levelId)) {
      return;
    }

    if (!(await ensureCanStartLevel())) {
      return;
    }

    setSelectedLevelId(levelId);
    setScreen('game');
  };

  const handleSelectChapterLevel = async (mapId: string) => {
    if (!isChapterMapUnlocked(mapId, chapterProgressRef.current)) {
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

  const handleToggleSound = () => {
    const nextSoundEnabled = !settings.soundEnabled;

    setSettings((currentSettings) => ({
      ...currentSettings,
      soundEnabled: nextSoundEnabled,
    }));

    setSoundEnabled(nextSoundEnabled).catch(() => {
      getSettings().then(setSettings).catch(() => undefined);
    });
  };

  const handleToggleHaptics = () => {
    const nextHapticsEnabled = !settings.hapticsEnabled;

    setSettings((currentSettings) => ({
      ...currentSettings,
      hapticsEnabled: nextHapticsEnabled,
    }));

    setHapticsEnabledPreference(nextHapticsEnabled).catch(() => {
      getSettings().then(setSettings).catch(() => undefined);
    });
  };

  const handleEnableSilentMode = () => {
    setSettings((currentSettings) => ({
      ...currentSettings,
      hapticsEnabled: false,
      soundEnabled: false,
    }));

    Promise.all([setSoundEnabled(false), setHapticsEnabledPreference(false)]).catch(() => {
      getSettings().then(setSettings).catch(() => undefined);
    });
  };

  const handleBonusWorldAchievementSeen = (goToBonusWorld: boolean) => {
    const nextProgress = markBonusWorldAchievementShown(progress);
    const targetWorldId = goToBonusWorld ? 21 : getCurrentWorldId(nextProgress);

    void commitProgress(nextProgress).catch(() => undefined);
    openCampaign(targetWorldId);
  };

  const handleNextLevel = async () => {
    if (isChapterMapId(selectedLevelId)) {
      const nextMapId = getNextChapterMapId(selectedLevelId);

      if (nextMapId && isChapterMapUnlocked(nextMapId, chapterProgressRef.current)) {
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

    const currentIndex = LEVELS.findIndex((level) => level.id === selectedLevelId);
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
          activeTrayCapacity={activeTrayCapacity}
          bonusTraySlotRemainingMs={bonusTraySlotRemainingMs}
          coinTraySlotRemainingMs={coinTraySlotRemainingMs}
          initialWorldId={campaignInitialWorldId}
          livesState={livesState}
          progress={progress}
          trayBoostState={trayBoostState}
          timeUntilNextLifeMs={timeUntilNextLifeMs}
          onCoinCounterLayout={setCoinCollectTarget}
          onOpenRestCheckpoint={handleOpenRestCheckpoint}
          onOpenSettings={openSettings}
          onOpenShop={openShop}
          onOpenChapters={() => setScreen('chapters')}
          onOpenWorldChest={showWorldChest}
          onPurchaseCoinTraySlot={handlePurchaseCoinTraySlot}
          onResetProgress={handleResetProgress}
          onSelectLevel={handleSelectLevel}
          onShowTutorial={() => setIsTutorialVisible(true)}
        />
      ) : null}
      {screen === 'chapters' ? (
        <ChaptersScreen
          chapterProgress={chapterProgress}
          onBack={() => setScreen('levels')}
          onSelectChapterLevel={handleSelectChapterLevel}
        />
      ) : null}
      {isGameMounted && selectedLevel ? (
        <GameScreen
          bestStars={
            isChapterLevelSelected
              ? getChapterMapStars(chapterProgress, selectedLevel.id)
              : progress.levelStars[selectedLevel.id] ?? 0
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
          shouldRunPracticalTutorial={!isPracticalTutorialSeen && selectedLevel.id === 'w1-001'}
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
            isChapterLevelSelected ? setScreen('chapters') : openCampaign(selectedLevel.worldId)
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
          onNextLevel={handleNextLevel}
          onOpenShop={() => openShop(selectedLevel.worldId)}
          onPracticalTutorialSeen={handleFinishPracticalTutorial}
        />
      ) : null}
      {screen === 'shop' ? (
        <View style={styles.shopOverlay}>
          <ShopScreen
            backTitle={shopReturnScreen === 'game' ? 'Voltar à fase' : 'Voltar ao mapa'}
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
            handleOpenWorldChest(activeWorldChestId, 'buy-key').catch(() => undefined);
          }
        }}
        onClose={closeWorldChest}
        onOpenWithKey={() => {
          if (activeWorldChestId) {
            handleOpenWorldChest(activeWorldChestId, 'key').catch(() => undefined);
          }
        }}
      />
      <SettingsModal
        settings={settings}
        visible={isSettingsVisible}
        onClose={() => setIsSettingsVisible(false)}
        onEnableSilentMode={handleEnableSilentMode}
        onResetProgress={handleResetProgress}
        onToggleHaptics={handleToggleHaptics}
        onToggleSound={handleToggleSound}
        onUnlockAllForDevMode={handleUnlockAllForDevMode}
      />
      <NoLivesModal
        timeUntilNextLifeMs={timeUntilNextLifeMs}
        visible={isNoLivesModalVisible}
        onClose={() => setIsNoLivesModalVisible(false)}
      />
      <TutorialModal visible={isTutorialVisible} onFinish={handleFinishTutorial} />
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
