import { memo, useContext } from 'react';
import { WorldArtContext } from './WorldArtContext';
import { GameplayTileContext } from './TileAppearanceContext';
import { getResidueVisual } from '../data/residueVisualAssets';
import { Image, StyleSheet, Text, View } from 'react-native';
import { RECYCLING_ASSETS } from '../data/recyclingVisualAssets';
import {
  getMaterialTilePalette,
  getMaterialTileInk,
} from '../styles/materialTilePalette';

import { CardRole } from '../domain/recycling/value-objects/CardRole';
import { getMaterial } from '../domain/recycling/value-objects/MaterialType';
import { TileKind } from '../types/game';
import { tilePalette } from '../styles/tilePalette';

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
  cardId?: string;
  fallbackEmoji: string;
  kind: TileKind;
  role: CardRole;
  dimmed?: boolean;
  highlighted?: boolean;
  size?: number;
};

/** A arte mantém a aparência do resíduo; a moldura identifica o material. */
function ResidueArtwork({
  emoji,
  image,
  size,
}: {
  size: number;
  emoji: string;
  image?: import('react-native').ImageSourcePropType;
}) {
  return image ? (
    <Image
      accessible={false}
      source={image}
      resizeMode="contain"
      style={{ height: size * 0.94, width: size * 0.94 }}
    />
  ) : (
    <Text
      adjustsFontSizeToFit
      numberOfLines={1}
      style={[styles.residueEmoji, { fontSize: size * 0.76, lineHeight: size }]}
    >
      {emoji}
    </Text>
  );
}

function TileIconBase({
  cardId,
  fallbackEmoji,
  kind,
  role,
  dimmed = false,
  highlighted = false,
  size = 42,
}: TileIconProps) {
  const worldId = useContext(WorldArtContext);
  const duringGame = useContext(GameplayTileContext);
  const residueVisual = getResidueVisual(cardId, worldId);
  const material = getMaterial(kind);
  const showMaterialLabel = !duringGame && size >= 30;
  const labelHeight = showMaterialLabel ? size * 0.22 : 0;
  const artworkSize = size - labelHeight;
  const label =
    kind === 'plastico'
      ? 'PLÁST.'
      : kind === 'organico'
        ? 'ORG.'
        : material.label.toLocaleUpperCase('pt-BR');
  const palette = getMaterialTilePalette(kind, duringGame);
  const materialInk = getMaterialTileInk(kind);

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: palette.surface,
          borderRadius: size * 0.2,
          height: size,
          width: size,
        },
        dimmed ? styles.dimmed : null,
        highlighted ? styles.highlighted : null,
      ]}
    >
      <View style={[styles.artwork, { height: artworkSize, width: size }]}>
        {role === 'residuo' ? (
          <ResidueArtwork
            size={artworkSize}
            emoji={fallbackEmoji}
            image={residueVisual?.image}
          />
        ) : (
          <Image
            accessible={false}
            source={RECYCLING_ASSETS[kind][role]}
            resizeMode="contain"
            style={{ height: artworkSize * 0.94, width: artworkSize * 0.94 }}
          />
        )}
      </View>
      {showMaterialLabel ? (
        <View
          style={[
            styles.materialBand,
            { backgroundColor: palette.material, height: labelHeight },
          ]}
        >
          <Text
            accessible={false}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
            numberOfLines={1}
            style={[
              styles.materialLabel,
              {
                color: materialInk,
                fontSize: Math.max(6, size * 0.18),
                lineHeight: labelHeight,
              },
            ]}
          >
            {label}
          </Text>
        </View>
      ) : null}
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            borderColor: palette.border,
            borderRadius: size * 0.2,
            borderWidth: size >= 30 ? 2 : 1.5,
          },
        ]}
      />
    </View>
  );
}

export const TileIcon = memo(TileIconBase);

const styles = StyleSheet.create({
  dimmed: {
    opacity: 0.62,
  },
  highlighted: {
    shadowColor: tilePalette.border,
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.88,
    shadowRadius: 8,
  },
  artwork: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  materialBand: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  materialLabel: {
    fontWeight: '900',
    includeFontPadding: false,
    paddingHorizontal: 2,
    textAlign: 'center',
  },
  residueEmoji: {
    textAlign: 'center',
    textShadowColor: 'rgba(40, 22, 6, 0.32)',
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 2,
  },
  root: {
    alignItems: 'center',
    backgroundColor: tilePalette.iconFace,
    overflow: 'hidden',
  },
});
