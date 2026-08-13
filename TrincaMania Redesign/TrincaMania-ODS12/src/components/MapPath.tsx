import { StyleSheet, View } from 'react-native';

import { colors, radii } from '../styles/theme';

type MapPathProps = {
  nodeCount: number;
};

const PATH_SEGMENTS = [
  { left: 70, rotate: '-20deg' },
  { left: 124, rotate: '18deg' },
  { left: 190, rotate: '-19deg' },
  { left: 135, rotate: '20deg' },
  { left: 78, rotate: '-18deg' },
  { left: 132, rotate: '18deg' },
  { left: 198, rotate: '-20deg' },
  { left: 138, rotate: '19deg' },
  { left: 78, rotate: '-17deg' },
  { left: 132, rotate: '17deg' },
];

const FOOTPRINTS = [
  { left: 118, top: 112 },
  { left: 187, top: 206 },
  { left: 124, top: 306 },
  { left: 184, top: 404 },
  { left: 116, top: 506 },
  { left: 190, top: 610 },
  { left: 124, top: 716 },
  { left: 184, top: 820 },
];

export function MapPath({ nodeCount }: MapPathProps) {
  return (
    <View pointerEvents="none" style={styles.path}>
      {Array.from({ length: Math.max(0, nodeCount - 1) }).map((_, index) => {
        const segment = PATH_SEGMENTS[index % PATH_SEGMENTS.length];

        return (
          <View
            key={`path-segment-${index}`}
            style={[
              styles.segment,
              {
                left: segment.left,
                top: 94 + index * 92,
                transform: [{ rotate: segment.rotate }],
              },
            ]}
          >
            <View style={styles.segmentCenter} />
            <View style={[styles.edgePebble, styles.edgePebbleOne]} />
            <View style={[styles.edgePebble, styles.edgePebbleTwo]} />
          </View>
        );
      })}

      {FOOTPRINTS.map((footprint, index) => (
        <View key={`footprint-${index}`} style={[styles.footprint, footprint]} />
      ))}

      {Array.from({ length: nodeCount * 2 }).map((_, index) => (
        <View
          key={`path-glow-${index}`}
          style={[
            styles.glowDot,
            {
              left: index % 4 < 2 ? 146 : 174,
              top: 54 + index * 45,
            },
            index % 3 === 0 ? styles.goldGlowDot : null,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  edgePebble: {
    backgroundColor: 'rgba(134, 86, 38, 0.42)',
    borderRadius: radii.pill,
    height: 5,
    position: 'absolute',
    width: 5,
  },
  edgePebbleOne: {
    left: 12,
    top: 26,
  },
  edgePebbleTwo: {
    bottom: 30,
    right: 10,
  },
  footprint: {
    backgroundColor: 'rgba(117, 74, 36, 0.26)',
    borderRadius: radii.pill,
    height: 9,
    opacity: 0.72,
    position: 'absolute',
    transform: [{ rotate: '-18deg' }],
    width: 15,
  },
  glowDot: {
    backgroundColor: 'rgba(255, 244, 190, 0.78)',
    borderColor: 'rgba(181, 117, 42, 0.42)',
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 9,
    opacity: 0.72,
    position: 'absolute',
    width: 9,
  },
  goldGlowDot: {
    backgroundColor: colors.primary,
    borderColor: '#FFF6C6',
    height: 13,
    opacity: 0.95,
    width: 13,
  },
  path: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  segment: {
    alignItems: 'center',
    backgroundColor: '#B77A3A',
    borderColor: 'rgba(111, 70, 31, 0.55)',
    borderRadius: 34,
    borderWidth: 2,
    height: 116,
    justifyContent: 'center',
    opacity: 0.96,
    position: 'absolute',
    shadowColor: '#5B3519',
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
    width: 64,
  },
  segmentCenter: {
    backgroundColor: '#E8C985',
    borderColor: 'rgba(255, 246, 198, 0.46)',
    borderRadius: 28,
    borderWidth: 1,
    height: '91%',
    width: 48,
  },
});
