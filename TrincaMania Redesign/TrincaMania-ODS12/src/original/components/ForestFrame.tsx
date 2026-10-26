import { View, StyleSheet } from 'react-native';
import { memo, useId } from 'react';
import Svg, {
  Defs,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from '../../components/svgPrimitives';

import { forestPolish } from '../styles/theme';

/** Decorative skin only: never changes measurement, hit testing or slot geometry. */
export const ForestFrame = memo(function ForestFrame({
  energized = false,
}: {
  energized?: boolean;
}) {
  const gradientId = `wood${useId().replace(/:/g, '')}`;
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={StyleSheet.absoluteFillObject}
    >
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 360 100"
        preserveAspectRatio="none"
      >
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={forestPolish.woodLight} />
            <Stop offset="0.18" stopColor={forestPolish.wood} />
            <Stop offset="0.65" stopColor={forestPolish.woodDark} />
            <Stop offset="1" stopColor={forestPolish.wood} />
          </LinearGradient>
        </Defs>
        <Rect
          x="2"
          y="3"
          width="356"
          height="95"
          rx="17"
          fill={`url(#${gradientId})`}
          stroke={forestPolish.bark}
          strokeWidth="3"
        />
        <Path
          d="M18 7 Q100 3 180 8 T342 7 M9 86 Q105 95 184 89 T351 88"
          fill="none"
          stroke={forestPolish.gold}
          strokeOpacity="0.6"
          strokeWidth="2"
        />
        <Path
          d="M18 28 Q75 23 128 29 M242 30 Q298 24 342 29 M12 67 Q71 61 102 67 M260 72 Q298 66 348 70"
          fill="none"
          stroke="#1F130B"
          strokeOpacity="0.3"
          strokeWidth="1.5"
        />
        <Path
          d="M4 33 Q16 18 47 9 M311 94 Q335 79 357 63"
          fill="none"
          stroke={energized ? forestPolish.sap : forestPolish.moss}
          strokeWidth="3"
        />
        <Path
          d="M18 20 Q9 4 28 6 Q36 17 18 20 M32 13 Q35 0 51 4 Q48 16 32 13 M337 79 Q321 66 331 61 Q346 63 337 79 M344 73 Q345 55 358 57 Q362 72 344 73"
          fill={forestPolish.leaf}
          stroke={forestPolish.moss}
          strokeWidth="1"
        />
      </Svg>
    </View>
  );
});
