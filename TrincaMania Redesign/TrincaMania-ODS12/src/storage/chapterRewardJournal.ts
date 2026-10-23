/** Cumulative chapter entitlement (chapter key) / paid receipt (wallet key).
 * Both travel atomically with their owner's JSON; epoch changes only on reset.
 * Legacy saves have no ledger and start at zero, without retroactive payment.
 */
export type ChapterRewardLedger = { epoch: number; total: number };

export function readChapterRewardLedger(value: unknown): ChapterRewardLedger {
  const ledger = (value as { chapterRewards?: unknown } | undefined)
    ?.chapterRewards;
  if (ledger === undefined) return { epoch: 0, total: 0 };
  if (!ledger || typeof ledger !== 'object')
    throw new Error('Invalid chapter reward ledger');
  const { epoch, total } = ledger as ChapterRewardLedger;
  if (
    !Number.isSafeInteger(epoch) ||
    epoch < 0 ||
    !Number.isSafeInteger(total) ||
    total < 0
  ) {
    throw new Error('Invalid chapter reward ledger');
  }
  return { epoch, total };
}

// Preserve the legacy object shape when metadata has not yet been introduced.
export function copyChapterRewardLedger(value: unknown) {
  const ledger = readChapterRewardLedger(value);
  return (value as { chapterRewards?: unknown } | undefined)?.chapterRewards ===
    undefined
    ? {}
    : { chapterRewards: ledger };
}

export function withChapterRewardLedger<T>(
  value: T,
  ledger: ChapterRewardLedger,
) {
  const next = { ...value, chapterRewards: ledger };
  readChapterRewardLedger(next);
  return next;
}

export function pendingChapterReward(wallet: unknown, chapter: unknown) {
  const paid = readChapterRewardLedger(wallet);
  const earned = readChapterRewardLedger(chapter);
  if (paid.epoch !== earned.epoch || paid.total > earned.total) {
    throw new Error('Inconsistent chapter reward ledger');
  }
  return earned.total - paid.total;
}
