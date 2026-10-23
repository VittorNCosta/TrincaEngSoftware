export const DAILY_CHECK_IN_VERSION = 1 as const;
export const DAILY_CHECK_IN_STORAGE_KEY = '@trinca-mania/daily-check-in-v1';
export const DAILY_CHECK_IN_OPERATION_HISTORY_LIMIT = 64;

export type DailyCheckInDay = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type DailyCheckInPowerType = 'hint' | 'undo' | 'shuffle';

export type DailyCheckInReward =
  | {
      amount: number;
      kind: 'coins';
      label: string;
      title: string;
      fallbackFrom?: DailyCheckInPowerType;
    }
  | {
      amount: 1;
      kind: 'life';
      label: '+1 vida';
      title: 'Vida extra';
    }
  | {
      amount: 1;
      kind: 'power';
      label: string;
      powerType: DailyCheckInPowerType;
      title: string;
    };

export type DailyCheckInPendingClaim = {
  cycleDay: DailyCheckInDay;
  dateKey: string;
  operationId: string;
  reward: DailyCheckInReward;
};

export type DailyCheckInState = {
  version: typeof DAILY_CHECK_IN_VERSION;
  cycleDay: DailyCheckInDay;
  lastClaimDateKey?: string;
  lastClaimedDay?: DailyCheckInDay;
  maxObservedDateKey?: string;
  pendingClaim?: DailyCheckInPendingClaim;
  totalClaims: number;
};

export type DailyCheckInStatus = {
  cycleDay: DailyCheckInDay;
  dateKey: string;
  eligible: boolean;
  reason: 'eligible' | 'claimed-today' | 'clock-rollback' | 'settling';
};

export type DailyCheckInCardState = 'claimed' | 'today' | 'future';
