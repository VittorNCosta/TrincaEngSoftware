import {
  getMaterialTileBaseStyle,
  getMaterialTilePalette,
} from '../styles/materialTilePalette';
import { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { GameIcon } from './GameIcon';
import { TileIcon } from './TileIcon';
import { tilePalette } from '../styles/tilePalette';
import { radii } from '../styles/theme';
import { Tile } from '../types/game';
import { WindowTarget } from '../types/ui';
import {
  BASE_TRAY_CAPACITY,
  COIN_TRAY_SLOT_COST,
  MAX_TRAY_CAPACITY,
} from '../storage/trayBoostStorage';

type TrayProps = {
  activeCapacity: number;
  bonusSlotActive?: boolean;
  coinSlotActive?: boolean;
  hiddenTileIds?: string[];
  tiles: Tile[];
  onSlotLayoutInWindow?: (tileIndex: number, target: WindowTarget) => void;
  onAdSlotPress?: () => void;
  onCoinSlotPress?: () => void;
};

type TraySlotProps = {
  hiddenTileIds: string[];
  isActiveSlot: boolean;
  isBonusSlot: boolean;
  isCoinSlot: boolean;
  lockedLabel: string;
  tile?: Tile;
  tileIndex: number;
  onSlotLayoutInWindow?: (tileIndex: number, target: WindowTarget) => void;
  onSlotPress?: () => void;
};

function TraySlot({
  hiddenTileIds,
  isActiveSlot,
  isBonusSlot,
  isCoinSlot,
  lockedLabel,
  tile,
  tileIndex,
  onSlotLayoutInWindow,
  onSlotPress,
}: TraySlotProps) {
  const slotRef = useRef<View>(null);
  const activation = useRef(new Animated.Value(0)).current;
  const wasActiveRef = useRef(isActiveSlot);
  const tileHidden = tile ? hiddenTileIds.includes(tile.id) : false;
  const isFilled = Boolean(tile && !tileHidden);

  const reportLayout = useCallback(() => {
    if (!onSlotLayoutInWindow || tileIndex < 0) {
      return;
    }

    requestAnimationFrame(() => {
      slotRef.current?.measureInWindow((x, y, width, height) => {
        onSlotLayoutInWindow(tileIndex, { height, width, x, y });
      });
    });
  }, [onSlotLayoutInWindow, tileIndex]);

  useEffect(() => {
    const wasActive = wasActiveRef.current;
    wasActiveRef.current = isActiveSlot;

    if (!isBonusSlot || wasActive || !isActiveSlot) {
      activation.setValue(0);
      return undefined;
    }

    activation.setValue(0);
    const animation = Animated.sequence([
      Animated.timing(activation, {
        duration: 180,
        easing: Easing.out(Easing.cubic),
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(activation, {
        duration: 420,
        easing: Easing.inOut(Easing.quad),
        toValue: 0,
        useNativeDriver: true,
      }),
    ]);

    animation.start();
    return () => animation.stop();
  }, [activation, isActiveSlot, isBonusSlot]);

  const activationScale = activation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.13],
  });
  const activationGlowOpacity = activation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.9],
  });
  const slotContent =
    isFilled && tile ? (
      <>
        <View
          pointerEvents="none"
          style={[
            styles.slotInsetShade,
            { backgroundColor: getMaterialTilePalette(tile.kind).innerShade },
          ]}
        />
        <View pointerEvents="none" style={styles.slotSpecular} />
        <TileIcon
          cardId={tile.cardId}
          fallbackEmoji={tile.emoji}
          highlighted={false}
          kind={tile.kind}
          role={tile.role}
          size={30}
        />
      </>
    ) : isActiveSlot ? (
      isBonusSlot ? (
        <View pointerEvents="none" style={styles.activeBonusSlotContent}>
          <GameIcon name="bonus" size={15} tone="green" />
        </View>
      ) : null
    ) : (
      <View style={styles.lockedSlotContent}>
        <GameIcon
          name={isCoinSlot ? 'coin' : 'bonus'}
          size={12}
          tone={isCoinSlot ? 'gold' : 'green'}
        />
        <Text
          adjustsFontSizeToFit
          minimumFontScale={0.75}
          numberOfLines={1}
          style={[
            styles.lockedLabel,
            isBonusSlot ? styles.lockedLabelBonus : null,
          ]}
        >
          {lockedLabel}
        </Text>
      </View>
    );
  const slotIsActionable =
    Boolean(onSlotPress) && !(isActiveSlot && !isBonusSlot);
  const slotAccessibilityLabel =
    isFilled && tile
      ? `Espaço ${tileIndex + 1}, peça ${tile.emoji}`
      : isCoinSlot && !isActiveSlot
        ? `Liberar espaço extra por ${COIN_TRAY_SLOT_COST} moedas`
        : isBonusSlot && !isActiveSlot
          ? 'Liberar espaço bônus'
          : isBonusSlot
            ? 'Espaço bônus ativo'
            : `Espaço ${tileIndex + 1} da bandeja`;

  return (
    <Animated.View
      style={[styles.slotShell, { transform: [{ scale: activationScale }] }]}
    >
      <Pressable
        ref={slotRef}
        accessibilityHint={
          slotIsActionable
            ? isCoinSlot && !isActiveSlot
              ? 'Compra um espaço extra para a bandeja.'
              : isBonusSlot && isActiveSlot
                ? 'Mostra o tempo restante do bônus.'
                : 'Mostra como liberar o espaço bônus.'
            : undefined
        }
        accessibilityLabel={slotAccessibilityLabel}
        accessibilityRole={slotIsActionable ? 'button' : 'image'}
        accessibilityState={slotIsActionable ? { disabled: false } : undefined}
        hitSlop={
          slotIsActionable
            ? { top: 8, bottom: 8, left: 2, right: 2 }
            : undefined
        }
        onLayout={reportLayout}
        onPress={slotIsActionable ? onSlotPress : undefined}
        style={({ pressed }) => [
          styles.slot,
          !isActiveSlot ? styles.lockedSlot : null,
          isCoinSlot && !isActiveSlot ? styles.coinLockedSlot : null,
          isBonusSlot && !isActiveSlot ? styles.bonusLockedSlot : null,
          isFilled ? styles.filledSlot : null,
          isFilled && tile ? getMaterialTileBaseStyle(tile.kind) : null,
          pressed && slotIsActionable ? styles.slotPressed : null,
        ]}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.slotActivationGlow,
            { opacity: activationGlowOpacity },
          ]}
        />
        {slotContent}
      </Pressable>
    </Animated.View>
  );
}

