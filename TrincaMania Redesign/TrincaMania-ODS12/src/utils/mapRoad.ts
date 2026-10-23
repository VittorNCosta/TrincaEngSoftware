/**
 * Centro da rua pintada nas artes dos mapas, do topo para a base. As dez artes
 * da campanha compartilham este traçado; os valores são frações da largura.
 */
const ROAD_CENTERS = [
  0.502, 0.497, 0.536, 0.624, 0.634, 0.556, 0.459, 0.479, 0.591, 0.633, 0.612,
  0.544, 0.461, 0.455, 0.519, 0.567, 0.546, 0.498, 0.491, 0.5, 0.501,
] as const;

// A rua termina e recomeça no centro da arte. Usar a imagem inteira evita
// que as estruturas laterais sejam cortadas a cada repetição.
export const MAP_ROAD_TOP_CROP = 0;
export const getMapRoadImageHeight = (width: number): number =>
  (width * 16) / 9;
export const getMapRoadTileHeight = (width: number): number =>
  getMapRoadImageHeight(width) * (1 - MAP_ROAD_TOP_CROP);

export const getMapRoadCenterFraction = (heightFraction: number): number => {
  const position =
    Math.max(0, Math.min(1, heightFraction)) * (ROAD_CENTERS.length - 1);
  const index = Math.floor(position);
  const next = ROAD_CENTERS[Math.min(index + 1, ROAD_CENTERS.length - 1)];
  return (
    ROAD_CENTERS[index] + (next - ROAD_CENTERS[index]) * (position - index)
  );
};

export const getMapRoadCenterAt = (y: number, width: number): number => {
  const tileHeight = getMapRoadTileHeight(width);
  const tileIndex = Math.floor(y / tileHeight);
  const fraction =
    MAP_ROAD_TOP_CROP +
    ((y - tileIndex * tileHeight) / tileHeight) * (1 - MAP_ROAD_TOP_CROP);
  const center = getMapRoadCenterFraction(fraction);
  return center;
};
