import { LEVELS } from '../data/levels';
import { WORLDS, getWorldById } from '../data/worlds';

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
