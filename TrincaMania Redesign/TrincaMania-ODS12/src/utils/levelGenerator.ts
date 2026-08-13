import { LEVELS } from '../data/levels';
import {
  GeneratedLevelOptions,
  Level,
  LevelDifficultyProfile,
  Tile,
  TileKind,
} from '../types/game';
import {
  TRIPLE_SIZE,
  assignCardsToRemovalOrder,
  buildMaterialSequence,
} from '../domain/recycling/services/LevelCompositionService';
import { TILE_SIZE, isDrawnAbove } from './gameLogic';

type TileRect = {
  bottom: number;
  left: number;
  right: number;
  top: number;
};

export const LEVEL_DIFFICULTY_PROFILES: Record<string, LevelDifficultyProfile> = {
  ...LEVELS.reduce<Record<string, LevelDifficultyProfile>>((profiles, level) => {
    profiles[level.id] = {
      difficulty: level.difficulty,
      kindCount: new Set(level.tiles.map((tile) => tile.kind)).size,
      maxZ: Math.max(...level.tiles.map((tile) => tile.z)),
      mysteryTileCount: level.mysteryTileCount ?? 0,
      openingTriple: level.worldId === 1 && level.worldLevelNumber <= 3,
      tileCount: level.tiles.length,
    };

    return profiles;
  }, {}),
};

const getTileRect = (tile: Tile): TileRect => ({
  bottom: tile.y + TILE_SIZE,
  left: tile.x,
  right: tile.x + TILE_SIZE,
  top: tile.y,
});

const rectanglesOverlap = (firstRect: TileRect, secondRect: TileRect) =>
  firstRect.left < secondRect.right &&
  firstRect.right > secondRect.left &&
  firstRect.top < secondRect.bottom &&
  firstRect.bottom > secondRect.top;

const isBlocked = (tile: Tile, board: Tile[]) => {
  if (tile.removed) {
    return false;
  }

  const tileRect = getTileRect(tile);
  const tileIndex = board.findIndex((boardTile) => boardTile.id === tile.id);

  return board.some(
    (otherTile, otherIndex) =>
      otherTile.id !== tile.id &&
      !otherTile.removed &&
      isDrawnAbove(otherTile, otherIndex, tile, tileIndex) &&
      rectanglesOverlap(tileRect, getTileRect(otherTile)),
  );
};

const shuffleList = <T,>(items: T[], random: () => number) => {
  const shuffledItems = [...items];

  for (let index = shuffledItems.length - 1; index > 0; index -= 1) {
    const targetIndex = Math.floor(random() * (index + 1));
    [shuffledItems[index], shuffledItems[targetIndex]] = [
      shuffledItems[targetIndex],
      shuffledItems[index],
    ];
  }

  return shuffledItems;
};

const pickRandomItem = <T,>(items: T[], random: () => number) =>
  items[Math.floor(random() * items.length)];

const getAvailableTiles = (board: Tile[]) =>
  board.filter((tile) => !tile.removed && !isBlocked(tile, board));

const markRemoved = (board: Tile[], tileId: string) =>
  board.map((tile) => (tile.id === tileId ? { ...tile, removed: true } : tile));

const getOpeningTriple = (board: Tile[], random: () => number) => {
  const availableTiles = getAvailableTiles(board);
  const topRowTiles = availableTiles.filter((tile) => tile.z === 0).slice(0, 6);

  return shuffleList(topRowTiles.length >= 3 ? topRowTiles : availableTiles, random).slice(0, 3);
};

const buildPlayableRemovalOrder = (
  layout: Tile[],
  profile: LevelDifficultyProfile,
  preserveOpeningTriple: boolean,
  random: () => number,
) => {
  let workingBoard: Tile[] = layout.map((tile) => ({ ...tile, removed: false }));
  const removalOrder: Tile[] = [];

  if (profile.openingTriple && preserveOpeningTriple) {
    const openingTriple = getOpeningTriple(workingBoard, random);

    openingTriple.forEach((tile) => {
      removalOrder.push(tile);
      workingBoard = markRemoved(workingBoard, tile.id);
    });
  }

  while (removalOrder.length < layout.length) {
    const availableTiles = getAvailableTiles(workingBoard);

    if (availableTiles.length === 0) {
      return layout;
    }

    const selectedTile = pickRandomItem(availableTiles, random);
    removalOrder.push(selectedTile);
    workingBoard = markRemoved(workingBoard, selectedTile.id);
  }

  return removalOrder;
};

