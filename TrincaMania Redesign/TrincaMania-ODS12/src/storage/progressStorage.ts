import AsyncStorage from '@react-native-async-storage/async-storage';

import { LEVEL_BY_ID, LEVELS } from '../data/levels';
import { WORLDS, getWorldById } from '../data/worlds';
import {
  ChestProgressSummary,
  PowerUpInventory,
  PowerUpType,
  ProgressState,
  WorldChestOpenMode,
  WorldChestOpenResult,
  WorldChestSummary,
  WorldId,
} from '../types/game';
import {
  POWER_UP_COSTS,
  getIncrementalCoinRewardForLevel,
  isBonusLevel,
} from '../utils/gameLogic';
import { isBonusWorldUnlocked } from '../utils/worldProgress';

const STORAGE_KEY = '@trinca-mania/progress-v2';
const TUTORIAL_STORAGE_KEY = '@trinca-mania/tutorial-seen-v1';
export const PRACTICAL_TUTORIAL_STORAGE_KEY =
  '@trinca-mania/practical-tutorial-seen-v1';
export const MYSTERY_TUTORIAL_STORAGE_KEY =
  '@trinca-mania/mystery-tutorial-seen-v1';
const CAMPAIGN_RESIZE_NOTICE_STORAGE_KEY =
  '@trinca-mania/campaign-resize-notice-seen-v1';
export const CHEST_PHASES_REQUIRED = 5;
export const CHEST_COIN_REWARD = 50;
export const KEY_COST = 100;
export const WORLD_CHEST_COINS_WITH_LIFE = 100;
export const WORLD_CHEST_COINS_FULL_LIVES = 150;
const BONUS_WORLD_ID: WorldId = 21;
const BONUS_WORLD_CHEST_ID = 'bonus-world-21';
const BONUS_WORLD_CHEST_SUMMARY: WorldChestSummary = {
  id: BONUS_WORLD_CHEST_ID,
  isNew: true,
  worldId: BONUS_WORLD_ID,
};
const LEVEL_IDS = LEVELS.map((level) => level.id);
const LEVEL_ID_SET = new Set(LEVEL_IDS);
const LEVEL_INDEX_BY_ID = new Map(
  LEVEL_IDS.map((levelId, index) => [levelId, index]),
);
const POWER_UP_TYPES: PowerUpType[] = ['hint', 'shuffle', 'undo'];
const WORLD_CHEST_IDS = [BONUS_WORLD_CHEST_SUMMARY.id];

export type LevelCompletionResult = {
  bonusWorldAchievementUnlocked: boolean;
  coinsEarned: number;
  chestProgress: ChestProgressSummary;
  progress: ProgressState;
  savedStars: number;
  starsEarned: number;
  worldChest?: WorldChestSummary;
  unlockedLevelTitle?: string;
  unlockedWorldId?: WorldId;
};

const uniqueKnownLevelIds = (ids: unknown): string[] => {
  if (!Array.isArray(ids)) {
    return [];
  }

  return Array.from(
    new Set(ids.filter((id): id is string => LEVEL_ID_SET.has(id))),
  );
};

const isChestEligibleLevelId = (levelId: string) => {
  const level = LEVEL_BY_ID.get(levelId);

  return level !== undefined && !isBonusLevel(level);
};

const uniqueKnownChestLevelIds = (ids: unknown): string[] =>
  uniqueKnownLevelIds(ids).filter(isChestEligibleLevelId);

const uniqueWorldChestIds = (ids: unknown): string[] => {
  if (!Array.isArray(ids)) {
    return [];
  }

  return Array.from(
    new Set(ids.filter((id): id is string => WORLD_CHEST_IDS.includes(id))),
  );
};

export const createChestProgressSummary = (
  completedCount: number,
  isLevelCounted: boolean,
): ChestProgressSummary => {
  const normalizedCompletedCount = Math.max(0, Math.floor(completedCount));
  const nextChestProgress = normalizedCompletedCount % CHEST_PHASES_REQUIRED;
  const opened = isLevelCounted && nextChestProgress === 0;
  const progressCount = opened ? CHEST_PHASES_REQUIRED : nextChestProgress;

  return {
    completedCount: normalizedCompletedCount,
    isLevelCounted,
    opened,
    progressCount,
    remainingCount: opened ? 0 : CHEST_PHASES_REQUIRED - progressCount,
    requiredCount: CHEST_PHASES_REQUIRED,
  };
};

