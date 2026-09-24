import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PowerIcon } from './PowerIcon';
import { POWER_UP_ORDER, POWER_UP_UI } from '../data/powerUps';
import { radii, shadows } from '../styles/theme';
import { PowerUpInventory, PowerUpType } from '../types/game';
import { POWER_UP_COSTS } from '../utils/gameLogic';
import { lightImpact } from '../utils/haptics';

type PowerTone = {
  border: string;
  face: string;
  foot: string;
  label: string;
};

const POWER_TONES: Record<PowerUpType, PowerTone> = {
  hint: {
    border: '#EAF8FF',
    face: '#2E9BEE',
    foot: '#0C4C8E',
    label: '#EAF8FF',
  },
  shuffle: {
    border: '#FFE6FB',
    face: '#C93BBE',
    foot: '#6B1866',
    label: '#FFE6FB',
  },
  undo: {
    border: '#E9FFE2',
    face: '#45BF28',
    foot: '#1B5F0C',
    label: '#E9FFE2',
  },
};

// O texto fica dentro do próprio botão para manter o conjunto compacto em telas
// baixas sem perder a posição fixa nem depender de uma gaveta.
const POWER_LABELS: Record<PowerUpType, string> = {
  hint: 'Trinca',
  shuffle: 'Misturar',
  undo: 'Voltar',
};

type PowerDrawerProps = {
  disabled?: boolean;
  disabledPowers?: Partial<Record<PowerUpType, boolean>>;
  itemCounts: PowerUpInventory;
  onUsePower: (power: PowerUpType) => void;
};

/**
 * Barra persistente de poderes.
 *
 * O nome do componente e as props originais são mantidos para compatibilidade
 * com a tela de jogo, mas não existe mais estado de abrir/fechar: os três poderes
 * permanecem montados, na mesma ordem e ocupando sempre o mesmo espaço.
 */
export function PowerDrawer({
  disabled = false,
  disabledPowers = {},
  itemCounts,
  onUsePower,
}: PowerDrawerProps) {
  const renderPower = (power: PowerUpType) => {
    const tone = POWER_TONES[power];
    const rawInventoryCount = itemCounts[power];
    const inventoryCount = Number.isFinite(rawInventoryCount)
      ? Math.max(0, Math.floor(rawInventoryCount))
      : 0;
    const isPurchasable = inventoryCount === 0;
    const isTemporarilyUnavailable = disabledPowers[power] === true;
    // Sem estoque ainda é uma ação válida: abre a compra compacta dentro da fase.
    // Só um bloqueio global (modal, fim da rodada ou movimento em curso) desativa
    // de fato o botão.
    const isDisabled = disabled;
    const availabilityLabel = isPurchasable
      ? `sem unidades, comprar por ${POWER_UP_COSTS[power]} moedas`
      : isTemporarilyUnavailable
        ? 'indisponível agora'
        : `${inventoryCount} ${inventoryCount === 1 ? 'unidade disponível' : 'unidades disponíveis'}`;

    return (
      <Pressable
        key={power}
        accessibilityLabel={`${POWER_UP_UI[power].label}, ${availabilityLabel}`}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled }}
        disabled={isDisabled}
        onPress={() => {
          lightImpact();
          onUsePower(power);
        }}
        style={({ pressed }) => [
          styles.powerButton,
          {
            backgroundColor: tone.face,
            borderBottomColor: tone.foot,
            borderColor: tone.border,
          },
          isPurchasable ? styles.powerButtonPurchasable : null,
          isTemporarilyUnavailable && !isPurchasable
            ? styles.powerButtonUnavailable
            : null,
          isDisabled ? styles.powerButtonDisabled : null,
          pressed && !isDisabled ? styles.pressed : null,
        ]}
      >
        <View pointerEvents="none" style={styles.powerShine} />
        <View pointerEvents="none" style={styles.iconWrap}>
          <PowerIcon name={power} size={29} />
        </View>
        <Text
          numberOfLines={1}
          pointerEvents="none"
          style={[styles.powerLabel, { color: tone.label }]}
        >
          {POWER_LABELS[power]}
        </Text>
        <View
          pointerEvents="none"
          style={[
            styles.countBadge,
            isPurchasable ? styles.countBadgePurchasable : null,
            isDisabled ? styles.countBadgeDisabled : null,
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              isPurchasable ? styles.badgeTextPurchasable : null,
              isDisabled ? styles.badgeTextDisabled : null,
            ]}
          >
            {isPurchasable ? '+' : inventoryCount}
          </Text>
        </View>
        {isPurchasable ? (
          <View pointerEvents="none" style={styles.purchasePriceBadge}>
            <Text style={styles.purchasePriceText}>
              {POWER_UP_COSTS[power]}
            </Text>
          </View>
        ) : null}
      </Pressable>
    );
  };

  return <View style={styles.dock}>{POWER_UP_ORDER.map(renderPower)}</View>;
}

const styles = StyleSheet.create({
  badgeText: {
    color: '#6B3F00',
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 13,
  },
  badgeTextDisabled: {
    color: '#E7EDF0',
  },
  badgeTextPurchasable: {
    color: '#4A2A00',
    fontSize: 14,
    lineHeight: 16,
  },
  countBadge: {
    alignItems: 'center',
    backgroundColor: '#FFCE62',
    borderColor: '#FFFFFF',
    borderRadius: radii.pill,
    borderWidth: 2,
    height: 20,
    justifyContent: 'center',
    minWidth: 20,
    paddingHorizontal: 3,
    position: 'absolute',
    right: -4,
    top: -5,
  },
  countBadgeDisabled: {
    backgroundColor: '#5D6A70',
    borderColor: '#D5DEE2',
  },
  countBadgePurchasable: {
    backgroundColor: '#FFD35A',
    borderColor: '#FFF8D4',
  },
  dock: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    flexShrink: 1,
    gap: 6,
    justifyContent: 'flex-end',
    minHeight: 66,
    paddingBottom: 8,
    paddingTop: 6,
  },
  iconWrap: {
    marginBottom: 8,
  },
  powerButton: {
    alignItems: 'center',
    borderBottomWidth: 4,
    borderRadius: 16,
    borderWidth: 3,
    height: 52,
    justifyContent: 'center',
    position: 'relative',
    width: 52,
    ...shadows.button,
  },
  powerButtonDisabled: {
    opacity: 0.68,
  },
  powerButtonPurchasable: {
    borderColor: '#FFE178',
  },
  powerButtonUnavailable: {
    opacity: 0.78,
  },
  powerLabel: {
    bottom: 2,
    fontSize: 7.5,
    fontWeight: '900',
    left: 1,
    letterSpacing: 0.25,
    lineHeight: 9,
    position: 'absolute',
    right: 1,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  powerShine: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: radii.pill,
    height: 9,
    left: 6,
    position: 'absolute',
    right: 18,
    top: 4,
  },
  purchasePriceBadge: {
    alignItems: 'center',
    backgroundColor: '#5A3510',
    borderColor: '#FFE178',
    borderRadius: radii.pill,
    borderWidth: 1,
    bottom: -8,
    justifyContent: 'center',
    minWidth: 29,
    paddingHorizontal: 4,
    paddingVertical: 1,
    position: 'absolute',
  },
  purchasePriceText: {
    color: '#FFF4B8',
    fontSize: 8,
    fontWeight: '900',
    lineHeight: 10,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ translateY: 1 }, { scale: 0.97 }],
  },
});