const countKinds = (tiles: Tile[]) =>
  tiles.reduce<Map<TileKind, number>>((counts, tile) => {
    counts.set(tile.kind, (counts.get(tile.kind) ?? 0) + 1);
    return counts;
  }, new Map<TileKind, number>());

const addMysteryTiles = (
  tiles: Tile[],
  mysteryTileCount: number,
  random: () => number,
) => {
  if (mysteryTileCount <= 0) {
    return tiles;
  }

  const candidates = shuffleList(
    tiles.filter((tile) => !tile.removed && isBlocked(tile, tiles)),
    random,
  );
  const visibleCounts = countKinds(tiles);
  const mysteryCounts = new Map<TileKind, number>();
  const mysteryTileIds = new Set<string>();

  const selectCandidates = (allowRepeatedKind: boolean) => {
    candidates.forEach((tile) => {
      if (mysteryTileIds.size >= mysteryTileCount || mysteryTileIds.has(tile.id)) {
        return;
      }

      if ((visibleCounts.get(tile.kind) ?? 0) <= 1) {
        return;
      }

      if (!allowRepeatedKind && (mysteryCounts.get(tile.kind) ?? 0) > 0) {
        return;
      }

      mysteryTileIds.add(tile.id);
      visibleCounts.set(tile.kind, (visibleCounts.get(tile.kind) ?? 1) - 1);
      mysteryCounts.set(tile.kind, (mysteryCounts.get(tile.kind) ?? 0) + 1);
    });
  };

  selectCandidates(false);
  selectCandidates(true);

  if (mysteryTileIds.size === 0) {
    return tiles;
  }

  return tiles.map((tile) =>
    mysteryTileIds.has(tile.id)
      ? {
          ...tile,
          mystery: true,
          revealed: false,
        }
      : tile,
  );
};

const clampLayoutToProfile = (level: Level, profile: LevelDifficultyProfile) =>
  level.tiles
    .slice(0, profile.tileCount)
    .filter((tile) => tile.z <= profile.maxZ)
    .slice(0, profile.tileCount);

/**
 * Núcleo da geração: recebe o tabuleiro-base e o perfil já resolvidos.
 *
 * Existe separado de `generatePlayableLevel` porque os mapas de capítulo não
 * moram em `LEVELS` — eles montam o layout sob demanda e entram por aqui com o
 * mesmo contrato. A regra de vencibilidade (ordem de remoção comprovada antes
 * de distribuir as cartas) é a mesma para os dois caminhos.
 */
export const generatePlayableLevelFrom = (
  baseLevel: Level,
  profile: LevelDifficultyProfile,
  options: GeneratedLevelOptions = {},
): Level => {
  const random = options.random ?? Math.random;
  const preserveOpeningTriple = options.preserveOpeningTriple ?? true;
  const layout = clampLayoutToProfile(baseLevel, profile);

  if (layout.length !== profile.tileCount || layout.length % TRIPLE_SIZE !== 0) {
    return baseLevel;
  }

  const removalOrder = buildPlayableRemovalOrder(layout, profile, preserveOpeningTriple, random);
  const materialSequence = buildMaterialSequence(
    layout.length / TRIPLE_SIZE,
    profile.kindCount,
    random,
  );
  const tiles = addMysteryTiles(
    assignCardsToRemovalOrder({
      layout,
      materialSequence,
      removalOrder,
      // Varia só a arte do resíduo entre partidas; material e papel continuam
      // presos à ordem de remoção, que é o que garante a fase vencível.
      variantSeed: Math.floor(random() * 1000),
    }),
    profile.mysteryTileCount ?? 0,
    random,
  );

  return {
    ...baseLevel,
    difficulty: profile.difficulty,
    tiles,
  };
};

export const generatePlayableLevel = (
  levelId: string,
  options: GeneratedLevelOptions = {},
): Level => {
  const baseLevel = LEVELS.find((level) => level.id === levelId) ?? LEVELS[0];

  return generatePlayableLevelFrom(
    baseLevel,
    LEVEL_DIFFICULTY_PROFILES[baseLevel.id],
    options,
  );
};
