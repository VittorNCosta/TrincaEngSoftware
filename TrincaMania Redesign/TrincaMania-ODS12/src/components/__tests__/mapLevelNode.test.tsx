import { fireEvent, render } from '@testing-library/react-native';
import { ImageBackground, StyleSheet } from 'react-native';
import { Path } from 'react-native-svg';

import { MapLevelNode } from '../MapLevelNode';
import { LEVELS } from '../../data/levels';

/**
 * O nó do mapa é a única porta para uma partida — e até agora ele não dizia
 * nada a quem usa leitor de tela: número da fase, estrelas e cadeado são
 * desenho, e desenho não é anunciado. Quem navega por TalkBack ouvia dez
 * "botão" iguais em fila.
 *
 * Este arquivo cobra as duas coisas que tornam o mapa navegável por teste e por
 * leitor de tela: um id estável por fase e um rótulo que diz em que estado ela
 * está. As duas somem calado quando alguém reescreve o componente — some o
 * rótulo e nada quebra na tela, só a acessibilidade.
 */

// Pela id, não pela posição: o rótulo esperado ("Fase 3") faz parte da
// asserção, e um `LEVELS[2]` calaria se a ordem mudasse.
const level = LEVELS.find((candidate) => candidate.id === 'w1-003')!;

const renderizar = (props: Partial<Parameters<typeof MapLevelNode>[0]> = {}) =>
  render(
    <MapLevelNode
      completed={false}
      current={false}
      level={level}
      locked={false}
      selected={false}
      stars={0}
      onPress={() => {}}
      {...props}
    />,
  );

const starFills = (screen: ReturnType<typeof render>, id: string) =>
  [0, 1, 2].map(
    (index) =>
      screen.getByTestId(`map-level-star-${id}-${index}`).findAllByType(Path)[0]
        .props.fill,
  );

