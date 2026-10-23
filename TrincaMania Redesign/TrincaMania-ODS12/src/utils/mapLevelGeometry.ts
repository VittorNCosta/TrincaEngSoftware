// The pedestal's contact shadow is the anchor on the painted trail.
// Keep drawing, positioning and scaling tied to this point in every map.
export const MAP_LEVEL_SIZE = { width: 88, height: 98 } as const;
export const MAP_LEVEL_GROUND_POINT = { x: 44, y: 89 } as const;
export const MAP_LEVEL_ORIGIN = {
  x: MAP_LEVEL_GROUND_POINT.x / MAP_LEVEL_SIZE.width,
  y: MAP_LEVEL_GROUND_POINT.y / MAP_LEVEL_SIZE.height,
} as const;
export const MAP_LEVEL_PEDESTAL_FRAME = {
  left: 6,
  top: 64,
  width: 76,
  height: 28.5,
} as const;
