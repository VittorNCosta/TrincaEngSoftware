import { render, within } from '@testing-library/react-native';
import { Image, StyleSheet, View } from 'react-native';
import { GameplayTileContext } from '../TileAppearanceContext';
import { TileIcon } from '../TileIcon';
import { BoardTile } from '../BoardTile';
import { RedesignedIcon } from '../RedesignedIcon';
import geometry from '../../data/redesignedIconGeometry.json';
import { RECYCLING_ASSETS } from '../../data/recyclingVisualAssets';
import {
  MATERIAL_TILE_PALETTE,
  getMaterialTilePalette,
} from '../../styles/materialTilePalette';
import { MaterialType } from '../../domain/recycling/value-objects/MaterialType';

const materials = Object.keys(MATERIAL_TILE_PALETTE) as MaterialType[];

test.each(materials)(
  'os três papéis de %s compartilham a superfície e os PNGs corretos',
  (kind) => {
    for (const role of ['residuo', 'lixeira', 'simbolo'] as const) {
      const screen = render(
        <TileIcon fallbackEmoji="♻" kind={kind} role={role} size={40} />,
      );
      const root = screen.toJSON();
      if (!root || Array.isArray(root)) throw new Error('Raiz da peça ausente');
      expect(StyleSheet.flatten(root.props.style).backgroundColor).toBe(
        MATERIAL_TILE_PALETTE[kind].surface,
      );
      if (role !== 'residuo')
        expect(screen.UNSAFE_getByType(Image).props.source).toBe(
          RECYCLING_ASSETS[kind][role],
        );
      screen.unmount();
    }
  },
);

test.each(materials)(
  'a peça misteriosa de %s não revela o material por arte, texto ou superfície',
  (kind) => {
    const screen = render(
      <BoardTile
        tile={{
          id: kind,
          cardId: `${kind}-simbolo-1`,
          kind,
          role: 'simbolo',
          emoji: '♻',
          mystery: true,
          x: 0,
          y: 0,
          z: 0,
        }}
        blocked={false}
        boardOriginX={0}
        boardOriginY={0}
        disabled={false}
        highlighted={false}
        onPress={() => {}}
      />,
    );
    expect(screen.getByLabelText('Peça misteriosa')).toBeTruthy();
    expect(screen.UNSAFE_queryAllByType(Image)).toHaveLength(0);
    expect(screen.toJSON()).not.toHaveProperty(
      'props.style.backgroundColor',
      MATERIAL_TILE_PALETTE[kind].surface,
    );
    const json = JSON.stringify(screen.toJSON());
    expect(json).toContain('#4B2E89');
    expect(json).not.toContain(MATERIAL_TILE_PALETTE[kind].surface);
  },
);

test('todos os vetores são aceitos pelo renderizador nativo sem avisos de gradiente', () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    for (const family of Object.keys(geometry) as (keyof typeof geometry)[]) {
      for (const name of Object.keys(geometry[family])) {
        const screen = render(
          <RedesignedIcon family={family} name={name} size={24} />,
        );
        expect(screen.toJSON()).not.toBeNull();
        screen.unmount();
      }
    }
    expect(warn).not.toHaveBeenCalled();
  } finally {
    warn.mockRestore();
  }
});

const materialLabels = {
  plastico: 'PLÁST.',
  papel: 'PAPEL',
  vidro: 'VIDRO',
  metal: 'METAL',
  organico: 'ORG.',
};

test.each(materials)(
  'simplifica %s somente na partida e preserva a imagem e os demais consumidores',
  (kind) => {
    const icon = (
      <TileIcon fallbackEmoji="♻" kind={kind} role="lixeira" size={40} />
    );
    const screen = render(
      <>
        <View testID="outside-game">{icon}</View>
        <GameplayTileContext.Provider value>
          <View testID="inside-game">{icon}</View>
        </GameplayTileContext.Provider>
      </>,
    );
    const outside = within(screen.getByTestId('outside-game'));
    const inside = within(screen.getByTestId('inside-game'));
    expect(outside.getByText(materialLabels[kind])).toBeTruthy();
    expect(inside.queryByText(materialLabels[kind])).toBeNull();
    expect(inside.UNSAFE_getByType(Image).props.source).toBe(
      outside.UNSAFE_getByType(Image).props.source,
    );
    expect(inside.UNSAFE_getByType(Image).props.style.height).toBeGreaterThan(
      outside.UNSAFE_getByType(Image).props.style.height,
    );
    expect(getMaterialTilePalette(kind)).toBe(MATERIAL_TILE_PALETTE[kind]);
  },
);
