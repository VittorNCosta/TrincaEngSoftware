import { memo, useContext } from 'react';
import { WorldArtContext } from './WorldArtContext';
import { getResidueVisual } from '../data/residueVisualAssets';
import { Image, StyleSheet, Text, View } from 'react-native';
import {
  CollectionBinArtwork,
  RecyclingSymbolArtwork,
} from './RecyclingArtwork';

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
  cardId?: string;
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

/**
 * Resíduo: o objeto descartado. O emoji vem da carta (garrafa PET, jornal…), e
 * a moldura carrega a cor do material para o jogador conseguir parear sem
 * precisar saber de cor a que lixeira aquele objeto pertence.
 */
function ResidueArtwork({
  colorDark,
  colorLight,
  emoji,
  image,
  size,
}: ArtworkProps & {
  emoji: string;
  image?: import('react-native').ImageSourcePropType;
}) {
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
            backgroundColor: '#FFFCF0',
            borderColor: colorDark,
            borderRadius: size * 0.3,
            borderWidth: Math.max(1.5, size * 0.045),
            height: size * 0.9,
            width: size * 0.9,
          },
        ]}
      >
        <View
          pointerEvents="none"
          style={[
            styles.residueInnerRing,
            {
              backgroundColor: colorLight,
              borderRadius: size * 0.24,
              opacity: 0.2,
            },
          ]}
        />
        {image ? (
          <Image
            accessible={false}
            source={image}
            resizeMode="contain"
            style={{ height: size * 0.8, width: size * 0.8 }}
          />
        ) : (
          <Text
            adjustsFontSizeToFit
            numberOfLines={1}
            style={[
              styles.residueEmoji,
              { fontSize: size * 0.5, lineHeight: size * 0.6 },
            ]}
          >
            {emoji}
          </Text>
        )}
      </View>
      <View
        pointerEvents="none"
        style={[styles.iconShine, { height: size * 0.14, width: size * 0.3 }]}
      />
    </>
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
  const residueVisual = getResidueVisual(cardId, worldId);
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
        <ResidueArtwork
          {...artworkProps}
          emoji={fallbackEmoji}
          image={residueVisual?.image}
        />
      ) : role === 'lixeira' ? (
        <CollectionBinArtwork {...artworkProps} organic={kind === 'organico'} />
      ) : (
        <RecyclingSymbolArtwork
          {...artworkProps}
          organic={kind === 'organico'}
        />
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
