import Svg, { Circle, Path } from 'react-native-svg';

import { PowerUpType } from '../types/game';

export type PowerIconName = PowerUpType | 'star';

type PowerIconProps = {
  name: PowerIconName;
  size?: number;
  fill?: string;
  outline?: string;
};

const OUTLINE_BY_NAME: Record<PowerIconName, string> = {
  hint: '#0B4A8C',
  shuffle: '#6B1866',
  undo: '#17580A',
  star: '#8A5A0C',
};

const CREAM = '#FFF7E8';
const GOLD = '#FFD35A';

const HINT_SPARK = 'M51 8c0 4.4-3.6 8-8 8 4.4 0 8 3.6 8 8 0-4.4 3.6-8 8-8-4.4 0-8-3.6-8-8z';
const SHUFFLE_DOWN_CURVE = 'M12 20C26 20 32 44 46 44';
const SHUFFLE_UP_CURVE = 'M12 44C26 44 32 20 46 20';
const SHUFFLE_DOWN_HEAD = 'M43 34 L56 44 L43 54 Z';
const SHUFFLE_UP_HEAD = 'M43 10 L56 20 L43 30 Z';
const UNDO_HEAD = 'M40 35 L50 22 L60 35 Z';
const STAR_PATH = 'M32 8c0 13.3-10.7 24-24 24 13.3 0 24 10.7 24 24 0-13.3 10.7-24 24-24-13.3 0-24-10.7-24-24z';

export function PowerIcon({ name, size = 64, fill = CREAM, outline }: PowerIconProps) {
  const ink = outline ?? OUTLINE_BY_NAME[name];

  return (
    <Svg height={size} viewBox="0 0 64 64" width={size}>
      {name === 'hint' ? (
        <>
          <Path d={HINT_SPARK} fill={ink} stroke={ink} strokeLinejoin="round" strokeWidth={5} />
          <Path d={HINT_SPARK} fill={GOLD} />
          <Circle cx={24} cy={38} fill={ink} r={12} />
          <Circle cx={40} cy={38} fill={ink} r={12} />
          <Circle cx={32} cy={22} fill={ink} r={12} />
          <Circle cx={24} cy={38} fill={fill} r={8} />
          <Circle cx={40} cy={38} fill={fill} r={8} />
          <Circle cx={32} cy={22} fill={fill} r={8} />
          <Circle cx={32} cy={22} fill={GOLD} r={4} />
          <Path d="M20 18c3-5 8-8 14-8" fill="none" stroke={ink} strokeLinecap="round" strokeWidth={4} />
          <Path d="M21 18c3-4 7-6 12-6" fill="none" stroke="#FFFFFF" strokeLinecap="round" strokeWidth={2.4} />
        </>
      ) : null}

      {name === 'shuffle' ? (
        <>
          <Path d={SHUFFLE_DOWN_CURVE} fill="none" stroke={ink} strokeLinecap="round" strokeWidth={17} />
          <Path d={SHUFFLE_DOWN_HEAD} fill={ink} stroke={ink} strokeLinejoin="round" strokeWidth={7} />
          <Path d={SHUFFLE_DOWN_CURVE} fill="none" stroke={fill} strokeLinecap="round" strokeWidth={10} />
          <Path d={SHUFFLE_DOWN_HEAD} fill={fill} />
          <Path d={SHUFFLE_UP_CURVE} fill="none" stroke={ink} strokeLinecap="round" strokeWidth={17} />
          <Path d={SHUFFLE_UP_HEAD} fill={ink} stroke={ink} strokeLinejoin="round" strokeWidth={7} />
          <Path d={SHUFFLE_UP_CURVE} fill="none" stroke={fill} strokeLinecap="round" strokeWidth={10} />
          <Path d={SHUFFLE_UP_HEAD} fill={fill} />
        </>
      ) : null}

      {name === 'undo' ? (
        <>
          <Circle cx={32} cy={32} fill="none" r={18} stroke={ink} strokeDasharray="78.5 34.6" strokeWidth={17} />
          <Path d={UNDO_HEAD} fill={ink} stroke={ink} strokeLinejoin="round" strokeWidth={7} />
          <Circle cx={32} cy={32} fill="none" r={18} stroke={fill} strokeDasharray="78.5 34.6" strokeWidth={10} />
          <Path d={UNDO_HEAD} fill={fill} />
        </>
      ) : null}

      {name === 'star' ? (
        <>
          <Path d={STAR_PATH} fill={ink} stroke={ink} strokeLinejoin="round" strokeWidth={7} />
          <Path d={STAR_PATH} fill={fill} />
          <Circle cx={46} cy={18} fill={GOLD} r={4} stroke={ink} strokeWidth={3} />
        </>
      ) : null}
    </Svg>
  );
}
