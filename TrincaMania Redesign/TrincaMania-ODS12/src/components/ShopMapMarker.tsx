import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GameIcon } from './GameIcon';
import { RecyclingMarkerArt } from './RecyclingMarkerArt';
import { colors, radii, shadows } from '../styles/theme';

type ShopMapMarkerProps = {
  afterLevelLabel: string;
  comingSoon?: boolean;
  locked: boolean;
  selected: boolean;
  onPress: () => void;
};

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
      ? `Após ${afterLevelLabel}`
      : 'Descanso';
  const isOpen = !locked && !comingSoon;

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
      hitSlop={4}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pressable,
        pressed ? styles.pressed : null,
      ]}
    >
      <View pointerEvents="none" style={styles.scene}>
        <View style={styles.shadow} />
        {selected ? <View style={styles.selectedAura} /> : null}
        <RecyclingMarkerArt
          kind={isOpen ? 'shop' : 'shopLocked'}
          style={styles.shopImage}
        />
        {!isOpen ? (
          <View
            style={[styles.stateBadge, comingSoon ? styles.soonBadge : null]}
          >
            <GameIcon
              name={locked ? 'lock' : 'bonus'}
              size={15}
              tone={locked ? 'neutral' : 'pink'}
              variant="plain"
            />
          </View>
        ) : (
          <View style={styles.openIndicator}>
            <View style={styles.openIndicatorCore} />
          </View>
        )}
        <View
          style={[
            styles.label,
            locked ? styles.lockedLabel : null,
            comingSoon ? styles.soonLabel : null,
            selected ? styles.selectedLabel : null,
          ]}
        >
          <Text
            adjustsFontSizeToFit
            minimumFontScale={0.78}
            numberOfLines={1}
            style={styles.labelText}
          >
            {label}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: {
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
    ...shadows.card,
  },
  labelText: {
    color: colors.inkOnDark,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.25,
    lineHeight: 11,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  lockedLabel: {
    backgroundColor: '#6E7775',
    borderBottomColor: '#3F4947',
    borderColor: '#C6D1CE',
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
    zIndex: 3,
  },
  openIndicatorCore: {
    backgroundColor: '#23C889',
    borderRadius: radii.pill,
    height: 7,
    width: 7,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ translateY: 1 }, { scale: 0.98 }],
  },
  pressable: {
    alignItems: 'center',
    height: 96,
    justifyContent: 'center',
    position: 'relative',
    width: 104,
  },
  scene: {
    alignItems: 'center',
    height: 96,
    justifyContent: 'flex-start',
    position: 'relative',
    width: 104,
  },
  selectedAura: {
    backgroundColor: 'rgba(255, 226, 120, 0.26)',
    borderColor: 'rgba(255, 246, 198, 0.82)',
    borderRadius: radii.pill,
    borderWidth: 2,
    bottom: 8,
    height: 21,
    position: 'absolute',
    width: 92,
  },
  selectedLabel: {
    borderColor: '#FFF3B5',
  },
  shadow: {
    backgroundColor: 'rgba(48, 35, 19, 0.25)',
    borderRadius: radii.pill,
    bottom: 12,
    height: 11,
    position: 'absolute',
    width: 76,
  },
  shopImage: {
    height: 76,
    width: 76,
    zIndex: 2,
  },
  soonBadge: {
    backgroundColor: '#FFF0F6',
    borderColor: '#F7B7D1',
  },
  soonLabel: {
    backgroundColor: '#596F94',
    borderBottomColor: '#34445F',
    borderColor: '#C9D8F0',
  },
  stateBadge: {
    alignItems: 'center',
    backgroundColor: '#EFF3F1',
    borderColor: '#C2CECA',
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
});
