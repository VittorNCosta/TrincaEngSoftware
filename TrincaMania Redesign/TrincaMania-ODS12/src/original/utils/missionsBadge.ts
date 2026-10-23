export type MissionsBadgeState =
  | { kind: 'locked' }
  | { kind: 'new' }
  | { count: number; kind: 'count' }
  | { kind: 'none' };

type MissionsBadgeInput = {
  missionReadyCount: number;
  missionsNew: boolean;
  missionsUnlocked: boolean;
};

const normalizeMissionReadyCount = (count: number) =>
  Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;

/** Resolves the single dominant badge shown for the Missions map entry. */
export const getMissionsBadgeState = ({
  missionReadyCount,
  missionsNew,
  missionsUnlocked,
}: MissionsBadgeInput): MissionsBadgeState => {
  if (!missionsUnlocked) return { kind: 'locked' };
  if (missionsNew) return { kind: 'new' };

  const count = normalizeMissionReadyCount(missionReadyCount);
  return count > 0 ? { count, kind: 'count' } : { kind: 'none' };
};
