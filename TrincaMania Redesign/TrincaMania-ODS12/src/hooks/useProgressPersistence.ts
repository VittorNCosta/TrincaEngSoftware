import { useCallback } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { saveProgress } from '../storage/progressStorage';
import {
  saveChapterProgress,
  ChapterProgressState,
} from '../storage/chapterProgressStorage';
import { ProgressState } from '../types/game';
import { checkCampaignIds } from '../observability/runtimeInvariants';
import { log } from '../utils/log';
type Inputs = {
  progressRef: MutableRefObject<ProgressState>;
  progressGenerationRef: MutableRefObject<number>;
  progressSaveQueueRef: MutableRefObject<Promise<void>>;
  chapterProgressRef: MutableRefObject<ChapterProgressState>;
  chapterProgressSaveQueueRef: MutableRefObject<Promise<void>>;
  setProgress: Dispatch<SetStateAction<ProgressState>>;
  setChapterProgress: Dispatch<SetStateAction<ChapterProgressState>>;
};
export function useProgressPersistence({
  progressRef,
  progressGenerationRef,
  progressSaveQueueRef,
  chapterProgressRef,
  chapterProgressSaveQueueRef,
  setProgress,
  setChapterProgress,
}: Inputs) {
  const commitProgress = useCallback(
    (nextProgress: ProgressState) => {
      checkCampaignIds([
        ...Object.keys(nextProgress.levelStars),
        ...nextProgress.unlockedLevelIds,
      ]);
      const generation = progressGenerationRef.current;
      progressRef.current = nextProgress;
      setProgress(nextProgress);
      const saveOperation = progressSaveQueueRef.current
        .catch(() => undefined)
        .then(() =>
          progressGenerationRef.current === generation
            ? saveProgress(nextProgress)
            : undefined,
        );
      progressSaveQueueRef.current = saveOperation.catch((error) => {
        log('error', 'storage', 'campaign-save-failed', error);
      });
      return saveOperation;
    },
    [progressRef, progressGenerationRef, progressSaveQueueRef, setProgress],
  );

  // Mesma fila de serialização do `commitProgress`, na chave dos capítulos: duas
  // conclusões seguidas não podem gravar fora de ordem.
  const commitChapterProgress = useCallback(
    (nextProgress: ChapterProgressState) => {
      chapterProgressRef.current = nextProgress;
      setChapterProgress(nextProgress);
      const saveOperation = chapterProgressSaveQueueRef.current
        .catch(() => undefined)
        .then(() => saveChapterProgress(nextProgress));
      chapterProgressSaveQueueRef.current = saveOperation.catch((error) => {
        log('error', 'storage', 'chapter-save-failed', error);
      });
      return saveOperation;
    },
    [chapterProgressRef, chapterProgressSaveQueueRef, setChapterProgress],
  );

  return { commitProgress, commitChapterProgress };
}
