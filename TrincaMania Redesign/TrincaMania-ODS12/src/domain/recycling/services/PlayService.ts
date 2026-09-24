import { GameStatus, MoveResult, Tile, TileKind } from '../../../types/game';
import { MatchRule } from '../policies/MatchRule';
import { activeMatchRule } from '../policies/MatchRuleRegistry';
import { CardRole } from '../value-objects/CardRole';
import {
  countRemainingTiles,
  getPlayableTiles,
  isMysteryTileHidden,
  isTileBlocked,
  isTileRemoved,
  revealAvailableMysteryTiles,
} from './BoardService';
import {
  insertTileGroupedInTray,
  removeCompletedTripleFromTray,
} from './TrayService';

export type MagicTripleMove = {
  boardTileIds: string[];
  kind: TileKind;
  trayTileIds: string[];
};

const groupByKindAndRole = (tiles: Tile[]) =>
  tiles.reduce<Map<TileKind, Map<CardRole, Tile[]>>>((groups, tile) => {
    const byRole = groups.get(tile.kind) ?? new Map<CardRole, Tile[]>();
    byRole.set(tile.role, [...(byRole.get(tile.role) ?? []), tile]);
    groups.set(tile.kind, byRole);

    return groups;
  }, new Map<TileKind, Map<CardRole, Tile[]>>());

const pickRandomItem = <T>(items: T[], random: () => number = Math.random) =>
  items.length > 0 ? items[Math.floor(random() * items.length)] : undefined;

/**
 * Procura uma trinca jogável combinando o que já está na bandeja com o que está
 * disponível no tabuleiro. Prioriza usar o máximo de peças da bandeja, porque é
 * isso que salva o jogador de perder por bandeja cheia.
 */
export const findMagicTripleMove = ({
  activeTrayCapacity,
  board,
  random = Math.random,
  rule = activeMatchRule,
  tray,
}: {
  activeTrayCapacity?: number;
  board: Tile[];
  random?: () => number;
  rule?: MatchRule;
  tray: Tile[];
}): MagicTripleMove | undefined => {
  const boardByKind = groupByKindAndRole(getPlayableTiles(board));
  const trayByKind = groupByKindAndRole(tray);
  const requiredRoles = rule.buildTripleRoles();
  const kinds = new Set<TileKind>([
    ...boardByKind.keys(),
    ...trayByKind.keys(),
  ]);
  const candidates: { move: MagicTripleMove; trayUsage: number }[] = [];

  kinds.forEach((kind) => {
    const boardByRole = boardByKind.get(kind) ?? new Map<CardRole, Tile[]>();
    const trayByRole = trayByKind.get(kind) ?? new Map<CardRole, Tile[]>();
    const usedTrayIds = new Set<string>();
    const usedBoardIds = new Set<string>();

    const covered = requiredRoles.every((role) => {
      const trayCandidate = (trayByRole.get(role) ?? []).find(
        (tile) => !usedTrayIds.has(tile.id),
      );

      if (trayCandidate) {
        usedTrayIds.add(trayCandidate.id);

        return true;
      }

      const boardCandidate = (boardByRole.get(role) ?? []).find(
        (tile) => !usedBoardIds.has(tile.id),
      );

      if (boardCandidate) {
        usedBoardIds.add(boardCandidate.id);

        return true;
      }

      return false;
    });

    if (!covered) {
      return;
    }

    candidates.push({
      move: {
        boardTileIds: [...usedBoardIds],
        kind,
        trayTileIds: [...usedTrayIds],
      },
      trayUsage: usedTrayIds.size,
    });
  });

  // Com a bandeja no limite, uma trinca só de tabuleiro não a encolhe — e é
  // exatamente encolher a bandeja que a Trinca Mágica promete. Sem candidato que
  // consuma bandeja, é melhor não oferecer o poder do que gastá-lo sem salvar.
  const eligibleCandidates =
    activeTrayCapacity !== undefined && tray.length >= activeTrayCapacity - 1
      ? candidates.filter((candidate) => candidate.trayUsage > 0)
      : candidates;

  if (eligibleCandidates.length === 0) {
    return undefined;
  }

  const bestTrayUsage = Math.max(
    ...eligibleCandidates.map((candidate) => candidate.trayUsage),
  );

  return pickRandomItem(
    eligibleCandidates
      .filter((candidate) => candidate.trayUsage === bestTrayUsage)
      .map((candidate) => candidate.move),
    random,
  );
};

export const playMagicTriple = (
  board: Tile[],
  tray: Tile[],
  activeTrayCapacity: number,
  rule: MatchRule = activeMatchRule,
): MoveResult => {
  const magicTripleMove = findMagicTripleMove({
    activeTrayCapacity,
    board,
    rule,
    tray,
  });

  if (!magicTripleMove) {
    return {
      board,
      tray,
      status: 'playing',
    };
  }

  const boardTileIds = new Set(magicTripleMove.boardTileIds);
  const trayTileIds = new Set(magicTripleMove.trayTileIds);
  const boardWithTripleRemoved = board.map((tile) =>
    boardTileIds.has(tile.id) ? { ...tile, removed: true } : tile,
  );
  const revealedBoard = revealAvailableMysteryTiles(boardWithTripleRemoved);
  const nextTray = tray.filter((tile) => !trayTileIds.has(tile.id));

  return {
    board: revealedBoard,
    removedKind: magicTripleMove.kind,
    status: countRemainingTiles(revealedBoard) === 0 ? 'won' : 'playing',
    tray: nextTray,
  };
};

/**
 * Joga a peça do tabuleiro para a bandeja e resolve a trinca, se ela fechar.
 *
 * Diferença central em relação ao jogo original: a trinca não é mais "três
 * peças iguais". Quem decide é a regra do domínio — na versão ODS 12, o ciclo
 * completo do material (resíduo → lixeira → reciclagem).
 */
export const playTile = (
  board: Tile[],
  tray: Tile[],
  tileId: string,
  activeTrayCapacity: number,
  rule: MatchRule = activeMatchRule,
): MoveResult => {
  const selectedTile = board.find((tile) => tile.id === tileId);

  if (
    !selectedTile ||
    isTileRemoved(selectedTile) ||
    isMysteryTileHidden(selectedTile) ||
    isTileBlocked(selectedTile, board)
  ) {
    return {
      board,
      tray,
      status: 'playing',
    };
  }

  const nextBoard = board.map((tile) =>
    tile.id === tileId ? { ...tile, removed: true } : tile,
  );
  const revealedBoard = revealAvailableMysteryTiles(nextBoard);
  const trayTile = { ...selectedTile, removed: false };
  const trayWithTile = insertTileGroupedInTray(tray, trayTile);
  const {
    removedKind,
    removedTiles,
    tray: nextTray,
  } = removeCompletedTripleFromTray(trayWithTile, rule);
  const status: GameStatus =
    countRemainingTiles(revealedBoard) === 0
      ? 'won'
      : !removedKind && nextTray.length >= activeTrayCapacity
        ? 'lost'
        : 'playing';

  return {
    board: revealedBoard,
    removedKind,
    removedTileIds: removedTiles.map((tile) => tile.id),
    status,
    tray: nextTray,
  };
};
