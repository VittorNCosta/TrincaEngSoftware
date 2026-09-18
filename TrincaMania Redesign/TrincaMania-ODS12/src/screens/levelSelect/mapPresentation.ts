import type { Level, WorldId } from '../../types/game';

export const MAP_HEIGHT = 1320;
export const MAP_WIDTH = 320;
export const MAP_MIN_HEIGHT = 960;
export const MAP_NODE_BOTTOM = 116;
export const MAP_NODE_STEP = 110;
// Folga no topo para a bolha mais alta não ficar sob o HUD flutuante.
export const MAP_NODE_TOP_PADDING = 170;
export const NODE_PATH_LEFTS = [112, 42, 202, 72, 184, 46, 206, 82, 190, 118];
// Altura aproximada da área visível do mapa; só alimenta o parallax.
export const MAP_VIEWPORT_ESTIMATE = 720;
// Quanto o cenário anda no total: 0,25x o percurso das bolhas.
export const MAP_PARALLAX_TRAVEL = 260;
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
) => ({
  left: NODE_PATH_LEFTS[localIndex % NODE_PATH_LEFTS.length],
  top: mapHeight - MAP_NODE_BOTTOM - localIndex * MAP_NODE_STEP,
});

export const getShopMarkerPosition = (
  localIndex: number,
  mapHeight: number,
  hasPortal: boolean,
) => {
  const levelPosition = getLevelNodePosition(localIndex, mapHeight);
  const sideLeft = levelPosition.left > MAP_WIDTH / 2 ? 18 : 186;

  return {
    left: hasPortal ? 18 : sideLeft,
    top: Math.max(28, levelPosition.top - 48),
  };
};

export const getPortalMarkerPosition = (
  localIndex: number,
  mapHeight: number,
) => {
  const levelPosition = getLevelNodePosition(localIndex, mapHeight);

  return {
    left: 186,
    top: Math.max(20, levelPosition.top - 82),
  };
};

export const getBonusChestMarkerPosition = (mapHeight: number) => ({
  left: 88,
  top: Math.max(170, mapHeight - MAP_NODE_BOTTOM - MAP_NODE_STEP * 2 - 56),
});

export const MAP_OBJECTIVE_SNIPPETS = [
  'Forme trincas e limpe a mesa.',
  'Libere peças e avance.',
  'Observe as camadas.',
  'Complete para continuar.',
];

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
    case 21:
      return 'Jardim Renascido';
    default:
      return '';
  }
};
