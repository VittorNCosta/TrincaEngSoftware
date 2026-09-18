import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import type { StyleProp, ViewStyle } from 'react-native';

type Props = {
  kind: 'rest' | 'shop' | 'guardian' | 'portal';
  style?: StyleProp<ViewStyle>;
};

/** Vector artwork shares a 320-unit canvas; labels belong to the parent control. */
export function RecyclingMarkerArt({ kind, style }: Props) {
  return (
    <Svg accessible={false} viewBox="0 0 320 320" style={style}>
      {kind === 'rest' || kind === 'shop' ? (
        <G stroke="#23483A" strokeWidth={9} strokeLinejoin="round">
          <Path d="M35 83H66L85 225H254L283 103H72" fill="#E8EFE4" />
          <Rect x={96} y={117} width={46} height={93} rx={7} fill="#1768AF" />
          <Rect x={151} y={117} width={46} height={93} rx={7} fill="#D8493F" />
          <Rect x={206} y={117} width={46} height={93} rx={7} fill="#E9BF36" />
          <Circle cx={111} cy={255} r={22} fill="#23483A" />
          <Circle cx={234} cy={255} r={22} fill="#23483A" />
          {kind === 'shop' ? (
            <Path d="M72 95L97 45H251L277 95Z" fill="#54A267" />
          ) : null}
        </G>
      ) : (
        <G>
          {kind === 'guardian' ? (
            <Path
              d="M160 25L267 67V162Q262 238 160 296Q58 238 53 162V67Z"
              fill="#E6F2DF"
              stroke="#326C43"
              strokeWidth={10}
            />
          ) : null}
          <G
            fill="none"
            stroke="#25864B"
            strokeWidth={20}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <Path d="M102 103Q158 58 214 107L237 134M233 89L237 134L191 128" />
            <Path d="M238 166Q238 232 175 247H139M169 219L139 247L175 269" />
            <Path d="M111 232Q50 207 73 142L87 113M49 135L87 113L107 153" />
          </G>
        </G>
      )}
    </Svg>
  );
}
