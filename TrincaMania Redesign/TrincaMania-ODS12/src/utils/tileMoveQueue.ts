import type { GameStatus } from '../types/game';

type TilePressGate = {
  activeMoveStatus?: GameStatus;
  blockedByUi: boolean;
  duplicate: boolean;
  status: GameStatus;
  tutorialMoveLocked: boolean;
};

export type TileMoveStage =
  'queued' | 'flying' | 'arrived' | 'consuming' | 'completed' | 'cancelled';

export type TileMoveQueueEntry = {
  generation: number;
  stage: TileMoveStage;
  tileId: string;
  token: string;
};

export type TileMoveQueueState = {
  activeToken?: string;
  entries: Map<string, TileMoveQueueEntry>;
  generation: number;
  nextSequence: number;
  pendingTileIds: Set<string>;
  queuedTokens: string[];
};

export const canQueueTilePress = ({
  activeMoveStatus,
  blockedByUi,
  duplicate,
  status,
  tutorialMoveLocked,
}: TilePressGate) =>
  status === 'playing' &&
  !blockedByUi &&
  !tutorialMoveLocked &&
  (activeMoveStatus === undefined || activeMoveStatus === 'playing') &&
  !duplicate;

export const createTileMoveQueue = (): TileMoveQueueState => ({
  entries: new Map(),
  generation: 0,
  nextSequence: 0,
  pendingTileIds: new Set(),
  queuedTokens: [],
});

export const hasPendingTileId = (state: TileMoveQueueState, tileId: string) =>
  state.pendingTileIds.has(tileId);

export const enqueueTileMove = (
  state: TileMoveQueueState,
  tileId: string,
): TileMoveQueueEntry | undefined => {
  if (state.pendingTileIds.has(tileId)) {
    return undefined;
  }

  state.nextSequence += 1;
  const entry: TileMoveQueueEntry = {
    generation: state.generation,
    stage: 'queued',
    tileId,
    token: `${state.generation}:${state.nextSequence}`,
  };

  state.entries.set(entry.token, entry);
  state.pendingTileIds.add(tileId);
  state.queuedTokens.push(entry.token);
  return entry;
};

export const activateNextTileMove = (
  state: TileMoveQueueState,
): TileMoveQueueEntry | undefined => {
  if (state.activeToken) {
    return undefined;
  }

  const token = state.queuedTokens.shift();
  if (!token) {
    return undefined;
  }

  const entry = state.entries.get(token);
  if (
    !entry ||
    entry.stage !== 'queued' ||
    entry.generation !== state.generation
  ) {
    return activateNextTileMove(state);
  }

  entry.stage = 'flying';
  state.activeToken = token;
  return entry;
};

export const settleActiveTileFlight = (
  state: TileMoveQueueState,
  token: string,
  _visualFinished: boolean,
): TileMoveQueueEntry | undefined => {
  const entry = state.entries.get(token);

  if (
    state.activeToken !== token ||
    !entry ||
    entry.generation !== state.generation ||
    entry.stage !== 'flying'
  ) {
    return undefined;
  }

  // A animação é apenas a representação visual. Se ela foi interrompida sem
  // uma mudança de rodada, a seleção já aceita ainda precisa concluir a chegada.
  entry.stage = 'arrived';
  return entry;
};

export const markActiveTileMoveConsuming = (
  state: TileMoveQueueState,
  token: string,
) => {
  const entry = state.entries.get(token);

  if (state.activeToken !== token || !entry || entry.stage !== 'arrived') {
    return false;
  }

  entry.stage = 'consuming';
  return true;
};

export const settleActiveTileMove = (
  state: TileMoveQueueState,
  token: string,
  outcome: Extract<TileMoveStage, 'cancelled' | 'completed'>,
): TileMoveQueueEntry | undefined => {
  const entry = state.entries.get(token);

  if (
    state.activeToken !== token ||
    !entry ||
    entry.generation !== state.generation ||
    (entry.stage !== 'flying' &&
      entry.stage !== 'arrived' &&
      entry.stage !== 'consuming')
  ) {
    return undefined;
  }

  entry.stage = outcome;
  state.activeToken = undefined;
  state.pendingTileIds.delete(entry.tileId);
  return entry;
};

export const cancelQueuedTileMoves = (state: TileMoveQueueState) => {
  const cancelled: TileMoveQueueEntry[] = [];

  state.queuedTokens.splice(0).forEach((token) => {
    const entry = state.entries.get(token);
    if (!entry || entry.stage !== 'queued') {
      return;
    }

    entry.stage = 'cancelled';
    state.pendingTileIds.delete(entry.tileId);
    cancelled.push(entry);
  });

  return cancelled;
};

export const beginNextTileMoveGeneration = (state: TileMoveQueueState) => {
  const cancelled = cancelQueuedTileMoves(state);

  if (state.activeToken) {
    const active = settleActiveTileMove(state, state.activeToken, 'cancelled');
    if (active) {
      cancelled.unshift(active);
    }
  }

  state.generation += 1;
  state.nextSequence = 0;
  state.activeToken = undefined;
  state.pendingTileIds.clear();
  state.queuedTokens.length = 0;
  return cancelled;
};

export const getTileMoveEntry = (state: TileMoveQueueState, token: string) =>
  state.entries.get(token);

export const getOutstandingTileMoves = (state: TileMoveQueueState) =>
  Array.from(state.entries.values()).filter(
    (entry) =>
      entry.generation === state.generation &&
      entry.stage !== 'completed' &&
      entry.stage !== 'cancelled',
  );
