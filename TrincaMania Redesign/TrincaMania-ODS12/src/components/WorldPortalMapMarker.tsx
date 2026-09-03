import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GameIcon } from './GameIcon';
import { colors, radii } from '../styles/theme';

export type WorldPortalMapMarkerProps = {
  locked: boolean;
  selected: boolean;
  worldLabel: string;
  onPress: () => void;
};

function WorldPortalMapMarkerBase({
  locked,
  selected,
  worldLabel,
  onPress,
}: WorldPortalMapMarkerProps) {
  return (
    <Pressable
      accessibilityLabel={`Portal para ${worldLabel}${locked ? ', bloqueado' : ''}`}
      accessibilityRole="button"
      accessibilityState={{ disabled: locked, selected }}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pressable,
        pressed ? styles.pressed : null,
      ]}
    >
      <View pointerEvents="none" style={styles.marker}>
        <View style={styles.groundShadow} />
        <View
          style={[
            styles.portalGlow,
            locked ? styles.portalGlowLocked : null,
            selected ? styles.portalGlowSelected : null,
          ]}
        />
        {selected ? <View style={styles.selectedGround} /> : null}

        <View style={[styles.runeRing, locked ? styles.runeRingLocked : null]}>
          <View
            style={[styles.runeInner, locked ? styles.runeInnerLocked : null]}
          />
          <View style={styles.iconDisc}>
            <GameIcon
              muted={locked}
              name={locked ? 'lock' : 'map'}
              size={locked ? 23 : 27}
              tone={locked ? 'neutral' : 'blue'}
              variant="plain"
            />
          </View>
          {!locked ? (
            <>
              <View style={[styles.runeSpark, styles.runeSparkLeft]} />
              <View style={[styles.runeSpark, styles.runeSparkRight]} />
            </>
          ) : null}
        </View>

        <View
          style={[
            styles.labelSupport,
            locked ? styles.labelSupportLocked : null,
          ]}
        />
        <View
          style={[
            styles.labelStone,
            locked ? styles.labelStoneLocked : null,
            selected ? styles.labelStoneSelected : null,
          ]}
        >
          <Text
            adjustsFontSizeToFit
            minimumFontScale={0.72}
            numberOfLines={1}
            style={[styles.labelText, locked ? styles.labelTextLocked : null]}
          >
            {locked ? 'Bloqueado' : worldLabel}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export const WorldPortalMapMarker = memo(WorldPortalMapMarkerBase);

const styles = StyleSheet.create({
  groundShadow: {
    backgroundColor: 'rgba(24, 25, 37, 0.34)',
    borderRadius: radii.pill,
    bottom: 12,
    height: 10,
    position: 'absolute',
    width: 68,
  },
  iconDisc: {
    alignItems: 'center',
    backgroundColor: 'rgba(238, 247, 255, 0.9)',
    borderColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  labelStone: {
    alignItems: 'center',
    backgroundColor: 'rgba(43, 56, 72, 0.94)',
    borderBottomColor: '#1D2938',
    borderBottomWidth: 2,
    borderColor: '#A8C9E8',
    borderRadius: 7,
    borderWidth: 2,
    bottom: 0,
    justifyContent: 'center',
    maxWidth: 100,
    minHeight: 21,
    minWidth: 68,
    paddingHorizontal: 7,
    paddingVertical: 1,
    position: 'absolute',
  },
  labelStoneLocked: {
    backgroundColor: 'rgba(72, 82, 83, 0.94)',
    borderBottomColor: '#3B4748',
    borderColor: '#C6D0CE',
  },
  labelStoneSelected: {
    borderColor: '#FFF0A8',
  },
  labelSupport: {
    backgroundColor: '#526B82',
    bottom: 17,
    height: 11,
    position: 'absolute',
    width: 6,
  },
  labelSupportLocked: {
    backgroundColor: '#626D6B',
  },
  labelText: {
    color: colors.inkOnDark,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.25,
    lineHeight: 11,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.34)',
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 1,
    textTransform: 'uppercase',
  },
  labelTextLocked: {
    color: '#F3F7F6',
  },
  marker: {
    alignItems: 'center',
    height: 92,
    justifyContent: 'flex-start',
    position: 'relative',
    width: 104,
  },
  portalGlow: {
    backgroundColor: 'rgba(120, 202, 255, 0.2)',
    borderColor: 'rgba(190, 232, 255, 0.52)',
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 66,
    position: 'absolute',
    top: 0,
    width: 76,
  },
  portalGlowLocked: {
    backgroundColor: 'rgba(163, 175, 177, 0.12)',
    borderColor: 'rgba(221, 230, 228, 0.28)',
  },
  portalGlowSelected: {
    backgroundColor: 'rgba(255, 225, 112, 0.24)',
    borderColor: 'rgba(255, 245, 193, 0.76)',
  },
  pressed: {
    opacity: 0.92,
    transform: [{ translateY: 1 }, { scale: 0.98 }],
  },
  pressable: {
    alignItems: 'center',
    height: 92,
    justifyContent: 'center',
    width: 104,
  },
  runeInner: {
    borderColor: 'rgba(210, 240, 255, 0.82)',
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 44,
    position: 'absolute',
    width: 44,
  },
  runeInnerLocked: {
    borderColor: 'rgba(217, 226, 224, 0.58)',
  },
  runeRing: {
    alignItems: 'center',
    backgroundColor: 'rgba(54, 121, 172, 0.2)',
    borderColor: 'rgba(222, 245, 255, 0.88)',
    borderRadius: radii.pill,
    borderWidth: 2,
    height: 58,
    justifyContent: 'center',
    marginTop: 4,
    width: 58,
  },
  runeRingLocked: {
    backgroundColor: 'rgba(90, 102, 103, 0.2)',
    borderColor: 'rgba(218, 226, 224, 0.66)',
  },
  runeSpark: {
    backgroundColor: '#EAF8FF',
    borderRadius: radii.pill,
    height: 4,
    position: 'absolute',
    width: 4,
  },
  runeSparkLeft: {
    left: 5,
    top: 18,
  },
  runeSparkRight: {
    right: 7,
    top: 8,
  },
  selectedGround: {
    backgroundColor: 'rgba(255, 225, 112, 0.2)',
    borderColor: 'rgba(255, 245, 193, 0.72)',
    borderRadius: radii.pill,
    borderWidth: 1,
    bottom: 8,
    height: 20,
    position: 'absolute',
    width: 82,
  },
});
