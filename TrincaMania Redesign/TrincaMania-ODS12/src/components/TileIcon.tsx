import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Polygon, Rect } from 'react-native-svg';

import { CardRole } from '../domain/recycling/value-objects/CardRole';
import { getMaterial } from '../domain/recycling/value-objects/MaterialType';
import { TileKind } from '../types/game';

/**
 * Arte da peça na versão ODS 12.
 *
 * O sprite sheet de frutas do jogo original não serve mais: a peça agora
 * carrega duas informações que o jogador precisa ler de relance para decidir a
 * jogada — o MATERIAL (cor da lixeira, CONAMA 275/2001) e o PAPEL no ciclo
 * (resíduo → lixeira → reciclagem). A cor identifica o material em todos os
 * papéis; o desenho identifica o papel.
 */
type TileIconProps = {
  fallbackEmoji: string;
  kind: TileKind;
  role: CardRole;
  dimmed?: boolean;
  highlighted?: boolean;
  size?: number;
};

type ArtworkProps = {
  color: string;
  colorDark: string;
  colorLight: string;
  size: number;
};

/** Lixeira da coleta seletiva, pintada com a cor oficial do material. */
function BinArtwork({ color, colorDark, colorLight, size }: ArtworkProps) {
  const artSize = size * 0.92;

  return (
    <View style={{ height: artSize, width: artSize }}>
      <Svg height={artSize} viewBox="0 0 72 72" width={artSize}>
        <Ellipse cx={36} cy={62} fill="rgba(38, 24, 8, 0.18)" rx={19} ry={4} />
        <Path
          d="M20 24h32l-3.4 33.2c-.2 2.1-2 3.8-4.2 3.8H27.6c-2.2 0-4-1.7-4.2-3.8z"
          fill={color}
          stroke={colorDark}
          strokeLinejoin="round"
          strokeWidth={3.2}
        />
        <Path d="M24.6 28.5h7.2l-2.4 28h-2z" fill={colorLight} opacity={0.55} />
        <Path d="M44.4 28.5h3.2l-2.6 28h-3.2z" fill={colorDark} opacity={0.35} />
        <Rect
          fill={colorLight}
          height={9}
          rx={4.5}
          stroke={colorDark}
          strokeWidth={3.2}
          width={44}
          x={14}
          y={15}
        />
        <Rect fill={colorDark} height={5} rx={2.5} width={14} x={29} y={8} />
        <Polygon
          fill="#FFFFFF"
          opacity={0.92}
          points="36,34 41.5,44 30.5,44"
          stroke={colorDark}
          strokeLinejoin="round"
          strokeWidth={1.4}
        />
      </Svg>
    </View>
  );
}

const RECYCLE_VERTICES: { rotation: number; x: number; y: number }[] = [
  { rotation: 60, x: 36, y: 16 },
  { rotation: 180, x: 53.3, y: 46 },
  { rotation: -60, x: 18.7, y: 46 },
];

/** Símbolo de reciclagem: as três setas em ciclo, na cor do material. */
function RecycleSymbolArtwork({ color, colorDark, colorLight, size }: ArtworkProps) {
  const artSize = size * 0.92;

  return (
    <View style={{ height: artSize, width: artSize }}>
      <Svg height={artSize} viewBox="0 0 72 72" width={artSize}>
        <Ellipse cx={36} cy={62} fill="rgba(38, 24, 8, 0.18)" rx={17} ry={3.6} />
        <Circle cx={36} cy={37} fill={colorLight} opacity={0.28} r={25} />
        <Path
          d="M36 16 53.3 46 18.7 46Z"
          fill="none"
          stroke={colorDark}
          strokeLinejoin="round"
          strokeWidth={10}
        />
        <Path
          d="M36 16 53.3 46 18.7 46Z"
          fill="none"
          stroke={color}
          strokeLinejoin="round"
          strokeWidth={6}
        />
        {RECYCLE_VERTICES.map((vertex) => (
          <G
            key={`${vertex.x}-${vertex.y}`}
            transform={`translate(${vertex.x}, ${vertex.y}) rotate(${vertex.rotation})`}
          >
            <Polygon
              fill={color}
              points="1,-7.5 12,0 1,7.5"
              stroke={colorDark}
              strokeLinejoin="round"
              strokeWidth={2.2}
            />
          </G>
        ))}
      </Svg>
    </View>
  );
}

