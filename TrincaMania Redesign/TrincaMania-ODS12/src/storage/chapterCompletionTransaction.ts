import type { ProgressState } from '../types/game';
import {
  applyChapterMapCompletion,
  createInitialChapterProgress,
  type ChapterProgressState,
} from './chapterProgressStorage';
import {
  createInitialProgress,
  grantRewardForOperation,
} from './progressStorage';
import { getChapterLevelSummary } from '../data/chapters';
import { getIncrementalCoinRewardForLevel } from '../domain/recycling/services/ScoringService';
import { createStorageQueue } from './storageQueue';

export const CHAPTER_TRANSACTION_KEY = '@trinca-mania/chapter-transaction-v1';
type CompletionIntent = {
  version: 1;
  kind: 'completion';
  mapId: string;
  previousStars: number;
  stars: number;
};
type Intent = CompletionIntent | { version: 1; kind: 'reset' };
type Snapshot = {
  progress: ProgressState;
  chapterProgress: ChapterProgressState;
};
type Dependencies = {
  storage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<unknown>;
  };
  current(): Snapshot;
  load(): Promise<Snapshot>;
  restore(snapshot: Snapshot): void;
  commitProgress(progress: ProgressState): Promise<void>;
  commitChapterProgress(progress: ChapterProgressState): Promise<void>;
  generation(): number;
  invalidate(): void;
  resetOtherDomains(): Promise<void>;
};

function parseIntent(raw: string | null): Intent | null {
  if (!raw || raw === 'null') return null;
  const value = JSON.parse(raw) as Intent;
  if (value?.version === 1 && value.kind === 'reset') return value;
  if (
    value?.version === 1 &&
    value.kind === 'completion' &&
    getChapterLevelSummary(value.mapId) &&
    Number.isInteger(value.previousStars) &&
    value.previousStars >= 0 &&
    value.previousStars <= 3 &&
    Number.isInteger(value.stars) &&
    value.stars >= 1 &&
    value.stars <= 3
  )
    return value;
  // Fail closed: silently discarding an unreadable intent could lose a reward.
  throw new Error(
    'Registro de conclusão inválido. O progresso não foi alterado.',
  );
}

/** One queue per mounted persistence owner; the journal uses the same scoped
 * adapter as both saves (native, visitor-memory or prefixed web storage).
 * Every durable intermediate state is replayable. Wallet + receipt are one
 * atomic key write, while stars merge monotonically in their separate key. */
export function createChapterCompletionTransactions(deps: Dependencies) {
  const enqueue = createStorageQueue();
  const writeIntent = (intent: Intent | null) =>
    deps.storage.setItem(CHAPTER_TRANSACTION_KEY, JSON.stringify(intent));
  const check = (generation: number) => {
    if (deps.generation() !== generation)
      throw new Error('Operação cancelada pela redefinição do progresso.');
  };
  const apply = async (intent: Intent, generation: number) => {
    check(generation);
    if (intent.kind === 'reset') {
      await deps.commitProgress(createInitialProgress());
      check(generation);
      await deps.commitChapterProgress(createInitialChapterProgress());
      check(generation);
      await deps.resetOtherDomains();
    } else {
      const coins = getIncrementalCoinRewardForLevel(
        intent.previousStars,
        intent.stars,
      );
      const operationId = `chapter:${intent.mapId}:${intent.previousStars}:${intent.stars}`;
      // Always persist, even when optimistic memory already contains the receipt
      // of a failed write. A receipt only protects replay after durable storage.
      await deps.commitProgress(
        grantRewardForOperation(deps.current().progress, operationId, {
          coins,
        }),
      );
      check(generation);
      const completion = applyChapterMapCompletion(
        deps.current().chapterProgress,
        intent.mapId,
        intent.stars,
      );
      await deps.commitChapterProgress(completion.progress);
    }
    check(generation);
    await writeIntent(null);
  };
  const recoverPending = async (generation: number) => {
    const intent = parseIntent(
      await deps.storage.getItem(CHAPTER_TRANSACTION_KEY),
    );
    check(generation);
    if (intent) await apply(intent, generation);
  };
  return {
    recoverProgress: () =>
      enqueue(async () => {
        const generation = deps.generation();
        const snapshot = await deps.load();
        check(generation);
        deps.restore(snapshot);
        await recoverPending(generation);
        return deps.current();
      }),
    commitChapterCompletion: (mapId: string, stars: number) => {
      const generation = deps.generation();
      return enqueue(async () => {
        check(generation);
        if (!getChapterLevelSummary(mapId) || !Number.isFinite(stars))
          throw new Error('Conclusão de capítulo inválida.');
        await recoverPending(generation);
        const completion = applyChapterMapCompletion(
          deps.current().chapterProgress,
          mapId,
          stars,
        );
        const coinsEarned = getIncrementalCoinRewardForLevel(
          completion.previousStars,
          completion.starsEarned,
        );
        const intent: CompletionIntent = {
          version: 1,
          kind: 'completion',
          mapId,
          previousStars: completion.previousStars,
          stars: completion.starsEarned,
        };
        await writeIntent(intent);
        await apply(intent, generation);
        return { ...completion, coinsEarned };
      });
    },
    resetProgress: () => {
      // Invalidate synchronously, including transactions already waiting in the queue.
      deps.invalidate();
      const generation = deps.generation();
      return enqueue(async () => {
        check(generation);
        // Reset is also journaled: a reload after either save resumes the reset,
        // never the reward it superseded.
        await writeIntent({ version: 1, kind: 'reset' });
        await apply({ version: 1, kind: 'reset' }, generation);
      });
    },
  };
}
