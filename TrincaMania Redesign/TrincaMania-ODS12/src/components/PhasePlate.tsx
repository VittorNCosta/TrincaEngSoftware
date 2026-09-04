import { StyleSheet, Text, View } from 'react-native';

import { radii, shadows, spacing } from '../styles/theme';

type PhasePlateProps = {
  levelLabel: string;
  worldLabel: string;
  worldName: string;
};

export function PhasePlate({
  levelLabel,
  worldLabel,
  worldName,
}: PhasePlateProps) {
  return (
    <View style={styles.plate}>
      <View pointerEvents="none" style={[styles.notch, styles.notchLeft]} />
      <View pointerEvents="none" style={[styles.notch, styles.notchRight]} />
      <View pointerEvents="none" style={styles.gloss} />
      <Text
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        numberOfLines={1}
        style={styles.title}
      >
        Fase {levelLabel}
      </Text>
      <Text
        adjustsFontSizeToFit
        minimumFontScale={0.65}
        numberOfLines={1}
        style={styles.subtitle}
      >
        {worldName} · {worldLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  gloss: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: radii.pill,
    height: 9,
    left: 12,
    position: 'absolute',
    right: 12,
    top: 3,
  },
  notch: {
    borderBottomColor: 'transparent',
    borderBottomWidth: 8,
    borderTopColor: 'transparent',
    borderTopWidth: 8,
    height: 0,
    position: 'absolute',
    top: 11,
    width: 0,
  },
  notchLeft: {
    borderRightColor: '#FFD35A',
    borderRightWidth: 10,
    left: -11,
  },
  notchRight: {
    borderLeftColor: '#FFD35A',
    borderLeftWidth: 10,
    right: -11,
  },
  plate: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: '#5C2A9B',
    borderBottomColor: '#2C0E56',
    borderBottomWidth: 5,
    borderColor: '#FFD35A',
    borderRadius: 13,
    borderWidth: 3,
    paddingBottom: 4,
    paddingHorizontal: spacing.sm,
    paddingTop: 3,
    ...shadows.button,
  },
  subtitle: {
    color: '#FFE9A8',
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 1.3,
    lineHeight: 11,
    textTransform: 'uppercase',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 23,
    textShadowColor: 'rgba(0, 0, 0, 0.32)',
    textShadowOffset: { height: 2, width: 0 },
    textShadowRadius: 1,
  },
});
