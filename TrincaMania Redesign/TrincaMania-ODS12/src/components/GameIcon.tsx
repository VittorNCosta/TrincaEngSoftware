import { memo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { colors, radii, shadows } from '../styles/theme';

export type GameIconName =
  | 'avatar'
  | 'back'
  | 'bonus'
  | 'calendar'
  | 'cart'
  | 'check'
  | 'chest'
  | 'close'
  | 'coin'
  | 'event'
  | 'gift'
  | 'heart'
  | 'hint'
  | 'home'
  | 'info'
  | 'key'
  | 'lock'
  | 'lose'
  | 'map'
  | 'mapMarker'
  | 'moon'
  | 'nav-map'
  | 'nav-powers'
  | 'nav-profile'
  | 'nav-rewards'
  | 'next'
  | 'play'
  | 'powers'
  | 'profile'
  | 'ranking'
  | 'restart'
  | 'reset'
  | 'settings'
  | 'shuffle'
  | 'silent'
  | 'shop'
  | 'soundOff'
  | 'soundOn'
  | 'sound-off'
  | 'sound-on'
  | 'specialChest'
  | 'star'
  | 'target'
  | 'tray'
  | 'undo'
  | 'vibrationOff'
  | 'vibrationOn'
  | 'vibration-off'
  | 'vibration-on'
  | 'win'
  | 'world';

export type GameIconTone =
  | 'blue'
  | 'danger'
  | 'gold'
  | 'green'
  | 'neutral'
  | 'pink'
  | 'purple';

type GameIconProps = {
  active?: boolean;
  disabled?: boolean;
  muted?: boolean;
  name: GameIconName;
  size?: number;
  style?: StyleProp<ViewStyle>;
  tone?: GameIconTone;
  variant?: 'active' | 'badge' | 'disabled' | 'plain' | 'soft';
};

type ToneStyle = {
  base: string;
  border: string;
  fill: string;
  foot: string;
  ink: string;
};

type IconArtworkProps = {
  fill: string;
  ink: string;
  muted: boolean;
  name: GameIconName;
  size: number;
};

const TONE_STYLES: Record<GameIconTone, ToneStyle> = {
  blue: { base: '#36AEFF', border: '#D8F1FF', fill: '#FFF8E8', foot: '#075894', ink: '#074D86' },
  danger: { base: '#F05278', border: '#FFD1DC', fill: '#FFF8E8', foot: '#9B1737', ink: '#8F1532' },
  gold: { base: '#FFD23F', border: '#FFF8D8', fill: '#FFFDF2', foot: colors.goldDark, ink: '#7A4A0C' },
  green: { base: '#34D99A', border: '#D4FFE9', fill: '#FFF8E8', foot: colors.successDark, ink: '#086244' },
  neutral: { base: '#303B60', border: '#7482AA', fill: '#E7EEFF', foot: '#11182E', ink: '#16203F' },
  pink: { base: '#FF79B3', border: '#FFE0EF', fill: '#FFF8E8', foot: '#A92764', ink: '#8F1851' },
  purple: { base: '#7E5BFF', border: '#E5DFFF', fill: '#FFF8E8', foot: '#2C0E56', ink: '#382075' },
};

const normalizeIconName = (name: GameIconName): GameIconName => {
  switch (name) {
    case 'calendar':
      return 'event';
    case 'gift':
    case 'specialChest':
      return 'chest';
    case 'hint':
    case 'shuffle':
    case 'undo':
      return 'powers';
    case 'mapMarker':
    case 'world':
      return 'map';
    case 'restart':
      return 'reset';
    case 'silent':
      return 'moon';
    case 'soundOff':
      return 'sound-off';
    case 'soundOn':
      return 'sound-on';
    case 'vibrationOff':
      return 'vibration-off';
    case 'vibrationOn':
      return 'vibration-on';
    default:
      return name;
  }
};

// Ícones ilustrados que trazem paleta e sombra próprias: ignoram `tone` e não
// recebem a elipse de sombra padrão do IconArtwork.
const SELF_PAINTED_NAMES: GameIconName[] = [
  'avatar',
  'nav-map',
  'nav-powers',
  'nav-profile',
  'nav-rewards',
];

const isSelfPaintedIcon = (name: GameIconName) => SELF_PAINTED_NAMES.includes(name);

const NAV_SPARK_PATH =
  'M32 6c0 12.4-10.1 22.5-22.5 22.5C21.9 28.5 32 38.6 32 51c0-12.4 10.1-22.5 22.5-22.5C42.1 28.5 32 18.4 32 6z';

function NavShadow() {
  return <Ellipse cx={32} cy={55} fill="rgba(20, 10, 4, 0.22)" rx={21} ry={4.5} />;
}

const STAR_PATH = 'M32 8l6.7 14.2 15.3 2.2-11.1 10.8 2.6 15.2L32 43.2 18.5 50.4l2.6-15.2L10 24.4l15.3-2.2L32 8z';
const SPARK_PATH = 'M32 7c0 13.8-11.2 25-25 25 13.8 0 25 11.2 25 25 0-13.8 11.2-25 25-25-13.8 0-25-11.2-25-25z';
const HEART_PATH = 'M32 53C19 42.4 10 34.2 10 23.7 10 16.2 15.8 11 22.7 11c4 0 7.5 1.9 9.3 5 1.8-3.1 5.3-5 9.3-5C48.2 11 54 16.2 54 23.7 54 34.2 45 42.4 32 53z';
const PLAY_PATH = 'M23 14l28 18-28 18z';
const CHEVRON_BACK = 'M39 14 21 32l18 18';
const CHEVRON_NEXT = 'M25 14l18 18-18 18';
const CHECK_PATH = 'M16 33l10 10 22-24';
const CLOSE_A = 'M19 19l26 26';
const CLOSE_B = 'M45 19 19 45';
const RESET_CURVE = 'M46 24a17 17 0 1 0 2 17';
const RESET_HEAD = 'M43 11l12 11-15 4z';

function FillPath({ d, fill, ink }: { d: string; fill: string; ink: string }) {
  return (
    <>
      <Path d={d} fill={ink} stroke={ink} strokeLinejoin="round" strokeWidth={6} />
      <Path d={d} fill={fill} />
    </>
  );
}

function StrokePath({
  d,
  fill,
  ink,
  width = 8,
}: {
  d: string;
  fill: string;
  ink: string;
  width?: number;
}) {
  return (
    <>
      <Path d={d} fill="none" stroke={ink} strokeLinecap="round" strokeLinejoin="round" strokeWidth={width + 7} />
      <Path d={d} fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={width} />
    </>
  );
}

function IconArtwork({ fill, ink, muted, name: rawName, size }: IconArtworkProps) {
  const name = normalizeIconName(rawName);
  // Os ilustrados ocupam a caixa inteira: já foram desenhados com respiro interno.
  const sizeRatio = isSelfPaintedIcon(name)
    ? 1
    : name === 'settings' || name === 'ranking'
      ? 0.82
      : 0.76;
  const iconSize = Math.round(size * sizeRatio);
  const softFill = muted ? '#D8E3FF' : fill;
  const accent = muted ? '#97A4C6' : '#FFFFFF';
  const shadow = muted ? 'rgba(4, 10, 24, 0.25)' : 'rgba(71, 34, 8, 0.2)';
  const coinInk = muted ? ink : '#8A5200';
  const coinOuter = muted ? softFill : '#FFE27A';
  const coinInner = muted ? '#C9D5F2' : '#FFC83D';
  const coinShine = muted ? 'rgba(255, 255, 255, 0.42)' : '#FFF8C9';
  const coinShade = muted ? '#97A4C6' : '#D98C05';

  return (
    <Svg height={iconSize} viewBox="0 0 64 64" width={iconSize}>
      {isSelfPaintedIcon(name) ? null : (
        <Ellipse cx={32} cy={54} fill={shadow} rx={20} ry={5} />
      )}

      {name === 'back' ? <StrokePath d={CHEVRON_BACK} fill={softFill} ink={ink} width={9} /> : null}
      {name === 'next' ? <StrokePath d={CHEVRON_NEXT} fill={softFill} ink={ink} width={9} /> : null}
      {name === 'check' ? <StrokePath d={CHECK_PATH} fill={softFill} ink={ink} width={9} /> : null}
      {name === 'close' ? (
        <>
          <StrokePath d={CLOSE_A} fill={softFill} ink={ink} width={8} />
          <StrokePath d={CLOSE_B} fill={softFill} ink={ink} width={8} />
        </>
      ) : null}
      {name === 'play' ? <FillPath d={PLAY_PATH} fill={softFill} ink={ink} /> : null}

      {name === 'star' || name === 'win' || name === 'ranking' ? (
        <>
          <FillPath d={STAR_PATH} fill={softFill} ink={ink} />
          {name === 'ranking' ? (
            <Path d="M19 50h26v7H19z" fill={ink} opacity={0.28} />
          ) : null}
        </>
      ) : null}

      {name === 'bonus' || name === 'powers' ? (
        <>
          <FillPath d={SPARK_PATH} fill={softFill} ink={ink} />
          <Circle cx={48} cy={15} fill={accent} r={4} stroke={ink} strokeWidth={3} />
        </>
      ) : null}

      {name === 'heart' ? <FillPath d={HEART_PATH} fill={softFill} ink={ink} /> : null}

      {name === 'home' ? (
        <>
          <FillPath d="M11 31 32 13l21 18-6 7-4-3v18H21V35l-4 3z" fill={softFill} ink={ink} />
          <Rect fill={ink} height={13} rx={3} width={9} x={28} y={40} />
        </>
      ) : null}

      {name === 'shop' ? (
        <>
          <Path d="M13 28h38v25H13z" fill={ink} stroke={ink} strokeLinejoin="round" strokeWidth={6} />
          <Rect fill={softFill} height={25} rx={4} width={38} x={13} y={28} />
          <Path d="M15 13h34l6 17H9z" fill={ink} stroke={ink} strokeLinejoin="round" strokeWidth={6} />
          <Path d="M15 13h34l6 17H9z" fill={softFill} />
          <Path d="M21 13 18 30M32 13v17M43 13l3 17" stroke={ink} strokeLinecap="round" strokeWidth={4} />
          <Rect fill={ink} height={16} rx={2} width={9} x={28} y={37} />
        </>
      ) : null}

      {name === 'chest' ? (
        <>
          <Path d="M12 25h40v26H12z" fill={ink} stroke={ink} strokeLinejoin="round" strokeWidth={6} />
          <Rect fill={softFill} height={26} rx={4} width={40} x={12} y={25} />
          <Path d="M15 25c2-8 8-12 17-12s15 4 17 12z" fill={ink} stroke={ink} strokeLinejoin="round" strokeWidth={6} />
          <Path d="M15 25c2-8 8-12 17-12s15 4 17 12z" fill={softFill} />
          <Path d="M12 36h40" stroke={ink} strokeLinecap="round" strokeWidth={5} />
          <Rect fill="#FFD35A" height={12} rx={3} stroke={ink} strokeWidth={4} width={12} x={26} y={31} />
        </>
      ) : null}

      {name === 'coin' ? (
        <>
          <Circle cx={32} cy={34} fill={coinInk} opacity={0.22} r={22} />
          <Circle cx={32} cy={31} fill={coinOuter} r={22} stroke={coinInk} strokeWidth={5} />
          <Circle cx={32} cy={31} fill={coinInner} r={15} opacity={0.9} />
          <Path
            d="M17 31c2-9 8-15 17-16 6-.6 12 1.4 16 5-5-1-10-.8-15 .8-8.7 2.8-14.2 8.2-18 16.2z"
            fill={coinShine}
            opacity={0.86}
          />
          <Path
            d="M32 20l3.5 7.1 7.9 1.1-5.7 5.5 1.3 7.8-7-3.7-7 3.7 1.3-7.8-5.7-5.5 7.9-1.1z"
            fill={coinShine}
            stroke={coinInk}
            strokeLinejoin="round"
            strokeWidth={3}
          />
          <Path d="M20 44c7 5 17 6 25 1" fill="none" stroke={coinShade} strokeLinecap="round" strokeWidth={4} />
        </>
      ) : null}

      {name === 'key' ? (
        <>
          <Circle cx={23} cy={29} fill={softFill} r={10} stroke={ink} strokeWidth={7} />
          <Path d="M32 33h20v8h-6v6h-7v-6h-7z" fill={softFill} stroke={ink} strokeLinejoin="round" strokeWidth={6} />
          <Circle cx={23} cy={29} fill={ink} r={3} />
        </>
      ) : null}

      {name === 'lock' ? (
        <>
          {/* Arco primeiro, para o corpo do cadeado cobrir a base dele. */}
          <StrokePath d="M22 30v-7a10 10 0 0 1 20 0v7" fill={softFill} ink={ink} width={7} />
          <Rect fill={ink} height={26} rx={7} stroke={ink} strokeWidth={6} width={40} x={12} y={28} />
          <Rect fill={softFill} height={26} rx={7} width={40} x={12} y={28} />
          <Circle cx={32} cy={38} fill={ink} r={4.4} />
          <Path d="M29.7 40.4h4.6l1.5 7.6h-7.6z" fill={ink} />
        </>
      ) : null}

      {name === 'map' ? (
        <>
          <Path d="M10 18l14-5 16 6 14-5v33l-14 5-16-6-14 5z" fill={ink} stroke={ink} strokeLinejoin="round" strokeWidth={6} />
          <Path d="M10 18l14-5 16 6 14-5v33l-14 5-16-6-14 5z" fill={softFill} />
          <Path d="M24 13v33M40 19v33" stroke={ink} strokeLinecap="round" strokeWidth={4} />
          <Path d="M33 25c0-5 4-9 9-9s9 4 9 9c0 7-9 15-9 15s-9-8-9-15z" fill="#FF6D9E" stroke={ink} strokeWidth={4} />
          <Circle cx={42} cy={25} fill={softFill} r={3} />
        </>
      ) : null}

      {name === 'settings' ? (
        <>
          {/* Seis dentes grossos: a versão de oito dentes finos virava borrão em 28-30 px. */}
          <G origin="32,32">
            {Array.from({ length: 6 }).map((_, index) => (
              <Rect
                fill={ink}
                height={17}
                key={`gear-${index}`}
                rx={4}
                transform={`rotate(${index * 60} 32 32)`}
                width={12}
                x={26}
                y={3}
              />
            ))}
          </G>
          <Circle cx={32} cy={32} fill={ink} r={19} />
          <Circle cx={32} cy={32} fill={softFill} r={14.5} />
          <Circle cx={32} cy={32} fill={ink} r={5.6} />
          <Path
            d="M23 26c2.2-3 5-4.6 8.6-4.8"
            fill="none"
            opacity={0.85}
            stroke={accent}
            strokeLinecap="round"
            strokeWidth={3}
          />
        </>
      ) : null}

      {name === 'cart' ? (
        <>
          <Path
            d="M7 14h8l4.4 12"
            fill="none"
            stroke={ink}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={12}
          />
          <Path
            d="M7 14h8l4.4 12"
            fill="none"
            stroke={softFill}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={5}
          />
          <Path d="M17 26h38l-6 19H23z" fill={ink} stroke={ink} strokeLinejoin="round" strokeWidth={6} />
          <Path d="M17 26h38l-6 19H23z" fill={softFill} />
          <Path d="M24 30l1.6 11M32 30v11M40 30l-1.6 11" stroke={ink} strokeLinecap="round" strokeWidth={3.4} />
          <Circle cx={26} cy={52} fill={softFill} r={5} stroke={ink} strokeWidth={4} />
          <Circle cx={45} cy={52} fill={softFill} r={5} stroke={ink} strokeWidth={4} />
        </>
      ) : null}

      {name === 'avatar' ? (
        <>
          <Circle cx={32} cy={32} fill="#0B3F6B" r={26} />
          <Circle cx={32} cy={32} fill="#59C2FF" r={23} />
          <Path d="M10 54c3.4-11.6 11-17.4 22-17.4S51 42.4 54 54z" fill="#0B3F6B" />
          <Path d="M14 54c3-9 9.4-13.6 18-13.6S47 45 50 54z" fill="#2FA36B" />
          <Circle cx={32} cy={25} fill="#0B3F6B" r={15.6} />
          <Circle cx={32} cy={25} fill="#F8CDA1" r={12.6} />
          <Path
            d="M19.6 21.2C21 12 26 8 32 8s11 4 12.4 13.2c-3.4-4-7.6-6-12.4-6s-9 2-12.4 6z"
            fill="#8A5A24"
          />
          <Path d="M23.4 13.6C25.8 11 28.8 9.8 32 9.8" fill="none" stroke="#C08A3E" strokeLinecap="round" strokeWidth={3} />
          <Circle cx={26.8} cy={25.6} fill="#2C1B08" r={2.8} />
          <Circle cx={37.2} cy={25.6} fill="#2C1B08" r={2.8} />
          <Circle cx={27.8} cy={24.6} fill="#FFFFFF" r={1} />
          <Circle cx={38.2} cy={24.6} fill="#FFFFFF" r={1} />
          <Path d="M27.6 32.6c2.6 2.4 6.2 2.4 8.8 0" fill="none" stroke="#C4744A" strokeLinecap="round" strokeWidth={2.8} />
        </>
      ) : null}

      {name === 'nav-map' ? (
        <>
          <NavShadow />
          <Path
            d="M8 18 24 12l16 6 16-6v30l-16 6-16-6-16 6z"
            fill="#3D2A12"
            stroke="#3D2A12"
            strokeLinejoin="round"
            strokeWidth={6}
          />
          <Path d="M8 18 24 12l16 6 16-6v30l-16 6-16-6-16 6z" fill="#FFF3D0" />
          <Path d="M24 12v36M40 18v36" stroke="#3D2A12" strokeLinecap="round" strokeWidth={3.6} />
          <Path
            d="M15 45c8-6 4-13 12-19 5-3.6 12-1 16-6"
            fill="none"
            stroke="#3D2A12"
            strokeLinecap="round"
            strokeWidth={7.5}
          />
          <Path
            d="M15 45c8-6 4-13 12-19 5-3.6 12-1 16-6"
            fill="none"
            stroke="#E8A72E"
            strokeLinecap="round"
            strokeWidth={4}
          />
          <Path
            d="M42 36c-4-6.5-6-9.6-6-12.6a6 6 0 0 1 12 0c0 3-2 6.1-6 12.6z"
            fill="#F1497F"
            stroke="#3D2A12"
            strokeLinejoin="round"
            strokeWidth={4}
          />
          <Circle cx={42} cy={23} fill="#FFF3D0" r={2.6} />
        </>
      ) : null}

      {name === 'nav-rewards' ? (
        <>
          <NavShadow />
          <Circle cx={13} cy={47} fill="#8A5200" r={7.4} />
          <Circle cx={51} cy={47} fill="#8A5200" r={7.4} />
          <Circle cx={13} cy={46} fill="#FFC83D" r={5.6} />
          <Circle cx={51} cy={46} fill="#FFC83D" r={5.6} />
          <Circle cx={11.4} cy={44} fill="#FFF8C9" r={1.8} />
          <Circle cx={49.4} cy={44} fill="#FFF8C9" r={1.8} />
          <Path d="M12 29h40v22H12z" fill="#4A2A0C" stroke="#4A2A0C" strokeLinejoin="round" strokeWidth={5} />
          <Rect fill="#D98A34" height={22} rx={3} width={40} x={12} y={29} />
          <Path d="M12 29c2-9 8-14 20-14s18 5 20 14z" fill="#4A2A0C" stroke="#4A2A0C" strokeLinejoin="round" strokeWidth={5} />
          <Path d="M12 29c2-9 8-14 20-14s18 5 20 14z" fill="#F0A94E" />
          <Path d="M17 25c2.4-4.6 7-7 13-7" fill="none" stroke="#FFE3B0" strokeLinecap="round" strokeWidth={3.4} />
          <Path d="M12 40h40" stroke="#8C4E12" strokeLinecap="round" strokeWidth={3} />
          <Rect fill="#FFD35A" height={36} stroke="#4A2A0C" strokeWidth={3.4} width={11} x={26.5} y={15} />
          <Rect fill="#FFF8C9" height={11} rx={2.4} stroke="#4A2A0C" strokeWidth={3.2} width={13} x={25.5} y={31} />
          <Circle cx={32} cy={36.4} fill="#4A2A0C" r={2} />
          <Path
            d="M32 9.5c0 3.4-2.7 6.1-6.1 6.1 3.4 0 6.1 2.7 6.1 6.1 0-3.4 2.7-6.1 6.1-6.1-3.4 0-6.1-2.7-6.1-6.1z"
            fill="#FFF8C9"
          />
        </>
      ) : null}

      {name === 'nav-powers' ? (
        <>
          <NavShadow />
          <Circle cx={17} cy={41} fill="#2C0E56" r={10.5} />
          <Circle cx={47} cy={41} fill="#086244" r={10.5} />
          <Circle cx={17} cy={40} fill="#7E5BFF" r={8} />
          <Circle cx={47} cy={40} fill="#34D99A" r={8} />
          <Circle cx={14.6} cy={37} fill="#FFFFFF" opacity={0.7} r={2.4} />
          <Circle cx={44.6} cy={37} fill="#FFFFFF" opacity={0.7} r={2.4} />
          <Path d={NAV_SPARK_PATH} fill="#6B3F00" stroke="#6B3F00" strokeLinejoin="round" strokeWidth={5} />
          <Path d={NAV_SPARK_PATH} fill="#FFD35A" />
          <Path
            d="M32 15c0 6-3.6 11-9 13.4 5.4 1 9 5 9 9.6"
            fill="none"
            stroke="#FFF8C9"
            strokeLinecap="round"
            strokeWidth={3}
          />
        </>
      ) : null}

      {name === 'nav-profile' ? (
        <>
          <NavShadow />
          <Circle cx={32} cy={31} fill="#0B3F6B" r={20} />
          <Circle cx={32} cy={30} fill="#36AEFF" r={17} />
          <Path d="M18 45c2.6-8 7.4-12 14-12s11.4 4 14 12z" fill="#0B3F6B" />
          <Path d="M20 45c2.4-6.6 6.6-10 12-10s9.6 3.4 12 10z" fill="#FFF3D0" />
          <Circle cx={32} cy={24} fill="#0B3F6B" r={9.4} />
          <Circle cx={32} cy={24} fill="#FFF3D0" r={7} />
          <Path d="M22 20c1.6-5 5-7.6 10-7.6" fill="none" stroke="#BFE6FF" strokeLinecap="round" strokeWidth={3} />
          <Circle cx={48} cy={46} fill="#6B3F00" r={8.6} />
          <Circle cx={48} cy={45.4} fill="#FFD35A" r={6.4} />
          <Path d="M48 41.4l1.5 3.1 3.4.5-2.5 2.4.6 3.4-3-1.6-3 1.6.6-3.4-2.5-2.4 3.4-.5z" fill="#FFF8C9" />
        </>
      ) : null}

      {name === 'profile' ? (
        <>
          <Circle cx={32} cy={22} fill={softFill} r={12} stroke={ink} strokeWidth={7} />
          <Path d="M13 53c2-13 11-20 19-20s17 7 19 20z" fill={softFill} stroke={ink} strokeLinejoin="round" strokeWidth={7} />
        </>
      ) : null}

      {name === 'event' ? (
        <>
          <Rect fill={softFill} height={38} rx={8} stroke={ink} strokeWidth={7} width={40} x={12} y={15} />
          <Path d="M12 27h40" stroke={ink} strokeLinecap="round" strokeWidth={6} />
          <Path d="M23 10v12M41 10v12" stroke={ink} strokeLinecap="round" strokeWidth={6} />
          <FillPath d="M32 32l3.2 6.1 6.8 1-5 4.7 1.2 6.7-6.2-3.2-6.2 3.2 1.2-6.7-5-4.7 6.8-1z" fill="#FFD35A" ink={ink} />
        </>
      ) : null}

      {name === 'tray' ? (
        <>
          <Path d="M10 27h44l-5 23H15z" fill={softFill} stroke={ink} strokeLinejoin="round" strokeWidth={7} />
          <Path d="M17 20h30" stroke={ink} strokeLinecap="round" strokeWidth={8} />
          {[19, 32, 45].map((x) => (
            <Circle cx={x} cy={36} fill="#FFD35A" key={`tray-dot-${x}`} r={4} stroke={ink} strokeWidth={3} />
          ))}
        </>
      ) : null}

      {name === 'target' || name === 'info' ? (
        <>
          <Circle cx={32} cy={32} fill={softFill} r={20} stroke={ink} strokeWidth={7} />
          <Circle cx={32} cy={32} fill="none" r={10} stroke={ink} strokeWidth={5} />
          {name === 'target' ? <Circle cx={32} cy={32} fill={ink} r={4} /> : null}
          {name === 'info' ? (
            <>
              <Circle cx={32} cy={22} fill={ink} r={4} />
              <Path d="M32 31v15" stroke={ink} strokeLinecap="round" strokeWidth={7} />
            </>
          ) : null}
        </>
      ) : null}

      {name === 'moon' ? (
        <FillPath d="M43 10c-10 2-18 11-18 22s8 20 18 22c-4 3-9 5-15 5C14 59 5 48 5 34S16 9 30 9c5 0 9 1 13 1z" fill={softFill} ink={ink} />
      ) : null}

      {name === 'sound-on' || name === 'sound-off' ? (
        <>
          <Path d="M12 26h10l14-11v34L22 38H12z" fill={softFill} stroke={ink} strokeLinejoin="round" strokeWidth={7} />
          {name === 'sound-on' ? (
            <>
              <Path d="M43 24c4 5 4 11 0 16" fill="none" stroke={ink} strokeLinecap="round" strokeWidth={6} />
              <Path d="M50 18c8 9 8 19 0 28" fill="none" stroke={ink} strokeLinecap="round" strokeWidth={5} />
            </>
          ) : (
            <>
              <StrokePath d="M43 24l12 16" fill={softFill} ink={ink} width={6} />
              <StrokePath d="M55 24 43 40" fill={softFill} ink={ink} width={6} />
            </>
          )}
        </>
      ) : null}

      {name === 'vibration-on' || name === 'vibration-off' ? (
        <>
          <Rect fill={softFill} height={36} rx={7} stroke={ink} strokeWidth={7} width={24} x={20} y={14} />
          <Path d="M12 23c-4 6-4 12 0 18M52 23c4 6 4 12 0 18" fill="none" stroke={ink} strokeLinecap="round" strokeWidth={5} />
          {name === 'vibration-off' ? <StrokePath d="M16 50 50 14" fill={softFill} ink={ink} width={6} /> : null}
        </>
      ) : null}

      {name === 'reset' ? (
        <>
          <StrokePath d={RESET_CURVE} fill={softFill} ink={ink} width={7} />
          <FillPath d={RESET_HEAD} fill={softFill} ink={ink} />
        </>
      ) : null}

      {name === 'lose' ? (
        <>
          <Circle cx={32} cy={32} fill={softFill} r={20} stroke={ink} strokeWidth={7} />
          <Circle cx={24} cy={27} fill={ink} r={3} />
          <Circle cx={40} cy={27} fill={ink} r={3} />
          <Path d="M23 44c5-6 13-6 18 0" fill="none" stroke={ink} strokeLinecap="round" strokeWidth={5} />
        </>
      ) : null}
    </Svg>
  );
}

function GameIconBase({
  active,
  disabled = false,
  muted = false,
  name,
  size = 34,
  style,
  tone = 'gold',
  variant = 'badge',
}: GameIconProps) {
  const isMuted = muted || disabled || variant === 'disabled' || active === false;
  const toneStyle = isMuted ? TONE_STYLES.neutral : TONE_STYLES[tone];
  const borderWidth = Math.max(2, Math.round(size * 0.09));
  const footWidth = Math.max(3, Math.round(size * 0.14));

  if (variant === 'plain') {
    return (
      <View
        pointerEvents="none"
        style={[styles.plain, { height: size, width: size }, isMuted ? styles.muted : null, style]}
      >
        <IconArtwork fill={toneStyle.fill} ink={toneStyle.ink} muted={isMuted} name={name} size={size} />
      </View>
    );
  }

  return (
    <View
      pointerEvents="none"
      style={[
        styles.bubble,
        {
          backgroundColor: toneStyle.base,
          borderBottomColor: toneStyle.foot,
          borderBottomWidth: footWidth,
          borderColor: toneStyle.border,
          borderWidth,
          height: size,
          width: size,
        },
        variant === 'soft' ? styles.soft : null,
        variant === 'active' || active ? styles.active : null,
        isMuted ? styles.muted : null,
        style,
      ]}
    >
      <View pointerEvents="none" style={styles.innerGlow} />
      <View
        pointerEvents="none"
        style={[
          styles.shine,
          {
            height: Math.max(5, Math.round(size * 0.2)),
            left: Math.round(size * 0.14),
            right: Math.round(size * 0.34),
            top: Math.round(size * 0.08),
          },
        ]}
      />
      <IconArtwork fill={toneStyle.fill} ink={toneStyle.ink} muted={isMuted} name={name} size={size} />
    </View>
  );
}

export const GameIcon = memo(GameIconBase);

const styles = StyleSheet.create({
  bubble: {
    alignItems: 'center',
    borderRadius: radii.pill,
    justifyContent: 'center',
    overflow: 'hidden',
    ...shadows.button,
  },
  active: {
    shadowOpacity: 0.42,
  },
  innerGlow: {
    backgroundColor: 'rgba(255, 255, 255, 0.13)',
    borderRadius: radii.pill,
    bottom: 4,
    left: 4,
    position: 'absolute',
    right: 4,
    top: 4,
  },
  muted: {
    opacity: 0.86,
  },
  plain: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shine: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: radii.pill,
    position: 'absolute',
  },
  soft: {
    opacity: 0.94,
  },
});