const normalizeStars = (stars: unknown) => {
  if (!stars || typeof stars !== 'object' || Array.isArray(stars)) {
    return {};
  }

  return Object.entries(stars).reduce<Record<string, number>>(
    (knownStars, [levelId, value]) => {
      if (!LEVEL_ID_SET.has(levelId) || typeof value !== 'number') {
        return knownStars;
      }

      knownStars[levelId] = Math.max(1, Math.min(3, Math.floor(value)));
      return knownStars;
    },
    {},
  );
};

const hasThreeStarsInWorldByStars = (
  worldId: WorldId,
  levelStars: Record<string, number>,
) => {
  const worldLevels = LEVELS.filter((level) => level.worldId === worldId);

  return (
    worldLevels.length > 0 &&
    worldLevels.every((level) => levelStars[level.id] === 3)
  );
};

const getBonusLevels = () =>
  LEVELS.filter((level) => level.worldId === BONUS_WORLD_ID);

const getCompletedBonusLevelCount = (
  completedLevelIds: string[],
  levelStars: Record<string, number>,
) =>
  getBonusLevels().filter(
    (level) =>
      completedLevelIds.includes(level.id) || (levelStars[level.id] ?? 0) > 0,
  ).length;

const isBonusWorldChestUnlockedByProgress = (
  completedLevelIds: string[],
  levelStars: Record<string, number>,
) => {
  const bonusLevels = getBonusLevels();

  return (
    bonusLevels.length > 0 &&
    getCompletedBonusLevelCount(completedLevelIds, levelStars) ===
      bonusLevels.length
  );
};

const getFirstBonusLevelIds = () => {
  const bonusWorldIds = new Set(
    LEVELS.filter((level) => getWorldById(level.worldId).isBonus).map(
      (level) => level.worldId,
    ),
  );

  return Array.from(bonusWorldIds)
    .map((worldId) =>
      LEVELS.find(
        (level) => level.worldId === worldId && level.worldLevelNumber === 1,
      ),
    )
    .filter((level): level is (typeof LEVELS)[number] => level !== undefined)
    .map((level) => level.id);
};

const canUnlockLevel = (
  levelId: string,
  levelStars: Record<string, number>,
) => {
  const level = LEVEL_BY_ID.get(levelId);

  if (!level) {
    return false;
  }

  if (getWorldById(level.worldId).isBonus) {
    return hasThreeStarsInWorldByStars(1, levelStars);
  }

  return true;
};

export const createInitialItemCounts = (): PowerUpInventory => ({
  hint: 0,
  shuffle: 0,
  undo: 0,
});

const normalizeItemCounts = (itemCounts: unknown): PowerUpInventory => {
  const normalizedCounts = createInitialItemCounts();

  if (
    !itemCounts ||
    typeof itemCounts !== 'object' ||
    Array.isArray(itemCounts)
  ) {
    return normalizedCounts;
  }

  POWER_UP_TYPES.forEach((powerType) => {
    const value = (itemCounts as Partial<Record<PowerUpType, unknown>>)[
      powerType
    ];

    if (typeof value === 'number') {
      normalizedCounts[powerType] = Math.max(0, Math.floor(value));
    }
  });

  return normalizedCounts;
};

export const createInitialProgress = (): ProgressState => ({
  bonusWorldAchievementShown: false,
  chestProgressLevelIds: [],
  claimedWorldChestIds: [],
  collectedRestCheckpointIds: [],
  coins: 0,
  completedLevelIds: [],
  itemCounts: createInitialItemCounts(),
  keys: 0,
  levelStars: {},
  pendingWorldChestIds: [],
  unlockedLevelIds: LEVEL_IDS[0] ? [LEVEL_IDS[0]] : [],
});

