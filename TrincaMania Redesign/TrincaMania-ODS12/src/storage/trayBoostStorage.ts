import AsyncStorage from '@react-native-async-storage/async-storage';

export const TRAY_BOOST_STORAGE_KEY = '@trinca-mania/tray-boost-v1';
/**
 * A regra do ciclo (ODS 12) precisa de mais folga que "três peças iguais".
 *
 * Com três iguais, qualquer peça do material servia para fechar. No ciclo é
 * preciso o papel exato — existe 1/3 da oferta de cada um —, então a bandeja
 * enche antes de o jogador conseguir reunir resíduo + lixeira + símbolo.
 * Medido por simulação (609 partidas por configuração), a regra custa cerca de
 * dois espaços: bandeja 9 no ciclo reproduz a taxa de vitória da bandeja 7 no
 * jogo original. Os dois espaços compráveis continuam sendo os dois últimos.
 */
export const BASE_TRAY_CAPACITY = 7;
export const MAX_TRAY_CAPACITY = 9;
export const COIN_TRAY_SLOT_COST = 150;
export const COIN_TRAY_SLOT_DURATION_MS = 24 * 60 * 60 * 1000;
export const BONUS_TRAY_SLOT_DURATION_MS = 30 * 60 * 1000;

export type TrayBoostState = {
  coinSlotExpiresAt: number | null;
  adSlotExpiresAt: number | null;
};

export type TrayBoostPurchaseResult = {
  purchased: boolean;
  reason?: 'active' | 'insufficient-coins';
  state: TrayBoostState;
};

export type BonusTraySlotActivationResult = {
  activated: boolean;
  reason?: 'active';
  state: TrayBoostState;
};

export type TraySlotStatus = 'active' | 'coin-locked' | 'ad-locked';

export type RetryLevelResult = {
  bonusSlotActive: boolean;
  canRetry: boolean;
  coinSlotActive: boolean;
  trayCapacity: number;
};

export const createInitialTrayBoostState = (): TrayBoostState => ({
  adSlotExpiresAt: null,
  coinSlotExpiresAt: null,
});

const normalizeExpiresAt = (value: unknown, now = Date.now()) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= now) {
    return null;
  }

  return value;
};

const normalizeTrayBoostState = (value: unknown, now = Date.now()): TrayBoostState => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return createInitialTrayBoostState();
  }

  const rawState = value as Partial<TrayBoostState>;

  return {
    adSlotExpiresAt: normalizeExpiresAt(rawState.adSlotExpiresAt, now),
    coinSlotExpiresAt: normalizeExpiresAt(rawState.coinSlotExpiresAt, now),
  };
};

const saveTrayBoostState = async (state: TrayBoostState) => {
  await AsyncStorage.setItem(TRAY_BOOST_STORAGE_KEY, JSON.stringify(state));
};

export const getTrayBoostState = async () => {
  const now = Date.now();
  const rawState = await AsyncStorage.getItem(TRAY_BOOST_STORAGE_KEY);

  if (!rawState) {
    const initialState = createInitialTrayBoostState();
    await saveTrayBoostState(initialState);
    return initialState;
  }

  try {
    const nextState = normalizeTrayBoostState(JSON.parse(rawState), now);
    await saveTrayBoostState(nextState);
    return nextState;
  } catch {
    const initialState = createInitialTrayBoostState();
    await saveTrayBoostState(initialState);
    return initialState;
  }
};

export const isCoinTraySlotActive = (state: TrayBoostState, now = Date.now()) =>
  typeof state.coinSlotExpiresAt === 'number' && state.coinSlotExpiresAt > now;

export const isAdTraySlotActive = (state: TrayBoostState, now = Date.now()) =>
  typeof state.adSlotExpiresAt === 'number' && state.adSlotExpiresAt > now;

export const getCoinTraySlotRemaining = (state: TrayBoostState, now = Date.now()) =>
  isCoinTraySlotActive(state, now) ? Math.max(0, (state.coinSlotExpiresAt ?? now) - now) : 0;

export const getBonusTraySlotRemaining = (state: TrayBoostState, now = Date.now()) =>
  isAdTraySlotActive(state, now) ? Math.max(0, (state.adSlotExpiresAt ?? now) - now) : 0;

export const getActiveTrayCapacity = (state: TrayBoostState, now = Date.now()) => {
  const capacity =
    BASE_TRAY_CAPACITY +
    (isCoinTraySlotActive(state, now) ? 1 : 0) +
    (isAdTraySlotActive(state, now) ? 1 : 0);

  return Math.max(BASE_TRAY_CAPACITY, Math.min(MAX_TRAY_CAPACITY, capacity));
};

export const getTraySlotStatus = (state: TrayBoostState, now = Date.now()): TraySlotStatus[] => {
  const activeCapacity = getActiveTrayCapacity(state, now);

  return Array.from({ length: MAX_TRAY_CAPACITY }, (_, index) => {
    if (index < activeCapacity) {
      return 'active';
    }

    return index === BASE_TRAY_CAPACITY ? 'coin-locked' : 'ad-locked';
  });
};

export const formatTrayBoostRemaining = (milliseconds: number) => {
  const totalMinutes = Math.max(0, Math.ceil(milliseconds / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  }

  return `${minutes}m`;
};

export const purchaseCoinTraySlot = async (
  currentCoins: number,
): Promise<TrayBoostPurchaseResult> => {
  const now = Date.now();
  const state = await getTrayBoostState();

  if (isCoinTraySlotActive(state, now)) {
    return {
      purchased: false,
      reason: 'active',
      state,
    };
  }

  if (currentCoins < COIN_TRAY_SLOT_COST) {
    return {
      purchased: false,
      reason: 'insufficient-coins',
      state,
    };
  }

  const nextState: TrayBoostState = {
    ...state,
    coinSlotExpiresAt: now + COIN_TRAY_SLOT_DURATION_MS,
  };

  await saveTrayBoostState(nextState);

  return {
    purchased: true,
    state: nextState,
  };
};

export const activateBonusTraySlot = async (): Promise<BonusTraySlotActivationResult> => {
  const now = Date.now();
  const state = await getTrayBoostState();

  if (isAdTraySlotActive(state, now)) {
    return {
      activated: false,
      reason: 'active',
      state,
    };
  }

  const nextState: TrayBoostState = {
    ...state,
    adSlotExpiresAt: now + BONUS_TRAY_SLOT_DURATION_MS,
  };

  await saveTrayBoostState(nextState);

  return {
    activated: true,
    state: nextState,
  };
};

export const unlockAdTraySlotForOneLevel = async () => {
  const state = await getTrayBoostState();
  const nextState: TrayBoostState = {
    ...state,
    adSlotExpiresAt: Number.MAX_SAFE_INTEGER,
  };

  await saveTrayBoostState(nextState);
  return nextState;
};

export const consumeAdTraySlotIfNeeded = async () => {
  const state = await getTrayBoostState();

  if (!state.adSlotExpiresAt) {
    return state;
  }

  const nextState: TrayBoostState = {
    ...state,
    adSlotExpiresAt: null,
  };

  await saveTrayBoostState(nextState);
  return nextState;
};

export const resetTrayBoostState = async () => {
  const nextState = createInitialTrayBoostState();
  await saveTrayBoostState(nextState);
  return nextState;
};
