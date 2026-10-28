import type { WorldId } from '../../types/game';

export type SelectedTarget =
  | {
      levelId: string;
      type: 'level';
    }
  | {
      afterLevelId: string;
      targetWorldId: WorldId;
      type: 'worldPortal';
    };
