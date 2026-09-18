import type { Tile, TileKind } from '../../types/game';
import { getAvailableTiles, isMysteryTileHidden } from '../../utils/gameLogic';

export type PracticalTutorialStep =
  | 'done'
  | 'intro'
  | 'tap-first'
  | 'tray'
  | 'tap-second'
  | 'tap-third'
  | 'triple'
  | 'warning';

export type PracticalTutorialPopupStep = Extract<
  PracticalTutorialStep,
  'intro' | 'tray' | 'triple' | 'warning'
>;

export const PRACTICAL_TUTORIAL_LEVEL_ID = 'w1-001';
export const PRACTICAL_TUTORIAL_POPUPS: Record<
  PracticalTutorialPopupStep,
  { button: string; text: string; title: string }
> = {
  intro: {
    button: 'Começar',
    text: 'Toque em uma peça livre para enviá-la para a bandeja.',
    title: 'Forme trincas',
  },
  tray: {
    button: 'Entendi',
    text: 'As peças escolhidas ficam aqui. Junte 3 iguais para formar uma trinca.',
    title: 'Bandeja',
  },
  triple: {
    button: 'Continuar',
    text: 'Quando 3 peças iguais entram na bandeja, elas somem e liberam espaço.',
    title: 'Muito bem!',
  },
  warning: {
    button: 'Jogar',
    text: 'Se todos os espaços ativos encherem antes de formar uma trinca, você perde.',
    title: 'Cuidado com a bandeja',
  },
};

export const isPracticalTutorialPopupStep = (
  step: PracticalTutorialStep,
): step is PracticalTutorialPopupStep =>
  step === 'intro' ||
  step === 'tray' ||
  step === 'triple' ||
  step === 'warning';

export const isPracticalTutorialTapStep = (step: PracticalTutorialStep) =>
  step === 'tap-first' || step === 'tap-second' || step === 'tap-third';

const sortTilesForTutorial = (tiles: Tile[]) =>
  [...tiles].sort((firstTile, secondTile) => {
    if (firstTile.z !== secondTile.z) {
      return firstTile.z - secondTile.z;
    }

    if (firstTile.y !== secondTile.y) {
      return firstTile.y - secondTile.y;
    }

    return firstTile.x - secondTile.x;
  });

export const getTutorialAvailableTiles = (
  board: Tile[],
  preferredKind?: TileKind,
) => {
  const availableTiles = sortTilesForTutorial(
    getAvailableTiles(board).filter((tile) => !isMysteryTileHidden(tile)),
  );

  return preferredKind
    ? availableTiles.filter((tile) => tile.kind === preferredKind)
    : availableTiles;
};

export const findOpeningTutorialTile = (board: Tile[]) => {
  const availableTiles = getTutorialAvailableTiles(board);
  const countsByKind = availableTiles.reduce<Map<TileKind, Tile[]>>(
    (counts, tile) => {
      counts.set(tile.kind, [...(counts.get(tile.kind) ?? []), tile]);
      return counts;
    },
    new Map<TileKind, Tile[]>(),
  );

  return (
    Array.from(countsByKind.values()).find((tiles) => tiles.length >= 3)?.[0] ??
    availableTiles[0]
  );
};
