import {
  DailyCheckInCardState,
  DailyCheckInDay,
  DailyCheckInPendingClaim,
  DailyCheckInReward,
  DailyCheckInState,
  DailyCheckInStatus,
  DAILY_CHECK_IN_VERSION,
} from './dailyCheckInTypes';

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
type DailyCheckInDateInput = Date | number | string;

const isValidDate = (value: Date) => !Number.isNaN(value.getTime());

const toDate = (value: Date | number = new Date()) => {
  const date =
    value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (!isValidDate(date)) {
    throw new Error('Daily Check-in requires a valid date.');
  }
  return date;
};

export const getLocalDateKey = (value: Date | number = new Date()) => {
  const date = toDate(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const isDailyCheckInDateKey = (value: unknown): value is string =>
  typeof value === 'string' &&
  DATE_KEY_PATTERN.test(value) &&
  (() => {
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  })();

export const compareDailyCheckInDateKeys = (first: string, second: string) =>
  first === second ? 0 : first < second ? -1 : 1;

const isDailyCheckInDay = (value: unknown): value is DailyCheckInDay =>
  typeof value === 'number' &&
  Number.isInteger(value) &&
  value >= 1 &&
  value <= 7;

const isDailyCheckInPowerType = (value: unknown) =>
  value === 'hint' || value === 'undo' || value === 'shuffle';

const normalizeDateKey = (value: unknown) =>
  isDailyCheckInDateKey(value) ? value : undefined;

const normalizeReward = (value: unknown): DailyCheckInReward | undefined => {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return undefined;
  const reward = value as Partial<DailyCheckInReward>;

  if (
    reward.kind === 'coins' &&
    typeof reward.amount === 'number' &&
    Number.isInteger(reward.amount) &&
    reward.amount > 0 &&
    typeof reward.label === 'string' &&
    typeof reward.title === 'string'
  ) {
    return {
      amount: reward.amount,
      kind: 'coins',
      label: reward.label,
      title: reward.title,
      ...(isDailyCheckInPowerType(reward.fallbackFrom)
        ? { fallbackFrom: reward.fallbackFrom }
        : {}),
    };
  }

  if (reward.kind === 'life') {
    return { amount: 1, kind: 'life', label: '+1 vida', title: 'Vida extra' };
  }

  if (
    reward.kind === 'power' &&
    reward.amount === 1 &&
    (reward.powerType === 'hint' ||
      reward.powerType === 'undo' ||
      reward.powerType === 'shuffle') &&
    typeof reward.label === 'string' &&
    typeof reward.title === 'string'
  ) {
    return {
      amount: 1,
      kind: 'power',
      label: reward.label,
      powerType: reward.powerType,
      title: reward.title,
    };
  }

  return undefined;
};

const normalizePendingClaim = (
  value: unknown,
): DailyCheckInPendingClaim | undefined => {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return undefined;
  const pending = value as Partial<DailyCheckInPendingClaim>;
  if (
    !isDailyCheckInDay(pending.cycleDay) ||
    !isDailyCheckInDateKey(pending.dateKey) ||
    typeof pending.operationId !== 'string' ||
    pending.operationId.length === 0
  ) {
    return undefined;
  }
  const reward = normalizeReward(pending.reward);
  return reward
    ? {
        cycleDay: pending.cycleDay,
        dateKey: pending.dateKey,
        operationId: pending.operationId,
        reward,
      }
    : undefined;
};

export const createInitialDailyCheckInState = (): DailyCheckInState => ({
  cycleDay: 1,
  totalClaims: 0,
  version: DAILY_CHECK_IN_VERSION,
});

export const normalizeDailyCheckInState = (
  value: unknown,
): DailyCheckInState => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return createInitialDailyCheckInState();
  }

  const raw = value as Partial<DailyCheckInState>;
  const pendingClaim = normalizePendingClaim(raw.pendingClaim);
  const cycleDay = isDailyCheckInDay(raw.cycleDay) ? raw.cycleDay : 1;
  const lastClaimDateKey = normalizeDateKey(raw.lastClaimDateKey);
  const maxObservedDateKey = normalizeDateKey(raw.maxObservedDateKey);
  const lastClaimedDay = isDailyCheckInDay(raw.lastClaimedDay)
    ? raw.lastClaimedDay
    : undefined;

  return {
    cycleDay: pendingClaim?.cycleDay ?? cycleDay,
    ...(lastClaimDateKey ? { lastClaimDateKey } : {}),
    ...(lastClaimedDay ? { lastClaimedDay } : {}),
    ...(maxObservedDateKey ? { maxObservedDateKey } : {}),
    ...(pendingClaim ? { pendingClaim } : {}),
    totalClaims:
      typeof raw.totalClaims === 'number' && Number.isFinite(raw.totalClaims)
        ? Math.max(0, Math.floor(raw.totalClaims))
        : 0,
    version: DAILY_CHECK_IN_VERSION,
  };
};

