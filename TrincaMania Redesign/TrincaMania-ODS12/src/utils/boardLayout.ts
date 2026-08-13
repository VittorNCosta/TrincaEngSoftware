import type { Tile } from '../types/game';
import { BOARD_HEIGHT, BOARD_WIDTH, TILE_SIZE } from './gameLogic';

export type BoardBounds = {
  bottom: number;
  height: number;
  left: number;
  right: number;
  top: number;
  width: number;
};

export type BoardViewport = {
  height: number;
  width: number;
};

export type BoardFrame = BoardBounds & {
  belowPreferredMinimum: boolean;
  safeMargin: number;
  scale: number;
};

export type BoardFitOptions = {
  maxScale?: number;
  minScale?: number;
  safeMargin?: number;
};

export type RenderedTileFrame = {
  height: number;
  width: number;
  x: number;
  y: number;
};

export const BOARD_SAFE_MARGIN = 10;
export const BOARD_MIN_PREFERRED_SCALE = 0.72;
export const BOARD_MAX_SCALE = 1.2;

const finiteNonNegative = (value: number, fallback: number) =>
  Number.isFinite(value) ? Math.max(0, value) : fallback;

const finitePositive = (value: number, fallback: number) =>
  Number.isFinite(value) && value > 0 ? value : fallback;

/**
 * Retorna o envelope estrutural do tabuleiro.
 *
 * Nenhuma flag de gameplay e filtrada de proposito: pecas mystery, reveladas ou
 * removidas continuam participando do envelope. Assim, o enquadramento calculado
 * no inicio da rodada permanece valido ate o fim, sem saltar depois de uma trinca.
 */
export const getBoardBounds = (
  tiles: ReadonlyArray<Pick<Tile, 'x' | 'y'>>,
  tileSize = TILE_SIZE,
): BoardBounds => {
  const safeTileSize = finitePositive(tileSize, TILE_SIZE);
  const positionedTiles = tiles.filter(
    (tile) => Number.isFinite(tile.x) && Number.isFinite(tile.y),
  );

  if (positionedTiles.length === 0) {
    return {
      bottom: BOARD_HEIGHT,
      height: BOARD_HEIGHT,
      left: 0,
      right: BOARD_WIDTH,
      top: 0,
      width: BOARD_WIDTH,
    };
  }

  const left = Math.min(...positionedTiles.map((tile) => tile.x));
  const top = Math.min(...positionedTiles.map((tile) => tile.y));
  const right = Math.max(...positionedTiles.map((tile) => tile.x + safeTileSize));
  const bottom = Math.max(...positionedTiles.map((tile) => tile.y + safeTileSize));

  return {
    bottom,
    height: bottom - top,
    left,
    right,
    top,
    width: right - left,
  };
};

/**
 * Ajusta bounds a uma area ja reservada pelo layout (entre HUD e bandeja).
 * A margem e a contencao sempre vencem a escala minima preferida: numa area
 * excepcionalmente pequena, reduzir um pouco mais e mais seguro que cobrir HUD.
 */
export const fitBoardToViewport = (
  bounds: BoardBounds,
  viewport: BoardViewport,
  options: BoardFitOptions = {},
): BoardFrame => {
  const viewportWidth = finiteNonNegative(viewport.width, 0);
  const viewportHeight = finiteNonNegative(viewport.height, 0);
  const safeMargin = finiteNonNegative(options.safeMargin ?? BOARD_SAFE_MARGIN, BOARD_SAFE_MARGIN);
  const minScale = finitePositive(
    options.minScale ?? BOARD_MIN_PREFERRED_SCALE,
    BOARD_MIN_PREFERRED_SCALE,
  );
  const configuredMaxScale = finitePositive(options.maxScale ?? BOARD_MAX_SCALE, BOARD_MAX_SCALE);
  const maxScale = Math.max(minScale, configuredMaxScale);
  const boundsWidth = finitePositive(bounds.width, BOARD_WIDTH);
  const boundsHeight = finitePositive(bounds.height, BOARD_HEIGHT);
  const usableWidth = Math.max(0, viewportWidth - safeMargin * 2);
  const usableHeight = Math.max(0, viewportHeight - safeMargin * 2);
  const fitScale = Math.min(usableWidth / boundsWidth, usableHeight / boundsHeight);
  const scale = Math.max(0, Math.min(fitScale, maxScale));
  const width = boundsWidth * scale;
  const height = boundsHeight * scale;
  const left = (viewportWidth - width) / 2;
  const top = (viewportHeight - height) / 2;

  return {
    bottom: top + height,
    belowPreferredMinimum: scale < minScale,
    height,
    left,
    right: left + width,
    safeMargin,
    scale,
    top,
    width,
  };
};

export const isBoardFrameContained = (
  frame: BoardFrame,
  viewport: BoardViewport,
  epsilon = 0.001,
) =>
  frame.left >= frame.safeMargin - epsilon &&
  frame.top >= frame.safeMargin - epsilon &&
  frame.right <= viewport.width - frame.safeMargin + epsilon &&
  frame.bottom <= viewport.height - frame.safeMargin + epsilon;

/**
 * Converte a coordenada original de uma peca para o mesmo retangulo usado pelo
 * desenho/toque. `stageX` e `stageY` podem ser coordenadas locais ou de janela.
 */
export const getRenderedTileFrame = (
  tile: Pick<Tile, 'x' | 'y'>,
  bounds: Pick<BoardBounds, 'left' | 'top'>,
  scale: number,
  stageX = 0,
  stageY = 0,
  tileSize = TILE_SIZE,
): RenderedTileFrame => {
  const safeScale = finiteNonNegative(scale, 0);
  const safeTileSize = finitePositive(tileSize, TILE_SIZE);

  return {
    height: safeTileSize * safeScale,
    width: safeTileSize * safeScale,
    x: stageX + (tile.x - bounds.left) * safeScale,
    y: stageY + (tile.y - bounds.top) * safeScale,
  };
};

export const hasMeaningfulViewportChange = (
  previous: BoardViewport | undefined,
  next: BoardViewport,
  epsilon = 1,
) =>
  previous === undefined ||
  Math.abs(previous.width - next.width) >= epsilon ||
  Math.abs(previous.height - next.height) >= epsilon;
