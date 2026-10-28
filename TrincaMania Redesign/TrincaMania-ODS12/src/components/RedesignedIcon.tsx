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
import geometry from '../data/redesignedIconGeometry.json';

type GeometryNode = {
  tag: string;
  attrs: Record<string, string>;
  children: GeometryNode[];
};
type Family = keyof typeof geometry;

// Cada instância recebe seus próprios gradientes, inclusive no DOM web.
function draw(
  node: GeometryNode,
  prefix: string,
  key: number,
): React.ReactElement {
  const attrs = Object.fromEntries(
    Object.entries(node.attrs).map(([name, value]) => [
      name,
      name === 'id'
        ? `${prefix}-${value}`
        : value.replace(/url\(#([^)]+)\)/g, `url(#${prefix}-$1)`),
    ]),
  );
  const children = node.children.map((child, index) =>
    draw(child, prefix, index),
  );
  switch (node.tag) {
    case 'defs':
      return (
        <Defs key={key} {...attrs}>
          {children}
        </Defs>
      );
    case 'g':
      return (
        <G key={key} {...attrs}>
          {children}
        </G>
      );
    case 'linearGradient':
      return (
        <LinearGradient key={key} {...attrs}>
          {children}
        </LinearGradient>
      );
    case 'stop':
      return <Stop key={key} {...attrs} />;
    case 'path':
      return <Path key={key} {...attrs} />;
    case 'circle':
      return <Circle key={key} {...attrs} />;
    case 'ellipse':
      return <Ellipse key={key} {...attrs} />;
    case 'rect':
      return <Rect key={key} {...attrs} />;
    default:
      return <G key={key} />;
  }
}

/** Geometria vetorial do ZIP aprovado, sem aliases PNG em execução. */
export function RedesignedIcon({
  family,
  name,
  size,
  muted = false,
  fill,
  outline,
}: {
  family: Family;
  name: string;
  size: number;
  muted?: boolean;
  fill?: string;
  outline?: string;
}) {
  const prefix = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const artwork = (geometry[family] as Record<string, GeometryNode>)[name];
  if (!artwork) return null;
  // fill/outline preservam a personalização pública do poder estrela.
  function customize(node: GeometryNode): GeometryNode {
    return {
      ...node,
      attrs: Object.fromEntries(
        Object.entries(node.attrs).map(([key, value]) => [
          key,
          (key === 'fill' || key === 'stroke') && value === '#173C31' && outline
            ? outline
            : key === 'fill' && value === 'url(#uiGold)' && fill
              ? fill
              : value,
        ]),
      ),
      children: node.children.map(customize),
    };
  }
  const root = fill || outline ? customize(artwork) : artwork;
  return (
    <Svg
      height={size}
      width={size}
      viewBox={artwork.attrs.viewBox}
      opacity={muted ? 0.65 : 1}
    >
      {root.children.map((child, index) => draw(child, prefix, index))}
    </Svg>
  );
}
