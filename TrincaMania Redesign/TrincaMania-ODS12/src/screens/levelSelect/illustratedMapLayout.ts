import type { WorldId } from '../../types/game';
import { getVisualWorldId } from '../../data/worldVisualAssets';

// Coordenadas da trilha nas ilustrações ODS 12, normalizadas para 576 × 1024.
// A âncora é o contato do pedestal com o chão, não o centro do botão.
export const MAP_ART_SIZE = { width: 576, height: 1024 };
export const MAP_ART_TOP_INSET = 140;
export const MAP_ART_BOTTOM_INSET = 32;
export const LEVEL_GROUND_YS = [
  936, 848, 760, 672, 584, 496, 408, 320, 232, 144,
];

const TRAIL_XS: Record<number, readonly number[]> = {
  1: [284, 296, 326, 264, 289, 358, 340, 261, 348, 351],
  2: [284, 295, 324, 265, 287, 353, 339, 259, 347, 351],
  3: [283, 297, 326, 264, 287, 358, 339, 260, 347, 352],
  4: [285, 295, 327, 266, 292, 358, 340, 262, 348, 352],
  5: [284, 296, 326, 265, 289, 358, 341, 261, 348, 352],
  6: [284, 297, 326, 265, 289, 359, 341, 261, 348, 352],
  7: [284, 297, 327, 265, 291, 359, 340, 262, 349, 352],
  8: [284, 298, 328, 263, 297, 360, 332, 271, 353, 352],
  9: [285, 296, 327, 266, 290, 359, 340, 262, 348, 352],
  10: [287, 301, 320, 271, 314, 356, 293, 277, 351, 293],
};

export const getIllustratedMapLayout = (worldId: WorldId, width: number) => {
  // Os capítulos mantêm sua apresentação própria; esta cena é da campanha.
  if (worldId >= 101) return undefined;
  const xs = TRAIL_XS[getVisualWorldId(worldId)];
  if (!xs) return undefined;
  const scale = Math.max(1, width) / MAP_ART_SIZE.width;
  // O bônus tem três fases, distribuídas pela trilha do Viveiro já utilizado.
  const indices = worldId === 21 ? [0, 4, 8] : LEVEL_GROUND_YS.map((_, i) => i);
  const groundPoints = indices.map((index) => ({
    x: xs[index] * scale,
    y: MAP_ART_TOP_INSET + LEVEL_GROUND_YS[index] * scale,
  }));
  return {
    scale,
    width,
    artHeight: MAP_ART_SIZE.height * scale,
    height:
      MAP_ART_TOP_INSET + MAP_ART_SIZE.height * scale + MAP_ART_BOTTOM_INSET,
    groundPoints,
    previousSign: { x: 362 * scale, y: MAP_ART_TOP_INSET + 998 * scale },
    nextSign: { x: 270 * scale, y: MAP_ART_TOP_INSET + 112 * scale },
  };
};

export type IllustratedMapLayout = NonNullable<
  ReturnType<typeof getIllustratedMapLayout>
>;
