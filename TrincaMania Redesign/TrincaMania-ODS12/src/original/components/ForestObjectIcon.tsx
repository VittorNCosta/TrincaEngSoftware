import { Image, View } from 'react-native';
import { type StyleProp, type ViewStyle } from 'react-native';
import { FOREST_OBJECT_ASSETS } from '../data/forestObjectAssets';

export function ForestObjectIcon({
  name,
  size,
  muted = false,
  style,
}: {
  name: keyof typeof FOREST_OBJECT_ASSETS;
  size: number;
  muted?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ width: size, height: size }, style]}
    >
      <Image
        accessible={false}
        fadeDuration={0}
        resizeMode="contain"
        source={FOREST_OBJECT_ASSETS[name]}
        style={{ width: size, height: size, opacity: muted ? 0.65 : 1 }}
      />
    </View>
  );
}