/**
 * Resíduo: o objeto descartado. O emoji vem da carta (garrafa PET, jornal…), e
 * a moldura carrega a cor do material para o jogador conseguir parear sem
 * precisar saber de cor a que lixeira aquele objeto pertence.
 */
function ResidueArtwork({
  color,
  colorDark,
  colorLight,
  emoji,
  size,
}: ArtworkProps & { emoji: string }) {
  return (
    <>
      <View
        pointerEvents="none"
        style={[styles.iconShadow, { bottom: size * 0.07, width: size * 0.6 }]}
      />
      <View
        style={[
          styles.residuePlate,
          {
            backgroundColor: colorLight,
            borderColor: colorDark,
            borderRadius: size * 0.3,
            borderWidth: Math.max(2, size * 0.06),
            height: size * 0.82,
            width: size * 0.82,
          },
        ]}
      >
        <View
          pointerEvents="none"
          style={[
            styles.residueInnerRing,
            { backgroundColor: color, borderRadius: size * 0.24, opacity: 0.32 },
          ]}
        />
        <Text
          adjustsFontSizeToFit
          numberOfLines={1}
          style={[styles.residueEmoji, { fontSize: size * 0.5, lineHeight: size * 0.6 }]}
        >
          {emoji}
        </Text>
      </View>
      <View
        pointerEvents="none"
        style={[styles.iconShine, { height: size * 0.14, width: size * 0.3 }]}
      />
    </>
  );
}

function TileIconBase({
  fallbackEmoji,
  kind,
  role,
  dimmed = false,
  highlighted = false,
  size = 42,
}: TileIconProps) {
  const material = getMaterial(kind);
  const artworkProps: ArtworkProps = {
    color: material.binColor,
    colorDark: material.binColorDark,
    colorLight: material.binColorLight,
    size,
  };

  return (
    <View
      style={[
        styles.root,
        { borderRadius: size * 0.24, height: size, width: size },
        dimmed ? styles.dimmed : null,
        highlighted ? styles.highlighted : null,
      ]}
    >
      {role === 'residuo' ? (
        <ResidueArtwork {...artworkProps} emoji={fallbackEmoji} />
      ) : role === 'lixeira' ? (
        <BinArtwork {...artworkProps} />
      ) : (
        <RecycleSymbolArtwork {...artworkProps} />
      )}
    </View>
  );
}

export const TileIcon = memo(TileIconBase);

const styles = StyleSheet.create({
  dimmed: {
    opacity: 0.62,
  },
  highlighted: {
    shadowColor: '#FFD35A',
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.88,
    shadowRadius: 8,
  },
  iconShadow: {
    alignSelf: 'center',
    backgroundColor: 'rgba(116, 69, 13, 0.24)',
    borderRadius: 999,
    height: 5,
    position: 'absolute',
  },
  iconShine: {
    backgroundColor: 'rgba(255, 255, 255, 0.34)',
    borderRadius: 999,
    left: '18%',
    position: 'absolute',
    top: '9%',
    transform: [{ rotate: '-16deg' }],
  },
  residueEmoji: {
    textAlign: 'center',
    textShadowColor: 'rgba(40, 22, 6, 0.32)',
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 2,
  },
  residueInnerRing: {
    bottom: '10%',
    left: '10%',
    position: 'absolute',
    right: '10%',
    top: '10%',
  },
  residuePlate: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  root: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    overflow: 'visible',
  },
});
