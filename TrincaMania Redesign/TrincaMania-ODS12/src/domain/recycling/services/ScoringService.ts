import { Level } from '../../../types/game';

export type StarRating = 1 | 2 | 3;

export type VictoryResultSnapshot = {
  earnedStars: StarRating;
  elapsedSeconds: number;
  isNewRecord: boolean;
  previousBestStars: number;
  savedStars: StarRating;
};

type VictoryResultSnapshotInput = {
  elapsedSeconds: number;
  level: Level;
  previousBestStars?: number;
};

const normalizeElapsedSeconds = (elapsedSeconds: number) =>
  Number.isFinite(elapsedSeconds)
    ? Math.max(0, Math.floor(elapsedSeconds))
    : Number.MAX_SAFE_INTEGER;

const normalizePreviousBestStars = (stars: number) =>
  Number.isFinite(stars) ? Math.max(0, Math.min(3, Math.floor(stars))) : 0;

export const calculateStarsByTime = (
  elapsedSeconds: number,
  level: Level,
): StarRating => {
  const frozenElapsedSeconds = normalizeElapsedSeconds(elapsedSeconds);

  if (frozenElapsedSeconds <= level.starTimeLimits.threeStars) {
    return 3;
  }

  if (frozenElapsedSeconds <= level.starTimeLimits.twoStars) {
    return 2;
  }

  return 1;
};

export const createVictoryResultSnapshot = ({
  elapsedSeconds,
  level,
  previousBestStars = 0,
}: VictoryResultSnapshotInput): VictoryResultSnapshot => {
  const frozenElapsedSeconds = normalizeElapsedSeconds(elapsedSeconds);
  const normalizedPreviousBestStars =
    normalizePreviousBestStars(previousBestStars);
  const earnedStars = calculateStarsByTime(frozenElapsedSeconds, level);

  return {
    earnedStars,
    elapsedSeconds: frozenElapsedSeconds,
    isNewRecord: earnedStars > normalizedPreviousBestStars,
    previousBestStars: normalizedPreviousBestStars,
    savedStars: Math.max(
      earnedStars,
      normalizedPreviousBestStars,
    ) as StarRating,
  };
};

export const getVictoryTitleByStars = (stars: number) => {
  if (stars >= 3) {
    return 'Reciclagem perfeita!';
  }

  if (stars >= 2) {
    return 'Excelente separação!';
  }

  return 'Fase concluída!';
};

export const calculateCoinReward = (stars: number) => {
  if (stars >= 3) {
    return 35;
  }

  if (stars === 2) {
    return 20;
  }

  return 10;
};

export const calculateBonusCoinReward = (stars: number) => {
  if (stars >= 3) {
    return 100;
  }

  if (stars === 2) {
    return 60;
  }

  return 30;
};

export const isBonusLevel = (level: Pick<Level, 'id' | 'worldId'>) =>
  level.id.startsWith('bonus-') || level.worldId === 21;

export const getCoinRewardForLevel = (
  stars: number,
  level?: Pick<Level, 'id' | 'worldId'>,
) =>
  level && isBonusLevel(level)
    ? calculateBonusCoinReward(stars)
    : calculateCoinReward(stars);

export const getIncrementalCoinRewardForLevel = (
  previousStars: number,
  newStars: number,
  level?: Pick<Level, 'id' | 'worldId'>,
) => {
  const previousReward =
    previousStars > 0 ? getCoinRewardForLevel(previousStars, level) : 0;
  const newReward = getCoinRewardForLevel(newStars, level);

  return Math.max(0, newReward - previousReward);
};
