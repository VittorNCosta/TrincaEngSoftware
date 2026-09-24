import { LEVELS } from '../data/levels';
import { ProgressState } from '../types/game';
/** Chapters are an extra mode after the ten main worlds; bonus world is optional. */
export function isChapterModeUnlocked(
  progress: Pick<ProgressState, 'levelStars'>,
): boolean {
  return LEVELS.filter(
    (level) => level.worldId >= 1 && level.worldId <= 10,
  ).every((level) => (progress.levelStars[level.id] ?? 0) > 0);
}
