import AsyncStorage from '@react-native-async-storage/async-storage';
import { diagnosePersistenceWrite } from '../observability/runtimeInvariants';

export const LIVES_STORAGE_KEY = '@trinca-mania/lives-v1';
export const MAX_LIVES = 5;
export const LIFE_REGEN_INTERVAL_MS = 30 * 60 * 1000;

export type LivesState = {
  appliedRewardOperationIds?: string[];
  currentLives: number;
  maxLives: number;
  lastLifeTimestamp: number;
};

const clampLives = (value: number, maxLives = MAX_LIVES) =>
  Math.max(0, Math.min(maxLives, Math.floor(value)));

export const createInitialLivesState = (now = Date.now()): LivesState => ({
  appliedRewardOperationIds: [],
  currentLives: MAX_LIVES,
  maxLives: MAX_LIVES,
  lastLifeTimestamp: now,
});

const normalizeLivesState = (value: unknown, now = Date.now()): LivesState => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return createInitialLivesState(now);
  }

  const rawState = value as Partial<LivesState>;
  const lastLifeTimestamp =
    typeof rawState.lastLifeTimestamp === 'number' &&
    Number.isFinite(rawState.lastLifeTimestamp)
      ? Math.min(rawState.lastLifeTimestamp, now)
      : now;

  return {
    appliedRewardOperationIds: Array.isArray(rawState.appliedRewardOperationIds)
      ? [
          ...new Set(
            rawState.appliedRewardOperationIds.filter(
              (id): id is string =>
                typeof id === 'string' && id.length > 0 && id.length <= 128,
            ),
          ),
        ].slice(-512)
      : [],
    currentLives: clampLives(
      typeof rawState.currentLives === 'number' &&
        Number.isFinite(rawState.currentLives)
        ? rawState.currentLives
        : MAX_LIVES,
    ),
    maxLives: MAX_LIVES,
    lastLifeTimestamp,
  };
};

const applyLifeRegeneration = (
  state: LivesState,
  now = Date.now(),
): LivesState => {
  if (state.currentLives >= state.maxLives) {
    return {
      appliedRewardOperationIds: state.appliedRewardOperationIds,
      currentLives: state.maxLives,
      maxLives: state.maxLives,
      lastLifeTimestamp: now,
    };
  }

  const elapsedMs = Math.max(0, now - state.lastLifeTimestamp);
  const regeneratedLives = Math.floor(elapsedMs / LIFE_REGEN_INTERVAL_MS);

  if (regeneratedLives <= 0) {
    return state;
  }

  const currentLives = Math.min(
    state.maxLives,
    state.currentLives + regeneratedLives,
  );

  return {
    appliedRewardOperationIds: state.appliedRewardOperationIds,
    currentLives,
    maxLives: state.maxLives,
    lastLifeTimestamp:
      currentLives >= state.maxLives
        ? now
        : state.lastLifeTimestamp + regeneratedLives * LIFE_REGEN_INTERVAL_MS,
  };
};

const saveLivesState = async (state: LivesState, source?: 'mutateLives') => {
  await diagnosePersistenceWrite('lives', source, () =>
    AsyncStorage.setItem(LIVES_STORAGE_KEY, JSON.stringify(state)),
  );
};

const readLivesState = async (now: number): Promise<LivesState> => {
  const rawLives = await AsyncStorage.getItem(LIVES_STORAGE_KEY);

  if (!rawLives) {
    return createInitialLivesState(now);
  }

  try {
    return normalizeLivesState(JSON.parse(rawLives), now);
  } catch {
    return createInitialLivesState(now);
  }
};

// Ler, calcular e gravar formam um único trecho crítico. Sem esta fila, o tick de
// 1s e uma vida premiada leem o mesmo estado e a última gravação apaga a outra.
let livesMutationQueue: Promise<unknown> = Promise.resolve();

const mutateLives = (
  apply: (state: LivesState, now: number) => LivesState,
): Promise<LivesState> => {
  const operation = livesMutationQueue
    .catch(() => undefined)
    .then(async () => {
      const now = Date.now();
      const nextState = apply(
        applyLifeRegeneration(await readLivesState(now), now),
        now,
      );

      await saveLivesState(nextState, 'mutateLives');
      return nextState;
    });

  livesMutationQueue = operation.catch(() => undefined);
  return operation;
};

export const getLivesState = (): Promise<LivesState> =>
  mutateLives((state) => state);

export const canPlayLevel = (state: LivesState) => state.currentLives > 0;

export const getTimeUntilNextLife = (state: LivesState, now = Date.now()) => {
  if (state.currentLives >= state.maxLives) {
    return 0;
  }

  const elapsedMs = Math.max(0, now - state.lastLifeTimestamp);
  if (elapsedMs >= LIFE_REGEN_INTERVAL_MS) {
    return 0;
  }

  return Math.max(0, LIFE_REGEN_INTERVAL_MS - elapsedMs);
};

export const formatLifeTimer = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export const consumeLife = () =>
  mutateLives((state, now) =>
    state.currentLives <= 0
      ? state
      : {
          appliedRewardOperationIds: state.appliedRewardOperationIds,
          currentLives: clampLives(state.currentLives - 1, state.maxLives),
          maxLives: state.maxLives,
          lastLifeTimestamp:
            state.currentLives >= state.maxLives
              ? now
              : state.lastLifeTimestamp,
        },
  );

export const addLife = () =>
  mutateLives((state, now) => {
    const currentLives = clampLives(state.currentLives + 1, state.maxLives);

    return {
      appliedRewardOperationIds: state.appliedRewardOperationIds,
      currentLives,
      maxLives: state.maxLives,
      lastLifeTimestamp:
        currentLives >= state.maxLives ? now : state.lastLifeTimestamp,
    };
  });

export const refillLives = () =>
  mutateLives((_state, now) => createInitialLivesState(now));

export const applyLifeRewardForOperation = (operationId: string) =>
  mutateLives((state, now) => {
    if (!operationId || state.appliedRewardOperationIds?.includes(operationId))
      return state;
    const currentLives = clampLives(state.currentLives + 1, state.maxLives);
    return {
      ...state,
      appliedRewardOperationIds: [
        ...(state.appliedRewardOperationIds ?? []),
        operationId,
      ].slice(-512),
      currentLives,
      lastLifeTimestamp:
        currentLives >= state.maxLives ? now : state.lastLifeTimestamp,
    };
  });
