import { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  type ImageSourcePropType,
  View,
} from 'react-native';

import { GameIcon } from './GameIcon';
import { colors, radii, shadows } from '../styles/theme';

const shopImage =
  require('../../assets/map/map_shop.png') as ImageSourcePropType;

type ShopMapMarkerProps = {
  afterLevelLabel: string;
  comingSoon?: boolean;
  locked: boolean;
  selected: boolean;
  onPress: () => void;
};

const AWNING_STRIPES = 6;

export function ShopMapMarker({
  afterLevelLabel,
  comingSoon = false,
  locked,
  selected,
  onPress,
}: ShopMapMarkerProps) {
  const label = comingSoon
    ? 'Em breve'
    : locked
      ? `Bloq. ${afterLevelLabel}`
      : 'Descanso';
  const isOpen = !locked && !comingSoon;
  const swing = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isOpen) {
      swing.stopAnimation();
      swing.setValue(0);
      return undefined;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(swing, {
          duration: 1300,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(swing, {
          duration: 1300,
          toValue: -1,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => animation.stop();
  }, [isOpen, swing]);

  const plaqueTilt = swing.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-3.5deg', '3.5deg'],
  });

  return (
    <Pressable
      accessibilityHint={
        comingSoon
          ? 'Mostra informações sobre a próxima loja'
          : locked
            ? 'Mostra como desbloquear esta loja'
            : 'Abre a loja'
      }
      accessibilityLabel={`Loja, ${label}`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pressable,
        pressed ? styles.pressed : null,
      ]}
    >
      <View style={styles.shadow} />
      {selected ? <View style={styles.selectedAura} /> : null}
      <View style={[styles.stall, isOpen ? null : styles.stallClosed]}>
        <View style={styles.awning}>
          {Array.from({ length: AWNING_STRIPES }).map((_, index) => (
            <View
              key={`stripe-${index}`}
              style={[
                styles.stripe,
                index % 2 === 0 ? styles.stripeA : styles.stripeB,
                isOpen
                  ? null
                  : index % 2 === 0
                    ? styles.stripeClosedA
                    : styles.stripeClosedB,
              ]}
            />
          ))}
        </View>
        <View style={styles.awningLip} />
        <View style={[styles.body, isOpen ? null : styles.bodyClosed]}>
          {comingSoon ? (
            <View style={styles.soonBody}>
              <GameIcon
                muted={locked}
                name={locked ? 'lock' : 'bonus'}
                size={24}
                tone={locked ? 'neutral' : 'pink'}
              />
              <Text style={styles.shopText}>{locked ? 'Bloq.' : 'Novo'}</Text>
            </View>
          ) : (
            <Image
              resizeMode="contain"
              source={shopImage}
              style={[styles.shopImage, locked ? styles.shopImageLocked : null]}
            />
          )}
        </View>
      </View>
      <Animated.View
        pointerEvents="none"
        style={[styles.plaqueSwing, { transform: [{ rotate: plaqueTilt }] }]}
      >
        <View style={styles.plaqueRope} />
        <View style={[styles.plaque, isOpen ? null : styles.plaqueClosed]}>
          <Text style={styles.plaqueText}>Loja</Text>
        </View>
      </Animated.View>
      {isOpen ? (
        <View style={styles.alertBadge}>
          <Text style={styles.alertText}>!</Text>
        </View>
      ) : null}
      <View
        style={[
          styles.label,
          locked ? styles.lockedLabel : null,
          comingSoon ? styles.soonLabel : null,
        ]}
      >
        <Text numberOfLines={1} style={styles.labelText}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  alertBadge: {
    alignItems: 'center',
    backgroundColor: '#F0527A',
    borderColor: '#FFFFFF',
    borderRadius: radii.pill,
    borderWidth: 2,
    height: 18,
    justifyContent: 'center',
    left: 8,
    position: 'absolute',
    top: 10,
    width: 18,
    zIndex: 4,
    ...shadows.button,
  },
  alertText: {
    color: colors.inkOnDark,
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 13,
  },
  awning: {
    flexDirection: 'row',
    height: 14,
    overflow: 'hidden',
  },
  awningLip: {
    backgroundColor: 'rgba(58, 31, 11, 0.22)',
    height: 4,
  },
  body: {
    alignItems: 'center',
    backgroundColor: '#FFE9C2',
    flex: 1,
    justifyContent: 'center',
  },
  bodyClosed: {
    backgroundColor: '#D6DEE0',
  },
  label: {
    alignItems: 'center',
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.primary,
    borderRadius: radii.pill,
    borderWidth: 2,
    bottom: 0,
    minWidth: 76,
    paddingHorizontal: 7,
    paddingVertical: 2,
    position: 'absolute',
    ...shadows.card,
  },
  labelText: {
    color: colors.ink,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  lockedLabel: {
    backgroundColor: '#F6E8C8',
    borderColor: '#B89453',
  },
  plaque: {
    backgroundColor: '#8A5527',
    borderBottomColor: '#4E2B10',
    borderBottomWidth: 2,
    borderColor: '#E0B26A',
    borderRadius: 6,
    borderWidth: 2,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  plaqueClosed: {
    backgroundColor: '#7C8A90',
    borderBottomColor: '#404C51',
    borderColor: '#C3D0D3',
  },
  plaqueRope: {
    backgroundColor: '#5E3714',
    height: 10,
    width: 2,
  },
  plaqueSwing: {
    alignItems: 'center',
    height: 32,
    position: 'absolute',
    right: 2,
    top: 20,
    width: 40,
    zIndex: 3,
  },
  plaqueText: {
    color: '#FFF1D6',
    fontSize: 9,
    fontWeight: '900',
    lineHeight: 12,
    textTransform: 'uppercase',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ translateY: 2 }, { scale: 0.98 }],
  },
  pressable: {
    alignItems: 'center',
    height: 96,
    justifyContent: 'center',
    position: 'relative',
    width: 104,
  },
  selectedAura: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.78)',
    borderRadius: radii.pill,
    borderWidth: 2,
    height: 88,
    position: 'absolute',
    width: 98,
  },
  shadow: {
    backgroundColor: 'rgba(68, 43, 22, 0.22)',
    borderRadius: radii.pill,
    bottom: 7,
    height: 16,
    position: 'absolute',
    width: 78,
  },
  shopImage: {
    height: 46,
    width: 62,
  },
  shopImageLocked: {
    opacity: 0.58,
  },
  shopText: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 12,
    textTransform: 'uppercase',
  },
  soonBody: {
    alignItems: 'center',
    gap: 1,
  },
  soonLabel: {
    backgroundColor: '#DCE7FF',
    borderColor: '#8AA5E8',
  },
  stall: {
    borderBottomColor: '#5E3714',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderBottomWidth: 5,
    borderLeftColor: '#8A5527',
    borderLeftWidth: 5,
    borderRightColor: '#8A5527',
    borderRightWidth: 5,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    height: 70,
    overflow: 'hidden',
    width: 84,
    ...shadows.button,
  },
  stallClosed: {
    borderBottomColor: '#404C51',
    borderLeftColor: '#7C8A90',
    borderRightColor: '#7C8A90',
  },
  stripe: {
    flex: 1,
  },
  stripeA: {
    backgroundColor: '#E4483F',
  },
  stripeB: {
    backgroundColor: '#FFF1D6',
  },
  stripeClosedA: {
    backgroundColor: '#9DAAB0',
  },
  stripeClosedB: {
    backgroundColor: '#E8EEF0',
  },
});
