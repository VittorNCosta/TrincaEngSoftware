import { MaterialType } from '../domain/recycling/value-objects/MaterialType';

export type MaterialTileColors = {
  material: string;
  surface: string;
  border: string;
  depth: string;
  innerShade: string;
};

export const MATERIAL_TILE_PALETTE: Record<MaterialType, MaterialTileColors> = {
  plastico: {
    material: '#D6321E',
    surface: '#EA7565',
    border: '#9C2114',
    depth: '#6A180F',
    innerShade: 'rgba(106, 24, 15, 0.16)',
  },
  papel: {
    material: '#0B5FBF',
    surface: '#5C9ED8',
    border: '#08428A',
    depth: '#05285C',
    innerShade: 'rgba(5, 40, 92, 0.16)',
  },
  vidro: {
    material: '#1E9E4A',
    surface: '#60BE79',
    border: '#136D31',
    depth: '#0C4920',
    innerShade: 'rgba(12, 73, 32, 0.16)',
  },
  metal: {
    material: '#F2B705',
    surface: '#E7C448',
    border: '#8B6200',
    depth: '#5C4100',
    innerShade: 'rgba(92, 65, 0, 0.16)',
  },
  organico: {
    material: '#7A4A21',
    surface: '#AF8053',
    border: '#5B3517',
    depth: '#3B220E',
    innerShade: 'rgba(59, 34, 14, 0.16)',
  },
};

// Tons exclusivos da partida: preservam a família do material com mais luz.
const GAMEPLAY_TILE_SURFACES: Record<MaterialType, string> = {
  plastico: '#F09B8F',
  papel: '#88B8E5',
  vidro: '#8DD1A0',
  metal: '#F4D782',
  organico: '#C6A17D',
};

export function getMaterialTilePalette(
  kind: MaterialType,
  duringGame = false,
): MaterialTileColors {
  const palette = MATERIAL_TILE_PALETTE[kind];
  return duringGame
    ? { ...palette, surface: GAMEPLAY_TILE_SURFACES[kind] }
    : palette;
}

export function getMaterialTileBaseStyle(
  kind: MaterialType,
  duringGame = false,
) {
  const palette = getMaterialTilePalette(kind, duringGame);
  return {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderBottomColor: palette.depth,
  };
}

export function getMaterialTileInk(kind: MaterialType) {
  return kind === 'metal' || kind === 'vidro' ? '#11252B' : '#FFFFFF';
}
