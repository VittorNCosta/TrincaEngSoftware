import {
  AccessibilityInfo,
  Image,
  Pressable,
  Text,
  View,
  Animated,
  ImageStyle,
  ImageSourcePropType,
  Easing,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { msg } from '../messages';
import { useEffect, useRef, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, forestPolish, touchTargets } from '../styles/theme';
import { CAMPAIGN_TOUCH_TARGET_SIZE } from '../utils/campaignShell';
import { getMissionsBadgeState } from '../utils/missionsBadge';
import { playButtonSound } from '../../utils/sounds';

export type MainTabKey = 'shop' | 'map' | 'missions' | 'profile';

type NavItem = {
  key: MainTabKey;
  label: string;
};

export const MAIN_TAB_ITEMS: NavItem[] = [
  { key: 'map', label: msg('Mapa') },
  { key: 'shop', label: msg('Loja') },
  { key: 'missions', label: msg('Missões') },
  { key: 'profile', label: msg('Perfil') },
];

export const NAV_ICONS: Record<MainTabKey, ImageSourcePropType> = {
  map: require('../../../assets/original/ui/navigation/optimized/map.png') as ImageSourcePropType,
  shop: require('../../../assets/original/ui/navigation/optimized/shop.png') as ImageSourcePropType,
  missions:
    require('../../../assets/original/ui/navigation/optimized/missions.png') as ImageSourcePropType,
  profile:
    require('../../../assets/original/ui/navigation/optimized/profile.png') as ImageSourcePropType,
};

const NAV_BASE =
  require('../../../assets/original/ui/navigation/optimized/nav_base_forest.png') as ImageSourcePropType;

// Medidas dos PNGs de runtime: bounds e centro ponderado pelo alpha > 8,
// usando readImageMetadata(..., { includeAlphaCentroid: true }) do analyzer.
// A compensação fica só na imagem; frames, labels e hitboxes são compartilhados.
const NAV_ICON_METRICS = {
  map: {
    width: 256,
    height: 234,
    visibleHeight: 231,
    centerX: 128.922,
    centerY: 117.589,
  },
  shop: {
    width: 256,
    height: 256,
    visibleHeight: 236,
    centerX: 134.641,
    centerY: 136.525,
  },
  missions: {
    width: 256,
    height: 256,
    visibleHeight: 235,
    centerX: 129.314,
    centerY: 133.73,
  },
  profile: {
    width: 256,
    height: 256,
    visibleHeight: 221,
    centerX: 128.046,
    centerY: 137.118,
  },
};
const NAV_ICON_VISIBLE_HEIGHT = 40;
const NAV_IMAGE_SIZES: Record<MainTabKey, ImageStyle> = Object.fromEntries(
  MAIN_TAB_ITEMS.map(({ key }): [MainTabKey, ImageStyle] => {
    const metrics = NAV_ICON_METRICS[key];
    const scale = NAV_ICON_VISIBLE_HEIGHT / metrics.visibleHeight;
    return [
      key,
      {
        height: metrics.height * scale,
        width: metrics.width * scale,
        transform: [
          { translateX: (metrics.width / 2 - metrics.centerX) * scale },
          { translateY: (metrics.height / 2 - metrics.centerY) * scale },
        ],
      },
    ];
  }),
) as Record<MainTabKey, ImageStyle>;

// Altura da faixa interativa (ícone + label), sem contar a folga de área segura.
// Telas que precisam reservar espaço de scroll pelo total real devem usar
// useBottomNavClearance(), não esta constante — ela não inclui o inset do aparelho.
export const BOTTOM_NAV_HEIGHT = 88;

/**
 * Espaço total (altura interativa + inset real de baixo) ocupado pela barra na
 * tela. Use este valor para paddingBottom de conteúdo que não deve ficar atrás
 * da barra — a constante BOTTOM_NAV_HEIGHT sozinha ignora gesture-nav/3-button.
 */
export function useBottomNavClearance(): number {
  const insets = useSafeAreaInsets();
  return BOTTOM_NAV_HEIGHT + insets.bottom;
}

type BottomNavBarProps = {
  activeIndex: number;
  missionReadyCount?: number;
  missionsNew?: boolean;
  missionsUnlocked?: boolean;
  onSelect: (index: number) => void;
};

function LockGlyph({ compact = false }: { compact?: boolean }) {
  return (
    <View style={[styles.lockGlyph, compact ? styles.lockGlyphCompact : null]}>
      <View
        style={[styles.lockShackle, compact ? styles.lockShackleBadge : null]}
      />
      <View style={[styles.lockBody, compact ? styles.lockBodyBadge : null]} />
    </View>
  );
}

/**
 * Uma base orgânica única ocupa o rodapé; os quatro destinos mantêm ícones e
 * alvos de toque independentes. A área segura recebe a mesma paleta da base.
 */
export function BottomNavBar({
  activeIndex,
  missionReadyCount = 0,
  missionsNew = false,
  missionsUnlocked = true,
  onSelect,
}: BottomNavBarProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const labelSize = Math.min(10, Math.max(8, width / 40));
  const lockedFeedbackOpacity = useRef(new Animated.Value(0)).current;
  const iconMotion = useRef(
    MAIN_TAB_ITEMS.map(() => new Animated.Value(0)),
  ).current;
  const missionNewMotion = useRef(new Animated.Value(0)).current;
  const [lockedFeedbackVisible, setLockedFeedbackVisible] = useState(false);
  // O fundo da barra se estende até a borda física (edge-to-edge); só o
  // conteúdo interativo (ícone+label) sobe pela folga extra do inset real,
  // em vez de usar um número fixo que não serve para gesture-nav e 3-button.
  const bottomInset = Math.max(0, insets.bottom);

  useEffect(() => {
    iconMotion.forEach((motion, index) => {
      Animated.timing(motion, {
        duration: 170,
        easing: Easing.out(Easing.cubic),
        toValue: index === activeIndex ? 1 : 0,
        useNativeDriver: true,
      }).start();
    });
  }, [activeIndex, iconMotion]);

  useEffect(() => {
    missionNewMotion.stopAnimation();
    missionNewMotion.setValue(0);
    if (!missionsNew || !missionsUnlocked) return undefined;

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(missionNewMotion, {
          duration: 220,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(missionNewMotion, {
          duration: 220,
          toValue: 0,
          useNativeDriver: true,
        }),
        Animated.delay(1150),
      ]),
      { iterations: 2 },
    );
    animation.start();
    return () => animation.stop();
  }, [missionNewMotion, missionsNew, missionsUnlocked]);

  const showLockedFeedback = () => {
    lockedFeedbackOpacity.stopAnimation();
    lockedFeedbackOpacity.setValue(0);
    setLockedFeedbackVisible(true);
    AccessibilityInfo.announceForAccessibility(
      msg('Missões são liberadas após a fase 3.'),
    );
    Animated.sequence([
      Animated.timing(lockedFeedbackOpacity, {
        duration: 120,
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.delay(1150),
      Animated.timing(lockedFeedbackOpacity, {
        duration: 160,
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setLockedFeedbackVisible(false);
    });
  };

  return (
    <View
      style={[
        styles.bar,
        {
          height: BOTTOM_NAV_HEIGHT + bottomInset,
          paddingBottom: 12 + bottomInset,
        },
      ]}
    >
      <LinearGradient
        accessible={false}
        colors={['rgba(20, 53, 40, 0)', '#54351F', '#54351F', '#143528']}
        locations={[0, 14 / (BOTTOM_NAV_HEIGHT + bottomInset + 14), 0.72, 1]}
        pointerEvents="none"
        style={styles.safeAreaBackdrop}
      />
      <View
        accessible={false}
        pointerEvents="none"
        style={[styles.railArt, { bottom: bottomInset + 4 }]}
      >
        <Image
          accessible={false}
          resizeMode="stretch"
          source={NAV_BASE}
          style={styles.railImage}
        />
      </View>
      {lockedFeedbackVisible ? (
        <Animated.View
          accessibilityLiveRegion="polite"
          pointerEvents="none"
          style={[styles.lockedFeedback, { opacity: lockedFeedbackOpacity }]}
        >
          <LockGlyph />
          <Text style={styles.lockedFeedbackText}>
            {msg('Libera após a fase 3')}
          </Text>
        </Animated.View>
      ) : null}
      {MAIN_TAB_ITEMS.map((item, index) => {
        const isActive = index === activeIndex;
        const missionBadge =
          item.key === 'missions'
            ? getMissionsBadgeState({
                missionReadyCount,
                missionsNew,
                missionsUnlocked,
              })
            : undefined;
        const isLockedMission = missionBadge?.kind === 'locked';

        return (
          <Pressable
            accessibilityHint={
              isLockedMission
                ? msg('Libera depois de concluir a fase 3')
                : undefined
            }
            accessibilityLabel={
              missionBadge?.kind === 'locked'
                ? msg('{param1}, bloqueado', { param1: String(item.label) })
                : missionBadge?.kind === 'new'
                  ? msg('{param1}, novo', { param1: String(item.label) })
                  : missionBadge?.kind === 'count'
                    ? missionBadge.count === 1
                      ? msg('{param1}, 1 recompensa pronta', {
                          param1: item.label,
                        })
                      : msg('{param1}, {count} recompensas prontas', {
                          param1: item.label,
                          count: missionBadge.count,
                        })
                    : item.label
            }
            accessibilityRole="button"
            aria-pressed={isActive}
            accessibilityState={{
              disabled: isLockedMission,
              selected: isActive,
            }}
            key={item.key}
            testID={`nav-${item.key}`}
            onPress={() => {
              if (isLockedMission) {
                playButtonSound();
                showLockedFeedback();
                return;
              }

              if (!isActive) {
                playButtonSound();
              }

              onSelect(index);
            }}
            style={({ pressed }) => [
              styles.item,
              isActive ? styles.itemActive : styles.itemInactive,
              pressed ? styles.itemPressed : null,
            ]}
          >
            <View pointerEvents="none" style={styles.itemContent}>
              <View style={styles.iconWrap}>
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.activeHalo,
                    {
                      opacity: iconMotion[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 1],
                      }),
                    },
                  ]}
                />
                {missionBadge?.kind === 'new' ? (
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      styles.newMissionGlow,
                      {
                        opacity: missionNewMotion.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.25, 0.8],
                        }),
                        transform: [
                          {
                            scale: missionNewMotion.interpolate({
                              inputRange: [0, 1],
                              outputRange: [1, 1.18],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                ) : null}
                <Image
                  source={NAV_ICONS[item.key]}
                  resizeMode="contain"
                  style={[
                    NAV_IMAGE_SIZES[item.key],
                    isActive ? null : styles.iconInactive,
                    isLockedMission ? styles.iconLocked : null,
                  ]}
                />
                {missionBadge?.kind === 'locked' ? (
                  <View style={styles.lockBadge}>
                    <LockGlyph compact />
                  </View>
                ) : null}
                {missionBadge?.kind === 'count' ? (
                  <View style={styles.readyBadge}>
                    <Text style={styles.readyBadgeText}>
                      {Math.min(99, missionBadge.count)}
                    </Text>
                  </View>
                ) : null}
                {missionBadge?.kind === 'new' ? (
                  <View style={styles.newMissionBadge}>
                    <Text style={styles.newMissionBadgeText}>
                      {msg('NOVO')}
                    </Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.labelPlate}>
                <Text
                  adjustsFontSizeToFit
                  maxFontSizeMultiplier={1.35}
                  minimumFontScale={0.8}
                  numberOfLines={1}
                  style={[
                    styles.label,
                    { fontSize: labelSize },
                    isActive ? styles.labelActive : null,
                    isLockedMission ? styles.labelLocked : null,
                  ]}
                >
                  {item.label}
                </Text>
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignItems: 'stretch',
    backgroundColor: 'transparent',
    bottom: 0,
    flexDirection: 'row',
    height: BOTTOM_NAV_HEIGHT,
    left: 0,
    // height/paddingBottom reais vêm de insets.bottom (ver componente) — os
    // valores aqui são só o estado inicial antes do primeiro layout de insets.
    paddingBottom: 12,
    // Centros das quatro placas da arte: aproximadamente 15%, 38%, 62%, 85%.
    paddingHorizontal: '3.5%',
    paddingTop: 4,
    position: 'absolute',
    right: 0,
    zIndex: 12,
  },
  safeAreaBackdrop: {
    ...StyleSheet.absoluteFillObject,
    top: -14,
  },
  railArt: {
    height: 88,
    left: 0,
    position: 'absolute',
    right: 0,
    width: '100%',
  },
  railImage: {
    height: '100%',
    width: '100%',
  },
  iconInactive: {
    opacity: 0.94,
  },
  iconLocked: {
    opacity: 0.7,
  },
  itemContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  activeHalo: {
    backgroundColor: 'rgba(255, 224, 144, 0.38)',
    borderColor: forestPolish.gold,
    borderRadius: 28,
    borderWidth: 2,
    height: 46,
    left: -2,
    position: 'absolute',
    shadowColor: forestPolish.gold,
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.66,
    shadowRadius: 8,
    top: -1,
    width: 52,
  },
  iconWrap: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    position: 'relative',
    width: 48,
  },
  item: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    flex: 1,
    justifyContent: 'center',
    // Legacy QA contract: minHeight: CAMPAIGN_TOUCH_TARGET_SIZE; the shared
    // mobile minimum remains enforced by the max expression below.
    minHeight: Math.max(CAMPAIGN_TOUCH_TARGET_SIZE, touchTargets.minimum),
    paddingBottom: 1,
    paddingHorizontal: 2,
    paddingTop: 1,
  },
  itemInactive: {
    opacity: 0.98,
  },
  itemActive: {
    zIndex: 1,
  },
  itemPressed: {
    opacity: 0.9,
  },
  labelPlate: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 18,
    maxWidth: '100%',
    width: 78,
  },
  label: {
    color: '#59391E',
    fontSize: 10,
    fontWeight: '900',
    includeFontPadding: false,
    letterSpacing: 0.3,
    lineHeight: 12,
    maxWidth: '100%',
    textShadowColor: 'transparent',
    textShadowOffset: { height: 0, width: 0 },
    textShadowRadius: 0,
    textTransform: 'uppercase',
  },
  labelActive: {
    color: forestPolish.woodDark,
  },
  labelLocked: {
    color: '#705845',
  },
  lockBody: {
    backgroundColor: forestPolish.cream,
    borderRadius: 2,
    bottom: 0,
    height: 7,
    position: 'absolute',
    width: 10,
  },
  lockBadge: {
    alignItems: 'center',
    backgroundColor: forestPolish.gold,
    borderColor: forestPolish.woodLight,
    borderRadius: 8,
    borderWidth: 1,
    bottom: -1,
    height: 17,
    justifyContent: 'center',
    position: 'absolute',
    right: -1,
    width: 17,
  },
  lockGlyph: {
    alignItems: 'center',
    height: 14,
    justifyContent: 'flex-end',
    position: 'relative',
    width: 14,
  },
  lockGlyphCompact: {
    height: 10,
    width: 10,
  },
  lockShackle: {
    borderColor: forestPolish.cream,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    borderWidth: 2,
    borderBottomWidth: 0,
    height: 7,
    position: 'absolute',
    top: 0,
    width: 8,
  },
  lockBodyBadge: {
    backgroundColor: forestPolish.woodDark,
  },
  lockShackleBadge: {
    borderColor: forestPolish.woodDark,
  },
  lockedFeedback: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: forestPolish.woodDark,
    borderColor: forestPolish.bark,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    position: 'absolute',
    top: -42,
  },
  lockedFeedbackText: {
    color: '#FFF8E8',
    fontSize: 11,
    fontWeight: '900',
  },
  newMissionBadge: {
    alignItems: 'center',
    backgroundColor: colors.gold,
    borderColor: '#FFF7C7',
    borderRadius: 7,
    borderWidth: 1,
    left: -8,
    minHeight: 16,
    paddingHorizontal: 4,
    position: 'absolute',
    top: -4,
  },
  newMissionBadgeText: {
    color: colors.goldDark,
    fontSize: 8,
    fontWeight: '900',
    lineHeight: 10,
  },
  newMissionGlow: {
    backgroundColor: 'rgba(255, 211, 90, 0.45)',
    borderRadius: 30,
    height: 58,
    position: 'absolute',
    width: 58,
  },
  readyBadge: {
    alignItems: 'center',
    backgroundColor: '#F05278',
    borderColor: '#FFFFFF',
    borderRadius: 9,
    borderWidth: 1,
    height: 18,
    justifyContent: 'center',
    minWidth: 18,
    paddingHorizontal: 3,
    position: 'absolute',
    right: -1,
    top: -2,
  },
  readyBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    lineHeight: 11,
  },
});
