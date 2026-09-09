import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  type ImageSourcePropType,
  View,
} from 'react-native';

import { GameIcon } from './GameIcon';
import { colors, radii } from '../styles/theme';

// O arquivo `forest_rest_cart.png` mantém o nome antigo até A-28 substituir a
// arte pelo selo de "Descanso" no tema ODS12.
const restCartImage =
  require('../../assets/map/world1/forest_rest_cart.png') as ImageSourcePropType;

export type RestStopMapMarkerProps = {
  afterLevelLabel: string;
  comingSoon?: boolean;
  locked: boolean;
  selected: boolean;
  onPress: () => void;
};

export function RestStopMapMarker({
  afterLevelLabel,
  comingSoon = false,
  locked,
  selected,
  onPress,
}: RestStopMapMarkerProps) {
  const label = comingSoon
    ? 'Em breve'
    : locked
      ? `Após ${afterLevelLabel}`
      : 'Descanso';
  const isOpen = !locked && !comingSoon;

  return (
    <Pressable
      accessibilityHint={
        comingSoon
          ? 'Mostra informações sobre o próximo ponto da campanha'
          : locked
            ? 'Mostra como desbloquear este ponto de descanso'
            : 'Abre o ponto de descanso e a loja'
      }
      accessibilityLabel={`Ponto de descanso, ${label}`}
      accessibilityRole="button"
      accessibilityState={{ disabled: locked, selected }}
      hitSlop={4}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pressable,
        pressed ? styles.pressed : null,
      ]}
    >
      <View pointerEvents="none" style={styles.scene}>
        <View style={styles.groundShadow} />
        {selected ? <View style={styles.selectedGround} /> : null}

        <Image
          resizeMode="contain"
          source={restCartImage}
          style={[
            styles.restCartImage,
            locked ? styles.restCartImageLocked : null,
            comingSoon && !locked ? styles.restCartImageSoon : null,
          ]}
        />

        {locked ? (
          <View style={[styles.stateBadge, styles.stateBadgeLocked]}>
            <GameIcon name="lock" size={15} tone="neutral" variant="plain" />
          </View>
        ) : comingSoon ? (
          <View style={[styles.stateBadge, styles.stateBadgeSoon]}>
            <GameIcon name="bonus" size={15} tone="pink" variant="plain" />
          </View>
        ) : (
          <View style={styles.openIndicator}>
            <View style={styles.openIndicatorCore} />
          </View>
        )}

        <View
          style={[styles.plaquePost, !isOpen ? styles.plaquePostMuted : null]}
        />
        <View
          style={[
            styles.plaque,
            locked ? styles.plaqueLocked : null,
            comingSoon ? styles.plaqueSoon : null,
            selected ? styles.plaqueSelected : null,
          ]}
        >
          <Text
            adjustsFontSizeToFit
            minimumFontScale={0.78}
            numberOfLines={1}
            style={styles.plaqueText}
          >
            {label}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  groundShadow: {
    backgroundColor: 'rgba(48, 35, 19, 0.32)',
    borderRadius: radii.pill,
    bottom: 12,
    height: 11,
    position: 'absolute',
    width: 76,
  },
  openIndicator: {
    alignItems: 'center',
    backgroundColor: '#E8FFF3',
    borderColor: '#FFFFFF',
    borderRadius: radii.pill,
    borderWidth: 2,
    height: 16,
    justifyContent: 'center',
    position: 'absolute',
    right: 8,
    top: 7,
    width: 16,
  },
  openIndicatorCore: {
    backgroundColor: '#23C889',
    borderRadius: radii.pill,
    height: 7,
    width: 7,
  },
  plaque: {
    alignItems: 'center',
    backgroundColor: '#805126',
    borderBottomColor: '#46280F',
    borderBottomWidth: 2,
    borderColor: '#D6A563',
    borderRadius: 7,
    borderWidth: 2,
    bottom: 0,
    justifyContent: 'center',
    maxWidth: 98,
    minHeight: 21,
    minWidth: 72,
    paddingHorizontal: 7,
    paddingVertical: 1,
    position: 'absolute',
  },
  plaqueLocked: {
    backgroundColor: '#6E7775',
    borderBottomColor: '#3F4947',
    borderColor: '#C6D1CE',
  },
  plaquePost: {
    backgroundColor: '#5A3517',
    bottom: 17,
    height: 12,
    position: 'absolute',
    width: 5,
  },
  plaquePostMuted: {
    backgroundColor: '#56615E',
  },
  plaqueSelected: {
    borderColor: '#FFF3B5',
  },
  plaqueSoon: {
    backgroundColor: '#596F94',
    borderBottomColor: '#34445F',
    borderColor: '#C9D8F0',
  },
  plaqueText: {
    color: colors.inkOnDark,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.25,
    lineHeight: 11,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.32)',
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 1,
    textTransform: 'uppercase',
  },
  pressed: {
    opacity: 0.92,
    transform: [{ translateY: 1 }, { scale: 0.98 }],
  },
  pressable: {
    alignItems: 'center',
    height: 96,
    justifyContent: 'center',
    position: 'relative',
    width: 104,
  },
  restCartImage: {
    height: 76,
    marginTop: -1,
    width: 76,
    zIndex: 2,
  },
  restCartImageLocked: {
    opacity: 0.58,
  },
  restCartImageSoon: {
    opacity: 0.76,
  },
  scene: {
    alignItems: 'center',
    height: 96,
    justifyContent: 'flex-start',
    position: 'relative',
    width: 104,
  },
  selectedGround: {
    backgroundColor: 'rgba(255, 226, 120, 0.26)',
    borderColor: 'rgba(255, 246, 198, 0.82)',
    borderRadius: radii.pill,
    borderWidth: 2,
    bottom: 8,
    height: 21,
    position: 'absolute',
    width: 92,
  },
  stateBadge: {
    alignItems: 'center',
    borderRadius: radii.pill,
    borderWidth: 2,
    height: 22,
    justifyContent: 'center',
    position: 'absolute',
    right: 6,
    top: 5,
    width: 22,
    zIndex: 3,
  },
  stateBadgeLocked: {
    backgroundColor: '#EFF3F1',
    borderColor: '#C2CECA',
  },
  stateBadgeSoon: {
    backgroundColor: '#FFF0F6',
    borderColor: '#F7B7D1',
  },
});
