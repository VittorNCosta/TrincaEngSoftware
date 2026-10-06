import { Image, StyleSheet, View } from 'react-native';
import type { ImageStyle, StyleProp, ViewStyle } from 'react-native';

type Props = {
  kind: 'rest' | 'shop' | 'shopLocked' | 'guardian' | 'portal';
  imageStyle?: StyleProp<ImageStyle>;
  style?: StyleProp<ViewStyle>;
};

const ART = {
  rest: require('../../assets/ui/visuais/rest.png'),
  shop: require('../../assets/ui/visuais/shop.png'),
  shopLocked: require('../../assets/ui/visuais/shop_locked.png'),
  guardian: require('../../assets/ui/visuais/guardian.png'),
  portal: require('../../assets/ui/visuais/world_transition.png'),
};

export function RecyclingMarkerArt({ kind, imageStyle, style }: Props) {
  return (
    <View
      accessible={false}
      pointerEvents="none"
      style={[styles.container, style]}
    >
      <Image
        accessible={false}
        source={ART[kind]}
        resizeMode="contain"
        style={[styles.image, imageStyle]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  // Static PNGs bring their intrinsic width/height on Android. Insets alone
  // do not override them: the image must explicitly fit the marker.
  image: {
    height: '100%',
    width: '100%',
  },
});