export const normalizeProgress = (
  progress: Partial<ProgressState>,
): ProgressState => {
  const completedLevelIds = uniqueKnownLevelIds(progress.completedLevelIds);
  const chestProgressLevelIds = Array.isArray(progress.chestProgressLevelIds)
    ? uniqueKnownChestLevelIds(progress.chestProgressLevelIds)
    : uniqueKnownChestLevelIds(completedLevelIds);
  const chestProgressSet = new Set(chestProgressLevelIds);
  const claimedWorldChestIds = uniqueWorldChestIds(
    progress.claimedWorldChestIds,
  );
  const pendingWorldChestIds = uniqueWorldChestIds(
    progress.pendingWorldChestIds,
  ).filter((worldChestId) => !claimedWorldChestIds.includes(worldChestId));
  const pendingWorldChestSet = new Set(pendingWorldChestIds);
  const unlockedSet = new Set(uniqueKnownLevelIds(progress.unlockedLevelIds));
  const levelStars = normalizeStars(progress.levelStars);

  if (LEVEL_IDS[0]) {
    unlockedSet.add(LEVEL_IDS[0]);
  }

  completedLevelIds.forEach((levelId) => {
    const levelIndex = LEVEL_INDEX_BY_ID.get(levelId) ?? -1;
    unlockedSet.add(levelId);

    const nextLevelId = LEVEL_IDS[levelIndex + 1];
    if (nextLevelId && canUnlockLevel(nextLevelId, levelStars)) {
      unlockedSet.add(nextLevelId);
    }

    if (!levelStars[levelId]) {
      levelStars[levelId] = 1;
    }
  });

  getFirstBonusLevelIds().forEach((levelId) => {
    if (canUnlockLevel(levelId, levelStars)) {
      unlockedSet.add(levelId);
    }
  });

  if (
    isBonusWorldChestUnlockedByProgress(completedLevelIds, levelStars) &&
    !claimedWorldChestIds.includes(BONUS_WORLD_CHEST_ID)
  ) {
    pendingWorldChestSet.add(BONUS_WORLD_CHEST_ID);
  } else {
    pendingWorldChestSet.delete(BONUS_WORLD_CHEST_ID);
  }

  return {
    bonusWorldAchievementShown: progress.bonusWorldAchievementShown === true,
    chestProgressLevelIds: LEVEL_IDS.filter((levelId) =>
      chestProgressSet.has(levelId),
    ),
    claimedWorldChestIds: WORLD_CHEST_IDS.filter((worldChestId) =>
      claimedWorldChestIds.includes(worldChestId),
    ),
    collectedRestCheckpointIds: uniqueKnownLevelIds(
      progress.collectedRestCheckpointIds,
    ),
    coins:
      typeof progress.coins === 'number'
        ? Math.max(0, Math.floor(progress.coins))
        : 0,
    completedLevelIds,
    itemCounts: normalizeItemCounts(progress.itemCounts),
    keys:
      typeof progress.keys === 'number'
        ? Math.max(0, Math.floor(progress.keys))
        : 0,
    levelStars,
    pendingWorldChestIds: WORLD_CHEST_IDS.filter((worldChestId) =>
      pendingWorldChestSet.has(worldChestId),
    ),
    unlockedLevelIds: LEVEL_IDS.filter(
      (levelId) =>
        unlockedSet.has(levelId) && canUnlockLevel(levelId, levelStars),
    ),
  };
};

/**
 * Modo dev: libera todas as fases da campanha (incluindo o mundo bônus) para
 * teste, sem passar pelo fluxo normal de conclusão.
 *
 * `canUnlockLevel` só deixa `unlockedLevelIds` conter fases bônus quando o
 * mundo 1 tem três estrelas em toda fase (`hasThreeStarsInWorldByStars`) — por
 * isso a estrela de cada fase do mundo 1 é forçada para 3 aqui, senão
 * `normalizeProgress` continuaria filtrando o bônus fora da lista liberada.
 */
