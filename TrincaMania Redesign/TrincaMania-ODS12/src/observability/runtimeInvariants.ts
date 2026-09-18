import { runtimeAssert } from '../utils/log';
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
