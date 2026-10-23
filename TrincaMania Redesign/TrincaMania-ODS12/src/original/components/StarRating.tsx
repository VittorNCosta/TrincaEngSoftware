import { View, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { msg } from '../messages';
import { memo } from 'react';
import Svg, { Path } from 'react-native-svg';

import { colors } from '../styles/theme';

type RatingStarProps = {
  earned: boolean;
  glow?: boolean;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

type StarRatingProps = {
  earnedStars: number;
  gap?: number;
  glowWhenPerfect?: boolean;
  inactiveSize?: number;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export const RATING_STAR_COLORS = {
  earned: { fill: colors.gold, outline: colors.goldDark, shine: '#FFF7C7' },
  inactive: { fill: '#B8C2C6', outline: '#66747B', shine: '#E3E8EA' },
} as const;

export const RATING_STAR_PATH =
  'M32 7.5l7.2 14.6 16.1 2.3-11.7 11.4 2.8 16.1L32 44.3 17.6 51.9l2.8-16.1L8.7 24.4l16.1-2.3L32 7.5z';

export const normalizeRatingStars = (earnedStars: number) =>
  Number.isFinite(earnedStars)
    ? Math.max(0, Math.min(3, Math.floor(earnedStars)))
    : 0;

function RatingStarBase({
  earned,
  glow = false,
  size = 24,
  style,
}: RatingStarProps) {
  const palette = earned
    ? RATING_STAR_COLORS.earned
    : RATING_STAR_COLORS.inactive;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.star,
        { height: size, width: size },
        earned && glow ? styles.glow : null,
        style,
      ]}
    >
      <Svg height={size} viewBox="0 0 64 64" width={size}>
        <Path
          d={RATING_STAR_PATH}
          fill={palette.fill}
          stroke={palette.outline}
          strokeLinejoin="round"
          strokeWidth={5}
        />
        <Path
          d="M22.5 25.2 28 16l2.4 5.1-3.2 6.5z"
          fill={palette.shine}
          opacity={earned ? 0.95 : 0.42}
        />
      </Svg>
    </View>
  );
}

export const RatingStar = memo(RatingStarBase);

export function StarRating({
  earnedStars,
  gap = 2,
  glowWhenPerfect = false,
  inactiveSize,
  size = 22,
  style,
}: StarRatingProps) {
  const safeEarnedStars = normalizeRatingStars(earnedStars);

  return (
    <View
      accessibilityLabel={msg('{param1} de 3 estrelas', {
        param1: String(safeEarnedStars),
      })}
      accessible
      style={[styles.row, { gap }, style]}
    >
      {Array.from({ length: 3 }).map((_, index) => {
        const earned = index < safeEarnedStars;
        return (
          <RatingStar
            earned={earned}
            glow={earned && glowWhenPerfect && safeEarnedStars === 3}
            key={`rating-star-${index}`}
            size={earned ? size : (inactiveSize ?? size)}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  glow: {
    elevation: 2,
    shadowColor: colors.gold,
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.42,
    shadowRadius: 5,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  star: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
