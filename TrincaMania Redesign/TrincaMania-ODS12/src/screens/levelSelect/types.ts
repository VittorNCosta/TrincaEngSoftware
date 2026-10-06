import type { WorldId } from '../../types/game';

export type SelectedTarget =
  | {
      levelId: string;
      type: 'level';
    }
  | {
      afterLevelId: string;
      comingSoon: boolean;
      type: 'shop';
    }
  | {
      afterLevelId: string;
      targetWorldId: WorldId;
      type: 'worldPortal';
    }
  | {
      type: 'bonusChest';
    };