export const getDailyCheckInStatus = (
  state: DailyCheckInState,
  value: DailyCheckInDateInput = new Date(),
): DailyCheckInStatus => {
  const normalized = normalizeDailyCheckInState(state);
  const dateKey = isDailyCheckInDateKey(value) ? value : getLocalDateKey(value);

  if (normalized.pendingClaim) {
    return {
      cycleDay: normalized.pendingClaim.cycleDay,
      dateKey,
      eligible: false,
      reason: 'settling',
    };
  }

  if (normalized.lastClaimDateKey === dateKey) {
    return {
      cycleDay: normalized.cycleDay,
      dateKey,
      eligible: false,
      reason: 'claimed-today',
    };
  }

  if (
    normalized.maxObservedDateKey &&
    compareDailyCheckInDateKeys(dateKey, normalized.maxObservedDateKey) < 0
  ) {
    return {
      cycleDay: normalized.cycleDay,
      dateKey,
      eligible: false,
      reason: 'clock-rollback',
    };
  }

  return {
    cycleDay: normalized.cycleDay,
    dateKey,
    eligible: true,
    reason: 'eligible',
  };
};

export const beginDailyCheckInClaim = (
  state: DailyCheckInState,
  dateKey: string,
  reward: DailyCheckInReward,
  operationId: string,
): DailyCheckInState => {
  const normalized = normalizeDailyCheckInState(state);
  if (normalized.pendingClaim) return normalized;
  const status = getDailyCheckInStatus(normalized, dateKey);
  if (
    !status.eligible ||
    !isDailyCheckInDateKey(dateKey) ||
    !operationId.trim()
  ) {
    return normalized;
  }

  return {
    ...normalized,
    maxObservedDateKey:
      normalized.maxObservedDateKey &&
      compareDailyCheckInDateKeys(normalized.maxObservedDateKey, dateKey) > 0
        ? normalized.maxObservedDateKey
        : dateKey,
    pendingClaim: {
      cycleDay: normalized.cycleDay,
      dateKey,
      operationId: operationId.trim(),
      reward,
    },
  };
};

export const completeDailyCheckInClaim = (
  state: DailyCheckInState,
  operationId: string,
): DailyCheckInState => {
  const normalized = normalizeDailyCheckInState(state);
  const pendingClaim = normalized.pendingClaim;
  if (!pendingClaim || pendingClaim.operationId !== operationId)
    return normalized;

  const nextCycleDay: DailyCheckInDay =
    pendingClaim.cycleDay === 7
      ? 1
      : ((pendingClaim.cycleDay + 1) as DailyCheckInDay);

  return {
    ...normalized,
    cycleDay: nextCycleDay,
    lastClaimDateKey: pendingClaim.dateKey,
    lastClaimedDay: pendingClaim.cycleDay,
    maxObservedDateKey:
      normalized.maxObservedDateKey &&
      compareDailyCheckInDateKeys(
        normalized.maxObservedDateKey,
        pendingClaim.dateKey,
      ) > 0
        ? normalized.maxObservedDateKey
        : pendingClaim.dateKey,
    pendingClaim: undefined,
    totalClaims: normalized.totalClaims + 1,
  };
};

export const getDailyCheckInCardState = (
  state: DailyCheckInState,
  day: DailyCheckInDay,
  value: DailyCheckInDateInput = new Date(),
): DailyCheckInCardState => {
  const normalized = normalizeDailyCheckInState(state);
  const status = getDailyCheckInStatus(normalized, value);
  const claimedToday =
    normalized.lastClaimDateKey === status.dateKey
      ? normalized.lastClaimedDay
      : undefined;

  if (normalized.pendingClaim && day === normalized.pendingClaim.cycleDay)
    return 'today';
  if (claimedToday && day <= claimedToday) return 'claimed';
  if (!claimedToday && status.eligible && day === normalized.cycleDay)
    return 'today';
  if (!claimedToday && day < normalized.cycleDay) return 'claimed';
  return 'future';
};
