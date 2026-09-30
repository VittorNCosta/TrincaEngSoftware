import { act, fireEvent, render } from '@testing-library/react-native';
import { Image, ScrollView, StyleSheet } from 'react-native';

import { WorldPortalMapMarker } from '../WorldPortalMapMarker';
import { LEVELS } from '../../data/levels';
import { LevelSelectScreen } from '../../screens/LevelSelectScreen';
import { createInitialLivesState } from '../../storage/livesStorage';
import {
  createInitialProgress,
  normalizeProgress,
} from '../../storage/progressStorage';

// O mock padrão de Image omite o tamanho intrínseco do PNG. Executamos a
// implementação JavaScript de Image no Android, com os metadados do PNG
// local (320 × 320), para
// detectar uma imagem que cresce além do disco em vez de se redimensionar.
jest.mock('react-native/Libraries/Image/Image', () =>
  jest.requireActual('react-native/Libraries/Image/Image.android'),
);
jest.mock('react-native/Libraries/Image/resolveAssetSource', () => ({
  __esModule: true,
  default: (source: unknown) =>
    source
      ? { uri: 'asset:/marker.png', width: 320, height: 320, scale: 1 }
      : null,
}));

type RenderedNode = {
  type: unknown;
  props: Record<string, unknown>;
  findAll: (predicate: (node: RenderedNode) => boolean) => RenderedNode[];
};

test.each([false, true])(
  'o PNG central respeita o disco do portal liberado, selecionado=%s',
  (selected) => {
    const onPress = jest.fn();
    const screen = render(
      <WorldPortalMapMarker
        locked={false}
        selected={selected}
        worldLabel="Mundo 2"
        onPress={onPress}
      />,
    );
    const image = screen.UNSAFE_getByType(Image);
    expect(image.props.source).toEqual(
      require('../../../assets/ui/visuais/world_transition.png'),
    );
    const nativeImage = image.find(
      (node: RenderedNode) => node.type === 'RCTImageView',
    );
    expect(StyleSheet.flatten(nativeImage.props.style)).toMatchObject({
      width: '100%',
      height: '100%',
    });
    expect(nativeImage.props.resizeMode).toBe('contain');
    expect(nativeImage.props.accessible).toBe(false);
    expect(screen.getByText('Mundo 2')).toBeTruthy();
    fireEvent.press(
      screen.getByRole('button', { name: 'Portal para Mundo 2' }),
    );
    expect(onPress).toHaveBeenCalledTimes(1);
  },
);

test.each([false, true])(
  'o portal bloqueado preserva cadeado e etiqueta, selecionado=%s',
  (selected) => {
    const screen = render(
      <WorldPortalMapMarker
        locked
        selected={selected}
        worldLabel="Mundo 2"
        onPress={jest.fn()}
      />,
    );
    expect(screen.UNSAFE_queryByType(Image)).toBeNull();
    expect(
      screen.UNSAFE_root.findAll(
        (node: RenderedNode) =>
          node.props.name === 'lock' && node.props.size === 23,
      ).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText('Bloqueado')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Portal para Mundo 2, bloqueado' })
        .props.accessibilityState,
    ).toEqual({ disabled: true, selected });
  },
);

const mapProps = (unlocked: boolean) => ({
  activeTrayCapacity: 7,
  livesState: createInitialLivesState(),
  progress: normalizeProgress({
    ...createInitialProgress(),
    // Estados isolados de apresentação; nunca são gravados no save real.
    completedLevelIds: unlocked
      ? LEVELS.filter((level) => level.worldId === 1).map((level) => level.id)
      : [],
    levelStars: unlocked
      ? Object.fromEntries(
          LEVELS.filter((level) => level.worldId === 1).map((level) => [
            level.id,
            1,
          ]),
        )
      : {},
  }),
  initialWorldId: 1 as const,
  timeUntilNextLifeMs: 0,
  onOpenChapters: jest.fn(),
  onOpenProfile: jest.fn(),
  onOpenShop: jest.fn(),
  onOpenSettings: jest.fn(),
  onOpenWorldChest: jest.fn(),
  onOpenRestCheckpoint: jest.fn(),
  onResetProgress: jest.fn(),
  onSelectLevel: jest.fn(),
});

const layoutMap = (screen: ReturnType<typeof render>) => {
  const scroll = screen.UNSAFE_getByType(ScrollView);
  fireEvent(scroll, 'layout', {
    nativeEvent: { layout: { x: 0, y: 0, width: 360, height: 600 } },
  });
  fireEvent(scroll, 'contentSizeChange', 360, 3160);
};