export const unlockAllLevelsForDevMode = (
  progress: ProgressState,
): ProgressState => {
  const currentProgress = normalizeProgress(progress);
  const levelStars = { ...currentProgress.levelStars };

  LEVELS.filter((level) => level.worldId === 1).forEach((level) => {
    levelStars[level.id] = Math.max(levelStars[level.id] ?? 0, 3);
  });

  return normalizeProgress({
    ...currentProgress,
    levelStars,
    unlockedLevelIds: LEVEL_IDS,
  });
};

export const applyLevelCompletion = (
  progress: ProgressState,
  levelId: string,
  starsEarned: number,
): LevelCompletionResult => {
  const currentProgress = normalizeProgress(progress);
  const completedSet = new Set(currentProgress.completedLevelIds);
  const chestProgressSet = new Set(currentProgress.chestProgressLevelIds);
  const previouslyUnlockedIds = new Set(currentProgress.unlockedLevelIds);
  const bonusUnlockedBefore = isBonusWorldUnlocked(currentProgress);
  const normalizedStars = Math.max(1, Math.min(3, Math.floor(starsEarned)));
  const previousStars = currentProgress.levelStars[levelId] ?? 0;
  const savedStars = Math.max(previousStars, normalizedStars);
  const completedLevel = LEVELS.find((level) => level.id === levelId);
  const isFirstNormalCompletion =
    completedLevel !== undefined &&
    !completedSet.has(levelId) &&
    isChestEligibleLevelId(levelId);
  const coinsEarned = getIncrementalCoinRewardForLevel(
    previousStars,
    normalizedStars,
    completedLevel,
  );

  completedSet.add(levelId);

  if (isFirstNormalCompletion) {
    chestProgressSet.add(levelId);
  }

  const chestProgressLevelIds = LEVEL_IDS.filter((knownLevelId) =>
    chestProgressSet.has(knownLevelId),
  );
  const nextProgress = normalizeProgress({
    ...currentProgress,
    chestProgressLevelIds,
    coins: currentProgress.coins + coinsEarned,
    completedLevelIds: LEVEL_IDS.filter((knownLevelId) =>
      completedSet.has(knownLevelId),
    ),
    levelStars: {
      ...currentProgress.levelStars,
      [levelId]: savedStars,
    },
    pendingWorldChestIds: currentProgress.pendingWorldChestIds,
  });

  const newlyUnlockedLevel = LEVELS.find(
    (level) =>
      !previouslyUnlockedIds.has(level.id) &&
      nextProgress.unlockedLevelIds.includes(level.id),
  );
  const newlyUnlockedWorld =
    completedLevel &&
    newlyUnlockedLevel &&
    completedLevel.worldId !== newlyUnlockedLevel.worldId
      ? getWorldById(newlyUnlockedLevel.worldId)
      : undefined;
  const bonusWorldAchievementUnlocked =
    !currentProgress.bonusWorldAchievementShown &&
    !bonusUnlockedBefore &&
    isBonusWorldUnlocked(nextProgress);

  return {
    bonusWorldAchievementUnlocked,
    chestProgress: createChestProgressSummary(
      nextProgress.chestProgressLevelIds.length,
      isFirstNormalCompletion,
    ),
    coinsEarned,
    progress: nextProgress,
    savedStars,
    starsEarned: normalizedStars,
    unlockedLevelTitle: newlyUnlockedWorld
      ? `${newlyUnlockedWorld.label} desbloqueado! ${newlyUnlockedWorld.name} está disponível.`
      : newlyUnlockedLevel?.title,
    unlockedWorldId: newlyUnlockedWorld?.id,
  };
};

export const grantChestCoinReward = (
  progress: ProgressState,
  amount = CHEST_COIN_REWARD,
): ProgressState =>
  normalizeProgress({
    ...progress,
    coins: progress.coins + Math.max(0, Math.floor(amount)),
  });

export const getBonusWorldChestId = () => BONUS_WORLD_CHEST_ID;

