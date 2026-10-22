import {
  Image,
  View,
  ImageSourcePropType,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { ForestObjectIcon } from './ForestObjectIcon';

export type RewardAssetName =
  'chestCommon' | 'chestWorld' | 'coin' | 'key' | 'life';

type RewardAssetIconProps = {
  muted?: boolean;
  name: RewardAssetName;
  size: number;
  style?: StyleProp<ViewStyle>;
};

const rewardAssets: Record<
  Exclude<RewardAssetName, 'coin' | 'life'>,
  ImageSourcePropType
> = {
  chestCommon:
    require('../../../assets/original/ui/chests/common/opening/chest_open_01.png') as ImageSourcePropType,
  chestWorld:
    require('../../../assets/original/ui/rewards/optimized/chest_world_closed.png') as ImageSourcePropType,
  key: require('../../../assets/original/ui/rewards/optimized/reward_key.png') as ImageSourcePropType,
};

export function RewardAssetIcon({
  muted = false,
  name,
  size,
  style,
}: RewardAssetIconProps) {
  if (name === 'coin' || name === 'life') {
    return (
      <ForestObjectIcon name={name} size={size} muted={muted} style={style} />
    );
  }
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
