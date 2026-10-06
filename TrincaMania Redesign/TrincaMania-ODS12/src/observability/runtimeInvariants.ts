import { runtimeAssert } from '../utils/log';
import type { Level } from '../types/game';

export function checkCampaignIds(ids: string[]) {
  return runtimeAssert(
    !ids.some((id) => id.startsWith('ch')),
    'campaign-storage-rejects-chapter-ids',
  );
}
export function checkBoardSize(count: number) {
  return runtimeAssert(
    Number.isInteger(count) && count > 0 && count % 3 === 0,
    'tile-count-multiple-of-three',
  );
}

export function checkChapterIds(ids: string[]) {
  return runtimeAssert(
    !ids.some((id) => /^(?:bonus-)?w\d+-/.test(id)),
    'chapter-storage-rejects-campaign-ids',
  );
}

// FNV-1a is a cheap runtime diagnostic, not a security hash. The SHA-256 test
// remains the authoritative byte-integrity gate for intentional content edits.
export function checkCanonicalCampaign(levels: readonly Level[]) {
  const json = JSON.stringify(levels);
  let fingerprint = 2166136261;
  for (let index = 0; index < json.length; index++) {
    fingerprint =
      Math.imul(fingerprint ^ json.charCodeAt(index), 16777619) >>> 0;
  }
  const countMatches = runtimeAssert(
    levels.length === 103,
    'canonical-campaign-count',
  );
  const contentMatches = runtimeAssert(
    fingerprint === 0x9e47ec11,
    'canonical-campaign-content',
  );
  return countMatches && contentMatches;
}

export function checkTrayCapacity(
  capacity: number,
  minimum: number,
  maximum: number,
) {
  return runtimeAssert(
    Number.isInteger(capacity) && capacity >= minimum && capacity <= maximum,
    'active-tray-capacity-valid',
  );
}

export function checkRewardUnclaimed(claimed: boolean) {
  return runtimeAssert(!claimed, 'reward-unclaimed-after-await');
}

type PersistenceScope = 'campaign' | 'chapter' | 'lives';
type PersistenceSource =
  'commitProgress' | 'commitChapterProgress' | 'mutateLives';
const expectedSource: Record<PersistenceScope, PersistenceSource> = {
  campaign: 'commitProgress',
  chapter: 'commitChapterProgress',
  lives: 'mutateLives',
};
const pendingWrites: Record<PersistenceScope, number> = {
  campaign: 0,
  chapter: 0,
  lives: 0,
};

/** Observe writes without changing ordering, payloads or storage failures. */
export async function diagnosePersistenceWrite<T>(
  scope: PersistenceScope,
  source: PersistenceSource | undefined,
  write: () => Promise<T>,
): Promise<T> {
  runtimeAssert(
    source === expectedSource[scope],
    `${scope}-write-through-owner`,
  );
  runtimeAssert(pendingWrites[scope] === 0, `${scope}-writes-serialized`);
  pendingWrites[scope]++;
  try {
    return await write();
  } finally {
    pendingWrites[scope]--;
  }
}
