import { memo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { RedesignedIcon } from './RedesignedIcon';

import { radii, shadows } from '../styles/theme';

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
  | 'music-on'
  | 'music-off'
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
    base: '#D9EEF5',
    border: '#F3FCFF',
    fill: '#F9FEFF',
    foot: '#6FA8BB',
    ink: '#18576B',
  },
  danger: {
    base: '#F8E1DD',
    border: '#FFF9F5',
    fill: '#FFFDFC',
    foot: '#D59890',
    ink: '#9B413E',
  },
  gold: {
    base: '#F6E6B3',
    border: '#FFFAE9',
    fill: '#FFFDF2',
    foot: '#C8A95A',
    ink: '#71551D',
  },
  green: {
    base: '#D7F0DF',
    border: '#F5FFF7',
    fill: '#FBFFFC',
    foot: '#80BB96',
    ink: '#216448',
  },
  neutral: {
    base: '#DCE5E7',
    border: '#F4F8F8',
    fill: '#FAFCFC',
    foot: '#9AAEB3',
    ink: '#405860',
  },
  pink: {
    base: '#F6E0E9',
    border: '#FFF7FB',
    fill: '#FFFDFE',
    foot: '#D4A3B7',
    ink: '#944763',
  },
  purple: {
    base: '#E5E0F4',
    border: '#FAF8FF',
    fill: '#FEFDFF',
    foot: '#A99CCB',
    ink: '#63528C',
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
  const toneStyle = isMuted ? TONE_STYLES.neutral : TONE_STYLES[tone];
  const borderWidth = Math.max(1, Math.round(size * 0.045));
  const footWidth = Math.max(2, Math.round(size * 0.07));

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
          family="UI_ODS"
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
      <RedesignedIcon family="UI_ODS" muted={isMuted} name={name} size={size} />
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
    ...shadows.menuCard,
  },
  active: {
    shadowOpacity: 0.28,
  },
  muted: {
    opacity: 0.86,
  },
  plain: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  soft: {
    opacity: 0.94,
  },
});
