import { useCallback, useRef } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import {
  createInitialProgress,
  normalizeProgress,
  saveProgress,
} from '../storage/progressStorage';
import {
  copyChapterRewardLedger,
  pendingChapterReward,
  readChapterRewardLedger,
  withChapterRewardLedger,
} from '../storage/chapterRewardJournal';
import { getIncrementalCoinRewardForLevel } from '../domain/recycling/services/ScoringService';
import {
  saveChapterProgress,
  createInitialChapterProgress,
  applyChapterMapCompletion,
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
  const chapterRewardQueue = useRef<Promise<unknown>>(Promise.resolve());
  const resetOperation = useRef<Promise<void> | undefined>(undefined);
  const resetTarget = useRef<
    | {
        generation: number;
        wallet: ProgressState;
        chapter: ChapterProgressState;
      }
    | undefined
  >(undefined);

  const assertGeneration = useCallback(
    (generation: number, resetting = false) => {
      if (
        generation !== progressGenerationRef.current ||
        (resetTarget.current && !resetting)
      ) {
        throw new Error('Progress operation superseded by reset');
      }
    },
    [progressGenerationRef],
  );

  const commitProgress = useCallback(
    (
      nextProgress: ProgressState,
      generation = progressGenerationRef.current,
      resetting = false,
    ) => {
      assertGeneration(generation, resetting);
      checkCampaignIds([
        ...Object.keys(nextProgress.levelStars),
        ...nextProgress.unlockedLevelIds,
      ]);
      progressRef.current = nextProgress;
      setProgress(nextProgress);
      const saveOperation = progressSaveQueueRef.current
        .catch(() => undefined)
        .then(async () => {
          assertGeneration(generation, resetting);
          await saveProgress(nextProgress, 'commitProgress');
          assertGeneration(generation, resetting);
        });
      progressSaveQueueRef.current = saveOperation.catch((error) => {
        log('error', 'storage', 'campaign-save-failed', error);
      });
      return saveOperation;
    },
    [
      assertGeneration,
      progressRef,
      progressGenerationRef,
      progressSaveQueueRef,
      setProgress,
    ],
  );

  // Mesma fila de serialização do `commitProgress`, na chave dos capítulos: duas
  // conclusões seguidas não podem gravar fora de ordem.
  const commitChapterProgress = useCallback(
    (
      nextProgress: ChapterProgressState,
      generation = progressGenerationRef.current,
      resetting = false,
    ) => {
      assertGeneration(generation, resetting);
      chapterProgressRef.current = nextProgress;
      setChapterProgress(nextProgress);
      const saveOperation = chapterProgressSaveQueueRef.current
        .catch(() => undefined)
        .then(async () => {
          assertGeneration(generation, resetting);
          await saveChapterProgress(nextProgress, 'commitChapterProgress');
          assertGeneration(generation, resetting);
        });
      chapterProgressSaveQueueRef.current = saveOperation.catch((error) => {
        log('error', 'storage', 'chapter-save-failed', error);
      });
      return saveOperation;
    },
    [
      assertGeneration,
      progressGenerationRef,
      chapterProgressRef,
      chapterProgressSaveQueueRef,
      setChapterProgress,
    ],
  );

  const settleChapterReward = useCallback(
    async (generation: number) => {
      assertGeneration(generation);
      const wallet = progressRef.current;
      const chapter = chapterProgressRef.current;
      const pending = pendingChapterReward(wallet, chapter);
      // Even zero must be written: an earlier failed write may have updated refs.
      await commitProgress(
        normalizeProgress(
          withChapterRewardLedger(
            {
              ...wallet,
              coins: wallet.coins + pending,
            },
            readChapterRewardLedger(chapter),
          ),
        ),
        generation,
      );
    },
    [assertGeneration, progressRef, chapterProgressRef, commitProgress],
  );

  const commitChapterCompletion = useCallback(
    (
      mapId: string,
      stars: number,
      generation = progressGenerationRef.current,
    ) => {
      const operation = chapterRewardQueue.current
        .catch(() => undefined)
        .then(async () => {
          assertGeneration(generation);
          pendingChapterReward(progressRef.current, chapterProgressRef.current);
          const before = chapterProgressRef.current;
          const result = applyChapterMapCompletion(before, mapId, stars);
          const coinsEarned = getIncrementalCoinRewardForLevel(
            result.previousStars,
            result.starsEarned,
          );
          const ledger = readChapterRewardLedger(before);
          await commitChapterProgress(
            withChapterRewardLedger(result.progress, {
              epoch: ledger.epoch,
              total: ledger.total + coinsEarned,
            }),
            generation,
          );
          assertGeneration(generation);
          await settleChapterReward(generation);
          return { ...result, coinsEarned };
        });
      chapterRewardQueue.current = operation.catch(() => undefined);
      return operation;
    },
    [
      assertGeneration,
      progressGenerationRef,
      progressRef,
      chapterProgressRef,
      commitChapterProgress,
      settleChapterReward,
    ],
  );

  const resetProgressPair = useCallback(() => {
    if (resetOperation.current) return resetOperation.current;
    if (!resetTarget.current) {
      const epoch = readChapterRewardLedger(progressRef.current).epoch + 1;
      const wallet = withChapterRewardLedger(createInitialProgress(), {
        epoch,
        total: 0,
      });
      const chapter = withChapterRewardLedger(createInitialChapterProgress(), {
        epoch,
        total: 0,
      });
      resetTarget.current = {
        generation: ++progressGenerationRef.current,
        wallet,
        chapter,
      };
    }
    const target = resetTarget.current;
    // Wallet is the durable reset marker. Older chapter epochs are discarded on boot.
    const operation = (async () => {
      await commitProgress(target.wallet, target.generation, true);
      await commitChapterProgress(target.chapter, target.generation, true);
      resetTarget.current = undefined;
    })();
    resetOperation.current = operation;
    const finish = () => {
      resetOperation.current = undefined;
    };
    void operation.then(finish, finish);
    return operation;
  }, [
    progressRef,
    progressGenerationRef,
    commitProgress,
    commitChapterProgress,
  ]);

  const recoverChapterReward = useCallback(async () => {
    if (resetTarget.current) {
      await resetProgressPair();
      return;
    }
    const generation = progressGenerationRef.current;
    const paid = readChapterRewardLedger(progressRef.current);
    const earned = readChapterRewardLedger(chapterProgressRef.current);
    if (paid.epoch > earned.epoch) {
      if (paid.total !== 0)
        throw new Error('Inconsistent chapter reward reset');
      await commitChapterProgress(
        {
          ...createInitialChapterProgress(),
          ...copyChapterRewardLedger(progressRef.current),
        },
        generation,
      );
    } else if (
      pendingChapterReward(progressRef.current, chapterProgressRef.current) > 0
    ) {
      await settleChapterReward(generation);
    }
  }, [
    progressRef,
    chapterProgressRef,
    progressGenerationRef,
    commitChapterProgress,
    settleChapterReward,
    resetProgressPair,
  ]);

  return {
    commitProgress,
    commitChapterProgress,
    commitChapterCompletion,
    recoverChapterReward,
    resetProgressPair,
  };
}
