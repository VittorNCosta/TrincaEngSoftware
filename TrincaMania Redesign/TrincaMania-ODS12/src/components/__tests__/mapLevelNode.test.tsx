import { fireEvent, render } from '@testing-library/react-native';

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

  it('entrega o id da fase ao toque, que é o que abre a partida', () => {
    const aoTocar = jest.fn();
    const { getByTestId } = renderizar({ current: true, onPress: aoTocar });

    fireEvent.press(getByTestId(`map-level-${level.id}`));

    expect(aoTocar).toHaveBeenCalledWith(level.id);
  });
});
