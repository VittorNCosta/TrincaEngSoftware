import { render } from '@testing-library/react-native';

import { BoardTile } from '../BoardTile';
import { Tile } from '../../types/game';

const tile: Tile = {
  cardId: 'plastico-residuo-1',
  emoji: '🧴',
  id: 'board-tile-1',
  kind: 'plastico',
  role: 'residuo',
  x: 0,
  y: 0,
  z: 0,
};

describe('BoardTile', () => {
  it('renderiza sem lançar exceção e expõe o rótulo de acessibilidade da peça', () => {
    const { getByLabelText } = render(
      <BoardTile
        tile={tile}
        blocked={false}
        boardOriginX={0}
        boardOriginY={0}
        disabled={false}
        highlighted={false}
        onPress={() => {}}
      />,
    );

    expect(getByLabelText(`Peça ${tile.emoji}`)).toBeTruthy();
  });

  it('marca o rótulo de acessibilidade como bloqueada quando blocked=true', () => {
    const { getByLabelText } = render(
      <BoardTile
        tile={tile}
        blocked
        boardOriginX={0}
        boardOriginY={0}
        disabled={false}
        highlighted={false}
        onPress={() => {}}
      />,
    );

    expect(getByLabelText(`Peça ${tile.emoji}, bloqueada`)).toBeTruthy();
  });
});
