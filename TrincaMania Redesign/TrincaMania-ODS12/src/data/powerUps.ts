import { PowerUpType } from '../types/game';

export type PowerUpUiInfo = {
  description: string;
  icon: string;
  label: string;
  shopTitle: string;
};

export const POWER_UP_UI: Record<PowerUpType, PowerUpUiInfo> = {
  hint: {
    description: 'Forma uma trinca possível automaticamente.',
    icon: '✨',
    label: 'Trinca Mágica',
    shopTitle: 'Trinca Mágica',
  },
  shuffle: {
    description: 'Reorganiza as peças restantes.',
    icon: '\u{1F500}',
    label: 'Misturar',
    shopTitle: 'Saco de brilho',
  },
  undo: {
    description: 'Volta a última jogada.',
    icon: '\u21A9',
    label: 'Voltar',
    shopTitle: 'Folha do retorno',
  },
};

export const POWER_UP_ORDER: PowerUpType[] = ['hint', 'shuffle', 'undo'];