export const getBonusWorldChestProgress = (progress: ProgressState) => {
  const normalizedProgress = normalizeProgress(progress);
  const bonusLevels = getBonusLevels();
  const completedCount = getCompletedBonusLevelCount(
    normalizedProgress.completedLevelIds,
    normalizedProgress.levelStars,
  );
  const claimed =
    normalizedProgress.claimedWorldChestIds.includes(BONUS_WORLD_CHEST_ID);
  const available =
    bonusLevels.length > 0 && completedCount === bonusLevels.length && !claimed;

  return {
    available,
    claimed,
    completedCount,
    id: BONUS_WORLD_CHEST_ID,
    totalCount: bonusLevels.length,
  };
};

export const getWorldChestIdForLevel = (_levelId: string) => undefined;

export const getWorldChestLabel = (worldChestId: string) => {
  if (worldChestId === BONUS_WORLD_CHEST_ID) {
    return 'Jardim Renascido: Baú Especial';
  }

  const world = WORLDS.find(
    (knownWorld) => `world-${knownWorld.id}` === worldChestId,
  );

  return world ? `${world.label}: ${world.name}` : 'Baú Especial';
};

export const addKey = (progress: ProgressState, amount = 1): ProgressState =>
  normalizeProgress({
    ...progress,
    keys: progress.keys + Math.max(0, Math.floor(amount)),
  });

export const spendKey = (
  progress: ProgressState,
): ProgressState | undefined => {
  if (progress.keys <= 0) {
    return undefined;
  }

  return normalizeProgress({
    ...progress,
    keys: progress.keys - 1,
  });
};

export const buyKeyWithCoins = (
  progress: ProgressState,
  cost = KEY_COST,
): ProgressState | undefined => {
  const normalizedCost = Math.max(0, Math.floor(cost));

  if (progress.coins < normalizedCost) {
    return undefined;
  }

  return normalizeProgress({
    ...progress,
    coins: progress.coins - normalizedCost,
    keys: progress.keys + 1,
  });
};

export const openWorldChest = (
  progress: ProgressState,
  worldChestId: string,
  mode: WorldChestOpenMode,
  livesAreFull: boolean,
): WorldChestOpenResult => {
  const currentProgress = normalizeProgress(progress);

  if (!WORLD_CHEST_IDS.includes(worldChestId)) {
    return {
      keyPurchased: false,
      progress: currentProgress,
      status: 'unavailable',
      worldChestId,
    };
  }

  if (currentProgress.claimedWorldChestIds.includes(worldChestId)) {
    return {
      keyPurchased: false,
      progress: currentProgress,
      status: 'already-opened',
      worldChestId,
    };
  }

  if (!currentProgress.pendingWorldChestIds.includes(worldChestId)) {
    return {
      keyPurchased: false,
      progress: currentProgress,
      status: 'unavailable',
      worldChestId,
    };
  }

  let nextCoins = currentProgress.coins;
  let nextKeys = currentProgress.keys;
  let keyPurchased = false;

  if (nextKeys > 0) {
    nextKeys -= 1;
  } else {
    if (mode !== 'buy-key') {
      return {
        keyPurchased: false,
        progress: currentProgress,
        status: 'no-key',
        worldChestId,
      };
    }

    if (nextCoins < KEY_COST) {
      return {
        keyPurchased: false,
        progress: currentProgress,
        status: 'insufficient-coins',
        worldChestId,
      };
    }

    nextCoins -= KEY_COST;
    keyPurchased = true;
  }

  const coinReward = livesAreFull
    ? WORLD_CHEST_COINS_FULL_LIVES
    : WORLD_CHEST_COINS_WITH_LIFE;
  const rewardItemCounts = createInitialItemCounts();
  rewardItemCounts.hint = 1;
  rewardItemCounts.shuffle = 1;
  rewardItemCounts.undo = 1;

  const nextProgress = normalizeProgress({
    ...currentProgress,
    claimedWorldChestIds: [
      ...currentProgress.claimedWorldChestIds,
      worldChestId,
    ],
    coins: nextCoins + coinReward,
    itemCounts: {
      hint: currentProgress.itemCounts.hint + rewardItemCounts.hint,
      shuffle: currentProgress.itemCounts.shuffle + rewardItemCounts.shuffle,
      undo: currentProgress.itemCounts.undo + rewardItemCounts.undo,
    },
    keys: nextKeys,
    pendingWorldChestIds: currentProgress.pendingWorldChestIds.filter(
      (pendingWorldChestId) => pendingWorldChestId !== worldChestId,
    ),
  });

  return {
    keyPurchased,
    progress: nextProgress,
    reward: {
      coins: coinReward,
      itemCounts: rewardItemCounts,
      lifeGranted: !livesAreFull,
    },
    status: 'opened',
    worldChestId,
  };
};

