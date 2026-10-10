import AsyncStorage from '../storage/keyValueStorage';
import { LEVELS } from '../data/levels';
import { getLocalDateKey } from '../dailyCheckIn/dailyCheckIn';
import { createStorageQueue } from '../storage/storageQueue';
import { Level } from '../types/game';
import { createSeededRandom, stableHash } from '../utils/deterministicRandom';
import { generatePlayableLevel } from '../utils/levelGenerator';

export type DailyChallengeSave = {
  version: 1;
  bestStars: Record<string, number>;
  completedCycleIds: string[];
  lastCompletedCycleId?: string;
  streak: number;
  maxObservedDateKey?: string;
};
const KEY = '@trinca-mania/daily-challenge-v1';
const queue = createStorageQueue();
export const DAILY_REWARD_STREAKS = [3, 7, 30] as const;
export const createInitialDailyChallengeSave = (): DailyChallengeSave => ({
  version: 1,
  bestStars: {},
  completedCycleIds: [],
  streak: 0,
});

const dayBefore = (cycleId: string) => {
  const [year, month, day] = cycleId.split('-').map(Number);
  return getLocalDateKey(new Date(year, month - 1, day - 1));
};

/** Generates a playable layout from the existing ODS 12 tile catalogue. */
export const getDailyChallengeLevel = (cycleId = getLocalDateKey()): Level => {
  const sourceLevels = LEVELS.filter(
    (level) => level.difficulty === 'normal' && level.worldId !== 21,
  ).slice(0, 12);
  const candidates =
    sourceLevels.length > 0 ? sourceLevels : LEVELS.slice(0, 1);
  const seed = stableHash(`daily:${cycleId}`);
  const source = candidates[seed % candidates.length];
  const generated = generatePlayableLevel(source.id, {
    random: createSeededRandom(seed),
  });
  return {
    ...generated,
    id: `daily-${cycleId}`,
    displayLabel: 'Desafio diário',
    title: 'Desafio diário de reciclagem',
    objectiveText: 'Complete o tabuleiro de hoje.',
  };
};

export const completeDailyChallenge = (
  save: DailyChallengeSave,
  cycleId: string,
  stars: number,
): DailyChallengeSave => {
  const completed = save.completedCycleIds.includes(cycleId);
  if (save.maxObservedDateKey && cycleId < save.maxObservedDateKey) return save;
  return {
    ...save,
    bestStars: {
      ...save.bestStars,
      [cycleId]: Math.max(
        save.bestStars[cycleId] ?? 0,
        Math.min(3, Math.max(1, Math.floor(stars))),
      ),
    },
    completedCycleIds: completed
      ? save.completedCycleIds
      : [...save.completedCycleIds, cycleId].slice(-365),
    lastCompletedCycleId: completed ? save.lastCompletedCycleId : cycleId,
    streak: completed
      ? save.streak
      : save.lastCompletedCycleId === dayBefore(cycleId)
        ? save.streak + 1
        : 1,
    maxObservedDateKey: cycleId,
  };
};

const read = async (): Promise<DailyChallengeSave> => {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return createInitialDailyChallengeSave();
    const parsed = JSON.parse(raw) as DailyChallengeSave;
    if (
      parsed.version !== 1 ||
      !Array.isArray(parsed.completedCycleIds) ||
      !parsed.bestStars
    )
      return createInitialDailyChallengeSave();
    return { ...parsed, streak: Math.max(0, Math.floor(parsed.streak || 0)) };
  } catch {
    return createInitialDailyChallengeSave();
  }
};
export const loadDailyChallengeSave = () => queue(read);
export const recordDailyChallengeCompletion = (
  cycleId: string,
  stars: number,
) =>
  queue(async () => {
    const next = completeDailyChallenge(await read(), cycleId, stars);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
    return next;
  });
export const resetDailyChallengeSave = () =>
  queue(async () => {
    const next = createInitialDailyChallengeSave();
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
    return next;
  });
