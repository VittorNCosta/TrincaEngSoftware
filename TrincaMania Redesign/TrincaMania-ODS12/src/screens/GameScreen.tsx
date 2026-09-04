import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  ImageBackground,
  ImageSourcePropType,
  LayoutChangeEvent,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BonusWorldAchievementModal } from '../components/BonusWorldAchievementModal';
import {
  FlyingTileOverlay,
  type FlyingTileEvent,
} from '../components/FlyingTileOverlay';
import { GameBoard } from '../components/GameBoard';
import { GameIcon } from '../components/GameIcon';
import { PhasePlate } from '../components/PhasePlate';
import { PowerDrawer } from '../components/PowerDrawer';
import { PowerIcon } from '../components/PowerIcon';
import { PrimaryButton } from '../components/PrimaryButton';
import { ResourcePill } from '../components/ResourcePill';
import { ResultModal } from '../components/ResultModal';
import { ScreenShell } from '../components/ScreenShell';
import { Tray } from '../components/Tray';
import {
  TripleConsumeEffect,
  type TripleConsumeEvent,
  type TripleConsumeTile,
} from '../components/TripleConsumeEffect';
import {
  buildChapterLevel,
  getChapter,
  getChapterLevelSummary,
} from '../data/chapters';
import { POWER_UP_UI } from '../data/powerUps';
import { getWorldById } from '../data/worlds';
import { LivesState, formatLifeTimer } from '../storage/livesStorage';
import {
  MAGIC_TRIPLE_RESCUE_MAX_PROMPTS,
  MagicTripleRescueState,
} from '../storage/magicTripleRescueStorage';
import {
  BASE_TRAY_CAPACITY,
  MAX_TRAY_CAPACITY,
  BonusTraySlotActivationResult,
  RetryLevelResult,
  TrayBoostPurchaseResult,
  formatTrayBoostRemaining,
  isAdTraySlotActive as isAdTrayBoostActive,
  isCoinTraySlotActive as isCoinTrayBoostActive,
} from '../storage/trayBoostStorage';
import { colors, fontSizes, radii, shadows, spacing } from '../styles/theme';
import {
  ChestProgressSummary,
  ChestRewardSummary,
  GameStatus,
  GeneratedLevelOptions,
  Level,
  MoveHistoryItem,
  MoveResult,
  PowerUpInventory,
  PowerUpType,
  Tile,
  TileKind,
  WorldChestOpenMode,
  WorldChestOpenResult,
  WorldChestSummary,
  WorldId,
} from '../types/game';
import { WindowTarget } from '../types/ui';
import {
  fitBoardToViewport,
  getBoardBounds,
  getRenderedTileFrame,
  hasMeaningfulViewportChange,
  type BoardViewport,
} from '../utils/boardLayout';
import {
  POWER_UP_COSTS,
  countRemainingTiles,
  createVictoryResultSnapshot,
  findMagicTripleMove,
  formatQuantity,
  formatSeconds,
  getAvailableTiles,
  getUndoableMove,
  insertTileGroupedInTray,
  isMysteryTileHidden,
  isTileBlocked,
  isTileRemoved,
  playMagicTriple,
  playTile,
  revealAvailableMysteryTiles,
  shuffleRemainingTiles,
  undoLastMove,
  type VictoryResultSnapshot,
} from '../utils/gameLogic';
import {
  lightImpact,
  mediumImpact,
  successImpact,
  warningImpact,
} from '../utils/haptics';
import { generatePlayableLevel } from '../utils/levelGenerator';
import {
  duckAmbient,
  playAmbientForWorld,
  playCoinSound,
  playConfettiSound,
  playLoseSound,
  playShopBuySound,
  playTapSound,
  playTripleSounds,
  playWhooshSound,
  playWinSound,
  playWorldUnlockSound,
  stopAmbientSound,
  unduckAmbient,
} from '../utils/sounds';
import { getLevelDisplayLabel } from '../utils/levelDisplay';
import {
  getRoundTrayCapacity,
  mergeRoundTraySlotSnapshots,
  type RoundTraySlotSnapshot,
} from '../utils/roundTraySnapshot';
import {
  activateNextTileMove,
  beginNextTileMoveGeneration,
  canQueueTilePress,
  cancelQueuedTileMoves,
  createTileMoveQueue,
  enqueueTileMove,
  hasPendingTileId,
  markActiveTileMoveConsuming,
  settleActiveTileFlight,
  settleActiveTileMove,
} from '../utils/tileMoveQueue';

const TOAST_VISIBLE_MS = 1700;
const BONUS_FEEDBACK_VISIBLE_MS = 1050;
const TILE_INSERT_POP_MS = 110;

const gameWorld1Bg =
  require('../../assets/map/map_world1_bg.png') as ImageSourcePropType;
const gameWorld1SceneBg =
  require('../../assets/map/map_world1_scene_bg.png') as ImageSourcePropType;
const gameWorld2Bg =
  require('../../assets/map/map_world2_bg.png') as ImageSourcePropType;
const gameWorld3Bg =
  require('../../assets/map/map_world3_game_bg.png') as ImageSourcePropType;
const gameBonusBg =
  require('../../assets/map/map_bonus_bg.png') as ImageSourcePropType;

type LevelCompletionSummary = {
  bonusWorldAchievementUnlocked: boolean;
  chestProgress: ChestProgressSummary;
  chestReward?: ChestRewardSummary;
  coinsEarned: number;
  savedStars: number;
  starsEarned: number;
  worldChest?: WorldChestSummary;
  unlockedLevelTitle?: string;
  unlockedWorldId?: WorldId;
};

type ToastState = {
  id: number;
  text: string;
};

type PowerEffectResult = 'applied' | 'cancelled' | 'failed';

type PracticalTutorialStep =
  | 'done'
  | 'intro'
  | 'tap-first'
  | 'tray'
  | 'tap-second'
  | 'tap-third'
  | 'triple'
  | 'warning';

type PracticalTutorialPopupStep = Extract<
  PracticalTutorialStep,
  'intro' | 'tray' | 'triple' | 'warning'
>;

type PendingTileMove = {
  arrivalTray: Tile[];
  event: FlyingTileEvent;
  historyItem: MoveHistoryItem;
  result: MoveResult;
  terminalElapsedSeconds?: number;
  tutorialStep?: PracticalTutorialStep;
};

const PRACTICAL_TUTORIAL_LEVEL_ID = 'w1-001';
const PRACTICAL_TUTORIAL_POPUPS: Record<
  PracticalTutorialPopupStep,
  { button: string; text: string; title: string }
> = {
  intro: {
    button: 'Começar',
    text: 'Toque em uma peça livre para enviá-la para a bandeja.',
    title: 'Forme trincas',
  },
  tray: {
    button: 'Entendi',
    text: 'As peças escolhidas ficam aqui. Junte 3 iguais para formar uma trinca.',
    title: 'Bandeja',
  },
  triple: {
    button: 'Continuar',
    text: 'Quando 3 peças iguais entram na bandeja, elas somem e liberam espaço.',
    title: 'Muito bem!',
  },
  warning: {
    button: 'Jogar',
    text: 'Se todos os espaços ativos encherem antes de formar uma trinca, você perde.',
    title: 'Cuidado com a bandeja',
  },
};

const isPracticalTutorialPopupStep = (
  step: PracticalTutorialStep,
): step is PracticalTutorialPopupStep =>
  step === 'intro' ||
  step === 'tray' ||
  step === 'triple' ||
  step === 'warning';

const isPracticalTutorialTapStep = (step: PracticalTutorialStep) =>
  step === 'tap-first' || step === 'tap-second' || step === 'tap-third';

const sortTilesForTutorial = (tiles: Tile[]) =>
  [...tiles].sort((firstTile, secondTile) => {
    if (firstTile.z !== secondTile.z) {
      return firstTile.z - secondTile.z;
    }

    if (firstTile.y !== secondTile.y) {
      return firstTile.y - secondTile.y;
    }

    return firstTile.x - secondTile.x;
  });

const getTutorialAvailableTiles = (board: Tile[], preferredKind?: TileKind) => {
  const availableTiles = sortTilesForTutorial(
    getAvailableTiles(board).filter((tile) => !isMysteryTileHidden(tile)),
  );

  return preferredKind
    ? availableTiles.filter((tile) => tile.kind === preferredKind)
    : availableTiles;
};

const findOpeningTutorialTile = (board: Tile[]) => {
  const availableTiles = getTutorialAvailableTiles(board);
  const countsByKind = availableTiles.reduce<Map<TileKind, Tile[]>>(
    (counts, tile) => {
      counts.set(tile.kind, [...(counts.get(tile.kind) ?? []), tile]);
      return counts;
    },
    new Map<TileKind, Tile[]>(),
  );

  return (
    Array.from(countsByKind.values()).find((tiles) => tiles.length >= 3)?.[0] ??
    availableTiles[0]
  );
};

type GameScreenProps = {
  activeTrayCapacity: number;
  bestStars: number;
  bonusTraySlotRemainingMs: number;
  coins: number;
  isMysteryTutorialVisible: boolean;
  isBonusTraySlotActive: boolean;
  isCoinTraySlotActive: boolean;
  isBlockingModalVisible: boolean;
  isSettingsMenuVisible: boolean;
  itemCounts: PowerUpInventory;
  keys: number;
  level: Level;
  livesState: LivesState;
  magicTripleRescueState: MagicTripleRescueState;
  shouldRunPracticalTutorial: boolean;
  timeUntilNextLifeMs: number;
  onActivateBonusTraySlot: () => Promise<BonusTraySlotActivationResult>;
  onBack: () => void;
  onBonusWorldAchievementSeen: (goToBonusWorld: boolean) => void;
  onCoinCounterLayout?: (target: WindowTarget) => void;
  onLevelComplete: (
    levelId: string,
    starsEarned: number,
  ) => Promise<LevelCompletionSummary>;
  onLoseLife: () => Promise<LivesState>;
  onMagicTripleRescueSeen: () => Promise<void>;
  onMagicTripleRescueUsed: () => Promise<void>;
  onNextLevel: () => void;
  onOpenSettings: () => void;
  onOpenShop: () => void;
  onOpenWorldChest: (
    worldChestId: string,
    mode: WorldChestOpenMode,
  ) => Promise<WorldChestOpenResult>;
  onPurchaseCoinTraySlot: () => Promise<TrayBoostPurchaseResult>;
  onPracticalTutorialSeen: () => void;
  onRestorePurchasedPowerUp: (powerType: PowerUpType) => Promise<boolean>;
  onRetryLevel: () => Promise<RetryLevelResult>;
  onPurchasePowerUp: (
    powerType: PowerUpType,
    useImmediately: boolean,
  ) => Promise<boolean>;
  onUseItem: (powerType: PowerUpType) => boolean;
};

// Mapa de capítulo não mora em `LEVELS`, e `generatePlayableLevel` cai em
// `LEVELS[0]` quando não acha o id — sem este desvio a fase de capítulo abriria
// com o tabuleiro de w1-001.
// Sem `options`, o mapa de capítulo nasce da semente estável do id: o jogador
// reencontra o tabuleiro que largou pela metade. O "tentar novamente" precisa
// passar um `random` próprio, senão devolve o layout idêntico enquanto a UI
// anuncia "Nova variação pronta." — a campanha re-sorteia e ele não.
const createBoardVariation = (
  levelId: string,
  options: GeneratedLevelOptions = {},
) => {
  const chapterLevel = buildChapterLevel(levelId, options);

  return revealAvailableMysteryTiles(
    (chapterLevel ?? generatePlayableLevel(levelId, options)).tiles,
  );
};

const getGameBackground = (worldId: WorldId) => {
  switch (worldId) {
    case 2:
    case 5:
    case 7:
    case 9:
      return gameWorld2Bg;
    case 3:
    case 6:
    case 8:
    case 10:
      return gameWorld3Bg;
    case 4:
      return gameWorld1Bg;
    case 21:
      return gameBonusBg;
    case 1:
      return gameWorld1SceneBg;
    default:
      return gameWorld1Bg;
  }
};

