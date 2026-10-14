import type { Level, LevelDifficulty, WorldId } from '../../types/game';
import { getMapRoadCenterFraction } from '../../utils/mapRoad';
import {
  MAP_LEVEL_GROUND_POINT,
  MAP_LEVEL_SIZE,
} from '../../utils/mapLevelGeometry';

export const MAP_HEIGHT = 1320;
export const MAP_WIDTH = 320;
export const MAP_MIN_HEIGHT = 960;
export const MAP_NODE_BOTTOM = 116;
export const MAP_NODE_STEP = 110;
// Folga no topo para a bolha mais alta não ficar sob o HUD flutuante.
export const MAP_NODE_TOP_PADDING = 170;
export const MAP_NODE_WIDTH = MAP_LEVEL_SIZE.width;
export const MAP_NODE_GROUND_OFFSET = MAP_LEVEL_GROUND_POINT.y;
export const LEGACY_MAP_OPENING_BOTTOM_INSET = 48;
export const LEGACY_MAP_OPENING_FOCUS_RATIO = 0.45;
export const LEGACY_MAP_OPENING_TOP_INSET = 170;

export const getWorldMapHeight = (levelCount: number) =>
  Math.max(
    MAP_MIN_HEIGHT,
    MAP_NODE_TOP_PADDING +
      MAP_NODE_BOTTOM +
      Math.max(0, levelCount - 1) * MAP_NODE_STEP,
  );

export const getLevelNodePosition = (
  localIndex: number,
  mapHeight: number,
  viewportWidth = MAP_WIDTH,
) => {
  const top = mapHeight - MAP_NODE_BOTTOM - localIndex * MAP_NODE_STEP;
  const roadX =
    getMapRoadCenterFraction((top + MAP_NODE_GROUND_OFFSET) / mapHeight) *
    viewportWidth;

  return {
    left: roadX - MAP_LEVEL_GROUND_POINT.x,
    top,
  };
};

export const getShopMarkerPosition = (
  localIndex: number,
  mapHeight: number,
  hasPortal: boolean,
  viewportWidth = MAP_WIDTH,
) => {
  const levelPosition = getLevelNodePosition(localIndex, mapHeight);
  const sideLeft = levelPosition.left > MAP_WIDTH / 2 ? 18 : 186;

  return {
    left: (viewportWidth - MAP_WIDTH) / 2 + (hasPortal ? 18 : sideLeft),
    top: Math.max(28, levelPosition.top - 48),
  };
};

export const getPortalMarkerPosition = (
  localIndex: number,
  mapHeight: number,
  viewportWidth = MAP_WIDTH,
) => {
  const levelPosition = getLevelNodePosition(localIndex, mapHeight);

  return {
    left: (viewportWidth - MAP_WIDTH) / 2 + 186,
    top: Math.max(20, levelPosition.top - 82),
  };
};

export const getBonusChestMarkerPosition = (
  mapHeight: number,
  viewportWidth = MAP_WIDTH,
) => ({
  left: (viewportWidth - MAP_WIDTH) / 2 + 88,
  top: Math.max(170, mapHeight - MAP_NODE_BOTTOM - MAP_NODE_STEP * 2 - 56),
});

export const MAP_OBJECTIVE_SNIPPETS = [
  'Forme trincas e limpe o tabuleiro.',
  'Libere peças e avance.',
  'Observe as camadas.',
  'Complete para continuar.',
];

const DIFFICULTY_LABELS: Record<LevelDifficulty, string> = {
  easy: 'Fácil',
  normal: 'Normal',
  hard: 'Difícil',
  expert: 'Avançado',
  master: 'Mestre',
  bonus: 'Bônus',
};

export const getDifficultyLabel = (difficulty: LevelDifficulty) =>
  DIFFICULTY_LABELS[difficulty];

export const getShortObjective = (level: Level) =>
  level.worldId === 1
    ? MAP_OBJECTIVE_SNIPPETS[
        (level.worldLevelNumber - 1) % MAP_OBJECTIVE_SNIPPETS.length
      ]
    : level.objectiveText.replace(/^Objetivo:\s*/, '');

export const getWorldSelectorSubtitle = (worldId: WorldId) => {
  switch (worldId) {
    case 1:
      return 'Parque';
    case 2:
      return 'Vale';
    case 3:
      return 'Central';
    case 4:
      return 'Viveiro';
    case 5:
      return 'Usina';
    case 6:
      return 'Cooperativa';
    case 7:
      return 'Rota';
    case 8:
      return 'Fórum';
    case 9:
      return 'Distrito';
    case 10:
      return 'Cúpula';
    case 21:
      return 'Jardim Renascido';
    default:
      return '';
  }
};
