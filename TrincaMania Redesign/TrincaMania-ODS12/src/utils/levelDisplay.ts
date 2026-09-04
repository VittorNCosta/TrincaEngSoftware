import { Level } from '../types/game';

export const getLevelDisplayLabel = (
  level: Pick<Level, 'displayLabel' | 'number'>,
) => level.displayLabel || String(level.number);
