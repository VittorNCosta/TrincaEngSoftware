import { useCallback, useMemo } from 'react';
import storage from '../storage/keyValueStorage';
import { createChapterCompletionTransactions } from '../storage/chapterCompletionTransaction';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { loadProgress, saveProgress } from '../storage/progressStorage';
import {
  loadChapterProgress,
  saveChapterProgress,
  ChapterProgressState,
} from '../storage/chapterProgressStorage';
import { ProgressState } from '../types/game';
import { checkCampaignIds } from '../observability/runtimeInvariants';
import { log } from '../utils/log';
type Inputs = {
  resetOtherDomains(): Promise<void>;
  progressRef: MutableRefObject<ProgressState>;
  progressGenerationRef: MutableRefObject<number>;
  progressSaveQueueRef: MutableRefObject<Promise<void>>;
  chapterProgressRef: MutableRefObject<ChapterProgressState>;
  chapterProgressSaveQueueRef: MutableRefObject<Promise<void>>;
  setProgress: Dispatch<SetStateAction<ProgressState>>;
  setChapterProgress: Dispatch<SetStateAction<ChapterProgressState>>;
};
export function useProgressPersistence({
  resetOtherDomains,
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
            ? saveProgress(nextProgress, 'commitProgress')
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
      const generation = progressGenerationRef.current;
      chapterProgressRef.current = nextProgress;
      setChapterProgress(nextProgress);
      const saveOperation = chapterProgressSaveQueueRef.current
        .catch(() => undefined)
        .then(() =>
          progressGenerationRef.current === generation
            ? saveChapterProgress(nextProgress, 'commitChapterProgress')
            : undefined,
        );
      chapterProgressSaveQueueRef.current = saveOperation.catch((error) => {
        log('error', 'storage', 'chapter-save-failed', error);
      });
      return saveOperation;
    },
    [
      chapterProgressRef,
      chapterProgressSaveQueueRef,
      progressGenerationRef,
      setChapterProgress,
    ],
  );

  const transactions = useMemo(
    () =>
      createChapterCompletionTransactions({
        storage,
        current: () => ({
          progress: progressRef.current,
          chapterProgress: chapterProgressRef.current,
        }),
        load: async () => {
          await Promise.all([
            progressSaveQueueRef.current,
            chapterProgressSaveQueueRef.current,
          ]);
          const [progress, chapterProgress] = await Promise.all([
            loadProgress(),
            loadChapterProgress(),
          ]);
          return { progress, chapterProgress };
        },
        restore: ({ progress, chapterProgress }) => {
          progressRef.current = progress;
          chapterProgressRef.current = chapterProgress;
          setProgress(progress);
          setChapterProgress(chapterProgress);
        },
        resetOtherDomains,
        commitProgress,
        commitChapterProgress,
        generation: () => progressGenerationRef.current,
        invalidate: () => {
          progressGenerationRef.current += 1;
        },
      }),
    [
      progressRef,
      chapterProgressRef,
      progressGenerationRef,
      progressSaveQueueRef,
      chapterProgressSaveQueueRef,
      setProgress,
      setChapterProgress,
      resetOtherDomains,
      commitProgress,
      commitChapterProgress,
    ],
  );

  return { commitProgress, commitChapterProgress, ...transactions };
}