export function GameScreen({
  activeTrayCapacity: currentTrayCapacity,
  bestStars,
  bonusTraySlotRemainingMs,
  coins,
  isMysteryTutorialVisible,
  isBonusTraySlotActive,
  isCoinTraySlotActive,
  isBlockingModalVisible,
  isSettingsMenuVisible,
  itemCounts,
  keys,
  level,
  livesState,
  magicTripleRescueState,
  shouldRunPracticalTutorial,
  timeUntilNextLifeMs,
  onActivateBonusTraySlot,
  onBack,
  onBonusWorldAchievementSeen,
  onCoinCounterLayout,
  onLevelComplete,
  onLoseLife,
  onMagicTripleRescueSeen,
  onMagicTripleRescueUsed,
  onNextLevel,
  onOpenSettings,
  onOpenShop,
  onOpenWorldChest,
  onPurchaseCoinTraySlot,
  onPracticalTutorialSeen,
  onRestorePurchasedPowerUp,
  onRetryLevel,
  onPurchasePowerUp,
  onUseItem,
}: GameScreenProps) {
  const { height, width } = useWindowDimensions();
  const world = getWorldById(level.worldId);
  // `getWorldById` cai em WORLDS[0] para um mundo de capítulo (faixa 101–110),
  // então sem isto a placa da fase anunciaria "Parque" dentro de um capítulo.
  const chapterSummary = getChapterLevelSummary(level.id);
  const chapter = chapterSummary
    ? getChapter(chapterSummary.chapterId)
    : undefined;
  const levelDisplayLabel = getLevelDisplayLabel(level);
  const [activeTrayCapacity, setActiveTrayCapacity] =
    useState(currentTrayCapacity);
  const [roundBonusTraySlotActive, setRoundBonusTraySlotActive] = useState(
    isBonusTraySlotActive,
  );
  const [roundCoinTraySlotActive, setRoundCoinTraySlotActive] =
    useState(isCoinTraySlotActive);
  const [board, setBoard] = useState<Tile[]>(() =>
    createBoardVariation(level.id),
  );
  const [boardBounds, setBoardBounds] = useState(() => getBoardBounds(board));
  const [boardViewport, setBoardViewport] = useState<BoardViewport>({
    height: 0,
    width: 0,
  });
  const [boardLayoutGeneration, setBoardLayoutGeneration] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [highlightedTileId, setHighlightedTileId] = useState<
    string | undefined
  >();
  const [isBonusSlotConfirmVisible, setIsBonusSlotConfirmVisible] =
    useState(false);
  const [isBonusSlotRequestPending, setIsBonusSlotRequestPending] =
    useState(false);
  const [isBonusSlotProcessing, setIsBonusSlotProcessing] = useState(false);
  const [isCoinSlotProcessing, setIsCoinSlotProcessing] = useState(false);
  const [bonusSlotFeedback, setBonusSlotFeedback] = useState<
    string | undefined
  >();
  const [isMagicTripleRescueVisible, setIsMagicTripleRescueVisible] =
    useState(false);
  const [
    magicTripleRescueDismissedThisRisk,
    setMagicTripleRescueDismissedThisRisk,
  ] = useState(false);
  const [isMovePipelineActive, setIsMovePipelineActive] = useState(false);
  const [moveHistory, setMoveHistory] = useState<MoveHistoryItem[]>([]);
  const [pendingPowerPurchase, setPendingPowerPurchase] = useState<
    PowerUpType | undefined
  >();
  const [pendingPowerPurchaseRequest, setPendingPowerPurchaseRequest] =
    useState<PowerUpType | undefined>();
  const [isPowerPurchaseProcessing, setIsPowerPurchaseProcessing] =
    useState(false);
  const [practicalTutorialStep, setPracticalTutorialStep] =
    useState<PracticalTutorialStep>('done');
  const [practicalTutorialTargetId, setPracticalTutorialTargetId] = useState<
    string | undefined
  >();
  const [practicalTutorialTileKind, setPracticalTutorialTileKind] = useState<
    TileKind | undefined
  >();
  const [resultChestProgress, setResultChestProgress] = useState<
    ChestProgressSummary | undefined
  >();
  const [resultChestReward, setResultChestReward] = useState<
    ChestRewardSummary | undefined
  >();
  const [resultCoins, setResultCoins] = useState(0);
  const [resultElapsedSeconds, setResultElapsedSeconds] = useState(0);
  const [victoryResult, setVictoryResult] = useState<
    VictoryResultSnapshot | undefined
  >();
  const [resultWorldChest, setResultWorldChest] = useState<
    WorldChestSummary | undefined
  >();
  const [coinCollectTarget, setCoinCollectTarget] = useState<
    WindowTarget | undefined
  >();
  const [gameAreaTarget, setGameAreaTarget] = useState<
    WindowTarget | undefined
  >();
  const [flyingTileEvent, setFlyingTileEvent] = useState<
    FlyingTileEvent | undefined
  >();
  const [hiddenTrayTileIds, setHiddenTrayTileIds] = useState<string[]>([]);
  const [poppingTrayTileId, setPoppingTrayTileId] = useState<
    string | undefined
  >();
  const [trayTarget, setTrayTarget] = useState<WindowTarget | undefined>();
  const [tripleConsumeEvent, setTripleConsumeEvent] = useState<
    TripleConsumeEvent | undefined
  >();
  const [showBonusAchievement, setShowBonusAchievement] = useState(false);
  const [status, setStatus] = useState<GameStatus>('playing');
  const [toast, setToast] = useState<ToastState | undefined>();
  const [tray, setTray] = useState<Tile[]>([]);
  const [unlockedLevelTitle, setUnlockedLevelTitle] = useState<
    string | undefined
  >();
  const lifeConsumedForRoundRef = useRef(false);
  const activeTrayCapacityRef = useRef(currentTrayCapacity);
  const roundBonusTraySlotActiveRef = useRef(isBonusTraySlotActive);
  const roundCoinTraySlotActiveRef = useRef(isCoinTraySlotActive);
  const boardRef = useRef(board);
  const trayRef = useRef(tray);
  const elapsedSecondsRef = useRef(0);
  const boardTileTargetsRef = useRef<Record<string, WindowTarget>>({});
  const traySlotTargetsRef = useRef<Record<number, WindowTarget>>({});
  const gameAreaRef = useRef<View>(null);
  const boardStageRef = useRef<View>(null);
  const boardStageTargetRef = useRef<WindowTarget | undefined>(undefined);
  const trayDockRef = useRef<View>(null);
  const poppingTrayTimeoutRef = useRef<
    ReturnType<typeof setTimeout> | undefined
  >(undefined);
  const completionSoundTimeoutRef = useRef<
    ReturnType<typeof setTimeout> | undefined
  >(undefined);
  const isMountedRef = useRef(true);
  const shouldRunPracticalTutorialRef = useRef(shouldRunPracticalTutorial);
  const isBonusSlotProcessingRef = useRef(false);
  const isCoinSlotProcessingRef = useRef(false);
  const isPowerActionProcessingRef = useRef(false);
  const isPowerPurchaseProcessingRef = useRef(false);
  const roundGenerationRef = useRef(0);
  const victoryHandledGenerationRef = useRef<number | undefined>(undefined);
  const isVisualMoveResolvingRef = useRef(false);
  // Toques que chegam durante um voo entram numa fila FIFO. O Set separado
  // impede repetir a mesma peça antes de a animação anterior terminar.
  const activeTileMoveRef = useRef<PendingTileMove | undefined>(undefined);
  const tileMoveQueueRef = useRef(createTileMoveQueue());
  const startNextQueuedMoveRef = useRef<() => void>(() => undefined);
  const activeTripleConsumeIdRef = useRef<string | undefined>(undefined);
  const tripleSequenceRef = useRef(0);
  const tripleCompleteCallbackRef = useRef<
    ((cancelled?: boolean) => void) | undefined
  >(undefined);
  const handleTilePressRef = useRef<(tileId: string) => void>(() => undefined);
  const handleBlockedTilePressRef = useRef<() => void>(() => undefined);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastLift = useRef(new Animated.Value(8)).current;
  const bonusFeedbackOpacity = useRef(new Animated.Value(0)).current;
  const bonusFeedbackLift = useRef(new Animated.Value(6)).current;
  const reportCoinCounterTarget = useCallback(
    (target: WindowTarget) => {
      setCoinCollectTarget(target);
      onCoinCounterLayout?.(target);
    },
    [onCoinCounterLayout],
  );
  const reportGameAreaTarget = useCallback(() => {
    requestAnimationFrame(() => {
      gameAreaRef.current?.measureInWindow((x, y, width, height) => {
        setGameAreaTarget({ height, width, x, y });
      });
    });
  }, []);
  // Uma medição só, da bandeja inteira. É o que garante que o estouro da trinca
  // aconteça sempre sobre a bandeja, mesmo que nenhum encaixe tenha se medido.
  const reportTrayTarget = useCallback(() => {
    requestAnimationFrame(() => {
      trayDockRef.current?.measureInWindow((x, y, width, height) => {
        if (width <= 0 || height <= 0) {
          return;
        }

        setTrayTarget((currentTarget) =>
          currentTarget &&
          currentTarget.x === x &&
          currentTarget.y === y &&
          currentTarget.width === width &&
          currentTarget.height === height
            ? currentTarget
            : { height, width, x, y },
        );
      });
    });
  }, []);

  const reportBoardTileTarget = useCallback(
    (tileId: string, target: WindowTarget) => {
      boardTileTargetsRef.current[tileId] = target;
    },
    [],
  );
  const reportTraySlotTarget = useCallback(
    (tileIndex: number, target: WindowTarget) => {
      traySlotTargetsRef.current[tileIndex] = target;
    },
    [],
  );
  const reportBoardStageTarget = useCallback(() => {
    requestAnimationFrame(() => {
      boardStageRef.current?.measureInWindow(
        (x, y, measuredWidth, measuredHeight) => {
          if (measuredWidth <= 0 || measuredHeight <= 0) {
            return;
          }

          boardStageTargetRef.current = {
            height: measuredHeight,
            width: measuredWidth,
            x,
            y,
          };
        },
      );
    });
  }, []);
  const handleBoardAreaLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { height: measuredHeight, width: measuredWidth } =
        event.nativeEvent.layout;
      const nextViewport = {
        height: Math.max(0, measuredHeight),
        width: Math.max(0, measuredWidth),
      };

      setBoardViewport((currentViewport) =>
        hasMeaningfulViewportChange(currentViewport, nextViewport)
          ? nextViewport
          : currentViewport,
      );
      reportBoardStageTarget();
    },
    [reportBoardStageTarget],
  );

  const expandRoundTrayCapacity = (nextCapacity: number) => {
    const expandedCapacity = Math.max(
      activeTrayCapacityRef.current,
      nextCapacity,
    );

    activeTrayCapacityRef.current = expandedCapacity;
    setActiveTrayCapacity((currentCapacity) =>
      Math.max(currentCapacity, expandedCapacity),
    );

    // Uma compra pode terminar enquanto a última peça ainda está voando. Se o
    // espaço novo salvou a jogada, o resultado pendente não pode conservar a
    // derrota calculada com a capacidade anterior.
    const activeMove = activeTileMoveRef.current;
    if (
      activeMove?.result.status === 'lost' &&
      activeMove.result.tray.length < expandedCapacity
    ) {
      activeMove.result = { ...activeMove.result, status: 'playing' };
    }
  };

  const expandRoundTrayBoosts = (state: TrayBoostPurchaseResult['state']) => {
    const now = Date.now();
    const nextSnapshot = mergeRoundTraySlotSnapshots(
      {
        bonusSlotActive: roundBonusTraySlotActiveRef.current,
        coinSlotActive: roundCoinTraySlotActiveRef.current,
      },
      {
        bonusSlotActive: isAdTrayBoostActive(state, now),
        coinSlotActive: isCoinTrayBoostActive(state, now),
      },
    );

    roundCoinTraySlotActiveRef.current = nextSnapshot.coinSlotActive;
    roundBonusTraySlotActiveRef.current = nextSnapshot.bonusSlotActive;
    setRoundCoinTraySlotActive(nextSnapshot.coinSlotActive);
    setRoundBonusTraySlotActive(nextSnapshot.bonusSlotActive);
    expandRoundTrayCapacity(
      getRoundTrayCapacity(nextSnapshot, BASE_TRAY_CAPACITY, MAX_TRAY_CAPACITY),
    );
  };

  const boardFrame = useMemo(
    () => fitBoardToViewport(boardBounds, boardViewport),
    [boardBounds, boardViewport],
  );
  const boardScale = boardFrame.scale;
  const timerProgress = Math.min(
    100,
    (elapsedSeconds / level.starTimeLimits.twoStars) * 100,
  );
  const threeStarMarker = Math.min(
    100,
    (level.starTimeLimits.threeStars / level.starTimeLimits.twoStars) * 100,
  );
  const remainingTiles = useMemo(() => countRemainingTiles(board), [board]);
  useEffect(() => {
    boardTileTargetsRef.current = {};
    boardStageTargetRef.current = undefined;
    reportBoardStageTarget();
  }, [
    boardBounds.left,
    boardBounds.top,
    boardLayoutGeneration,
    boardFrame.height,
    boardFrame.width,
    reportBoardStageTarget,
  ]);
  useEffect(() => {
    reportTrayTarget();
  }, [activeTrayCapacity, reportTrayTarget]);

  const gameBackground = useMemo(
    () => getGameBackground(level.worldId),
    [level.worldId],
  );
  const trayNearlyFull =
    status === 'playing' && tray.length >= activeTrayCapacity - 1;
  const magicTripleRescueMove = useMemo(
    () => findMagicTripleMove({ activeTrayCapacity, board, tray }),
    [activeTrayCapacity, board, tray],
  );
  const lastUndoMove = useMemo(
    () => getUndoableMove(moveHistory),
    [moveHistory],
  );
  const gameplayModalOpen =
    isMagicTripleRescueVisible ||
    isBonusSlotConfirmVisible ||
    pendingPowerPurchase !== undefined;
  const gameplayInteractionPending =
    isBonusSlotRequestPending ||
    isCoinSlotProcessing ||
    pendingPowerPurchaseRequest !== undefined;
  const practicalTutorialEligible =
    shouldRunPracticalTutorial && level.id === PRACTICAL_TUTORIAL_LEVEL_ID;
  const practicalTutorialActive =
    practicalTutorialEligible && practicalTutorialStep !== 'done';
  const practicalTutorialPopupStep = isPracticalTutorialPopupStep(
    practicalTutorialStep,
  )
    ? practicalTutorialStep
    : undefined;
  const practicalTutorialWaitingForTile = isPracticalTutorialTapStep(
    practicalTutorialStep,
  );
  const practicalTutorialTargetTile = useMemo(() => {
    if (!practicalTutorialWaitingForTile) {
      return undefined;
    }

    const preferredTiles = getTutorialAvailableTiles(
      board,
      practicalTutorialTileKind,
    );
    const currentTarget = preferredTiles.find(
      (tile) => tile.id === practicalTutorialTargetId,
    );

    return (
      currentTarget ?? preferredTiles[0] ?? getTutorialAvailableTiles(board)[0]
    );
  }, [
    board,
    practicalTutorialTargetId,
    practicalTutorialTileKind,
    practicalTutorialWaitingForTile,
  ]);
  const practicalTutorialControlsLocked = practicalTutorialActive;
  const practicalTutorialBoardDisabled =
    status !== 'playing' ||
    gameplayModalOpen ||
    gameplayInteractionPending ||
    isBlockingModalVisible ||
    isMysteryTutorialVisible ||
    isSettingsMenuVisible ||
    practicalTutorialPopupStep !== undefined ||
    (practicalTutorialWaitingForTile && !practicalTutorialTargetTile);
  const magicTripleRescueCanShow =
    !magicTripleRescueState.rescueUsed &&
    magicTripleRescueState.tutorialSeenCount <
      MAGIC_TRIPLE_RESCUE_MAX_PROMPTS &&
    trayNearlyFull &&
    magicTripleRescueMove !== undefined &&
    !magicTripleRescueDismissedThisRisk &&
    !isMovePipelineActive &&
    !practicalTutorialActive &&
    !gameplayInteractionPending &&
    !gameplayModalOpen &&
    !isBlockingModalVisible &&
    !isMysteryTutorialVisible &&
    !isSettingsMenuVisible;

  const showToast = (text: string) => {
    setToast({ id: Date.now() + Math.random(), text });
  };

  const finishPracticalTutorial = () => {
    setPracticalTutorialStep('done');
    setPracticalTutorialTargetId(undefined);
    setPracticalTutorialTileKind(undefined);
    onPracticalTutorialSeen();
  };

  const startPracticalTutorialMoves = () => {
    const firstTarget = findOpeningTutorialTile(board);

    if (!firstTarget) {
      finishPracticalTutorial();
      return;
    }

    setPracticalTutorialTileKind(firstTarget.kind);
    setPracticalTutorialTargetId(firstTarget.id);
    setPracticalTutorialStep('tap-first');
  };

  const advancePracticalTutorialPopup = () => {
    switch (practicalTutorialStep) {
      case 'intro':
        startPracticalTutorialMoves();
        return;
      case 'tray':
        setPracticalTutorialTargetId(undefined);
        setPracticalTutorialStep('tap-second');
        return;
      case 'triple':
        setPracticalTutorialStep('warning');
        return;
      case 'warning':
        finishPracticalTutorial();
        return;
      default:
        return;
    }
  };

  const resetRoundState = (
    nextBoard: Tile[],
    nextTrayCapacity = currentTrayCapacity,
    nextTrayBoosts: RoundTraySlotSnapshot = {
      bonusSlotActive: isBonusTraySlotActive,
      coinSlotActive: isCoinTraySlotActive,
    },
  ) => {
    const cancelledPowerEffect = activeTileMoveRef.current
      ? undefined
      : tripleCompleteCallbackRef.current;
    roundGenerationRef.current += 1;
    beginNextTileMoveGeneration(tileMoveQueueRef.current);
    if (completionSoundTimeoutRef.current) {
      clearTimeout(completionSoundTimeoutRef.current);
      completionSoundTimeoutRef.current = undefined;
    }
    unduckAmbient();
    lifeConsumedForRoundRef.current = false;
    activeTrayCapacityRef.current = nextTrayCapacity;
    roundBonusTraySlotActiveRef.current = nextTrayBoosts.bonusSlotActive;
    roundCoinTraySlotActiveRef.current = nextTrayBoosts.coinSlotActive;
    boardRef.current = nextBoard;
    trayRef.current = [];
    setActiveTrayCapacity(nextTrayCapacity);
    setRoundBonusTraySlotActive(nextTrayBoosts.bonusSlotActive);
    setRoundCoinTraySlotActive(nextTrayBoosts.coinSlotActive);
    setBoard(nextBoard);
    setBoardBounds(getBoardBounds(nextBoard));
    setBoardLayoutGeneration((currentGeneration) => currentGeneration + 1);
    elapsedSecondsRef.current = 0;
    setElapsedSeconds(0);
    setHighlightedTileId(undefined);
    setIsBonusSlotConfirmVisible(false);
    setIsBonusSlotRequestPending(false);
    setIsBonusSlotProcessing(false);
    setIsCoinSlotProcessing(false);
    setBonusSlotFeedback(undefined);
    setMoveHistory([]);
    setIsMagicTripleRescueVisible(false);
    setMagicTripleRescueDismissedThisRisk(false);
    setIsMovePipelineActive(false);
    setPendingPowerPurchase(undefined);
    setPendingPowerPurchaseRequest(undefined);
    setIsPowerPurchaseProcessing(false);
    setPracticalTutorialTargetId(undefined);
    setPracticalTutorialTileKind(undefined);
    setResultChestProgress(undefined);
    setResultChestReward(undefined);
    setResultCoins(0);
    setResultElapsedSeconds(0);
    setVictoryResult(undefined);
    setResultWorldChest(undefined);
    setFlyingTileEvent(undefined);
    setHiddenTrayTileIds([]);
    setPoppingTrayTileId(undefined);
    setTripleConsumeEvent(undefined);
    setShowBonusAchievement(false);
    setStatus('playing');
    setTray([]);
    setUnlockedLevelTitle(undefined);
    isVisualMoveResolvingRef.current = false;
    victoryHandledGenerationRef.current = undefined;
    isBonusSlotProcessingRef.current = false;
    isCoinSlotProcessingRef.current = false;
    isPowerActionProcessingRef.current = false;
    isPowerPurchaseProcessingRef.current = false;
    // Toque pendente da rodada anterior não pode vazar para a rodada nova.
    activeTileMoveRef.current = undefined;
    activeTripleConsumeIdRef.current = undefined;
    tripleCompleteCallbackRef.current = undefined;
    cancelledPowerEffect?.(true);
    if (poppingTrayTimeoutRef.current) {
      clearTimeout(poppingTrayTimeoutRef.current);
      poppingTrayTimeoutRef.current = undefined;
    }
    boardTileTargetsRef.current = {};
    boardStageTargetRef.current = undefined;
    traySlotTargetsRef.current = {};
  };

  useEffect(() => {
    // Expirações só valem na próxima rodada. Durante a fase, o snapshot pode
    // crescer com uma compra, mas nunca encolher e esconder uma peça ocupada.
    if (isBonusTraySlotActive) {
      roundBonusTraySlotActiveRef.current = true;
      setRoundBonusTraySlotActive(true);
    }
    if (isCoinTraySlotActive) {
      roundCoinTraySlotActiveRef.current = true;
      setRoundCoinTraySlotActive(true);
    }
    expandRoundTrayCapacity(
      Math.max(
        currentTrayCapacity,
        getRoundTrayCapacity(
          {
            bonusSlotActive: roundBonusTraySlotActiveRef.current,
            coinSlotActive: roundCoinTraySlotActiveRef.current,
          },
          BASE_TRAY_CAPACITY,
          MAX_TRAY_CAPACITY,
        ),
      ),
    );
  }, [currentTrayCapacity, isBonusTraySlotActive, isCoinTraySlotActive]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      roundGenerationRef.current += 1;
      beginNextTileMoveGeneration(tileMoveQueueRef.current);
      const cancelledPowerEffect = activeTileMoveRef.current
        ? undefined
        : tripleCompleteCallbackRef.current;
      if (poppingTrayTimeoutRef.current) {
        clearTimeout(poppingTrayTimeoutRef.current);
      }
      if (completionSoundTimeoutRef.current) {
        clearTimeout(completionSoundTimeoutRef.current);
      }
      activeTileMoveRef.current = undefined;
      activeTripleConsumeIdRef.current = undefined;
      tripleCompleteCallbackRef.current = undefined;
      cancelledPowerEffect?.(true);
    };
  }, []);

  useEffect(() => {
    shouldRunPracticalTutorialRef.current = shouldRunPracticalTutorial;
  }, [shouldRunPracticalTutorial]);

  // O flag do tutorial é lido, nunca observado: concluir o tutorial o vira
  // `false` no meio da partida, e reagir a isso regeneraria o tabuleiro em cima
  // das jogadas que o jogador acabou de fazer. Só a troca de fase reinicia.
  useEffect(() => {
    resetRoundState(createBoardVariation(level.id));
    setPracticalTutorialStep(
      shouldRunPracticalTutorialRef.current &&
        level.id === PRACTICAL_TUTORIAL_LEVEL_ID
        ? 'intro'
        : 'done',
    );
    setToast(undefined);
  }, [level.id]);

  useEffect(() => {
    if (!trayNearlyFull) {
      setMagicTripleRescueDismissedThisRisk(false);
      return;
    }

    if (magicTripleRescueCanShow) {
      setIsMagicTripleRescueVisible(true);
    }
  }, [magicTripleRescueCanShow, trayNearlyFull]);

  useEffect(() => {
    if (status !== 'playing') {
      stopAmbientSound({ fadeMs: 240 });
      return undefined;
    }

    playAmbientForWorld(level.worldId);

    return () => {
      stopAmbientSound({ fadeMs: 240 });
    };
  }, [level.worldId, status]);

  useEffect(() => {
    if (
      status !== 'playing' ||
      isBlockingModalVisible ||
      gameplayModalOpen ||
      isCoinSlotProcessing ||
      isMagicTripleRescueVisible ||
      isMysteryTutorialVisible ||
      isSettingsMenuVisible ||
      practicalTutorialActive
    ) {
      return undefined;
    }

    const interval = setInterval(() => {
      setElapsedSeconds((currentSeconds) => {
        const nextSeconds = currentSeconds + 1;
        elapsedSecondsRef.current = nextSeconds;
        return nextSeconds;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [
    gameplayModalOpen,
    isCoinSlotProcessing,
    isMagicTripleRescueVisible,
    isBlockingModalVisible,
    isMysteryTutorialVisible,
    isSettingsMenuVisible,
    level.id,
    practicalTutorialActive,
    status,
  ]);

  useEffect(() => {
    if (!practicalTutorialWaitingForTile) {
      return;
    }

    if (!practicalTutorialTargetTile) {
      setPracticalTutorialStep('warning');
      return;
    }

    if (practicalTutorialTargetTile.id !== practicalTutorialTargetId) {
      setPracticalTutorialTargetId(practicalTutorialTargetTile.id);
    }

    if (!practicalTutorialTileKind) {
      setPracticalTutorialTileKind(practicalTutorialTargetTile.kind);
    }
  }, [
    practicalTutorialTargetId,
    practicalTutorialTargetTile,
    practicalTutorialTileKind,
    practicalTutorialWaitingForTile,
  ]);

  // O realce de dica é temporário e não deve sobreviver a outra interação.
  useEffect(() => {
    if (!highlightedTileId) {
      return undefined;
    }

    const timeout = setTimeout(() => {
      setHighlightedTileId(undefined);
    }, 1800);

    return () => clearTimeout(timeout);
  }, [highlightedTileId]);

  useEffect(() => {
    if (!toast) {
      toastOpacity.setValue(0);
      toastLift.setValue(8);
      return undefined;
    }

    toastOpacity.setValue(0);
    toastLift.setValue(8);

    const animation = Animated.sequence([
      Animated.parallel([
        Animated.timing(toastOpacity, {
          duration: 140,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.spring(toastLift, {
          friction: 8,
          tension: 150,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(TOAST_VISIBLE_MS),
      Animated.timing(toastOpacity, {
        duration: 180,
        toValue: 0,
        useNativeDriver: true,
      }),
    ]);

    animation.start(({ finished }) => {
      if (finished) {
        setToast(undefined);
      }
    });

    return () => animation.stop();
  }, [toast, toastLift, toastOpacity]);

  useEffect(() => {
    if (!bonusSlotFeedback) {
      bonusFeedbackOpacity.setValue(0);
      bonusFeedbackLift.setValue(6);
      return undefined;
    }

    bonusFeedbackOpacity.setValue(0);
    bonusFeedbackLift.setValue(6);
    const animation = Animated.sequence([
      Animated.parallel([
        Animated.timing(bonusFeedbackOpacity, {
          duration: 130,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.spring(bonusFeedbackLift, {
          friction: 8,
          tension: 150,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(BONUS_FEEDBACK_VISIBLE_MS),
      Animated.timing(bonusFeedbackOpacity, {
        duration: 160,
        toValue: 0,
        useNativeDriver: true,
      }),
    ]);

    animation.start(({ finished }) => {
      if (finished) {
        setBonusSlotFeedback(undefined);
      }
    });

    return () => animation.stop();
  }, [bonusFeedbackLift, bonusFeedbackOpacity, bonusSlotFeedback]);

  useEffect(() => {
    if (!isBonusSlotRequestPending) {
      return;
    }

    if (status !== 'playing') {
      setIsBonusSlotRequestPending(false);
      return;
    }

    if (
      isMovePipelineActive ||
      isVisualMoveResolvingRef.current ||
      gameplayModalOpen ||
      isBlockingModalVisible ||
      isMysteryTutorialVisible ||
      isSettingsMenuVisible ||
      practicalTutorialActive
    ) {
      return;
    }

    setIsBonusSlotRequestPending(false);
    setIsBonusSlotConfirmVisible(true);
  }, [
    gameplayModalOpen,
    isBlockingModalVisible,
    isBonusSlotRequestPending,
    isMovePipelineActive,
    isMysteryTutorialVisible,
    isSettingsMenuVisible,
    practicalTutorialActive,
    status,
  ]);

  useEffect(() => {
    if (!pendingPowerPurchaseRequest) {
      return;
    }

    if (status !== 'playing') {
      setPendingPowerPurchaseRequest(undefined);
      return;
    }

    if (
      isBonusSlotRequestPending ||
      isMovePipelineActive ||
      isVisualMoveResolvingRef.current ||
      gameplayModalOpen ||
      isBlockingModalVisible ||
      isMysteryTutorialVisible ||
      isSettingsMenuVisible ||
      practicalTutorialActive
    ) {
      return;
    }

    const powerType = pendingPowerPurchaseRequest;
    setPendingPowerPurchaseRequest(undefined);
    setPendingPowerPurchase(powerType);
  }, [
    gameplayModalOpen,
    isBlockingModalVisible,
    isBonusSlotRequestPending,
    isMovePipelineActive,
    isMysteryTutorialVisible,
    isSettingsMenuVisible,
    pendingPowerPurchaseRequest,
    practicalTutorialActive,
    status,
  ]);

  const getFallbackTarget = (preferredTarget?: WindowTarget): WindowTarget => {
    if (preferredTarget) {
      return preferredTarget;
    }

    return {
      height: 52,
      width: 52,
      x: (gameAreaTarget?.x ?? 0) + width / 2 - 26,
      y: (gameAreaTarget?.y ?? 0) + height * 0.72,
    };
  };

  const getBoardTileTarget = (tile: Tile): WindowTarget => {
    const stageTarget = boardStageTargetRef.current;
    if (stageTarget && boardScale > 0) {
      return getRenderedTileFrame(
        tile,
        boardBounds,
        boardScale,
        stageTarget.x,
        stageTarget.y,
      );
    }

    return getFallbackTarget(boardTileTargetsRef.current[tile.id]);
  };

  const deriveTraySlotTarget = (
    tileIndex: number,
  ): WindowTarget | undefined => {
    if (!trayTarget) {
      return undefined;
    }

    const capacity = Math.max(1, activeTrayCapacityRef.current);
    const slotWidth = trayTarget.width / capacity;
    const index = Math.max(0, Math.min(capacity - 1, tileIndex));
    const size = Math.max(24, Math.min(52, slotWidth - 6));

    return {
      height: size,
      width: size,
      x: trayTarget.x + slotWidth * index + slotWidth / 2 - size / 2,
      y: trayTarget.y + trayTarget.height / 2 - size / 2,
    };
  };

  const getTraySlotTarget = (
    tileIndex: number,
    fallbackTarget?: WindowTarget,
  ) => {
    const index = Math.max(
      0,
      Math.min(activeTrayCapacityRef.current - 1, tileIndex),
    );

    // Ordem: encaixe medido → posição derivada da bandeja → fallback antigo.
    // O fallback antigo é o centro da tela, e era ele que jogava a trinca para
    // o meio quando um encaixe não tinha sido medido.
    return getFallbackTarget(
      traySlotTargetsRef.current[index] ??
        deriveTraySlotTarget(tileIndex) ??
        fallbackTarget,
    );
  };

  const triggerTrayPop = (tileId: string) => {
    if (poppingTrayTimeoutRef.current) {
      clearTimeout(poppingTrayTimeoutRef.current);
    }

    setPoppingTrayTileId(tileId);
    poppingTrayTimeoutRef.current = setTimeout(() => {
      setPoppingTrayTileId(undefined);
      poppingTrayTimeoutRef.current = undefined;
    }, TILE_INSERT_POP_MS);
  };

  const buildConsumeTilesFromTraySnapshot = (
    traySnapshot: Tile[],
    removedKind: TileKind,
    removedTileIds?: string[],
  ): TripleConsumeTile[] => {
    // Quem manda são os ids devolvidos pelo domínio: a bandeja pode ter mais
    // peças do material do que as três do ciclo consumido. O filtro por material
    // só existe como rede de segurança para chamadas antigas sem os ids.
    const targetIds = removedTileIds?.length
      ? new Set(removedTileIds)
      : undefined;
    let removedCount = 0;
    const consumeTiles: TripleConsumeTile[] = [];

    traySnapshot.forEach((tile, tileIndex) => {
      const matches = targetIds
        ? targetIds.has(tile.id)
        : tile.kind === removedKind && removedCount < 3;

      if (!matches) {
        return;
      }

      removedCount += 1;
      consumeTiles.push({
        target: getTraySlotTarget(tileIndex),
        tile,
      });
    });

    return consumeTiles;
  };

  const startTripleConsume = (
    consumeTiles: TripleConsumeTile[],
    kind: TileKind,
    onComplete: (cancelled?: boolean) => void,
    eventId = `triple:${roundGenerationRef.current}:${++tripleSequenceRef.current}`,
  ) => {
    if (consumeTiles.length === 0) {
      onComplete();
      return;
    }

    const nextEvent: TripleConsumeEvent = {
      id: eventId,
      kind,
      tiles: consumeTiles.slice(0, 3),
    };

    activeTripleConsumeIdRef.current = nextEvent.id;
    tripleCompleteCallbackRef.current = onComplete;
    setTripleConsumeEvent(nextEvent);
  };

  const finishTripleConsume = (
    event: TripleConsumeEvent,
    _visualFinished: boolean,
  ) => {
    if (activeTripleConsumeIdRef.current !== event.id) {
      return;
    }

    const onComplete = tripleCompleteCallbackRef.current;
    activeTripleConsumeIdRef.current = undefined;
    tripleCompleteCallbackRef.current = undefined;
    setTripleConsumeEvent(undefined);
    onComplete?.(false);
  };

  const resetLevel = (
    nextTrayCapacity = currentTrayCapacity,
    nextTrayBoosts: RoundTraySlotSnapshot = {
      bonusSlotActive: isBonusTraySlotActive,
      coinSlotActive: isCoinTraySlotActive,
    },
  ) => {
    lightImpact();
    resetRoundState(
      createBoardVariation(level.id, { random: Math.random }),
      nextTrayCapacity,
      nextTrayBoosts,
    );
    if (practicalTutorialActive) {
      setPracticalTutorialStep('intro');
    }
    showToast('Nova variação pronta.');
  };

  const handleRetryLevel = () => {
    onRetryLevel()
      .then((result) => {
        if (result.canRetry) {
          resetLevel(result.trayCapacity, {
            bonusSlotActive: result.bonusSlotActive,
            coinSlotActive: result.coinSlotActive,
          });
        }
      })
      .catch(() => undefined);
  };

  const handleCoinTraySlotPress = async () => {
    if (isCoinSlotProcessingRef.current) {
      return;
    }
    if (isVisualMoveResolvingRef.current || isMovePipelineActive) {
      showToast('Aguarde a peça encaixar.');
      return;
    }

    const operationGeneration = roundGenerationRef.current;
    isCoinSlotProcessingRef.current = true;
    setIsCoinSlotProcessing(true);
    try {
      const result = await onPurchaseCoinTraySlot();
      if (
        !isMountedRef.current ||
        roundGenerationRef.current !== operationGeneration
      ) {
        return;
      }
      if (result.purchased) {
        expandRoundTrayBoosts(result.state);
        playShopBuySound();
        showToast('Bandeja Plus ativada por 24h!');
        return;
      }

      if (result.reason === 'insufficient-coins') {
        warningImpact();
        showToast('Moedas insuficientes.');
        return;
      }

      expandRoundTrayBoosts(result.state);
      showToast('Bandeja Plus já está ativa.');
    } catch {
      if (
        isMountedRef.current &&
        roundGenerationRef.current === operationGeneration
      ) {
        showToast('Não foi possível ativar agora.');
      }
    } finally {
      if (roundGenerationRef.current === operationGeneration) {
        isCoinSlotProcessingRef.current = false;
        setIsCoinSlotProcessing(false);
      }
    }
  };

  const handleAdTraySlotPress = () => {
    if (isCoinSlotProcessingRef.current) {
      showToast('Aguarde a ativação terminar.');
      return;
    }

    if (roundBonusTraySlotActive) {
      setBonusSlotFeedback(
        isBonusTraySlotActive && bonusTraySlotRemainingMs > 0
          ? `+1 espaço ativo · ${formatTrayBoostRemaining(bonusTraySlotRemainingMs)}`
          : '+1 espaço ativo nesta fase',
      );
      return;
    }

    if (isVisualMoveResolvingRef.current || isMovePipelineActive) {
      // O pedido bloqueia novos toques, mas a fila já aceita termina sem ser
      // cancelada. O modal abre assim que voo/chegada/trinca ficarem ociosos.
      setIsBonusSlotRequestPending(true);
      return;
    }

    setIsBonusSlotConfirmVisible(true);
  };

  const confirmBonusTraySlot = async () => {
    if (isBonusSlotProcessingRef.current) {
      return;
    }

    const operationGeneration = roundGenerationRef.current;
    isBonusSlotProcessingRef.current = true;
    setIsBonusSlotProcessing(true);
    try {
      const result = await onActivateBonusTraySlot();
      if (
        !isMountedRef.current ||
        roundGenerationRef.current !== operationGeneration
      ) {
        return;
      }
      expandRoundTrayBoosts(result.state);
      setIsBonusSlotConfirmVisible(false);

      if (result.activated) {
        playShopBuySound();
        setBonusSlotFeedback('+1 espaço liberado por 30 min');
        return;
      }

      setBonusSlotFeedback(
        `+1 espaço já ativo · ${formatTrayBoostRemaining(
          Math.max(
            0,
            (result.state.adSlotExpiresAt ?? Date.now()) - Date.now(),
          ),
        )}`,
      );
    } catch {
      if (
        isMountedRef.current &&
        roundGenerationRef.current === operationGeneration
      ) {
        setIsBonusSlotConfirmVisible(false);
        showToast('Não foi possível liberar agora.');
      }
    } finally {
      if (roundGenerationRef.current === operationGeneration) {
        isBonusSlotProcessingRef.current = false;
        setIsBonusSlotProcessing(false);
      }
    }
  };

  const finishWonRound = async (snapshot: VictoryResultSnapshot) => {
    const winningRoundGeneration = roundGenerationRef.current;
    successImpact();

    let completion: LevelCompletionSummary;

    try {
      completion = await onLevelComplete(level.id, snapshot.earnedStars);
    } catch {
      if (
        isMountedRef.current &&
        roundGenerationRef.current === winningRoundGeneration
      ) {
        showToast('Nao foi possivel salvar a vitoria agora.');
      }
      return false;
    }

    if (
      !isMountedRef.current ||
      roundGenerationRef.current !== winningRoundGeneration
    ) {
      return false;
    }

    const unlockedWorldId = completion.unlockedWorldId;
    const unlockedWorld = unlockedWorldId !== undefined;

    if (completionSoundTimeoutRef.current) {
      clearTimeout(completionSoundTimeoutRef.current);
      completionSoundTimeoutRef.current = undefined;
    }
    playWinSound();
    if (unlockedWorld || completion.bonusWorldAchievementUnlocked) {
      completionSoundTimeoutRef.current = setTimeout(() => {
        completionSoundTimeoutRef.current = undefined;
        if (
          isMountedRef.current &&
          roundGenerationRef.current === winningRoundGeneration
        ) {
          playWorldUnlockSound();
        }
      }, 260);
    } else if (
      completion.coinsEarned > 0 ||
      completion.chestReward?.type === 'coins'
    ) {
      completionSoundTimeoutRef.current = setTimeout(() => {
        completionSoundTimeoutRef.current = undefined;
        if (
          isMountedRef.current &&
          roundGenerationRef.current === winningRoundGeneration
        ) {
          playCoinSound();
        }
      }, 220);
    }
    setResultChestProgress(completion.chestProgress);
    setResultChestReward(completion.chestReward);
    setResultCoins(completion.coinsEarned);
    setResultWorldChest(completion.worldChest);
    setUnlockedLevelTitle(
      completion.bonusWorldAchievementUnlocked
        ? undefined
        : completion.unlockedLevelTitle,
    );
    setShowBonusAchievement(completion.bonusWorldAchievementUnlocked);
    showToast(
      completion.chestReward
        ? 'Baú aberto!'
        : completion.unlockedLevelTitle
          ? 'Nova fase desbloqueada!'
          : 'Fase concluída!',
    );
    return true;
  };

  const startWonRound = (finalElapsedSeconds: number) => {
    const currentGeneration = roundGenerationRef.current;
    if (victoryHandledGenerationRef.current === currentGeneration) {
      return;
    }

    const snapshot = createVictoryResultSnapshot({
      elapsedSeconds: finalElapsedSeconds,
      level,
      previousBestStars: bestStars,
    });
    victoryHandledGenerationRef.current = currentGeneration;
    // O modal só pode nascer depois deste snapshot único. Ele é também a fonte
    // enviada à persistência, evitando um frame de vitória com zero estrelas.
    setVictoryResult(snapshot);
    duckAmbient();
    playConfettiSound();
    setStatus('won');
    void finishWonRound(snapshot);
  };

  const getPowerUnavailableMessage = (powerType: PowerUpType) => {
    if (isVisualMoveResolvingRef.current) {
      return 'Aguarde a peça encaixar.';
    }

    if (practicalTutorialControlsLocked) {
      return 'Conclua o tutorial primeiro.';
    }

    if (status !== 'playing') {
      return 'Aguarde a rodada terminar.';
    }

    if (
      powerType === 'hint' &&
      !findMagicTripleMove({
        activeTrayCapacity: activeTrayCapacityRef.current,
        board: boardRef.current,
        tray: trayRef.current,
      })
    ) {
      return 'Nenhuma trinca disponível agora.';
    }

    if (powerType === 'shuffle' && remainingTiles < 2) {
      return 'Poucas peças para misturar.';
    }

    if (powerType === 'undo') {
      const previousMove = undoLastMove(moveHistory);

      if (!previousMove) {
        return 'Nada para desfazer.';
      }

      if (previousMove.formedTriple) {
        return 'Não desfaz depois de trinca.';
      }
    }

    return undefined;
  };

  const pendingPowerUnavailableMessage = pendingPowerPurchase
    ? getPowerUnavailableMessage(pendingPowerPurchase)
    : undefined;
  const pendingPowerPurchaseCost = pendingPowerPurchase
    ? POWER_UP_COSTS[pendingPowerPurchase]
    : 0;
  const pendingPowerCanUseImmediately =
    pendingPowerUnavailableMessage === undefined;
  const pendingPowerHasEnoughCoins = coins >= pendingPowerPurchaseCost;

  const applyPowerEffect = async (
    powerType: PowerUpType,
  ): Promise<PowerEffectResult> => {
    if (powerType === 'hint') {
      isVisualMoveResolvingRef.current = true;
      setIsMovePipelineActive(true);
      const currentBoard = boardRef.current;
      const currentTray = trayRef.current;
      const result = playMagicTriple(
        currentBoard,
        currentTray,
        activeTrayCapacityRef.current,
      );
      const terminalElapsedSeconds =
        result.status === 'won' ? elapsedSecondsRef.current : undefined;

      if (result.board === currentBoard && result.tray === currentTray) {
        isVisualMoveResolvingRef.current = false;
        setIsMovePipelineActive(false);
        return 'failed';
      }

      const magicConsumeTiles =
        result.removedKind !== undefined
          ? [
              ...currentTray
                .map((tile, tileIndex) => ({ tile, tileIndex }))
                .filter(
                  ({ tile }) =>
                    !result.tray.some((nextTile) => nextTile.id === tile.id),
                )
                .map<TripleConsumeTile>(({ tile, tileIndex }) => ({
                  target: getTraySlotTarget(tileIndex),
                  tile,
                })),
              ...currentBoard
                .filter((tile) => {
                  const nextTile = result.board.find(
                    (knownTile) => knownTile.id === tile.id,
                  );
                  return !isTileRemoved(tile) && nextTile?.removed === true;
                })
                .map<TripleConsumeTile>((tile) => ({
                  target: getBoardTileTarget(tile),
                  tile,
                })),
            ]
          : [];
      const historyItem: MoveHistoryItem = {
        board: currentBoard,
        formedTriple: result.removedKind !== undefined,
        removedKind: result.removedKind,
        tray: currentTray,
      };

      boardRef.current = result.board;
      setBoard(result.board);
      setHighlightedTileId(undefined);
      setMoveHistory((currentHistory) => [...currentHistory, historyItem]);
      setHiddenTrayTileIds(magicConsumeTiles.map(({ tile }) => tile.id));
      mediumImpact();
      playTripleSounds();

      return new Promise<PowerEffectResult>((resolve) => {
        const completeMagicTriple = (cancelled = false) => {
          if (cancelled) {
            resolve('cancelled');
            return;
          }

          trayRef.current = result.tray;
          setTray(result.tray);
          setHiddenTrayTileIds([]);
          isVisualMoveResolvingRef.current = false;
          setIsMovePipelineActive(false);

          if (result.status === 'won') {
            startWonRound(terminalElapsedSeconds ?? elapsedSecondsRef.current);
          }
          resolve('applied');
        };

        if (result.removedKind) {
          startTripleConsume(
            magicConsumeTiles,
            result.removedKind,
            completeMagicTriple,
          );
        } else {
          completeMagicTriple();
        }
      });
    }
    if (powerType === 'shuffle') {
      if (remainingTiles < 2) {
        return 'failed';
      }

      mediumImpact();
      const nextBoard = revealAvailableMysteryTiles(
        shuffleRemainingTiles(boardRef.current),
      );
      boardRef.current = nextBoard;
      setBoard(nextBoard);
      setHighlightedTileId(undefined);
      return 'applied';
    }

    const previousMove = getUndoableMove(moveHistory);

    if (!previousMove) {
      return 'failed';
    }

    lightImpact();
    boardRef.current = previousMove.board;
    trayRef.current = previousMove.tray;
    setBoard(previousMove.board);
    setHighlightedTileId(undefined);
    setMoveHistory((currentHistory) => currentHistory.slice(0, -1));
    setStatus('playing');
    setTray(previousMove.tray);
    return 'applied';
  };

  const dismissMagicTripleRescue = () => {
    setIsMagicTripleRescueVisible(false);
    setMagicTripleRescueDismissedThisRisk(true);
    onMagicTripleRescueSeen().catch(() => undefined);
  };

  const useFreeMagicTripleRescue = async () => {
    if (
      !findMagicTripleMove({
        activeTrayCapacity: activeTrayCapacityRef.current,
        board: boardRef.current,
        tray: trayRef.current,
      })
    ) {
      warningImpact();
      setIsMagicTripleRescueVisible(false);
      setMagicTripleRescueDismissedThisRisk(true);
      showToast('Nenhuma trinca disponível agora.');
      return;
    }

    setIsMagicTripleRescueVisible(false);
    setMagicTripleRescueDismissedThisRisk(true);
    const applied = await applyPowerEffect('hint');

    if (applied === 'cancelled') {
      return;
    }
    if (applied === 'failed') {
      warningImpact();
      showToast('Não foi possível usar agora.');
      return;
    }

    onMagicTripleRescueUsed().catch(() => undefined);
  };

  const requestPowerUse = async (powerType: PowerUpType) => {
    if (
      isCoinSlotProcessingRef.current ||
      isPowerActionProcessingRef.current ||
      isPowerPurchaseProcessingRef.current
    ) {
      return;
    }

    if (itemCounts[powerType] <= 0) {
      if (isVisualMoveResolvingRef.current || isMovePipelineActive) {
        setPendingPowerPurchaseRequest(powerType);
      } else {
        setPendingPowerPurchase(powerType);
      }
      return;
    }

    const unavailableMessage = getPowerUnavailableMessage(powerType);
    if (unavailableMessage) {
      warningImpact();
      showToast(unavailableMessage);
      return;
    }

    isPowerActionProcessingRef.current = true;
    try {
      if (!onUseItem(powerType)) {
        warningImpact();
        showToast('Não foi possível usar agora.');
        return;
      }

      const applied = await applyPowerEffect(powerType);

      if (applied === 'cancelled') {
        // A rodada deixou de existir durante a animação. `onUseItem` já debitou
        // a unidade, então ela precisa voltar: nenhum efeito foi concluído.
        await onRestorePurchasedPowerUp(powerType).catch(() => false);
        return;
      }

      if (applied === 'failed') {
        warningImpact();
        showToast('Não foi possível usar agora.');
      }
    } finally {
      isPowerActionProcessingRef.current = false;
    }
  };

  const confirmPendingPowerPurchase = async () => {
    if (!pendingPowerPurchase || isPowerPurchaseProcessingRef.current) {
      return;
    }

    const powerType = pendingPowerPurchase;
    const unavailableMessage = getPowerUnavailableMessage(powerType);
    const cost = POWER_UP_COSTS[powerType];

    if (coins < cost) {
      warningImpact();
      showToast('Moedas insuficientes.');
      return;
    }

    const useImmediately = unavailableMessage === undefined;
    const operationGeneration = roundGenerationRef.current;
    isPowerPurchaseProcessingRef.current = true;
    setIsPowerPurchaseProcessing(true);
    try {
      const purchased = await onPurchasePowerUp(powerType, useImmediately);
      const operationStillCurrent =
        isMountedRef.current &&
        roundGenerationRef.current === operationGeneration;
      if (!purchased) {
        if (operationStillCurrent) {
          warningImpact();
          setPendingPowerPurchase(undefined);
          showToast('Não foi possível concluir a compra.');
        }
        return;
      }

      if (!operationStillCurrent) {
        // A compra já persistiu. Se ela incluía consumo imediato, devolve a
        // unidade ao inventário porque a rodada que autorizou o efeito acabou.
        if (useImmediately) {
          await onRestorePurchasedPowerUp(powerType).catch(() => false);
        }
        return;
      }

      playShopBuySound();
      setPendingPowerPurchase(undefined);
      if (!useImmediately) {
        showToast(`${POWER_UP_UI[powerType].label} adicionado ao inventário.`);
        return;
      }

      const applied = await applyPowerEffect(powerType);

      if (applied === 'cancelled') {
        // A rodada deixou de existir durante a animação. A compra continua
        // válida, mas a unidade consumida precisa voltar ao inventário porque
        // nenhum efeito chegou a ser concluído nessa rodada.
        await onRestorePurchasedPowerUp(powerType).catch(() => false);
        return;
      }

      if (applied === 'failed') {
        warningImpact();
        showToast('Não foi possível usar agora.');
      }
    } finally {
      if (roundGenerationRef.current === operationGeneration) {
        isPowerPurchaseProcessingRef.current = false;
        setIsPowerPurchaseProcessing(false);
      }
    }
  };

  const clearQueuedTilePresses = () => {
    cancelQueuedTileMoves(tileMoveQueueRef.current);
  };

  const finishTerminalMove = (move: PendingTileMove) => {
    if (move.result.status === 'won') {
      startWonRound(move.terminalElapsedSeconds ?? elapsedSecondsRef.current);
      return;
    }

    if (move.result.status === 'lost') {
      setStatus('lost');
      warningImpact();
      if (!lifeConsumedForRoundRef.current && !practicalTutorialActive) {
        lifeConsumedForRoundRef.current = true;
        onLoseLife().catch(() => undefined);
      }
      playLoseSound();
      setResultElapsedSeconds(
        move.terminalElapsedSeconds ?? elapsedSecondsRef.current,
      );
    }
  };

  const advanceTutorialAfterMove = (move: PendingTileMove) => {
    if (!move.tutorialStep || !isPracticalTutorialTapStep(move.tutorialStep)) {
      return;
    }

    setPracticalTutorialTargetId(undefined);
    if (move.tutorialStep === 'tap-first') {
      setPracticalTutorialStep('tray');
    } else if (move.tutorialStep === 'tap-second') {
      setPracticalTutorialStep('tap-third');
    } else {
      setPracticalTutorialStep(move.result.removedKind ? 'triple' : 'warning');
    }
  };

  const completeActiveTileMove = (move: PendingTileMove) => {
    if (activeTileMoveRef.current?.event.id !== move.event.id) {
      return;
    }
    if (
      !settleActiveTileMove(
        tileMoveQueueRef.current,
        move.event.id,
        'completed',
      )
    ) {
      return;
    }

    trayRef.current = move.result.tray;
    setTray(move.result.tray);
    setHiddenTrayTileIds([]);
    activeTileMoveRef.current = undefined;
    advanceTutorialAfterMove(move);

    if (move.result.status !== 'playing') {
      clearQueuedTilePresses();
      isVisualMoveResolvingRef.current = false;
      setIsMovePipelineActive(false);
      finishTerminalMove(move);
      return;
    }

    startNextQueuedMoveRef.current();
  };

  const handleFlyingTileSettled = (
    event: FlyingTileEvent,
    visualFinished: boolean,
  ) => {
    const move = activeTileMoveRef.current;

    if (!move || move.event.id !== event.id) {
      return;
    }
    if (
      !settleActiveTileFlight(
        tileMoveQueueRef.current,
        event.id,
        visualFinished,
      )
    ) {
      return;
    }

    setFlyingTileEvent(undefined);
    trayRef.current = move.arrivalTray;
    setTray(move.arrivalTray);
    triggerTrayPop(event.tile.id);

    if (!move.result.removedKind) {
      playTapSound();
      completeActiveTileMove(move);
      return;
    }

    const consumeTiles = buildConsumeTilesFromTraySnapshot(
      move.arrivalTray,
      move.result.removedKind,
      move.result.removedTileIds,
    );
    setHiddenTrayTileIds(consumeTiles.map(({ tile }) => tile.id));
    mediumImpact();
    playTripleSounds();
    if (!markActiveTileMoveConsuming(tileMoveQueueRef.current, event.id)) {
      return;
    }
    startTripleConsume(
      consumeTiles,
      move.result.removedKind,
      () => completeActiveTileMove(move),
      event.id,
    );
  };

  const startNextQueuedMove = () => {
    const moveQueue = tileMoveQueueRef.current;

    if (activeTileMoveRef.current || moveQueue.activeToken) {
      return;
    }

    let queueEntry = activateNextTileMove(moveQueue);
    while (queueEntry) {
      const tileId = queueEntry.tileId;
      const currentBoard = boardRef.current;
      const currentTray = trayRef.current;
      const selectedTile = currentBoard.find((tile) => tile.id === tileId);

      if (
        !selectedTile ||
        isTileRemoved(selectedTile) ||
        isMysteryTileHidden(selectedTile) ||
        isTileBlocked(selectedTile, currentBoard)
      ) {
        settleActiveTileMove(moveQueue, queueEntry.token, 'cancelled');
        queueEntry = activateNextTileMove(moveQueue);
        continue;
      }

      const result = playTile(
        currentBoard,
        currentTray,
        tileId,
        activeTrayCapacityRef.current,
      );
      if (result.board === currentBoard && result.tray === currentTray) {
        settleActiveTileMove(moveQueue, queueEntry.token, 'cancelled');
        queueEntry = activateNextTileMove(moveQueue);
        continue;
      }

      const trayTile = { ...selectedTile, removed: false };
      const arrivalTray = insertTileGroupedInTray(currentTray, trayTile);
      const destinationTileIndex = Math.max(
        0,
        arrivalTray.findIndex((tile) => tile.id === selectedTile.id),
      );
      const fromTarget = getBoardTileTarget(selectedTile);
      const event: FlyingTileEvent = {
        from: fromTarget,
        id: queueEntry.token,
        tile: trayTile,
        to: getTraySlotTarget(destinationTileIndex, fromTarget),
      };
      const move: PendingTileMove = {
        arrivalTray,
        event,
        historyItem: {
          board: currentBoard,
          formedTriple: result.removedKind !== undefined,
          removedKind: result.removedKind,
          tray: currentTray,
        },
        result,
        terminalElapsedSeconds:
          result.status === 'playing' ? undefined : elapsedSecondsRef.current,
        tutorialStep: practicalTutorialWaitingForTile
          ? practicalTutorialStep
          : undefined,
      };

      activeTileMoveRef.current = move;
      boardRef.current = result.board;
      setBoard(result.board);
      setMoveHistory((currentHistory) => [...currentHistory, move.historyItem]);
      playWhooshSound();
      setFlyingTileEvent(event);

      if (result.status !== 'playing') {
        clearQueuedTilePresses();
      }
      return;
    }

    isVisualMoveResolvingRef.current = false;
    setIsMovePipelineActive(false);
  };

  startNextQueuedMoveRef.current = startNextQueuedMove;

  const enqueueTilePress = (tileId: string) => {
    if (
      !canQueueTilePress({
        activeMoveStatus: activeTileMoveRef.current?.result.status,
        blockedByUi:
          gameplayModalOpen ||
          gameplayInteractionPending ||
          isCoinSlotProcessingRef.current ||
          isBlockingModalVisible ||
          isMysteryTutorialVisible ||
          isSettingsMenuVisible ||
          (isVisualMoveResolvingRef.current &&
            !tileMoveQueueRef.current.activeToken),
        duplicate: hasPendingTileId(tileMoveQueueRef.current, tileId),
        status,
        tutorialMoveLocked:
          practicalTutorialActive && isVisualMoveResolvingRef.current,
      })
    ) {
      return;
    }

    const currentBoard = boardRef.current;
    const selectedTile = currentBoard.find((tile) => tile.id === tileId);
    if (
      !selectedTile ||
      isTileRemoved(selectedTile) ||
      isMysteryTileHidden(selectedTile)
    ) {
      return;
    }

    if (practicalTutorialWaitingForTile) {
      if (!practicalTutorialTargetTile) {
        setPracticalTutorialStep('warning');
        return;
      }
      if (tileId !== practicalTutorialTargetTile.id) {
        warningImpact();
        return;
      }
    }

    if (isTileBlocked(selectedTile, currentBoard)) {
      warningImpact();
      return;
    }

    if (!enqueueTileMove(tileMoveQueueRef.current, tileId)) {
      return;
    }
    isVisualMoveResolvingRef.current = true;
    setIsMovePipelineActive(true);
    lightImpact();
    startNextQueuedMoveRef.current();
  };

  const cancelPendingMoveAnimations = () => {
    const activeMove = activeTileMoveRef.current;
    const pendingTripleComplete = tripleCompleteCallbackRef.current;

    clearQueuedTilePresses();
    if (activeMove) {
      settleActiveTileMove(
        tileMoveQueueRef.current,
        activeMove.event.id,
        'completed',
      );
    } else if (tileMoveQueueRef.current.activeToken) {
      settleActiveTileMove(
        tileMoveQueueRef.current,
        tileMoveQueueRef.current.activeToken,
        'cancelled',
      );
    }
    setFlyingTileEvent(undefined);
    setTripleConsumeEvent(undefined);
    activeTripleConsumeIdRef.current = undefined;
    tripleCompleteCallbackRef.current = undefined;
    setHiddenTrayTileIds([]);
    setPoppingTrayTileId(undefined);
    if (poppingTrayTimeoutRef.current) {
      clearTimeout(poppingTrayTimeoutRef.current);
      poppingTrayTimeoutRef.current = undefined;
    }

    if (activeMove) {
      trayRef.current = activeMove.result.tray;
      setTray(activeMove.result.tray);
      activeTileMoveRef.current = undefined;
      advanceTutorialAfterMove(activeMove);
    }

    isVisualMoveResolvingRef.current = false;
    setIsMovePipelineActive(false);
    if (
      activeMove?.result.status !== undefined &&
      activeMove.result.status !== 'playing'
    ) {
      finishTerminalMove(activeMove);
    } else if (!activeMove) {
      pendingTripleComplete?.(false);
    }
  };

  const handleBackToLevels = () => {
    const cancelledPowerEffect = activeTileMoveRef.current
      ? undefined
      : tripleCompleteCallbackRef.current;

    roundGenerationRef.current += 1;
    beginNextTileMoveGeneration(tileMoveQueueRef.current);
    activeTileMoveRef.current = undefined;
    activeTripleConsumeIdRef.current = undefined;
    tripleCompleteCallbackRef.current = undefined;
    setFlyingTileEvent(undefined);
    setTripleConsumeEvent(undefined);
    setHiddenTrayTileIds([]);
    setPoppingTrayTileId(undefined);
    if (poppingTrayTimeoutRef.current) {
      clearTimeout(poppingTrayTimeoutRef.current);
      poppingTrayTimeoutRef.current = undefined;
    }
    isVisualMoveResolvingRef.current = false;
    setIsMovePipelineActive(false);
    cancelledPowerEffect?.(true);
    onBack();
  };

  useEffect(() => {
    if (
      !isBlockingModalVisible &&
      !isMysteryTutorialVisible &&
      !isSettingsMenuVisible
    ) {
      return;
    }
    if (isVisualMoveResolvingRef.current) {
      cancelPendingMoveAnimations();
    }
  }, [isBlockingModalVisible, isMysteryTutorialVisible, isSettingsMenuVisible]);

  handleTilePressRef.current = enqueueTilePress;

  // Identidade fixa para o GameBoard memoizado, sempre chamando a versão mais nova.
  const handleTilePressStable = useCallback((tileId: string) => {
    void handleTilePressRef.current(tileId);
  }, []);

  handleBlockedTilePressRef.current = () => {
    warningImpact();
  };

  const handleBlockedTilePressStable = useCallback(() => {
    handleBlockedTilePressRef.current();
  }, []);

  return (
    <ScreenShell scroll={false}>
      <ImageBackground
        imageStyle={styles.sceneImage}
        resizeMode="cover"
        source={gameBackground}
        style={[
          styles.container,
          level.worldId === 2 || level.worldId === 5 || level.worldId === 7
            ? styles.containerMountain
            : null,
          level.worldId === 3 || level.worldId === 6 || level.worldId === 8
            ? styles.containerCrystal
            : null,
          level.worldId === 21 ? styles.containerBonus : null,
        ]}
      >
        <View
          pointerEvents="none"
          ref={gameAreaRef}
          style={StyleSheet.absoluteFillObject}
          onLayout={reportGameAreaTarget}
        />
        <View pointerEvents="none" style={styles.sceneOverlay}>
          <View
            style={[
              styles.sceneWash,
              level.worldId === 2 || level.worldId === 5 || level.worldId === 7
                ? styles.sceneWashMountain
                : null,
              level.worldId === 3 || level.worldId === 6 || level.worldId === 8
                ? styles.sceneWashCrystal
                : null,
            ]}
          />
          <View
            style={[
              styles.sceneWashBottom,
              level.worldId === 3 || level.worldId === 6 || level.worldId === 8
                ? styles.sceneWashBottomCrystal
                : null,
              level.worldId === 21 ? styles.sceneWashBottomBonus : null,
            ]}
          />
          <View style={[styles.sceneGlow, styles.sceneGlowTop]} />
          <View style={[styles.sceneGlow, styles.sceneGlowBottom]} />
        </View>
        <View style={styles.gameContent}>
          <View style={styles.hud}>
            <View style={styles.hudNav}>
              <Pressable
                accessibilityLabel="Voltar ao mapa"
                accessibilityRole="button"
                onPress={handleBackToLevels}
                style={({ pressed }) => [
                  styles.navButton,
                  pressed ? styles.navButtonPressed : null,
                ]}
              >
                <GameIcon name="back" size={24} tone="blue" />
              </Pressable>
              <Pressable
                accessibilityLabel="Reiniciar fase"
                accessibilityRole="button"
                onPress={() => {
                  resetLevel();
                }}
                style={({ pressed }) => [
                  styles.resetButton,
                  pressed ? styles.navButtonPressed : null,
                ]}
              >
                <GameIcon name="reset" size={24} tone="neutral" />
              </Pressable>
              <Pressable
                accessibilityLabel="Abrir configurações"
                accessibilityRole="button"
                onPress={onOpenSettings}
                style={({ pressed }) => [
                  styles.settingsNavButton,
                  pressed ? styles.navButtonPressed : null,
                ]}
              >
                <GameIcon name="settings" size={24} tone="blue" />
              </Pressable>
            </View>
            <View style={styles.hudTextBlock}>
              <PhasePlate
                levelLabel={levelDisplayLabel}
                worldLabel={chapter ? `Capítulo ${chapter.id}` : world.label}
                worldName={chapter ? chapter.name : world.subtitle}
              />
            </View>
            <View style={styles.hudRight}>
              <ResourcePill
                addTone="green"
                footer={
                  livesState.currentLives < livesState.maxLives
                    ? formatLifeTimer(timeUntilNextLifeMs)
                    : 'CHEIO'
                }
                iconName="heart"
                iconTone="pink"
                value={`${livesState.currentLives}`}
              />
              <View style={styles.coinRow}>
                <ResourcePill
                  iconName="coin"
                  iconTone="gold"
                  value={`${coins}`}
                  onLayoutInWindow={reportCoinCounterTarget}
                />
                <Pressable
                  accessibilityLabel="Abrir a Loja"
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={onOpenShop}
                  style={({ pressed }) => [
                    styles.shopCartButton,
                    pressed ? styles.navButtonPressed : null,
                  ]}
                >
                  <GameIcon name="cart" size={30} tone="green" />
                </Pressable>
              </View>
            </View>
          </View>

          <View style={styles.meterRow}>
            <Text style={styles.meterTime}>
              {formatSeconds(elapsedSeconds)}
            </Text>
            <View style={styles.meterTrack}>
              <View
                style={[styles.meterFill, { width: `${timerProgress}%` }]}
              />
              <View style={[styles.meterMark, { left: `${threeStarMarker}%` }]}>
                <Text style={styles.meterMarkText}>3</Text>
              </View>
              <View style={[styles.meterMark, styles.meterMarkTwo]}>
                <Text style={styles.meterMarkTextTwo}>2</Text>
              </View>
            </View>
            <Text
              accessibilityLabel={formatQuantity(
                remainingTiles,
                'peça',
                'peças',
              )}
              style={styles.meterCount}
            >
              {remainingTiles}{' '}
              <Text style={styles.meterCountUnit}>
                {remainingTiles === 1 ? 'peça' : 'peças'}
              </Text>
            </Text>
          </View>

          <View onLayout={handleBoardAreaLayout} style={styles.boardArea}>
            <View
              ref={boardStageRef}
              onLayout={reportBoardStageTarget}
              style={[
                styles.boardStage,
                {
                  height: boardFrame.height,
                  width: boardFrame.width,
                },
              ]}
            >
              <View
                style={[
                  styles.boardScaler,
                  {
                    height: boardBounds.height,
                    transform: [{ scale: boardScale }],
                    width: boardBounds.width,
                  },
                ]}
              >
                <GameBoard
                  allowedTileId={
                    practicalTutorialWaitingForTile
                      ? practicalTutorialTargetTile?.id
                      : undefined
                  }
                  disabled={practicalTutorialBoardDisabled}
                  bounds={boardBounds}
                  highlightedTileId={
                    practicalTutorialTargetTile?.id ?? highlightedTileId
                  }
                  onTileLayoutInWindow={reportBoardTileTarget}
                  onBlockedTilePress={handleBlockedTilePressStable}
                  onTilePress={handleTilePressStable}
                  tiles={board}
                />
              </View>
            </View>
            {practicalTutorialWaitingForTile && practicalTutorialTargetTile ? (
              <View style={styles.practicalTargetCallout}>
                <Text style={styles.practicalTargetText}>
                  Toque nesta peça.
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.trayControlRow}>
            <View style={styles.trayStatus}>
              <Text
                style={[
                  styles.trayLabel,
                  trayNearlyFull ? styles.trayLabelDanger : null,
                ]}
              >
                Bandeja {tray.length}/{activeTrayCapacity}
              </Text>
              {roundBonusTraySlotActive ? (
                <Text style={styles.bonusSlotIndicator}>
                  +1 bônus ·{' '}
                  {isBonusTraySlotActive && bonusTraySlotRemainingMs > 0
                    ? formatTrayBoostRemaining(bonusTraySlotRemainingMs)
                    : 'esta fase'}
                </Text>
              ) : null}
            </View>
            <PowerDrawer
              disabled={
                status !== 'playing' ||
                practicalTutorialControlsLocked ||
                isBlockingModalVisible ||
                gameplayModalOpen ||
                gameplayInteractionPending ||
                isSettingsMenuVisible
              }
              disabledPowers={{
                hint: !magicTripleRescueMove,
                shuffle: remainingTiles < 2,
                undo: !lastUndoMove,
              }}
              itemCounts={itemCounts}
              onUsePower={requestPowerUse}
            />
          </View>

          <Animated.View
            ref={trayDockRef}
            onLayout={reportTrayTarget}
            style={styles.trayDock}
          >
            <Tray
              activeCapacity={activeTrayCapacity}
              bonusSlotActive={roundBonusTraySlotActive}
              coinSlotActive={roundCoinTraySlotActive}
              hiddenTileIds={hiddenTrayTileIds}
              poppingTileId={poppingTrayTileId}
              tiles={tray}
              onAdSlotPress={handleAdTraySlotPress}
              onCoinSlotPress={handleCoinTraySlotPress}
              onSlotLayoutInWindow={reportTraySlotTarget}
            />
          </Animated.View>

          {bonusSlotFeedback ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.bonusSlotFeedback,
                {
                  opacity: bonusFeedbackOpacity,
                  transform: [{ translateY: bonusFeedbackLift }],
                },
              ]}
            >
              <GameIcon name="bonus" size={16} tone="green" />
              <Text style={styles.bonusSlotFeedbackText}>
                {bonusSlotFeedback}
              </Text>
            </Animated.View>
          ) : null}

          {toast ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.toast,
                {
                  opacity: toastOpacity,
                  transform: [{ translateY: toastLift }],
                },
              ]}
            >
              <Text style={styles.toastText}>{toast.text}</Text>
            </Animated.View>
          ) : null}
        </View>

        <TripleConsumeEffect
          containerTarget={gameAreaTarget}
          event={tripleConsumeEvent}
          onSettled={finishTripleConsume}
        />
        <FlyingTileOverlay
          containerTarget={gameAreaTarget}
          event={flyingTileEvent}
          onSettled={handleFlyingTileSettled}
        />

        <ResultModal
          activeTrayCapacity={activeTrayCapacity}
          availableCoins={coins}
          chestProgress={resultChestProgress}
          chestReward={resultChestReward}
          coinCollectTarget={coinCollectTarget}
          coinsEarned={resultCoins}
          elapsedSeconds={victoryResult?.elapsedSeconds ?? resultElapsedSeconds}
          isNewRecord={victoryResult?.isNewRecord ?? false}
          level={level}
          livesState={livesState}
          keys={keys}
          onBackToLevels={handleBackToLevels}
          onNextLevel={onNextLevel}
          onOpenWorldChest={onOpenWorldChest}
          onRetry={handleRetryLevel}
          starsEarned={victoryResult?.earnedStars ?? 0}
          status={status === 'won' && !victoryResult ? 'playing' : status}
          timeUntilNextLifeMs={timeUntilNextLifeMs}
          unlockedLevelTitle={unlockedLevelTitle}
          worldChest={resultWorldChest}
        />
        <BonusWorldAchievementModal
          visible={showBonusAchievement}
          onContinueMap={() => {
            setShowBonusAchievement(false);
            onBonusWorldAchievementSeen(false);
          }}
          onGoToBonusWorld={() => {
            setShowBonusAchievement(false);
            onBonusWorldAchievementSeen(true);
          }}
        />
        <Modal
          animationType="fade"
          transparent
          visible={practicalTutorialPopupStep !== undefined}
          onRequestClose={() => undefined}
        >
          <SafeAreaView
            edges={['top', 'bottom', 'left', 'right']}
            style={styles.modalOverlay}
          >
            <View style={styles.practicalModalCard}>
              {practicalTutorialPopupStep ? (
                <>
                  <Text style={styles.practicalModalTitle}>
                    {
                      PRACTICAL_TUTORIAL_POPUPS[practicalTutorialPopupStep]
                        .title
                    }
                  </Text>
                  <Text style={styles.practicalModalText}>
                    {PRACTICAL_TUTORIAL_POPUPS[practicalTutorialPopupStep].text}
                  </Text>
                  <PrimaryButton
                    // O rótulo muda a cada passo ("Começar", "Entendi",
                    // "Continuar", "Jogar"), então texto não serve de
                    // endereço: o id é o mesmo botão nos quatro.
                    testID="tutorial-pratico-avancar"
                    title={
                      PRACTICAL_TUTORIAL_POPUPS[practicalTutorialPopupStep]
                        .button
                    }
                    onPress={advancePracticalTutorialPopup}
                  />
                </>
              ) : null}
            </View>
          </SafeAreaView>
        </Modal>
        <Modal
          animationType="fade"
          transparent
          visible={isMagicTripleRescueVisible}
          onRequestClose={dismissMagicTripleRescue}
        >
          <SafeAreaView
            edges={['top', 'bottom', 'left', 'right']}
            style={styles.modalOverlay}
          >
            <View style={styles.rescueModalCard}>
              <GameIcon name="powers" size={46} tone="purple" />
              <Text style={styles.purchaseModalTitle}>Quase sem espaço!</Text>
              <Text style={styles.purchaseModalText}>
                A Trinca Mágica forma uma trinca possível automaticamente.
              </Text>
              <Text style={styles.rescueModalHint}>
                Use uma vez grátis para salvar sua bandeja.
              </Text>
              <View style={styles.purchaseModalActions}>
                <PrimaryButton
                  size="small"
                  title="Depois"
                  variant="secondary"
                  onPress={dismissMagicTripleRescue}
                />
                <PrimaryButton
                  size="small"
                  title="Usar grátis"
                  onPress={useFreeMagicTripleRescue}
                />
              </View>
            </View>
          </SafeAreaView>
        </Modal>
        <Modal
          animationType="fade"
          statusBarTranslucent
          transparent
          visible={isBonusSlotConfirmVisible}
          onRequestClose={() => {
            if (!isBonusSlotProcessingRef.current) {
              setIsBonusSlotConfirmVisible(false);
            }
          }}
        >
          <SafeAreaView
            edges={['top', 'bottom', 'left', 'right']}
            style={styles.modalOverlay}
          >
            <View style={styles.bonusPurchaseModalCard}>
              <View style={styles.bonusModalIcon}>
                <GameIcon name="bonus" size={34} tone="green" />
              </View>
              <Text style={styles.purchaseModalTitle}>
                Liberar espaço bônus?
              </Text>
              <Text style={styles.purchaseModalText}>
                Ganhe um sétimo espaço na bandeja e jogue com mais segurança.
              </Text>
              <View style={styles.bonusBenefitPill}>
                <Text style={styles.bonusBenefitText}>+1 ESPAÇO · 30 MIN</Text>
              </View>
              <View style={styles.purchaseModalActions}>
                <PrimaryButton
                  disabled={isBonusSlotProcessing}
                  size="small"
                  title="Cancelar"
                  variant="secondary"
                  onPress={() => setIsBonusSlotConfirmVisible(false)}
                />
                <PrimaryButton
                  disabled={isBonusSlotProcessing}
                  size="small"
                  title={
                    isBonusSlotProcessing ? 'Liberando…' : 'Liberar grátis'
                  }
                  onPress={confirmBonusTraySlot}
                />
              </View>
            </View>
          </SafeAreaView>
        </Modal>
        <Modal
          animationType="fade"
          statusBarTranslucent
          transparent
          visible={pendingPowerPurchase !== undefined}
          onRequestClose={() => {
            if (!isPowerPurchaseProcessingRef.current) {
              setPendingPowerPurchase(undefined);
            }
          }}
        >
          <SafeAreaView
            edges={['top', 'bottom', 'left', 'right']}
            style={styles.modalOverlay}
          >
            <View style={styles.powerPurchaseModalCard}>
              {pendingPowerPurchase ? (
                <>
                  <View style={styles.powerPurchaseIcon}>
                    <PowerIcon name={pendingPowerPurchase} size={38} />
                  </View>
                  <Text style={styles.purchaseModalTitle}>
                    {POWER_UP_UI[pendingPowerPurchase].label}
                  </Text>
                  <Text style={styles.purchaseModalText}>
                    {POWER_UP_UI[pendingPowerPurchase].description}
                  </Text>
                  <View style={styles.powerPriceRow}>
                    <GameIcon name="coin" size={20} tone="gold" />
                    <Text style={styles.powerPriceText}>
                      {pendingPowerPurchaseCost}
                    </Text>
                    <Text style={styles.powerBalanceText}>Saldo: {coins}</Text>
                  </View>
                  {pendingPowerUnavailableMessage ? (
                    <Text style={styles.powerPurchaseCondition}>
                      {pendingPowerUnavailableMessage} A compra ficará no
                      inventário.
                    </Text>
                  ) : (
                    <Text style={styles.powerPurchaseConditionReady}>
                      Pronto para comprar e usar nesta jogada.
                    </Text>
                  )}
                  {!pendingPowerHasEnoughCoins ? (
                    <Text style={styles.powerPurchaseInsufficient}>
                      Moedas insuficientes.
                    </Text>
                  ) : null}
                  <View style={styles.purchaseModalActions}>
                    <PrimaryButton
                      disabled={isPowerPurchaseProcessing}
                      size="small"
                      title="Cancelar"
                      variant="secondary"
                      onPress={() => setPendingPowerPurchase(undefined)}
                    />
                    <PrimaryButton
                      disabled={
                        isPowerPurchaseProcessing || !pendingPowerHasEnoughCoins
                      }
                      size="small"
                      title={
                        isPowerPurchaseProcessing
                          ? 'Comprando…'
                          : pendingPowerCanUseImmediately
                            ? 'Comprar e usar'
                            : 'Comprar'
                      }
                      onPress={confirmPendingPowerPurchase}
                    />
                  </View>
                </>
              ) : null}
            </View>
          </SafeAreaView>
        </Modal>
      </ImageBackground>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  // Sem moldura: o tabuleiro flutua sobre o cenário, como no 2a.
  boardArea: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 0,
  },
  boardScaler: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  boardStage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    backgroundColor: colors.backgroundDeep,
    flex: 1,
    marginBottom: -spacing.md,
    marginHorizontal: -spacing.md,
    marginTop: -spacing.md,
    overflow: 'hidden',
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    position: 'relative',
  },
  containerBonus: {
    backgroundColor: '#43204F',
  },
  containerCrystal: {
    backgroundColor: '#21174A',
  },
  containerMountain: {
    backgroundColor: '#12304F',
  },
  gameContent: {
    flex: 1,
    gap: 6,
    position: 'relative',
    zIndex: 2,
  },
  // O HUD deixou de ser painel: as peças flutuam direto sobre o cenário.
  hud: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 58,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  hudNav: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  navButton: {
    alignItems: 'center',
    backgroundColor: '#FFC93F',
    borderBottomColor: '#A9711A',
    borderBottomWidth: 5,
    borderColor: '#FFF6D8',
    borderRadius: 14,
    borderWidth: 3,
    height: 48,
    justifyContent: 'center',
    width: 48,
    ...shadows.button,
  },
  navButtonPressed: {
    opacity: 0.9,
    transform: [{ translateY: 1 }, { scale: 0.96 }],
  },
  resetButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(7, 24, 32, 0.8)',
    borderColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: radii.pill,
    borderWidth: 2,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  settingsNavButton: {
    alignItems: 'center',
    backgroundColor: '#4FBCFF',
    borderColor: '#C8ECFF',
    borderRadius: radii.pill,
    borderWidth: 2,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  meterRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
  },
  meterCount: {
    color: colors.inkOnDark,
    fontSize: 14,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 3,
  },
  meterCountUnit: {
    fontSize: 10,
    fontWeight: '700',
    opacity: 0.75,
  },
  meterFill: {
    backgroundColor: '#22C88C',
    borderRadius: radii.pill,
    height: '100%',
  },
  meterMark: {
    alignItems: 'center',
    backgroundColor: '#FFD35A',
    borderColor: '#FFFFFF',
    borderRadius: radii.pill,
    borderWidth: 2,
    height: 18,
    justifyContent: 'center',
    marginLeft: -9,
    position: 'absolute',
    top: -3,
    width: 18,
  },
  meterMarkText: {
    color: '#8A5200',
    fontSize: 9,
    fontWeight: '900',
    lineHeight: 11,
  },
  // A barra enche até o limite de 2 estrelas, então esse marcador fica no fim.
  meterMarkTwo: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderColor: 'rgba(255, 255, 255, 0.7)',
    height: 16,
    left: '100%',
    marginLeft: -14,
    top: -2,
    width: 16,
  },
  meterMarkTextTwo: {
    color: '#3A2A00',
    fontSize: 9,
    fontWeight: '900',
    lineHeight: 11,
  },
  meterTime: {
    color: colors.inkOnDark,
    fontSize: 15,
    fontWeight: '900',
    minWidth: 46,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 3,
  },
  meterTrack: {
    backgroundColor: 'rgba(7, 24, 32, 0.6)',
    borderRadius: radii.pill,
    flex: 1,
    height: 12,
    position: 'relative',
  },
  hudRight: {
    alignItems: 'flex-end',
    gap: 7,
  },
  coinRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  shopCartButton: {
    alignItems: 'center',
    height: 42,
    justifyContent: 'center',
    // O alvo de toque é maior que o ícone; a margem negativa devolve a folga
    // para a pílula de moedas continuar alinhada com a de vidas.
    marginRight: -6,
    width: 42,
  },
  hudTextBlock: {
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    paddingTop: 1,
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: colors.overlay,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  practicalModalCard: {
    alignItems: 'center',
    backgroundColor: '#FFF5D8',
    borderBottomColor: colors.goldDark,
    borderBottomWidth: 5,
    borderColor: colors.primary,
    borderRadius: 18,
    borderWidth: 3,
    gap: spacing.sm,
    maxWidth: 340,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    width: '88%',
    ...shadows.card,
  },
  practicalModalText: {
    color: colors.muted,
    fontSize: fontSizes.sm,
    fontWeight: '800',
    lineHeight: 20,
    textAlign: 'center',
  },
  practicalModalTitle: {
    color: colors.ink,
    fontSize: fontSizes.lg,
    fontWeight: '900',
    textAlign: 'center',
  },
  practicalTargetCallout: {
    alignSelf: 'center',
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.primary,
    borderRadius: radii.pill,
    borderWidth: 2,
    bottom: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    position: 'absolute',
    zIndex: 6,
    ...shadows.card,
  },
  practicalTargetText: {
    color: colors.ink,
    fontSize: fontSizes.xs,
    fontWeight: '900',
    textAlign: 'center',
  },
  purchaseModalActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  bonusBenefitPill: {
    backgroundColor: '#DFFFF2',
    borderColor: '#42E5A7',
    borderRadius: radii.pill,
    borderWidth: 2,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
  },
  bonusBenefitText: {
    color: '#087A54',
    fontSize: fontSizes.sm,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  bonusModalIcon: {
    alignItems: 'center',
    backgroundColor: '#E9FFF6',
    borderColor: '#7AE7B9',
    borderRadius: radii.pill,
    borderWidth: 2,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  bonusPurchaseModalCard: {
    alignItems: 'center',
    backgroundColor: '#F4FFF8',
    borderBottomColor: '#087A54',
    borderBottomWidth: 5,
    borderColor: '#7AE7B9',
    borderRadius: 20,
    borderWidth: 3,
    gap: spacing.sm,
    maxWidth: 350,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    width: '90%',
    ...shadows.card,
  },
  purchaseModalCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomColor: colors.goldDark,
    borderBottomWidth: 5,
    borderColor: colors.primary,
    borderRadius: 18,
    borderWidth: 3,
    gap: spacing.sm,
    maxWidth: 350,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    width: '90%',
    ...shadows.card,
  },
  purchaseModalText: {
    color: colors.muted,
    fontSize: fontSizes.md,
    fontWeight: '800',
    lineHeight: 22,
    textAlign: 'center',
  },
  purchaseModalTitle: {
    color: colors.ink,
    fontSize: fontSizes.xl,
    fontWeight: '900',
    textAlign: 'center',
  },
  powerBalanceText: {
    color: '#6B4B13',
    fontSize: fontSizes.xs,
    fontWeight: '900',
    marginLeft: spacing.xs,
  },
  powerPriceRow: {
    alignItems: 'center',
    backgroundColor: '#FFF4C9',
    borderColor: '#E8B64B',
    borderRadius: radii.pill,
    borderWidth: 2,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  powerPriceText: {
    color: '#6B3F00',
    fontSize: fontSizes.md,
    fontWeight: '900',
  },
  powerPurchaseCondition: {
    color: '#6A4B74',
    fontSize: fontSizes.xs,
    fontWeight: '800',
    lineHeight: 17,
    textAlign: 'center',
  },
  powerPurchaseConditionReady: {
    color: '#087A54',
    fontSize: fontSizes.xs,
    fontWeight: '900',
    lineHeight: 17,
    textAlign: 'center',
  },
  powerPurchaseIcon: {
    alignItems: 'center',
    backgroundColor: '#EEE9FF',
    borderColor: '#BFA8FF',
    borderRadius: radii.pill,
    borderWidth: 2,
    height: 62,
    justifyContent: 'center',
    width: 62,
  },
  powerPurchaseInsufficient: {
    color: colors.dangerDark,
    fontSize: fontSizes.sm,
    fontWeight: '900',
  },
  powerPurchaseModalCard: {
    alignItems: 'center',
    backgroundColor: '#FFF8E8',
    borderBottomColor: '#4C359E',
    borderBottomWidth: 5,
    borderColor: '#BFA8FF',
    borderRadius: 20,
    borderWidth: 3,
    gap: spacing.sm,
    maxWidth: 350,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    width: '90%',
    ...shadows.card,
  },
  bonusSlotFeedback: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#163D31',
    borderColor: '#7AE7B9',
    borderRadius: radii.pill,
    borderWidth: 2,
    bottom: 76,
    flexDirection: 'row',
    gap: 5,
    maxWidth: '82%',
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    position: 'absolute',
    zIndex: 30,
    ...shadows.card,
  },
  bonusSlotFeedbackText: {
    color: '#E9FFF6',
    fontSize: fontSizes.xs,
    fontWeight: '900',
  },
  bonusSlotIndicator: {
    color: '#BDFBE4',
    fontSize: 9,
    fontWeight: '900',
    marginTop: 2,
  },
  rescueModalCard: {
    alignItems: 'center',
    backgroundColor: '#FFF8E8',
    borderBottomColor: '#7A48D6',
    borderBottomWidth: 5,
    borderColor: '#BFA8FF',
    borderRadius: 18,
    borderWidth: 3,
    gap: spacing.sm,
    maxWidth: 360,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    width: '90%',
    ...shadows.card,
  },
  rescueModalHint: {
    color: '#6D3FD1',
    fontSize: fontSizes.sm,
    fontWeight: '900',
    lineHeight: 20,
    textAlign: 'center',
  },
  sceneGlow: {
    borderRadius: radii.pill,
    position: 'absolute',
  },
  sceneGlowBottom: {
    backgroundColor: 'rgba(255, 109, 158, 0.24)',
    bottom: -72,
    height: 210,
    right: -72,
    width: 260,
  },
  sceneGlowTop: {
    backgroundColor: 'rgba(66, 229, 167, 0.22)',
    height: 180,
    left: -70,
    top: -60,
    width: 260,
  },
  sceneImage: {
    opacity: 0.96,
  },
  sceneOverlay: {
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1,
  },
  sceneWash: {
    backgroundColor: 'rgba(5, 20, 26, 0.16)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  sceneWashBottom: {
    backgroundColor: 'rgba(7, 24, 32, 0.24)',
    bottom: 0,
    height: 190,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  sceneWashBottomBonus: {
    backgroundColor: 'rgba(85, 12, 82, 0.22)',
  },
  sceneWashBottomCrystal: {
    backgroundColor: 'rgba(30, 14, 82, 0.22)',
  },
  sceneWashCrystal: {
    backgroundColor: 'rgba(18, 14, 54, 0.18)',
  },
  sceneWashMountain: {
    backgroundColor: 'rgba(4, 18, 36, 0.18)',
  },
  toast: {
    alignSelf: 'center',
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.primary,
    borderRadius: radii.card,
    borderWidth: 2,
    left: spacing.md,
    maxWidth: '92%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    position: 'absolute',
    right: spacing.md,
    top: 116,
    zIndex: 30,
    ...shadows.card,
  },
  toastText: {
    color: colors.ink,
    fontSize: fontSizes.sm,
    fontWeight: '900',
    textAlign: 'center',
  },
  // A bandeja de madeira já é a moldura — o dock escuro em volta virou ruído.
  trayDock: {
    paddingHorizontal: 2,
  },
  trayControlRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 8,
    paddingHorizontal: 4,
  },
  trayLabel: {
    color: '#FFE9A8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 3,
    textTransform: 'uppercase',
  },
  trayLabelDanger: {
    color: '#FF8BA9',
  },
  trayStatus: {
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    minHeight: 30,
  },
});