const closePanel = (screen: ReturnType<typeof render>) => {
  const close = screen.UNSAFE_root.findAll(
    (node: RenderedNode) =>
      typeof node.props.onPress === 'function' &&
      node.findAll((child) => child.props.name === 'close').length > 0,
  ).at(-1);
  if (!close) throw new Error('Botão de fechar painel ausente');
  fireEvent.press(close);
  act(() => jest.advanceTimersByTime(200));
};

test.each([false, true])(
  'o mapa atual preserva painel, rolagem e retorno, mundo liberado=%s',
  (unlocked) => {
    jest.useFakeTimers();
    try {
      const props = mapProps(unlocked);
      const original = JSON.stringify(props.progress);
      const screen = render(<LevelSelectScreen {...props} />);
      layoutMap(screen);
      act(() => jest.advanceTimersByTime(250));
      const portalLabel = unlocked
        ? 'Portal para Mundo 2'
        : 'Portal para Mundo 2, bloqueado';
      const portal = () => screen.getByRole('button', { name: portalLabel });
      const expectArtwork = () => {
        expect(portal().props.accessibilityState.disabled).toBe(!unlocked);
        const images = portal().findAllByType(Image);
        expect(images).toHaveLength(unlocked ? 1 : 0);
        if (unlocked) {
          const nativeImage = images[0].find(
            (node: RenderedNode) => node.type === 'RCTImageView',
          );
          expect(StyleSheet.flatten(nativeImage.props.style)).toMatchObject({
            width: '100%',
            height: '100%',
          });
        }
      };
      expectArtwork();

      const openPanel = () => {
        fireEvent.press(
          screen.getByRole('button', {
            name: unlocked
              ? 'Portal para Mundo 2'
              : 'Portal para Mundo 2, bloqueado',
          }),
        );
        expect(portal().props.accessibilityState.selected).toBe(true);
        expectArtwork();
      };
      openPanel();
      // A animação pertence ao painel e ao mapa, não à arte central.
      for (const elapsed of [60, 500]) {
        act(() => jest.advanceTimersByTime(elapsed));
        expectArtwork();
      }
      if (unlocked)
        expect(
          screen.getByRole('button', { name: 'Abrir mundo' }),
        ).toBeTruthy();
      else {
        expect(screen.getByText('Mundo bloqueado')).toBeTruthy();
        expect(
          screen
            .getAllByRole('button', { name: 'Bloqueado' })
            .every((button) => button.props.accessibilityState?.disabled),
        ).toBe(true);
        expect(
          screen.queryByRole('button', { name: 'Abrir mundo' }),
        ).toBeNull();
      }

      fireEvent.scroll(screen.UNSAFE_getByType(ScrollView), {
        nativeEvent: {
          contentOffset: { x: 0, y: 240 },
          contentSize: { width: 360, height: 3160 },
          layoutMeasurement: { width: 360, height: 600 },
        },
      });
      expectArtwork();
      closePanel(screen);
      expect(portal().props.accessibilityState.selected).toBe(false);
      screen.rerender(<LevelSelectScreen {...props} isActive={false} />);
      screen.rerender(<LevelSelectScreen {...props} isActive />);
      act(() => jest.advanceTimersByTime(250));
      expectArtwork();

      openPanel();
      if (unlocked) {
        fireEvent.press(screen.getByRole('button', { name: 'Abrir mundo' }));
        expect(screen.getByTestId('map-level-w2-001')).toBeTruthy();
        expect(
          screen.queryByRole('button', { name: 'Abrir mundo' }),
        ).toBeNull();
      } else closePanel(screen);
      expect(props.onSelectLevel).not.toHaveBeenCalled();
      expect(JSON.stringify(props.progress)).toBe(original);
      screen.unmount();

      const returned = render(<LevelSelectScreen {...props} />);
      layoutMap(returned);
      const returnedPortal = returned.getByRole('button', {
        name: portalLabel,
      });
      expect(returnedPortal.props.accessibilityState.disabled).toBe(!unlocked);
      expect(returnedPortal.props.accessibilityState.selected).toBe(false);
      expect(returnedPortal.findAllByType(Image)).toHaveLength(
        unlocked ? 1 : 0,
      );
      returned.unmount();
    } finally {
      jest.useRealTimers();
    }
  },
);
