import { LEVEL_BY_ID, LEVELS } from '../data/levels';
import { WORLDS, getWorldById } from '../data/worlds';
import { Level, ProgressState, WorldId } from '../types/game';

// A lista de fases de um mundo é estática, então é resolvida uma única vez.
const levelsByWorld = new Map<WorldId, Level[]>();

export const getLevelsForWorld = (worldId: WorldId) => {
  const cachedLevels = levelsByWorld.get(worldId);

  if (cachedLevels) {
    return cachedLevels;
  }

  const levels = getWorldById(worldId)
    .levelIds.map((levelId) => LEVEL_BY_ID.get(levelId))
    .filter((level): level is Level => level !== undefined);

  levelsByWorld.set(worldId, levels);

  return levels;
};

export const hasThreeStarsInWorld = (
  worldId: WorldId,
  progress: ProgressState,
) => {
  const levels = getLevelsForWorld(worldId);

  return (
    levels.length > 0 &&
    levels.every((level) => progress.levelStars[level.id] === 3)
  );
};

export const isBonusWorldUnlocked = (progress: ProgressState) =>
  hasThreeStarsInWorld(1, progress);

export const isWorldUnlocked = (worldId: WorldId, progress: ProgressState) => {
  const world = getWorldById(worldId);

  if (world.unlockRule === 'three-stars-world-1') {
    return isBonusWorldUnlocked(progress);
  }

  if (world.unlockRule === 'three-stars-world-2') {
    return hasThreeStarsInWorld(2, progress);
  }

  if (world.unlockAfterLevelId) {
    return progress.completedLevelIds.includes(world.unlockAfterLevelId);
  }

  return true;
};

export const getUnlockedWorlds = (progress: ProgressState) =>
  WORLDS.filter((world) => isWorldUnlocked(world.id, progress));

export const getWorldProgress = (worldId: WorldId, progress: ProgressState) => {
  const levels = getLevelsForWorld(worldId);
  const completedCount = levels.filter((level) =>
    progress.completedLevelIds.includes(level.id),
  ).length;
  const totalCount = levels.length;

  return {
    completedCount,
    levels,
    progressPercent: totalCount > 0 ? (completedCount / totalCount) * 100 : 0,
    totalCount,
    worldComplete: totalCount > 0 && completedCount === totalCount,
  };
};

export const getNextPlayableLevel = (
  progress: ProgressState,
): Level | undefined => {
  const nextIncompleteLevel = LEVELS.find(
    (level) =>
      progress.unlockedLevelIds.includes(level.id) &&
      !progress.completedLevelIds.includes(level.id),
  );

  if (nextIncompleteLevel) {
    return nextIncompleteLevel;
  }

  const unlockedLevels = LEVELS.filter((level) =>
    progress.unlockedLevelIds.includes(level.id),
  );

  return unlockedLevels[unlockedLevels.length - 1] ?? LEVELS[0];
};

export const getCurrentWorldId = (progress: ProgressState): WorldId =>
  getNextPlayableLevel(progress)?.worldId ?? 1;

export const getCurrentLevelForWorld = (
  worldId: WorldId,
  progress: ProgressState,
): Level | undefined => {
  const levels = getLevelsForWorld(worldId);
  const nextLevel = levels.find(
    (level) =>
      progress.unlockedLevelIds.includes(level.id) &&
      !progress.completedLevelIds.includes(level.id),
  );

  if (nextLevel) {
    return nextLevel;
  }

  const unlockedLevels = levels.filter((level) =>
    progress.unlockedLevelIds.includes(level.id),
  );

  return unlockedLevels[unlockedLevels.length - 1] ?? levels[0];
};