describe('nó de fase no mapa', () => {
  it('anuncia a fase bloqueada como bloqueada, e se declara desabilitada', () => {
    const { getByTestId } = renderizar({ locked: true });
    const no = getByTestId(`map-level-${level.id}`);

    expect(no.props.accessibilityLabel).toBe('Fase 3, bloqueada');
    expect(no.props.accessibilityState.disabled).toBe(true);
  });

  it('anuncia a fase atual como a jogável agora', () => {
    const { getByTestId } = renderizar({ current: true });

    expect(getByTestId(`map-level-${level.id}`).props.accessibilityLabel).toBe(
      'Fase 3, jogar agora',
    );
  });

  it('anuncia quantas estrelas a fase concluída rendeu', () => {
    const { getByTestId } = renderizar({ completed: true, stars: 2 });

    expect(getByTestId(`map-level-${level.id}`).props.accessibilityLabel).toBe(
      'Fase 3, concluída com 2 de 3 estrelas',
    );
  });

  it('usa a base sem estrelas embutidas na fase concluída', () => {
    const screen = renderizar({ completed: true, stars: 1 });

    expect(screen.UNSAFE_getByType(ImageBackground).props.source).toEqual(
      require('../../../assets/ui/visuais/level_complete_base.png'),
    );
  });

  it('entrega o id da fase ao toque, que é o que abre a partida', () => {
    const aoTocar = jest.fn();
    const { getByTestId } = renderizar({ current: true, onPress: aoTocar });

    fireEvent.press(getByTestId(`map-level-${level.id}`));

    expect(aoTocar).toHaveBeenCalledWith(level.id);
  });

  it.each(
    [6, 7, 10].flatMap((phase) => [1, 2, 3].map((score) => ({ phase, score }))),
  )(
    'separa o número $phase da pontuação de $score estrelas',
    ({ phase, score }) => {
      const completedLevel = LEVELS.find(
        (candidate) => candidate.id === `w1-${String(phase).padStart(3, '0')}`,
      )!;
      const screen = renderizar({
        completed: true,
        level: completedLevel,
        stars: score,
      });
      const id = completedLevel.id;
      const frame = StyleSheet.flatten(
        screen.getByTestId(`map-level-frame-${id}`).props.style,
      );
      const artwork = StyleSheet.flatten(
        screen.UNSAFE_getByType(ImageBackground).props.style,
      );
      const plate = StyleSheet.flatten(
        screen.getByTestId(`map-level-number-${id}`).props.style,
      );
      const rating = StyleSheet.flatten(
        screen.getByTestId(`map-level-rating-${id}`).props.style,
      );
      const marks = [0, 1, 2].map((index) =>
        StyleSheet.flatten(
          screen.getByTestId(`map-level-star-${id}-${index}`).props.style,
        ),
      );
      const ratingHeight = Math.max(...marks.map((mark) => mark.height));
      const ratingTop = frame.height - rating.bottom - ratingHeight;
      const plateBottom = artwork.height - plate.bottom;

      expect(screen.getByText(String(phase))).toBeTruthy();
      expect(screen.getAllByTestId(`map-level-rating-${id}`)).toHaveLength(1);
      expect(
        screen.getAllByTestId(new RegExp(`^map-level-star-${id}-`)),
      ).toHaveLength(3);
      expect(starFills(screen, id)).toEqual(
        [0, 1, 2].map((index) => (index < score ? '#FFD23F' : '#D8E3FF')),
      );

      // Inclui a inclinação e a ampliação das estrelas: a fileira inteira deve
      // caber no marcador, com espaço livre abaixo da plaquinha do número.
      for (const mark of marks) {
        const transforms = mark.transform ?? [];
        const translateY =
          transforms.find(
            (value: { translateY?: number }) => value.translateY !== undefined,
          )?.translateY ?? 0;
        const scale =
          transforms.find(
            (value: { scale?: number }) => value.scale !== undefined,
          )?.scale ?? 1;
        const rotation =
          transforms.find(
            (value: { rotate?: string }) => value.rotate !== undefined,
          )?.rotate ?? '0deg';
        const radians = (Number.parseFloat(rotation) * Math.PI) / 180;
        const halfHeight =
          ((Math.abs(Math.cos(radians)) * mark.height +
            Math.abs(Math.sin(radians)) * mark.width) *
            scale) /
          2;
        const center = ratingTop + ratingHeight / 2 + translateY;

        expect(center - halfHeight).toBeGreaterThan(plateBottom);
        expect(center + halfHeight).toBeLessThanOrEqual(frame.height);
      }
    },
  );

  it.each([
    { locked: true, current: false },
    { locked: false, current: true },
  ])('preserva os estados sem pontuação: %o', (state) => {
    const screen = renderizar({ ...state, stars: 3 });

    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.queryByTestId(`map-level-rating-${level.id}`)).toBeNull();
    expect(screen.queryByText('Jogar') !== null).toBe(state.current);
    expect(screen.UNSAFE_getByType(ImageBackground).props.source).toEqual(
      state.locked
        ? require('../../../assets/ui/visuais/level_locked.png')
        : require('../../../assets/ui/visuais/level_current.png'),
    );
    expect(
      screen.getByTestId(`map-level-${level.id}`).props.accessibilityState
        .disabled,
    ).toBe(state.locked);
  });

  it('atualiza a pontuação ao receber progresso novo e ao remontar o marcador', () => {
    const screen = renderizar({ completed: true, stars: 1 });
    screen.rerender(
      <MapLevelNode
        completed
        current={false}
        level={level}
        locked={false}
        selected
        stars={2}
        onPress={() => {}}
      />,
    );
    expect(starFills(screen, level.id)).toEqual([
      '#FFD23F',
      '#FFD23F',
      '#D8E3FF',
    ]);
    screen.unmount();

    const remounted = renderizar({ completed: true, stars: 2 });
    expect(starFills(remounted, level.id)).toEqual([
      '#FFD23F',
      '#FFD23F',
      '#D8E3FF',
    ]);
  });
});
