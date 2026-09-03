/**
 * Camada anticorrupção (ACL) entre a apresentação e o domínio.
 *
 * As telas e componentes deste app foram escritos contra este módulo. Em vez de
 * reescrever ~150 KB de UI, o módulo virou uma fachada fina: a regra do jogo
 * mora em `src/domain/recycling`, e aqui só mantemos a assinatura que a
 * apresentação já conhece. Código novo deve importar do domínio direto.
 */
import {
  MoveHistoryItem,
  MoveResult,
  PowerUpType,
  Tile,
  TileKind,
} from '../types/game';
import { activeMatchRule } from '../domain/recycling/policies/MatchRuleRegistry';
import {
  removeCompletedTripleOfKind,
  countTilesByKind as countTilesByKindFromDomain,
  insertTileGroupedInTray as insertTileGroupedInTrayFromDomain,
} from '../domain/recycling/services/TrayService';

export {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  TILE_SIZE,
  countRemainingTiles,
  getAvailableTiles,
  getPlayableTiles,
  getTileRect,
  isDrawnAbove,
  isMysteryTileHidden,
  isTileBlocked,
  isTileRemoved,
  rectanglesOverlap,
  revealAvailableMysteryTiles,
} from '../domain/recycling/services/BoardService';

export {
  findMagicTripleMove,
  playMagicTriple,
  playTile,
} from '../domain/recycling/services/PlayService';
export type { MagicTripleMove } from '../domain/recycling/services/PlayService';

export { shuffleRemainingTiles } from '../domain/recycling/services/ShuffleService';

export {
  calculateBonusCoinReward,
  calculateCoinReward,
  calculateStarsByTime,
  createVictoryResultSnapshot,
  getCoinRewardForLevel,
  getIncrementalCoinRewardForLevel,
  getVictoryTitleByStars,
  isBonusLevel,
} from '../domain/recycling/services/ScoringService';
export type {
  StarRating,
  VictoryResultSnapshot,
} from '../domain/recycling/services/ScoringService';

export {
  getMissingRolesForKind,
  removeCompletedTripleFromTray,
} from '../domain/recycling/services/TrayService';

export const POWER_UP_COSTS: Record<PowerUpType, number> = {
  hint: 120,
  shuffle: 60,
  undo: 45,
};

export const countTilesByKind = countTilesByKindFromDomain;

export const insertTileGroupedInTray = insertTileGroupedInTrayFromDomain;

/**
 * Mantida por compatibilidade: remove a trinca fechada de um material.
 * Na versão ODS 12 "trinca" é o ciclo completo, então três resíduos do mesmo
 * material não saem daqui — falta a lixeira e o símbolo.
 */
export const removeCompletedTriple = (tray: Tile[], kind: TileKind) =>
  removeCompletedTripleOfKind(tray, kind, activeMatchRule);

export const undoLastMove = (history: MoveHistoryItem[]) =>
  history[history.length - 1];

export const getUndoableMove = (history: MoveHistoryItem[]) => {
  const previousMove = undoLastMove(history);

  return previousMove && !previousMove.formedTriple ? previousMove : undefined;
};

export const formatQuantity = (
  quantity: number,
  singular: string,
  plural: string,
) => `${quantity} ${quantity === 1 ? singular : plural}`;

export const formatSeconds = (totalSeconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export type { MoveResult };
