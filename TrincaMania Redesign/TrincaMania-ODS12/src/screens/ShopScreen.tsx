import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  ImageBackground,
  ImageSourcePropType,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { GameIcon } from '../components/GameIcon';
import { PowerIcon } from '../components/PowerIcon';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenShell } from '../components/ScreenShell';
import { POWER_UP_ORDER, POWER_UP_UI } from '../data/powerUps';
import { colors, fontSizes, radii, shadows, spacing } from '../styles/theme';
import { PowerUpType, ProgressState, WorldId } from '../types/game';
import { POWER_UP_COSTS } from '../utils/gameLogic';
import { lightImpact, successImpact, warningImpact } from '../utils/haptics';
import { playShopBuySound } from '../utils/sounds';

const shopImage =
  require('../../assets/map/map_shop.png') as ImageSourcePropType;
const world3ShopImage =
  require('../../assets/map/map_world3_shop.png') as ImageSourcePropType;
const world3ShopBg =
  require('../../assets/map/map_world3_shop_bg.png') as ImageSourcePropType;

type ShopScreenProps = {
  backTitle?: string;
  progress: ProgressState;
  worldId?: WorldId;
  onBack: () => void;
  onBuyItem: (powerType: PowerUpType) => boolean;
};

type ShopToast = {
  id: number;
  text: string;
};