export const spendCoins = (
  progress: ProgressState,
  cost: number,
): ProgressState =>
  normalizeProgress({
    ...progress,
    coins: Math.max(0, progress.coins - cost),
  });

export const collectRestCheckpoint = (
  progress: ProgressState,
  afterLevelId: string,
  coinReward = 0,
): ProgressState => {
  if (!LEVEL_IDS.includes(afterLevelId)) {
    return normalizeProgress(progress);
  }

  const collectedSet = new Set(progress.collectedRestCheckpointIds);
  collectedSet.add(afterLevelId);

  return normalizeProgress({
    ...progress,
    collectedRestCheckpointIds: LEVEL_IDS.filter((levelId) =>
      collectedSet.has(levelId),
    ),
    coins: progress.coins + Math.max(0, Math.floor(coinReward)),
  });
};

export const markBonusWorldAchievementShown = (
  progress: ProgressState,
): ProgressState =>
  normalizeProgress({
    ...progress,
    bonusWorldAchievementShown: true,
  });

export const buyPowerUpItem = (
  progress: ProgressState,
  powerType: PowerUpType,
  cost: number,
): ProgressState => {
  if (progress.coins < cost) {
    return normalizeProgress(progress);
  }

  return normalizeProgress({
    ...progress,
    coins: progress.coins - cost,
    itemCounts: {
      ...progress.itemCounts,
      [powerType]: progress.itemCounts[powerType] + 1,
    },
  });
};

export const consumePowerUpItem = (
  progress: ProgressState,
  powerType: PowerUpType,
): ProgressState => {
  if (progress.itemCounts[powerType] <= 0) {
    return normalizeProgress(progress);
  }

  return normalizeProgress({
    ...progress,
    itemCounts: {
      ...progress.itemCounts,
      [powerType]: progress.itemCounts[powerType] - 1,
    },
  });
};

// Compensação usada somente quando uma compra-e-uso já foi persistida, mas a
// rodada que autorizou o efeito deixou de existir antes da aplicação visual.
export const restorePurchasedPowerUpItem = (
  progress: ProgressState,
  powerType: PowerUpType,
): ProgressState => {
  const currentProgress = normalizeProgress(progress);

  return normalizeProgress({
    ...currentProgress,
    itemCounts: {
      ...currentProgress.itemCounts,
      [powerType]: currentProgress.itemCounts[powerType] + 1,
    },
  });
};

/**
 * Compra uma unidade pelo preço canônico e, opcionalmente, consome essa mesma
 * unidade no mesmo snapshot. O chamador persiste apenas o estado retornado, de
 * modo que moedas e inventário nunca ficam parcialmente atualizados.
 */
export const purchasePowerUpTransaction = (
  progress: ProgressState,
  powerType: PowerUpType,
  useImmediately: boolean,
): ProgressState | undefined => {
  const currentProgress = normalizeProgress(progress);
  const cost = POWER_UP_COSTS[powerType];

  if (currentProgress.coins < cost) {
    return undefined;
  }

  const purchasedProgress = buyPowerUpItem(currentProgress, powerType, cost);

  return useImmediately
    ? consumePowerUpItem(purchasedProgress, powerType)
    : purchasedProgress;
};

export const loadProgress = async (): Promise<ProgressState> => {
  const rawProgress = await AsyncStorage.getItem(STORAGE_KEY);

  if (!rawProgress) {
    return createInitialProgress();
  }

  try {
    return normalizeProgress(JSON.parse(rawProgress) as Partial<ProgressState>);
  } catch {
    return createInitialProgress();
  }
};

