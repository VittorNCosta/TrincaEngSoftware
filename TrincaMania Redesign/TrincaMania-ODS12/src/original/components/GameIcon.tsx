import { View, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { memo } from 'react';
import { RedesignedIcon } from '../../components/RedesignedIcon';

import { colors, radii, shadows } from '../styles/theme';
import { ForestObjectIcon } from './ForestObjectIcon';

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
  | 'journal'
  | 'lock'
  | 'lose'
  | 'map'
  | 'mapMarker'
  | 'mission'
  | 'moon'
  | 'nav-map'
  | 'nav-powers'
  | 'nav-profile'
  | 'nav-rewards'
  | 'next'
  | 'pause'
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
  'blue' | 'danger' | 'gold' | 'green' | 'neutral' | 'pink' | 'purple';

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

const TONE_STYLES: Record<GameIconTone, ToneStyle> = {
  blue: {
    base: '#36AEFF',
    border: '#D8F1FF',
    fill: '#FFF8E8',
    foot: '#075894',
    ink: '#074D86',
  },
  danger: {
    base: '#F05278',
    border: '#FFD1DC',
    fill: '#FFF8E8',
    foot: '#9B1737',
    ink: '#8F1532',
  },
  gold: {
    base: '#FFD23F',
    border: '#FFF8D8',
    fill: '#FFFDF2',
    foot: colors.goldDark,
    ink: '#7A4A0C',
  },
  green: {
    base: '#34D99A',
    border: '#D4FFE9',
    fill: '#FFF8E8',
    foot: colors.successDark,
    ink: '#086244',
  },
  neutral: {
    base: '#303B60',
    border: '#7482AA',
    fill: '#E7EEFF',
    foot: '#11182E',
    ink: '#16203F',
  },
  pink: {
    base: '#FF79B3',
    border: '#FFE0EF',
    fill: '#FFF8E8',
    foot: '#A92764',
    ink: '#8F1851',
  },
  purple: {
    base: '#7E5BFF',
    border: '#E5DFFF',
    fill: '#FFF8E8',
    foot: '#2C0E56',
    ink: '#382075',
  },
};

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
  const isMuted =
    muted || disabled || variant === 'disabled' || active === false;
  if (name === 'coin' || name === 'heart') {
    return (
      <ForestObjectIcon
        name={name === 'heart' ? 'life' : 'coin'}
        size={size}
        muted={isMuted}
        style={style}
      />
    );
  }
  const toneStyle = isMuted ? TONE_STYLES.neutral : TONE_STYLES[tone];
  const borderWidth = Math.max(2, Math.round(size * 0.09));
  const footWidth = Math.max(3, Math.round(size * 0.14));

  if (variant === 'plain') {
    return (
      <View
        pointerEvents="none"
        style={[
          styles.plain,
          { height: size, width: size },
          isMuted ? styles.muted : null,
          style,
        ]}
      >
        <RedesignedIcon
          family="UI_ORIGINAL_ADAPTADA"
          muted={isMuted}
          name={name}
          size={size}
        />
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
      <RedesignedIcon
        family="UI_ORIGINAL_ADAPTADA"
        muted={isMuted}
        name={name}
        size={size}
      />
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
