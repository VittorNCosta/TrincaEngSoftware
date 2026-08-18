import { render } from '@testing-library/react-native';

import { GameBoard } from '../GameBoard';
import { Tile } from '../../types/game';

const makeTile = (overrides: Partial<Tile>): Tile => ({
  cardId: 'plastico-residuo-1',
  emoji: '🧴',
  id: 'board-tile',
  kind: 'plastico',
  role: 'residuo',
  x: 0,
  y: 0,
  z: 0,
  ...overrides,
});

describe('GameBoard', () => {
  it('renderiza uma peça acessível por tile, sem sobreposição, sem lançar exceção', () => {
    // Espaçadas por mais que TILE_SIZE (52px) em x para nenhuma ficar
    // bloqueada por sobreposição — o teste é sobre o board renderizar todas
    // as peças, não sobre a regra de bloqueio em si.
    const tiles: Tile[] = [
      makeTile({ id: 'board-tile-1', x: 0, y: 0, z: 0 }),
      makeTile({
        id: 'board-tile-2',
        x: 80,
        y: 0,
        z: 0,
        kind: 'papel',
        role: 'lixeira',
        emoji: '📦',
      }),
      makeTile({
        id: 'board-tile-3',
        x: 160,
        y: 0,
        z: 0,
        kind: 'vidro',
        role: 'simbolo',
        emoji: '♻️',
      }),
    ];

    const { getAllByRole } = render(
      <GameBoard disabled={false} tiles={tiles} onTilePress={() => {}} />,
    );

    expect(getAllByRole('button')).toHaveLength(tiles.length);
  });
});
