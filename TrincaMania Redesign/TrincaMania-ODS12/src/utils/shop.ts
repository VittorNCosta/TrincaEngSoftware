import { LEVELS } from '../data/levels';
import { WORLDS, getWorldById } from '../data/worlds';
import { ProgressState } from '../types/game';

export const SHOP_INTERVAL = 5;

export const REST_CHECKPOINT_COIN_REWARDS: Record<number, number> = {
  5: 15,
  10: 20,
  15: 25,
  20: 30,
  25: 40,
};

const getLevelById = (levelId: string) =>
  LEVELS.find((knownLevel) => knownLevel.id === levelId);

const getWorldLevelIds = (levelId: string) => {
  const level = getLevelById(levelId);

  if (!level) {
    return [];
  }

  const world = getWorldById(level.worldId);

  return world.levelIds.length > 0
    ? world.levelIds
    : LEVELS.filter((knownLevel) => knownLevel.worldId === level.worldId).map(
        (knownLevel) => knownLevel.id,
      );
};

const getLocalLevelNumber = (levelId: string) => {
  const level = getLevelById(levelId);

  if (!level) {
    return undefined;
  }

  if (level.worldLevelNumber > 0) {
    return level.worldLevelNumber;
  }

  const worldLevelIds = getWorldLevelIds(levelId);
  const index = worldLevelIds.indexOf(levelId);

  return index >= 0 ? index + 1 : undefined;
};

export const shouldShowShopAfterLevel = (levelId: string) => {
  const level = getLevelById(levelId);
  const localLevelNumber = getLocalLevelNumber(levelId);

  if (!level || !localLevelNumber || getWorldById(level.worldId).isBonus) {
    return false;
  }

  return localLevelNumber % SHOP_INTERVAL === 0;
};

export const isShopUnlockedAfterLevel = (
  levelId: string,
  progress: ProgressState,
) => progress.completedLevelIds.includes(levelId);

export const getRestCheckpointCoinReward = (levelId: string) => {
  const localLevelNumber = getLocalLevelNumber(levelId);

  return localLevelNumber
    ? (REST_CHECKPOINT_COIN_REWARDS[localLevelNumber] ?? 0)
    : 0;
};

const isLastLevelInWorld = (levelId: string) => {
  const worldLevelIds = getWorldLevelIds(levelId);

  return worldLevelIds[worldLevelIds.length - 1] === levelId;
};

export const getNextWorldLevelAfterLevel = (levelId: string) => {
  const level = getLevelById(levelId);

  if (!level || !isLastLevelInWorld(levelId)) {
    return undefined;
  }

  const world = getWorldById(level.worldId);

  if (world.isBonus) {
    return undefined;
  }

  const mainWorlds = WORLDS.filter((knownWorld) => !knownWorld.isBonus);
  const worldIndex = mainWorlds.findIndex(
    (knownWorld) => knownWorld.id === world.id,
  );
  const nextWorld = mainWorlds[worldIndex + 1];

  if (!nextWorld) {
    return undefined;
  }

  return LEVELS.find((knownLevel) => knownLevel.id === nextWorld.levelIds[0]);
};

export const shouldShowWorldPortalAfterLevel = (levelId: string) =>
  getNextWorldLevelAfterLevel(levelId) !== undefined;

export const isLastKnownShopMarker = (levelId: string) => {
  const level = getLevelById(levelId);

  if (!level || !isLastLevelInWorld(levelId)) {
    return false;
  }

  const world = getWorldById(level.worldId);

  if (world.isBonus || getNextWorldLevelAfterLevel(levelId)) {
    return false;
  }

  return true;
};
