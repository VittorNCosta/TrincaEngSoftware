import { useId } from 'react';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from './svgPrimitives';
import geometry from '../data/recyclingIconGeometry.json';

type Props = {
  color: string;
  colorDark: string;
  colorLight: string;
  size: number;
  organic?: boolean;
};

const INK = '#183E35';
const PAPER = '#FFFCF0';

function RecyclingGlyph({ color }: { color: string }) {
  return (
    <G
      fill="none"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={5.5}
    >
      {geometry.recyclingArrows.map((d) => (
        <Path key={d} d={d} />
      ))}
    </G>
  );
}

function CompostGlyph({ color }: { color: string }) {
  return (
    <G stroke={color} strokeLinecap="round" strokeLinejoin="round">
      <Path d={geometry.sproutLeft} fill={color} strokeWidth={2} />
      <Path d={geometry.sproutRight} fill={color} strokeWidth={2} />
      <Path d={geometry.sproutStem} fill="none" strokeWidth={4.5} />
      <Path d="M24 58h24" fill="none" opacity={0.55} strokeWidth={3.5} />
    </G>
  );
}

/** The same silhouettes also supply the site's SVGs, including the compost mark. */
export function CollectionBinArtwork({
  color,
  colorDark,
  colorLight,
  organic = false,
  size,
}: Props) {
  const gradient = `collection-bin-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const artSize = size * 0.98;

  return (
    <Svg height={artSize} viewBox={geometry.viewBox} width={artSize}>
      <Defs>
        <LinearGradient id={gradient} x1="0%" x2="100%" y1="0%" y2="100%">
          <Stop offset="0%" stopColor={colorLight} />
          <Stop offset="45%" stopColor={color} />
          <Stop offset="100%" stopColor={colorDark} />
        </LinearGradient>
      </Defs>
      <Ellipse cx={36} cy={67} fill={INK} opacity={0.15} rx={23} ry={3.5} />
      <Circle cx={24} cy={62} fill={INK} r={4.5} />
      <Circle cx={48} cy={62} fill={INK} r={4.5} />
      <Circle cx={24} cy={62} fill="#B6CCC1" r={1.6} />
      <Circle cx={48} cy={62} fill="#B6CCC1" r={1.6} />
      <Path
        d={geometry.binBody}
        fill={`url(#${gradient})`}
        stroke={INK}
        strokeLinejoin="round"
        strokeWidth={2.4}
      />
      <Path d={geometry.binShine} fill="#FFFFFF" opacity={0.3} />
      <Path d={geometry.binSide} fill={colorDark} opacity={0.55} />
      <Rect
        fill={PAPER}
        height={24}
        rx={5}
        stroke={colorDark}
        strokeWidth={1.3}
        width={24}
        x={24}
        y={31}
      />
      <G transform="translate(23, 29) scale(0.36)">
        {organic ? (
          <CompostGlyph color={INK} />
        ) : (
          <RecyclingGlyph color={INK} />
        )}
      </G>
      <Rect
        fill={colorDark}
        height={7}
        rx={3}
        stroke={INK}
        strokeWidth={2}
        width={22}
        x={25}
        y={10}
      />
      <Path
        d="M30 14h12"
        stroke={PAPER}
        strokeLinecap="round"
        strokeWidth={2}
      />
      <Rect
        fill={color}
        height={10}
        rx={4}
        stroke={INK}
        strokeWidth={2.4}
        width={46}
        x={13}
        y={17}
      />
      <Path
        d="M19 20h34"
        opacity={0.7}
        stroke={colorLight}
        strokeLinecap="round"
        strokeWidth={2.5}
      />
      <Rect fill={INK} height={3.5} rx={1.75} width={24} x={24} y={23} />
    </Svg>
  );
}

export function RecyclingSymbolArtwork({
  color,
  colorDark,
  colorLight,
  organic = false,
  size,
}: Props) {
  const artSize = size * 0.96;

  return (
    <Svg height={artSize} viewBox={geometry.viewBox} width={artSize}>
      <Ellipse cx={36} cy={66} fill={INK} opacity={0.14} rx={24} ry={3.5} />
      <Circle cx={36} cy={36} fill={colorDark} r={30} />
      <Circle
        cx={36}
        cy={34}
        fill={PAPER}
        r={29}
        stroke={color}
        strokeWidth={2}
      />
      <Circle
        cx={36}
        cy={34}
        fill="none"
        opacity={0.45}
        r={25}
        stroke={colorLight}
        strokeWidth={1.5}
      />
      <G transform="translate(5, 3) scale(0.86)">
        {organic ? (
          <CompostGlyph color={colorDark} />
        ) : (
          <RecyclingGlyph color={colorDark} />
        )}
      </G>
    </Svg>
  );
}
