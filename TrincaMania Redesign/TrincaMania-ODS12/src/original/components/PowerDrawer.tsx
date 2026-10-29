import {
  Pressable,
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { msg } from '../messages';
import { memo, useCallback, useRef } from 'react';
import { TutorialTarget } from './TutorialVisuals';

import { GameIcon } from './GameIcon';
import { PowerIcon } from './PowerIcon';
import { POWER_UP_ORDER, POWER_UP_UI } from '../../data/powerUps';
import { radii, touchTargets } from '../styles/theme';
import { PowerUpInventory, PowerUpType } from '../../types/game';
import { WindowTarget } from '../../types/ui';
import { gamePowerTestId } from '../utils/e2eSelectors';
import { getPowerToolPresentation } from '../utils/powerToolPresentation';

type PowerDrawerProps = {
  bossSilenced?: boolean;
  forest?: boolean;
  disabled?: boolean;
  busyPower?: PowerUpType;
  disabledPowers?: Partial<Record<PowerUpType, boolean>>;
  itemCounts: PowerUpInventory;
  highlightedPower?: PowerUpType;
  onLayoutInWindow?: (powerType: PowerUpType, target: WindowTarget) => void;
  guidedPower?: PowerUpType;
  lockedPowers?: Partial<Record<PowerUpType, boolean>>;
  onUsePower: (power: PowerUpType) => void;
};

/**
 * Barra persistente de tool buttons. Os três poderes ficam montados e usam uma
 * única cápsula de estado para quantidade, preço canônico ou bloqueio real.
 */
function PowerDrawerBase({
  bossSilenced = false,
  forest = false,
  disabled = false,
  busyPower,
  disabledPowers = {},
  guidedPower,
  itemCounts,
  highlightedPower,
  lockedPowers = {},
  onLayoutInWindow,
  onUsePower,
}: PowerDrawerProps) {
  const powerButtonRefs = useRef<Partial<Record<PowerUpType, View | null>>>({});
  const reportPowerLayout = useCallback(
    (powerType: PowerUpType) => {
      if (!onLayoutInWindow) {
        return;
      }

      requestAnimationFrame(() => {
        powerButtonRefs.current[powerType]?.measureInWindow(
          (x, y, width, height) => {
            if (width > 0 && height > 0) {
              onLayoutInWindow(powerType, { height, width, x, y });
            }
          },
        );
      });
    },
    [onLayoutInWindow],
  );

  const renderPower = (power: PowerUpType) => {
    const isLockedByProgress = lockedPowers[power] === true;
    const isGuidedPower = guidedPower === power;
    const presentation = getPowerToolPresentation(
      power,
      itemCounts[power],
      isLockedByProgress && !isGuidedPower,
    );
    const isLocked = presentation.availability === 'locked';
    const isPurchasable = presentation.availability === 'purchasable';
    const isTemporarilyUnavailable = disabledPowers[power] === true;
    const isBusy = busyPower === power;
    // Sem estoque continua sendo uma ação válida: abre a confirmação compacta
    // da fase. Só modal/fim/movimento ou o bloqueio real do tutorial desativam.
    const isDisabled =
      disabled ||
      busyPower !== undefined ||
      (isTemporarilyUnavailable &&
        !isPurchasable &&
        !isLocked &&
        !bossSilenced) ||
      (guidedPower !== undefined && isLocked && !isGuidedPower);
    const availabilityLabel = `${presentation.accessibilityDetail}${
      isDisabled && !isLocked ? msg(', indisponível agora') : ''
    }${bossSilenced ? msg(', selado pelo Silêncio Ancestral') : ''}`;
    const accessibilityHint = bossSilenced
      ? msg('O Silêncio Ancestral impede poderes por algumas jogadas.')
      : isLocked
        ? msg('Avance na campanha para liberar este poder.')
        : isDisabled
          ? msg('Aguarde até esta ação ficar disponível.')
          : isPurchasable
            ? msg('Abre a confirmação de compra dentro da fase.')
            : msg('Ativa o poder nesta jogada.');

    return (
      <View key={power} style={styles.powerSlot}>
        <Pressable
          ref={(node) => {
            powerButtonRefs.current[power] = node;
          }}
          accessibilityHint={accessibilityHint}
          accessibilityLabel={`${POWER_UP_UI[power].label}, ${availabilityLabel}`}
          accessibilityRole="button"
          accessibilityState={{ disabled: isDisabled, busy: isBusy }}
          testID={gamePowerTestId(power)}
          disabled={isDisabled}
          hitSlop={touchTargets.hitSlop}
          onPress={() => {
            onUsePower(power);
          }}
          onLayout={() => reportPowerLayout(power)}
          style={({ pressed }) => [
            styles.powerButton,
            isDisabled ? styles.powerButtonDisabled : null,
            pressed && !isDisabled ? styles.pressed : null,
          ]}
        >
          <View
            style={[
              styles.medallion,
              forest ? styles.medallionForest : null,
              isPurchasable ? styles.powerButtonPurchasable : null,
              isTemporarilyUnavailable && !isPurchasable
                ? styles.powerButtonUnavailable
                : null,
              isLocked ? styles.powerButtonLocked : null,
              bossSilenced ? styles.medallionSilenced : null,
              highlightedPower === power ? styles.powerButtonHighlighted : null,
              isDisabled ? styles.medallionDisabled : null,
            ]}
          >
            <PowerIcon
              fill={isLocked ? '#E5E9DF' : undefined}
              name={power}
              outline={isLocked ? '#607168' : undefined}
              size={34}
            />
            {bossSilenced ? (
              <View pointerEvents="none" style={styles.silenceSeal}>
                <Text style={styles.silenceSealText}>✕</Text>
              </View>
            ) : null}
            {isBusy ? (
              <View pointerEvents="none" style={styles.busyOverlay}>
                <ActivityIndicator color="#FFF0CB" size="small" />
              </View>
            ) : null}
            <View
              pointerEvents="none"
              style={[
                styles.statusBadge,
                isPurchasable ? styles.statusBadgePurchasable : null,
                isDisabled ? styles.statusBadgeDisabled : null,
                isLocked ? styles.statusBadgeLocked : null,
              ]}
            >
              {isLocked ? (
                <GameIcon muted name="lock" size={14} variant="plain" />
              ) : (
                <>
                  {isPurchasable ? (
                    <GameIcon
                      name="coin"
                      size={12}
                      tone="gold"
                      variant="plain"
                    />
                  ) : null}
                  <Text
                    style={[
                      styles.badgeText,
                      isPurchasable ? styles.badgeTextPurchasable : null,
                    ]}
                  >
                    {presentation.badgeText}
                  </Text>
                </>
              )}
            </View>
          </View>
          <Text
            adjustsFontSizeToFit
            minimumFontScale={0.9}
            numberOfLines={2}
            style={[
              styles.powerLabel,
              isLocked ? styles.powerLabelLocked : null,
            ]}
          >
            {POWER_UP_UI[power].label}
          </Text>
          {bossSilenced ||
          isBusy ||
          (isTemporarilyUnavailable && !isPurchasable && !isLocked) ? (
            <Text style={styles.contextLabel}>
              {bossSilenced
                ? msg('Silêncio')
                : isBusy
                  ? msg('Usando…')
                  : msg('Aguarde a jogada')}
            </Text>
          ) : null}
          {highlightedPower === power &&
          !isDisabled &&
          !isTemporarilyUnavailable ? (
            <TutorialTarget />
          ) : null}
        </Pressable>
      </View>
    );
  };

  return <View style={styles.dock}>{POWER_UP_ORDER.map(renderPower)}</View>;
}

export const PowerDrawer = memo(
  PowerDrawerBase,
  (previous, next) =>
    previous.bossSilenced === next.bossSilenced &&
    previous.forest === next.forest &&
    previous.disabled === next.disabled &&
    previous.busyPower === next.busyPower &&
    previous.disabledPowers?.hint === next.disabledPowers?.hint &&
    previous.disabledPowers?.shuffle === next.disabledPowers?.shuffle &&
    previous.disabledPowers?.undo === next.disabledPowers?.undo &&
    previous.guidedPower === next.guidedPower &&
    previous.lockedPowers?.hint === next.lockedPowers?.hint &&
    previous.lockedPowers?.shuffle === next.lockedPowers?.shuffle &&
    previous.lockedPowers?.undo === next.lockedPowers?.undo &&
    previous.itemCounts.hint === next.itemCounts.hint &&
    previous.itemCounts.shuffle === next.itemCounts.shuffle &&
    previous.itemCounts.undo === next.itemCounts.undo &&
    previous.highlightedPower === next.highlightedPower &&
    previous.onLayoutInWindow === next.onLayoutInWindow &&
    previous.onUsePower === next.onUsePower,
);

const styles = StyleSheet.create({
  badgeText: {
    color: '#4B2A00',
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 13,
  },
  badgeTextPurchasable: {
    color: '#4A2A00',
    fontSize: 11,
    lineHeight: 13,
  },
  dock: {
    alignItems: 'stretch',
    alignSelf: 'center',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    maxWidth: 304,
    paddingHorizontal: 0,
    paddingBottom: 4,
    paddingTop: 2,
    width: '94%',
    zIndex: 8,
  },
  powerSlot: {
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    position: 'relative',
  },
  powerButton: {
    alignItems: 'center',
    minHeight: 74,
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderRadius: 13,
    justifyContent: 'flex-start',
    paddingHorizontal: 2,
    paddingVertical: 5,
    gap: 3,
    position: 'relative',
    width: '100%',
  },
  powerButtonDisabled: {
    opacity: 1,
  },
  medallion: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 2,
    backgroundColor: 'transparent',
    borderWidth: 0,
    height: 34,
    justifyContent: 'center',
    position: 'relative',
    width: 'auto',
  },
  medallionForest: { backgroundColor: 'transparent' },
  medallionDisabled: {
    opacity: 1,
  },
  medallionSilenced: {
    backgroundColor: '#403347',
    borderColor: '#E7B6DA',
  },
  silenceSeal: {
    alignItems: 'center',
    backgroundColor: '#6B355D',
    borderColor: '#FFE1F1',
    borderRadius: 11,
    borderWidth: 1,
    height: 22,
    justifyContent: 'center',
    position: 'absolute',
    right: -4,
    top: -5,
    width: 22,
    zIndex: 70,
  },
  silenceSealText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  powerButtonLocked: {
    opacity: 0.65,
  },
  powerButtonPurchasable: {
    borderColor: '#FFE7A0',
  },
  powerButtonUnavailable: {
    opacity: 0.65,
  },
  powerButtonHighlighted: {
    borderColor: '#FFF7B8',
    borderWidth: 3,
    shadowColor: '#F5CF75',
    shadowOpacity: 0.8,
  },
  powerLabel: {
    color: '#FFF3D6',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 13,
    minHeight: 26,
    textAlignVertical: 'center',
    textAlign: 'center',
    textShadowColor: '#183E35',
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 4,
    width: '100%',
    zIndex: 50,
  },
  powerLabelLocked: { color: '#DCE4D5' },
  contextLabel: {
    color: '#FFF3D6',
    textShadowColor: '#183E35',
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 4,
    borderRadius: 6,
    paddingHorizontal: 3,
    fontSize: 9,
    textAlign: 'center',
    fontWeight: '600',
  },
  busyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(32,59,46,0.86)',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ translateY: 1 }, { scale: 0.97 }],
  },
  statusBadge: {
    alignItems: 'center',
    backgroundColor: '#E7F4C6',
    borderColor: '#FFF9D9',
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 1,
    justifyContent: 'center',
    minHeight: 20,
    minWidth: 24,
    paddingHorizontal: 4,
    zIndex: 51,
  },
  statusBadgeDisabled: {
    backgroundColor: '#B9C4AF',
    borderColor: '#E5E9D7',
  },
  statusBadgeLocked: {
    backgroundColor: '#E7E8D4',
    borderColor: '#D2DBBF',
    minWidth: 20,
    paddingHorizontal: 2,
  },
  statusBadgePurchasable: {
    backgroundColor: '#FFF0C1',
    borderColor: '#D7A84B',
    minWidth: 32,
  },
});