export function Tray({
  activeCapacity,
  bonusSlotActive,
  coinSlotActive,
  hiddenTileIds = [],
  tiles,
  onSlotLayoutInWindow,
  onAdSlotPress,
  onCoinSlotPress,
}: TrayProps) {
  const nearlyFull = tiles.length >= activeCapacity - 1;
  const coinSlotEnabled =
    coinSlotActive ?? activeCapacity >= BASE_TRAY_CAPACITY + 1;
  const bonusSlotEnabled =
    bonusSlotActive ?? activeCapacity >= MAX_TRAY_CAPACITY;
  const activeSlotIndexes = Array.from({ length: MAX_TRAY_CAPACITY })
    .map((_, index) => index)
    .filter(
      (index) =>
        index < BASE_TRAY_CAPACITY ||
        (index === BASE_TRAY_CAPACITY && coinSlotEnabled) ||
        (index === MAX_TRAY_CAPACITY - 1 && bonusSlotEnabled),
    );

  return (
    <View style={[styles.wrapper, nearlyFull ? styles.wrapperDanger : null]}>
      <View pointerEvents="none" style={styles.topGloss} />
      {Array.from({ length: MAX_TRAY_CAPACITY }).map((_, index) => {
        const tileIndex = activeSlotIndexes.indexOf(index);
        const tile = tileIndex >= 0 ? tiles[tileIndex] : undefined;
        const isActiveSlot = tileIndex >= 0;
        const isCoinSlot = index === BASE_TRAY_CAPACITY;
        const isBonusSlot = index === MAX_TRAY_CAPACITY - 1;
        const lockedLabel = isCoinSlot ? `${COIN_TRAY_SLOT_COST}` : '+';
        const onLockedPress = isCoinSlot ? onCoinSlotPress : onAdSlotPress;
        const onSlotPress =
          isActiveSlot && isBonusSlot ? onAdSlotPress : onLockedPress;

        return (
          <TraySlot
            key={`tray-slot-${index}`}
            hiddenTileIds={hiddenTileIds}
            isActiveSlot={isActiveSlot}
            isBonusSlot={isBonusSlot}
            isCoinSlot={isCoinSlot}
            lockedLabel={lockedLabel}
            tile={tile}
            tileIndex={tileIndex}
            onSlotLayoutInWindow={onSlotLayoutInWindow}
            onSlotPress={onSlotPress}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  activeBonusSlotContent: {
    alignItems: 'center',
    backgroundColor: 'rgba(66, 229, 167, 0.16)',
    borderColor: 'rgba(189, 251, 228, 0.42)',
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  bonusLockedSlot: {
    borderColor: 'rgba(66, 229, 167, 0.72)',
  },
  coinLockedSlot: {
    borderColor: 'rgba(255, 211, 90, 0.65)',
  },
  // Encaixe ocupado: a mesma aparência das peças do tabuleiro.
  filledSlot: {
    backgroundColor: tilePalette.face,
    borderBottomColor: tilePalette.edge,
    borderBottomWidth: 4,
    borderColor: tilePalette.border,
    borderWidth: 2,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  lockedLabel: {
    color: '#FFD35A',
    fontSize: 8,
    fontWeight: '900',
    includeFontPadding: false,
    lineHeight: 10,
    textAlign: 'center',
  },
  lockedLabelBonus: {
    color: '#BDFBE4',
  },
  lockedSlotContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '85%',
  },
  lockedSlot: {
    backgroundColor: 'rgba(70, 40, 15, 0.72)',
    borderRadius: 8,
    borderStyle: 'dashed',
    borderWidth: 2,
  },
  // Encaixe vazio: buraco escavado na madeira, sem borda nem pontinho.
  slot: {
    alignItems: 'center',
    backgroundColor: 'rgba(70, 40, 15, 0.6)',
    borderRadius: 14,
    height: '100%',
    justifyContent: 'center',
    overflow: 'hidden',
    width: '100%',
    zIndex: 1,
  },
  slotActivationGlow: {
    backgroundColor: 'rgba(66, 229, 167, 0.28)',
    borderColor: '#BDFBE4',
    borderRadius: 14,
    borderWidth: 3,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 4,
  },
  slotShell: {
    aspectRatio: 1,
    flex: 1,
  },
  slotPressed: {
    opacity: 0.75,
  },
  slotInsetShade: {
    backgroundColor: tilePalette.shade,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    bottom: 0,
    height: 7,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  slotSpecular: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: radii.pill,
    height: 7,
    left: 5,
    position: 'absolute',
    top: 3,
    width: 14,
  },
  topGloss: {
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    borderRadius: radii.pill,
    height: 3,
    left: 14,
    position: 'absolute',
    right: 14,
    top: 5,
  },
  wrapper: {
    backgroundColor: '#8A5527',
    borderBottomColor: '#5E3616',
    borderBottomWidth: 6,
    borderColor: '#E0B26A',
    borderRadius: 20,
    // A borda fina mantém o contorno da bandeja legível sobre o tabuleiro.
    borderWidth: 2,
    flexDirection: 'row',
    gap: 6,
    overflow: 'hidden',
    paddingBottom: 8,
    paddingHorizontal: 8,
    paddingTop: 16,
    width: '100%',
    shadowColor: '#1A0C02',
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.34,
    shadowRadius: 14,
    elevation: 6,
  },
  wrapperDanger: {
    backgroundColor: '#6E2A22',
    borderBottomColor: '#5E1A16',
    borderColor: '#FF8BA9',
  },
});
