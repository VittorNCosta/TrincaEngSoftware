import { msg } from '../messages';
import { PowerUpType } from '../../types/game';
import { POWER_UP_COSTS } from '../../utils/gameLogic';

export type PowerToolAvailability = 'locked' | 'owned' | 'purchasable';

export type PowerToolPresentation = {
  accessibilityDetail: string;
  availability: PowerToolAvailability;
  badgeText: string;
  inventoryCount: number;
  price?: number;
};

/**
 * View-model barato dos tool buttons de gameplay.
 *
 * O preço vem da economia canônica e o bloqueio vem do estado real da tela
 * (desbloqueio persistido da campanha). Nenhum limiar de desbloqueio é inventado na UI.
 */
export const getPowerToolPresentation = (
  powerType: PowerUpType,
  rawInventoryCount: number,
  locked: boolean,
): PowerToolPresentation => {
  const inventoryCount = Number.isFinite(rawInventoryCount)
    ? Math.max(0, Math.floor(rawInventoryCount))
    : 0;

  if (locked) {
    return {
      accessibilityDetail: msg('bloqueado pela progressão'),
      availability: 'locked',
      // Internal availability token; the locked branch renders the lock icon,
      // never this value as player-facing copy.
      badgeText: 'locked',
      inventoryCount,
    };
  }

  if (inventoryCount > 0) {
    return {
      accessibilityDetail: `${inventoryCount} ${
        inventoryCount === 1
          ? msg('unidade disponível')
          : msg('unidades disponíveis')
      }`,
      availability: 'owned',
      badgeText: `x${inventoryCount}`,
      inventoryCount,
    };
  }

  const price = POWER_UP_COSTS[powerType];

  return {
    accessibilityDetail: msg('sem unidades, comprar por {param1} moedas', {
      param1: String(price),
    }),
    availability: 'purchasable',
    badgeText: `${price}`,
    inventoryCount,
    price,
  };
};
