import { msg } from '../messages';
import { POWER_UP_ORDER, POWER_UP_UI } from '../../data/powerUps';
import { spacing, touchTargets } from '../styles/theme';
import type { PowerUpType, ProgressState } from '../../types/game';
import { POWER_UP_COSTS } from '../../utils/gameLogic';

export type RaviExpression = 'default' | 'explain' | 'happy' | 'insufficient';
export type ShopPurchaseCallback = (
  power: PowerUpType,
  useImmediately: false,
) => Promise<boolean>;
export type ShopPurchaseLock = { pending: PowerUpType | null };
export type ShopPurchaseResult =
  | { status: 'purchased' | 'failed' | 'busy' }
  | { status: 'insufficient'; shortfall: number };

export const getShopProducts = (
  progress: Pick<ProgressState, 'itemCounts'>,
  isUnlocked: (power: PowerUpType) => boolean,
) =>
  POWER_UP_ORDER.map((power) => ({
    power,
    title: POWER_UP_UI[power].shopTitle,
    description: POWER_UP_UI[power].description,
    price: POWER_UP_COSTS[power],
    quantity: progress.itemCounts[power],
    unlocked: isUnlocked(power),
  }));

// Initiation only: the callback in App owns persistence, wallet and inventory.
export async function requestShopPurchase(
  lock: ShopPurchaseLock,
  power: PowerUpType,
  coins: number,
  onPurchasePowerUp: ShopPurchaseCallback,
): Promise<ShopPurchaseResult> {
  if (lock.pending !== null) return { status: 'busy' };
  const shortfall = POWER_UP_COSTS[power] - coins;
  if (shortfall > 0) return { status: 'insufficient', shortfall };
  lock.pending = power;
  try {
    return {
      status: (await onPurchasePowerUp(power, false)) ? 'purchased' : 'failed',
    };
  } catch {
    return { status: 'failed' };
  } finally {
    lock.pending = null;
  }
}

export const SHOP_REACTION_DURATION_MS = 3000;
const PRODUCT_SPEECH: Record<PowerUpType, string> = {
  hint: msg('Ajuda quando aperta.'),
  shuffle: msg('Abra novos caminhos.'),
  undo: msg('Voltar pode ajudar.'),
};
export type ShopReaction = {
  expression: RaviExpression;
  message: string;
  showPlusOne: boolean;
  feedbackTone?: 'success' | 'error';
};
export const getShopReaction = (
  event: 'entry' | 'select' | ShopPurchaseResult['status'],
  power?: PowerUpType,
  shortfall = 0,
): ShopReaction => {
  if (event === 'select' && power)
    return {
      expression: 'explain',
      message: PRODUCT_SPEECH[power],
      showPlusOne: false,
    };
  if (event === 'purchased')
    return {
      expression: 'happy',
      message: msg('Boa escolha!'),
      showPlusOne: true,
      feedbackTone: 'success',
    };
  if (event === 'insufficient')
    return {
      expression: 'insufficient',
      message: msg('Quase! Faltam {param1} moedas.', {
        param1: String(shortfall),
      }),
      showPlusOne: false,
      feedbackTone: 'error',
    };
  return {
    expression: 'default',
    message:
      event === 'failed'
        ? msg('Não deu certo. Tente de novo.')
        : msg('O que vai levar?'),
    showPlusOne: false,
    ...(event === 'failed' ? { feedbackTone: 'error' as const } : {}),
  };
};

// Width is measured inside the scroll content: safe areas, nav and padding are
// handled by the screen's flex regions. Reserve readable text per offer instead
// of estimating native text heights or forcing every purchase above the fold.
export function getShopLayout(contentWidth: number, fontScale = 1) {
  const width = Number.isFinite(contentWidth) ? Math.max(0, contentWidth) : 0;
  const textScale = Number.isFinite(fontScale) ? Math.max(1, fontScale) : 1;
  const offerColumns = width >= 144 * textScale * 2 + spacing.sm ? 2 : 1;
  const offerWidth = (width - spacing.sm * (offerColumns - 1)) / offerColumns;
  const merchantWidth = Math.min(104, Math.max(80, Math.round(width * 0.28)));
  return {
    offerColumns,
    offerWidth,
    productSize:
      offerColumns === 1 ? 88 : Math.min(96, Math.round(offerWidth * 0.62)),
    merchantWidth,
    merchantHeight: 96,
    stackMerchant: width < merchantWidth + spacing.md + 140 * textScale,
    stackHeader: width < 260 * textScale,
    stackTray: width < 280 * textScale,
    buyTargetHeight: touchTargets.minimum,
  };
}
