import { Image } from 'react-native';
import { RedesignedIcon } from './RedesignedIcon';
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
export function PowerIcon({ name, size = 64, fill, outline }: PowerIconProps) {
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
  return (
    <RedesignedIcon
      family="PODERES"
      name="estrela-poder"
      size={size}
      fill={fill}
      outline={outline}
    />
  );
}
