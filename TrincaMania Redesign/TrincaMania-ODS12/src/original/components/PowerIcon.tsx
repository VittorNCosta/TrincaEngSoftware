import Svg, { Circle, Path } from '../../components/svgPrimitives';

import { PowerUpType } from '../../types/game';
import { ForestObjectIcon } from './ForestObjectIcon';

export type PowerIconName = PowerUpType | 'star';

type PowerIconProps = {
  name: PowerIconName;
  size?: number;
  fill?: string;
  outline?: string;
};

const CREAM = '#FFF7E8';
const STAR_PATH =
  'M32 8c0 13.3-10.7 24-24 24 13.3 0 24 10.7 24 24 0-13.3 10.7-24 24-24-13.3 0-24-10.7-24-24z';

/** Bold silhouettes and small painted highlights remain readable at HUD size. */
export function PowerIcon({
  name,
  size = 64,
  fill = CREAM,
  outline,
}: PowerIconProps) {
  if (name !== 'star') {
    return (
      <ForestObjectIcon name={name} size={size} muted={outline !== undefined} />
    );
  }
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
