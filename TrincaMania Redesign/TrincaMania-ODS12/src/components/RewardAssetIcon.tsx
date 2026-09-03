import {
  Image,
  ImageSourcePropType,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

export type RewardAssetName =
  'chestCommon' | 'chestWorld' | 'coin' | 'key' | 'life';

type RewardAssetIconProps = {
  muted?: boolean;
  name: RewardAssetName;
  size: number;
  style?: StyleProp<ViewStyle>;
};

const rewardAssets: Record<RewardAssetName, ImageSourcePropType> = {
  chestCommon:
    require('../../assets/ui/rewards/chest_common_closed.png') as ImageSourcePropType,
  chestWorld:
    require('../../assets/ui/rewards/chest_world_closed.png') as ImageSourcePropType,
  coin: require('../../assets/ui/rewards/reward_coin.png') as ImageSourcePropType,
  key: require('../../assets/ui/rewards/reward_key.png') as ImageSourcePropType,
  life: require('../../assets/ui/rewards/reward_life.png') as ImageSourcePropType,
};

export function RewardAssetIcon({
  muted = false,
  name,
  size,
  style,
}: RewardAssetIconProps) {
  return (
    <View
      pointerEvents="none"
      style={[styles.frame, { height: size, width: size }, style]}
    >
      <Image
        resizeMode="contain"
        source={rewardAssets[name]}
        style={[
          styles.image,
          {
            height: size,
            opacity: muted ? 0.7 : 1,
            width: Math.round(size * 1.5),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    flexShrink: 0,
  },
});