export function ShopScreen({
  backTitle = 'Voltar',
  progress,
  worldId = 1,
  onBack,
  onBuyItem,
}: ShopScreenProps) {
  const [toast, setToast] = useState<ShopToast | undefined>();
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const isCrystalShop = worldId === 3 || worldId === 6 || worldId === 8;
  const activeShopImage = isCrystalShop ? world3ShopImage : shopImage;

  useEffect(() => {
    if (!toast) {
      toastOpacity.setValue(0);
      return undefined;
    }

    toastOpacity.setValue(0);
    const animation = Animated.sequence([
      Animated.timing(toastOpacity, {
        duration: 140,
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.delay(1600),
      Animated.timing(toastOpacity, {
        duration: 180,
        toValue: 0,
        useNativeDriver: true,
      }),
    ]);

    animation.start(({ finished }) => {
      if (finished) {
        setToast(undefined);
      }
    });

    return () => animation.stop();
  }, [toast, toastOpacity]);

  const showToast = (text: string) => {
    setToast({ id: Date.now() + Math.random(), text });
  };

  const handleBuy = (powerType: PowerUpType) => {
    lightImpact();

    if (!onBuyItem(powerType)) {
      warningImpact();
      showToast('Moedas insuficientes.');
      return;
    }

    successImpact();
    playShopBuySound();
    showToast(`${POWER_UP_UI[powerType].label} adicionado ao inventário.`);
  };

  const content = (
    <View
      style={[styles.container, isCrystalShop ? styles.containerCrystal : null]}
    >
      <View
        style={[styles.header, isCrystalShop ? styles.headerCrystal : null]}
      >
        <View pointerEvents="none" style={styles.headerGlow} />
        <View style={styles.shopArtFrame}>
          <Image
            resizeMode="contain"
            source={activeShopImage}
            style={styles.shopArt}
          />
        </View>
        <View style={styles.titleBlock}>
          <Text style={styles.eyebrow}>Loja de campanha</Text>
          <Text
            adjustsFontSizeToFit
            minimumFontScale={0.78}
            numberOfLines={2}
            style={styles.title}
          >
            Ponto de descanso
          </Text>
          <Text numberOfLines={2} style={styles.subtitle}>
            Poderes para continuar a jornada
          </Text>
        </View>
        <View style={styles.coinBadge}>
          <GameIcon name="coin" size={24} tone="gold" />
          <Text style={styles.coinText}>{progress.coins}</Text>
        </View>
      </View>

      <View style={styles.toastSlot} pointerEvents="none">
        {toast ? (
          <Animated.View style={[styles.toast, { opacity: toastOpacity }]}>
            <Text style={styles.toastText}>{toast.text}</Text>
          </Animated.View>
        ) : null}
      </View>

      <View style={styles.itemList}>
        {POWER_UP_ORDER.map((powerType) => {
          const item = POWER_UP_UI[powerType];
          const cost = POWER_UP_COSTS[powerType];
          const count = progress.itemCounts[powerType];
          const canBuy = progress.coins >= cost;

          return (
            <View
              key={powerType}
              style={[
                styles.itemCard,
                !canBuy ? styles.itemCardDisabled : null,
              ]}
            >
              <View pointerEvents="none" style={styles.itemAccent} />
              <View style={styles.itemTopRow}>
                <View style={styles.itemIconBox}>
                  <PowerIcon name={powerType} size={38} />
                </View>
                <View style={styles.itemCopy}>
                  <Text numberOfLines={1} style={styles.itemTitle}>
                    {item.shopTitle}
                  </Text>
                  <Text numberOfLines={3} style={styles.itemDescription}>
                    {item.description}
                  </Text>
                </View>
              </View>

              <View style={styles.itemBottomRow}>
                <View style={styles.itemMetaRow}>
                  <View style={styles.metaPill}>
                    <Text
                      adjustsFontSizeToFit
                      minimumFontScale={0.82}
                      numberOfLines={1}
                      style={styles.metaLabel}
                    >
                      Estoque
                    </Text>
                    <Text style={styles.stockText}>{count}</Text>
                  </View>
                  <View style={[styles.metaPill, styles.pricePill]}>
                    <Text
                      adjustsFontSizeToFit
                      minimumFontScale={0.82}
                      numberOfLines={1}
                      style={styles.metaLabel}
                    >
                      Preço
                    </Text>
                    <View style={styles.priceValueRow}>
                      <GameIcon name="coin" size={18} tone="gold" />
                      <Text style={styles.priceText}>{cost}</Text>
                    </View>
                  </View>
                </View>
                {!canBuy ? (
                  <Text style={styles.insufficientText}>
                    Moedas insuficientes
                  </Text>
                ) : null}

                <View style={styles.buyButton}>
                  <PrimaryButton
                    disabled={!canBuy}
                    size="small"
                    title={canBuy ? 'Comprar' : 'Sem moedas'}
                    variant="primary"
                    onPress={() => handleBuy(powerType)}
                  />
                </View>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.notePanel}>
        <GameIcon name="info" size={32} tone="blue" />
        <View style={styles.noteCopy}>
          <Text style={styles.noteTitle}>Como funciona</Text>
          <Text numberOfLines={3} style={styles.noteText}>
            O estoque comprado é usado primeiro. Depois, o poder ainda pode ser
            ativado com moedas.
          </Text>
        </View>
      </View>

      <View style={styles.backButtonWrap}>
        <PrimaryButton title={backTitle} variant="secondary" onPress={onBack} />
      </View>
    </View>
  );

  return (
    <ScreenShell>
      {isCrystalShop ? (
        <ImageBackground
          imageStyle={styles.shopBackdropImage}
          resizeMode="cover"
          source={world3ShopBg}
          style={styles.shopBackdrop}
        >
          {content}
        </ImageBackground>
      ) : (
        content
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  buyButton: {
    minWidth: 104,
  },
  backButtonWrap: {
    paddingBottom: spacing.xl,
    paddingTop: spacing.xs,
  },
  coinBadge: {
    alignItems: 'center',
    backgroundColor: '#FFE8A8',
    borderColor: colors.primary,
    borderRadius: radii.pill,
    borderWidth: 2,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    zIndex: 1,
    ...shadows.card,
  },
  coinText: {
    color: colors.ink,
    fontSize: fontSizes.sm,
    fontWeight: '900',
  },
  container: {
    flex: 1,
    gap: spacing.sm,
    paddingBottom: spacing.xl,
    width: '100%',
  },
  containerCrystal: {
    padding: spacing.sm,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: fontSizes.sm,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  header: {
    alignItems: 'center',
    backgroundColor: colors.panelDark,
    borderColor: 'rgba(255, 211, 90, 0.56)',
    borderBottomColor: '#071820',
    borderBottomWidth: 5,
    borderRadius: 16,
    borderWidth: 2,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
    minHeight: 96,
    overflow: 'hidden',
    padding: spacing.sm,
    position: 'relative',
    ...shadows.card,
  },
  headerGlow: {
    backgroundColor: 'rgba(255, 211, 90, 0.16)',
    borderRadius: radii.pill,
    height: 86,
    left: -24,
    position: 'absolute',
    right: 92,
    top: -52,
  },
  headerCrystal: {
    backgroundColor: 'rgba(25, 19, 66, 0.94)',
    borderColor: 'rgba(229, 221, 255, 0.74)',
  },
  itemAccent: {
    backgroundColor: '#42E5A7',
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 6,
  },
  itemBottomRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    justifyContent: 'space-between',
  },
  itemCard: {
    backgroundColor: 'rgba(255, 248, 232, 0.96)',
    borderBottomColor: colors.goldDark,
    borderBottomWidth: 4,
    borderColor: '#FFD35A',
    borderRadius: 14,
    borderWidth: 2,
    gap: spacing.xs,
    overflow: 'hidden',
    padding: spacing.sm,
    paddingLeft: spacing.md,
    position: 'relative',
    ...shadows.card,
  },
  itemCardDisabled: {
    borderColor: '#D5C7A8',
    opacity: 0.82,
  },
  itemCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  itemDescription: {
    color: colors.muted,
    fontSize: fontSizes.xs,
    fontWeight: '800',
    lineHeight: 16,
  },
  itemIconBox: {
    alignItems: 'center',
    backgroundColor: '#FFF1C9',
    borderColor: colors.gold,
    borderRadius: 13,
    borderWidth: 2,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  insufficientText: {
    backgroundColor: '#FFE1E7',
    borderColor: '#FF9AAE',
    borderRadius: radii.pill,
    borderWidth: 1,
    color: colors.dangerDark,
    fontSize: fontSizes.xs,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  itemList: {
    gap: spacing.sm,
  },
  itemMetaRow: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    minWidth: 156,
  },
  itemTitle: {
    color: colors.ink,
    fontSize: fontSizes.md,
    fontWeight: '900',
  },
  itemTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metaLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '900',
    lineHeight: 10,
    textTransform: 'uppercase',
  },
  metaPill: {
    alignItems: 'center',
    backgroundColor: '#FFFDF2',
    borderColor: '#E6D2A2',
    borderRadius: radii.pill,
    borderWidth: 2,
    gap: 1,
    minWidth: 76,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  noteCopy: {
    flex: 1,
    gap: 2,
  },
  notePanel: {
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.primary,
    borderRadius: 14,
    borderWidth: 2,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.sm,
    ...shadows.card,
  },
  noteText: {
    color: colors.ink,
    fontSize: fontSizes.sm,
    fontWeight: '800',
    lineHeight: 19,
  },
  noteTitle: {
    color: colors.primaryDark,
    fontSize: fontSizes.xs,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  priceText: {
    color: colors.primaryDark,
    fontSize: fontSizes.xs,
    fontWeight: '900',
  },
  priceValueRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
  },
  pricePill: {
    backgroundColor: '#FFEAB5',
    borderColor: colors.primary,
  },
  shopArt: {
    height: 58,
    width: 58,
  },
  shopArtFrame: {
    alignItems: 'center',
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.gold,
    borderRadius: 14,
    borderWidth: 2,
    height: 62,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 62,
  },
  shopBackdrop: {
    borderRadius: 16,
    flex: 1,
    minHeight: 640,
    overflow: 'hidden',
  },
  shopBackdropImage: {
    opacity: 0.58,
  },
  stockText: {
    color: colors.successDark,
    fontSize: fontSizes.xs,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.surfaceTint,
    fontSize: fontSizes.xs,
    fontWeight: '800',
    lineHeight: 15,
  },
  title: {
    color: colors.inkOnDark,
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 25,
  },
  titleBlock: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  toast: {
    alignSelf: 'center',
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.primary,
    borderRadius: radii.card,
    borderWidth: 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.card,
  },
  toastSlot: {
    height: 38,
    justifyContent: 'center',
  },
  toastText: {
    color: colors.ink,
    fontSize: fontSizes.sm,
    fontWeight: '900',
    textAlign: 'center',
  },
});
