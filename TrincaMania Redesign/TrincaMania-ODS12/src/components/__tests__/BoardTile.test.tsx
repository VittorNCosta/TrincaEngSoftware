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

    expect(getByLabelText('Peça Resíduo de Plástico')).toBeTruthy();
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

    expect(getByLabelText('Peça Resíduo de Plástico, bloqueada')).toBeTruthy();
  });
});

describe('identificação educativa acessível', () => {
  it('diferencia os cinco materiais mesmo no símbolo de reciclagem', () => {
    const materials = [
      'plastico',
      'papel',
      'vidro',
      'metal',
      'organico',
    ] as const;
    const labels = ['Plástico', 'Papel', 'Vidro', 'Metal', 'Orgânico'];
    const { getByLabelText } = render(
      <>
        {materials.map((kind) => (
          <BoardTile
            key={kind}
            tile={{ ...tile, kind, role: 'simbolo', emoji: '♻', id: kind }}
            blocked={false}
            boardOriginX={0}
            boardOriginY={0}
            disabled={false}
            highlighted={false}
            onPress={() => {}}
          />
        ))}
      </>,
    );
    labels.forEach((label) =>
      expect(getByLabelText(`Peça Reciclagem de ${label}`)).toBeTruthy(),
    );
  });
  it('não revela o material de uma peça misteriosa oculta', () => {
    const { getByLabelText, queryByLabelText } = render(
      <BoardTile
        tile={{ ...tile, mystery: true }}
        blocked={false}
        boardOriginX={0}
        boardOriginY={0}
        disabled={false}
        highlighted={false}
        onPress={() => {}}
      />,
    );
    expect(getByLabelText('Peça misteriosa')).toBeTruthy();
    expect(queryByLabelText(/Plástico/)).toBeNull();
  });
});
