import { Image } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { PowerUpType } from '../types/game';
export type PowerIconName = PowerUpType | 'star';
type PowerIconProps = {
  name: PowerIconName;
  size?: number;
  fill?: string;
  outline?: string;
};
// Artes do TrincaMania original, incluindo variantes nativas @2x e @3x.
const POWER_ASSETS = {
  hint: require('../../assets/ui/powers/hint.png'),
  shuffle: require('../../assets/ui/powers/shuffle.png'),
  undo: require('../../assets/ui/powers/undo.png'),
};
const CREAM = '#FFF7E8';
const STAR_PATH =
  'M32 8c0 13.3-10.7 24-24 24 13.3 0 24 10.7 24 24 0-13.3 10.7-24 24-24-13.3 0-24-10.7-24-24z';
export function PowerIcon({
  name,
  size = 64,
  fill = CREAM,
  outline,
}: PowerIconProps) {
  if (name !== 'star')
    return (
      <Image
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        fadeDuration={0}
        resizeMode="contain"
        source={POWER_ASSETS[name]}
        style={{
          height: size,
          width: size,
          opacity: outline === undefined ? 1 : 0.65,
        }}
      />
    );
  const ink = outline ?? '#80501C';
  return (
    <Svg height={size} viewBox="0 0 64 64" width={size}>
      <Path
        d={STAR_PATH}
        fill={ink}
        stroke={ink}
        strokeLinejoin="round"
        strokeWidth={7}
      />
      <Path d={STAR_PATH} fill={fill} />
      <Circle
        cx={46}
        cy={18}
        fill={outline ? fill : '#FFD35A'}
        r={4}
        stroke={ink}
        strokeWidth={3}
      />
    </Svg>
  );
}
