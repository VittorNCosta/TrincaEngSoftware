import { Image, ImageSourcePropType, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, radii, shadows } from '../../original/styles/theme';

type IntroTileProps = {
  accent: string;
  accessibilityLabel: string;
  onAssetReady: () => void;
  source: ImageSourcePropType;
  size: number;
  testID?: string;
};

export function IntroTile({
  accent,
  accessibilityLabel,
  onAssetReady,
  source,
  size,
  testID,
}: IntroTileProps) {
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessible
      style={[styles.tile, { borderColor: accent, height: size, width: size }]}
    >
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.98)', 'rgba(255, 244, 201, 0.94)']}
        end={{ x: 0.85, y: 1 }}
        start={{ x: 0.15, y: 0 }}
        style={[styles.tileSurface, { borderRadius: size * 0.25 }]}
      >
        <View
          pointerEvents="none"
          style={[styles.tileGlow, { backgroundColor: accent }]}
        />
        <Image
          testID={testID}
          onError={onAssetReady}
          accessibilityIgnoresInvertColors
          onLoad={onAssetReady}
          resizeMode="contain"
          source={source}
          style={{ height: size * 0.78, width: size * 0.78 }}
        />
        <View pointerEvents="none" style={styles.tileShine} />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    ...shadows.tile,
    backgroundColor: colors.creamLight,
    borderRadius: 24,
    borderWidth: 2,
    padding: 3,
  },
  tileGlow: {
    borderRadius: radii.pill,
    height: '32%',
    left: '12%',
    opacity: 0.13,
    position: 'absolute',
    top: '8%',
    width: '76%',
  },
  tileShine: {
    backgroundColor: 'rgba(255, 255, 255, 0.76)',
    borderRadius: radii.pill,
    height: 7,
    left: '16%',
    opacity: 0.8,
    position: 'absolute',
    top: '12%',
    transform: [{ rotate: '-18deg' }],
    width: '35%',
  },
  tileSurface: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