export const saveProgress = async (progress: ProgressState) => {
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(normalizeProgress(progress)),
  );
};

export type ProgressMigrationInfo = {
  droppedLevelCount: number;
};

const CAMPAIGN_LEVEL_ID_PATTERN = /^w\d+-\d{3}$/;

/**
 * `normalizeProgress` descarta id de fase desconhecido em silêncio
 * (invariante #3 do CLAUDE.md) — necessário para não quebrar o boot com save
 * de formato antigo, mas isso por si só nunca avisa o jogador quando uma
 * reestruturação de campanha (como 203→103 fases) apaga progresso real.
 *
 * Função pura e reutilizável para qualquer reestruturação futura: compara os
 * ids de fase (`wN-NNN`, nunca bônus nem capítulo) do save bruto contra
 * `LEVEL_ID_SET` atual e conta quantos não existem mais, para a UI decidir se
 * mostra um aviso — sem inventar dado nem bloquear o carregamento.
 */
export const detectDroppedCampaignProgress = (
  raw: Partial<ProgressState> | null | undefined,
): ProgressMigrationInfo => {
  const rawCompletedLevelIds = Array.isArray(raw?.completedLevelIds)
    ? raw.completedLevelIds
    : [];
  const rawCampaignLevelIds = rawCompletedLevelIds.filter(
    (id): id is string =>
      typeof id === 'string' && CAMPAIGN_LEVEL_ID_PATTERN.test(id),
  );
  const stillKnownCount = rawCampaignLevelIds.filter((id) =>
    LEVEL_ID_SET.has(id),
  ).length;

  return { droppedLevelCount: rawCampaignLevelIds.length - stillKnownCount };
};

/**
 * Lê o save bruto (sem normalizar) só para detectar progresso de campanha
 * apagado por uma reestruturação — não substitui `loadProgress`, roda em
 * paralelo a ele.
 */
export const loadStoredProgressMigrationInfo =
  async (): Promise<ProgressMigrationInfo> => {
    const rawProgress = await AsyncStorage.getItem(STORAGE_KEY);

    if (!rawProgress) {
      return { droppedLevelCount: 0 };
    }

    try {
      return detectDroppedCampaignProgress(
        JSON.parse(rawProgress) as Partial<ProgressState>,
      );
    } catch {
      return { droppedLevelCount: 0 };
    }
  };

export const getCampaignResizeNoticeSeen = async () => {
  const rawValue = await AsyncStorage.getItem(
    CAMPAIGN_RESIZE_NOTICE_STORAGE_KEY,
  );
  return rawValue === 'true';
};

export const saveCampaignResizeNoticeSeen = async (seen: boolean) => {
  await AsyncStorage.setItem(
    CAMPAIGN_RESIZE_NOTICE_STORAGE_KEY,
    seen ? 'true' : 'false',
  );
};

export const getTutorialSeen = async () => {
  const rawValue = await AsyncStorage.getItem(TUTORIAL_STORAGE_KEY);
  return rawValue === 'true';
};

export const saveTutorialSeen = async (seen: boolean) => {
  await AsyncStorage.setItem(TUTORIAL_STORAGE_KEY, seen ? 'true' : 'false');
};

export const getPracticalTutorialSeen = async () => {
  const rawValue = await AsyncStorage.getItem(PRACTICAL_TUTORIAL_STORAGE_KEY);
  return rawValue === 'true';
};

export const savePracticalTutorialSeen = async (seen: boolean) => {
  await AsyncStorage.setItem(
    PRACTICAL_TUTORIAL_STORAGE_KEY,
    seen ? 'true' : 'false',
  );
};

export const getMysteryTutorialSeen = async () => {
  const rawValue = await AsyncStorage.getItem(MYSTERY_TUTORIAL_STORAGE_KEY);
  return rawValue === 'true';
};

export const saveMysteryTutorialSeen = async (seen: boolean) => {
  await AsyncStorage.setItem(
    MYSTERY_TUTORIAL_STORAGE_KEY,
    seen ? 'true' : 'false',
  );
};
