import { Image, StyleSheet, View } from 'react-native';
import type { ImageStyle, StyleProp, ViewStyle } from 'react-native';

type Props = {
  kind: 'rest' | 'shop' | 'guardian' | 'portal';
  imageStyle?: StyleProp<ImageStyle>;
  style?: StyleProp<ViewStyle>;
};

const ART = {
  rest: require('../../assets/ui/visuais/rest.png'),
  shop: require('../../assets/ui/visuais/shop.png'),
  guardian: require('../../assets/ui/visuais/guardian.png'),
  portal: require('../../assets/ui/visuais/world_transition.png'),
};

export function RecyclingMarkerArt({ kind, imageStyle, style }: Props) {
  return (
    <View style={[{ width: '100%', height: '100%' }, style]}>
      <Image
        accessible={false}
        source={ART[kind]}
        resizeMode="contain"
        style={[StyleSheet.absoluteFillObject, imageStyle]}
      />
    </View>
  );
}
